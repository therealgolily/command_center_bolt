import { Clock, Repeat } from 'lucide-react';
import { Task, Client } from '../lib/supabase';

type TaskBadgeProps = {
  task: Task;
  client?: Client;
  onClick: () => void;
};

export function TaskBadge({ task, client, onClick }: TaskBadgeProps) {
  const getLabel = () => {
    if (client) return client.name;
    if (task.category === 'personal') return 'personal';
    if (task.category === 'idea') return 'idea';
    if (task.recurring_id) return 'recurring';
    return 'task';
  };

  const getColorClasses = () => {
    if (client) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (task.category === 'personal') return 'bg-green-100 text-green-700 border-green-200';
    if (task.category === 'idea') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (task.recurring_id) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatTime = (start: string, end: string) => {
    const startTime = new Date(start).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return startTime;
  };

  const hasTimeBlock = task.time_block_start && task.time_block_end;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getColorClasses()} ${
        task.priority === 'urgent' ? 'ring-2 ring-red-400 ring-offset-1' : ''
      }`}
    >
      {task.recurring_id && <Repeat size={12} />}
      {hasTimeBlock && (
        <>
          <Clock size={11} />
          <span className="text-[10px]">{formatTime(task.time_block_start!, task.time_block_end!)}</span>
          <span className="text-[10px] opacity-50">·</span>
        </>
      )}
      <span className="truncate">{getLabel()}</span>
    </div>
  );
}
