import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Task } from '../lib/supabase';

type EditTaskModalProps = {
  task: Task;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
};

export function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState(task.category || '');
  const [isUrgent, setIsUrgent] = useState(task.priority === 'urgent');
  const [timeBlockStart, setTimeBlockStart] = useState(
    task.time_block_start ? new Date(task.time_block_start).toISOString().slice(0, 16) : ''
  );
  const [timeBlockEnd, setTimeBlockEnd] = useState(
    task.time_block_end ? new Date(task.time_block_end).toISOString().slice(0, 16) : ''
  );
  const titleRef = useRef<HTMLInputElement>(null);

  const showTimeBlocking = ['today', 'tomorrow', 'this_week', 'next_week'].includes(task.status);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updates: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      priority: isUrgent ? 'urgent' : 'normal',
    };

    if (showTimeBlocking) {
      updates.time_block_start = timeBlockStart ? new Date(timeBlockStart).toISOString() : null;
      updates.time_block_end = timeBlockEnd ? new Date(timeBlockEnd).toISOString() : null;
    }

    onSave(updates);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[#1e293b]">edit task</h3>
          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-[#1e293b] rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-[#1e293b] mb-1">
              title
            </label>
            <input
              ref={titleRef}
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-[#1e293b] mb-1">
              description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-[#1e293b] mb-1">
              category
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            >
              <option value="">none</option>
              <option value="client">client</option>
              <option value="personal">personal</option>
              <option value="idea">idea</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 rounded border-[#e2e8f0] text-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]"
            />
            <span className="text-sm text-[#64748b]">urgent</span>
          </label>

          {showTimeBlocking && (
            <div className="pt-3 border-t border-[#e2e8f0] space-y-3">
              <div className="text-sm font-medium text-[#1e293b]">time block</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-start" className="block text-xs font-medium text-[#64748b] mb-1">
                    start time
                  </label>
                  <input
                    id="edit-start"
                    type="datetime-local"
                    value={timeBlockStart}
                    onChange={(e) => setTimeBlockStart(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#e2e8f0] rounded-md text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="edit-end" className="block text-xs font-medium text-[#64748b] mb-1">
                    end time
                  </label>
                  <input
                    id="edit-end"
                    type="datetime-local"
                    value={timeBlockEnd}
                    onChange={(e) => setTimeBlockEnd(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#e2e8f0] rounded-md text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  />
                </div>
              </div>

              {timeBlockStart && timeBlockEnd && (
                <div className="text-xs text-[#64748b]">
                  note: calendar sync requires google calendar setup
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
