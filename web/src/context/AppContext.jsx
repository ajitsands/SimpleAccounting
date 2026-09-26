import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme state - default Light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sa_theme') || 'light';
  });

  // System Settings
  const [settings, setSettings] = useState({
    default_currency: 'BHD',
    timezone: 'Asia/Bahrain',
    date_format: 'DD/MM/YYYY',
    company_name: 'SaNDSLab Simple Accounting',
    company_logo: 'https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png',
    company_email: 'accounts@sandslab.com',
    company_phone: '+973 3333 4444',
    company_address: 'Suite 402, Building 882, Road 3618, Block 436, Seef District, Kingdom of Bahrain',
    tax_number: 'BH-VAT-987654321'
  });

  const [currencies, setCurrencies] = useState([]);
  const [timezones, setTimezones] = useState([]);
  const [dateFormats, setDateFormats] = useState([]);
  
  // Accounts and Categories
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transactions', 'reports', 'accounts', 'categories', 'settings'

  // Modal State for Quick Add & Edit
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultModalType, setDefaultModalType] = useState('expense');

  // Modal State for Printable Voucher & Receipt
  const [voucherTransaction, setVoucherTransaction] = useState(null);

  // Confirmation Popup State (Promise-based)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Are you sure?',
    message: 'This action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    resolve: null
  });

  const confirmAction = useCallback(({
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
  }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmDialog.resolve) confirmDialog.resolve(true);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmDialog]);

  const handleCancel = useCallback(() => {
    if (confirmDialog.resolve) confirmDialog.resolve(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmDialog]);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Apply theme to document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sa_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch Settings, Currencies, Accounts, Categories
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Settings
      const setRes = await fetch('/api/settings.php');
      const setData = await setRes.json();
      if (setData.status === 'success') {
        if (setData.settings) setSettings(setData.settings);
        if (setData.currencies) setCurrencies(setData.currencies);
        if (setData.timezones) setTimezones(setData.timezones);
        if (setData.date_formats) setDateFormats(setData.date_formats);
      }

      // 2. Accounts
      const accRes = await fetch('/api/accounts.php');
      const accData = await accRes.json();
      if (accData.status === 'success') {
        setAccounts(accData.data || []);
      }

      // 3. Categories
      const catRes = await fetch('/api/categories.php');
      const catData = await catRes.json();
      if (catData.status === 'success') {
        setCategories(catData.data || []);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      addToast('Failed to connect to Simple Accounting API', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Helper: Money Formatter supporting 3 decimals for BHD/KWD/OMR, and 2 for INR/AED/SAR
  const formatMoney = useCallback((amount, customCurr = null) => {
    const num = parseFloat(amount) || 0;
    const currCode = customCurr || settings.default_currency || 'BHD';
    
    // Find currency config
    const curr = currencies.find((c) => c.code === currCode);
    const decimals = curr ? curr.decimal_digits : (['BHD', 'KWD', 'OMR'].includes(currCode) ? 3 : 2);
    const symbol = curr ? curr.symbol : currCode;

    const formattedNum = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    if (currCode === 'INR') {
      return `₹ ${formattedNum}`;
    }
    if (currCode === 'USD') {
      return `$ ${formattedNum}`;
    }
    if (currCode === 'EUR') {
      return `€ ${formattedNum}`;
    }
    if (currCode === 'GBP') {
      return `£ ${formattedNum}`;
    }

    return `${formattedNum} ${symbol}`;
  }, [settings.default_currency, currencies]);

  // Helper: Date Formatter based on selected Admin format
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIndex = parseInt(month, 10) - 1;
        const monthShort = monthNames[mIndex] || month;

        const fmt = settings.date_format || 'DD/MM/YYYY';
        if (fmt === 'DD/MM/YYYY') {
          return `${day}/${month}/${year}`;
        }
        if (fmt === 'YYYY-MM-DD') {
          return `${year}-${month}-${day}`;
        }
        if (fmt === 'MM/DD/YYYY') {
          return `${month}/${day}/${year}`;
        }
        if (fmt === 'DD-MMM-YYYY') {
          return `${day}-${monthShort}-${year}`;
        }
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }, [settings.date_format]);

  const openAddModal = (type = 'expense') => {
    setEditingTransaction(null);
    setDefaultModalType(type);
    setIsTransactionModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTransaction(tx);
    setDefaultModalType(tx.type || 'expense');
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const openVoucherModal = (tx) => {
    setVoucherTransaction(tx);
  };

  const closeVoucherModal = () => {
    setVoucherTransaction(null);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        settings,
        setSettings,
        currencies,
        timezones,
        dateFormats,
        accounts,
        categories,
        loading,
        activeTab,
        setActiveTab,
        formatMoney,
        formatDate,
        isTransactionModalOpen,
        openAddModal,
        openEditModal,
        closeTransactionModal,
        editingTransaction,
        defaultModalType,
        voucherTransaction,
        openVoucherModal,
        closeVoucherModal,
        fetchInitialData,
        addToast,
        confirmAction,
        toasts
      }}
    >
      {children}

      {/* Global Promise-based Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Modern Floating Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-[110] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-2xl border flex items-start gap-3 text-sm font-medium transition-all duration-300 transform translate-y-0 backdrop-blur-md animate-slide-in ${
                isError
                  ? 'bg-rose-950/90 text-rose-100 border-rose-800/80 shadow-rose-950/50'
                  : isSuccess
                  ? 'bg-emerald-950/90 text-emerald-100 border-emerald-800/80 shadow-emerald-950/50'
                  : isWarning
                  ? 'bg-amber-950/90 text-amber-100 border-amber-800/80 shadow-amber-950/50'
                  : 'bg-slate-900/90 text-slate-100 border-slate-700/80 shadow-slate-950/50 dark:bg-slate-800/95'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
              </div>
              <div className="flex-1 text-xs sm:text-sm leading-snug">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-0.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
