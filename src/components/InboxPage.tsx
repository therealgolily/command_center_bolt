import { useState, useEffect } from 'react';
import { supabase, Task } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { QuickCaptureForm } from './QuickCaptureForm';
import { TaskCard } from './TaskCard';
import { EditTaskModal } from './EditTaskModal';
import { ConfirmDialog } from './ConfirmDialog';

export function InboxPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'inbox')
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

  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-[#f8fafc] pt-8 pb-4 z-10">
        <h2 className="text-2xl font-bold text-[#1e293b] mb-4">inbox</h2>
        <QuickCaptureForm onSubmit={handleAddTask} />
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-[#64748b]">
            no tasks yet. add one above to get started.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={setEditingTask}
              onDelete={setDeletingTask}
            />
          ))
        )}
      </div>

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
