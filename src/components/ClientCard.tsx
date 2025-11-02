import { CheckCircle, AlertCircle } from 'lucide-react';
import { Client } from '../lib/supabase';

type ClientCardProps = {
  client: Client;
  taskCount: number;
  onClick: () => void;
};

function getPaymentMethodStyle(method: string | null) {
  switch (method) {
    case 'check':
      return 'bg-gray-100 text-gray-700';
    case 'quickbooks':
      return 'bg-green-100 text-green-700';
    case 'stripe':
      return 'bg-purple-100 text-purple-700';
    case 'direct_deposit':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function formatCurrency(amount: number | null) {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateString: string | null) {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

export function ClientCard({ client, taskCount, onClick }: ClientCardProps) {
  const overdue = isOverdue(client.next_expected_payment_date);

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-[#e2e8f0] p-6 hover:shadow-lg hover:border-[#3b82f6] transition-all text-left"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-[#1e293b]">{client.name}</h3>
          {client.payment_method && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${getPaymentMethodStyle(
                client.payment_method
              )}`}
            >
              {client.payment_method.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="text-3xl font-bold text-[#1e293b]">
          {formatCurrency(client.monthly_rate)}
          <span className="text-sm font-normal text-[#64748b]">/mo</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#64748b]">last payment:</span>
            <span className="text-[#1e293b] font-medium">
              {formatDate(client.last_payment_date)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748b]">next expected:</span>
            <span className={`font-medium ${overdue ? 'text-[#ef4444]' : 'text-[#1e293b]'}`}>
              {formatDate(client.next_expected_payment_date)}
              {overdue && <AlertCircle size={14} className="inline ml-1" />}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <CheckCircle size={16} />
            <span>
              {taskCount} active {taskCount === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
