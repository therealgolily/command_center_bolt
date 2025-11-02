import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { supabase, Task } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { QuickCaptureForm } from './QuickCaptureForm';
import { TaskCard } from './TaskCard';
import { EditTaskModal } from './EditTaskModal';
import { ConfirmDialog } from './ConfirmDialog';

export function TodayPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [tomorrowExpanded, setTomorrowExpanded] = useState(() => {
    const saved = localStorage.getItem('tomorrowExpanded');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    loadTasks();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tomorrowExpanded', JSON.stringify(tomorrowExpanded));
  }, [tomorrowExpanded]);

  const loadTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'done')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    if (!user) return;

    const newTask = {
      user_id: user.id,
      title: taskData.title,
      description: taskData.description || null,
      category: taskData.category || null,
      priority: taskData.priority,
      status: 'inbox',
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    setTasks([{ ...newTask, id: 'temp-' + Date.now() } as Task, ...tasks]);

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      console.error('error creating task:', error);
      setTasks(tasks);
    } else if (data) {
      setTasks((prev) => prev.map((t) => (t.id.startsWith('temp-') ? data : t)));
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('error completing task:', error);
      loadTasks();
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('error updating task:', error);
      loadTasks();
    }
  };

  const handleDeleteTask = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setDeletingTask(null);

    const { error } = await supabase.from('tasks').delete().eq('id', task.id);

    if (error) {
      console.error('error deleting task:', error);
      loadTasks();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  const urgentTasks = tasks
    .filter((t) => t.priority === 'urgent' && ['today', 'tomorrow', 'this_week'].includes(t.status))
    .sort((a, b) => {
      const statusOrder = { today: 0, tomorrow: 1, this_week: 2 };
      return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    });

  const todayTasks = tasks.filter((t) => t.status === 'today');
  const tomorrowTasks = tasks.filter((t) => t.status === 'tomorrow');
  const inboxCount = tasks.filter((t) => t.status === 'inbox').length;

  const hasAnyContent = urgentTasks.length > 0 || todayTasks.length > 0 || tomorrowTasks.length > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="sticky top-0 bg-[#f8fafc] pt-8 pb-4 z-10">
        <h2 className="text-2xl font-bold text-[#1e293b] mb-4">today</h2>
        <QuickCaptureForm onSubmit={handleAddTask} />
      </div>

      {!hasAnyContent ? (
        <div className="text-center py-12">
          <p className="text-[#64748b] mb-2">looks like you're all caught up. check your inbox or start planning.</p>
          {inboxCount > 0 && (
            <p className="text-[#3b82f6] font-medium">you have {inboxCount} items in your inbox</p>
          )}
        </div>
      ) : (
        <>
          {urgentTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-1 bg-[#ef4444] rounded-full"></div>
                <h3 className="font-semibold text-[#ef4444] uppercase text-sm tracking-wide">
                  urgent
                </h3>
                <span className="text-xs bg-red-100 text-[#ef4444] px-2 py-1 rounded-full font-medium">
                  {urgentTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {urgentTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 group">
                    <input
                      type="checkbox"
                      onChange={() => handleCompleteTask(task.id)}
                      className="mt-4 w-5 h-5 rounded border-2 border-[#ef4444] text-[#ef4444] focus:ring-2 focus:ring-[#ef4444] cursor-pointer"
                    />
                    <div className="flex-1">
                      <TaskCard
                        task={task}
                        onEdit={setEditingTask}
                        onDelete={setDeletingTask}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide">
                today
              </h3>
              <span className="text-xs bg-[#e2e8f0] text-[#64748b] px-2 py-1 rounded-full font-medium">
                {todayTasks.length}
              </span>
            </div>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-[#94a3b8] text-sm">
                nothing scheduled for today
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 group">
                    <input
                      type="checkbox"
                      onChange={() => handleCompleteTask(task.id)}
                      className="mt-4 w-5 h-5 rounded border-2 border-[#e2e8f0] text-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6] cursor-pointer"
                    />
                    <div className="flex-1">
                      <TaskCard
                        task={task}
                        onEdit={setEditingTask}
                        onDelete={setDeletingTask}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setTomorrowExpanded(!tomorrowExpanded)}
              className="flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity"
            >
              {tomorrowExpanded ? (
                <ChevronDown size={16} className="text-[#64748b]" />
              ) : (
                <ChevronRight size={16} className="text-[#64748b]" />
              )}
              <h3 className="font-semibold text-[#64748b] uppercase text-sm tracking-wide">
                tomorrow
              </h3>
              <span className="text-xs bg-[#e2e8f0] text-[#64748b] px-2 py-1 rounded-full font-medium">
                {tomorrowTasks.length}
              </span>
            </button>

            {tomorrowExpanded && (
              <>
                {tomorrowTasks.length === 0 ? (
                  <div className="text-center py-8 text-[#94a3b8] text-sm">
                    nothing scheduled for tomorrow
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tomorrowTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 group">
                        <input
                          type="checkbox"
                          onChange={() => handleCompleteTask(task.id)}
                          className="mt-4 w-5 h-5 rounded border-2 border-[#e2e8f0] text-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6] cursor-pointer"
                        />
                        <div className="flex-1">
                          <TaskCard
                            task={task}
                            onEdit={setEditingTask}
                            onDelete={setDeletingTask}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updates) => {
            handleUpdateTask(editingTask.id, updates);
            setEditingTask(null);
          }}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="delete task?"
          message={`are you sure you want to delete "${deletingTask.title}"? this cannot be undone.`}
          confirmText="delete"
          onConfirm={() => handleDeleteTask(deletingTask)}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
