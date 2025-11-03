import { useState } from 'react';
import { Trash2, Edit2, TrendingUp, TrendingDown, Paperclip, Upload, X } from 'lucide-react';
import { supabase, Income, Expense, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { uploadAttachment, deleteAttachment } from '../lib/fileUpload';

type LogTabProps = {
  income: Income[];
  expenses: Expense[];
  clients: Client[];
  onDataChange: () => void;
};

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  client_id: string | null;
  amount: number;
  date: string;
  description: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LogTab({ income, expenses, clients, onDataChange }: LogTabProps) {
  const { user } = useAuth();
  const [incomeClientId, setIncomeClientId] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeNotes, setIncomeNotes] = useState('');
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [incomeUploading, setIncomeUploading] = useState(false);

  const [expenseClientId, setExpenseClientId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseFile, setExpenseFile] = useState<File | null>(null);
  const [expenseUploading, setExpenseUploading] = useState(false);

  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !incomeClientId || !incomeAmount) return;

    try {
      setIncomeUploading(true);
      let attachmentUrl = null;
      let attachmentName = null;

      if (incomeFile) {
        const result = await uploadAttachment(incomeFile, user.id, 'income');
        attachmentUrl = result.url;
        attachmentName = result.name;
      }

      const { error } = await supabase.from('income').insert([{
        user_id: user.id,
        client_id: incomeClientId,
        amount: parseFloat(incomeAmount),
        date: incomeDate,
        notes: incomeNotes || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      }]);

      if (error) {
        console.error('error logging income:', error);
        if (attachmentUrl) {
          await deleteAttachment(attachmentUrl);
        }
      } else {
        setIncomeClientId('');
        setIncomeAmount('');
        setIncomeDate(new Date().toISOString().split('T')[0]);
        setIncomeNotes('');
        setIncomeFile(null);
        onDataChange();
      }
    } catch (error) {
      console.error('error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIncomeUploading(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !expenseAmount) return;

    try {
      setExpenseUploading(true);
      let attachmentUrl = null;
      let attachmentName = null;

      if (expenseFile) {
        const result = await uploadAttachment(expenseFile, user.id, 'expenses');
        attachmentUrl = result.url;
        attachmentName = result.name;
      }

      const { error } = await supabase.from('expenses').insert([{
        user_id: user.id,
        client_id: expenseClientId || null,
        amount: parseFloat(expenseAmount),
        date: expenseDate,
        category: expenseCategory || null,
        description: expenseDescription || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      }]);

      if (error) {
        console.error('error logging expense:', error);
        if (attachmentUrl) {
          await deleteAttachment(attachmentUrl);
        }
      } else {
        setExpenseClientId('');
        setExpenseAmount('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setExpenseCategory('');
        setExpenseDescription('');
        setExpenseFile(null);
        onDataChange();
      }
    } catch (error) {
      console.error('error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setExpenseUploading(false);
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    const table = transaction.type === 'income' ? 'income' : 'expenses';

    const record = transaction.type === 'income'
      ? income.find((i) => i.id === transaction.id)
      : expenses.find((e) => e.id === transaction.id);

    if (record?.attachment_url) {
      await deleteAttachment(record.attachment_url);
    }

    const { error } = await supabase.from(table).delete().eq('id', transaction.id);

    if (error) {
      console.error('error deleting transaction:', error);
    } else {
      setDeletingTransaction(null);
      onDataChange();
    }
  };

  const transactions: Transaction[] = [
    ...income.map((i) => ({
      id: i.id,
      type: 'income' as const,
      client_id: i.client_id,
      amount: i.amount,
      date: i.date,
      description: i.notes,
      attachment_url: i.attachment_url,
      attachment_name: i.attachment_name,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      client_id: e.client_id,
      amount: e.amount,
      date: e.date,
      description: e.description,
      attachment_url: e.attachment_url,
      attachment_name: e.attachment_name,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'overhead';
    const client = clients.find((c) => c.id === clientId);
    return client?.name || 'unknown';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <form onSubmit={handleLogIncome} className="bg-white rounded-lg border border-[#e2e8f0] p-6 space-y-4">
          <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide flex items-center gap-2">
            <TrendingUp size={16} className="text-[#22c55e]" />
            log income
          </h3>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              client <span className="text-[#ef4444]">*</span>
            </label>
            <select
              value={incomeClientId}
              onChange={(e) => setIncomeClientId(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              required
            >
              <option value="">select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              amount <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent font-mono"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              date <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="date"
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              notes
            </label>
            <textarea
              value={incomeNotes}
              onChange={(e) => setIncomeNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent resize-none"
              placeholder="optional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              attach invoice/receipt
            </label>
            {incomeFile ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-[#e2e8f0]">
                <Paperclip size={16} className="text-[#64748b]" />
                <span className="text-sm text-[#1e293b] flex-1 truncate">{incomeFile.name}</span>
                <button
                  type="button"
                  onClick={() => setIncomeFile(null)}
                  className="p-1 text-[#64748b] hover:text-[#ef4444] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#e2e8f0] rounded-md cursor-pointer hover:border-[#3b82f6] hover:bg-blue-50 transition-colors">
                <Upload size={16} className="text-[#64748b]" />
                <span className="text-sm text-[#64748b]">upload file</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                  onChange={(e) => setIncomeFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs text-[#94a3b8] mt-1">PDF, JPG, PNG, XLSX, DOCX (max 10MB)</p>
          </div>

          <button
            type="submit"
            disabled={!incomeClientId || !incomeAmount || incomeUploading}
            className="w-full px-4 py-2 bg-[#22c55e] text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {incomeUploading ? 'uploading...' : 'log income'}
          </button>
        </form>

        <form onSubmit={handleLogExpense} className="bg-white rounded-lg border border-[#e2e8f0] p-6 space-y-4">
          <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide flex items-center gap-2">
            <TrendingDown size={16} className="text-[#ef4444]" />
            log expense
          </h3>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              client
            </label>
            <select
              value={expenseClientId}
              onChange={(e) => setExpenseClientId(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            >
              <option value="">overhead</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              amount <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent font-mono"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              date <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              category
            </label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            >
              <option value="">select category</option>
              <option value="tools">tools</option>
              <option value="software">software</option>
              <option value="overhead">overhead</option>
              <option value="marketing">marketing</option>
              <option value="other">other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              description
            </label>
            <input
              type="text"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              placeholder="what was this for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              attach receipt
            </label>
            {expenseFile ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-[#e2e8f0]">
                <Paperclip size={16} className="text-[#64748b]" />
                <span className="text-sm text-[#1e293b] flex-1 truncate">{expenseFile.name}</span>
                <button
                  type="button"
                  onClick={() => setExpenseFile(null)}
                  className="p-1 text-[#64748b] hover:text-[#ef4444] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#e2e8f0] rounded-md cursor-pointer hover:border-[#3b82f6] hover:bg-blue-50 transition-colors">
                <Upload size={16} className="text-[#64748b]" />
                <span className="text-sm text-[#64748b]">upload file</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                  onChange={(e) => setExpenseFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs text-[#94a3b8] mt-1">PDF, JPG, PNG, XLSX, DOCX (max 10MB)</p>
          </div>

          <button
            type="submit"
            disabled={!expenseAmount || expenseUploading}
            className="w-full px-4 py-2 bg-[#ef4444] text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {expenseUploading ? 'uploading...' : 'log expense'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide mb-4">
          recent transactions
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-[#94a3b8] text-sm">
            start tracking your income and expenses above
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={`${transaction.type}-${transaction.id}`}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-md group transition-colors"
              >
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    transaction.type === 'income'
                      ? 'bg-green-100 text-[#22c55e]'
                      : 'bg-red-100 text-[#ef4444]'
                  }`}
                >
                  {transaction.type}
                </span>

                <div className="flex-1">
                  <div className="font-medium text-[#1e293b] flex items-center gap-2">
                    {getClientName(transaction.client_id)}
                    {transaction.attachment_url && (
                      <a
                        href={transaction.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3b82f6] hover:text-blue-600 transition-colors"
                        title={transaction.attachment_name || 'View attachment'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Paperclip size={14} />
                      </a>
                    )}
                  </div>
                  {transaction.description && (
                    <div className="text-sm text-[#64748b]">{transaction.description}</div>
                  )}
                </div>

                <div
                  className={`font-mono font-semibold ${
                    transaction.type === 'income' ? 'text-[#22c55e]' : 'text-[#ef4444]'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>

                <div className="text-sm text-[#64748b] w-24 text-right">
                  {formatDate(transaction.date)}
                </div>

                <button
                  onClick={() => setDeletingTransaction(transaction)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#64748b] hover:text-[#ef4444] transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {deletingTransaction && (
        <ConfirmDialog
          title="delete transaction?"
          message="are you sure you want to delete this transaction? this cannot be undone."
          confirmText="delete"
          onConfirm={() => handleDeleteTransaction(deletingTransaction)}
          onCancel={() => setDeletingTransaction(null)}
        />
      )}
    </div>
  );
}
