import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform 
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMobile } from '../context/MobileContext';
import { numberToWords } from '../utils/numberToWords';

export default function MobileVoucherModal({ visible, transaction, onClose }) {
  const { settings, formatMoney, formatDate, theme } = useMobile();

  if (!transaction) return null;

  const isDark = theme === 'dark';
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'bank_transfer';

  let docTitle = 'PAYMENT VOUCHER';
  let docSubtitle = 'Official Debit Disbursement Voucher';
  let docPrefix = 'PV';

  if (isIncome) {
    docTitle = 'OFFICIAL RECEIPT';
    docSubtitle = 'Payment Acknowledgment & Money Receipt';
    docPrefix = 'RCP';
  } else if (isTransfer) {
    docTitle = 'FUND TRANSFER VOUCHER';
    docSubtitle = 'Internal Contra Bank & Cash Transfer';
    docPrefix = 'TRF';
  }

  // Calculate Fiscal Year (April 1 to March 31)
  const computeFY = (dateStr) => {
    const time = new Date(dateStr || Date.now());
    const year = time.getFullYear();
    const month = time.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const endYear = startYear + 1;
    return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
  };

  const fy = transaction.fiscal_year || computeFY(transaction.transaction_date);

  const voucherNo = transaction.voucher_no 
    ? transaction.voucher_no 
    : (transaction.reference_number 
        ? transaction.reference_number 
        : `${docPrefix}-${fy}-${String(transaction.id || 1).padStart(5, '0')}`);

  const currCode = settings.default_currency || 'BHD';
  const amountWords = numberToWords(transaction.amount, currCode);

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

  // Generate A5 Print HTML
  const generateHTML = () => {
    const itemsHtml = items.map((it, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold; padding: 4px 6px;">${idx + 1}</td>
        <td style="padding: 4px 6px; font-weight: bold;">
          ${it.item_description || it.description || 'Item'}
          ${it.notes ? `<div style="font-size: 8px; color: #64748b; font-weight: normal;">${it.notes}</div>` : ''}
        </td>
        <td style="padding: 4px 6px; color: #475569;">${it.category_name || transaction.category_name || (isTransfer ? 'Transfer' : '-')}</td>
        <td style="text-align: center; padding: 4px 6px; font-family: monospace;">${parseFloat(it.quantity || 1).toFixed(0)}</td>
        <td style="text-align: right; padding: 4px 6px; font-family: monospace;">${formatMoney(it.unit_price || it.amount)}</td>
        <td style="text-align: right; padding: 4px 6px; font-weight: bold; font-family: monospace;">${formatMoney(it.amount)}</td>
      </tr>
    `).join('');

    const signatureBlockHtml = isExpense ? `
      <div style="display: flex; justify-content: space-between; text-align: center; margin-top: 15px;">
        <div style="flex: 1; margin: 0 4px;">
          <div style="border-bottom: 1px dashed #94a3b8; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: bold;">Prepared By</div>
          <div style="font-size: 8px; color: #64748b;">Accountant</div>
        </div>
        <div style="flex: 1; margin: 0 4px;">
          <div style="border-bottom: 1px dashed #94a3b8; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: bold;">Verified By</div>
          <div style="font-size: 8px; color: #64748b;">Internal Audit</div>
        </div>
        <div style="flex: 1; margin: 0 4px;">
          <div style="border-bottom: 1px dashed #94a3b8; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: bold;">Receiver's Sign</div>
          <div style="font-size: 8px; color: #64748b;">Beneficiary</div>
        </div>
        <div style="flex: 1; margin: 0 4px;">
          <div style="border-bottom: 2px solid #0f172a; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: 900;">Authorized Sign</div>
          <div style="font-size: 8px; color: #334155; font-weight: bold;">Manager & Stamp</div>
        </div>
      </div>
    ` : isIncome ? `
      <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 15px;">
        <div style="width: 28%;">
          <div style="border-bottom: 1px dashed #94a3b8; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: bold;">Received By</div>
          <div style="font-size: 8px; color: #64748b;">Cashier</div>
        </div>
        <div style="width: 28%;">
          <div style="border-bottom: 1px dashed #94a3b8; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: bold;">Payer's Signature</div>
          <div style="font-size: 8px; color: #64748b;">Customer</div>
        </div>
        <div style="width: 28%;">
          <div style="border-bottom: 2px solid #0f172a; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: 900;">Authorized Signatory</div>
          <div style="font-size: 8px; color: #334155; font-weight: bold;">Company Seal</div>
        </div>
      </div>
    ` : `
      <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 15px;">
        <div style="width: 28%;">
          <div style="border-bottom: 1px dashed #94a3b8; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: bold;">Initiated By</div>
          <div style="font-size: 8px; color: #64748b;">Finance Officer</div>
        </div>
        <div style="width: 28%;">
          <div style="border-bottom: 1px dashed #94a3b8; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: bold;">Received By</div>
          <div style="font-size: 8px; color: #64748b;">Cash Custodian</div>
        </div>
        <div style="width: 28%;">
          <div style="border-bottom: 2px solid #0f172a; height: 28px; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; font-weight: 900;">Authorized Signatory</div>
          <div style="font-size: 8px; color: #334155; font-weight: bold;">Director</div>
        </div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { size: A5 landscape; margin: 6mm 8mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9pt; color: #0f172a; margin: 0; padding: 0; background: #ffffff; }
          .voucher-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; }
          .company-name { font-size: 13pt; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; }
          .company-addr { font-size: 8pt; color: #475569; margin-top: 2px; }
          .doc-badge { background: #0f172a; color: #ffffff; padding: 3px 8px; font-size: 8pt; font-weight: 900; border-radius: 4px; text-transform: uppercase; display: inline-block; }
          .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; font-size: 8pt; }
          .party-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; display: flex; justify-content: space-between; font-size: 8.5pt; background: #fdfdfd; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8.5pt; }
          th { background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; font-weight: bold; text-transform: uppercase; font-size: 7.5pt; color: #334155; }
          td { border-bottom: 1px solid #e2e8f0; }
          .total-box { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; }
          .footer { font-size: 7pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 8px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="voucher-box">
          <div class="header">
            <div style="flex: 1;">
              ${settings.company_logo ? `<div style="margin-bottom: 6px;"><img src="${settings.company_logo}" alt="Logo" style="height: 36px; max-width: 140px; object-fit: contain;" /></div>` : ''}
              <div class="company-name">${settings.company_name || 'SaNDSLab Simple Accounting'}</div>
              ${settings.company_address ? `<div class="company-addr">${settings.company_address}</div>` : ''}
              <div class="company-addr" style="margin-top: 4px;">
                ${settings.company_phone ? `<b>Tel:</b> ${settings.company_phone}` : ''} 
                ${settings.company_email ? `• <b>Email:</b> ${settings.company_email}` : ''}
                ${settings.tax_number ? `• <b>VAT Reg:</b> ${settings.tax_number}` : ''}
              </div>
            </div>
            <div style="text-align: right; min-width: 130px; padding-left: 10px; border-left: 1px solid #e2e8f0;">
              <div class="doc-badge">${docTitle}</div>
              <div style="font-size: 9pt; font-weight: 900; margin-top: 4px; color: #0284c7; font-family: monospace;">
                ${voucherNo}
              </div>
              <div style="font-size: 7.5pt; color: #64748b; font-weight: bold; margin-top: 2px;">
                FY ${fy} (April 1 – March 31)
              </div>
              <div style="font-size: 6.5pt; color: #94a3b8; margin-top: 2px;">
                ${docSubtitle}
              </div>
            </div>
          </div>

          <div class="meta-grid">
            <div><span style="color:#64748b; font-size:7pt; display:block;">DATE</span> <b>${formatDate(transaction.transaction_date)}</b></div>
            <div><span style="color:#64748b; font-size:7pt; display:block;">PAYMENT MODE</span> <b>${transaction.payment_method || 'Cash'}</b></div>
            <div><span style="color:#64748b; font-size:7pt; display:block;">REFERENCE / DOC</span> <b>${transaction.reference_number || '-'}</b></div>
            <div><span style="color:#64748b; font-size:7pt; display:block;">FISCAL YEAR</span> <b>20${fy.replace('-', ' - 20')}</b></div>
          </div>

          <div class="party-box">
            <div style="flex: 1;">
              <span style="color:#64748b; font-size:7pt; display:block;">
                ${isIncome ? 'RECEIVED WITH THANKS FROM:' : isTransfer ? 'DEBITED FROM (SOURCE):' : 'PAID TO (BENEFICIARY):'}
              </span>
              <b>${isTransfer ? (transaction.from_account_name || 'Bank') : (transaction.payee_payer || 'Walk-in / Cash Customer')}</b>
            </div>
            <div style="flex: 1; text-align: right;">
              <span style="color:#64748b; font-size:7pt; display:block;">
                ${isIncome ? 'CREDITED INTO ACCOUNT:' : isTransfer ? 'CREDITED TO (DESTINATION):' : 'PAID OUT OF ACCOUNT:'}
              </span>
              <b>${isTransfer ? (transaction.to_account_name || 'Cash Drawer') : (transaction.from_account_name || transaction.to_account_name || transaction.payment_method || 'Office Petty Cash')}</b>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 25px; padding: 4px;">#</th>
                <th style="text-align: left; padding: 4px;">Particulars & Description</th>
                <th style="text-align: left; padding: 4px;">Category</th>
                <th style="text-align: center; width: 35px; padding: 4px;">Qty</th>
                <th style="text-align: right; width: 75px; padding: 4px;">Unit Price</th>
                <th style="text-align: right; width: 85px; padding: 4px;">Amount (${currCode})</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div style="flex: 1;">
              <span style="font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase;">Amount In Words:</span>
              <div style="font-size: 8.5pt; font-weight: bold; font-style: italic; color: #0f172a;">"${amountWords}"</div>
            </div>
            <div style="text-align: right; padding-left: 12px; border-left: 1px solid #cbd5e1;">
              <span style="font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase;">Total Amount:</span>
              <div style="font-size: 12pt; font-weight: 900; font-family: monospace; color: #0f172a;">${formatMoney(transaction.amount)}</div>
            </div>
          </div>

          ${signatureBlockHtml}

          <div class="footer">
            <span>Official Computer Generated Voucher • ${settings.company_name || 'SaNDSLab Simple Accounting'}</span>
            <span>Printed on: ${new Date().toLocaleString()}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Direct Mobile Print (Opens Android / iOS Native Print & Save as PDF Dialog)
  const handlePrint = async () => {
    try {
      const html = generateHTML();
      await Print.printAsync({ html });
    } catch (e) {
      console.error('Print Error:', e);
      Alert.alert('Print Notice', 'Opening print service failed. Please ensure system print services are enabled.');
    }
  };

  // Save / Share as PDF
  const handleShare = async () => {
    try {
      const html = generateHTML();
      
      // On mobile devices, Print.printAsync directly opens the native Android/iOS
      // print spooler which includes "Save as PDF", printer selection, and sharing
      // without triggering Android FileProvider permission errors.
      await Print.printAsync({ html });
    } catch (e) {
      console.error('Print/Share Error:', e);
      Alert.alert('Print Error', e?.message || 'Could not open print / PDF manager.');
    }
  };

  const styles = getStyles(isDark);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          
          {/* Header Action Bar */}
          <View style={styles.headerBar}>
            <View>
              <Text style={styles.headerTitle}>{docTitle}</Text>
              <Text style={styles.headerSub}>{voucherNo} • A5 Size (Half-A4)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Preview */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            
            {/* Company Info Box */}
            <View style={styles.previewBox}>
              <Text style={styles.compName}>{settings.company_name || 'SaNDSLab Simple Accounting'}</Text>
              {settings.company_address ? (
                <Text style={styles.compAddr}>{settings.company_address}</Text>
              ) : null}
              <Text style={styles.compMeta}>
                {settings.company_phone ? `Tel: ${settings.company_phone} • ` : ''}
                {settings.company_email ? `Email: ${settings.company_email}` : ''}
                {settings.tax_number ? ` • VAT: ${settings.tax_number}` : ''}
              </Text>

              {/* Voucher Number & FY Banner */}
              <View style={styles.voucherBanner}>
                <View>
                  <Text style={styles.bannerLabel}>VOUCHER NUMBER</Text>
                  <Text style={styles.bannerNumber}>{voucherNo}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.bannerLabel}>ACCOUNTING YEAR</Text>
                  <Text style={styles.bannerFY}>FY 20{fy.replace('-', ' - 20')}</Text>
                </View>
              </View>

              {/* Metadata */}
              <View style={styles.metaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>DATE</Text>
                  <Text style={styles.metaVal}>{formatDate(transaction.transaction_date)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>PAYMENT METHOD</Text>
                  <Text style={styles.metaVal}>{transaction.payment_method || 'Cash'}</Text>
                </View>
              </View>

              {/* Beneficiary / Payer */}
              <View style={styles.partyBox}>
                <Text style={styles.metaLabel}>
                  {isIncome ? 'RECEIVED WITH THANKS FROM:' : isTransfer ? 'SOURCE ACCOUNT:' : 'PAID TO (BENEFICIARY):'}
                </Text>
                <Text style={styles.partyName}>
                  {isTransfer ? (transaction.from_account_name || 'Bank') : (transaction.payee_payer || 'Walk-in / Cash Customer')}
                </Text>
              </View>

              {/* Line Items Table */}
              <View style={styles.tableBox}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.thText, { flex: 2 }]}>PARTICULARS</Text>
                  <Text style={[styles.thText, { width: 35, textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.thText, { width: 75, textAlign: 'right' }]}>AMOUNT</Text>
                </View>
                {items.map((it, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.tdTitle}>{it.item_description || it.description || 'Item'}</Text>
                      {it.notes ? <Text style={styles.tdSub}>{it.notes}</Text> : null}
                    </View>
                    <Text style={[styles.tdVal, { width: 35, textAlign: 'center' }]}>
                      {parseFloat(it.quantity || 1).toFixed(0)}
                    </Text>
                    <Text style={[styles.tdVal, { width: 75, textAlign: 'right', fontWeight: '800' }]}>
                      {formatMoney(it.amount)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Total Box */}
              <View style={styles.totalCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>AMOUNT IN WORDS</Text>
                  <Text style={styles.wordsText}>"{amountWords}"</Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={styles.metaLabel}>NET TOTAL</Text>
                  <Text style={styles.totalNumber}>{formatMoney(transaction.amount)}</Text>
                </View>
              </View>

              {/* Signatures placeholder */}
              <View style={styles.sigBox}>
                <Text style={styles.sigNote}>✓ 4-Column Official Signatures included in PDF print</Text>
              </View>

            </View>

          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>📤 Share A5 PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Text style={styles.printBtnText}>🖨️ Print A5 Voucher</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  closeBtnText: {
    fontSize: 14,
    color: isDark ? '#94a3b8' : '#64748b',
    fontWeight: '800',
  },
  scrollArea: {
    padding: 16,
  },
  previewBox: {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  compName: {
    fontSize: 14,
    fontWeight: '900',
    color: isDark ? '#ffffff' : '#0f172a',
    textTransform: 'uppercase',
  },
  compAddr: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },
  compMeta: {
    fontSize: 10,
    color: isDark ? '#64748b' : '#94a3b8',
    marginTop: 2,
  },
  voucherBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#cbd5e1',
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: isDark ? '#64748b' : '#94a3b8',
  },
  bannerNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0284c7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  bannerFY: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: isDark ? '#64748b' : '#94a3b8',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
    marginTop: 2,
  },
  partyBox: {
    marginTop: 10,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  partyName: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
    marginTop: 2,
  },
  tableBox: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#cbd5e1',
  },
  thText: {
    fontSize: 9,
    fontWeight: '800',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f1f5f9',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
  },
  tdTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  tdSub: {
    fontSize: 9,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  tdVal: {
    fontSize: 11,
    color: isDark ? '#ffffff' : '#0f172a',
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0284c760',
  },
  wordsText: {
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#475569',
    marginTop: 2,
  },
  totalNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: isDark ? '#38bdf8' : '#0284c7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sigBox: {
    marginTop: 10,
    alignItems: 'center',
  },
  sigNote: {
    fontSize: 10,
    color: isDark ? '#94a3b8' : '#64748b',
    fontWeight: '600',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#cbd5e1',
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  printBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
});
