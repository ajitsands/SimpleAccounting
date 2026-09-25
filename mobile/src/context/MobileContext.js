import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MobileContext = createContext();

export const MobileProvider = ({ children }) => {
  // Theme: default Light
  const [theme, setTheme] = useState('light');

  // Default API Host (LAN Wi-Fi 192.168.8.11:3031, USB ADB reverse uses localhost:3031)
  const defaultApiHost = 'http://192.168.8.11:3031';
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiHost);

  // Settings
  const [settings, setSettings] = useState({
    default_currency: 'BHD',
    timezone: 'Asia/Bahrain',
    date_format: 'DD/MM/YYYY',
    company_name: 'SaNDSLab Simple Accounting',
    company_address: 'Suite 402, Building 882, Road 3618, Block 436, Seef District, Kingdom of Bahrain',
    company_email: 'accounts@sandslab.com',
    company_phone: '+973 3333 4444',
    tax_number: 'BH-VAT-987654321'
  });

  const [currencies, setCurrencies] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'connected', 'error', 'checking'

  // Load saved API URL & Theme
  useEffect(() => {
    (async () => {
      try {
        const savedUrl = await AsyncStorage.getItem('sa_api_url');
        if (savedUrl) setApiBaseUrl(savedUrl);

        const savedTheme = await AsyncStorage.getItem('sa_theme');
        if (savedTheme) setTheme(savedTheme);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const saveApiBaseUrl = async (url) => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    setApiBaseUrl(cleanUrl);
    await AsyncStorage.setItem('sa_api_url', cleanUrl);
    fetchData(cleanUrl);
  };

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await AsyncStorage.setItem('sa_theme', next);
  };

  const fetchData = useCallback(async (baseUrl = apiBaseUrl) => {
    try {
      setLoading(true);
      setConnectionStatus('checking');

      // 1. Settings
      const setRes = await fetch(`${baseUrl}/api/settings.php`);
      const setData = await setRes.json();
      if (setData.status === 'success') {
        setSettings(setData.settings || {});
        setCurrencies(setData.currencies || []);
        setConnectionStatus('connected');
      }

      // 2. Accounts
      const accRes = await fetch(`${baseUrl}/api/accounts.php`);
      const accData = await accRes.json();
      if (accData.status === 'success') {
        setAccounts(accData.data || []);
      }

      // 3. Categories
      const catRes = await fetch(`${baseUrl}/api/categories.php`);
      const catData = await catRes.json();
      if (catData.status === 'success') {
        setCategories(catData.data || []);
      }
    } catch (error) {
      console.error('API Error:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format Money helper
  const formatMoney = (amount, customCurr = null) => {
    const num = parseFloat(amount) || 0;
    const currCode = customCurr || settings.default_currency || 'BHD';
    const is3Dec = ['BHD', 'KWD', 'OMR'].includes(currCode);
    const decimals = is3Dec ? 3 : 2;

    const formatted = num.toFixed(decimals);
    if (currCode === 'INR') return `₹ ${formatted}`;
    if (currCode === 'USD') return `$ ${formatted}`;
    if (currCode === 'EUR') return `€ ${formatted}`;
    return `${formatted} ${currCode}`;
  };

  // Format Date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const fmt = settings.date_format || 'DD/MM/YYYY';
        if (fmt === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
        if (fmt === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
        if (fmt === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <MobileContext.Provider
      value={{
        theme,
        toggleTheme,
        apiBaseUrl,
        saveApiBaseUrl,
        settings,
        accounts,
        categories,
        loading,
        connectionStatus,
        fetchData,
        formatMoney,
        formatDate
      }}
    >
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = () => useContext(MobileContext);
