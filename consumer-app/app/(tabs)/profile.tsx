import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { databaseService } from '../../services/database';
import { User } from '../../types/consumer';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const loadProfileData = async () => {
    try {
      const userData = await AsyncStorage.getItem('consumer_user');
      if (!userData) {
        router.replace('/login');
        return;
      }

      const parsedUser = JSON.parse(userData) as User;
      setUser(parsedUser);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('consumer_user');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature coming soon!');
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@slrwater.gov.ph\nPhone: (054) 123-4567',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.name}>{user?.First_Name} {user?.Last_Name}</Text>
          <Text style={styles.accountNumber}>Account No. {user?.Account_Number || 'N/A'}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✅ {user?.Status || 'Active'} Account</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>🆔</Text>
            </View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputValue}>{user?.First_Name} {user?.Last_Name}</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputValue}>{user?.Address || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Zone</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputValue}>{user?.Zone_Name || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Phone</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputValue}>{user?.Contact_Number || 'N/A'}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleEditProfile}>
            <Text style={styles.saveButtonText}>💾 Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, styles.contractIcon]}>
              <Text style={styles.contractIconText}>📄</Text>
            </View>
            <Text style={styles.sectionTitle}>Account Details</Text>
          </View>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Text style={styles.detailValue}>{user?.Account_Number || 'N/A'}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Classification</Text>
              <Text style={styles.detailValue}>{user?.Classification_Name || 'N/A'}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Meter Number</Text>
              <Text style={styles.detailValue}>{user?.Meter_Number || 'N/A'}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, styles.activeStatus]}>{user?.Status || 'Active'}</Text>
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, styles.securityIcon]}>
              <Text style={styles.securityIconText}>🔒</Text>
            </View>
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <TouchableOpacity style={styles.securityButton} onPress={handleChangePassword}>
            <Text style={styles.securityButtonText}>🔑 Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1a73e8',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 12,
    paddingBottom: 120,
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarIcon: {
    fontSize: 36,
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconText: {
    fontSize: 18,
    color: '#1a73e8',
  },
  contractIcon: {
    backgroundColor: '#fff3e0',
  },
  contractIconText: {
    fontSize: 18,
    color: '#ff9800',
  },
  securityIcon: {
    backgroundColor: '#ffebee',
  },
  securityIconText: {
    fontSize: 18,
    color: '#f44336',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputValue: {
    fontSize: 14,
    color: '#202124',
  },
  inputPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  activeStatus: {
    color: '#4caf50',
  },
  securityButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  securityButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202124',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  // New styles for database integration
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
