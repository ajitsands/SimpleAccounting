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
  Sun, 
  Moon, 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  Globe, 
  TrendingDown, 
  TrendingUp,
  Wallet
} from 'lucide-react';

export default function HorizontalNavbar() {
  const { 
    theme, 
    toggleTheme, 
    settings, 
    activeTab, 
    setActiveTab, 
    openAddModal, 
    fetchInitialData,
    loading 
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'transactions', label: 'Transactions & Receipts', icon: ReceiptText, badge: null },
    { id: 'reports', label: 'Reports & Excel Export', icon: BarChart3, badge: 'XLSX' },
    { id: 'accounts', label: 'Bank & Cash Accounts', icon: Landmark, badge: null },
    { id: 'categories', label: 'Categories', icon: Tags, badge: null },
    { id: 'settings', label: 'Admin Settings', icon: Settings, badge: null },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      
      {/* Top Header Row: Logo, Currency/Timezone Badges, Action Buttons */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-100 dark:border-slate-800/80">
          
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 border border-sky-500/20">
              <img 
                src={settings.company_logo || "https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png"} 
                alt="SaNDSLab Logo" 
                className="h-8 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  {settings.company_name || 'SaNDSLab Simple Accounting'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Live System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Financial Management & Expense Tracker
              </p>
            </div>
          </div>

          {/* Center Badges: Currency, Timezone & Date Format Info */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <DollarSign className="w-3.5 h-3.5 text-sky-500" />
              <span>Currency: <strong className="text-sky-600 dark:text-sky-400">{settings.default_currency || 'BHD'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Date: <strong className="text-indigo-600 dark:text-indigo-400">{settings.date_format || 'DD/MM/YYYY'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>TZ: <strong className="text-amber-600 dark:text-amber-400">{settings.timezone || 'Asia/Bahrain'}</strong></span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => openAddModal('expense')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition shadow-sm shadow-rose-500/20 active:scale-95"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">- Expense</span>
            </button>

            <button
              onClick={() => openAddModal('income')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm shadow-emerald-500/20 active:scale-95"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Income</span>
            </button>

            <button
              onClick={() => openAddModal('expense')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 transition shadow-md shadow-sky-500/20 active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchInitialData}
              title="Refresh Live Data"
              className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode (Default)' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>
          </div>

        </div>

        {/* Horizontal Navigation Menu Row */}
        <div className="flex items-center justify-between overflow-x-auto py-2 scrollbar-none">
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right helper text */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
            <Wallet className="w-3.5 h-3.5 text-sky-500" />
            <span>Connected: <strong>localhost:3031</strong></span>
          </div>
        </div>

      </div>
    </header>
  );
}
