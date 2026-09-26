import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useMobile } from '../context/MobileContext';

export default function SetupEndpointScreen({ onConnected }) {
  const { 
    apiBaseUrl, 
    saveApiBaseUrl, 
    theme, 
    connectionStatus, 
    settings 
  } = useMobile();

  const [inputUrl, setInputUrl] = useState(apiBaseUrl || 'https://simpleacc.sandslab.com');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string, data?: any }

  const isDark = theme === 'dark';
  const styles = getStyles(isDark);

  const presets = [
    { title: '☁️ Cloud Production Server', url: 'https://simpleacc.sandslab.com', desc: 'Secure cloud accounting server (Recommended)' },
    { title: '📡 Local Wi-Fi Network', url: 'http://192.168.8.11:3031', desc: 'Office or home local Wi-Fi' },
    { title: '🔌 USB Reverse (ADB)', url: 'http://127.0.0.1:3031', desc: 'Via USB cable debug bridge' }
  ];

  const handleSelectPreset = (url) => {
    setInputUrl(url);
    setTestResult(null);
  };

  const handleTestAndConnect = async (autoEnter = false) => {
    const cleanUrl = inputUrl.trim().replace(/\/$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please include http:// or https:// in the endpoint URL.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(`${cleanUrl}/api/settings.php`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned HTTP status ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'success') {
        await saveApiBaseUrl(cleanUrl, true);
        setTestResult({
          success: true,
          message: `Connected successfully! Currency: ${data.settings?.default_currency || 'BHD'} • Org: ${data.settings?.company_name || 'SaNDSLab'}`,
          data: data.settings
        });

        if (autoEnter && onConnected) {
          onConnected();
        }
      } else {
        setTestResult({
          success: false,
          message: data.message || 'API endpoint reached but returned invalid response.'
        });
      }
    } catch (err) {
      console.error('Setup Endpoint Test Error:', err);
      let errorMsg = 'Could not reach server. Verify server is running on that IP and device is in same network.';
      if (err.name === 'AbortError') {
        errorMsg = 'Connection timed out after 7 seconds. Please verify the IP and port.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setTestResult({
        success: false,
        message: errorMsg
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Brand Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={{ fontSize: 32 }}>🏛️</Text>
            </View>
            <Text style={styles.appTitle}>SaNDSLab Simple Accounting</Text>
            <Text style={styles.appSubtitle}>SERVER ENDPOINT CONFIGURATION</Text>
            <Text style={styles.headerDesc}>
              Connect your mobile application to your local network or cloud accounting server to begin booking entries.
            </Text>
          </View>

          {/* Setup Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>BACKEND API ENDPOINT URL</Text>
            
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder="http://192.168.x.x:3031"
                placeholderTextColor="#94a3b8"
                value={inputUrl}
                onChangeText={(val) => {
                  setInputUrl(val);
                  setTestResult(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Test Result Message Box */}
            {testResult && (
              <View style={[
                styles.resultBox, 
                testResult.success ? styles.resultBoxSuccess : styles.resultBoxError
              ]}>
                <Text style={testResult.success ? styles.resultTextSuccess : styles.resultTextError}>
                  {testResult.success ? '✓ ' : '✕ '}{testResult.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.primaryBtn, testing && { opacity: 0.7 }]}
                onPress={() => handleTestAndConnect(true)}
                disabled={testing}
                activeOpacity={0.8}
              >
                {testing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>🚀 TEST & CONNECT TO SERVER</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Connect Presets */}
            <Text style={[styles.cardSectionLabel, { marginTop: 22 }]}>QUICK PRESETS</Text>
            <View style={styles.presetsCol}>
              {presets.map((p, idx) => {
                const isSelected = inputUrl.trim().replace(/\/$/, '') === p.url;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.presetCard, isSelected && styles.presetCardActive]}
                    onPress={() => handleSelectPreset(p.url)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetTitle, isSelected && { color: '#0284c7' }]}>
                        {p.title}
                      </Text>
                      <Text style={styles.presetUrl}>{p.url}</Text>
                      <Text style={styles.presetDesc}>{p.desc}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>

          {/* Help & Troubleshooting */}
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>💡 Quick Troubleshooting:</Text>
            <Text style={styles.helpText}>
              • Make sure your computer running the PHP backend server is on the same Wi-Fi network.
            </Text>
            <Text style={styles.helpText}>
              • If using USB debugging, run <Text style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>adb reverse tcp:3031 tcp:3031</Text> on PC.
            </Text>
            <Text style={styles.helpText}>
              • You can reconfigure or switch this endpoint at any time in Settings.
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#090d16' : '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
  },
  header: {
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
    borderWidth: 1,
    borderColor: '#0284c740',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: isDark ? '#ffffff' : '#0f172a',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 4,
    letterSpacing: 1,
  },
  headerDesc: {
    fontSize: 12,
    color: isDark ? '#94a3b8' : '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 320,
  },
  card: {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: isDark ? '#94a3b8' : '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrap: {
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: isDark ? '#ffffff' : '#0f172a',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#cbd5e1',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  resultBox: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  resultBoxSuccess: {
    backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
    borderColor: '#10b981',
  },
  resultBoxError: {
    backgroundColor: isDark ? '#4c0519' : '#fff1f2',
    borderColor: '#f43f5e',
  },
  resultTextSuccess: {
    fontSize: 12,
    color: isDark ? '#a7f3d0' : '#047857',
    fontWeight: '700',
    lineHeight: 16,
  },
  resultTextError: {
    fontSize: 12,
    color: isDark ? '#fecdd3' : '#be123c',
    fontWeight: '700',
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  presetsCol: {
    gap: 8,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  presetCardActive: {
    borderColor: '#0284c7',
    backgroundColor: isDark ? '#0c2438' : '#f0f9ff',
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: isDark ? '#ffffff' : '#0f172a',
  },
  presetUrl: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 2,
  },
  presetDesc: {
    fontSize: 10,
    color: isDark ? '#64748b' : '#94a3b8',
    marginTop: 2,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: isDark ? '#1e293b40' : '#f1f5f980',
    borderWidth: 1,
    borderColor: isDark ? '#33415540' : '#e2e8f080',
  },
  helpTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: isDark ? '#cbd5e1' : '#475569',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 10,
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
});
