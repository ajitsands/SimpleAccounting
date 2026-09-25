import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MobileProvider, useMobile } from './src/context/MobileContext';
import HomeScreen from './src/screens/HomeScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function MainApp() {
  const { theme } = useMobile();
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'add', 'history', 'settings'
  const [addInitialType, setAddInitialType] = useState('expense');

  const isDark = theme === 'dark';

  const navigateToAddWithType = (type) => {
    setAddInitialType(type);
    setActiveTab('add');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#090d16' : '#f8fafc' }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Screen View */}
      <View style={styles.screenArea}>
        {activeTab === 'home' && (
          <HomeScreen 
            onNavigateToAdd={navigateToAddWithType}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}
        {activeTab === 'add' && (
          <AddTransactionScreen 
            initialType={addInitialType}
            onDone={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomBar, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderTopColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        
        {/* Home */}
        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabActiveText]}>📊</Text>
          <Text style={[styles.tabLabel, { color: activeTab === 'home' ? '#0284c7' : (isDark ? '#94a3b8' : '#64748b') }]}>
            Overview
          </Text>
        </TouchableOpacity>

        {/* Add Entry (Central Plus) */}
        <TouchableOpacity 
          style={styles.addCenterBtn} 
          onPress={() => navigateToAddWithType('expense')}
        >
          <Text style={{ fontSize: 24, color: '#ffffff', fontWeight: 'bold' }}>＋</Text>
        </TouchableOpacity>

        {/* Transactions History */}
        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabIcon, activeTab === 'history' && styles.tabActiveText]}>📜</Text>
          <Text style={[styles.tabLabel, { color: activeTab === 'history' ? '#0284c7' : (isDark ? '#94a3b8' : '#64748b') }]}>
            Ledger
          </Text>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity 
          style={styles.tabBtn} 
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabIcon, activeTab === 'settings' && styles.tabActiveText]}>⚙️</Text>
          <Text style={[styles.tabLabel, { color: activeTab === 'settings' ? '#0284c7' : (isDark ? '#94a3b8' : '#64748b') }]}>
            Settings
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileProvider>
        <MainApp />
      </MobileProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenArea: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderTopWidth: 1,
    paddingHorizontal: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabActiveText: {
    transform: [{ scale: 1.1 }],
  },
  addCenterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
});
