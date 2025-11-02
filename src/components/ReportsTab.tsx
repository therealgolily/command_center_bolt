import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Income, Expense, Client } from '../lib/supabase';

type ReportsTabProps = {
  income: Income[];
  expenses: Expense[];
  clients: Client[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMonthName(year: number, month: number) {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function ReportsTab({ income, expenses, clients }: ReportsTabProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const filterByMonth = <T extends { date: string }>(items: T[]) => {
    return items.filter((item) => {
      const date = new Date(item.date);
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
    });
  };

  const monthIncome = filterByMonth(income);
  const monthExpenses = filterByMonth(expenses);

  const totalIncome = monthIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const previousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const clientBreakdown = clients.map((client) => {
    const clientIncome = income.filter((i) => i.client_id === client.id).reduce((sum, i) => sum + i.amount, 0);
    const clientExpenses = expenses.filter((e) => e.client_id === client.id).reduce((sum, e) => sum + e.amount, 0);
    const netProfit = clientIncome - clientExpenses;
    const profitMargin = clientIncome > 0 ? (netProfit / clientIncome) * 100 : 0;

    return {
      client,
      income: clientIncome,
      expenses: clientExpenses,
      netProfit,
      profitMargin,
    };
  }).sort((a, b) => b.netProfit - a.netProfit);

  const expensesByCategory = monthExpenses.reduce((acc, expense) => {
    const category = expense.category || 'uncategorized';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const overheadExpenses = monthExpenses.filter((e) => !e.client_id).reduce((sum, e) => sum + e.amount, 0);
  const clientExpenses = monthExpenses.filter((e) => e.client_id).reduce((sum, e) => sum + e.amount, 0);

  const expectedNextMonth = clients.reduce((sum, client) => sum + (client.monthly_rate || 0), 0);

  const upcomingPayments = clients
    .filter((c) => c.next_expected_payment_date)
    .sort((a, b) => {
      const dateA = new Date(a.next_expected_payment_date!);
      const dateB = new Date(b.next_expected_payment_date!);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide">
            monthly summary
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-1 text-[#64748b] hover:text-[#1e293b] hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-[#1e293b] min-w-[140px] text-center">
              {getMonthName(selectedYear, selectedMonth)}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 text-[#64748b] hover:text-[#1e293b] hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-[#64748b] mb-1">total income</div>
            <div className="text-2xl font-bold text-[#22c55e] font-mono">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-[#64748b] mb-1">total expenses</div>
            <div className="text-2xl font-bold text-[#ef4444] font-mono">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-[#64748b] mb-1">net profit</div>
            <div
              className={`text-2xl font-bold font-mono ${
                netProfit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              }`}
            >
              {formatCurrency(netProfit)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
        <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide mb-4">
          by client breakdown
        </h3>

        {clientBreakdown.length === 0 ? (
          <div className="text-center py-8 text-[#94a3b8] text-sm">
            no client data yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left py-2 px-3 text-sm font-medium text-[#64748b]">client</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-[#64748b]">income</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-[#64748b]">expenses</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-[#64748b]">net profit</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-[#64748b]">margin</th>
                </tr>
              </thead>
              <tbody>
                {clientBreakdown.map((item) => (
                  <tr key={item.client.id} className="border-b border-[#e2e8f0] last:border-0">
                    <td className="py-3 px-3 font-medium text-[#1e293b]">{item.client.name}</td>
                    <td className="py-3 px-3 text-right font-mono text-[#22c55e]">
                      {formatCurrency(item.income)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#ef4444]">
                      {formatCurrency(item.expenses)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-semibold ${
                        item.netProfit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                      }`}
                    >
                      {formatCurrency(item.netProfit)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono ${
                        item.profitMargin >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                      }`}
                    >
                      {item.profitMargin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
          <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide mb-4">
            expense breakdown
          </h3>

          {Object.keys(expensesByCategory).length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8] text-sm">
              no expenses this month
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(expensesByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-[#64748b] capitalize">{category}</span>
                    <span className="font-mono font-medium text-[#1e293b]">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}

              <div className="pt-3 mt-3 border-t border-[#e2e8f0] space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">client-specific</span>
                  <span className="font-mono text-[#1e293b]">{formatCurrency(clientExpenses)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">overhead</span>
                  <span className="font-mono text-[#1e293b]">{formatCurrency(overheadExpenses)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
          <h3 className="font-semibold text-[#1e293b] uppercase text-sm tracking-wide mb-4">
            forecast
          </h3>

          <div className="mb-4">
            <div className="text-sm text-[#64748b] mb-1">expected income next month</div>
            <div className="text-2xl font-bold text-[#3b82f6] font-mono">
              {formatCurrency(expectedNextMonth)}
            </div>
          </div>

          {upcomingPayments.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-[#64748b] mb-2">upcoming payments</div>
              {upcomingPayments.map((client) => (
                <div key={client.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#1e293b]">{client.name}</span>
                  <span className="text-[#64748b]">
                    {formatCurrency(client.monthly_rate || 0)} on{' '}
                    {formatDate(client.next_expected_payment_date!)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
