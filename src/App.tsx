import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { AppLayout } from './components/AppLayout';
import { PlanningPage } from './components/PlanningPage';
import { CalendarPage } from './components/CalendarPage';
import { ClientsPage } from './components/ClientsPage';
import { MoneyPage } from './components/MoneyPage';
import { SettingsPage } from './components/SettingsPage';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { supabase } from './lib/supabase';

type Page = 'planning' | 'calendar' | 'clients' | 'money' | 'settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('planning');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcut('k', () => {
    if (user) {
      setIsQuickCaptureOpen(true);
    }
  }, { ctrlOrCmd: true });

  useKeyboardShortcut('?', () => {
    if (user) {
      setShowShortcuts(prev => !prev);
    }
  });

  const handleQuickCapture = async (taskData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    client_id?: string;
  }) => {
    if (!user) return;

    await supabase.from('tasks').insert([{
      user_id: user.id,
      title: taskData.title,
      description: taskData.description || null,
      category: taskData.category || null,
      priority: taskData.priority,
      status: 'inbox',
      client_id: taskData.client_id || null,
    }]);

    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <AppLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onQuickCapture={() => setIsQuickCaptureOpen(true)}
      >
        {currentPage === 'planning' && <PlanningPage />}
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'clients' && <ClientsPage />}
        {currentPage === 'money' && <MoneyPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </AppLayout>

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSubmit={handleQuickCapture}
      />

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
