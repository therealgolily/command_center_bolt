import { supabase, Task } from './supabase';

export function parseRecurrenceRule(rule: string): { type: string; value?: string } {
  const parts = rule.split('-');
  return {
    type: parts[0],
    value: parts[1],
  };
}

export function formatRecurrenceRule(rule: string): string {
  const { type, value } = parseRecurrenceRule(rule);

  switch (type) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return `Every ${value || 'week'}`;
    case 'monthly':
      if (value === 'last') return 'Last day of each month';
      return `${value}${getOrdinalSuffix(parseInt(value || '1'))} of each month`;
    default:
      return rule;
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function shouldCreateInstance(
  parentTask: Task,
  lastInstanceDate: Date | null,
  today: Date
): boolean {
  if (!parentTask.recurrence_rule) return false;

  const { type, value } = parseRecurrenceRule(parentTask.recurrence_rule);

  switch (type) {
    case 'daily':
      if (!lastInstanceDate) return true;
      const daysSinceLastInstance = Math.floor(
        (today.getTime() - lastInstanceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastInstance >= 1;

    case 'weekly':
      const targetDay = value?.toLowerCase();
      const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      if (todayDay !== targetDay) return false;

      if (!lastInstanceDate) return true;
      const weeksSinceLastInstance = Math.floor(
        (today.getTime() - lastInstanceDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      return weeksSinceLastInstance >= 1;

    case 'monthly':
      let targetDayOfMonth: number;

      if (value === 'last') {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        targetDayOfMonth = lastDayOfMonth;
      } else {
        targetDayOfMonth = parseInt(value || '1');
      }

      if (today.getDate() !== targetDayOfMonth) return false;

      if (!lastInstanceDate) return true;
      const monthsSinceLastInstance =
        (today.getFullYear() - lastInstanceDate.getFullYear()) * 12 +
        (today.getMonth() - lastInstanceDate.getMonth());
      return monthsSinceLastInstance >= 1;

    default:
      return false;
  }
}

function calculateDueDate(parentTask: Task, today: Date): Date {
  if (!parentTask.recurrence_rule) return today;

  const { type, value } = parseRecurrenceRule(parentTask.recurrence_rule);
  const dueDate = new Date(today);

  switch (type) {
    case 'daily':
      return dueDate;

    case 'weekly':
      return dueDate;

    case 'monthly':
      if (value === 'last') {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        dueDate.setDate(lastDayOfMonth);
      } else {
        dueDate.setDate(parseInt(value || '1'));
      }
      return dueDate;

    default:
      return dueDate;
  }
}

function adjustTimeBlockForDate(timeBlock: string, targetDate: Date): string {
  const originalDate = new Date(timeBlock);
  const adjusted = new Date(targetDate);
  adjusted.setHours(originalDate.getHours());
  adjusted.setMinutes(originalDate.getMinutes());
  adjusted.setSeconds(0);
  adjusted.setMilliseconds(0);
  return adjusted.toISOString();
}

export async function runRecurringTaskEngine(userId: string): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  try {
    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .eq('is_paused', false);

    if (fetchError) {
      errors.push(`Failed to fetch recurring tasks: ${fetchError.message}`);
      return { created, errors };
    }

    if (!recurringTasks || recurringTasks.length === 0) {
      return { created, errors };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const parentTask of recurringTasks) {
      try {
        const { data: instances } = await supabase
          .from('tasks')
          .select('created_at, due_date')
          .eq('parent_task_id', parentTask.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastInstance = instances && instances.length > 0 ? instances[0] : null;
        const lastInstanceDate = lastInstance
          ? new Date(lastInstance.due_date || lastInstance.created_at)
          : null;

        if (lastInstanceDate) {
          lastInstanceDate.setHours(0, 0, 0, 0);
        }

        if (shouldCreateInstance(parentTask, lastInstanceDate, today)) {
          const todayString = today.toISOString().split('T')[0];

          const { data: existingInstance } = await supabase
            .from('tasks')
            .select('id')
            .eq('parent_task_id', parentTask.id)
            .eq('due_date', todayString)
            .maybeSingle();

          if (existingInstance) {
            continue;
          }

          const dueDate = calculateDueDate(parentTask, today);

          const newInstance: Partial<Task> = {
            user_id: userId,
            title: parentTask.title,
            description: parentTask.description,
            category: parentTask.category,
            priority: parentTask.priority,
            client_id: parentTask.client_id,
            status: parentTask.bucket_assignment || 'today',
            parent_task_id: parentTask.id,
            is_recurring: false,
            due_date: dueDate.toISOString().split('T')[0],
            calendar_sync_status: 'none',
          };

          if (parentTask.time_block_start && parentTask.time_block_end) {
            newInstance.time_block_start = adjustTimeBlockForDate(parentTask.time_block_start, dueDate);
            newInstance.time_block_end = adjustTimeBlockForDate(parentTask.time_block_end, dueDate);
          }

          const { error: insertError } = await supabase
            .from('tasks')
            .insert([newInstance]);

          if (insertError) {
            errors.push(`Failed to create instance for "${parentTask.title}": ${insertError.message}`);
          } else {
            created++;
          }
        }
      } catch (err) {
        errors.push(`Error processing "${parentTask.title}": ${err}`);
      }
    }
  } catch (err) {
    errors.push(`Engine error: ${err}`);
  }

  return { created, errors };
}
