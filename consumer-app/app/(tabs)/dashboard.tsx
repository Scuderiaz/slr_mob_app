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
import { notificationService } from '../../services/notificationService';
import NotificationBell from '../../components/NotificationBell';
import { User, Bill } from '../../types/consumer';

export default function DashboardScreen() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
  const [totalAmountDue, setTotalAmountDue] = useState(0);
  const [unpaidBillsCount, setUnpaidBillsCount] = useState(0);
  const [latestReading, setLatestReading] = useState<any>(null);

  const loadDashboardData = async () => {
    try {
      // Get user from AsyncStorage
      const userData = await AsyncStorage.getItem('consumer_user');
      if (!userData) {
        router.replace('/login');
        return;
      }

      const parsedUser = JSON.parse(userData) as User;
      setUser(parsedUser);

      // Initialize database
      await databaseService.initDatabase();

      // Load dashboard data
      if (parsedUser.Consumer_ID) {
        const [bill, total, unpaid, reading] = await Promise.all([
          databaseService.getLatestBill(parsedUser.Consumer_ID),
          databaseService.getTotalAmountDue(parsedUser.Consumer_ID),
          databaseService.getUnpaidBillsCount(parsedUser.Consumer_ID),
          databaseService.getLatestReading(parsedUser.Consumer_ID),
        ]);

        setLatestBill(bill);
        setTotalAmountDue(total);
        setUnpaidBillsCount(unpaid);
        setLatestReading(reading);

        // Check for new bills and create notifications
        await checkForNewBills(parsedUser.Consumer_ID, bill);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check for new bills and create notifications
  const checkForNewBills = async (consumerId: number, latestBill: Bill | null) => {
    try {
      if (!latestBill) return;

      // Check if this bill is new (created in the last 24 hours)
      const billDate = new Date(latestBill.Due_Date);
      const now = new Date();
      const hoursSinceCreated = (now.getTime() - billDate.getTime()) / (1000 * 60 * 60);

      // If bill is less than 24 hours old, it might be new
      if (hoursSinceCreated < 24) {
        // Check if we've already notified about this bill
        const lastNotifiedBill = await AsyncStorage.getItem('lastNotifiedBill');
        
        if (lastNotifiedBill !== latestBill.Bill_ID?.toString()) {
          // Create notification for new bill
          await notificationService.notifyNewBill(
            latestBill.Total_Amount || 0,
            formatDate(latestBill.Due_Date),
            latestBill.Bill_ID?.toString() || ''
          );

          // Mark this bill as notified
          await AsyncStorage.setItem('lastNotifiedBill', latestBill.Bill_ID?.toString() || '');
          
          console.log('✅ New bill notification created');
        }
      }

      // Check for overdue bills
      if (latestBill.Payment_Status === 'Unpaid') {
        const dueDate = new Date(latestBill.Due_Date);
        const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysPastDue > 0) {
          // Check if we've already sent overdue notification today
          const lastOverdueNotification = await AsyncStorage.getItem('lastOverdueNotification');
          const today = now.toDateString();
          
          if (lastOverdueNotification !== today) {
            await notificationService.notifyBillOverdue(
              latestBill.Total_Amount || 0,
              daysPastDue
            );
            
            await AsyncStorage.setItem('lastOverdueNotification', today);
            console.log('⚠️ Overdue bill notification created');
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new bills:', error);
    }
  };

  // Load data on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleDownloadReceipt = () => {
    Alert.alert(
      '📄 Receipt Download',
      'In production, this would generate a PDF file of your receipt.\n\nFor now, please use the Print button to save as PDF.',
      [{ text: 'OK' }]
    );
  };

  const handlePrintReceipt = () => {
    Alert.alert(
      '🖨️ Print Receipt',
      'Print functionality would open the native print dialog here.',
      [{ text: 'OK' }]
    );
  };

  const handleViewReceipt = () => {
    router.push('/receipt-modal');
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Calculate days until due date
  const getDaysUntilDue = (dueDate: string) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const daysUntilDue = latestBill ? getDaysUntilDue(latestBill.Due_Date) : 0;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
      }
    >
      {/* New Receipt Banner */}
      {showBanner && latestReading && (
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>New Reading Receipt Received!</Text>
            <Text style={styles.bannerText}>Your meter was read on {formatDate(latestReading.Reading_Date)}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowBanner(false)}>
            <Text style={styles.bannerClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Welcome Section */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeGlow} />
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeLabel}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{user?.First_Name} {user?.Last_Name}</Text>
            </View>
            <NotificationBell 
              onNotificationPress={(notification) => {
                if (notification.type === 'bill') {
                  router.push('/(tabs)/history');
                }
              }}
            />
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Account: {user?.Account_Number || 'N/A'}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Zone: {user?.Zone_Name || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Status: {user?.Status || 'Active'}</Text>
          </View>
        </View>
      </View>

      {/* Amount Due Card */}
      <View style={styles.dueCard}>
        <View style={styles.dueAccent} />
        <View style={styles.dueContent}>
          <View style={styles.dueHeader}>
            <Text style={styles.dueLabel}>Total Amount Due</Text>
          </View>
          <Text style={styles.dueAmount}>₱{totalAmountDue.toFixed(2)}</Text>
          <View style={styles.dueDateContainer}>
            <View>
              <Text style={styles.dueDateLabel}>Due Date</Text>
              <Text style={styles.dueDate}>{latestBill ? formatDate(latestBill.Due_Date) : 'N/A'}</Text>
            </View>
            <View style={[styles.daysLeftBadge, daysUntilDue < 0 && styles.overdueBadge]}>
              <Text style={[styles.daysLeftText, daysUntilDue < 0 && styles.overdueText]}>
                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{latestReading?.Consumption || 0}</Text>
          <Text style={styles.statLabel}>m³ Used</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{unpaidBillsCount}</Text>
          <Text style={styles.statLabel}>Unpaid Bills</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Active</Text>
          <Text style={styles.statLabel}>Account Status</Text>
        </View>
      </View>

      {/* Latest Receipt */}
      {latestBill ? (
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Latest Receipt</Text>
            <View style={[styles.unpaidChip, latestBill.Payment_Status === 'Paid' && styles.paidChip]}>
              <Text style={[styles.unpaidText, latestBill.Payment_Status === 'Paid' && styles.paidText]}>
                {latestBill.Payment_Status || 'Unpaid'}
              </Text>
            </View>
          </View>

          <View style={styles.receiptContent}>
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptName}>Bayarin sa Tubig</Text>
              <Text style={styles.receiptDate}>{latestBill.Billing_Month}</Text>
            </View>

            <View style={styles.receiptSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Consumption:</Text>
                <Text style={styles.summaryValue}>{latestBill.Consumption || 0} m³</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Month:</Text>
                <Text style={styles.summaryAmount}>₱{latestBill.Amount_Due?.toFixed(2) || '0.00'}</Text>
              </View>
              {latestBill.Previous_Balance > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Previous Balance:</Text>
                  <Text style={styles.summaryAmount}>₱{latestBill.Previous_Balance?.toFixed(2) || '0.00'}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total Due:</Text>
                <Text style={styles.totalAmount}>₱{latestBill.Total_Amount?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownloadReceipt}
              >
                <Text style={styles.actionButtonText}>📥 Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePrintReceipt}
              >
                <Text style={styles.actionButtonText}>🖨️ Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleViewReceipt}
              >
                <Text style={styles.primaryButtonText}>👁️ View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyText}>No bills yet</Text>
          <Text style={styles.emptySubtext}>Your bills will appear here once generated</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  content: {
    padding: 12,
    paddingBottom: 100,
  },
  banner: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIcon: {
    fontSize: 20,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontWeight: '700',
    color: '#155724',
    fontSize: 14,
  },
  bannerText: {
    fontSize: 12,
    color: '#155724',
  },
  bannerClose: {
    fontSize: 24,
    color: '#155724',
    fontWeight: '700',
  },
  welcomeCard: {
    backgroundColor: '#1a73e8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  welcomeGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  welcomeContent: {
    position: 'relative',
    zIndex: 1,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  welcomeLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a5d6a7',
  },
  dueCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
    overflow: 'hidden',
  },
  dueAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#1a73e8',
  },
  dueContent: {
    paddingLeft: 12,
  },
  dueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dueIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueIconText: {
    fontSize: 16,
  },
  dueLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  dueAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 20,
  },
  dueDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dueDateLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  daysLeftBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f57c00',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  unpaidChip: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unpaidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  receiptContent: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  receiptInfo: {
    marginBottom: 16,
  },
  receiptName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  receiptSummary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a73e8',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTotal: {
    borderTopWidth: 2,
    borderTopColor: '#1a73e8',
    borderBottomWidth: 0,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a73e8',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    backgroundColor: '#1a73e8',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
  overdueBadge: {
    backgroundColor: '#fee2e2',
  },
  overdueText: {
    color: '#dc2626',
  },
  paidChip: {
    backgroundColor: '#d1fae5',
  },
  paidText: {
    color: '#059669',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
