import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useMobile } from '../context/MobileContext';

export default function LoginScreen() {
  const { login, apiBaseUrl, resetEndpointConfig, settings, theme } = useMobile();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isDark = theme === 'dark';
  const styles = getStyles(isDark);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your username and password.');
      return;
    }

    setLoading(true);
    const res = await login(username.trim(), password.trim());
    setLoading(false);

    if (!res.success) {
      if (res.message && res.message.toLowerCase().includes('auditor')) {
        Alert.alert(
          '🔍 Auditor Login Restricted',
          'Auditor accounts are restricted to the Web Portal only for audit review and exporting data to Excel and PDF.\n\nPlease log in via a web browser.'
        );
      } else {
        Alert.alert('Login Failed', res.message || 'Invalid username or password.');
      }
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Top Header & Logo */}
        <View style={styles.headerBox}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 32 }}>🏢</Text>
          </View>
          <Text style={styles.appTitle}>{settings?.company_name || 'SaNDSLab Simple Accounting'}</Text>
          <Text style={styles.appSubtitle}>Mobile Accounting & Expense Tracker</Text>
        </View>

        {/* Server Endpoint Badge */}
        <View style={styles.serverBadgeRow}>
          <View style={styles.serverPill}>
            <Text style={styles.serverDot}>🟢</Text>
            <Text style={styles.serverUrlText} numberOfLines={1}>{apiBaseUrl}</Text>
          </View>
          <TouchableOpacity onPress={resetEndpointConfig} style={styles.changeServerBtn}>
            <Text style={styles.changeServerText}>⚙️ Change</Text>
          </TouchableOpacity>
        </View>

        {/* Form Box */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>SIGN IN TO CONTINUE</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. admin or user"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeBtn} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Auditor Policy Notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>ℹ️ Auditor Role Notice:</Text>
          <Text style={styles.noticeText}>
            Auditors can inspect records and export data to Excel & PDF on the <strong>Web Portal</strong> only. Mobile login is restricted for auditor roles.
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 3,
  },
  serverBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 16,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  serverDot: {
    fontSize: 10,
    marginRight: 6,
  },
  serverUrlText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: isDark ? '#cbd5e1' : '#475569',
  },
  changeServerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
  },
  changeServerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  presetBox: {
    backgroundColor: isDark ? '#131b2e' : '#f0f9ff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#bae6fd',
    marginBottom: 18,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#cbd5e1',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  card: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#e2e8f0' : '#334155',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    color: isDark ? '#ffffff' : '#0f172a',
    fontSize: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    height: 46,
    width: 46,
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    height: 48,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  noticeBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: isDark ? '#06281e' : '#ecfdf5',
    borderWidth: 1,
    borderColor: isDark ? '#064e3b' : '#a7f3d0',
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 11,
    color: isDark ? '#a7f3d0' : '#065f46',
    lineHeight: 16,
  },
});
