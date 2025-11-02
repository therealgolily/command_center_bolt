import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Mail, Phone } from 'lucide-react';
import { Client, Task, Income, Expense, supabase } from '../lib/supabase';
import { TaskCard } from './TaskCard';
import { EditClientModal } from './EditClientModal';
import { ConfirmDialog } from './ConfirmDialog';
import { QuickCaptureForm } from './QuickCaptureForm';
import { useAuth } from '../contexts/AuthContext';

type ClientDetailModalProps = {
  client: Client;
  tasks: Task[];
  onClose: () => void;
  onUpdate: (clientId: string, updates: Partial<Client>) => void;
  onDelete: (clientId: string) => void;
  onTasksChange: () => void;
};

type Tab = 'tasks' | 'payments' | 'expenses' | 'notes';

export function ClientDetailModal({
  client,
  tasks,
  onClose,
  onUpdate,
  onDelete,
  onTasksChange,
}: ClientDetailModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notes, setNotes] = useState(client.notes || '');
  const [lastPaymentDate, setLastPaymentDate] = useState(client.last_payment_date || '');
  const [nextExpectedPaymentDate, setNextExpectedPaymentDate] = useState(
    client.next_expected_payment_date || ''
  );
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [client.id]);

  const loadFinancialData = async () => {
    const [incomeResult, expensesResult] = await Promise.all([
      supabase.from('income').select('*').eq('client_id', client.id).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('client_id', client.id).order('date', { ascending: false }),
    ]);

    if (!incomeResult.error && incomeResult.data) {
      setIncome(incomeResult.data);
    }
    if (!expensesResult.error && expensesResult.data) {
      setExpenses(expensesResult.data);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditing && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isEditing, isDeleting]);

  const handleNotesBlur = () => {
    if (notes !== client.notes) {
      onUpdate(client.id, { notes });
    }
  };

  const handlePaymentDateUpdate = (field: 'last_payment_date' | 'next_expected_payment_date', value: string) => {
    onUpdate(client.id, { [field]: value || null });
  };

  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    if (!user) return;

    await supabase.from('tasks').insert([{
      user_id: user.id,
      title: taskData.title,
      description: taskData.description || null,
      category: 'client',
      priority: taskData.priority,
      status: 'inbox',
      client_id: client.id,
    }]);

    onTasksChange();
  };

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  function formatCurrency(amount: number | null) {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#1e293b] mb-2">{client.name}</h2>
            <div className="flex items-center gap-4 text-sm text-[#64748b]">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-[#3b82f6]">
                  <Mail size={14} />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-[#3b82f6]">
                  <Phone size={14} />
                  {client.phone}
                </a>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4">
              {client.monthly_rate && (
                <div className="text-lg font-semibold text-[#1e293b]">
                  {formatCurrency(client.monthly_rate)}/mo
                </div>
              )}
              <div className={`px-3 py-1 rounded-md text-sm font-semibold font-mono ${
                netProfit >= 0 ? 'bg-green-100 text-[#22c55e]' : 'bg-red-100 text-[#ef4444]'
              }`}>
                {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)} net
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-[#64748b] hover:text-[#3b82f6] hover:bg-blue-50 rounded transition-colors"
              title="edit client"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setIsDeleting(true)}
              className="p-2 text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded transition-colors"
              title="delete client"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#64748b] hover:text-[#1e293b] rounded hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="border-b border-[#e2e8f0]">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-[#3b82f6] text-[#3b82f6]'
                  : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              tasks ({activeTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-[#3b82f6] text-[#3b82f6]'
                  : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              payments
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'expenses'
                  ? 'border-[#3b82f6] text-[#3b82f6]'
                  : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              expenses
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notes'
                  ? 'border-[#3b82f6] text-[#3b82f6]'
                  : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              notes
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <QuickCaptureForm onSubmit={handleAddTask} />

              {activeTasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">
                    active tasks
                  </h4>
                  {activeTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={() => {}} onDelete={() => {}} />
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-[#64748b] text-sm uppercase tracking-wide">
                    completed
                  </h4>
                  {completedTasks.map((task) => (
                    <div key={task.id} className="opacity-50">
                      <TaskCard task={task} onEdit={() => {}} onDelete={() => {}} />
                    </div>
                  ))}
                </div>
              )}

              {tasks.length === 0 && (
                <div className="text-center py-8 text-[#94a3b8] text-sm">
                  no tasks for this client yet
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="text-sm text-[#64748b] mb-1">total income all-time</div>
                <div className="text-2xl font-bold text-[#22c55e] font-mono">
                  {formatCurrency(totalIncome)}
                </div>
                {income.length > 0 && (
                  <div className="text-sm text-[#64748b] mt-1">
                    average: {formatCurrency(totalIncome / income.length)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">
                  payment history
                </h4>
                {income.length === 0 ? (
                  <div className="text-center py-8 text-[#94a3b8] text-sm">
                    no payments recorded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {income.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-semibold text-[#22c55e] font-mono">
                            {formatCurrency(payment.amount)}
                          </div>
                          {payment.notes && (
                            <div className="text-sm text-[#64748b]">{payment.notes}</div>
                          )}
                        </div>
                        <div className="text-sm text-[#64748b]">{formatDate(payment.date)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#e2e8f0]">
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">
                    last payment date
                  </label>
                  <input
                    type="date"
                    value={lastPaymentDate}
                    onChange={(e) => setLastPaymentDate(e.target.value)}
                    onBlur={() => handlePaymentDateUpdate('last_payment_date', lastPaymentDate)}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">
                    next expected payment
                  </label>
                  <input
                    type="date"
                    value={nextExpectedPaymentDate}
                    onChange={(e) => setNextExpectedPaymentDate(e.target.value)}
                    onBlur={() =>
                      handlePaymentDateUpdate('next_expected_payment_date', nextExpectedPaymentDate)
                    }
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-[#64748b] mb-1">total expenses all-time</div>
                <div className="text-2xl font-bold text-[#ef4444] font-mono">
                  {formatCurrency(totalExpenses)}
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-8 text-[#94a3b8] text-sm">
                  no expenses tracked yet
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">
                      expense history
                    </h4>
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-semibold text-[#ef4444] font-mono">
                            {formatCurrency(expense.amount)}
                          </div>
                          <div className="text-sm text-[#64748b]">
                            {expense.category && (
                              <span className="capitalize">{expense.category}</span>
                            )}
                            {expense.description && (
                              <span> - {expense.description}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-[#64748b]">{formatDate(expense.date)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#e2e8f0]">
                    <h4 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide mb-3">
                      by category
                    </h4>
                    {Object.entries(
                      expenses.reduce((acc, e) => {
                        const cat = e.category || 'uncategorized';
                        acc[cat] = (acc[cat] || 0) + e.amount;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between py-2">
                          <span className="text-sm text-[#64748b] capitalize">{category}</span>
                          <span className="font-mono font-medium text-[#1e293b]">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                general notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                rows={10}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent resize-none"
                placeholder="add any notes about this client..."
              />
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <EditClientModal
          client={client}
          onClose={() => setIsEditing(false)}
          onSave={(updates) => {
            onUpdate(client.id, updates);
            setIsEditing(false);
          }}
        />
      )}

      {isDeleting && (
        <ConfirmDialog
          title="delete client?"
          message={`are you sure you want to delete ${client.name}? this cannot be undone.`}
          confirmText="delete"
          onConfirm={() => onDelete(client.id)}
          onCancel={() => setIsDeleting(false)}
        />
      )}
    </div>
  );
}
