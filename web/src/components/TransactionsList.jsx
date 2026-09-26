import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  Paperclip, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  Activity,
  FileSpreadsheet,
  Calendar,
  X,
  PlusCircle,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TransactionsList({ onViewAttachment }) {
  const { 
    formatMoney, 
    formatDate, 
    categories, 
    accounts, 
    settings, 
    openAddModal, 
    openEditModal, 
    openVoucherModal,
    fetchInitialData, 
    addToast,
    confirmAction,
    isAuditor
  } = useApp();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (accountFilter) params.append('account_id', accountFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('limit', '300');

      const res = await fetch(`/api/transactions.php?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setTransactions(data.data || []);
      } else {
        addToast(data.message || 'Error loading transactions', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, categoryFilter, accountFilter, dateFrom, dateTo, addToast]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [fetchTransactions]);

  const handleDelete = async (id, voucherNo) => {
    const confirmed = await confirmAction({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete transaction ${voucherNo ? `(Voucher: ${voucherNo})` : ''}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/transactions.php?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        addToast('Transaction deleted successfully', 'success');
        fetchTransactions();
        fetchInitialData();
      } else {
        addToast(data.message || 'Error deleting transaction', 'error');
      }
    } catch (err) {
      addToast('Error communicating with server', 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setAccountFilter('');
    setDateFrom('');
    setDateTo('');
  };

  // Export current filtered view to Excel (XLSX)
  const exportToExcel = () => {
    if (transactions.length === 0) {
      addToast('No transactions to export', 'error');
      return;
    }

    const curr = settings.default_currency || 'BHD';
    const dateFormat = settings.date_format || 'DD/MM/YYYY';

    const exportRows = transactions.map((t) => ({
      'ID': t.id,
      [`Date (${dateFormat})`]: formatDate(t.transaction_date),
      'Type': t.type.toUpperCase(),
      'Category': t.category_name || (t.type === 'bank_transfer' ? 'Transfer' : 'General'),
      'Paid From': t.from_account_name || '-',
      'Deposit To': t.to_account_name || '-',
      'Payee / Payer': t.payee_payer || '-',
      'Method': t.payment_method || 'Cash',
      'Reference / Invoice': t.reference_number || '-',
      [`Amount (${curr})`]: parseFloat(t.amount),
      'Attachments': t.attachments && t.attachments.length > 0 ? `${t.attachments.length} Attached` : 'None',
      'Status': t.status.toUpperCase(),
      'Notes': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    
    // Auto column sizing
    const colWidths = [
      { wch: 6 },  // ID
      { wch: 14 }, // Date
      { wch: 14 }, // Type
      { wch: 24 }, // Category
      { wch: 20 }, // Paid From
      { wch: 20 }, // Deposit To
      { wch: 22 }, // Payee
      { wch: 14 }, // Method
      { wch: 16 }, // Reference
      { wch: 16 }, // Amount
      { wch: 14 }, // Attachments
      { wch: 12 }, // Status
      { wch: 30 }  // Notes
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Transactions_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast('Excel Ledger Exported Successfully!', 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            Transactions & Attachments Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, filter, review receipts, and export transaction journals
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => openAddModal('expense')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        
        {/* Search & Type Switcher Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Payee, Invoice #, Notes, Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: '', label: 'All Types' },
              { id: 'expense', label: 'Expenses', color: 'rose' },
              { id: 'income', label: 'Income', color: 'emerald' },
              { id: 'bank_transfer', label: 'Transfers', color: 'indigo' },
              { id: 'other', label: 'Other', color: 'purple' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTypeFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  typeFilter === btn.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Row: Category, Account, Date From, Date To */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              title="Filter From Date"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              title="Filter To Date"
            />
            {(search || typeFilter || categoryFilter || accountFilter || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                title="Clear Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Transactions Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date ({settings.date_format || 'DD/MM/YYYY'})</th>
                <th className="py-3.5 px-4">Type & Category</th>
                <th className="py-3.5 px-4">Account / Source</th>
                <th className="py-3.5 px-4">Payee / Description</th>
                <th className="py-3.5 px-4">Ref #</th>
                <th className="py-3.5 px-4 text-right">Amount ({settings.default_currency || 'BHD'})</th>
                <th className="py-3.5 px-4 text-center">Receipt</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'bank_transfer';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      
                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>

                      {/* Type & Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: tx.category_color || (isIncome ? '#10B981' : isExpense ? '#EF4444' : '#6366F1') }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.category_name || (isTransfer ? 'Transfer' : 'General')}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : isExpense
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                          }`}>
                            {tx.type}
                          </span>
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {isTransfer ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {tx.from_account_name || 'Bank'} &rarr; {tx.to_account_name || 'Cash'}
                          </span>
                        ) : (
                          tx.from_account_name || tx.to_account_name || tx.payment_method || 'Cash'
                        )}
                      </td>

                      {/* Payee / Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {tx.payee_payer || '-'}
                          </p>
                          {tx.items && tx.items.length > 1 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                              {tx.items.length} Items
                            </span>
                          )}
                        </div>
                        {tx.notes && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {tx.notes}
                          </p>
                        )}
                      </td>

                      {/* Voucher & Reference # */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {tx.voucher_no ? (
                          <div>
                            <span className="font-extrabold text-sky-700 dark:text-sky-400 block">{tx.voucher_no}</span>
                            {tx.reference_number && (
                              <span className="text-[10px] text-slate-400 font-normal">Ref: {tx.reference_number}</span>
                            )}
                          </div>
                        ) : (
                          tx.reference_number || '-'
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`text-sm font-extrabold font-heading ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {isIncome ? '+' : isExpense ? '-' : ''}{formatMoney(tx.amount)}
                        </span>
                      </td>

                      {/* Attachment */}
                      <td className="py-3.5 px-4 text-center">
                        {tx.attachments && tx.attachments.length > 0 ? (
                          <button
                            onClick={() => onViewAttachment(tx.attachments[0])}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition border border-sky-200 dark:border-sky-800 text-[11px] font-bold"
                            title="View Attached Receipt"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{tx.attachments.length}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openVoucherModal(tx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                            title={tx.type === 'income' ? 'Print Official Receipt' : tx.type === 'bank_transfer' ? 'Print Transfer Voucher' : 'Print Payment Voucher'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isAuditor && (
                            <>
                              <button
                                onClick={() => openEditModal(tx)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(tx.id, tx.voucher_no || tx.reference_number)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {loading ? 'Loading transactions...' : 'No transactions found matching your criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
