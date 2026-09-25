import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Image,
  ActivityIndicator
} from 'react-native';
import { useMobile } from '../context/MobileContext';
import MobileVoucherModal from '../components/MobileVoucherModal';

export default function HomeScreen({ onNavigateToAdd, onNavigateToHistory }) {
  const { 
    theme, 
    formatMoney, 
    formatDate, 
    settings, 
    accounts, 
    apiBaseUrl,
    connectionStatus,
    fetchData 
  } = useMobile();

  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    net_profit: 0,
    bank_total_balance: 0,
    cash_total_balance: 0,
    net_liquidity: 0
  });

  const loadData = useCallback(async () => {
    try {
      // 1. Reports Summary
      const repRes = await fetch(`${apiBaseUrl}/api/reports.php`);
      const repData = await repRes.json();
      if (repData.status === 'success' && repData.summary) {
        setSummary(repData.summary);
      }

      // 2. Recent Transactions
      const txRes = await fetch(`${apiBaseUrl}/api/transactions.php?limit=10`);
      const txData = await txRes.json();
      if (txData.status === 'success') {
        setRecentTransactions(txData.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await loadData();
    setRefreshing(false);
  };

  const isDark = theme === 'dark';
  const styles = getStyles(isDark);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image 
            source={{ uri: "https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png" }} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.appTitle}>Simple Accounting</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'connected' ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.subtitle}>
                {connectionStatus === 'connected' ? `Live • ${settings.default_currency || 'BHD'}` : 'Connecting...'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Primary Balance Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>TOTAL LIQUID ASSETS</Text>
        <Text style={styles.heroAmount}>{formatMoney(summary.net_liquidity)}</Text>
        <View style={styles.heroSubRow}>
          <View style={styles.heroSubItem}>
            <Text style={styles.heroSubLabel}>Bank Accounts</Text>
            <Text style={styles.heroSubVal}>{formatMoney(summary.bank_total_balance)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroSubItem}>
            <Text style={styles.heroSubLabel}>Cash in Hand</Text>
            <Text style={styles.heroSubVal}>{formatMoney(summary.cash_total_balance)}</Text>
          </View>
        </View>
      </View>

      {/* Income & Expense Mini KPIs */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: '#10b98130' }]}>
          <Text style={[styles.kpiTitle, { color: '#059669' }]}>REVENUE</Text>
          <Text style={[styles.kpiAmount, { color: '#059669' }]}>+{formatMoney(summary.total_income)}</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: isDark ? '#4c0519' : '#fff1f2', borderColor: '#f43f5e30' }]}>
          <Text style={[styles.kpiTitle, { color: '#e11d48' }]}>EXPENSES</Text>
          <Text style={[styles.kpiAmount, { color: '#e11d48' }]}>-{formatMoney(summary.total_expense)}</Text>
        </View>
      </View>

      {/* Big Action Buttons for Fast Entry */}
      <Text style={styles.sectionHeader}>QUICK ENTRY</Text>
      <View style={styles.actionsGrid}>
        
        {/* Daily Expense Button */}
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} 
          onPress={() => onNavigateToAdd('expense')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnIcon}>📉</Text>
          <Text style={styles.actionBtnTitle}>+ Expense</Text>
          <Text style={styles.actionBtnSub}>Bill / Receipt</Text>
        </TouchableOpacity>

        {/* Daily Income Button */}
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]} 
          onPress={() => onNavigateToAdd('income')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnIcon}>📈</Text>
          <Text style={styles.actionBtnTitle}>+ Income</Text>
          <Text style={styles.actionBtnSub}>Sale / Invoice</Text>
        </TouchableOpacity>

        {/* Bank Transfer Button */}
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#6366F1' }]} 
          onPress={() => onNavigateToAdd('bank_transfer')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnIcon}>🔄</Text>
          <Text style={styles.actionBtnTitle}>Transfer</Text>
          <Text style={styles.actionBtnSub}>Bank & Cash</Text>
        </TouchableOpacity>

        {/* Other Activity Button */}
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]} 
          onPress={() => onNavigateToAdd('other')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnIcon}>📋</Text>
          <Text style={styles.actionBtnTitle}>Other</Text>
          <Text style={styles.actionBtnSub}>Journal Entry</Text>
        </TouchableOpacity>

      </View>

      {/* Recent Entries */}
      <View style={styles.recentHeaderRow}>
        <Text style={styles.sectionHeader}>RECENT TRANSACTIONS</Text>
        <TouchableOpacity onPress={onNavigateToHistory}>
          <Text style={styles.viewAllText}>View All &rarr;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsList}>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((tx) => {
            const isInc = tx.type === 'income';
            const isExp = tx.type === 'expense';
            return (
              <TouchableOpacity 
                key={tx.id} 
                style={styles.txRow}
                activeOpacity={0.7}
                onPress={() => setSelectedVoucher(tx)}
              >
                <View style={styles.txLeft}>
                  <View style={[styles.txBadge, { backgroundColor: isInc ? '#10B98120' : isExp ? '#EF444420' : '#6366F120' }]}>
                    <Text style={{ fontSize: 16 }}>{isInc ? '🟢' : isExp ? '🔴' : '🟣'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.voucher_no ? `${tx.voucher_no} • ` : ''}{tx.payee_payer || tx.category_name || 'Transaction'}
                    </Text>
                    <Text style={styles.txSubtitle}>
                      {formatDate(tx.transaction_date)} • {tx.category_name || tx.payment_method}
                    </Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isInc ? '#10B981' : isExp ? '#EF4444' : '#6366F1' }]}>
                    {isInc ? '+' : isExp ? '-' : ''}{formatMoney(tx.amount)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                    {tx.attachment_count > 0 && (
                      <Text style={styles.txReceiptBadge}>📎 Receipt</Text>
                    )}
                    <Text style={[styles.txReceiptBadge, { color: '#047857', backgroundColor: '#ecfdf5' }]}>🖨️ A5</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No entries recorded yet</Text>
        )}
      </View>

      {/* Mobile A5 Voucher Modal */}
      {selectedVoucher && (
        <MobileVoucherModal
          visible={!!selectedVoucher}
          transaction={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
    paddingTop: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    fontWeight: '500',
  },
  heroCard: {
    backgroundColor: isDark ? '#0f172a' : '#0284c7',
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#bae6fd',
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 6,
  },
  heroSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroSubItem: {
    flex: 1,
  },
  heroSubLabel: {
    fontSize: 11,
    color: '#e0f2fe',
  },
  heroSubVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  kpiTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 10,
    marginTop: 6,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  actionBtn: {
    width: '48%',
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  transactionsList: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  txBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  txSubtitle: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txReceiptBadge: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    color: isDark ? '#64748b' : '#94a3b8',
    fontSize: 12,
  },
});
