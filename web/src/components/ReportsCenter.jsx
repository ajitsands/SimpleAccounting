import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Landmark, 
  Printer, 
  CheckCircle2,
  PieChart as PieIcon,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportsCenter() {
  const { 
    formatMoney, 
    formatDate, 
    settings, 
    addToast 
  } = useApp();

  const [timeframe, setTimeframe] = useState('this_month'); // 'today', 'this_week', 'this_month', 'last_month', 'this_year', 'custom'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to calculate date ranges
  const applyTimeframe = useCallback((tf) => {
    setTimeframe(tf);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (tf === 'today') {
      start = now;
      end = now;
    } else if (tf === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      end = new Date();
    } else if (tf === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (tf === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (tf === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    if (tf !== 'custom') {
      setDateFrom(start.toISOString().split('T')[0]);
      setDateTo(end.toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    applyTimeframe('this_month');
  }, [applyTimeframe]);

  const fetchReport = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      const repRes = await fetch(`/api/reports.php?date_from=${dateFrom}&date_to=${dateTo}`);
      const repData = await repRes.json();
      if (repData.status === 'success') {
        setReportData(repData);
      }

      // Also fetch detailed transactions for this range
      const txRes = await fetch(`/api/transactions.php?date_from=${dateFrom}&date_to=${dateTo}&limit=1000`);
      const txData = await txRes.json();
      if (txData.status === 'success') {
        setAllTransactions(txData.data || []);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load financial reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, addToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = reportData?.summary || {
    total_income: 0,
    total_expense: 0,
    net_profit: 0,
    bank_total_balance: 0,
    cash_total_balance: 0,
    net_liquidity: 0
  };

  const categoryExpenses = reportData?.category_expenses || [];
  const categoryIncome = reportData?.category_income || [];
  const accountsSummary = reportData?.accounts_summary || [];

  // Multi-Sheet Excel Workbook Export
  const exportComprehensiveExcel = () => {
    const curr = settings.default_currency || 'BHD';
    const dateFormat = settings.date_format || 'DD/MM/YYYY';
    const workbook = XLSX.utils.book_new();

    // 1. Executive Summary Sheet
    const summaryData = [
      ['COMPANY FINANCIAL STATEMENT'],
      ['Organization:', settings.company_name || 'SaNDSLab Simple Accounting'],
      ['Reporting Period:', `${formatDate(dateFrom)} to ${formatDate(dateTo)}`],
      ['Reporting Currency:', curr],
      ['Timezone:', settings.timezone || 'Asia/Bahrain'],
      ['Export Timestamp:', new Date().toLocaleString()],
      [],
      ['FINANCIAL SUMMARY', 'AMOUNT (' + curr + ')'],
      ['Total Inflow / Revenue', summary.total_income],
      ['Total Outflow / Expenses', summary.total_expense],
      ['Net Profit / Loss', summary.net_profit],
      ['Bank Accounts Balance', summary.bank_total_balance],
      ['Cash on Hand Balance', summary.cash_total_balance],
      ['Total Liquid Assets', summary.net_liquidity]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Executive Summary');

    // 2. Detailed Journal Sheet
    if (allTransactions.length > 0) {
      const txRows = allTransactions.map((t) => ({
        'ID': t.id,
        [`Date (${dateFormat})`]: formatDate(t.transaction_date),
        'Type': t.type.toUpperCase(),
        'Category': t.category_name || (t.type === 'bank_transfer' ? 'Transfer' : 'General'),
        'Paid From': t.from_account_name || '-',
        'Deposit To': t.to_account_name || '-',
        'Payee / Payer': t.payee_payer || '-',
        'Method': t.payment_method || 'Cash',
        'Reference #': t.reference_number || '-',
        [`Amount (${curr})`]: parseFloat(t.amount),
        'Receipt Attached': t.attachments && t.attachments.length > 0 ? 'Yes' : 'No',
        'Notes': t.notes || ''
      }));
      const wsTx = XLSX.utils.json_to_sheet(txRows);
      XLSX.utils.book_append_sheet(workbook, wsTx, 'Transactions Journal');
    }

    // 3. Expense Categories Breakdown Sheet
    if (categoryExpenses.length > 0) {
      const expRows = categoryExpenses.map((c) => ({
        'Category Name': c.name,
        'Transactions Count': c.transaction_count,
        [`Total Amount (${curr})`]: parseFloat(c.total_amount),
        'Share of Total Expense (%)': `${c.percentage}%`
      }));
      const wsExp = XLSX.utils.json_to_sheet(expRows);
      XLSX.utils.book_append_sheet(workbook, wsExp, 'Expense Breakdown');
    }

    // 4. Income Categories Breakdown Sheet
    if (categoryIncome.length > 0) {
      const incRows = categoryIncome.map((c) => ({
        'Category / Source': c.name,
        'Transactions Count': c.transaction_count,
        [`Total Amount (${curr})`]: parseFloat(c.total_amount),
        'Share of Total Income (%)': `${c.percentage}%`
      }));
      const wsInc = XLSX.utils.json_to_sheet(incRows);
      XLSX.utils.book_append_sheet(workbook, wsInc, 'Income Breakdown');
    }

    // 5. Bank & Cash Accounts Sheet
    if (accountsSummary.length > 0) {
      const accRows = accountsSummary.map((a) => ({
        'Account Name': a.account_name,
        'Type': a.account_type.toUpperCase(),
        'Bank Name': a.bank_name || 'Cash',
        'Currency': a.currency,
        'Current Live Balance': parseFloat(a.current_balance)
      }));
      const wsAcc = XLSX.utils.json_to_sheet(accRows);
      XLSX.utils.book_append_sheet(workbook, wsAcc, 'Account Balances');
    }

    const filename = `Financial_Report_${dateFrom}_to_${dateTo}_${curr}.xlsx`;
    XLSX.writeFile(workbook, filename);
    addToast('Excel Financial Statement generated successfully!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Reports Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
            Financial Statements & Report Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export official statements formatted in {settings.default_currency || 'BHD'} currency
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={exportComprehensiveExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Full Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Timeframe Selector Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_year', label: 'This Year' },
            { id: 'custom', label: 'Custom Range' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => applyTimeframe(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                timeframe === btn.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Date From & To Range */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setTimeframe('custom'); }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setTimeframe('custom'); }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

      </div>

      {/* KPI Cards for the Selected Range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 mb-1">
            <span>Period Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
            {formatMoney(summary.total_income)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 mb-1">
            <span>Period Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-heading">
            {formatMoney(summary.total_expense)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 mb-1">
            <span>Period Net Profit</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <p className={`text-2xl font-extrabold font-heading ${
            summary.net_profit >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatMoney(summary.net_profit)}
          </p>
        </div>

      </div>

      {/* Profit & Loss Table Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Expense Breakdown by Category */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading mb-1 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span>Operating Expense Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Total of {categoryExpenses.length} expense categories in period
          </p>

          <div className="space-y-3">
            {categoryExpenses.length > 0 ? (
              categoryExpenses.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">({cat.transaction_count} items)</span>
                    </div>
                    <div className="text-right font-bold text-slate-900 dark:text-white">
                      <span>{formatMoney(cat.total_amount)}</span>
                      <span className="ml-2 text-[10px] text-slate-400 font-normal">({cat.percentage}%)</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, cat.percentage)}%`, backgroundColor: cat.color || '#EF4444' }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No expenses in this period</p>
            )}
          </div>
        </div>

        {/* Income Sources Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Income & Revenue Sources</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Total of {categoryIncome.length} revenue streams in period
          </p>

          <div className="space-y-3">
            {categoryIncome.length > 0 ? (
              categoryIncome.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">({cat.transaction_count} items)</span>
                    </div>
                    <div className="text-right font-bold text-slate-900 dark:text-white">
                      <span>{formatMoney(cat.total_amount)}</span>
                      <span className="ml-2 text-[10px] text-slate-400 font-normal">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, cat.percentage)}%`, backgroundColor: cat.color || '#10B981' }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No revenue recorded in this period</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
