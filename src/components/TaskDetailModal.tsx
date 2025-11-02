import { X, Calendar, Clock, User, Tag, AlertCircle, Trash2, Edit } from 'lucide-react';
import { Task, Client } from '../lib/supabase';

type TaskDetailModalProps = {
  task: Task;
  client?: Client;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
};

export function TaskDetailModal({ task, client, onClose, onEdit, onDelete, onComplete }: TaskDetailModalProps) {
  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#e2e8f0] flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-[#1e293b] mb-2">{task.title}</h2>
            {task.priority === 'urgent' && (
              <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                <AlertCircle size={16} />
                urgent
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-[#64748b]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {task.description && (
            <div>
              <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                description
              </h3>
              <p className="text-[#1e293b] whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {client && (
              <div>
                <div className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
                  <User size={16} />
                  <span className="font-medium">client</span>
                </div>
                <p className="text-[#1e293b]">{client.name}</p>
              </div>
            )}

            {task.category && (
              <div>
                <div className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
                  <Tag size={16} />
                  <span className="font-medium">category</span>
                </div>
                <p className="text-[#1e293b] capitalize">{task.category}</p>
              </div>
            )}

            {task.due_date && (
              <div>
                <div className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
                  <Calendar size={16} />
                  <span className="font-medium">due date</span>
                </div>
                <p className="text-[#1e293b]">{formatDateTime(task.due_date)}</p>
              </div>
            )}

            {task.time_block_start && task.time_block_end && (
              <div>
                <div className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
                  <Clock size={16} />
                  <span className="font-medium">time block</span>
                </div>
                <p className="text-[#1e293b]">{formatTimeBlock(task.time_block_start, task.time_block_end)}</p>
              </div>
            )}
          </div>

          {task.recurring_id && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                this is a recurring task instance
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={onComplete}
                className="w-4 h-4 rounded border-[#cbd5e1] text-[#3b82f6] focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-[#1e293b]">mark complete</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              delete
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Edit size={16} />
              edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
