import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { supabase, Task, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TaskCard } from './TaskCard';
import { TaskBadge } from './TaskBadge';
import { CompactTaskCard } from './CompactTaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { EditTaskModal } from './EditTaskModal';
import { QuickCaptureModal } from './QuickCaptureModal';
import { runRecurringTaskEngine } from '../lib/recurringEngine';

type DayColumn = {
  date: Date;
  dateString: string;
  dayName: string;
  isToday: boolean;
  isPast: boolean;
  tasks: Task[];
};

function DraggableInboxTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} onEdit={() => {}} onDelete={() => {}} />
    </div>
  );
}

function DraggableCalendarTask({
  task,
  clients,
  onTaskClick
}: {
  task: Task;
  clients: Client[];
  onTaskClick: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const client = clients.find((c) => c.id === task.client_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onTaskClick(task);
      }}
    >
      <TaskBadge task={task} client={client} onClick={() => {}} />
    </div>
  );
}

function DroppableInbox({
  tasks,
  isOver,
  onCollapse,
  onAddTask,
}: {
  tasks: Task[];
  isOver: boolean;
  onCollapse: () => void;
  onAddTask: () => void;
}) {
  const { setNodeRef } = useDroppable({
    id: 'inbox',
  });

  return (
    <div className="w-64 flex-shrink-0">
      <div
        ref={setNodeRef}
        className={`bg-white rounded-lg border-2 p-4 sticky top-4 transition-all ${
          isOver ? 'border-[#3b82f6] bg-blue-50 shadow-lg' : 'border-[#e2e8f0]'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">
            inbox
          </h3>
          <button
            onClick={onCollapse}
            className="text-xs text-[#64748b] hover:text-[#1e293b]"
          >
            hide
          </button>
        </div>

        <button
          onClick={onAddTask}
          className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#3b82f6] text-white font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
          new task
        </button>

        {isOver && (
          <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-center">
            <p className="text-xs font-medium text-[#3b82f6]">drop to unschedule</p>
          </div>
        )}
        <div className="space-y-2 max-h-[530px] overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-xs text-[#94a3b8] text-center py-4">no inbox tasks</p>
          ) : (
            tasks.map((task) => <DraggableInboxTask key={task.id} task={task} />)
          )}
        </div>
      </div>
    </div>
  );
}

function DroppableDayColumn({
  day,
  tasks,
  clients,
  isOver,
  onTaskClick,
  onAddTask,
}: {
  day: DayColumn;
  tasks: Task[];
  clients: Client[];
  isOver: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}) {
  const { setNodeRef } = useDroppable({
    id: `day-${day.dateString}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg border-2 p-3 min-h-[400px] transition-all ${
        day.isToday
          ? 'border-[#3b82f6] bg-blue-50/30'
          : day.isPast
          ? 'border-[#e2e8f0] opacity-60'
          : 'border-[#e2e8f0]'
      } ${isOver && !day.isPast ? 'border-[#3b82f6] bg-blue-50 shadow-lg' : ''}`}
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

      {isOver && !day.isPast && (
        <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-center">
          <p className="text-xs font-medium text-[#3b82f6]">drop here</p>
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#94a3b8] mb-2">no tasks</p>
            <button
              onClick={onAddTask}
              className="text-xs text-[#3b82f6] hover:text-blue-600 flex items-center gap-1 mx-auto"
            >
              <Plus size={12} />
              add task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableCalendarTask
              key={task.id}
              task={task}
              clients={clients}
              onTaskClick={onTaskClick}
            />
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <button
          onClick={onAddTask}
          className="text-xs text-[#94a3b8] hover:text-[#3b82f6] flex items-center gap-1 mt-2 w-full justify-center py-1 border-t border-[#e2e8f0]"
        >
          <Plus size={12} />
          add
        </button>
      )}
    </div>
  );
}

export function CalendarPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [inboxCollapsed, setInboxCollapsed] = useState(false);
  const [overId, setOverId] = useState<string | null>(null);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickCaptureForDate, setQuickCaptureForDate] = useState<string | null>(null);
  const [engineNotification, setEngineNotification] = useState<string | null>(null);

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

  useEffect(() => {
    if (user) {
      const runEngine = async () => {
        const lastRun = localStorage.getItem('last_engine_run');
        const today = new Date().toISOString().split('T')[0];

        if (!lastRun || lastRun !== today) {
          console.log('Running recurring task engine on Calendar page...');
          const result = await runRecurringTaskEngine(user.id);

          if (result.created > 0) {
            setEngineNotification(`Created ${result.created} recurring task instance${result.created !== 1 ? 's' : ''} for this week`);
            setTimeout(() => setEngineNotification(null), 5000);
            loadData();
          }

          if (result.errors.length > 0) {
            console.error('Recurring engine errors:', result.errors);
          }

          localStorage.setItem('last_engine_run', today);
        }
      };

      runEngine();
    }
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

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverId(null);

    if (!over) {
      console.log('no valid drop zone - task stays in original position');
      return;
    }

    const taskId = active.id as string;
    const targetId = over.id as string;

    try {
      if (targetId === 'inbox') {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, due_date: null, status: 'inbox' } : t
          )
        );

        const { error } = await supabase
          .from('tasks')
          .update({ due_date: null, status: 'inbox' })
          .eq('id', taskId);

        if (error) {
          console.error('error updating task:', error);
          loadData();
        }
      } else if (targetId.startsWith('day-')) {
      const dateString = targetId.replace('day-', '');
      const task = tasks.find((t) => t.id === taskId);

      if (!task) return;

      const targetDateObj = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (targetDateObj < today) {
        alert('cannot schedule tasks on past dates');
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
    } catch (error) {
      console.error('drop failed:', error);
      loadData();
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

  const handleQuickCapture = async (taskData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    client_id?: string;
  }) => {
    if (!user) return;

    let status = 'inbox';
    let due_date = null;

    if (quickCaptureForDate) {
      const targetDateObj = new Date(quickCaptureForDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      due_date = quickCaptureForDate;

      if (quickCaptureForDate === todayString) {
        status = 'today';
      } else if (quickCaptureForDate === tomorrowString) {
        status = 'tomorrow';
      } else {
        status = 'this_week';
      }
    }

    await supabase.from('tasks').insert([{
      user_id: user.id,
      title: taskData.title,
      description: taskData.description || null,
      category: taskData.category || null,
      priority: taskData.priority,
      status: status,
      due_date: due_date,
      client_id: taskData.client_id || null,
    }]);

    setIsQuickCaptureOpen(false);
    setQuickCaptureForDate(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
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

        {engineNotification && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 font-medium">{engineNotification}</p>
          </div>
        )}

        <div className="flex gap-4">
          {!inboxCollapsed && (
            <DroppableInbox
              tasks={inboxTasks}
              isOver={overId === 'inbox'}
              onCollapse={() => setInboxCollapsed(true)}
              onAddTask={() => {
                setQuickCaptureForDate(null);
                setIsQuickCaptureOpen(true);
              }}
            />
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
                <DroppableDayColumn
                  key={day.dateString}
                  day={day}
                  tasks={day.tasks}
                  clients={clients}
                  isOver={overId === `day-${day.dateString}`}
                  onTaskClick={setViewingTask}
                  onAddTask={() => {
                    setQuickCaptureForDate(day.dateString);
                    setIsQuickCaptureOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#e2e8f0]">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-[#1e293b]">today</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {tasks.filter((t) => {
                    const today = new Date().toISOString().split('T')[0];
                    return (t.status === 'today' || t.due_date === today) && t.status !== 'done';
                  }).length}
                </span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tasks.filter((t) => {
                  const today = new Date().toISOString().split('T')[0];
                  return (t.status === 'today' || t.due_date === today) && t.status !== 'done';
                }).length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#94a3b8]">
                    nothing scheduled for today
                  </div>
                ) : (
                  tasks
                    .filter((t) => {
                      const today = new Date().toISOString().split('T')[0];
                      return (t.status === 'today' || t.due_date === today) && t.status !== 'done';
                    })
                    .sort((a, b) => {
                      if (a.time_block_start && b.time_block_start) {
                        return new Date(a.time_block_start).getTime() - new Date(b.time_block_start).getTime();
                      }
                      if (a.time_block_start) return -1;
                      if (b.time_block_start) return 1;
                      return 0;
                    })
                    .map((task) => (
                      <CompactTaskCard
                        key={task.id}
                        task={task}
                        client={clients.find((c) => c.id === task.client_id)}
                        onComplete={() => handleUpdateTask(task.id, { status: 'done' })}
                        onClick={() => setViewingTask(task)}
                      />
                    ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-[#1e293b]">tomorrow</h3>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {tasks.filter((t) => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowString = tomorrow.toISOString().split('T')[0];
                    return (t.status === 'tomorrow' || t.due_date === tomorrowString) && t.status !== 'done';
                  }).length}
                </span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tasks.filter((t) => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowString = tomorrow.toISOString().split('T')[0];
                  return (t.status === 'tomorrow' || t.due_date === tomorrowString) && t.status !== 'done';
                }).length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#94a3b8]">
                    nothing scheduled for tomorrow
                  </div>
                ) : (
                  tasks
                    .filter((t) => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const tomorrowString = tomorrow.toISOString().split('T')[0];
                      return (t.status === 'tomorrow' || t.due_date === tomorrowString) && t.status !== 'done';
                    })
                    .sort((a, b) => {
                      if (a.time_block_start && b.time_block_start) {
                        return new Date(a.time_block_start).getTime() - new Date(b.time_block_start).getTime();
                      }
                      if (a.time_block_start) return -1;
                      if (b.time_block_start) return 1;
                      return 0;
                    })
                    .map((task) => (
                      <CompactTaskCard
                        key={task.id}
                        task={task}
                        client={clients.find((c) => c.id === task.client_id)}
                        onComplete={() => handleUpdateTask(task.id, { status: 'done' })}
                        onClick={() => setViewingTask(task)}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskBadge
              task={activeTask}
              client={clients.find((c) => c.id === activeTask.client_id)}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>

      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          client={clients.find((c) => c.id === viewingTask.client_id)}
          onClose={() => setViewingTask(null)}
          onEdit={() => {
            setEditingTask(viewingTask);
            setViewingTask(null);
          }}
          onDelete={() => {
            handleDeleteTask(viewingTask);
            setViewingTask(null);
          }}
          onComplete={() => {
            handleUpdateTask(viewingTask.id, { status: 'done' });
            setViewingTask(null);
          }}
        />
      )}

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

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => {
          setIsQuickCaptureOpen(false);
          setQuickCaptureForDate(null);
        }}
        onSubmit={handleQuickCapture}
      />
    </DndContext>
  );
}
