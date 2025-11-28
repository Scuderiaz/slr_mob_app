import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* New Receipt Banner */}
      {showBanner && (
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>✅</Text>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>New Reading Receipt Received!</Text>
            <Text style={styles.bannerText}>Your meter was read on Oct 13, 2025</Text>
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
          <Text style={styles.welcomeLabel}>Welcome back,</Text>
          <Text style={styles.welcomeName}>Juan Dela Cruz</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🆔 07-11-46-2</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>📍 Zone 1, Purok 1</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✅ Account Active</Text>
          </View>
        </View>
      </View>

      {/* Amount Due Card */}
      <View style={styles.dueCard}>
        <View style={styles.dueAccent} />
        <View style={styles.dueContent}>
          <View style={styles.dueHeader}>
            <View style={styles.dueIcon}>
              <Text style={styles.dueIconText}>💰</Text>
            </View>
            <Text style={styles.dueLabel}>Total Amount Due</Text>
          </View>
          <Text style={styles.dueAmount}>₱412.50</Text>
          <View style={styles.dueDateContainer}>
            <View>
              <Text style={styles.dueDateLabel}>📅 Due Date</Text>
              <Text style={styles.dueDate}>October 30, 2025</Text>
            </View>
            <View style={styles.daysLeftBadge}>
              <Text style={styles.daysLeftText}>⏰ 3 days left</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>💧</Text>
          </View>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>m³ Used</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>📄</Text>
          </View>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Unpaid Bills</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>✅</Text>
          </View>
          <Text style={styles.statValue}>✓</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Latest Receipt */}
      <View style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>📋 Latest Receipt</Text>
          <View style={styles.unpaidChip}>
            <Text style={styles.unpaidText}>Unpaid</Text>
          </View>
        </View>

        <View style={styles.receiptContent}>
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptName}>Bayarin sa Tubig</Text>
            <Text style={styles.receiptDate}>📅 Received: Oct 13, 2025</Text>
          </View>

          <View style={styles.receiptSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Consumption:</Text>
              <Text style={styles.summaryValue}>2 m³</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Month:</Text>
              <Text style={styles.summaryAmount}>₱82.50</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Unpaid (2 months):</Text>
              <Text style={styles.summaryAmount}>₱330.00</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Total Due:</Text>
              <Text style={styles.totalAmount}>₱412.50</Text>
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
});
