import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../lib/supabase';
import { DraggableTaskCard } from './DraggableTaskCard';
import { BucketStatus } from '../lib/buckets';

type BucketColumnProps = {
  id: BucketStatus;
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function BucketColumn({ id, title, tasks, onEdit, onDelete }: BucketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg border-2 p-4 transition-colors min-h-[200px] ${
        isOver ? 'border-[#3b82f6] bg-blue-50' : 'border-[#e2e8f0]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide">
          {title}
        </h3>
        <span className="text-xs bg-[#e2e8f0] text-[#64748b] px-2 py-1 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8] text-sm">
              drag tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
