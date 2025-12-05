import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { databaseService } from '../shared/services/database';
import { syncService } from '../shared/services/syncService';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize database and sync services on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing SLR Meter Reader App...');
        
        // Initialize SQLite database
        await databaseService.initDatabase();
        console.log('✅ Database initialized');
        
        // Start auto-sync service
        await syncService.startAutoSync();
        console.log('✅ Sync service started');
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
