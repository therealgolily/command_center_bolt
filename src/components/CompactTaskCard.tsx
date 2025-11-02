import { Clock, User } from 'lucide-react';
import { Task, Client } from '../lib/supabase';

type CompactTaskCardProps = {
  task: Task;
  client?: Client;
  onComplete: () => void;
  onClick: () => void;
};

export function CompactTaskCard({ task, client, onComplete, onClick }: CompactTaskCardProps) {
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
    <div
      className={`p-3 rounded-lg border bg-white hover:shadow-sm transition-all cursor-pointer ${
        task.priority === 'urgent' ? 'border-red-400 border-l-4' : 'border-[#e2e8f0]'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.status === 'done'}
          onChange={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="w-4 h-4 mt-0.5 rounded border-[#cbd5e1] text-[#3b82f6] focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[#1e293b] mb-1 truncate">{task.title}</h4>
          <div className="flex items-center gap-3 text-xs text-[#64748b]">
            {client && (
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{client.name}</span>
              </div>
            )}
            {task.time_block_start && task.time_block_end && (
              <div className="flex items-center gap-1 text-[#3b82f6] font-medium">
                <Clock size={12} />
                <span>{formatTimeBlock(task.time_block_start, task.time_block_end)}</span>
              </div>
            )}
            {task.category && !client && (
              <span className="capitalize">{task.category}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
