import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../utils/api';
import { 
  X, 
  Upload, 
  FileText, 
  Trash2, 
  Check, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  Activity,
  Image as ImageIcon,
  Printer,
  Plus,
  Layers,
  Sparkles
} from 'lucide-react';

export default function TransactionModal() {
  const { 
    isTransactionModalOpen, 
    closeTransactionModal, 
    editingTransaction, 
    defaultModalType,
    categories, 
    accounts, 
    settings, 
    openVoucherModal,
    fetchInitialData, 
    addToast 
  } = useApp();

  const [type, setType] = useState('expense');
  const isIncome = type === 'income';
  const isExpense = type === 'expense';
  const isTransfer = type === 'bank_transfer';

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [payeePayer, setPayeePayer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [isCustomVoucher, setIsCustomVoucher] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('completed');

  // Multi-Line Items State
  const [lineItems, setLineItems] = useState([
    { item_description: '', category_id: '', quantity: 1, unit_price: '', amount: '' }
  ]);

  // Attachment state
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'expense');
      setDate(editingTransaction.transaction_date || new Date().toISOString().split('T')[0]);
      setCategoryId(editingTransaction.category_id ? String(editingTransaction.category_id) : '');
      setFromAccountId(editingTransaction.from_account_id ? String(editingTransaction.from_account_id) : '');
      setToAccountId(editingTransaction.to_account_id ? String(editingTransaction.to_account_id) : '');
      setPayeePayer(editingTransaction.payee_payer || '');
      setPaymentMethod(editingTransaction.payment_method || 'Cash');
      setReferenceNumber(editingTransaction.reference_number || '');
      setVoucherNo(editingTransaction.voucher_no || '');
      setIsCustomVoucher(!!editingTransaction.voucher_no);
      setNotes(editingTransaction.notes || '');
      setStatus(editingTransaction.status || 'completed');
      setExistingAttachments(editingTransaction.attachments || []);
      setAttachmentFile(null);
      setAttachmentPreview(null);

      // Populate line items
      if (editingTransaction.items && editingTransaction.items.length > 0) {
        setLineItems(editingTransaction.items.map((it) => ({
          id: it.id,
          item_description: it.item_description || '',
          category_id: it.category_id ? String(it.category_id) : '',
          quantity: parseFloat(it.quantity) || 1,
          unit_price: String(it.unit_price || ''),
          amount: String(it.amount || ''),
          notes: it.notes || ''
        })));
      } else {
        setLineItems([
          {
            item_description: editingTransaction.payee_payer || (editingTransaction.type === 'bank_transfer' ? 'Fund Transfer' : 'General Item'),
            category_id: editingTransaction.category_id ? String(editingTransaction.category_id) : '',
            quantity: 1,
            unit_price: String(editingTransaction.amount || ''),
            amount: String(editingTransaction.amount || '')
          }
        ]);
      }
    } else {
      setType(defaultModalType || 'expense');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setPayeePayer('');
      setPaymentMethod('Cash');
      setReferenceNumber('');
      setVoucherNo('');
      setIsCustomVoucher(false);
      setNotes('');
      setStatus('completed');
      setExistingAttachments([]);
      setAttachmentFile(null);
      setAttachmentPreview(null);
      setLineItems([
        { item_description: '', category_id: '', quantity: 1, unit_price: '', amount: '' }
      ]);

      // Default accounts (Petty Cash prioritized as first option)
      if (accounts.length > 0) {
        const cashAcc = accounts.find((a) => a.account_type === 'cash' || a.account_name.includes('Petty Cash')) || accounts[0];
        const bankAcc = accounts.find((a) => a.account_type === 'bank') || (accounts.length > 1 ? accounts[1] : accounts[0]);

        if (defaultModalType === 'income') {
          setToAccountId(String(cashAcc.id));
          setFromAccountId('');
        } else if (defaultModalType === 'expense') {
          setFromAccountId(String(cashAcc.id));
          setToAccountId('');
        } else if (defaultModalType === 'bank_transfer') {
          setFromAccountId(String(bankAcc.id));
          setToAccountId(String(cashAcc.id));
        }
      }
    }
  }, [editingTransaction, defaultModalType, isTransactionModalOpen, accounts]);

  if (!isTransactionModalOpen) return null;

  // Filter categories by type
  const filteredCategories = categories.filter((c) => {
    if (type === 'bank_transfer') return false;
    return c.type === type;
  });

  // Calculate total amount from line items
  const totalAmount = lineItems.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { item_description: '', category_id: categoryId || '', quantity: 1, unit_price: '', amount: '' }
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) {
      setLineItems([{ item_description: '', category_id: '', quantity: 1, unit_price: '', amount: '' }]);
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'unit_price') {
        const q = parseFloat(field === 'quantity' ? value : current.quantity) || 1;
        const p = parseFloat(field === 'unit_price' ? value : current.unit_price) || 0;
        current.amount = (q * p > 0) ? (q * p).toFixed(3) : current.amount;
      } else if (field === 'amount') {
        // If amount changed directly and unit price is 0
        const amt = parseFloat(value) || 0;
        const q = parseFloat(current.quantity) || 1;
        if (q > 0) current.unit_price = (amt / q).toFixed(3);
      }

      updated[index] = current;
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachmentFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeSelectedFile = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = async (e, printAfterSave = false) => {
    if (e && e.preventDefault) e.preventDefault();

    if (totalAmount <= 0) {
      addToast('Please enter at least one item with a valid amount greater than 0', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedAttachmentId = null;

      // 1. Upload attachment first if selected
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('attachment', attachmentFile);
        const upRes = await apiFetch('/api/upload.php', {
          method: 'POST',
          body: formData
        });
        const upData = await upRes.json();
        if (upData.status === 'success') {
          uploadedAttachmentId = upData.data.id;
        }
      }

      // 2. Prepare items
      const validItems = lineItems
        .filter((it) => parseFloat(it.amount) > 0 || (it.item_description && it.item_description.trim().length > 0))
        .map((it) => ({
          item_description: it.item_description ? it.item_description.trim() : 'Item',
          category_id: it.category_id ? parseInt(it.category_id, 10) : (categoryId ? parseInt(categoryId, 10) : null),
          quantity: parseFloat(it.quantity) || 1,
          unit_price: parseFloat(it.unit_price) || parseFloat(it.amount) || 0,
          amount: parseFloat(it.amount) || 0,
          notes: it.notes || ''
        }));

      // Main category fallback
      const primaryCatId = categoryId ? parseInt(categoryId, 10) : (validItems[0]?.category_id || null);

      // 3. Prepare transaction payload
      const payload = {
        type,
        amount: totalAmount,
        transaction_date: date,
        category_id: primaryCatId,
        from_account_id: fromAccountId ? parseInt(fromAccountId, 10) : null,
        to_account_id: toAccountId ? parseInt(toAccountId, 10) : null,
        payee_payer: payeePayer || validItems[0]?.item_description || '',
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        voucher_no: isCustomVoucher && voucherNo.trim() ? voucherNo.trim() : (editingTransaction ? editingTransaction.voucher_no : ''),
        notes,
        status,
        items: validItems,
        attachment_ids: uploadedAttachmentId ? [uploadedAttachmentId] : []
      };

      let endpoint = '/api/transactions.php';
      let method = 'POST';

      if (editingTransaction && editingTransaction.id) {
        payload.id = editingTransaction.id;
        method = 'PUT';
      }

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === 'success') {
        addToast(
          editingTransaction ? 'Transaction updated successfully' : 'Transaction recorded with line items!',
          'success'
        );
        fetchInitialData();
        closeTransactionModal();

        if (printAfterSave) {
          const fromAccObj = accounts.find((a) => String(a.id) === String(fromAccountId));
          const toAccObj = accounts.find((a) => String(a.id) === String(toAccountId));

          openVoucherModal({
            id: data.data?.id || (editingTransaction ? editingTransaction.id : 1),
            voucher_no: data.data?.voucher_no || data.voucher_no || voucherNo || '',
            fiscal_year: data.data?.fiscal_year || '',
            transaction_date: date,
            type,
            amount: totalAmount,
            category_name: categories.find((c) => String(c.id) === String(primaryCatId))?.name || '',
            from_account_name: fromAccObj ? fromAccObj.account_name : '',
            to_account_name: toAccObj ? toAccObj.account_name : '',
            payee_payer: payeePayer || validItems[0]?.item_description || '',
            payment_method: paymentMethod,
            reference_number: referenceNumber,
            notes,
            status,
            items: validItems.map((vi, idx) => ({
              id: idx + 1,
              item_description: vi.item_description,
              category_name: categories.find((c) => String(c.id) === String(vi.category_id))?.name || '',
              quantity: vi.quantity,
              unit_price: vi.unit_price,
              amount: vi.amount,
              notes: vi.notes
            }))
          });
        }
      } else {
        addToast(data.message || 'Error saving transaction', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while saving transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden my-4 flex flex-col max-h-[92vh]">
        
        {/* Modal Header & Type Switcher */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <span>{editingTransaction ? 'Edit Transaction Entry' : 'Record New Financial Entry'}</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
                FY April – March
              </span>
            </h3>
            <button
              type="button"
              onClick={closeTransactionModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Selector Pills */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => { setType('expense'); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Expense (PV)</span>
            </button>

            <button
              type="button"
              onClick={() => { setType('income'); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Income (RCP)</span>
            </button>

            <button
              type="button"
              onClick={() => { setType('bank_transfer'); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                type === 'bank_transfer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer (TRF)</span>
            </button>

            <button
              type="button"
              onClick={() => { setType('other'); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                type === 'other'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Other (JV)</span>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Header Metadata: Date, Accounts, Voucher Number & Payee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            
            {/* Transaction Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Voucher Number (Auto vs Custom) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Voucher / Receipt #
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomVoucher(!isCustomVoucher)}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {isCustomVoucher ? '← Reset to Auto' : '✎ Custom Suffix'}
                </button>
              </div>
              {isCustomVoucher ? (
                <input
                  type="text"
                  placeholder="e.g. PV-26-27-00005A"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/30 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <div className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-mono flex items-center justify-between">
                  <span>{voucherNo || '[Auto Sequence by FY]'}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Auto</span>
                </div>
              )}
            </div>

            {/* Payee / Payer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isIncome ? 'Received From (Payer)' : type === 'bank_transfer' ? 'Transfer Reference / Party' : 'Paid To (Beneficiary)'}
              </label>
              <input
                type="text"
                placeholder={isIncome ? 'e.g. Client Name / Company' : 'e.g. Vendor / Supplier / Staff'}
                value={payeePayer}
                onChange={(e) => setPayeePayer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* From Account (Source) */}
            {type !== 'income' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'bank_transfer' ? 'From (Debited Account)' : 'Paid From (Account)'}
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.account_type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* To Account (Destination) */}
            {type !== 'expense' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'bank_transfer' ? 'To (Credited Account)' : 'Deposit Into (Account)'}
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.account_type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="Cash">Cash in Hand</option>
                <option value="Bank Transfer">Bank Transfer / Wire</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="BenefitPay">BenefitPay / QR</option>
                <option value="UPI">UPI / Digital Wallet</option>
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ref / Invoice / Cheque #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-9901 / CHQ-104"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-sky-500"
              />
            </div>

          </div>

          {/* Section 2: Multi-Line Items Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span>Transaction Line Items ({lineItems.length})</span>
              </label>
              
              <button
                type="button"
                onClick={handleAddLineItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            {/* Line Items List */}
            <div className="space-y-2 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 bg-white dark:bg-slate-900 shadow-xs">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40">
                  
                  {/* Item Description (5 cols) */}
                  <div className="col-span-12 sm:col-span-4">
                    <input
                      type="text"
                      placeholder={`Item #${index + 1} Description`}
                      value={item.item_description}
                      onChange={(e) => handleLineItemChange(index, 'item_description', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  {/* Category Dropdown (3 cols) */}
                  {type !== 'bank_transfer' ? (
                    <div className="col-span-12 sm:col-span-3">
                      <select
                        value={item.category_id}
                        onChange={(e) => handleLineItemChange(index, 'category_id', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">-- Category --</option>
                        {filteredCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="col-span-12 sm:col-span-3 text-[11px] text-slate-400 font-semibold px-2">
                      Transfer
                    </div>
                  )}

                  {/* Qty (2 cols) */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono"
                    />
                  </div>

                  {/* Amount (2 cols) */}
                  <div className="col-span-6 sm:col-span-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono"
                    />
                  </div>

                  {/* Delete (1 col) */}
                  <div className="col-span-2 sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                      title="Remove line item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}

              {/* Total Summary Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Voucher Amount
                </span>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-mono">
                    {totalAmount.toFixed(['BHD', 'KWD', 'OMR'].includes(settings.default_currency || 'BHD') ? 3 : 2)} {settings.default_currency || 'BHD'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              General Notes / Remarks
            </label>
            <textarea
              rows="2"
              placeholder="Additional remarks, payment terms, or receipt details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Attachment Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Receipt / Invoice Attachment</span>
            </label>

            {attachmentPreview ? (
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={attachmentPreview}
                    alt="Receipt preview"
                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs">
                    {attachmentFile?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 hover:bg-sky-50/30">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to upload receipt photo or PDF
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            
            <button
              type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save & Print A5 Voucher'}</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 transition shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : editingTransaction ? 'Update Entry' : 'Save Entry'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
