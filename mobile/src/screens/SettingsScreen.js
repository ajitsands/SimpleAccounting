import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Switch
} from 'react-native';
import { useMobile } from '../context/MobileContext';

export default function SettingsScreen() {
  const { 
    theme, 
    toggleTheme, 
    apiBaseUrl, 
    saveApiBaseUrl, 
    resetEndpointConfig,
    settings, 
    connectionStatus,
    fetchData,
    user,
    logout 
  } = useMobile();

  const [inputUrl, setInputUrl] = useState(apiBaseUrl);
  const [testing, setTesting] = useState(false);

  const isDark = theme === 'dark';
  const styles = getStyles(isDark);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleApplyUrl = async (url) => {
    setInputUrl(url);
    await saveApiBaseUrl(url, true);
    Alert.alert('Applied', `API Endpoint set to: ${url}`);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${inputUrl}/api/settings.php`);
      const data = await res.json();
      if (data.status === 'success') {
        await saveApiBaseUrl(inputUrl, true);
        Alert.alert('Connected Successfully!', `Connected to Simple Accounting API.\nDefault Currency: ${data.settings?.default_currency || 'BHD'}`);
      } else {
        Alert.alert('API Error', data.message || 'Unexpected response');
      }
    } catch (e) {
      Alert.alert('Connection Failed', 'Could not reach server. Verify that PHP server is running and device is connected.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* User Profile & Logout Card */}
      {user && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.avatarBox, { backgroundColor: user.role === 'admin' ? '#4f46e5' : '#0284c7' }]}>
                <Text style={styles.avatarText}>{user.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userRole}>
                  {user.role === 'admin' ? '👑 Administrator' : '👤 Accounts User'} • @{user.username}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={handleLogout}
              style={styles.logoutBtn}
            >
              <Text style={styles.logoutText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Backend API Connection Card */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.cardTitle}>BACKEND API CONNECTION</Text>
          <TouchableOpacity onPress={resetEndpointConfig}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284c7' }}>
              ⚙️ Full Setup Wizard
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardSubtitle}>
          Configure connection mode for USB cable testing, local Wi-Fi, or cloud server
        </Text>

        <View style={styles.statusBox}>
          <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'connected' ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>
            Status: {connectionStatus === 'connected' ? 'Connected to Backend' : 'Disconnected / Error'}
          </Text>
        </View>

        {/* Quick Connection Preset Buttons */}
        <Text style={styles.inputLabel}>QUICK CONNECT PRESETS</Text>
        <View style={styles.presetCol}>
          
          <TouchableOpacity 
            style={[styles.presetBtn, inputUrl.includes('192.168.8.11:3031') && styles.presetBtnActive]}
            onPress={() => handleApplyUrl('http://192.168.8.11:3031')}
          >
            <Text style={styles.presetTitle}>📡 Local Wi-Fi Network</Text>
            <Text style={styles.presetSub}>http://192.168.8.11:3031</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.presetBtn, inputUrl.includes('127.0.0.1:3031') && styles.presetBtnActive]}
            onPress={() => handleApplyUrl('http://127.0.0.1:3031')}
          >
            <Text style={styles.presetTitle}>🔌 USB Cable (adb reverse)</Text>
            <Text style={styles.presetSub}>http://127.0.0.1:3031</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.presetBtn, inputUrl.includes('simpleacc.sandslab.com') && styles.presetBtnActive]}
            onPress={() => handleApplyUrl('https://simpleacc.sandslab.com')}
          >
            <Text style={styles.presetTitle}>☁️ Cloud Production Server</Text>
            <Text style={styles.presetSub}>https://simpleacc.sandslab.com</Text>
          </TouchableOpacity>

        </View>

        {/* Custom URL Input */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>CUSTOM API ENDPOINT URL</Text>
        <TextInput
          style={styles.textInput}
          placeholder="http://192.168.x.x:3031"
          placeholderTextColor="#94a3b8"
          value={inputUrl}
          onChangeText={setInputUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity 
            style={[styles.testBtn, { flex: 1 }]} 
            onPress={handleTestConnection}
            disabled={testing}
          >
            <Text style={styles.testBtnText}>{testing ? 'Testing...' : 'Test & Save URL'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: isDark ? '#334155' : '#cbd5e1' }]} 
            onPress={resetEndpointConfig}
          >
            <Text style={[styles.testBtnText, { color: isDark ? '#ffffff' : '#0f172a' }]}>🔄 Switch Server</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Regional & System Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>REGIONAL CONFIGURATION</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Default Currency</Text>
          <Text style={styles.infoValue}>{settings.default_currency || 'BHD'} (Bahraini Dinar - 3 Decimals)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Timezone</Text>
          <Text style={styles.infoValue}>{settings.timezone || 'Asia/Bahrain'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date Format</Text>
          <Text style={styles.infoValue}>{settings.date_format || 'DD/MM/YYYY'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Organization</Text>
          <Text style={styles.infoValue}>{settings.company_name || 'SaNDSLab Simple Accounting'}</Text>
        </View>

        {settings.company_address ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Address</Text>
            <Text style={styles.infoValue}>{settings.company_address}</Text>
          </View>
        ) : null}

        {settings.tax_number ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>VAT / Tax Reg #</Text>
            <Text style={styles.infoValue}>{settings.tax_number}</Text>
          </View>
        ) : null}
      </View>

      {/* Voucher Numbering & Re-Sequencing Tool */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>VOUCHER NUMBERING & RE-SEQUENCING</Text>
        <Text style={styles.cardSubtitle}>
          Accounting Year (April 1 to March 31). Re-order voucher serial numbers by transaction date if needed.
        </Text>

        <TouchableOpacity 
          style={[styles.testBtn, { backgroundColor: isDark ? '#451a03' : '#fef3c7', borderColor: '#f59e0b', borderWidth: 1, marginTop: 12 }]}
          onPress={() => {
            Alert.alert(
              'Re-Sequence Vouchers',
              'This will sort all vouchers and receipts by Transaction Date and re-number them chronologically (00001, 00002...). Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Re-Sequence',
                  onPress: async () => {
                    try {
                      const res = await fetch(`${apiBaseUrl}/api/transactions.php?action=resequence`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fiscal_year: 'all', type: 'all' })
                      });
                      const data = await res.json();
                      if (data.status === 'success') {
                        Alert.alert('Success', data.message || 'Vouchers re-sequenced successfully.');
                        await fetchData();
                      } else {
                        Alert.alert('Error', data.message || 'Failed to re-sequence.');
                      }
                    } catch (e) {
                      Alert.alert('Error', 'Network error during re-sequencing.');
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={[styles.testBtnText, { color: '#b45309' }]}>🔄 Re-Sequence Vouchers by Date</Text>
        </TouchableOpacity>
      </View>

      {/* Appearance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>APPEARANCE</Text>
        <View style={styles.switchRow}>
          <Text style={styles.infoLabel}>Dark Mode Theme</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </View>

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
  card: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: isDark ? '#ffffff' : '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    marginBottom: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 6,
  },
  presetCol: {
    gap: 8,
  },
  presetBtn: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  presetBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: isDark ? '#082f49' : '#f0f9ff',
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  presetSub: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
  },
  textInput: {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: isDark ? '#ffffff' : '#0f172a',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  testBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  },
  infoLabel: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  userRole: {
    fontSize: 11,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: isDark ? '#3b0764' : '#fee2e2',
    borderWidth: 1,
    borderColor: isDark ? '#701a75' : '#fecaca',
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
});
