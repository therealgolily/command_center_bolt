import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon, Building2, PiggyBank, TrendingUp } from 'lucide-react';
import { supabase, CreditCard, AssetAccount } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';

type EditingCreditCard = Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
type EditingAssetAccount = Omit<AssetAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function PersonalFinancesTab() {
  const { user } = useAuth();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [assetAccounts, setAssetAccounts] = useState<AssetAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingAccount, setEditingAccount] = useState<AssetAccount | null>(null);
  const [deletingCard, setDeletingCard] = useState<CreditCard | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AssetAccount | null>(null);

  const [cardForm, setCardForm] = useState<EditingCreditCard>({
    name: '',
    last_four: '',
    balance: 0,
    credit_limit: null,
  });

  const [accountForm, setAccountForm] = useState<EditingAssetAccount>({
    name: '',
    account_type: 'checking',
    balance: 0,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [cardsResult, accountsResult] = await Promise.all([
      supabase.from('credit_cards').select('*').order('name'),
      supabase.from('asset_accounts').select('*').order('account_type', { ascending: true }),
    ]);

    if (cardsResult.error) {
      console.error('Error loading credit cards:', cardsResult.error);
    } else {
      setCreditCards(cardsResult.data || []);
    }

    if (accountsResult.error) {
      console.error('Error loading asset accounts:', accountsResult.error);
    } else {
      setAssetAccounts(accountsResult.data || []);
    }

    setLoading(false);
  };

  const handleAddCard = async () => {
    if (!user || !cardForm.name.trim()) return;

    const { error } = await supabase.from('credit_cards').insert([{
      user_id: user.id,
      ...cardForm,
      balance: Number(cardForm.balance),
      credit_limit: cardForm.credit_limit ? Number(cardForm.credit_limit) : null,
    }]);

    if (error) {
      console.error('Error adding credit card:', error);
      alert('Failed to add credit card');
    } else {
      setShowAddCard(false);
      setCardForm({ name: '', last_four: '', balance: 0, credit_limit: null });
      loadData();
    }
  };

  const handleUpdateCard = async () => {
    if (!user || !editingCard || !cardForm.name.trim()) return;

    const { error } = await supabase
      .from('credit_cards')
      .update({
        ...cardForm,
        balance: Number(cardForm.balance),
        credit_limit: cardForm.credit_limit ? Number(cardForm.credit_limit) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingCard.id);

    if (error) {
      console.error('Error updating credit card:', error);
      alert('Failed to update credit card');
    } else {
      setEditingCard(null);
      setCardForm({ name: '', last_four: '', balance: 0, credit_limit: null });
      loadData();
    }
  };

  const handleDeleteCard = async (card: CreditCard) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', card.id);

    if (error) {
      console.error('Error deleting credit card:', error);
      alert('Failed to delete credit card');
    } else {
      setDeletingCard(null);
      loadData();
    }
  };

  const handleAddAccount = async () => {
    if (!user || !accountForm.name.trim()) return;

    const { error } = await supabase.from('asset_accounts').insert([{
      user_id: user.id,
      ...accountForm,
      balance: Number(accountForm.balance),
    }]);

    if (error) {
      console.error('Error adding asset account:', error);
      alert('Failed to add asset account');
    } else {
      setShowAddAccount(false);
      setAccountForm({ name: '', account_type: 'checking', balance: 0 });
      loadData();
    }
  };

  const handleUpdateAccount = async () => {
    if (!user || !editingAccount || !accountForm.name.trim()) return;

    const { error } = await supabase
      .from('asset_accounts')
      .update({
        ...accountForm,
        balance: Number(accountForm.balance),
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingAccount.id);

    if (error) {
      console.error('Error updating asset account:', error);
      alert('Failed to update asset account');
    } else {
      setEditingAccount(null);
      setAccountForm({ name: '', account_type: 'checking', balance: 0 });
      loadData();
    }
  };

  const handleDeleteAccount = async (account: AssetAccount) => {
    const { error } = await supabase.from('asset_accounts').delete().eq('id', account.id);

    if (error) {
      console.error('Error deleting asset account:', error);
      alert('Failed to delete asset account');
    } else {
      setDeletingAccount(null);
      loadData();
    }
  };

  const openEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardForm({
      name: card.name,
      last_four: card.last_four || '',
      balance: card.balance,
      credit_limit: card.credit_limit,
    });
  };

  const openEditAccount = (account: AssetAccount) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Building2 size={20} className="text-blue-600" />;
      case 'savings': return <PiggyBank size={20} className="text-green-600" />;
      case 'investment': return <TrendingUp size={20} className="text-orange-600" />;
      default: return <Building2 size={20} className="text-gray-600" />;
    }
  };

  const totalDebt = creditCards.reduce((sum, card) => sum + card.balance, 0);
  const totalAssets = assetAccounts.reduce((sum, account) => sum + account.balance, 0);
  const netWorth = totalAssets - totalDebt;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#64748b]">loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 mb-1">total assets</div>
          <div className="text-2xl font-bold text-green-900">{formatCurrency(totalAssets)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
          <div className="text-sm text-red-700 mb-1">total debt</div>
          <div className="text-2xl font-bold text-red-900">{formatCurrency(totalDebt)}</div>
        </div>

        <div className={`bg-gradient-to-br p-6 rounded-lg border ${
          netWorth >= 0
            ? 'from-blue-50 to-blue-100 border-blue-200'
            : 'from-orange-50 to-orange-100 border-orange-200'
        }`}>
          <div className={`text-sm mb-1 ${netWorth >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            net worth
          </div>
          <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            {formatCurrency(netWorth)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
              <CreditCardIcon size={20} className="text-[#64748b]" />
              credit cards
            </h3>
            <button
              onClick={() => setShowAddCard(true)}
              className="px-3 py-1.5 text-sm bg-[#3b82f6] text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <Plus size={16} />
              add card
            </button>
          </div>

          <div className="space-y-3">
            {creditCards.length === 0 ? (
              <div className="text-center py-8 text-[#94a3b8] text-sm bg-gray-50 rounded-lg">
                no credit cards added
              </div>
            ) : (
              creditCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white border border-[#e2e8f0] rounded-lg p-4 hover:border-[#cbd5e1] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-[#1e293b] flex items-center gap-2">
                        {card.name}
                        {card.last_four && (
                          <span className="text-xs text-[#64748b] font-mono">••{card.last_four}</span>
                        )}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-red-600">
                        {formatCurrency(card.balance)}
                      </div>
                      {card.credit_limit && (
                        <div className="mt-1 text-xs text-[#64748b]">
                          limit: {formatCurrency(card.credit_limit)}
                          <span className="ml-2">
                            ({((card.balance / card.credit_limit) * 100).toFixed(1)}% used)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditCard(card)}
                        className="p-2 text-[#64748b] hover:text-[#3b82f6] hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingCard(card)}
                        className="p-2 text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
              <Building2 size={20} className="text-[#64748b]" />
              asset accounts
            </h3>
            <button
              onClick={() => setShowAddAccount(true)}
              className="px-3 py-1.5 text-sm bg-[#3b82f6] text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <Plus size={16} />
              add account
            </button>
          </div>

          <div className="space-y-3">
            {assetAccounts.length === 0 ? (
              <div className="text-center py-8 text-[#94a3b8] text-sm bg-gray-50 rounded-lg">
                no asset accounts added
              </div>
            ) : (
              assetAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white border border-[#e2e8f0] rounded-lg p-4 hover:border-[#cbd5e1] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-[#1e293b] flex items-center gap-2">
                        {getAccountIcon(account.account_type)}
                        {account.name}
                        <span className="text-xs text-[#64748b] capitalize bg-gray-100 px-2 py-0.5 rounded">
                          {account.account_type}
                        </span>
                      </div>
                      <div className="mt-2 text-lg font-semibold text-green-600">
                        {formatCurrency(account.balance)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditAccount(account)}
                        className="p-2 text-[#64748b] hover:text-[#3b82f6] hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingAccount(account)}
                        className="p-2 text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {(showAddCard || editingCard) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#1e293b] mb-4">
                {editingCard ? 'edit credit card' : 'add credit card'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1">
                    card name *
                  </label>
                  <input
                    type="text"
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    placeholder="e.g., Chase Sapphire"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1">
                    last 4 digits
                  </label>
                  <input
                    type="text"
                    value={cardForm.last_four || ''}
                    onChange={(e) => setCardForm({ ...cardForm, last_four: e.target.value.slice(0, 4) })}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1">
                    current balance *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cardForm.balance}
                    onChange={(e) => setCardForm({ ...cardForm, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1">
                    credit limit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cardForm.credit_limit || ''}
                    onChange={(e) => setCardForm({ ...cardForm, credit_limit: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    if (editingCard) {
                      setEditingCard(null);
                    } else {
                      setShowAddCard(false);
                    }
                    setCardForm({ name: '', last_four: '', balance: 0, credit_limit: null });
                  }}
                  className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-md hover:bg-gray-50 transition-colors"
                >
                  cancel
                </button>
                <button
                  onClick={editingCard ? handleUpdateCard : handleAddCard}
                  disabled={!cardForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCard ? 'update' : 'add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddAccount || editingAccount) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#1e293b] mb-4">
                {editingAccount ? 'edit asset account' : 'add asset account'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1">
                    account name *
                  </label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    placeholder="e.g., Chase Checking"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1">
                    account type *
                  </label>
                  <select
                    value={accountForm.account_type}
                    onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value as 'checking' | 'savings' | 'investment' })}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  >
                    <option value="checking">checking</option>
                    <option value="savings">savings</option>
                    <option value="investment">investment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1">
                    current balance *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    if (editingAccount) {
                      setEditingAccount(null);
                    } else {
                      setShowAddAccount(false);
                    }
                    setAccountForm({ name: '', account_type: 'checking', balance: 0 });
                  }}
                  className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-md hover:bg-gray-50 transition-colors"
                >
                  cancel
                </button>
                <button
                  onClick={editingAccount ? handleUpdateAccount : handleAddAccount}
                  disabled={!accountForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingAccount ? 'update' : 'add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingCard && (
        <ConfirmDialog
          title="delete credit card?"
          message={`are you sure you want to delete "${deletingCard.name}"? this cannot be undone.`}
          confirmText="delete"
          onConfirm={() => handleDeleteCard(deletingCard)}
          onCancel={() => setDeletingCard(null)}
        />
      )}

      {deletingAccount && (
        <ConfirmDialog
          title="delete asset account?"
          message={`are you sure you want to delete "${deletingAccount.name}"? this cannot be undone.`}
          confirmText="delete"
          onConfirm={() => handleDeleteAccount(deletingAccount)}
          onCancel={() => setDeletingAccount(null)}
        />
      )}
    </div>
  );
}
