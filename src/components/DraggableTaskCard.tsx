import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task } from '../lib/supabase';

type DraggableTaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function DraggableTaskCard({ task, onEdit, onDelete }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical size={16} className="text-[#94a3b8]" />
      </div>
      <div className="pl-6">
        <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
