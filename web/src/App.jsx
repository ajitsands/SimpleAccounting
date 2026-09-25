import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import HorizontalNavbar from './components/HorizontalNavbar';
import Dashboard from './components/Dashboard';
import TransactionsList from './components/TransactionsList';
import ReportsCenter from './components/ReportsCenter';
import AccountsManager from './components/AccountsManager';
import CategoriesManager from './components/CategoriesManager';
import SettingsManager from './components/SettingsManager';
import TransactionModal from './components/TransactionModal';
import AttachmentViewerModal from './components/AttachmentViewerModal';
import VoucherModal from './components/VoucherModal';

export default function App() {
  const { activeTab, voucherTransaction, closeVoucherModal } = useApp();
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const handleViewAttachment = (attachment) => {
    setSelectedAttachment(attachment);
  };

  const handleCloseAttachment = () => {
    setSelectedAttachment(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Fixed Horizontal Navbar with Horizontal Menu Tabs */}
      <HorizontalNavbar />

      {/* Main Full-Width Content Area */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard onViewAttachment={handleViewAttachment} />}
        {activeTab === 'transactions' && <TransactionsList onViewAttachment={handleViewAttachment} />}
        {activeTab === 'reports' && <ReportsCenter />}
        {activeTab === 'accounts' && <AccountsManager />}
        {activeTab === 'categories' && <CategoriesManager />}
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
