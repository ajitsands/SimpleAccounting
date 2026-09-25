import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  ReceiptText, 
  BarChart3, 
  Landmark, 
  Tags, 
  Settings,
  PlusCircle,
  FileSpreadsheet,
  Wallet
} from 'lucide-react';

export default function Sidebar() {
  const { activeTab, setActiveTab, openAddModal } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'transactions', label: 'Transactions & Receipts', icon: ReceiptText, badge: null },
    { id: 'reports', label: 'Reports & Excel Export', icon: BarChart3, badge: 'XLSX' },
    { id: 'accounts', label: 'Bank & Cash Accounts', icon: Landmark, badge: null },
    { id: 'categories', label: 'Categories', icon: Tags, badge: null },
    { id: 'settings', label: 'Admin Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
      
      {/* Quick Entry Callout */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 border border-sky-100 dark:border-slate-700/60">
          <p className="text-xs font-semibold text-sky-800 dark:text-sky-300 mb-2">
            Record Daily Transactions
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => openAddModal('expense')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-1 transition shadow-sm shadow-rose-500/20"
            >
              <span>- Expense</span>
            </button>
            <button
              onClick={() => openAddModal('income')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 transition shadow-sm shadow-emerald-500/20"
            >
              <span>+ Income</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="p-3 space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-semibold border border-sky-200/80 dark:border-sky-800/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile App Sync Helper Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Wallet className="w-3.5 h-3.5 text-sky-500" />
          <span>Mobile App Sync: <strong>Ready</strong></span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Port 3031 • GCC / Bahrain BHD
        </p>
      </div>

    </aside>
  );
}
