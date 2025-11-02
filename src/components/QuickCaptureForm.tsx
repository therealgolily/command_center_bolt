import { useState, useRef, useEffect } from 'react';
import { supabase, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type QuickCaptureFormProps = {
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
    client_id?: string;
  }) => void;
  autoFocus?: boolean;
  presetClientId?: string;
};

export function QuickCaptureForm({ onSubmit, autoFocus = true, presetClientId }: QuickCaptureFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(presetClientId ? 'client' : '');
  const [clientId, setClientId] = useState(presetClientId || '');
  const [isUrgent, setIsUrgent] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && titleRef.current) {
      titleRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setClients(data);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority: isUrgent ? 'urgent' : 'normal',
      client_id: category === 'client' && clientId ? clientId : undefined,
    });

    setTitle('');
    setDescription('');
    if (!presetClientId) {
      setCategory('');
      setClientId('');
    }
    setIsUrgent(false);
    setDescriptionFocused(false);
    if (titleRef.current) {
      titleRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-4 space-y-3">
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="what needs to be done?"
        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
        required
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onFocus={() => setDescriptionFocused(true)}
        placeholder="details (optional)"
        rows={descriptionFocused ? 3 : 1}
        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent resize-none transition-all"
      />

      <div className="flex items-center gap-3 flex-wrap">
        {!presetClientId && (
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== 'client') {
                setClientId('');
              }
            }}
            className="px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm"
          >
            <option value="">category</option>
            <option value="client">client</option>
            <option value="personal">personal</option>
            <option value="idea">idea</option>
          </select>
        )}

        {category === 'client' && !presetClientId && (
          <>
            {clients.length > 0 ? (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm"
              >
                <option value="">select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-[#94a3b8]">add clients first</span>
            )}
          </>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            className="w-4 h-4 rounded border-[#e2e8f0] text-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]"
          />
          <span className="text-sm text-[#64748b]">urgent</span>
        </label>

        <button
          type="submit"
          disabled={!title.trim()}
          className="ml-auto px-4 py-2 bg-[#3b82f6] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          add task
        </button>
      </div>
    </form>
  );
}
