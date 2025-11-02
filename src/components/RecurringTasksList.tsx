import { useState } from 'react';
import { Repeat, Pause, Play, Trash2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Task, supabase } from '../lib/supabase';
import { formatRecurrenceRule, runRecurringTaskEngine } from '../lib/recurringEngine';
import { ConfirmDialog } from './ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';

type RecurringTasksListProps = {
  recurringTasks: Task[];
  onUpdate: () => void;
};

export function RecurringTasksList({ recurringTasks, onUpdate }: RecurringTasksListProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleteInstances, setDeleteInstances] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);

  const handleTogglePause = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_paused: !task.is_paused })
      .eq('id', task.id);

    if (!error) {
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;

    if (deleteInstances) {
      await supabase
        .from('tasks')
        .delete()
        .eq('parent_task_id', deletingTask.id);
    } else {
      await supabase
        .from('tasks')
        .update({ parent_task_id: null })
        .eq('parent_task_id', deletingTask.id);
    }

    await supabase
      .from('tasks')
      .delete()
      .eq('id', deletingTask.id);

    setDeletingTask(null);
    setDeleteInstances(false);
    onUpdate();
  };

  const handleGenerateInstances = async () => {
    if (!user) return;

    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const result = await runRecurringTaskEngine(user.id);

      if (result.created > 0) {
        setGenerationResult(`Created ${result.created} task instance${result.created !== 1 ? 's' : ''}`);
        onUpdate();
      } else {
        setGenerationResult('No new instances needed');
      }

      if (result.errors.length > 0) {
        console.error('Generation errors:', result.errors);
      }

      setTimeout(() => setGenerationResult(null), 3000);
    } catch (error) {
      console.error('Failed to generate instances:', error);
      setGenerationResult('Failed to generate instances');
      setTimeout(() => setGenerationResult(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  if (recurringTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Repeat size={20} className="text-purple-600" />
          <h3 className="font-semibold text-[#1e293b]">recurring tasks</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-[#94a3b8] text-sm">
            no recurring tasks set up. create one to automate repetitive work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0]">
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Repeat size={20} className="text-purple-600" />
            <h3 className="font-semibold text-[#1e293b]">recurring tasks</h3>
            <span className="text-sm text-[#64748b]">({recurringTasks.length})</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateInstances}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Generating...' : 'Generate instances now'}
          </button>

          {generationResult && (
            <span className="text-sm text-purple-600 font-medium">
              {generationResult}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#e2e8f0] divide-y divide-[#e2e8f0]">
          {recurringTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                task.is_paused ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-[#1e293b]">{task.title}</h4>
                    {task.is_paused && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        paused
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-[#64748b] mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                    <span>{formatRecurrenceRule(task.recurrence_rule || '')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePause(task)}
                    className="p-1.5 text-[#64748b] hover:text-[#3b82f6] hover:bg-blue-50 rounded transition-colors"
                    title={task.is_paused ? 'Resume' : 'Pause'}
                  >
                    {task.is_paused ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button
                    onClick={() => setDeletingTask(task)}
                    className="p-1.5 text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingTask && (
        <ConfirmDialog
          title="delete recurring task?"
          message={
            <div className="space-y-2">
              <p>Are you sure you want to delete "{deletingTask.title}"?</p>
              <p className="text-sm">This will stop creating future instances.</p>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={deleteInstances}
                  onChange={(e) => setDeleteInstances(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e2e8f0] text-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]"
                />
                <span className="text-sm">Also delete all existing instances</span>
              </label>
            </div>
          }
          confirmText="delete"
          onConfirm={handleDelete}
          onCancel={() => {
            setDeletingTask(null);
            setDeleteInstances(false);
          }}
        />
      )}
    </div>
  );
}
