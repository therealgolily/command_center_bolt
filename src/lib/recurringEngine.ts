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

function getNextMonday(fromDate: Date): Date {
  const date = new Date(fromDate);
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : (8 - day) % 7;
  if (daysUntilMonday === 0 && day === 1) {
    return date;
  }
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

function getNextWeekday(fromDate: Date, targetDay: string): Date {
  const dayMap: { [key: string]: number } = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };

  const targetDayNum = dayMap[targetDay.toLowerCase()];
  const date = new Date(fromDate);
  const currentDay = date.getDay();

  if (currentDay === targetDayNum) {
    return date;
  }

  const daysUntilTarget = (targetDayNum - currentDay + 7) % 7;
  date.setDate(date.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
  return date;
}

function getNextMonthlyDate(fromDate: Date, dayOfMonth: string): Date {
  const date = new Date(fromDate);

  if (dayOfMonth === 'last') {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    if (date.getDate() <= lastDay.getDate() && date.getMonth() === lastDay.getMonth()) {
      lastDay.setFullYear(date.getFullYear());
      lastDay.setMonth(date.getMonth());
      return lastDay;
    } else {
      const nextMonthLast = new Date(date.getFullYear(), date.getMonth() + 2, 0);
      return nextMonthLast;
    }
  }

  const targetDay = parseInt(dayOfMonth);
  const currentDay = date.getDate();

  if (currentDay <= targetDay) {
    const targetDate = new Date(date.getFullYear(), date.getMonth(), targetDay);
    if (targetDate.getDate() === targetDay) {
      return targetDate;
    }
  }

  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, targetDay);
  if (nextMonth.getDate() === targetDay) {
    return nextMonth;
  }

  return new Date(date.getFullYear(), date.getMonth() + 2, 0);
}

function calculateNextDueDate(recurrenceRule: string, today: Date): Date {
  const { type, value } = parseRecurrenceRule(recurrenceRule);

  switch (type) {
    case 'daily':
      return new Date(today);

    case 'weekly':
      return getNextWeekday(today, value || 'monday');

    case 'monthly':
      return getNextMonthlyDate(today, value || '1');

    default:
      return new Date(today);
  }
}

function calculateStatusFromDueDate(dueDate: Date, today: Date): string {
  const dueDateOnly = new Date(dueDate);
  dueDateOnly.setHours(0, 0, 0, 0);

  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((dueDateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'today';
  } else if (diffInDays === 1) {
    return 'tomorrow';
  } else if (diffInDays >= 2 && diffInDays <= 7) {
    return 'this_week';
  } else if (diffInDays >= 8 && diffInDays <= 14) {
    return 'next_week';
  } else {
    return 'backburner';
  }
}

function shouldCreateInstance(
  parentTask: Task,
  lastInstanceDate: Date | null,
  nextDueDate: Date,
  today: Date
): boolean {
  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);

  const dueDateOnly = new Date(nextDueDate);
  dueDateOnly.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((dueDateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays > 14) {
    return false;
  }

  if (!lastInstanceDate) {
    return true;
  }

  const lastDateOnly = new Date(lastInstanceDate);
  lastDateOnly.setHours(0, 0, 0, 0);

  return dueDateOnly.getTime() > lastDateOnly.getTime();
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

const LAST_RUN_KEY = 'lastRecurringEngineRun';
const MIN_RUN_INTERVAL_MS = 60 * 60 * 1000;

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function runRecurringTaskEngine(userId: string): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  try {
    console.log("🔄 Starting recurring task engine...");

    const lastRun = localStorage.getItem(LAST_RUN_KEY);
    if (lastRun) {
      const lastRunTime = new Date(lastRun);
      const now = new Date();
      const msSinceLastRun = now.getTime() - lastRunTime.getTime();

      if (msSinceLastRun < MIN_RUN_INTERVAL_MS) {
        const minutesRemaining = Math.ceil((MIN_RUN_INTERVAL_MS - msSinceLastRun) / (1000 * 60));
        console.log(`⏭️ Engine ran ${Math.floor(msSinceLastRun / (1000 * 60))} minutes ago. Skipping (${minutesRemaining} min remaining)`);
        return { created: 0, errors: [] };
      }
    }

    localStorage.setItem(LAST_RUN_KEY, new Date().toISOString());

    console.log("✓ Rate limit check passed, proceeding...");

    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .eq('is_paused', false)
      .is('parent_task_id', null);

    if (fetchError) {
      errors.push(`Failed to fetch recurring tasks: ${fetchError.message}`);
      return { created, errors };
    }

    console.log(`Found ${recurringTasks?.length || 0} recurring tasks`);

    if (!recurringTasks || recurringTasks.length === 0) {
      return { created, errors };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const parentTask of recurringTasks) {
      try {
        if (!parentTask.recurrence_rule) {
          console.log(`Skipping "${parentTask.title}" - no recurrence rule`);
          continue;
        }

        console.log(`📋 Processing "${parentTask.title}" with rule: ${parentTask.recurrence_rule}`);

        const todayStr = formatDateOnly(today);

        const { data: todayInstances, error: todayCheckError } = await supabase
          .from('tasks')
          .select('id, created_at, due_date')
          .eq('parent_task_id', parentTask.id)
          .gte('created_at', `${todayStr}T00:00:00`);

        if (todayCheckError) {
          console.error(`❌ Error checking today's instances:`, todayCheckError);
          errors.push(`Failed to check today's instances for "${parentTask.title}": ${todayCheckError.message}`);
          continue;
        }

        if (todayInstances && todayInstances.length > 0) {
          console.log(`✓ Already created ${todayInstances.length} instance(s) today for "${parentTask.title}", skipping`);
          continue;
        }

        const { data: instances } = await supabase
          .from('tasks')
          .select('created_at, due_date')
          .eq('parent_task_id', parentTask.id)
          .order('due_date', { ascending: false })
          .limit(1);

        const lastInstance = instances && instances.length > 0 ? instances[0] : null;
        const lastInstanceDate = lastInstance && lastInstance.due_date
          ? new Date(lastInstance.due_date)
          : null;

        console.log(`📅 Last instance date: ${lastInstanceDate ? formatDateOnly(lastInstanceDate) : 'none'}`);

        const nextDueDate = calculateNextDueDate(parentTask.recurrence_rule, today);
        const dueDateString = formatDateOnly(nextDueDate);

        console.log(`📅 Next due date calculated: ${dueDateString}`);

        if (shouldCreateInstance(parentTask, lastInstanceDate, nextDueDate, today)) {
          console.log(`🔍 Checking for existing instance with due_date: ${dueDateString}`);

          const { data: existingInstances, error: checkError } = await supabase
            .from('tasks')
            .select('id, title, due_date, created_at')
            .eq('parent_task_id', parentTask.id)
            .eq('due_date', dueDateString);

          if (checkError) {
            console.error(`❌ Error checking existing instances:`, checkError);
            errors.push(`Failed to check existing instances for "${parentTask.title}": ${checkError.message}`);
            continue;
          }

          console.log(`🔍 Found ${existingInstances?.length || 0} existing instances for ${dueDateString}`);

          if (existingInstances && existingInstances.length > 0) {
            console.log(`✓ Instance already exists for ${dueDateString}, skipping`);
            continue;
          }

          const status = calculateStatusFromDueDate(nextDueDate, today);

          console.log(`✨ Creating instance with status: ${status}`);

          const newInstance: Partial<Task> = {
            user_id: userId,
            title: parentTask.title,
            description: parentTask.description,
            category: parentTask.category,
            priority: parentTask.priority,
            client_id: parentTask.client_id,
            status: status,
            parent_task_id: parentTask.id,
            is_recurring: false,
            due_date: dueDateString,
            calendar_sync_status: 'none',
          };

          if (parentTask.time_block_start && parentTask.time_block_end) {
            newInstance.time_block_start = adjustTimeBlockForDate(parentTask.time_block_start, nextDueDate);
            newInstance.time_block_end = adjustTimeBlockForDate(parentTask.time_block_end, nextDueDate);
          }

          const { error: insertError } = await supabase
            .from('tasks')
            .insert([newInstance]);

          if (insertError) {
            errors.push(`Failed to create instance for "${parentTask.title}": ${insertError.message}`);
            console.error('❌ Insert error:', insertError);
          } else {
            created++;
            console.log(`✅ Successfully created instance for "${parentTask.title}"`);
          }
        } else {
          console.log(`⏭️ Should not create instance yet`);
        }
      } catch (err) {
        errors.push(`Error processing "${parentTask.title}": ${err}`);
        console.error('Processing error:', err);
      }
    }
  } catch (err) {
    errors.push(`Engine error: ${err}`);
    console.error('Engine error:', err);
  }

  return { created, errors };
}

export async function cleanupDuplicateInstances(userId: string): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  try {
    console.log("🧹 Starting duplicate cleanup...");

    const { data: allInstances, error: fetchError } = await supabase
      .from('tasks')
      .select('id, parent_task_id, due_date, created_at')
      .eq('user_id', userId)
      .not('parent_task_id', 'is', null)
      .order('parent_task_id')
      .order('due_date')
      .order('created_at');

    if (fetchError) {
      errors.push(`Failed to fetch instances: ${fetchError.message}`);
      return { deleted, errors };
    }

    if (!allInstances || allInstances.length === 0) {
      console.log("No instances found");
      return { deleted, errors };
    }

    const groupedByParentAndDate: { [key: string]: typeof allInstances } = {};

    for (const instance of allInstances) {
      if (!instance.parent_task_id || !instance.due_date) continue;

      const key = `${instance.parent_task_id}|${instance.due_date}`;

      if (!groupedByParentAndDate[key]) {
        groupedByParentAndDate[key] = [];
      }

      groupedByParentAndDate[key].push(instance);
    }

    for (const [key, instances] of Object.entries(groupedByParentAndDate)) {
      if (instances.length > 1) {
        const [parentId, dueDate] = key.split('|');
        console.log(`🔍 Found ${instances.length} duplicates for parent ${parentId} on ${dueDate}`);

        instances.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const toKeep = instances[0];
        const toDelete = instances.slice(1);

        console.log(`  Keeping: ${toKeep.id} (created ${toKeep.created_at})`);

        for (const duplicate of toDelete) {
          console.log(`  Deleting: ${duplicate.id} (created ${duplicate.created_at})`);

          const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('id', duplicate.id);

          if (deleteError) {
            errors.push(`Failed to delete duplicate ${duplicate.id}: ${deleteError.message}`);
            console.error(`❌ Delete error:`, deleteError);
          } else {
            deleted++;
            console.log(`  ✅ Deleted duplicate ${duplicate.id}`);
          }
        }
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deleted} duplicates`);
  } catch (err) {
    errors.push(`Cleanup error: ${err}`);
    console.error('Cleanup error:', err);
  }

  return { deleted, errors };
}
