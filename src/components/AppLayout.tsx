import { Calendar, CalendarDays, Users, DollarSign, Plus, Settings, Keyboard, FileText, Columns3 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShortcutsModal } from './ShortcutsModal';

type Page = 'planning' | 'calendar' | 'clients' | 'money' | 'notes' | 'kanban' | 'settings';

type AppLayoutProps = {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onQuickCapture: () => void;
};

export function AppLayout({ children, currentPage, onNavigate, onQuickCapture }: AppLayoutProps) {
  const { signOut } = useAuth();
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <aside className="w-[200px] bg-white border-r border-[#e2e8f0] fixed h-screen flex flex-col">
        <div className="p-6 border-b border-[#e2e8f0]">
          <h1 className="text-lg font-bold text-[#1e293b]">command center</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onNavigate('planning')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  currentPage === 'planning'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#64748b] hover:bg-gray-100'
                }`}
              >
                <Calendar size={18} />
                planning
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('calendar')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  currentPage === 'calendar'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#64748b] hover:bg-gray-100'
                }`}
              >
                <CalendarDays size={18} />
                calendar
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('clients')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  currentPage === 'clients'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#64748b] hover:bg-gray-100'
                }`}
              >
                <Users size={18} />
                clients
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('money')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  currentPage === 'money'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#64748b] hover:bg-gray-100'
                }`}
              >
                <DollarSign size={18} />
                money
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('notes')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  currentPage === 'notes'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#64748b] hover:bg-gray-100'
                }`}
              >
                <FileText size={18} />
                notes
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('kanban')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  currentPage === 'kanban'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#64748b] hover:bg-gray-100'
                }`}
              >
                <Columns3 size={18} />
                weekly kanban
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 space-y-2 border-t border-[#e2e8f0]">
          <button
            onClick={onQuickCapture}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[#3b82f6] text-white font-medium text-sm hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            quick capture
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm text-[#64748b] hover:bg-gray-100 transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={18} />
            shortcuts
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
              currentPage === 'settings'
                ? 'bg-gray-100 text-[#1e293b]'
                : 'text-[#64748b] hover:bg-gray-100'
            }`}
          >
            <Settings size={18} />
            settings
          </button>
          <button
            onClick={signOut}
            className="w-full px-3 py-2 rounded-md text-[#64748b] font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            sign out
          </button>
        </div>
      </aside>

      <main className="ml-[200px] flex-1">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
