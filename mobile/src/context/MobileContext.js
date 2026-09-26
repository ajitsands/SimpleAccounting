import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MobileContext = createContext();

export const MobileProvider = ({ children }) => {
  // Theme: default Light
  const [theme, setTheme] = useState('light');

  // Default API Host (Production Cloud domain)
  const defaultApiHost = 'https://simpleacc.sandslab.com';
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiHost);

  // User & Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [authChecking, setAuthChecking] = useState(true);

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
  const [isEndpointConfigured, setIsEndpointConfigured] = useState(false);

  // Load saved API URL, User, & Theme
  useEffect(() => {
    (async () => {
      try {
        const savedUrl = await AsyncStorage.getItem('sa_api_url');
        if (savedUrl) {
          setApiBaseUrl(savedUrl);
        } else {
          setApiBaseUrl('https://simpleacc.sandslab.com');
          await AsyncStorage.setItem('sa_api_url', 'https://simpleacc.sandslab.com');
        }

        const configured = await AsyncStorage.getItem('sa_endpoint_configured');
        if (configured === 'true') {
          setIsEndpointConfigured(true);
        } else {
          setIsEndpointConfigured(false);
        }

        const savedToken = await AsyncStorage.getItem('sa_mobile_token');
        const savedUser = await AsyncStorage.getItem('sa_mobile_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }

        const savedTheme = await AsyncStorage.getItem('sa_theme');
        if (savedTheme) setTheme(savedTheme);
      } catch (e) {
        console.error(e);
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  const saveApiBaseUrl = async (url, markConfigured = true) => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    setApiBaseUrl(cleanUrl);
    await AsyncStorage.setItem('sa_api_url', cleanUrl);
    if (markConfigured) {
      setIsEndpointConfigured(true);
      await AsyncStorage.setItem('sa_endpoint_configured', 'true');
    }
    fetchData(cleanUrl);
  };

  const resetEndpointConfig = async () => {
    setIsEndpointConfigured(false);
    setConnectionStatus('checking');
    await AsyncStorage.removeItem('sa_endpoint_configured');
  };

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await AsyncStorage.setItem('sa_theme', next);
  };

  // Login handler
  const login = async (username, password) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, client_type: 'mobile' })
      });
      const data = await res.json();

      if (data.status === 'success' && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        await AsyncStorage.setItem('sa_mobile_token', data.token);
        await AsyncStorage.setItem('sa_mobile_user', JSON.stringify(data.user));
        fetchData(apiBaseUrl);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      return { success: false, message: 'Could not connect to accounting server. Check your network or URL.' };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${apiBaseUrl}/api/auth.php?action=logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setToken('');
      setUser(null);
      await AsyncStorage.removeItem('sa_mobile_token');
      await AsyncStorage.removeItem('sa_mobile_user');
    }
  };

  const fetchData = useCallback(async (baseUrl = apiBaseUrl) => {
    try {
      setLoading(true);
      setConnectionStatus('checking');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // 1. Settings
      const setRes = await fetch(`${baseUrl}/api/settings.php`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!setRes.ok) {
        throw new Error(`Server returned HTTP ${setRes.status}`);
      }

      const setData = await setRes.json();
      if (setData.status === 'success') {
        setSettings(setData.settings || {});
        setCurrencies(setData.currencies || []);
        setConnectionStatus('connected');
      } else {
        throw new Error(setData.message || 'Invalid API response');
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
      console.error('API Connection Error:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (isEndpointConfigured) {
      fetchData();
    }
  }, [isEndpointConfigured, fetchData]);

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
        user,
        token,
        isAuthenticated: !!user,
        authChecking,
        login,
        logout,
        apiBaseUrl,
        saveApiBaseUrl,
        settings,
        accounts,
        categories,
        loading,
        connectionStatus,
        isEndpointConfigured,
        setIsEndpointConfigured,
        resetEndpointConfig,
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
