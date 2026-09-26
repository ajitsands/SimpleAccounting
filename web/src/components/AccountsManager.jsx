import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Landmark, 
  Wallet, 
  CreditCard, 
  Plus, 
  ArrowRightLeft, 
  Check, 
  X, 
  DollarSign, 
  Edit2, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';

export default function AccountsManager() {
  const { 
    accounts, 
    formatMoney, 
    settings, 
    currencies, 
    fetchInitialData, 
    openAddModal, 
    addToast,
    confirmAction
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [currency, setCurrency] = useState('BHD');
  const [initialBalance, setInitialBalance] = useState('0.000');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingAcc(null);
    setName('');
    setType('bank');
    setAccountNumber('');
    setBankName('');
    setCurrency(settings.default_currency || 'BHD');
    setInitialBalance('0.000');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEdit = (acc) => {
    setEditingAcc(acc);
    setName(acc.account_name);
    setType(acc.account_type);
    setAccountNumber(acc.account_number || '');
    setBankName(acc.bank_name || '');
    setCurrency(acc.currency || 'BHD');
    setInitialBalance(String(acc.initial_balance || 0));
    setDescription(acc.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Account name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        account_name: name.trim(),
        account_type: type,
        account_number: accountNumber.trim(),
        bank_name: bankName.trim(),
        currency,
        initial_balance: parseFloat(initialBalance) || 0,
        description: description.trim()
      };

      let method = 'POST';
      if (editingAcc) {
        payload.id = editingAcc.id;
        method = 'PUT';
      }

      const res = await fetch('/api/accounts.php', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.status === 'success') {
        addToast(editingAcc ? 'Account updated' : 'Account created', 'success');
        setIsModalOpen(false);
        fetchInitialData();
      } else {
        addToast(data.message || 'Error saving account', 'error');
      }
    } catch (err) {
      addToast('Error communicating with server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, accName) => {
    const confirmed = await confirmAction({
      title: 'Deactivate Account',
      message: `Are you sure you want to deactivate ${accName ? `"${accName}"` : 'this account'}? Existing transactions and accounting records will remain preserved.`,
      confirmText: 'Yes, Deactivate',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/accounts.php?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        addToast('Account deactivated successfully', 'success');
        fetchInitialData();
      } else {
        addToast(data.message || 'Failed to deactivate account', 'error');
      }
    } catch (err) {
      addToast('Failed to delete account', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            Bank & Cash Accounts Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time balance reconciliation for corporate banks and petty cash drawers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openAddModal('bank_transfer')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Funds</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Account</span>
          </button>
        </div>
      </div>

      {/* Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isBank = acc.account_type === 'bank';
          const isCash = acc.account_type === 'cash';

          return (
            <div 
              key={acc.id} 
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between card-hover relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${
                    isBank 
                      ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-100 dark:border-sky-800' 
                      : isCash 
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-100 dark:border-amber-800'
                      : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-100 dark:border-purple-800'
                  }`}>
                    {isCash ? <Wallet className="w-6 h-6" /> : isBank ? <Landmark className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {acc.account_type}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                    {acc.account_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {acc.bank_name ? `${acc.bank_name}` : 'Cash Account'} {acc.account_number ? `• ${acc.account_number}` : ''}
                  </p>
                </div>

                {/* Balance Display */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Live Current Balance
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
                    {formatMoney(acc.current_balance, acc.currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Initial Balance: {formatMoney(acc.initial_balance, acc.currency)}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Currency: <strong>{acc.currency}</strong></span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(acc)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
                    title="Edit Account"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id, acc.account_name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                    title="Deactivate Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal for Add / Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white font-heading text-lg">
                {editingAcc ? 'Edit Account' : 'Add Bank / Cash Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahli United Bank Operating"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash / Petty Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="digital_wallet">Digital Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.country} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Bank / Institution Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NBB / BBK / AUB"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Account / IBAN Number
                  </label>
                  <input
                    type="text"
                    placeholder="BH92..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Initial Opening Balance ({currency})
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow transition"
                >
                  {submitting ? 'Saving...' : editingAcc ? 'Update' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
