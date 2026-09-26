import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../utils/api';
import { 
  Settings, 
  DollarSign, 
  Globe, 
  Calendar, 
  Building, 
  Image, 
  Save, 
  Check, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Flag, 
  MapPin, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

export default function SettingsManager() {
  const { 
    settings, 
    setSettings, 
    currencies, 
    timezones, 
    dateFormats, 
    fetchInitialData, 
    addToast,
    confirmAction,
    isAdmin,
    user
  } = useApp();

  const [formData, setFormData] = useState({
    default_currency: 'BHD',
    timezone: 'Asia/Bahrain',
    date_format: 'DD/MM/YYYY',
    company_name: 'SaNDSLab Simple Accounting',
    company_logo: 'https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png',
    company_email: 'accounts@sandslab.com',
    company_phone: '+973 3333 4444',
    company_address: 'Suite 402, Building 882, Road 3618, Block 436, Seef District, Kingdom of Bahrain',
    tax_number: 'BH-VAT-987654321',
    default_theme: 'light'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        default_currency: settings.default_currency || 'BHD',
        timezone: settings.timezone || 'Asia/Bahrain',
        date_format: settings.date_format || 'DD/MM/YYYY',
        company_name: settings.company_name || 'SaNDSLab Simple Accounting',
        company_logo: settings.company_logo || 'https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png',
        company_email: settings.company_email || 'accounts@sandslab.com',
        company_phone: settings.company_phone || '+973 3333 4444',
        company_address: settings.company_address || '',
        tax_number: settings.tax_number || 'BH-VAT-987654321',
        default_theme: settings.default_theme || 'light'
      });
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/api/settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        addToast('Settings & Regional preferences updated!', 'success');
        setSettings(data.settings);
        fetchInitialData();
      } else {
        addToast(data.message || 'Error updating settings', 'error');
      }
    } catch (err) {
      addToast('Failed to communicate with server', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
          System Settings & Regional Configuration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure Default Currency (Bahrain BHD / GCC / India), Timezone, Date Format, and Company Details
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Regional & Financial Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Currency, Timezone & Date Format
              </h2>
              <p className="text-[11px] text-slate-400">
                Applied across Web reports, Excel exports, and Mobile entry
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Currency */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-sky-500" />
                <span>Default Currency</span>
              </label>
              <select
                value={formData.default_currency}
                onChange={(e) => handleChange('default_currency', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              >
                <optgroup label="GCC Countries (Primary)">
                  <option value="BHD">Bahrain - BHD (BD, 3 Decimals) [Default]</option>
                  <option value="SAR">Saudi Arabia - SAR (SR, 2 Decimals)</option>
                  <option value="AED">UAE - AED (Dirham, 2 Decimals)</option>
                  <option value="QAR">Qatar - QAR (QR, 2 Decimals)</option>
                  <option value="KWD">Kuwait - KWD (KD, 3 Decimals)</option>
                  <option value="OMR">Oman - OMR (RO, 3 Decimals)</option>
                </optgroup>
                <optgroup label="South Asia">
                  <option value="INR">India - INR (₹, 2 Decimals)</option>
                </optgroup>
                <optgroup label="International">
                  <option value="USD">United States - USD ($)</option>
                  <option value="EUR">Eurozone - EUR (€)</option>
                  <option value="GBP">United Kingdom - GBP (£)</option>
                </optgroup>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                {formData.default_currency === 'BHD' ? '★ Bahrain BHD uses standard 3 decimal places (e.g. 15.250 BD)' : 'Formatted with standard decimal precision'}
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>Timezone</span>
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              >
                <optgroup label="GCC & South Asia">
                  <option value="Asia/Bahrain">Bahrain (GMT+3)</option>
                  <option value="Asia/Riyadh">Saudi Arabia (GMT+3)</option>
                  <option value="Asia/Dubai">UAE (GMT+4)</option>
                  <option value="Asia/Qatar">Qatar (GMT+3)</option>
                  <option value="Asia/Kuwait">Kuwait (GMT+3)</option>
                  <option value="Asia/Muscat">Oman (GMT+4)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST GMT+5:30)</option>
                </optgroup>
                <optgroup label="Global">
                  <option value="UTC">Universal Time (UTC)</option>
                  <option value="Europe/London">London / UK</option>
                  <option value="America/New_York">Eastern Time (US)</option>
                </optgroup>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Server & timestamps timezone
              </p>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Date Display Format</span>
              </label>
              <select
                value={formData.date_format}
                onChange={(e) => handleChange('date_format', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (21/09/2026) - Bahrain/India</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-21) - ISO</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (09/21/2026) - US</option>
                <option value="DD-MMM-YYYY">DD-MMM-YYYY (21-Sep-2026)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Used in Tables, Charts, & Excel exports
              </p>
            </div>

          </div>
        </div>

        {/* Section 2: Company & Branding Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Company Profile & Branding
              </h2>
              <p className="text-[11px] text-slate-400">
                Printed on Excel reports, invoices, and headers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Tax / VAT Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                VAT / Tax Registration #
              </label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => handleChange('tax_number', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Email</span>
              </label>
              <input
                type="email"
                value={formData.company_email}
                onChange={(e) => handleChange('company_email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Phone</span>
              </label>
              <input
                type="text"
                value={formData.company_phone}
                onChange={(e) => handleChange('company_phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Company Physical Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Company Physical Address (Printed on Receipts & Vouchers)</span>
              </label>
              <input
                type="text"
                value={formData.company_address}
                onChange={(e) => handleChange('company_address', e.target.value)}
                placeholder="e.g. Suite 402, Building 882, Road 3618, Block 436, Seef District, Kingdom of Bahrain"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This exact address will appear on the header of all official Payment Vouchers and Payment Receipts for printing.
              </p>
            </div>

            {/* Logo URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-slate-400" />
                <span>Logo Image URL</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData.company_logo}
                  onChange={(e) => handleChange('company_logo', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                {formData.company_logo && (
                  <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    <img src={formData.company_logo} alt="Preview" className="h-8 w-auto object-contain max-w-[100px]" />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-lg shadow-sky-500/25 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>

      {/* Card 4: Voucher Numbering & Chronological Re-Sequencing Tool */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                Voucher Numbering & Chronological Re-Sequencing Tool
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage Financial Year numbering (April 1 to March 31) and re-order voucher serial numbers by transaction date
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p className="font-bold text-slate-900 dark:text-white">
            💡 How Simple Accounting Handles Back-Dated Vouchers & Receipts:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <li><b>Standard Auto-Sequence (Default)</b>: New entries always get the next clean number (e.g. <code className="font-mono text-sky-600">PV-26-27-00009</code>). Reports sort by Transaction Date.</li>
            <li><b>Custom Number / Suffix Override</b>: When adding or editing, you can click <span className="text-sky-600 font-semibold">"✎ Custom Suffix"</span> to enter custom numbers like <code className="font-mono text-sky-600">PV-26-27-00005A</code>.</li>
            <li><b>Batch Re-Sequencing</b>: If you inserted back-dated entries and wish to re-order all voucher numbers strictly chronologically (1, 2, 3...) for year-end closing, run the tool below.</li>
          </ul>
        </div>

        <ResequenceTool onComplete={fetchInitialData} addToast={addToast} />
      </div>

      {/* Card 5: Danger Zone - Reset / Clear All Transactions */}
      {(isAdmin || user?.role === 'admin') && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-900 dark:text-rose-400 font-heading">
                  Danger Zone: Clear All Transactions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reset ledger and wipe all transactions, line items, and receipts while keeping all Category Heads, Accounts, and Users intact
                </p>
              </div>
            </div>
          </div>

          <ClearTransactionsTool onComplete={fetchInitialData} addToast={addToast} confirmAction={confirmAction} />
        </div>
      )}

    </div>
  );
}

function ClearTransactionsTool({ onComplete, addToast, confirmAction }) {
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    const confirmed = await confirmAction({
      title: '⚠️ WIPE ALL TRANSACTIONS?',
      message: 'This will permanently DELETE all recorded transactions, line items, and uploaded receipts. All Category Heads (Income/Expense), Bank Accounts, Users, and Settings will remain completely safe.',
      confirmText: 'Yes, Clear All Transactions',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    setClearing(true);
    try {
      const res = await apiFetch('/api/clear_transactions.php?confirm=yes', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.status === 'success') {
        addToast('All transactions cleared successfully! Category heads and accounts are preserved.', 'success');
        if (onComplete) onComplete();
      } else {
        addToast(data.message || 'Failed to clear transactions', 'error');
      }
    } catch (e) {
      addToast('Error communicating with server', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="text-xs text-rose-800 dark:text-rose-300">
        <p className="font-bold">Preserves: Categories, Accounts, Users & Settings</p>
        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
          Resets all bank/cash balances back to their initial balances and starts fresh with 0 transactions.
        </p>
      </div>
      <button
        type="button"
        disabled={clearing}
        onClick={handleClear}
        className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{clearing ? 'Clearing Transactions...' : 'Clear All Transactions'}</span>
      </button>
    </div>
  );
}

function ResequenceTool({ onComplete, addToast }) {
  const [fiscalYear, setFiscalYear] = useState('all');
  const [type, setType] = useState('all');
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResequence = async () => {
    setRunning(true);
    setShowConfirm(false);
    try {
      const res = await apiFetch('/api/transactions.php?action=resequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscal_year: fiscalYear, type })
      });
      const data = await res.json();
      if (data.status === 'success') {
        addToast(data.message || 'Vouchers successfully re-sequenced chronologically by date!', 'success');
        if (onComplete) onComplete();
      } else {
        addToast(data.message || 'Failed to re-sequence vouchers', 'error');
      }
    } catch (e) {
      addToast('Network error during re-sequencing', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Target Fiscal Year
          </label>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
          >
            <option value="all">All Fiscal Years</option>
            <option value="25-26">FY 25-26 (Apr 2025 – Mar 2026)</option>
            <option value="26-27">FY 26-27 (Apr 2026 – Mar 2027)</option>
            <option value="27-28">FY 27-28 (Apr 2027 – Mar 2028)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Voucher Category
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
          >
            <option value="all">All Documents (PV, RCP, TRF, JV)</option>
            <option value="expense">Payment Vouchers (PV) Only</option>
            <option value="income">Official Receipts (RCP) Only</option>
            <option value="bank_transfer">Transfer Vouchers (TRF) Only</option>
            <option value="other">Journal Vouchers (JV) Only</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            disabled={running}
            onClick={() => setShowConfirm(true)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/80 border border-amber-300 dark:border-amber-700 transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <span>🔄 Re-Sequence by Date</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
            ⚠️ Confirm Voucher Re-Sequencing:
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            This will sort all selected transactions by their <b>Transaction Date</b> and re-assign voucher numbers sequentially starting from <b>00001</b>. Already printed physical documents may need to be reprinted if their numbers change.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResequence}
              disabled={running}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition"
            >
              {running ? 'Re-sequencing...' : 'Yes, Re-Sequence Vouchers'}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

