import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  RefreshControl,
  Image,
  Modal,
  Platform
} from 'react-native';
import { useMobile } from '../context/MobileContext';
import MobileVoucherModal from '../components/MobileVoucherModal';

export default function HistoryScreen() {
  const { 
    theme, 
    formatMoney, 
    formatDate, 
    apiBaseUrl, 
    settings 
  } = useMobile();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedType) params.append('type', selectedType);
      params.append('limit', '100');

      const res = await fetch(`${apiBaseUrl}/api/transactions.php?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setTransactions(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, search, selectedType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const isDark = theme === 'dark';
  const styles = getStyles(isDark);

  const renderItem = ({ item }) => {
    const isInc = item.type === 'income';
    const isExp = item.type === 'expense';
    const hasAtt = item.attachments && item.attachments.length > 0;
    const itemCount = (item.items && item.items.length > 0) ? item.items.length : 1;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => setSelectedVoucher(item)}
      >
        <View style={styles.cardTop}>
          <View style={styles.typeBadge}>
            <Text style={[styles.typeText, { color: isInc ? '#10B981' : isExp ? '#EF4444' : '#6366F1' }]}>
              {item.voucher_no || item.type.toUpperCase()} • {item.category_name || 'General'}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.transaction_date)}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.payeeText} numberOfLines={1}>
              {item.payee_payer || item.category_name || 'Transaction'}
            </Text>
            {item.notes ? (
              <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
            ) : null}
            <Text style={styles.accountText}>
              {item.from_account_name || item.to_account_name || item.payment_method}
              {itemCount > 1 ? ` • ${itemCount} Line Items` : ''}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amountText, { color: isInc ? '#10B981' : isExp ? '#EF4444' : '#6366F1' }]}>
              {isInc ? '+' : isExp ? '-' : ''}{formatMoney(item.amount)}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {hasAtt && (
                <TouchableOpacity 
                  style={styles.attachmentBadge}
                  onPress={(e) => {
                    e.stopPropagation();
                    setPreviewAttachment(item.attachments[0]);
                  }}
                >
                  <Text style={styles.attBadgeText}>📎 Receipt</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.printBadge}
                onPress={() => setSelectedVoucher(item)}
              >
                <Text style={styles.printBadgeText}>🖨️ A5</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Voucher #, Payee, Invoice or Notes..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Type Filter Pills */}
      <View style={styles.filterRow}>
        {[
          { id: '', label: 'All' },
          { id: 'expense', label: 'Expenses (PV)' },
          { id: 'income', label: 'Income (RCP)' },
          { id: 'bank_transfer', label: 'Transfers (TRF)' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setSelectedType(f.id)}
            style={[
              styles.filterPill,
              selectedType === f.id && styles.filterPillActive
            ]}
          >
            <Text style={[styles.filterText, selectedType === f.id && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Loading transactions...' : 'No transactions found'}
          </Text>
        }
      />

      {/* Receipt Image Modal Preview */}
      {previewAttachment && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{previewAttachment.file_name}</Text>
                <TouchableOpacity onPress={() => setPreviewAttachment(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <Image 
                source={{ uri: previewAttachment.file_url || `${apiBaseUrl}/${previewAttachment.file_path}` }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Mobile A5 Voucher & Receipt Modal */}
      {selectedVoucher && (
        <MobileVoucherModal
          visible={!!selectedVoucher}
          transaction={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}

    </View>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBox: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: isDark ? '#ffffff' : '#0f172a',
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0284c7',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dateText: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  payeeText: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  notesText: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },
  accountText: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '900',
  },
  attachmentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: isDark ? '#082f49' : '#e0f2fe',
  },
  attBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  printBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b98160',
  },
  printBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: isDark ? '#6ee7b7' : '#047857',
  },
  emptyText: {
    textAlign: 'center',
    padding: 30,
    color: isDark ? '#64748b' : '#94a3b8',
    fontSize: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  fullImage: {
    width: '100%',
    height: 350,
    borderRadius: 12,
  },
});
