import { useState, useEffect, useRef } from 'react';
import { X, Repeat } from 'lucide-react';
import { supabase, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type CreateRecurringTaskModalProps = {
  clients: Client[];
  onClose: () => void;
  onCreated: () => void;
};

export function CreateRecurringTaskModal({ clients, onClose, onCreated }: CreateRecurringTaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [category, setCategory] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [weekDay, setWeekDay] = useState('monday');
  const [monthDay, setMonthDay] = useState('1');
  const [timeBlockStart, setTimeBlockStart] = useState('');
  const [timeBlockEnd, setTimeBlockEnd] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

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

  const buildRecurrenceRule = (): string => {
    switch (recurrenceType) {
      case 'daily':
        return 'daily';
      case 'weekly':
        return `weekly-${weekDay}`;
      case 'monthly':
        return `monthly-${monthDay}`;
      default:
        return 'daily';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    const recurrenceRule = buildRecurrenceRule();

    const recurringTask = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      client_id: clientId || null,
      priority: isUrgent ? 'urgent' : 'normal',
      status: 'recurring',
      is_recurring: true,
      recurrence_rule: recurrenceRule,
      time_block_start: timeBlockStart ? new Date(timeBlockStart).toISOString() : null,
      time_block_end: timeBlockEnd ? new Date(timeBlockEnd).toISOString() : null,
      calendar_sync_status: 'none',
      is_paused: false,
    };

    const { error } = await supabase.from('tasks').insert([recurringTask]);

    if (error) {
      console.error('error creating recurring task:', error);
    } else {
      onCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Repeat size={20} className="text-purple-600" />
            <h3 className="font-semibold text-[#1e293b]">create recurring task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-[#1e293b] rounded hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#1e293b] mb-1">
              title <span className="text-[#ef4444]">*</span>
            </label>
            <input
              ref={titleRef}
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              placeholder="e.g., Weekly status report"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#1e293b] mb-1">
              description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent resize-none"
              placeholder="optional details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-[#1e293b] mb-1">
                client
              </label>
              <select
                id="client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              >
                <option value="">none</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[#1e293b] mb-1">
                category
              </label>
              <select
                id="category"
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
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 rounded border-[#e2e8f0] text-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]"
            />
            <span className="text-sm text-[#64748b]">mark as urgent</span>
          </label>

          <div className="pt-3 border-t border-[#e2e8f0] space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                recurrence pattern <span className="text-[#ef4444]">*</span>
              </label>

              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent mb-3"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              {recurrenceType === 'weekly' && (
                <select
                  value={weekDay}
                  onChange={(e) => setWeekDay(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              )}

              {recurrenceType === 'monthly' && (
                <select
                  value={monthDay}
                  onChange={(e) => setMonthDay(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                >
                  <option value="1">1st of month</option>
                  <option value="5">5th of month</option>
                  <option value="10">10th of month</option>
                  <option value="15">15th of month</option>
                  <option value="20">20th of month</option>
                  <option value="25">25th of month</option>
                  <option value="last">Last day of month</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                optional: time block for instances
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start-time" className="block text-xs text-[#64748b] mb-1">
                    start time
                  </label>
                  <input
                    id="start-time"
                    type="datetime-local"
                    value={timeBlockStart}
                    onChange={(e) => setTimeBlockStart(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#e2e8f0] rounded-md text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-xs text-[#64748b] mb-1">
                    end time
                  </label>
                  <input
                    id="end-time"
                    type="datetime-local"
                    value={timeBlockEnd}
                    onChange={(e) => setTimeBlockEnd(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#e2e8f0] rounded-md text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1">
                time will be applied to each instance on its scheduled date
              </p>
            </div>
          </div>

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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              create recurring task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
