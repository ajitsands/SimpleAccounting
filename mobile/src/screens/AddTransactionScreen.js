import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMobile } from '../context/MobileContext';
import MobileVoucherModal from '../components/MobileVoucherModal';

export default function AddTransactionScreen({ initialType = 'expense', onDone }) {
  const { 
    theme, 
    settings, 
    categories, 
    accounts, 
    apiBaseUrl, 
    fetchData,
    formatMoney 
  } = useMobile();

  const [type, setType] = useState(initialType);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  const cashAcc = accounts.find((a) => a.account_type === 'cash' || a.account_name.includes('Petty Cash')) || accounts[0];
  const bankAcc = accounts.find((a) => a.account_type === 'bank') || (accounts.length > 1 ? accounts[1] : accounts[0]);

  const [fromAccountId, setFromAccountId] = useState(
    initialType === 'bank_transfer' ? (bankAcc?.id || null) : (cashAcc?.id || null)
  );
  const [toAccountId, setToAccountId] = useState(
    initialType === 'bank_transfer' ? (cashAcc?.id || null) : (cashAcc?.id || null)
  );
  const [payeePayer, setPayeePayer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [isCustomVoucher, setIsCustomVoucher] = useState(false);
  const [notes, setNotes] = useState('');

  // Multi-line Items State
  const [lineItems, setLineItems] = useState([
    { item_description: '', category_id: null, quantity: '1', amount: '' }
  ]);

  // Attachment & Modal State
  const [receiptImage, setReceiptImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedVoucher, setSavedVoucher] = useState(null);

  const isDark = theme === 'dark';
  const styles = getStyles(isDark);

  const filteredCategories = categories.filter((c) => {
    if (type === 'bank_transfer') return false;
    return c.type === type;
  });

  const totalAmount = lineItems.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { item_description: '', category_id: selectedCategoryId || null, quantity: '1', amount: '' }
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) {
      setLineItems([{ item_description: '', category_id: null, quantity: '1', amount: '' }]);
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Launch Camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take receipt photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReceiptImage(result.assets[0]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  // Pick from Gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library access is required to select receipts.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReceiptImage(result.assets[0]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  const handleSave = async (printAfter = false) => {
    if (totalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please add at least one item with a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const validItems = lineItems
        .filter((it) => parseFloat(it.amount) > 0 || (it.item_description && it.item_description.trim().length > 0))
        .map((it) => ({
          item_description: it.item_description ? it.item_description.trim() : (payeePayer || 'Item'),
          category_id: it.category_id || selectedCategoryId || null,
          quantity: parseFloat(it.quantity) || 1,
          unit_price: parseFloat(it.amount) || 0,
          amount: parseFloat(it.amount) || 0,
        }));

      const payload = {
        type,
        amount: totalAmount,
        transaction_date: date,
        category_id: selectedCategoryId || validItems[0]?.category_id || null,
        from_account_id: type !== 'income' ? fromAccountId : null,
        to_account_id: type !== 'expense' ? toAccountId : null,
        payee_payer: payeePayer.trim() || validItems[0]?.item_description || '',
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim(),
        voucher_no: isCustomVoucher && voucherNo.trim() ? voucherNo.trim() : undefined,
        notes: notes.trim(),
        status: 'completed',
        items: validItems
      };

      if (receiptImage && receiptImage.base64) {
        payload.attachment_base64 = receiptImage.base64;
        payload.attachment_filename = `mobile_receipt_${Date.now()}.jpg`;
      }

      const res = await fetch(`${apiBaseUrl}/api/transactions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === 'success') {
        await fetchData();

        const fromAccObj = accounts.find((a) => a.id === fromAccountId);
        const toAccObj = accounts.find((a) => a.id === toAccountId);

        const voucherObj = {
          id: data.data?.id || 1,
          voucher_no: data.data?.voucher_no || voucherNo || '',
          fiscal_year: data.data?.fiscal_year || '',
          transaction_date: date,
          type,
          amount: totalAmount,
          category_name: categories.find((c) => c.id === selectedCategoryId)?.name || '',
          from_account_name: fromAccObj ? fromAccObj.account_name : '',
          to_account_name: toAccObj ? toAccObj.account_name : '',
          payee_payer: payeePayer.trim() || validItems[0]?.item_description || '',
          payment_method: paymentMethod,
          reference_number: referenceNumber.trim(),
          notes: notes.trim(),
          items: validItems
        };

        if (printAfter) {
          setSavedVoucher(voucherObj);
        } else {
          Alert.alert(
            'Voucher Created!',
            `Saved as ${data.data?.voucher_no || voucherNo || 'Voucher'} (Total: ${formatMoney(totalAmount)})`,
            [
              { text: 'Print / Share A5', onPress: () => setSavedVoucher(voucherObj) },
              { text: 'OK', onPress: () => { if (onDone) onDone(); } }
            ]
          );
        }
      } else {
        Alert.alert('Error', data.message || 'Could not save transaction.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Check connection to backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Type Switcher */}
      <View style={styles.typeRow}>
        {[
          { id: 'expense', label: 'Expense (PV)', color: '#EF4444' },
          { id: 'income', label: 'Income (RCP)', color: '#10B981' },
          { id: 'bank_transfer', label: 'Transfer (TRF)', color: '#6366F1' },
          { id: 'other', label: 'Other (JV)', color: '#8B5CF6' }
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => { setType(t.id); setSelectedCategoryId(null); }}
            style={[
              styles.typeTab,
              type === t.id && { backgroundColor: t.color, borderColor: t.color }
            ]}
          >
            <Text style={[styles.typeTabText, type === t.id && { color: '#ffffff' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date, Voucher Number & Payee Card */}
      <View style={styles.card}>
        <Text style={styles.inputLabel}>TRANSACTION DATE</Text>
        <TextInput
          style={styles.textInput}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
        />

        {/* Voucher # Override */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
          <Text style={styles.inputLabel}>OFFICIAL VOUCHER / RECEIPT #</Text>
          <TouchableOpacity onPress={() => setIsCustomVoucher(!isCustomVoucher)}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284c7' }}>
              {isCustomVoucher ? '← Reset to Auto' : '✎ Custom Suffix'}
            </Text>
          </TouchableOpacity>
        </View>
        {isCustomVoucher ? (
          <TextInput
            style={[styles.textInput, { fontFamily: 'monospace', fontWeight: 'bold', borderColor: '#0284c7' }]}
            placeholder="e.g. PV-26-27-00005A"
            placeholderTextColor="#94a3b8"
            value={voucherNo}
            onChangeText={setVoucherNo}
          />
        ) : (
          <View style={[styles.textInput, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
              [Auto Sequence by Fiscal Year]
            </Text>
          </View>
        )}

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>
          {type === 'income' 
            ? 'RECEIVED FROM (CLIENT / PAYER)' 
            : type === 'bank_transfer'
            ? 'TRANSFER PARTY / PURPOSE'
            : 'PAID TO (VENDOR / BENEFICIARY)'}
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Store, Company, Client or Vendor name"
          placeholderTextColor="#94a3b8"
          value={payeePayer}
          onChangeText={setPayeePayer}
        />
      </View>

      {/* Multi-Line Items Card */}
      <View style={styles.card}>
        <View style={styles.lineHeader}>
          <Text style={styles.inputLabel}>LINE ITEMS ({lineItems.length})</Text>
          <TouchableOpacity onPress={handleAddLineItem} style={styles.addItemBtn}>
            <Text style={styles.addItemBtnText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {lineItems.map((item, index) => (
          <View key={index} style={styles.itemBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.itemIndexText}>Item #{index + 1}</Text>
              {lineItems.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveLineItem(index)}>
                  <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>✕ Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={[styles.textInput, { marginBottom: 6 }]}
              placeholder="Description (e.g. Office Supplies, Fuel, Cartridge)"
              placeholderTextColor="#94a3b8"
              value={item.item_description}
              onChangeText={(val) => handleLineItemChange(index, 'item_description', val)}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.textInput, { flex: 1, textAlign: 'center' }]}
                placeholder="Qty (1)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={item.quantity}
                onChangeText={(val) => handleLineItemChange(index, 'quantity', val)}
              />

              <TextInput
                style={[styles.textInput, { flex: 2, fontWeight: '800' }]}
                placeholder="Amount (0.000)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={item.amount}
                onChangeText={(val) => handleLineItemChange(index, 'amount', val)}
              />
            </View>
          </View>
        ))}

        {/* Total Summary */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>TOTAL AMOUNT ({settings.default_currency || 'BHD'})</Text>
          <Text style={styles.totalVal}>{formatMoney(totalAmount)}</Text>
        </View>
      </View>

      {/* Categories Selector (Chips) */}
      {type !== 'bank_transfer' && (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>PRIMARY CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={[
                    styles.catChip,
                    isSelected && { backgroundColor: cat.color || '#0284c7', borderColor: cat.color || '#0284c7' }
                  ]}
                >
                  <Text style={[styles.catChipText, isSelected && { color: '#ffffff' }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Account Selectors */}
      {type === 'bank_transfer' ? (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>TRANSFER FROM (SOURCE ACCOUNT)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => {
              const isSelected = fromAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={`from-${acc.id}`}
                  onPress={() => setFromAccountId(acc.id)}
                  style={[
                    styles.catChip,
                    isSelected && { backgroundColor: '#6366F1', borderColor: '#6366F1' }
                  ]}
                >
                  <Text style={[styles.catChipText, isSelected && { color: '#ffffff' }]}>
                    {acc.account_type === 'cash' ? '💵 ' : '🏦 '}{acc.account_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>TRANSFER TO (DESTINATION / PETTY CASH)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => {
              const isSelected = toAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={`to-${acc.id}`}
                  onPress={() => setToAccountId(acc.id)}
                  style={[
                    styles.catChip,
                    isSelected && { backgroundColor: '#10B981', borderColor: '#10B981' }
                  ]}
                >
                  <Text style={[styles.catChipText, isSelected && { color: '#ffffff' }]}>
                    {acc.account_type === 'cash' ? '💵 ' : '🏦 '}{acc.account_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>
            {type === 'income' ? 'DEPOSIT TO ACCOUNT' : 'PAY FROM ACCOUNT'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {accounts.map((acc) => {
              const targetId = type === 'income' ? toAccountId : fromAccountId;
              const isSelected = targetId === acc.id;
              return (
                <TouchableOpacity
                  key={`acc-${acc.id}`}
                  onPress={() => {
                    if (type === 'income') setToAccountId(acc.id);
                    else setFromAccountId(acc.id);
                  }}
                  style={[
                    styles.catChip,
                    isSelected && { backgroundColor: '#0284c7', borderColor: '#0284c7' }
                  ]}
                >
                  <Text style={[styles.catChipText, isSelected && { color: '#ffffff' }]}>
                    {acc.account_type === 'cash' ? '💵 ' : '🏦 '}{acc.account_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Details & Payment Method */}
      <View style={styles.card}>
        <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodRow}>
          {['Cash', 'BenefitPay', 'Bank Transfer', 'Card', 'Cheque'].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setPaymentMethod(m)}
              style={[
                styles.methodChip,
                paymentMethod === m && styles.methodChipActive
              ]}
            >
              <Text style={[styles.methodChipText, paymentMethod === m && styles.methodChipTextActive]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>REFERENCE # / INVOICE</Text>
        <TextInput
          style={styles.textInput}
          placeholder="INV-001 or Cheque #"
          placeholderTextColor="#94a3b8"
          value={referenceNumber}
          onChangeText={setReferenceNumber}
        />

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>GENERAL NOTES</Text>
        <TextInput
          style={[styles.textInput, { height: 50 }]}
          placeholder="Remarks or payment notes..."
          placeholderTextColor="#94a3b8"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Receipt Photo / Camera Attachment Card */}
      <View style={styles.card}>
        <Text style={styles.inputLabel}>RECEIPT / BILL ATTACHMENT</Text>

        {receiptImage ? (
          <View style={styles.receiptPreviewBox}>
            <Image source={{ uri: receiptImage.uri }} style={styles.receiptThumb} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.receiptName}>Receipt Photo Attached</Text>
              <TouchableOpacity onPress={() => setReceiptImage(null)} style={{ marginTop: 6 }}>
                <Text style={styles.removeText}>✕ Remove Attachment</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.attachmentBtnRow}>
            <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
              <Text style={{ fontSize: 20 }}>📷</Text>
              <Text style={styles.attachBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
              <Text style={{ fontSize: 20 }}>🖼️</Text>
              <Text style={styles.attachBtnText}>Photo Library</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 10, marginBottom: 30 }}>
        <TouchableOpacity 
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]} 
          onPress={() => handleSave(false)}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>SAVE TRANSACTION ENTRY</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.printSaveBtn, submitting && { opacity: 0.6 }]} 
          onPress={() => handleSave(true)}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.printSaveBtnText}>🖨️ SAVE & PRINT A5 VOUCHER</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Voucher Modal */}
      {savedVoucher && (
        <MobileVoucherModal
          visible={!!savedVoucher}
          transaction={savedVoucher}
          onClose={() => {
            setSavedVoucher(null);
            if (onDone) onDone();
          }}
        />
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  card: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 6,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addItemBtn: {
    backgroundColor: isDark ? '#082f49' : '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  addItemBtnText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
  },
  itemBox: {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: isDark ? '#38bdf8' : '#0284c7',
  },
  chipsScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#cbd5e1',
    marginRight: 8,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  textInput: {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: isDark ? '#ffffff' : '#0f172a',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  methodChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  methodChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  methodChipTextActive: {
    color: '#ffffff',
  },
  attachmentBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0284c740',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: isDark ? '#1e293b' : '#f5f3ff',
    borderWidth: 1,
    borderColor: '#8b5cf640',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  attachBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
    marginTop: 2,
  },
  receiptPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0284c740',
  },
  receiptThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  receiptName: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  removeText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  printSaveBtn: {
    backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  printSaveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: isDark ? '#6ee7b7' : '#047857',
    letterSpacing: 0.5,
  },
});
