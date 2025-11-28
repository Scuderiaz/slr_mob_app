import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ReceiptModal() {
  const router = useRouter();

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Water Bill Receipt</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 20px; 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            color: #000;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .gov-info {
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 8px;
          }
          .system-name {
            font-size: 14px;
            font-weight: bold;
            margin-top: 8px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
            border: 2px solid #000;
          }
          td, th { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left;
            font-size: 12px;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .info-section {
            margin: 10px 0;
            padding: 8px;
            border: 1px solid #000;
          }
          .info-label {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 12px;
          }
          .description {
            font-size: 11px;
            text-align: justify;
            margin: 15px 0;
            line-height: 1.4;
          }
          .section {
            margin: 15px 0;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
          }
          .total-row {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            font-weight: bold;
            padding: 8px 0;
          }
          .note {
            font-size: 10px;
            font-style: italic;
            text-align: justify;
            margin: 15px 0;
            padding: 10px;
            border: 1px dashed #000;
          }
          .signature-table {
            margin-top: 20px;
            border: 2px solid #000;
          }
          .signature-cell {
            text-align: center;
            padding: 20px 8px;
            border-right: 1px solid #000;
          }
          .disclaimer {
            text-align: center;
            font-size: 10px;
            font-style: italic;
            margin-top: 15px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            @page { margin: 0.5in; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BAYARIN SA TUBIG</div>
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
            <td>November 18, 2025</td>
          </tr>
        </table>
        
        <div class="info-section">
          <div class="info-label">Pangalan ng Consumer</div>
          <div class="info-value">Juan Dela Cruz</div>
        </div>
        
        <div class="info-section">
          <div class="info-label">Address</div>
          <div class="info-value">Purok 1, Barangay Poblacion</div>
        </div>
        
        <div class="description">
          Ang tagapagbasa ng metro ng tubig ay pumunta sa inyo ngayong araw upang basahin at kwentahin ang konsumo ng tubig ayon sa mga sumusunod:
        </div>
        
        <div class="section">
          <div class="section-title">Konsumo:</div>
          <div class="detail-row">
            <span>Ngayong Buwan</span>
            <span><strong>1242</strong> metro kubiko</span>
          </div>
          <div class="detail-row">
            <span>Nakaraang Buwan</span>
            <span><strong>1234</strong> metro kubiko</span>
          </div>
          <div class="detail-row">
            <span>Kabuuang Konsumo</span>
            <span><strong>8</strong> metro kubiko</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Takdang Halaga:</div>
          <div class="detail-row">
            <span>Bayarin ngayong Buwan</span>
            <span>₱200.00</span>
          </div>
          <div class="detail-row">
            <span>Multa (10%)</span>
            <span>₱20.00</span>
          </div>
          <div class="detail-row">
            <span>Di pa Bayad na Bayarin</span>
            <span>₱300.00</span>
          </div>
          <div class="detail-row">
            <span>Multa (10%)</span>
            <span>₱30.00</span>
          </div>
          <div class="detail-row">
            <span>Bayarin sa Koneksyon/Metro</span>
            <span>₱0.00</span>
          </div>
          <div class="detail-row total-row">
            <span>Kabuuang Bayarin</span>
            <span><strong>₱550.00</strong></span>
          </div>
        </div>
        
        <div class="note">
          "Kung ang bayarin sa metro ng tubig/bayarin sa koneksyon/mga nakaraang buwan at multa ay nabayaran na, kasalukuyang buwan lang ang babayaran."
        </div>
        
        <table class="signature-table">
          <tr>
            <td class="signature-cell">
              <div><strong>Water Bill #</strong></div>
              <div style="margin-top: 20px;">WB-2025-1118</div>
            </td>
            <td class="signature-cell">
              <div><strong>Tagabasa ng Metro</strong></div>
              <div style="margin-top: 20px;">__________________</div>
            </td>
            <td class="signature-cell">
              <div><strong>Para sa Buwang</strong></div>
              <div style="margin-top: 20px;">November 2025</div>
            </td>
          </tr>
        </table>
        
        <div class="disclaimer">*** Hindi ito Patunay ng Kabayaran ***</div>
      </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    try {
      // Generate PDF from HTML
      const htmlContent = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      // Share/Save the PDF using native share dialog
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Water Bill Receipt',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      Alert.alert(
        'Download Failed', 
        'Unable to generate PDF. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Preview</Text>
        <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
          <Text style={styles.downloadText}>📄</Text>
        </TouchableOpacity>
      </View>

      {/* Receipt Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.receipt}>
          {/* Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>BAYARIN SA TUBIG</Text>
            <View style={styles.governmentInfo}>
              <Text style={styles.govText}>Republika ng Pilipinas</Text>
              <Text style={styles.govText}>Lalawigan ng Camarines Norte</Text>
              <Text style={styles.govText}>Bayan ng San Lorenzo Ruiz</Text>
            </View>
            <Text style={styles.systemName}>SAN LORENZO RUIZ WATERWORKS SYSTEM</Text>
          </View>

          {/* Account Info Table */}
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellHeader}>Account No.</Text>
                <Text style={styles.tableCellValue}>07-11-46-2</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellHeader}>Numero ng Metro</Text>
                <Text style={styles.tableCellValue}>1234</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={styles.tableCellHeader}>Petsa ng Pagbasa</Text>
                <Text style={styles.tableCellValue}>11/18/2025</Text>
              </View>
            </View>
          </View>

          {/* Consumer Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Pangalan ng Consumer</Text>
            <Text style={styles.infoValue}>Juan Dela Cruz</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>Purok 1, Barangay Poblacion</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Ang tagapagbasa ng metro ng tubig ay pumunta sa inyo ngayong araw upang basahin
            at kwentahin ang konsumo ng tubig ayon sa mga sumusunod:
          </Text>

          {/* Consumption Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Konsumo:</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngayong Buwan</Text>
              <Text style={styles.detailValue}>1242 metro kubiko</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nakaraang Buwan</Text>
              <Text style={styles.detailValue}>1234 metro kubiko</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Kabuuang Konsumo</Text>
              <Text style={[styles.detailValue, styles.highlight]}>8 metro kubiko</Text>
            </View>
          </View>

          {/* Billing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takdang Halaga</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bayarin ngayong Buwan</Text>
              <Text style={styles.detailValue}>200.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Multa (10%)</Text>
              <Text style={styles.detailValue}>20.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Di pa Bayad na Bayarin</Text>
              <Text style={styles.detailValue}>300.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Multa (10%)</Text>
              <Text style={styles.detailValue}>30.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bayarin sa Koneksyon/Metro</Text>
              <Text style={styles.detailValue}>0.00</Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Kabuuang Bayarin</Text>
              <Text style={styles.totalValue}>550.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Kabuuang bayarin pagkalipas ng takdang petsa</Text>
              <Text style={styles.detailValue}>570.00</Text>
            </View>
          </View>

          {/* Note */}
          <Text style={styles.note}>
            "Kung ang bayarin sa metro ng tubig/bayarin sa koneksyon/mga nakaraang buwan at
            multa ay nabayaran na, kasalukuyang buwan lang ang babayaran. <Text style={styles.noteBold}>2025 SEPT</Text>"
          </Text>

          {/* Signature Table */}
          <View style={styles.signatureTable}>
            <View style={styles.signatureRow}>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Water Bill #</Text>
              </View>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Tagabasa ng Metro</Text>
                <Text style={styles.signatureLine}>__________</Text>
              </View>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Para sa Buwang</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.disclaimer}>*** Hindi ito Patunay ng Kabayaran ***</Text>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 28,
    color: '#202124',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  placeholder: {
    width: 32,
  },
  downloadButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    borderRadius: 8,
  },
  downloadText: {
    fontSize: 16,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  receipt: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  governmentInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  govText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 14,
  },
  systemName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  table: {
    borderWidth: 1,
    borderColor: '#202124',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#202124',
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  tableCellValue: {
    fontSize: 10,
  },
  infoSection: {
    borderWidth: 1,
    borderColor: '#202124',
    padding: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
  },
  description: {
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'justify',
    marginBottom: 12,
    color: '#374151',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 10,
    color: '#374151',
    flex: 1,
  },
  detailValue: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 8,
  },
  highlight: {
    fontWeight: '700',
    color: '#1a73e8',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#202124',
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  note: {
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'justify',
    fontStyle: 'italic',
    color: '#6b7280',
    marginVertical: 12,
  },
  noteBold: {
    fontWeight: '700',
    color: '#202124',
  },
  signatureTable: {
    borderWidth: 1,
    borderColor: '#202124',
    marginBottom: 12,
  },
  signatureRow: {
    flexDirection: 'row',
  },
  signatureCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#202124',
    padding: 12,
    alignItems: 'center',
    minHeight: 60,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  signatureLine: {
    fontSize: 10,
  },
  disclaimer: {
    fontSize: 8,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#6b7280',
  },
});
