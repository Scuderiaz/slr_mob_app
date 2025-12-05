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
import { User, Bill } from '../../types/consumer';

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);

  const loadHistoryData = async () => {
    try {
      const userData = await AsyncStorage.getItem('consumer_user');
      if (!userData) {
        router.replace('/login');
        return;
      }

      const parsedUser = JSON.parse(userData) as User;
      setUser(parsedUser);

      await databaseService.initDatabase();

      if (parsedUser.Consumer_ID) {
        const [billsData, total, count] = await Promise.all([
          databaseService.getConsumerBills(parsedUser.Consumer_ID, 12),
          databaseService.getTotalAmountDue(parsedUser.Consumer_ID),
          databaseService.getUnpaidBillsCount(parsedUser.Consumer_ID),
        ]);

        setBills(billsData);
        setTotalUnpaid(total);
        setUnpaidCount(count);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistoryData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistoryData();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const generateReceiptHTML = (bill: Bill) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Water Bill Receipt - ${bill.Billing_Month}</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            padding: 20px; 
            max-width: 400px; 
            margin: 0 auto; 
            background: white;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0; 
            font-size: 10px; 
            border: 1px solid #000; 
          }
          td, th { 
            border: 1px solid #000; 
            padding: 4px; 
            text-align: left;
          }
          .center { text-align: center; }
          .bold { font-weight: 700; }
          .header-title {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .gov-info {
            font-size: 9px;
            line-height: 1.2;
            margin-bottom: 6px;
          }
          .system-name {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.3px;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="header-title">BAYARIN SA TUBIG</div>
          <div class="gov-info">
            Republika ng Pilipinas<br>
            Lalawigan ng Camarines Norte<br>
            Bayan ng San Lorenzo Ruiz
          </div>
          <div class="system-name">SAN LORENZO RUIZ WATERWORKS SYSTEM</div>
        </div>
        
        <table>
          <tr>
            <th>Account No.</th>
            <th>Numero ng Metro</th>
            <th>Petsa ng Pagbasa</th>
          </tr>
          <tr>
            <td>${user?.Account_Number || 'N/A'}</td>
            <td>${user?.Meter_Number || 'N/A'}</td>
            <td>${bill.Billing_Month}</td>
          </tr>
        </table>
        
        <table>
          <tr><th colspan="3">Pangalan ng Consumer</th></tr>
          <tr><td colspan="3">${user?.First_Name} ${user?.Last_Name}</td></tr>
          <tr><th colspan="3">Address</th></tr>
          <tr><td colspan="3">${user?.Address || 'N/A'}</td></tr>
        </table>
        
        <div style="font-size:9px; margin-bottom:8px; line-height:1.4; text-align:justify;">
          Ang tagapagbasa ng metro ng tubig ay pumunta sa inyo ngayong araw upang basahin at kwentahin ang konsumo ng tubig ayon sa mga sumusunod:
        </div>
        
        <div style="font-size:10px; margin-bottom:6px;">
          <div class="bold" style="margin-bottom:2px;">Konsumo:</div>
          <div style="padding-left:5px; line-height:1.5;">
            <div style="display:flex; justify-content:space-between;">
              <span>Ngayong Buwan _____________________</span>
              <span><strong>${bill.Current_Reading || 0}</strong> metro kubiko</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Nakaraang Buwan ___________________</span>
              <span><strong>${bill.Previous_Reading || 0}</strong> metro kubiko</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Kabuuang Konsumo ___________________</span>
              <span><strong>${bill.Consumption || 0}</strong> metro kubiko</span>
            </div>
          </div>
        </div>
        
        <div style="font-size:10px; margin-bottom:6px; margin-top:8px;">
          <div class="bold" style="margin-bottom:2px;">Takdang Halaga</div>
          <div style="padding-left:5px; line-height:1.5;">
            <div style="display:flex; justify-content:space-between;">
              <span>Bayarin ngayong Buwan ___________________</span>
              <span><strong>₱${bill.Amount_Due?.toFixed(2) || '0.00'}</strong></span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Kabuuang Bayarin ________________________</span>
              <span><strong>₱${bill.Total_Amount?.toFixed(2) || '0.00'}</strong></span>
            </div>
          </div>
        </div>
        
        <div style="font-size:8px; margin:10px 0; line-height:1.4; text-align:justify; font-style:italic;">
          "Kung ang bayarin sa metro ng tubig/bayarin sa koneksyon/mga nakaraang buwan at multa ay nabayaran na, kasalukuyang buwan lang ang babayaran."
        </div>
        
        <table style="font-size:9px;">
          <tr>
            <th class="center">Water Bill #</th>
            <th class="center">Tagabasa ng Metro</th>
            <th class="center">Para sa Buwang</th>
          </tr>
          <tr>
            <td style="padding:20px;">BILL-${bill.Bill_ID}</td>
            <td style="padding:20px;" class="center">__________</td>
            <td style="padding:20px;">${bill.Billing_Month}</td>
          </tr>
        </table>
        
        <div class="center" style="font-size:8px; margin-top:8px; font-style:italic;">
          *** Hindi ito Patunay ng Kabayaran ***
        </div>
      </body>
      </html>
    `;
  };

  const handleViewReceipt = (bill: Bill) => {
    Alert.alert(
      'View Receipt PDF',
      `View PDF receipt for ${bill.Billing_Month}?\n\nBill #: ${bill.Bill_ID}\nAmount: ₱${bill.Total_Amount?.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View PDF', 
          onPress: () => {
            router.push('/receipt-modal');
            setTimeout(() => {
              Alert.alert(
                'PDF Receipt Ready',
                `Receipt for ${bill.Billing_Month} is now displayed as PDF.\n\nBill #: ${bill.Bill_ID}\nAmount: ₱${bill.Total_Amount?.toFixed(2)}\n\nThis is your official water bill receipt.`,
                [{ text: 'OK' }]
              );
            }, 500);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading billing history...</Text>
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
        <Text style={styles.headerTitle}>Billing Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
        }
      >
        <View style={styles.content}>
          {/* Current Period Info */}
          <View style={styles.periodCard}>
            <Text style={styles.periodTitle}>Billing History</Text>
            <Text style={styles.periodSubtitle}>
              {bills.length > 0 
                ? `Showing ${bills.length} bill${bills.length > 1 ? 's' : ''}`
                : 'No bills found'}
            </Text>
          </View>

          {/* Outstanding Balance Card */}
          {totalUnpaid > 0 && (
            <View style={styles.outstandingCard}>
              <View style={styles.outstandingHeader}>
                <View style={styles.warningIcon}>
                  <Text style={styles.warningIconText}>⚠️</Text>
                </View>
                <View style={styles.outstandingInfo}>
                  <Text style={styles.outstandingTitle}>Outstanding Balance</Text>
                  <Text style={styles.outstandingAmount}>₱{totalUnpaid.toFixed(2)}</Text>
                  <Text style={styles.dueDate}>{unpaidCount} unpaid bill{unpaidCount > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.unpaidBadge}>
                  <Text style={styles.unpaidText}>UNPAID</Text>
                </View>
              </View>
              <View style={styles.infoNote}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>Please settle your balance at the Municipal Treasurer's Office</Text>
              </View>
            </View>
          )}

          {/* Billing History Section */}
          <Text style={styles.sectionTitle}>Monthly Bills</Text>

          {/* History Items */}
          {bills.length > 0 ? (
            bills.map((bill) => (
              <View key={bill.Bill_ID} style={styles.historyCard}>
                <View style={styles.historyContent}>
                  <View style={styles.historyLeft}>
                    <View style={[styles.statusBadge, bill.Payment_Status === 'Paid' ? styles.paidBadge : styles.unpaidStatusBadge]}>
                      <Text style={[styles.statusText, bill.Payment_Status === 'Paid' ? styles.paidStatusText : styles.unpaidStatusText]}>
                        {bill.Payment_Status || 'Unpaid'}
                      </Text>
                    </View>
                    <Text style={styles.billMonth}>
                      <Text style={styles.monthHighlight}>{bill.Billing_Month}</Text>
                    </Text>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Consumption</Text>
                        <Text style={styles.detailValue}>{bill.Consumption || 0} m³</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValue}>₱{bill.Total_Amount?.toFixed(2) || '0.00'}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewReceipt(bill)}
                  >
                    <Text style={styles.viewButtonText}>📄</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyText}>No bills yet</Text>
              <Text style={styles.emptySubtext}>Your billing history will appear here</Text>
            </View>
          )}
        </View>
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
    paddingBottom: 100,
  },
  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  periodSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  outstandingInfo: {
    flex: 1,
  },
  outstandingTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outstandingAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f44336',
    lineHeight: 32,
  },
  unpaidText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  outstandingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 6,
    borderLeftColor: '#f44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outstandingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  warningIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningIconText: {
    fontSize: 24,
    color: '#f44336',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f44336',
    lineHeight: 32,
  },
  dueDateContainer: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  unpaidBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unpaidBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoIcon: {
    fontSize: 14,
    color: '#1a73e8',
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyLeft: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 4,
    fontWeight: '600',
  },
  billMonth: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  monthHighlight: {
    color: '#2c5aa0',
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  viewButton: {
    backgroundColor: '#1a73e8',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 20,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  paidBadge: {
    backgroundColor: '#d1fae5',
  },
  unpaidStatusBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paidStatusText: {
    color: '#059669',
  },
  unpaidStatusText: {
    color: '#dc2626',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
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
