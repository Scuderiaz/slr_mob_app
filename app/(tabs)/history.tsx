import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface BillRecord {
  id: string;
  month: string;
  receiptNo: string;
  amount: string;
  status: 'paid' | 'unpaid';
  paymentDate?: string;
  currentReading: string;
  previousReading: string;
  consumption: string;
}

const billingHistory: BillRecord[] = [
  {
    id: '1',
    month: 'September 2025',
    receiptNo: 'WB-2025-0913',
    amount: '82.50',
    status: 'unpaid',
    currentReading: '301',
    previousReading: '299',
    consumption: '2',
  },
  {
    id: '2',
    month: 'August 2025',
    receiptNo: 'WB-2025-0815',
    amount: '165.00',
    status: 'unpaid',
    currentReading: '295',
    previousReading: '285',
    consumption: '10',
  },
  {
    id: '3',
    month: 'July 2025',
    receiptNo: 'WB-2025-0718',
    amount: '165.00',
    status: 'unpaid',
    currentReading: '290',
    previousReading: '280',
    consumption: '10',
  },
  {
    id: '4',
    month: 'June 2025',
    receiptNo: 'WB-2025-0620',
    amount: '160.00',
    status: 'paid',
    paymentDate: 'June 20, 2025',
    currentReading: '285',
    previousReading: '275',
    consumption: '10',
  },
  {
    id: '5',
    month: 'May 2025',
    receiptNo: 'WB-2025-0518',
    amount: '160.00',
    status: 'paid',
    paymentDate: 'May 18, 2025',
    currentReading: '280',
    previousReading: '270',
    consumption: '10',
  },
];

export default function HistoryScreen() {
  const router = useRouter();

  const generateReceiptHTML = (bill: BillRecord) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Water Bill Receipt - ${bill.month}</title>
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
            <td>07-11-46-2</td>
            <td>1234</td>
            <td>${bill.month}</td>
          </tr>
        </table>
        
        <table>
          <tr><th colspan="3">Pangalan ng Consumer</th></tr>
          <tr><td colspan="3">Juan Dela Cruz</td></tr>
          <tr><th colspan="3">Address</th></tr>
          <tr><td colspan="3">Purok 1, Barangay Poblacion</td></tr>
        </table>
        
        <div style="font-size:9px; margin-bottom:8px; line-height:1.4; text-align:justify;">
          Ang tagapagbasa ng metro ng tubig ay pumunta sa inyo ngayong araw upang basahin at kwentahin ang konsumo ng tubig ayon sa mga sumusunod:
        </div>
        
        <div style="font-size:10px; margin-bottom:6px;">
          <div class="bold" style="margin-bottom:2px;">Konsumo:</div>
          <div style="padding-left:5px; line-height:1.5;">
            <div style="display:flex; justify-content:space-between;">
              <span>Ngayong Buwan _____________________</span>
              <span><strong>${bill.currentReading}</strong> metro kubiko</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Nakaraang Buwan ___________________</span>
              <span><strong>${bill.previousReading}</strong> metro kubiko</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Kabuuang Konsumo ___________________</span>
              <span><strong>${bill.consumption}</strong> metro kubiko</span>
            </div>
          </div>
        </div>
        
        <div style="font-size:10px; margin-bottom:6px; margin-top:8px;">
          <div class="bold" style="margin-bottom:2px;">Takdang Halaga</div>
          <div style="padding-left:5px; line-height:1.5;">
            <div style="display:flex; justify-content:space-between;">
              <span>Bayarin ngayong Buwan ___________________</span>
              <span><strong>${bill.amount}</strong></span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Kabuuang Bayarin ________________________</span>
              <span><strong>${bill.amount}</strong></span>
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
            <td style="padding:20px;">${bill.receiptNo}</td>
            <td style="padding:20px;" class="center">__________</td>
            <td style="padding:20px;">${bill.month}</td>
          </tr>
        </table>
        
        <div class="center" style="font-size:8px; margin-top:8px; font-style:italic;">
          *** Hindi ito Patunay ng Kabayaran ***
        </div>
      </body>
      </html>
    `;
  };

  const handleViewReceipt = (bill: BillRecord) => {
    Alert.alert(
      'View Receipt PDF',
      `View PDF receipt for ${bill.month}?\n\nReceipt No: ${bill.receiptNo}\nAmount: ₱${bill.amount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View PDF', 
          onPress: () => {
            // Navigate to receipt modal (which now acts as PDF viewer)
            router.push('/receipt-modal');
            
            // Show PDF ready message
            setTimeout(() => {
              Alert.alert(
                'PDF Receipt Ready',
                `Receipt for ${bill.month} is now displayed as PDF.\n\nReceipt No: ${bill.receiptNo}\nAmount: ₱${bill.amount}\n\nThis is your official water bill receipt.`,
                [{ text: 'OK' }]
              );
            }, 500);
          }
        }
      ]
    );
  };

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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Outstanding Balance Card */}
        <View style={styles.outstandingCard}>
          <View style={styles.outstandingHeader}>
            <View style={styles.warningIcon}>
              <Text style={styles.warningIconText}>⚠️</Text>
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>OUTSTANDING BALANCE</Text>
              <Text style={styles.balanceAmount}>₱412.50</Text>
            </View>
          </View>
          <View style={styles.dueDateContainer}>
            <View>
              <Text style={styles.dueDateLabel}>Payment Due Date</Text>
              <Text style={styles.dueDate}>October 30, 2025</Text>
            </View>
            <View style={styles.unpaidBadge}>
              <Text style={styles.unpaidBadgeText}>UNPAID</Text>
            </View>
          </View>
          <View style={styles.infoNote}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>Please settle your balance at the Municipal Treasurer's Office</Text>
          </View>
        </View>

        {/* Billing History Section */}
        <Text style={styles.sectionTitle}>Billing History</Text>

        {/* History Items */}
        {billingHistory.map((bill) => (
          <View key={bill.id} style={styles.historyCard}>
            <View style={styles.historyContent}>
              <View style={styles.historyLeft}>
                {bill.status === 'paid' && (
                  <Text style={styles.paymentDate}>Payment Date: {bill.paymentDate}</Text>
                )}
                <Text style={styles.billMonth}>
                  Bill Month: <Text style={styles.monthHighlight}>{bill.month}</Text>
                </Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Receipt No.</Text>
                    <Text style={styles.detailValue}>{bill.receiptNo}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>₱{bill.amount}</Text>
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
        ))}
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
});
