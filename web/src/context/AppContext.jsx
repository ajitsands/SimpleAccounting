import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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
        toasts
      }}
    >
      {children}

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium transition-all duration-300 transform translate-y-0 ${
              t.type === 'error'
                ? 'bg-rose-600 text-white'
                : t.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
