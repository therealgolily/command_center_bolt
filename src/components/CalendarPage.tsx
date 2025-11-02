import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { supabase, Task, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TaskCard } from './TaskCard';
import { EditTaskModal } from './EditTaskModal';

type DayColumn = {
  date: Date;
  dateString: string;
  dayName: string;
  isToday: boolean;
  isPast: boolean;
  tasks: Task[];
};

export function CalendarPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [inboxCollapsed, setInboxCollapsed] = useState(false);
  const [creatingTaskForDate, setCreatingTaskForDate] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [tasksResult, clientsResult] = await Promise.all([
      supabase.from('tasks').select('*').order('due_date', { ascending: true }),
      supabase.from('clients').select('*').order('name', { ascending: true }),
    ]);

    if (!tasksResult.error && tasksResult.data) {
      setTasks(tasksResult.data);
    }
    if (!clientsResult.error && clientsResult.data) {
      setClients(clientsResult.data);
    }
    setLoading(false);
  };

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function formatWeekRange(weekStart: Date): string {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const year = weekEnd.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  function goToPreviousWeek() {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeekStart(newWeek);
  }

  function goToNextWeek() {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeekStart(newWeek);
  }

  function goToToday() {
    setCurrentWeekStart(getWeekStart(new Date()));
  }

  function getDayColumns(): DayColumn[] {
    const columns: DayColumn[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter((t) => {
        if (t.due_date === dateString) return true;
        if (!t.due_date && t.status === 'today' && dateString === today.toISOString().split('T')[0]) return true;
        return false;
      });

      dayTasks.sort((a, b) => {
        if (a.time_block_start && b.time_block_start) {
          return new Date(a.time_block_start).getTime() - new Date(b.time_block_start).getTime();
        }
        if (a.time_block_start) return -1;
        if (b.time_block_start) return 1;
        return 0;
      });

      columns.push({
        date,
        dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: dateString === today.toISOString().split('T')[0],
        isPast: date < today,
        tasks: dayTasks,
      });
    }

    return columns;
  }

  const inboxTasks = tasks.filter((t) => t.status === 'inbox');
  const dayColumns = getDayColumns();

  const handleDragStart = (event: any) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetDate = over.id as string;

    if (targetDate.startsWith('day-')) {
      const dateString = targetDate.replace('day-', '');
      const task = tasks.find((t) => t.id === taskId);

      if (!task) return;

      const targetDateObj = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (targetDateObj < today) {
        alert('Cannot schedule tasks on past dates');
        return;
      }

      let newStatus = task.status;
      const todayString = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      if (dateString === todayString) {
        newStatus = 'today';
      } else if (dateString === tomorrowString) {
        newStatus = 'tomorrow';
      } else {
        newStatus = 'this_week';
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, due_date: dateString, status: newStatus } : t
        )
      );

      const { error } = await supabase
        .from('tasks')
        .update({ due_date: dateString, status: newStatus })
        .eq('id', taskId);

      if (error) {
        console.error('error updating task:', error);
        loadData();
      }
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);

    if (error) {
      console.error('error updating task:', error);
      loadData();
    }
  };

  const handleDeleteTask = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      console.error('error deleting task:', error);
      loadData();
    }
  };

  const formatTimeBlock = (start: string, end: string) => {
    const startTime = new Date(start).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endTime = new Date(end).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${startTime} - ${endTime}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[#1e293b]">calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousWeek}
                className="p-1 text-[#64748b] hover:text-[#1e293b] hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-[#1e293b] min-w-[180px] text-center">
                {formatWeekRange(currentWeekStart)}
              </span>
              <button
                onClick={goToNextWeek}
                className="p-1 text-[#64748b] hover:text-[#1e293b] hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            today
          </button>
        </div>

        <div className="flex gap-4">
          {!inboxCollapsed && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 sticky top-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">
                    inbox
                  </h3>
                  <button
                    onClick={() => setInboxCollapsed(true)}
                    className="text-xs text-[#64748b] hover:text-[#1e293b]"
                  >
                    hide
                  </button>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {inboxTasks.length === 0 ? (
                    <p className="text-xs text-[#94a3b8] text-center py-4">no inbox tasks</p>
                  ) : (
                    inboxTasks.map((task) => (
                      <div
                        key={task.id}
                        id={task.id}
                        className="cursor-move"
                      >
                        <TaskCard
                          task={task}
                          onEdit={setEditingTask}
                          onDelete={handleDeleteTask}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {inboxCollapsed && (
            <button
              onClick={() => setInboxCollapsed(false)}
              className="w-8 flex-shrink-0 bg-white border border-[#e2e8f0] rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="writing-mode-vertical text-xs font-medium text-[#64748b] py-4">
                inbox
              </div>
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-7 gap-2">
              {dayColumns.map((day) => (
                <div
                  key={day.dateString}
                  id={`day-${day.dateString}`}
                  className={`bg-white rounded-lg border-2 p-3 min-h-[400px] ${
                    day.isToday
                      ? 'border-[#3b82f6] bg-blue-50/30'
                      : day.isPast
                      ? 'border-[#e2e8f0] opacity-60'
                      : 'border-[#e2e8f0]'
                  }`}
                >
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      {day.dayName}
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        day.isToday ? 'text-[#3b82f6]' : 'text-[#1e293b]'
                      }`}
                    >
                      {day.date.getDate()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {day.tasks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-[#94a3b8] mb-2">no tasks</p>
                        <button
                          onClick={() => setCreatingTaskForDate(day.dateString)}
                          className="text-xs text-[#3b82f6] hover:text-blue-600 flex items-center gap-1 mx-auto"
                        >
                          <Plus size={12} />
                          add task
                        </button>
                      </div>
                    ) : (
                      day.tasks.map((task) => (
                        <div key={task.id} className="text-xs">
                          <div
                            className={`p-2 rounded border ${
                              task.priority === 'urgent'
                                ? 'border-l-2 border-l-[#ef4444] bg-red-50/50'
                                : 'border-[#e2e8f0] bg-gray-50'
                            } hover:shadow-sm transition-shadow cursor-pointer`}
                            onClick={() => setEditingTask(task)}
                          >
                            <div className="font-medium text-[#1e293b] mb-1 truncate">
                              {task.title}
                            </div>
                            {task.time_block_start && task.time_block_end && (
                              <div className="text-[10px] text-[#3b82f6] font-medium">
                                {formatTimeBlock(task.time_block_start, task.time_block_end)}
                              </div>
                            )}
                            {task.client_id && (
                              <div className="text-[10px] text-[#64748b] mt-1">
                                {clients.find((c) => c.id === task.client_id)?.name}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {day.tasks.length > 0 && (
                    <button
                      onClick={() => setCreatingTaskForDate(day.dateString)}
                      className="text-xs text-[#94a3b8] hover:text-[#3b82f6] flex items-center gap-1 mt-2 w-full justify-center py-1 border-t border-[#e2e8f0]"
                    >
                      <Plus size={12} />
                      add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          clients={clients}
          onClose={() => setEditingTask(null)}
          onSave={(updates) => {
            handleUpdateTask(editingTask.id, updates);
            setEditingTask(null);
          }}
        />
      )}

      {creatingTaskForDate && (
        <EditTaskModal
          task={{
            id: '',
            user_id: user?.id || '',
            title: '',
            description: null,
            status: 'today',
            category: null,
            priority: 'normal',
            client_id: null,
            client_name: null,
            created_at: new Date().toISOString(),
            completed_at: null,
            time_block_start: null,
            time_block_end: null,
            google_calendar_event_id: null,
            calendar_sync_status: 'none',
            is_recurring: false,
            recurrence_rule: null,
            parent_task_id: null,
            is_paused: false,
            bucket_assignment: null,
            due_date: creatingTaskForDate,
          }}
          clients={clients}
          onClose={() => setCreatingTaskForDate(null)}
          onSave={async (taskData) => {
            if (!user) return;

            const newTask = {
              ...taskData,
              user_id: user.id,
              due_date: creatingTaskForDate,
              created_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('tasks').insert([newTask]);

            if (!error) {
              setCreatingTaskForDate(null);
              loadData();
            }
          }}
        />
      )}
    </DndContext>
  );
}
