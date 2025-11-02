import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { supabase, Task, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DraggableTaskCard } from './DraggableTaskCard';
import { BucketColumn } from './BucketColumn';
import { EditTaskModal } from './EditTaskModal';
import { ConfirmDialog } from './ConfirmDialog';
import { RecurringTasksList } from './RecurringTasksList';
import { CreateRecurringTaskModal } from './CreateRecurringTaskModal';
import { QuickCaptureModal } from './QuickCaptureModal';
import { BUCKETS, BucketStatus } from '../lib/buckets';
import { TaskCard } from './TaskCard';
import { runRecurringTaskEngine } from '../lib/recurringEngine';

export function PlanningPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreatingRecurring, setIsCreatingRecurring] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [engineNotification, setEngineNotification] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadTasks();
    loadClients();
  }, [user]);

  useEffect(() => {
    if (user) {
      const runEngine = async () => {
        const lastRun = localStorage.getItem('last_engine_run');
        const today = new Date().toISOString().split('T')[0];

        if (!lastRun || lastRun !== today) {
          console.log('Running recurring task engine on Planning page...');
          const result = await runRecurringTaskEngine(user.id);

          if (result.created > 0) {
            setEngineNotification(`Created ${result.created} recurring task instance${result.created !== 1 ? 's' : ''} for this week`);
            setTimeout(() => setEngineNotification(null), 5000);
            loadTasks();
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

  useEffect(() => {
    if (user) {
      checkAndRunEngine();
    }
  }, [user]);

  const checkAndRunEngine = async () => {
    if (!user) return;

    const lastRun = localStorage.getItem('lastRecurringEngineRun');
    const today = new Date().toDateString();

    if (lastRun !== today) {
      await runRecurringTaskEngine(user.id);
      localStorage.setItem('lastRecurringEngineRun', today);
      loadTasks();
    }
  };

  const loadClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setClients(data);
    }
  };

  const loadTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const getTasksByStatus = (status: BucketStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as BucketStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('error updating task:', error);
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

  const handleQuickCapture = async (taskData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    client_id?: string;
  }) => {
    if (!user) return;

    await supabase.from('tasks').insert([{
      user_id: user.id,
      title: taskData.title,
      description: taskData.description || null,
      category: taskData.category || null,
      priority: taskData.priority,
      status: 'inbox',
      client_id: taskData.client_id || null,
    }]);

    setIsQuickCaptureOpen(false);
    loadTasks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  const inboxTasks = getTasksByStatus('inbox');
  const recurringTasks = tasks.filter((t) => t.is_recurring && !t.parent_task_id);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {engineNotification && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 font-medium">{engineNotification}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1e293b]">planning</h2>
          <button
            onClick={() => setIsCreatingRecurring(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            recurring task
          </button>
        </div>

        <RecurringTasksList
          recurringTasks={recurringTasks}
          onUpdate={loadTasks}
        />

        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2">
            <div className="bg-white rounded-lg border-2 border-[#e2e8f0] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide">
                  inbox
                </h3>
                <span className="text-xs bg-[#e2e8f0] text-[#64748b] px-2 py-1 rounded-full font-medium">
                  {inboxTasks.length}
                </span>
              </div>

              <button
                onClick={() => setIsQuickCaptureOpen(true)}
                className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#3b82f6] text-white font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm"
              >
                <Plus size={18} />
                new task
              </button>

              <SortableContext
                items={inboxTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {inboxTasks.length === 0 ? (
                    <div className="text-center py-8 text-[#94a3b8] text-sm">
                      no unprocessed tasks
                    </div>
                  ) : (
                    inboxTasks.map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        onEdit={setEditingTask}
                        onDelete={setDeletingTask}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          </div>

          <div className="col-span-3 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
            {BUCKETS.map((bucket) => (
              <BucketColumn
                key={bucket.id}
                id={bucket.id}
                title={bucket.label}
                tasks={getTasksByStatus(bucket.id)}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90">
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

      {isCreatingRecurring && (
        <CreateRecurringTaskModal
          clients={clients}
          onClose={() => setIsCreatingRecurring(false)}
          onCreated={loadTasks}
        />
      )}

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSubmit={handleQuickCapture}
      />
    </DndContext>
  );
}
