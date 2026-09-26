import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../utils/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ReceiptText, 
  PlusCircle, 
  FileSpreadsheet,
  Paperclip,
  Calendar,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export default function Dashboard({ onViewAttachment }) {
  const { 
    formatMoney, 
    formatDate, 
    openAddModal, 
    setActiveTab, 
    settings,
    openEditModal,
    openVoucherModal 
  } = useApp();

  const [reportsData, setReportsData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch Reports Summary & Charts
      const repRes = await apiFetch('/api/reports.php');
      const repData = await repRes.json();
      if (repData.status === 'success') {
        setReportsData(repData);
      }

      // Fetch Recent 10 Transactions
      const txRes = await apiFetch('/api/transactions.php?limit=10');
      const txData = await txRes.json();
      if (txData.status === 'success') {
        setRecentTransactions(txData.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const summary = reportsData?.summary || {
    total_income: 0,
    total_expense: 0,
    net_profit: 0,
    bank_total_balance: 0,
    cash_total_balance: 0,
    net_liquidity: 0,
    transaction_count: 0
  };

  const monthlyTrend = reportsData?.monthly_trend || [];
  const categoryExpenses = reportsData?.category_expenses || [];
  const accountsSummary = reportsData?.accounts_summary || [];

  const isNetPositive = summary.net_profit >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Welcome & Quick Actions Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/30 text-sky-200 border border-sky-400/30">
              Bahrain & GCC / India Edition
            </span>
            <span className="text-xs text-slate-300">
              {settings.timezone || 'Asia/Bahrain'}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading">
            Financial Health & Accounting Overview
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Real-time tracking of income, expenses, bank balances, and receipts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openAddModal('expense')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md transition active:scale-95"
          >
            <TrendingDown className="w-4 h-4" />
            <span>- Add Expense</span>
          </button>
          
          <button
            onClick={() => openAddModal('income')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition active:scale-95"
          >
            <TrendingUp className="w-4 h-4" />
            <span>+ Add Income</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>Reports & Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Revenue / Income
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-heading">
            {formatMoney(summary.total_income)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Inflow Recorded</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Expenses
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-heading">
            {formatMoney(summary.total_expense)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Operational Outflow</span>
          </div>
        </div>

        {/* Net Balance / Profit */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Profit / Surplus
            </span>
            <div className={`p-2.5 rounded-xl border ${
              isNetPositive 
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800' 
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold mt-2 font-heading ${
            isNetPositive ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatMoney(summary.net_profit)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{isNetPositive ? 'Profitable Period' : 'Deficit / High Spend'}</span>
          </div>
        </div>

        {/* Total Liquidity (Bank + Cash) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bank & Cash Balances
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-heading">
            {formatMoney(summary.net_liquidity)}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Bank: {formatMoney(summary.bank_total_balance)}</span>
            <span>Cash: {formatMoney(summary.cash_total_balance)}</span>
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Inflow vs Outflow Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Monthly Income vs Expenses Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12-Month comparison ({settings.default_currency || 'BHD'})
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Annual View
            </span>
          </div>

          <div className="h-72 w-full">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(val) => formatMoney(val)} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly transaction records yet
              </div>
            )}
          </div>
        </div>

        {/* Expense Categories Breakdown Donut Chart (1 Col) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading mb-1">
              Top Expense Categories
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Spending distribution by category
            </p>

            <div className="h-52 w-full flex items-center justify-center">
              {categoryExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      dataKey="total_amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatMoney(val)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">No expense categories to show</p>
              )}
            </div>
          </div>

          {/* Top 3 Legend items */}
          <div className="space-y-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            {categoryExpenses.slice(0, 3).map((cat) => (
              <div key={cat.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white shrink-0">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Recent Transactions & Bank Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Recent Transactions & Receipts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest entries recorded via Web and Mobile App
              </p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                const isTransfer = tx.type === 'bank_transfer';
                
                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isIncome 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' 
                          : isExpense 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                      }`}>
                        {isIncome && <ArrowDownRight className="w-4 h-4" />}
                        {isExpense && <ArrowUpRight className="w-4 h-4" />}
                        {isTransfer && <CreditCard className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {tx.payee_payer || tx.category_name || (isTransfer ? 'Account Transfer' : 'General')}
                          </p>
                          <button
                            onClick={() => openVoucherModal(tx)}
                            title={tx.type === 'income' ? 'Print Official Receipt' : tx.type === 'bank_transfer' ? 'Print Transfer Voucher' : 'Print Payment Voucher'}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                          {tx.attachments && tx.attachments.length > 0 && (
                            <button
                              onClick={() => onViewAttachment(tx.attachments[0])}
                              title="View Attached Receipt"
                              className="p-1 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-200 transition"
                            >
                              <Paperclip className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{formatDate(tx.transaction_date)}</span>
                          <span>•</span>
                          <span>{tx.category_name || tx.payment_method || 'Cash'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold font-heading ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {isIncome ? '+' : isExpense ? '-' : ''}{formatMoney(tx.amount)}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {tx.from_account_name || tx.to_account_name || tx.payment_method}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No transactions recorded yet. Click '+ Add Entry' to record your first expense or income!
              </div>
            )}
          </div>
        </div>

        {/* Bank & Cash Accounts Snapshot (1 Col) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Bank & Cash Accounts
              </h3>
              <button
                onClick={() => setActiveTab('accounts')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {accountsSummary.map((acc) => (
                <div key={acc.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-300">
                        {acc.account_type === 'cash' ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{acc.account_name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{acc.bank_name || 'Cash'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white font-heading">
                      {formatMoney(acc.current_balance, acc.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => openAddModal('bank_transfer')}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
            >
              + Quick Bank / Cash Transfer
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
