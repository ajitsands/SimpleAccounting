import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import HorizontalNavbar from './components/HorizontalNavbar';
import Dashboard from './components/Dashboard';
import TransactionsList from './components/TransactionsList';
import ReportsCenter from './components/ReportsCenter';
import AccountsManager from './components/AccountsManager';
import CategoriesManager from './components/CategoriesManager';
import SettingsManager from './components/SettingsManager';
import UsersManager from './components/UsersManager';
import TransactionModal from './components/TransactionModal';
import AttachmentViewerModal from './components/AttachmentViewerModal';
import VoucherModal from './components/VoucherModal';
import { Eye, ShieldAlert, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const { 
    isAuthenticated, 
    authChecking, 
    activeTab, 
    voucherTransaction, 
    closeVoucherModal,
    isAuditor,
    isAdmin
  } = useApp();

  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const handleViewAttachment = (attachment) => {
    setSelectedAttachment(attachment);
  };

  const handleCloseAttachment = () => {
    setSelectedAttachment(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 mt-3 font-medium">Loading Simple Accounting...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Auditor Notice Banner */}
      {isAuditor && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-4 py-2 text-xs border-b border-emerald-700/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-[1700px] mx-auto w-full">
            <span className="p-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <Eye className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-emerald-200">Auditor Mode Active:</span>
            <span className="text-slate-300">
              Read-Only inspection access enabled. You can review all records, examine receipts, and export complete reports to <strong>Excel (.xlsx)</strong> and <strong>PDF</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Top Fixed Horizontal Navbar with Horizontal Menu Tabs */}
      <HorizontalNavbar />

      {/* Main Full-Width Content Area */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard onViewAttachment={handleViewAttachment} />}
        {activeTab === 'transactions' && <TransactionsList onViewAttachment={handleViewAttachment} />}
        {activeTab === 'reports' && <ReportsCenter />}
        {activeTab === 'accounts' && <AccountsManager />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'users' && isAdmin && <UsersManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>

      {/* Global Modals */}
      <TransactionModal />
      <AttachmentViewerModal 
        attachment={selectedAttachment} 
        onClose={handleCloseAttachment} 
      />
      {voucherTransaction && (
        <VoucherModal 
          transaction={voucherTransaction} 
          onClose={closeVoucherModal} 
        />
      )}

    </div>
  );
}
