import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ConsumerWithDetails } from '../../types';
import { fetchConsumers, saveReading as saveReadingToDatabase } from '../../utils/api';
import { saveReading as saveReadingToStorage } from '../../utils/storage';
import { databaseService } from '../../shared/services/database';

// Using ConsumerWithDetails from types

export default function EntryScreen() {
  const [consumers, setConsumers] = useState<ConsumerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentReading, setCurrentReading] = useState<{ [key: number]: string }>({});
  const [exception, setException] = useState<{ [key: number]: string }>({});
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [photos, setPhotos] = useState<{ [key: number]: string }>({});
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadConsumers();
    }, [])
  );

  const loadConsumers = async () => {
    try {
      console.log('🔄 Entry Screen: Loading consumers...');
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        
        // Check if a specific consumer was selected from the consumer menu
        const selectedConsumerString = await AsyncStorage.getItem('selectedConsumer');
        console.log('📋 Entry Screen: Selected consumer from storage:', selectedConsumerString ? 'Found' : 'Not found');
        
        if (selectedConsumerString) {
          const selectedConsumer = JSON.parse(selectedConsumerString);
          console.log('✅ Entry Screen: Loading selected consumer:', selectedConsumer.Consumer_ID, selectedConsumer.First_Name, selectedConsumer.Last_Name);
          setConsumers([selectedConsumer]);
          // Clear the selected consumer from storage
          await AsyncStorage.removeItem('selectedConsumer');
        } else {
          // Start with empty state - no consumers loaded by default
          console.log('📭 Entry Screen: No selected consumer, showing empty state');
          setConsumers([]);
        }
      }
    } catch (error) {
      console.error('❌ Entry Screen: Error loading consumers:', error);
      Alert.alert('Error', 'Failed to load consumer data');
    } finally {
      setLoading(false);
    }
  };

  const calculateConsumption = (consumerId: number, previous: number) => {
    const current = parseInt(currentReading[consumerId] || '0');
    if (!currentReading[consumerId] || currentReading[consumerId] === '') {
      return null;
    }
    return current - previous;
  };

  const getConsumptionStatus = (consumption: number | null) => {
    if (consumption === null) return { color: '#6b7280', message: '', bgColor: '#f8f9fa', borderColor: 'transparent' };
    if (consumption < 0) return { color: '#f44336', message: '⚠️ Current reading cannot be less than previous', bgColor: '#fee', borderColor: '#f44336' };
    if (consumption > 100) return { color: '#ff9800', message: '⚠️ Unusually high consumption - please verify', bgColor: '#fff8e1', borderColor: '#ff9800' };
    if (consumption === 0) return { color: '#9e9e9e', message: 'ℹ️ No consumption recorded', bgColor: '#f5f5f5', borderColor: '#9e9e9e' };
    return { color: '#4caf50', message: '✓ Valid reading', bgColor: '#e8f5e9', borderColor: '#4caf50' };
  };

  const takePhoto = async (consumerId: number) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos({ ...photos, [consumerId]: result.assets[0].uri });
        Alert.alert('Success', 'Photo attached successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const submitException = async (consumer: ConsumerWithDetails) => {
    const hasException = exception[consumer.Consumer_ID];
    const hasNotes = notes[consumer.Consumer_ID];
    const hasPhoto = photos[consumer.Consumer_ID];

    if (!hasException && !hasNotes && !hasPhoto) {
      Alert.alert('No Data', 'Please add an exception, notes, or photo before submitting.');
      return;
    }

    const userDataString = await AsyncStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : null;

    const exceptionReport = {
      Consumer_ID: consumer.Consumer_ID,
      Meter_Reader_ID: userData?.AccountID || 1,
      Created_Date: new Date().toISOString(),
      Exception_Type: hasException || 'Documentation',
      Notes: hasNotes || '',
      Photo: hasPhoto || '',
      Status: 'Submitted',
      synced: false,
    };

    try {
      // Save exception report to local storage
      const existingReports = await AsyncStorage.getItem('exceptionReports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.push(exceptionReport);
      await AsyncStorage.setItem('exceptionReports', JSON.stringify(reports));

      const fullName = `${consumer.First_Name || ''} ${consumer.Last_Name || ''}`.trim();
      Alert.alert(
        '✓ Exception Report Submitted!', 
        `Exception report submitted for ${fullName}\n\n` +
        `${hasException ? `Exception: ${hasException}\n` : ''}` +
        `${hasNotes ? `Notes: Added\n` : ''}` +
        `${hasPhoto ? `Photo: Attached\n` : ''}` +
        `\nThis report will be reviewed by the office.`,
        [{ text: 'OK' }]
      );

      // Clear exception form
      setException({ ...exception, [consumer.Consumer_ID]: '' });
      setNotes({ ...notes, [consumer.Consumer_ID]: '' });
      setPhotos({ ...photos, [consumer.Consumer_ID]: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit exception report');
    }
  };

  const saveReading = async (consumer: ConsumerWithDetails) => {
    const consumption = calculateConsumption(consumer.Consumer_ID, consumer.Previous_Reading || 0);
    if (consumption === null || consumption < 0) {
      Alert.alert('Invalid Reading', 'Please enter a valid current reading');
      return;
    }

    const current = parseInt(currentReading[consumer.Consumer_ID]);
    const userData = await AsyncStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : null;

    const reading = {
      Route_ID: 1, // Default route
      Consumer_ID: consumer.Consumer_ID,
      Meter_ID: 1, // Default meter
      Meter_Reader_ID: user?.AccountID || 1,
      Created_Date: new Date().toISOString(),
      Reading_Status: 'Normal' as const,
      Previous_Reading: consumer.Previous_Reading || 0,
      Current_Reading: current,
      Consumption: consumption,
      Notes: notes[consumer.Consumer_ID] || '',
      Status: 'Completed',
      Reading_Date: new Date().toISOString().split('T')[0],
      photo: photos[consumer.Consumer_ID] || '',
      synced: false
    };

    try {
      // Save to database first
      const dbResult = await saveReadingToDatabase(reading);
      
      if (dbResult.success) {
        // Also save to AsyncStorage for offline backup
        await saveReadingToStorage(reading);
        
        // Update consumer status to 'Read' in local state
        const updatedConsumer: ConsumerWithDetails = { ...consumer, status: 'Read' as const, Current_Reading: current };
        
        // Update the consumers list
        setConsumers(prev => prev.map(c => 
          c.Consumer_ID === consumer.Consumer_ID ? updatedConsumer : c
        ));
        
        Alert.alert('Success', 'Reading saved to database successfully! Consumer status updated to "Read".');
      } else {
        throw new Error(dbResult.error || 'Database save failed');
      }
      setException({ ...exception, [consumer.Consumer_ID]: '' });
      setNotes({ ...notes, [consumer.Consumer_ID]: '' });
      setPhotos({ ...photos, [consumer.Consumer_ID]: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to save reading');
    }
  };

  const handlePrint = async (receipt: any) => {
    try {
      const html = generateReceiptHTML(receipt);
      await Print.printAsync({ html });
      Alert.alert('Success', 'Receipt printed successfully');
      
      // Auto-refresh after printing
      await refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to print receipt. Please try again.');
    }
  };

  const refreshData = async () => {
    try {
      console.log('🔄 Auto-refreshing data after receipt print...');
      
      // Clear the current consumer from entry screen
      setConsumers([]);
      
      // Trigger refresh on other screens by updating AsyncStorage timestamp
      await AsyncStorage.setItem('lastDataUpdate', new Date().toISOString());
      
      console.log('✅ Data refresh triggered successfully');
    } catch (error) {
      console.error('❌ Error during auto-refresh:', error);
    }
  };

  const generateReceiptHTML = (receipt: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            @page { margin: 0; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 9px; 
            margin: 0; 
            padding: 3mm;
            width: 52mm;
            line-height: 1.1;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px solid #000; margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 3px 0; }
          td, th { border: 1px solid #000; padding: 2px; font-size: 8px; text-align: center; }
          .section { margin: 5px 0; }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 1px 0;
            font-size: 8px;
          }
          .total-row {
            border-top: 2px solid #000;
            padding-top: 2px;
            margin-top: 3px;
            font-weight: bold;
          }
          .small { font-size: 7px; }
          .note { font-size: 7px; margin: 5px 0; text-align: justify; }
        </style>
      </head>
      <body>
        <div class="center bold">BAYARIN SA TUBIG</div>
        <div class="center small">
          Republika ng Pilipinas<br>
          Lalawigan ng Camarines Norte<br>
          Bayan ng San Lorenzo Ruiz
        </div>
        <div class="center bold small">SAN LORENZO RUIZ WATERWORKS SYSTEM</div>
        
        <table>
          <tr>
            <th>Account No.</th>
            <th>Numero ng Metro</th>
            <th>Petsa ng Pagbasa</th>
          </tr>
          <tr>
            <td>${receipt.consumer.Consumer_ID}</td>
            <td>1234</td>
            <td>${receipt.readingDate}</td>
          </tr>
        </table>
        
        <table>
          <tr><th colspan="3">Pangalan ng Consumer</th></tr>
          <tr><td colspan="3">${`${receipt.consumer.First_Name || ''} ${receipt.consumer.Last_Name || ''}`.trim().toUpperCase()}</td></tr>
          <tr><th colspan="3">Address</th></tr>
          <tr><td colspan="3">Purok 1, Barangay Poblacion</td></tr>
        </table>
        
        <table>
          <tr>
            <th>Nasakop na Petsa</th>
            <th>Takdang Petsa</th>
            <th>Petsa ng Diskoneksyon</th>
          </tr>
          <tr>
            <td>${receipt.readingDate}</td>
            <td>${receipt.dueDate}</td>
            <td></td>
          </tr>
        </table>
        
        <div class="note">
          Ang tagapagbasa ng metro ng tubig ay pumunta sa inyo ngayong araw upang basahin at kwentahin ang konsumo ng tubig ayon sa mga sumusunod:
        </div>
        
        <div class="section">
          <div class="bold">Konsumo:</div>
          <div class="detail-row">
            <span>Ngayong Buwan</span>
            <span>${receipt.current} metro kubiko</span>
          </div>
          <div class="detail-row">
            <span>Nakaraang Buwan</span>
            <span>${receipt.consumer.Previous_Reading || 0} metro kubiko</span>
          </div>
          <div class="detail-row">
            <span>Kabuuang Konsumo</span>
            <span>${receipt.consumption} metro kubiko</span>
          </div>
        </div>
        
        <div class="section">
          <div class="bold">Takdang Halaga:</div>
          <div class="detail-row">
            <span>Bayarin ngayong Buwan</span>
            <span>₱${receipt.currentMonthCharge.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span>Multa (10%)</span>
            <span>₱${receipt.currentMonthPenalty.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span>Di pa Bayad na Bayarin</span>
            <span>₱${receipt.unpaidBalance.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span>Multa (10%)</span>
            <span>₱${receipt.unpaidPenalty.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span>Bayarin sa Koneksyon/Metro</span>
            <span>₱${receipt.connectionFee.toFixed(2)}</span>
          </div>
          <div class="detail-row total-row">
            <span>Kabuuang Bayarin</span>
            <span>₱${receipt.totalDue.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span>Kabuuang bayarin pagkalipas ng takdang petsa</span>
            <span>₱${receipt.totalAfterDueDate.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="note">
          "Kung ang bayarin sa metro ng tubig/bayarin sa koneksyon/mga nakaraang buwan at multa ay nabayaran na, kasalukuyang buwan lang ang babayaran. <strong>2025 SEPT</strong>"
        </div>
        
        <table>
          <tr>
            <th>Water Bill #</th>
            <th>Tagabasa ng Metro</th>
            <th>Para sa Buwang</th>
          </tr>
          <tr style="height: 20px;">
            <td></td>
            <td>${receipt.meterReaderName || '__________'}</td>
            <td>SEPT 2025</td>
          </tr>
        </table>
        
        <div class="center small" style="margin-top: 8px; font-style: italic;">
          *** Hindi ito Patunay ng Kabayaran ***
        </div>
      </body>
      </html>
    `;
  };

  const showReceiptPreview = async (consumer: ConsumerWithDetails) => {
    const consumption = calculateConsumption(consumer.Consumer_ID, consumer.Previous_Reading || 0);
    if (consumption === null || consumption < 0) {
      Alert.alert('Invalid Reading', 'Please enter a valid reading first');
      return;
    }

    // Get meter reader name from user data
    const userDataString = await AsyncStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    const meterReaderName = userData ? `${userData.First_Name || ''} ${userData.Last_Name || ''}`.trim() : '';

    const current = parseInt(currentReading[consumer.Consumer_ID]);
    const now = new Date();
    const readingDate = now.toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const dueDate = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // Calculate charges (₱25 per cubic meter)
    const ratePerCubic = 25;
    const currentMonthCharge = consumption * ratePerCubic;
    const currentMonthPenalty = currentMonthCharge * 0.10;
    const unpaidBalance = 300.00;
    const unpaidPenalty = unpaidBalance * 0.10;
    const connectionFee = 0.00;
    const totalDue = currentMonthCharge + currentMonthPenalty + unpaidBalance + unpaidPenalty + connectionFee;
    const totalAfterDueDate = totalDue + (currentMonthCharge * 0.10);

    setCurrentReceipt({
      consumer,
      current,
      consumption,
      readingDate,
      dueDate,
      currentMonthCharge,
      currentMonthPenalty,
      unpaidBalance,
      unpaidPenalty,
      connectionFee,
      totalDue,
      totalAfterDueDate,
      exception: exception[consumer.Consumer_ID] || '',
      notes: notes[consumer.Consumer_ID] || '',
      meterReaderName
    });
    setReceiptModalVisible(true);
  };

  const printReceipt = async (consumer: ConsumerWithDetails) => {
    const consumption = calculateConsumption(consumer.Consumer_ID, consumer.Previous_Reading || 0);
    if (consumption === null || consumption < 0) {
      Alert.alert('Invalid Reading', 'Please enter a valid reading first');
      return;
    }

    // Get meter reader name from user data
    const userDataString = await AsyncStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    const meterReaderName = userData ? `${userData.First_Name || ''} ${userData.Last_Name || ''}`.trim() : '';

    const current = parseInt(currentReading[consumer.Consumer_ID]);
    const now = new Date();
    const readingDate = now.toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const dueDate = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // Calculate charges (₱25 per cubic meter)
    const ratePerCubic = 25;
    const currentMonthCharge = consumption * ratePerCubic;
    const currentMonthPenalty = currentMonthCharge * 0.10;
    const unpaidBalance = 300.00;
    const unpaidPenalty = unpaidBalance * 0.10;
    const connectionFee = 0.00;
    const totalDue = currentMonthCharge + currentMonthPenalty + unpaidBalance + unpaidPenalty + connectionFee;
    const totalAfterDueDate = totalDue + (currentMonthCharge * 0.10);

    const receipt = {
      consumer,
      current,
      consumption,
      readingDate,
      dueDate,
      currentMonthCharge,
      currentMonthPenalty,
      unpaidBalance,
      unpaidPenalty,
      connectionFee,
      totalDue,
      totalAfterDueDate,
      exception: '',
      notes: '',
      meterReaderName
    };

    // Save reading first, then print
    await saveReading(consumer);
    await handlePrint(receipt);
  };


  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading consumers...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {consumers.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateContent}>
            <Text style={styles.emptyStateTitle}>No Consumer Selected</Text>
            <Text style={styles.emptyStateMessage}>Go to Consumers tab to select a consumer for meter reading</Text>
          </View>

          <View style={styles.placeholderInfo}>
            <View style={styles.placeholderRow}>
              <Text style={styles.placeholderLabel}>Account No.</Text>
              <Text style={styles.placeholderValue}>---</Text>
            </View>
            <View style={styles.placeholderRow}>
              <Text style={styles.placeholderLabel}>Consumer Name</Text>
              <Text style={styles.placeholderValue}>---</Text>
            </View>
            <View style={styles.placeholderRow}>
              <Text style={styles.placeholderLabel}>Zone</Text>
              <Text style={styles.placeholderValue}>---</Text>
            </View>
            <View style={styles.placeholderRow}>
              <Text style={styles.placeholderLabel}>Previous Reading</Text>
              <Text style={styles.placeholderValue}>---</Text>
            </View>
          </View>

          <View style={styles.readingSection}>
            <Text style={styles.sectionLabel}>Present Reading</Text>
            <TextInput
              style={styles.disabledInput}
              placeholder="Select a consumer first..."
              placeholderTextColor="#9ca3af"
              editable={false}
            />
          </View>

          <View style={styles.consumptionPlaceholder}>
            <Text style={styles.consumptionLabel}>Consumption</Text>
            <Text style={styles.consumptionValue}>--- m³</Text>
          </View>

          <TouchableOpacity
            style={styles.disabledButton}
            disabled={true}
          >
            <Text style={styles.disabledButtonText}>Print Receipt</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Consumer Cards */}
      {consumers.map((consumer: ConsumerWithDetails) => {
        const consumption = calculateConsumption(consumer.Consumer_ID, consumer.Previous_Reading || 0);
        const isValid = consumption !== null && consumption >= 0;
        const fullName = `${consumer.First_Name || ''} ${consumer.Last_Name || ''}`.trim();

        return (
          <View key={consumer.Consumer_ID} style={styles.consumerCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Consumer Information</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            
            <View style={styles.consumerInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account No.</Text>
                <Text style={styles.infoValue}>{consumer.Consumer_ID}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Consumer Name</Text>
                <Text style={styles.infoValue}>{fullName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Zone</Text>
                <Text style={styles.infoValue}>{consumer.Zone_Name || 'Unknown'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Previous Reading</Text>
                <Text style={styles.infoValue}>{consumer.Previous_Reading || 0} m³</Text>
              </View>
            </View>

          <View style={styles.readingSection}>
            <Text style={styles.sectionLabel}>Present Reading</Text>
            <TextInput
              style={styles.readingInput}
              placeholder="Enter current reading"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={currentReading[consumer.Consumer_ID] || ''}
              onChangeText={(text) => setCurrentReading({ ...currentReading, [consumer.Consumer_ID]: text })}
            />
          </View>

            <View style={[
              styles.consumptionCard,
              { 
                backgroundColor: getConsumptionStatus(consumption).bgColor,
                borderLeftWidth: 4,
                borderLeftColor: getConsumptionStatus(consumption).borderColor
              }
            ]}>
              <View style={styles.consumptionHeader}>
                <Text style={styles.consumptionTitle}>Consumption Analysis</Text>
                {getConsumptionStatus(consumption).message && (
                  <Text style={[styles.statusMessage, { color: getConsumptionStatus(consumption).color }]}>
                    {getConsumptionStatus(consumption).message.replace(/[⚠️ℹ️✓]/g, '').trim()}
                  </Text>
                )}
              </View>
              <View style={styles.consumptionRow}>
                <Text style={styles.consumptionLabel}>Total Consumption</Text>
                <Text style={[
                  styles.consumptionValue,
                  { color: getConsumptionStatus(consumption).color }
                ]}>
                  {consumption !== null ? `${consumption} m³` : '- m³'}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.printButton, !isValid && styles.buttonDisabled]}
                onPress={() => showReceiptPreview(consumer)}
                disabled={!isValid}
              >
                <Text style={[styles.printButtonText, !isValid && styles.disabledButtonText]}>Print Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Receipt Preview Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            {/* Modal Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderTitle}>Receipt Preview</Text>
              <TouchableOpacity onPress={() => setReceiptModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Receipt Content */}
            <ScrollView style={styles.receiptContent}>
              {currentReceipt && (
                <View style={styles.receiptBody}>
                  {/* Header */}
                  <View style={styles.receiptTitleSection}>
                    <Text style={styles.receiptTitle}>BAYARIN SA TUBIG</Text>
                    <Text style={styles.receiptSubtitle}>
                      Republika ng Pilipinas{"\n"}
                      Lalawigan ng Camarines Norte{"\n"}
                      Bayan ng San Lorenzo Ruiz
                    </Text>
                    <Text style={styles.receiptAgency}>SAN LORENZO RUIZ WATERWORKS SYSTEM</Text>
                  </View>

                  {/* Account Info Table */}
                  <View style={styles.receiptTable}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeaderCell}>Account No.</Text>
                      <Text style={styles.tableHeaderCell}>Numero ng Metro</Text>
                      <Text style={styles.tableHeaderCell}>Petsa ng Pagbasa</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>{currentReceipt.consumer.Consumer_ID}</Text>
                      <Text style={styles.tableCell}>1234</Text>
                      <Text style={styles.tableCell}>{currentReceipt.readingDate}</Text>
                    </View>
                  </View>

                  {/* Consumer Info Table */}
                  <View style={styles.receiptTable}>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Pangalan ng Consumer</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{`${currentReceipt.consumer.First_Name || ''} ${currentReceipt.consumer.Last_Name || ''}`.trim().toUpperCase()}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Address</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1 }]}>Purok 1, Barangay Poblacion</Text>
                    </View>
                  </View>

                  {/* Dates Table */}
                  <View style={styles.receiptTable}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeaderCell}>Nasakop na Petsa</Text>
                      <Text style={styles.tableHeaderCell}>Takdang Petsa</Text>
                      <Text style={styles.tableHeaderCell}>Petsa ng Diskoneksyon</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>{currentReceipt.readingDate}</Text>
                      <Text style={styles.tableCell}>{currentReceipt.dueDate}</Text>
                      <Text style={styles.tableCell}></Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.receiptDescription}>
                    Ang tagapagbasa ng metro ng tubig ay pumunta sa inyo ngayong araw upang basahin at kwentahin ang konsumo ng tubig ayon sa mga sumusunod:
                  </Text>

                  {/* Consumption Section */}
                  <View style={styles.receiptSection}>
                    <Text style={styles.sectionTitle}>Konsumo:</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Ngayong Buwan</Text>
                        <Text style={styles.detailValue}>{currentReceipt.current} metro kubiko</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Nakaraang Buwan</Text>
                        <Text style={styles.detailValue}>{currentReceipt.consumer.Previous_Reading || 0} metro kubiko</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Kabuuang Konsumo</Text>
                        <Text style={styles.detailValue}>{currentReceipt.consumption} metro kubiko</Text>
                      </View>
                    </View>
                  </View>

                  {/* Charges Section */}
                  <View style={styles.receiptSection}>
                    <Text style={styles.sectionTitle}>Takdang Halaga:</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bayarin ngayong Buwan</Text>
                        <Text style={styles.detailValue}>₱{currentReceipt.currentMonthCharge.toFixed(2)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Multa (10%)</Text>
                        <Text style={styles.detailValue}>₱{currentReceipt.currentMonthPenalty.toFixed(2)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Di pa Bayad na Bayarin</Text>
                        <Text style={styles.detailValue}>₱{currentReceipt.unpaidBalance.toFixed(2)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Multa (10%)</Text>
                        <Text style={styles.detailValue}>₱{currentReceipt.unpaidPenalty.toFixed(2)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bayarin sa Koneksyon/Metro</Text>
                        <Text style={styles.detailValue}>₱{currentReceipt.connectionFee.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.detailRow, { borderTopWidth: 2, borderTopColor: '#000', paddingTop: 8, marginTop: 8 }]}>
                        <Text style={[styles.detailLabel, { fontWeight: '700' }]}>Kabuuang Bayarin</Text>
                        <Text style={[styles.detailValue, { fontWeight: '700', fontSize: 14 }]}>₱{currentReceipt.totalDue.toFixed(2)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Kabuuang bayarin pagkalipas ng takdang petsa</Text>
                        <Text style={styles.detailValue}>₱{currentReceipt.totalAfterDueDate.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Note */}
                  <Text style={styles.receiptNote}>
                    "Kung ang bayarin sa metro ng tubig/bayarin sa koneksyon/mga nakaraang buwan at multa ay nabayaran na, kasalukuyang buwan lang ang babayaran. <Text style={{ fontWeight: '700' }}>2025 SEPT</Text>"
                  </Text>

                  {/* Exception and Notes */}
                  {currentReceipt.exception && (
                    <View style={styles.exceptionBox}>
                      <Text style={styles.exceptionText}>Exception: {currentReceipt.exception}</Text>
                    </View>
                  )}
                  {currentReceipt.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>Notes: {currentReceipt.notes}</Text>
                    </View>
                  )}

                  {/* Footer Table */}
                  <View style={styles.receiptTable}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeaderCell}>Water Bill #</Text>
                      <Text style={styles.tableHeaderCell}>Tagabasa ng Metro</Text>
                      <Text style={styles.tableHeaderCell}>Para sa Buwang</Text>
                    </View>
                    <View style={[styles.tableRow, { height: 40 }]}>
                      <Text style={styles.tableCell}></Text>
                      <Text style={styles.tableCell}>{currentReceipt?.meterReaderName || '__________'}</Text>
                      <Text style={styles.tableCell}>SEPT 2025</Text>
                    </View>
                  </View>

                  {/* Disclaimer */}
                  <Text style={styles.receiptDisclaimer}>
                    *** Hindi ito Patunay ng Kabayaran ***
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.receiptFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setReceiptModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.printModalButton}
                onPress={async () => {
                  setReceiptModalVisible(false);
                  // Save reading first, then print
                  await saveReading(currentReceipt.consumer);
                  await handlePrint(currentReceipt);
                }}
              >
                <Text style={styles.printModalButtonText}>Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  select: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  selectText: {
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldSubLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  largeInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  consumptionCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  consumptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consumptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  consumptionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a73e8',
  },
  consumptionStatus: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#4caf50',
  },
  printButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  // Receipt Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 500,
    width: '90%',
    maxHeight: '90%',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  receiptHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  receiptContent: {
    maxHeight: 500,
  },
  receiptBody: {
    padding: 20,
  },
  receiptTitleSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptTitle: {
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  receiptSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  receiptAgency: {
    fontWeight: '700',
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  receiptTable: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontWeight: '600',
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
  },
  receiptDescription: {
    fontSize: 9,
    marginBottom: 8,
    lineHeight: 12,
    textAlign: 'justify',
  },
  receiptSection: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 2,
    fontSize: 9,
  },
  sectionContent: {
    paddingLeft: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 9,
    flex: 1,
  },
  detailValue: {
    fontSize: 9,
    fontWeight: '700',
  },
  receiptNote: {
    fontSize: 8,
    margin: 10,
    lineHeight: 11,
    textAlign: 'justify',
    fontStyle: 'italic',
  },
  exceptionBox: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#856404',
  },
  exceptionText: {
    fontSize: 9,
    color: '#856404',
  },
  notesBox: {
    backgroundColor: '#d1ecf1',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0c5460',
  },
  notesText: {
    fontSize: 9,
    color: '#0c5460',
  },
  receiptDisclaimer: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  receiptFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  printModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  printModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Exception section styles
  selectWithValue: {
    borderColor: '#ff9800',
    backgroundColor: '#fff8e1',
  },
  selectTextWithValue: {
    color: '#e65100',
    fontWeight: '600',
  },
  exceptionAlert: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  exceptionAlertText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  exceptionAlertSubtext: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  exceptionButtonRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  exceptionSubmitButton: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  // Empty state instruction styles
  instructionBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    width: '100%',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionStep: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
    paddingLeft: 8,
  },

  // Modern Entry Screen Styles
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
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyStateContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  consumerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  consumerInfo: {
    padding: 20,
    paddingTop: 16,
  },
  placeholderInfo: {
    marginBottom: 20,
  },
  placeholderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  placeholderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
  readingSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  readingInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  multilineInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  consumptionPlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  consumptionHeader: {
    marginBottom: 12,
  },
  consumptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    padding: 20,
    paddingTop: 0,
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  disabledButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
