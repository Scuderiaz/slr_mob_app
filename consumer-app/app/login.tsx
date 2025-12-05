import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { databaseService } from '../services/database';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initialize database on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize database first
        await databaseService.initDatabase();
        console.log('✅ Consumer App: Database initialization completed');
        
        // Clear any existing user data for fresh start (temporary for testing)
        await AsyncStorage.removeItem('consumer_user');
        await AsyncStorage.removeItem('authToken');
        
        // Check if user is already logged in
        const userData = await AsyncStorage.getItem('consumer_user');
        if (userData) {
          console.log('✅ Consumer App: User already logged in, redirecting...');
          router.replace('/(tabs)');
          return;
        }
      } catch (error) {
        console.error('❌ Consumer App: Failed to initialize:', error);
        Alert.alert('Initialization Error', 'Failed to initialize the app. Please restart.');
      } finally {
        setInitializing(false);
      }
    };

    initApp();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate using real database
      const user = await databaseService.authenticateConsumer(username.trim(), password);
      
      if (user && user.Role_Name === 'Consumer') {
        // Store user data
        await AsyncStorage.setItem('consumer_user', JSON.stringify(user));
        await AsyncStorage.setItem('authToken', 'consumer-auth-' + user.AccountID + '-' + Date.now());

        console.log('✅ Consumer App: Login successful:', user.Username, user.Role_Name);
        
        // Navigate to main app
        router.replace('/(tabs)');
      } else if (user && user.Role_Name !== 'Consumer') {
        Alert.alert('Access Denied', 'This app is only for Consumers. Please use the appropriate app for your role.');
      } else {
        Alert.alert('Login Failed', 'Invalid username or password.\n\nTry:\n• daniel.domingo56 / password123\n• grace.domingo41 / password123\n• jenny.ramos25 / password123');
      }
    } catch (error) {
      console.error('❌ Consumer App: Login error:', error);
      Alert.alert('Error', 'Database connection failed. Please ensure the app is properly initialized.');
    } finally {
      setIsLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingScreenText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/slr-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>SLR Water</Text>
          <Text style={styles.subtitle}>Consumer App</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>Sign in to view your bills</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            San Lorenzo Ruiz Municipal Water Billing System
          </Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f8',
  },
  loadingScreenText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#374151',
  },
  loginButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
