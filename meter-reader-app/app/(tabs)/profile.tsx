import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchConsumers, syncReadings } from '../../utils/api';
import { databaseService } from '../../shared/services/database';

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('Juan Dela Cruz');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('Zone 1');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState('');
  const [stats, setStats] = useState({ today: 0, pending: 0, receipts: 0 });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
    checkConnection();
    getDeviceInfo();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async () => {
    try {
      // Initialize database
      await databaseService.initDatabase();
      
      // Load user data from login session
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const fullName = `${userData.First_Name || ''} ${userData.Last_Name || ''}`.trim();
        setName(fullName || userData.Username || 'Meter Reader');
        
        // Handle zone display properly
        if (userData.Zone_ID) {
          setZone(`Zone ${userData.Zone_ID}`);
        } else if (userData.Zone_Name) {
          setZone(userData.Zone_Name);
        } else {
          setZone('All Zones');
        }
      }
      
      // Load additional profile data if exists
      const profile = await AsyncStorage.getItem('meterProfile');
      if (profile) {
        const data = JSON.parse(profile);
        setEmail(data.email || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime).toLocaleString());
      }
      
      // Get real stats from database
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        
        // Fetch consumers from database
        const consumersResponse = await fetchConsumers();
        if (consumersResponse.success && consumersResponse.data) {
          let consumerData = consumersResponse.data;
          
          // Filter by user's zone if meter reader
          if (userData.Role_Name === 'Meter Reader' && userData.Zone_ID) {
            consumerData = consumerData.filter((c: any) => c.Zone_ID === userData.Zone_ID);
          }
          
          // Calculate real stats from database
          const today = consumerData.filter((c: any) => c.status === 'Read').length;
          const pending = consumerData.filter((c: any) => c.status === 'Pending').length;
          const receipts = consumerData.filter((c: any) => c.Current_Reading).length;
          
          setStats({ today, pending, receipts });
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to 0 stats if database fails
      setStats({ today: 0, pending: 0, receipts: 0 });
    }
  };

  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected ?? false);
  };

  const getDeviceInfo = () => {
    const info = `${Device.brand} ${Device.modelName} - ${Platform.OS} ${Platform.Version}`;
    setDeviceInfo(info);
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    // Basic email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Basic phone validation (Philippine format)
    if (phone && !/^(09|\+639)\d{9}$/.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid Philippine phone number (09xxxxxxxxx)');
      return;
    }

    try {
      // Get current user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        Alert.alert('Error', 'User session not found. Please login again.');
        return;
      }

      const userData = JSON.parse(userDataString);
      
      // Update profile in database
      const profileData = { name, email, phone };
      const updateResult = await databaseService.updateUserProfile(userData.AccountID, profileData);
      
      if (updateResult) {
        // Get updated user data from database
        const updatedUserData = await databaseService.getUserData(userData.AccountID);
        
        if (updatedUserData) {
          // Update AsyncStorage with new user data
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
          
          // Update local profile storage
          const profile = { name, email, phone, zone };
          await AsyncStorage.setItem('meterProfile', JSON.stringify(profile));
          
          // Reload profile to reflect changes
          await loadProfile();
          
          Alert.alert('Success', 'Profile updated successfully!');
        } else {
          Alert.alert('Error', 'Failed to retrieve updated profile data');
        }
      } else {
        Alert.alert('Error', 'Failed to update profile in database');
      }
    } catch (error: any) {
      console.error('Profile save error:', error);
      Alert.alert('Error', 'Failed to save profile: ' + error.message);
    }
  };

  const checkOfficeWiFi = async (): Promise<boolean> => {
    try {
      const netInfo = await NetInfo.fetch();
      
      // Check if connected to WiFi
      if (netInfo.type !== 'wifi' || !netInfo.isConnected) {
        return false;
      }
      
      // Check if connected to office WiFi (you can customize this)
      const officeWiFiNames = ['SLR-Office-WiFi', 'SLR-OFFICE', 'Office-WiFi', 'SLR_OFFICE'];
      const currentSSID = netInfo.details?.ssid;
      
      if (currentSSID && officeWiFiNames.some(name => 
        currentSSID.toLowerCase().includes(name.toLowerCase())
      )) {
        return true;
      }
      
      // For development/testing, allow any WiFi connection
      // Remove this in production
      if (__DEV__) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking WiFi:', error);
      return false;
    }
  };

  const syncNow = async () => {
    // Clear previous sync message
    setSyncMessage('');
    
    try {
      // Check if connected to office WiFi
      setSyncing(true);
      setSyncMessage('🔍 Checking office connection...');
      
      const isInOffice = await checkOfficeWiFi();
      
      if (!isInOffice) {
        setSyncing(false);
        setSyncMessage('');
        Alert.alert(
          'Not in Office',
          'Please connect to the office WiFi network to sync your readings.\n\nLook for:\n• SLR-Office-WiFi\n• SLR-OFFICE\n• Office-WiFi',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Start sync process
      setSyncMessage('📤 Syncing readings to office database...');
      
      // Use real sync functionality
      const syncResponse = await syncReadings();
      
      if (syncResponse.success) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem('lastSyncTime', now);
        setLastSync(new Date(now).toLocaleString());
        
        // Reload stats after sync
        await loadStats();
        
        const syncedCount = syncResponse.data?.synced || 0;
        setSyncMessage(`✅ Successfully synced ${syncedCount} readings!`);
        
        // Show success message briefly, then clear
        setTimeout(() => {
          setSyncMessage('');
        }, 3000);
        
        Alert.alert('Sync Complete', `${syncedCount} readings synced to office database successfully!`);
      } else {
        setSyncMessage('❌ Sync failed');
        setTimeout(() => setSyncMessage(''), 3000);
        Alert.alert('Sync Error', syncResponse.error || 'Failed to sync readings');
      }
    } catch (error: any) {
      setSyncMessage('❌ Sync failed');
      setTimeout(() => setSyncMessage(''), 3000);
      Alert.alert('Error', 'Failed to sync readings. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      // Get current user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        Alert.alert('Error', 'User session not found. Please login again.');
        return;
      }

      const userData = JSON.parse(userDataString);
      
      // Get the actual password from database instead of AsyncStorage
      const dbUser = await databaseService.authenticateUser(userData.Username, currentPassword);
      
      if (!dbUser) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }

      // Update password in database
      const updateResult = await databaseService.updateUserPassword(userData.AccountID, newPassword);
      
      if (updateResult) {
        // Update stored user data with new password
        const updatedUserData = { ...userData, Password: newPassword };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Clear form fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        Alert.alert('Success', 'Password changed successfully!');
      } else {
        Alert.alert('Error', 'Failed to update password in database');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      Alert.alert('Error', 'Failed to change password: ' + error.message);
    }
  };

  const clearLocalData = async () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove all local readings and reset the database. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage items
              await AsyncStorage.multiRemove(['readings', 'receiptsPrinted', 'lastSyncTime', 'meterProfile']);
              
              // Clear and reinitialize database
              await databaseService.clearAllData();
              await databaseService.initDatabase(); // Re-initialize with reference data
              
              // Reload profile and stats
              await loadProfile();
              await loadStats();
              
              Alert.alert('Success', 'Local data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear local data');
            }
          }
        }
      ]
    );
  };

  const forceResetDatabase = async () => {
    Alert.alert(
      'Force Reset Database',
      'This will completely rebuild the database from scratch. Use this if you\'re experiencing database errors.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.forceReset();
              
              // Reload profile and stats
              await loadProfile();
              await loadStats();
              
              Alert.alert('Success', 'Database reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset database: ' + error);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Local logout - just clear stored data
              await AsyncStorage.multiRemove(['authToken', 'userData', 'user']);
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Modern Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileRole}>Meter Reader</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>{zone}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.today}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.receipts}</Text>
            <Text style={styles.statLabel}>Receipts</Text>
          </View>
        </View>
      </View>

      {/* Content Sections */}
      <View style={styles.contentContainer}>
        
        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.sectionSubtitle}>Update your profile details</Text>
          </View>
          
          <View style={styles.formGroup}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modernInput}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.modernInput}
                  placeholder="your@email.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.modernInput}
                  placeholder="09xx xxx xxxx"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assigned Zone</Text>
              <View style={styles.disabledInputContainer}>
                <TextInput
                  style={styles.disabledInput}
                  value={zone}
                  editable={false}
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockIconText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.helperText}>Contact your supervisor to change zone assignment</Text>
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Device & Sync Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device & Sync</Text>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: isOnline ? '#d4edda' : '#f8d7da' }]}>
            <Text style={{ fontSize: 16, color: isOnline ? '#10b981' : '#ef4444' }}>{isOnline ? '●' : '●'}</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Connection Status</Text>
            <Text style={[styles.infoMeta, { color: isOnline ? '#155724' : '#721c24' }]}>
              ● {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: '#d1ecf1' }]}>
            <Text style={{ fontSize: 16, color: '#6b7280' }}>●</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Last Sync</Text>
            <Text style={styles.infoMeta}>{lastSync || 'Never'}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: '#e2e3e5' }]}>
            <Text style={{ fontSize: 16, color: '#6b7280' }}>●</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Device Info</Text>
            <Text style={styles.infoMeta} numberOfLines={2}>{deviceInfo}</Text>
          </View>
        </View>
        {/* Sync Message */}
        {syncMessage && (
          <View style={styles.syncMessageContainer}>
            <Text style={styles.syncMessage}>{syncMessage}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.button, syncing && styles.buttonDisabled]} 
          onPress={syncNow}
          disabled={syncing}
        >
          <Text style={[styles.buttonText, syncing && styles.buttonTextDisabled]}>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

        {/* Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security</Text>
            <Text style={styles.sectionSubtitle}>Change your password</Text>
          </View>
          
          <View style={styles.formGroup}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Text style={styles.eyeIcon}>{showCurrentPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="New password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showNewPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={changePassword}>
              <Text style={styles.saveButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        
        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <Text style={styles.sectionSubtitle}>Manage your data and account</Text>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity style={styles.actionButton} onPress={clearLocalData}>
              <Text style={styles.actionButtonText}>Clear Local Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dangerButton} onPress={forceResetDatabase}>
              <Text style={styles.dangerButtonText}>Force Reset Database</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Modern Header Section
  headerSection: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },

  // Content Container
  contentContainer: {
    paddingHorizontal: 20,
  },

  // Section Styles
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Form Styles
  formGroup: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modernInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  disabledInputContainer: {
    position: 'relative',
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  lockIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  lockIconText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Legacy styles for remaining sections
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  field: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    borderColor: '#e5e7eb',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfField: {
    flex: 1,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  syncMessageContainer: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 6,
  },
  syncMessage: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  buttonDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.7,
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  // Action Button Styles
  actionButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Password Container Styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeIcon: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
});
