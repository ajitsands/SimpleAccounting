import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Building, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  CreditCard,
  Hash,
  Download,
  ShieldCheck,
  User,
  ArrowRightLeft,
  Layers,
  FileCheck
} from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';

export default function VoucherModal({ transaction, onClose }) {
  const { settings, formatMoney, formatDate } = useApp();
  const [paperOrientation, setPaperOrientation] = useState('portrait'); // Default A5 Portrait as requested
  const printRef = useRef();

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'bank_transfer';

  // Document Title & Tag
  let docTitle = 'PAYMENT VOUCHER';
  let docSubtitle = 'Official Debit Disbursement Voucher';
  let docPrefix = 'PV';
  let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

  if (isIncome) {
    docTitle = 'OFFICIAL RECEIPT';
    docSubtitle = 'Payment Acknowledgment & Money Receipt';
    docPrefix = 'RCP';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (isTransfer) {
    docTitle = 'FUND TRANSFER VOUCHER';
    docSubtitle = 'Internal Bank & Cash Contra Transfer';
    docPrefix = 'TRF';
    badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (transaction.type === 'other') {
    docTitle = 'JOURNAL VOUCHER';
    docSubtitle = 'Financial Adjustment Voucher';
    docPrefix = 'JV';
    badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  // Calculate Fiscal Year (April 1 to March 31)
  const computeFY = (dateStr) => {
    const time = new Date(dateStr || Date.now());
    const year = time.getFullYear();
    const month = time.getMonth() + 1; // 1-12
    const startYear = month >= 4 ? year : year - 1;
    const endYear = startYear + 1;
    return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
  };

  const fy = transaction.fiscal_year || computeFY(transaction.transaction_date);

  // Voucher Number formatted as Prefix-FY-Sequence (e.g. PV-26-27-00008)
  const voucherNumber = transaction.voucher_no 
    ? transaction.voucher_no 
    : (transaction.reference_number 
        ? transaction.reference_number 
        : `${docPrefix}-${fy}-${String(transaction.id || 1).padStart(5, '0')}`);

  const currCode = settings.default_currency || 'BHD';
  const amountWords = numberToWords(transaction.amount, currCode);

  // Line Items
  const items = (transaction.items && transaction.items.length > 0)
    ? transaction.items
    : [
        {
          id: 1,
          item_description: transaction.payee_payer || (isTransfer ? 'Fund Transfer' : 'Transaction Settlement'),
          category_name: transaction.category_name,
          quantity: 1,
          unit_price: transaction.amount,
          amount: transaction.amount,
          notes: transaction.notes
        }
      ];

  const handlePrint = () => {
    const printableContent = printRef.current?.innerHTML;
    if (!printableContent) {
      window.print();
      return;
    }

    let iframe = document.getElementById('print-voucher-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-voucher-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const orientation = paperOrientation === 'landscape' ? 'landscape' : 'portrait';

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${docTitle} - ${voucherNumber}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap">
        <style>
          @page {
            size: A5 ${orientation};
            margin: 5mm 7mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 8.5pt;
            line-height: 1.25;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
          }
          img {
            max-height: 38px !important;
            max-width: 160px !important;
            height: auto !important;
            width: auto !important;
            object-fit: contain !important;
            display: block;
          }
          h1, h2, h3, .font-heading {
            font-family: 'Outfit', 'Inter', sans-serif;
          }
          .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .flex { display: flex; }
          .flex-row { flex-direction: row; }
          .flex-col { flex-direction: column; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .gap-2 { gap: 0.5rem; }
          .gap-3 { gap: 0.75rem; }
          .gap-4 { gap: 1rem; }
          .gap-6 { gap: 1.5rem; }
          .border { border: 1px solid #e2e8f0; }
          .border-b { border-bottom: 1px solid #e2e8f0; }
          .border-b-2 { border-bottom: 2px solid #0f172a; }
          .border-t { border-top: 1px solid #e2e8f0; }
          .border-l { border-left: 1px solid #e2e8f0; }
          .border-dashed { border-style: dashed; }
          .border-slate-200 { border-color: #e2e8f0; }
          .border-slate-300 { border-color: #cbd5e1; }
          .border-slate-400 { border-color: #94a3b8; }
          .border-slate-900 { border-color: #0f172a; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-xl { border-radius: 0.75rem; }
          .rounded-2xl { border-radius: 1rem; }
          .rounded-full { border-radius: 9999px; }
          .bg-slate-50 { background-color: #f8fafc; }
          .bg-slate-100 { background-color: #f1f5f9; }
          .bg-slate-900 { background-color: #0f172a; color: #fff; }
          .text-slate-950 { color: #020617; }
          .text-slate-900 { color: #0f172a; }
          .text-slate-700 { color: #334155; }
          .text-slate-600 { color: #475569; }
          .text-slate-500 { color: #64748b; }
          .text-slate-400 { color: #94a3b8; }
          .text-sky-900 { color: #0c4a6e; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          .font-extrabold { font-weight: 800; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .p-2 { padding: 0.5rem; }
          .p-2\\.5 { padding: 0.625rem; }
          .p-5 { padding: 0.75rem; }
          .pb-3 { padding-bottom: 0.75rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mt-0\\.5 { margin-top: 0.125rem; }
          .mt-1 { margin-top: 0.25rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .pt-2 { padding-top: 0.5rem; }
          .pt-1\\.5 { padding-top: 0.375rem; }
          .col-span-2 { grid-column: span 2 / span 2; }
          .h-6 { height: 1.5rem; }
          .w-8 { width: 2rem; }
          .w-12 { width: 3rem; }
          .w-20 { width: 5rem; }
          .w-24 { width: 6rem; }
          .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
          .space-y-6 > * + * { margin-top: 1.25rem; }
          .divide-y > * + * { border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div style="padding: 2mm 3mm;">
          ${printableContent}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        window.print();
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Action Toolbar (Hidden during Print) */}
        <div className="p-3 sm:px-6 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{docTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold">
                  {voucherNumber}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  A5 Size (Half A4)
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                FY {fy} (April 1 – March 31) • Ready for Signatures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Orientation Toggle */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaperOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md transition ${paperOrientation === 'landscape' ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}
              >
                A5 Landscape
              </button>
              <button
                type="button"
                onClick={() => setPaperOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md transition ${paperOrientation === 'portrait' ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}
              >
                A5 Portrait
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-md shadow-sky-500/20 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A5</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area (Sized & Formatted for A5 Half-Page) */}
        <div 
          ref={printRef}
          id="printable-voucher" 
          className={`p-5 sm:p-6 overflow-y-auto flex-1 bg-white text-slate-900 print:p-4 print:overflow-visible print:bg-white print:text-black font-sans ${
            paperOrientation === 'landscape' ? 'voucher-a5-landscape' : 'voucher-a5-portrait'
          }`}
        >
          
          {/* Header Section: Logo on Top, Company Details Below, Voucher Box on Right */}
          <div className="border-b-2 border-slate-900 pb-3 mb-3">
            <div className="flex flex-row items-start justify-between gap-4">
              
              {/* Left Column: Logo on top, Company details below */}
              <div className="flex-1">
                {/* 1. Logo On Top */}
                <div className="mb-2">
                  {settings.company_logo ? (
                    <img 
                      src={settings.company_logo} 
                      alt="Company Logo" 
                      style={{ maxHeight: 38, maxWidth: 160, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                      className="h-10 w-auto max-w-[160px] object-contain" 
                    />
                  ) : (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs">
                      SA
                    </div>
                  )}
                </div>

                {/* 2. Company Name */}
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase font-heading leading-tight">
                  {settings.company_name || 'SaNDSLab Simple Accounting'}
                </h1>

                {/* 3. Company Address */}
                {settings.company_address && (
                  <p className="text-[10px] text-slate-600 leading-normal max-w-md font-medium mt-0.5">
                    {settings.company_address}
                  </p>
                )}

                {/* 4. Phone, Email & VAT Details */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] text-slate-600 font-medium mt-1">
                  {settings.company_phone && (
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">Tel:</span> {settings.company_phone}
                    </span>
                  )}
                  {settings.company_email && (
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">Email:</span> {settings.company_email}
                    </span>
                  )}
                  {settings.tax_number && (
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">VAT Reg:</span>
                      <span className="font-mono font-bold text-slate-900">{settings.tax_number}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Voucher Title, Number & Fiscal Year */}
              <div className="text-right shrink-0 min-w-[150px] pl-3 border-l border-slate-200">
                <div className="inline-block px-3 py-1 rounded bg-slate-900 text-white text-[10px] font-black tracking-wider uppercase">
                  {docTitle}
                </div>
                <div className="mt-2 text-[11px] font-extrabold text-slate-900">
                  VOUCHER #: <span className="font-mono text-sky-900 text-xs font-black">{voucherNumber}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                  FY {fy} (April 1 – March 31)
                </div>
                <div className="text-[8px] text-slate-400 font-medium mt-0.5">
                  {docSubtitle}
                </div>
              </div>

            </div>
          </div>

          {/* Metadata Grid (Compact A5) */}
          <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg mb-3 text-[10px]">
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Date</span>
              <span className="font-extrabold text-slate-900">
                {formatDate(transaction.transaction_date)}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Payment Mode</span>
              <span className="font-bold text-slate-900">
                {transaction.payment_method || 'Cash'}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Reference / Doc #</span>
              <span className="font-mono font-bold text-slate-900">
                {transaction.reference_number || '-'}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Fiscal Year</span>
              <span className="font-mono font-black text-slate-900">
                20{fy.replace('-', ' - 20')}
              </span>
            </div>
          </div>

          {/* Parties & Account Details Bar */}
          <div className="border border-slate-200 rounded-lg p-2.5 mb-3 bg-slate-50/50 text-[10px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block">
                  {isIncome ? 'Received With Thanks From (Payer):' : isTransfer ? 'Source Account (Debited):' : 'Paid To (Beneficiary / Vendor):'}
                </span>
                <p className="text-xs font-black text-slate-950">
                  {isTransfer ? (transaction.from_account_name || 'Bank Account') : (transaction.payee_payer || 'Walk-in / Cash Customer')}
                </p>
              </div>

              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block">
                  {isIncome ? 'Deposited Into (Credited):' : isTransfer ? 'Destination Account (Credited):' : 'Paid Out Of (Account):'}
                </span>
                <p className="text-xs font-black text-slate-950">
                  {isTransfer ? (transaction.to_account_name || 'Petty Cash') : (transaction.from_account_name || transaction.to_account_name || transaction.payment_method || 'Office Petty Cash')}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table (Multi-Item Support) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 text-[9px] font-black uppercase text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="py-1.5 px-2.5 w-8 text-center">#</th>
                  <th className="py-1.5 px-2.5">Item Description / Particulars</th>
                  <th className="py-1.5 px-2.5">Category</th>
                  <th className="py-1.5 px-2 text-center w-12">Qty</th>
                  <th className="py-1.5 px-2 text-right w-20">Unit Price</th>
                  <th className="py-1.5 px-2.5 text-right w-24">Amount ({currCode})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="py-1.5 px-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-1.5 px-2.5 font-bold text-slate-900">
                      {it.item_description || it.description || 'Transaction item'}
                      {it.notes && <span className="block text-[9px] font-normal text-slate-500">{it.notes}</span>}
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-600 font-medium">
                      {it.category_name || transaction.category_name || (isTransfer ? 'Transfer' : '-')}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono text-slate-700">
                      {parseFloat(it.quantity || 1).toFixed(0)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                      {formatMoney(it.unit_price || it.amount)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-black text-slate-950 font-mono">
                      {formatMoney(it.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount In Words & Total Bar (Compact A5) */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-[10px]">
            <div className="col-span-2 space-y-0.5">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">
                Amount In Words:
              </span>
              <p className="text-[10px] font-bold text-slate-900 italic font-serif leading-tight">
                "{amountWords}"
              </p>
            </div>

            <div className="text-right flex flex-col justify-center border-l border-slate-200 pl-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">
                Total Net Amount
              </span>
              <span className="text-sm font-black text-slate-950 font-mono">
                {formatMoney(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Official Signatures Section (Designed for A5 Half-Sheet) */}
          <div className="pt-2 border-t border-slate-300">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-4 text-center">
              Official Verification & Authorization Sign-Off
            </p>

            {isExpense ? (
              /* Payment Voucher 4 Columns */
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="space-y-6">
                  <div className="h-6 border-b border-dashed border-slate-400"></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900">Prepared By</p>
                    <p className="text-[8px] text-slate-400">Accountant</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-6 border-b border-dashed border-slate-400"></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900">Verified By</p>
                    <p className="text-[8px] text-slate-400">Internal Audit</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-6 border-b border-dashed border-slate-400"></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900">Receiver's Sign</p>
                    <p className="text-[8px] text-slate-400">Beneficiary</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-6 border-b-2 border-slate-900"></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-950">Authorized Signatory</p>
                    <p className="text-[8px] text-slate-500 font-bold">Manager & Stamp</p>
                  </div>
                </div>
              </div>
            ) : isIncome ? (
              /* Receipt 3 Columns */
              <div className="grid grid-cols-3 gap-6 text-center max-w-lg mx-auto">
                <div className="space-y-6">
                  <div className="h-6 border-b border-dashed border-slate-400"></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900">Received By / Cashier</p>
                    <p className="text-[8px] text-slate-400">Accounts Officer</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-6 border-b border-dashed border-slate-400"></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900">Payer's Signature</p>
                    <p className="text-[8px] text-slate-400">Customer / Client</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-6 border-b-2 border-slate-900"></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-950">Authorized Signatory</p>
                    <p className="text-[8px] text-slate-500 font-bold">Company Stamp</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Transfer 3 Columns */
              <div className="grid grid-cols-3 gap-6 text-center max-w-lg mx-auto">
                <div className="space-y-6">
                  <div className="h-6 border-b border-dashed border-slate-400"></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900">Initiated By</p>
                    <p className="text-[8px] text-slate-400">Finance Officer</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-6 border-b border-dashed border-slate-400"></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900">Received By</p>
                    <p className="text-[8px] text-slate-400">Cash Custodian</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-6 border-b-2 border-slate-900"></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-950">Authorized Signatory</p>
                    <p className="text-[8px] text-slate-500 font-bold">Managing Director</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400">
            <span>Official Computer Generated Voucher • {settings.company_name || 'SaNDSLab Simple Accounting'}</span>
            <span>Printed on: {new Date().toLocaleString()}</span>
          </div>

        </div>

      </div>

    </div>
  );
}
