import { useState, useEffect } from 'react';
import { supabase, Income, Expense, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogTab } from './LogTab';
import { ReportsTab } from './ReportsTab';
import { PersonalFinancesTab } from './PersonalFinancesTab';

export function MoneyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'log' | 'reports' | 'personal'>('log');
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [incomeResult, expensesResult, clientsResult] = await Promise.all([
      supabase.from('income').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('clients').select('*').order('name', { ascending: true }),
    ]);

    if (incomeResult.error) {
      console.error('error loading income:', incomeResult.error);
    } else {
      setIncome(incomeResult.data || []);
    }

    if (expensesResult.error) {
      console.error('error loading expenses:', expensesResult.error);
    } else {
      setExpenses(expensesResult.data || []);
    }

    if (clientsResult.error) {
      console.error('error loading clients:', clientsResult.error);
    } else {
      setClients(clientsResult.data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1e293b]">money</h2>

      <div className="border-b border-[#e2e8f0]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('log')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'log'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            log
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            reports
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'personal'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            personal
          </button>
        </div>
      </div>

      {activeTab === 'log' && (
        <LogTab
          income={income}
          expenses={expenses}
          clients={clients}
          onDataChange={loadData}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsTab
          income={income}
          expenses={expenses}
          clients={clients}
        />
      )}

      {activeTab === 'personal' && <PersonalFinancesTab />}
    </div>
  );
}
