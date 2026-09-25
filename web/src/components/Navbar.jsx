import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sun, Moon, PlusCircle, RefreshCw, Globe, Calendar, DollarSign, 
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';

export default function Navbar() {
  const { 
    theme, 
    toggleTheme, 
    settings, 
    openAddModal, 
    fetchInitialData,
    loading 
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 border border-sky-500/20">
              <img 
                src={settings.company_logo || "https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png"} 
                alt="SaNDSLab Logo" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  {settings.company_name || 'SaNDSLab Simple Accounting'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Live System
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                Financial Management & Expense Tracker
              </p>
            </div>
          </div>

          {/* Center Badges: Currency, Timezone & Date Format Info */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <DollarSign className="w-3.5 h-3.5 text-sky-500" />
              <span>Currency: <strong className="text-sky-600 dark:text-sky-400">{settings.default_currency || 'BHD'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Date: <strong className="text-indigo-600 dark:text-indigo-400">{settings.date_format || 'DD/MM/YYYY'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>TZ: <strong className="text-amber-600 dark:text-amber-400">{settings.timezone || 'Asia/Bahrain'}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Quick Add Expense / Income Button */}
            <div className="relative inline-flex rounded-xl shadow-sm">
              <button
                type="button"
                onClick={() => openAddModal('expense')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 transition shadow-md shadow-sky-500/20 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add Entry</span>
              </button>
            </div>

            {/* Reload Data Button */}
            <button
              onClick={fetchInitialData}
              title="Refresh Data"
              className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode (Default)' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
