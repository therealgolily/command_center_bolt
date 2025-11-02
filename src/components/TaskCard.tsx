import { Edit2, Trash2, Clock, CheckCircle, AlertCircle, Repeat } from 'lucide-react';
import { Task } from '../lib/supabase';

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function formatTimeBlock(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${startTime} - ${endTime}`;
}

function getCategoryStyle(category: string | null) {
  switch (category) {
    case 'client':
      return 'bg-blue-100 text-blue-700';
    case 'personal':
      return 'bg-green-100 text-green-700';
    case 'idea':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const isUrgent = task.priority === 'urgent';
  const hasTimeBlock = task.time_block_start && task.time_block_end;
  const isRecurringInstance = task.parent_task_id !== null;

  return (
    <div
      className={`group bg-white rounded-md border border-[#e2e8f0] p-4 hover:shadow-md transition-shadow ${
        isUrgent ? 'border-l-2 border-l-[#ef4444]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#1e293b]">{task.title}</h3>
            {isUrgent && (
              <div className="w-2 h-2 rounded-full bg-[#ef4444]" title="urgent" />
            )}
            {isRecurringInstance && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                <Repeat size={12} />
                recurring
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-[#64748b] text-sm mb-2">{task.description}</p>
          )}

          {hasTimeBlock && (
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-[#3b82f6]" />
              <span className="text-xs text-[#3b82f6] font-medium">
                {formatTimeBlock(task.time_block_start!, task.time_block_end!)}
              </span>
              {task.calendar_sync_status === 'synced' && (
                <CheckCircle size={14} className="text-[#22c55e]" title="synced to calendar" />
              )}
              {task.calendar_sync_status === 'failed' && (
                <AlertCircle size={14} className="text-[#f59e0b]" title="sync failed" />
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {task.category && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${getCategoryStyle(
                  task.category
                )}`}
              >
                {task.category}
              </span>
            )}
            <span className="text-xs text-[#94a3b8]">
              {formatTimeAgo(task.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-[#64748b] hover:text-[#3b82f6] hover:bg-blue-50 rounded transition-colors"
            title="edit task"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded transition-colors"
            title="delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
