import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ConsumerWithDetails } from '../../types';
import { fetchConsumers } from '../../utils/api';

// Using ConsumerWithDetails from types instead of local interface


export default function ConsumersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsumer, setSelectedConsumer] = useState<ConsumerWithDetails | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('alpha');
  const [zoneFilter, setZoneFilter] = useState('Zone 1');
  const [consumers, setConsumers] = useState<ConsumerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadConsumers();
    
    // Set up auto-refresh listener
    const checkForUpdates = async () => {
      try {
        const lastUpdate = await AsyncStorage.getItem('lastDataUpdate');
        const currentCheck = await AsyncStorage.getItem('lastConsumerCheck');
        
        if (lastUpdate && lastUpdate !== currentCheck) {
          console.log('🔄 Consumer Screen: Auto-refresh triggered');
          setRefreshing(true);
          await loadConsumers();
          await AsyncStorage.setItem('lastConsumerCheck', lastUpdate);
          
          // Show refresh message briefly
          setTimeout(() => setRefreshing(false), 1500);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };
    
    // Check for updates every 2 seconds
    const interval = setInterval(checkForUpdates, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-change sort when zone filter changes
  useEffect(() => {
    // If switching to a specific zone and current sort is 'zone', change to 'alpha'
    if (zoneFilter !== 'all' && sortBy === 'zone') {
      setSortBy('alpha');
    }
  }, [zoneFilter, sortBy]);

  const loadConsumers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        console.log('🔄 Consumer Menu: Pull-to-refresh triggered');
      }
      
      // Load user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      }

      // Load consumers from database
      const response = await fetchConsumers();
      if (response.success && response.data) {
        setConsumers(response.data);
        console.log('Loaded consumers:', response.data);
      } else {
        console.error('Failed to load consumers:', response.error);
      }
    } catch (error) {
      console.error('Error loading consumers:', error);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setPullRefreshing(false);
      }
    }
  };

  const filteredConsumers = consumers
    .filter((consumer) => {
      // Handle null/undefined values safely
      const firstName = consumer.First_Name || '';
      const lastName = consumer.Last_Name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const zoneId = consumer.Zone_ID;
      const accountId = consumer.Consumer_ID?.toString() || '';
      
      // Search matches if query is empty or found in name/account
      const matchesSearch = !searchQuery.trim() || 
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        accountId.includes(searchQuery);
      
      // Zone filter matches if 'all' or zone ID matches the selected zone
      let matchesZone = false;
      if (zoneFilter === 'all') {
        matchesZone = true;
      } else {
        // Extract zone number from "Zone X" format and compare with Zone_ID
        const zoneNumber = parseInt(zoneFilter.replace('Zone ', ''));
        matchesZone = zoneId === zoneNumber;
      }
      
      // For zone-based workflow, show all consumers when zone is selected
      // Show pending by default, but show read consumers too for receipt access
      return matchesSearch && matchesZone;
    })
    .sort((a, b) => {
      const aName = `${a.First_Name || ''} ${a.Last_Name || ''}`.trim();
      const bName = `${b.First_Name || ''} ${b.Last_Name || ''}`.trim();
      const aZoneId = a.Zone_ID || 0;
      const bZoneId = b.Zone_ID || 0;
      
      if (sortBy === 'alpha') return aName.localeCompare(bName);
      if (sortBy === 'zone') return aZoneId - bZoneId || aName.localeCompare(bName);
      if (sortBy === 'acct') return (a.Consumer_ID || 0) - (b.Consumer_ID || 0);
      if (sortBy === 'status') return (a.status || 'Pending').localeCompare(b.status || 'Pending') || aName.localeCompare(bName);
      return 0;
    });

  const onRefresh = async () => {
    setPullRefreshing(true);
    await loadConsumers(true);
  };

  const handleConsumerPress = (consumer: ConsumerWithDetails) => {
    console.log('👆 Consumer Menu: Consumer pressed:', consumer.Consumer_ID, consumer.First_Name, consumer.Last_Name);
    setSelectedConsumer(consumer);
    if (consumer.status === 'Read') {
      // Show receipt preview for Read consumers
      console.log('👁️ Consumer Menu: Showing receipt for Read consumer');
      setReceiptModalVisible(true);
    } else {
      // Direct navigation to Entry tab for Pending consumers
      // Store selected consumer data for the entry screen
      console.log('💾 Consumer Menu: Storing consumer in AsyncStorage and navigating to entry');
      AsyncStorage.setItem('selectedConsumer', JSON.stringify(consumer));
      router.push('/entry');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading consumers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onRefresh}
            colors={['#1a73e8']}
            tintColor="#1a73e8"
            title="Pull to refresh consumers..."
            titleColor="#1a73e8"
          />
        }
      >
        {/* Auto-refresh indicator */}
        {refreshing && (
          <View style={styles.refreshIndicator}>
            <View style={styles.refreshIconContainer}>
              <ActivityIndicator size="small" color="#1a73e8" />
            </View>
            <Text style={styles.refreshText}>Refreshing consumer data...</Text>
          </View>
        )}
        
        {/* Summary Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardTotal]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>👥</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: '#1a73e8' }]}>
                  {zoneFilter === 'all' 
                    ? consumers.length 
                    : consumers.filter(c => {
                        const zoneNumber = parseInt(zoneFilter.replace('Zone ', ''));
                        return c.Zone_ID === zoneNumber;
                      }).length}
                </Text>
                <Text style={styles.statLabel}>Total Consumers</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardRead]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>✅</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>
                  {zoneFilter === 'all' 
                    ? consumers.filter(c => c.status === 'Read').length
                    : consumers.filter(c => {
                        const zoneNumber = parseInt(zoneFilter.replace('Zone ', ''));
                        return c.Zone_ID === zoneNumber && c.status === 'Read';
                      }).length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardPending]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>⏱️</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                  {zoneFilter === 'all' 
                    ? consumers.filter(c => c.status === 'Pending').length
                    : consumers.filter(c => {
                        const zoneNumber = parseInt(zoneFilter.replace('Zone ', ''));
                        return c.Zone_ID === zoneNumber && c.status === 'Pending';
                      }).length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search & Filter Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Search & Filters</Text>
          <View style={styles.filtersCard}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={zoneFilter === 'all' 
                    ? "Search consumers by name or account..." 
                    : `Search in ${zoneFilter}...`}
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'alpha' && styles.sortButtonActive]}
                  onPress={() => setSortBy('alpha')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'alpha' && styles.sortButtonTextActive]}>Name</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'acct' && styles.sortButtonActive]}
                  onPress={() => setSortBy('acct')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'acct' && styles.sortButtonTextActive]}>Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'status' && styles.sortButtonActive]}
                  onPress={() => setSortBy('status')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'status' && styles.sortButtonTextActive]}>Status</Text>
                </TouchableOpacity>
                {zoneFilter === 'all' && (
                  <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'zone' && styles.sortButtonActive]}
                    onPress={() => setSortBy('zone')}
                  >
                    <Text style={[styles.sortButtonText, sortBy === 'zone' && styles.sortButtonTextActive]}>Zone</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Zone Filter */}
            <View style={styles.zoneFilterContainer}>
              <Text style={styles.filterLabel}>Filter by zone:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneFilters}>
                <TouchableOpacity
                  style={[styles.zoneChip, zoneFilter === 'all' && styles.zoneChipActive]}
                  onPress={() => setZoneFilter('all')}
                >
                  <Text style={[styles.zoneChipText, zoneFilter === 'all' && styles.zoneChipTextActive]}>All</Text>
                </TouchableOpacity>
                {[1, 2, 3, 4, 5, 6, 7].map(zoneNum => (
                  <TouchableOpacity
                    key={zoneNum}
                    style={[styles.zoneChip, zoneFilter === `Zone ${zoneNum}` && styles.zoneChipActive]}
                    onPress={() => setZoneFilter(`Zone ${zoneNum}`)}
                  >
                    <Text style={[styles.zoneChipText, zoneFilter === `Zone ${zoneNum}` && styles.zoneChipTextActive]}>
                      {zoneNum}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Consumers List Section */}
        <View style={styles.consumersSection}>
          <View style={styles.listHeader}>
            <View style={styles.listTitleContainer}>
              <Text style={styles.sectionTitle}>
                {zoneFilter === 'all' ? '👥 All Consumers' : `📍 ${zoneFilter} Consumers`}
              </Text>
              <View style={styles.resultBadge}>
                <Text style={styles.resultCount}>
                  {filteredConsumers.length} result{filteredConsumers.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.consumersCard}>
            {filteredConsumers.length > 0 ? (
              filteredConsumers.map((consumer, index) => (
                <TouchableOpacity 
                  key={consumer.Consumer_ID} 
                  style={[styles.consumerItem, index === filteredConsumers.length - 1 && styles.lastConsumerItem]}
                  onPress={() => handleConsumerPress(consumer)}
                  activeOpacity={0.7}
                >
                  <View style={styles.consumerMainContent}>
                    <View style={styles.consumerHeader}>
                      <View style={styles.consumerAccountContainer}>
                        <Text style={styles.consumerAccountLabel}>Account</Text>
                        <Text style={styles.consumerAccount}>#{consumer.Consumer_ID || 'N/A'}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        consumer.status === 'Read' ? styles.statusBadgeRead : styles.statusBadgePending
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          consumer.status === 'Read' ? styles.statusBadgeTextRead : styles.statusBadgeTextPending
                        ]}>
                          {consumer.status === 'Read' ? '✓ Completed' : '⏱ Pending'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.consumerDetails}>
                      <Text style={styles.consumerName}>
                        {(consumer.First_Name || '') + ' ' + (consumer.Last_Name || '')}
                      </Text>
                      <View style={styles.consumerMeta}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaIcon}>📍</Text>
                          <Text style={styles.metaText}>Zone {consumer.Zone_ID || 'Unknown'}</Text>
                        </View>
                        {consumer.Address && (
                          <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>🏠</Text>
                            <Text style={styles.metaText} numberOfLines={1}>{consumer.Address}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.consumerActions}>
                    {consumer.status === 'Read' ? (
                      <TouchableOpacity 
                        style={styles.simpleActionButton}
                        onPress={() => handleConsumerPress(consumer)}
                      >
                        <Text style={styles.simpleActionIcon}>📄</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.simpleActionButton}
                        onPress={() => handleConsumerPress(consumer)}
                      >
                        <Text style={styles.simpleActionIcon}>📝</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🔍</Text>
                <Text style={styles.emptyStateTitle}>No consumers found</Text>
                <Text style={styles.emptyStateMessage}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No consumers in selected zone'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Receipt Preview Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.receiptModalOverlay}>
          <View style={styles.receiptModalContent}>
            <View style={styles.receiptModalHeader}>
              <Text style={styles.receiptModalTitle}>Receipt Preview</Text>
              <TouchableOpacity onPress={() => setReceiptModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.receiptScrollView}>
              {selectedConsumer && (
                <View style={styles.receiptBody}>
                  {/* Receipt Header */}
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
                    <View style={styles.receiptTableRow}>
                      <Text style={styles.receiptTableHeaderCell}>Account No.</Text>
                      <Text style={styles.receiptTableHeaderCell}>Numero ng Metro</Text>
                      <Text style={styles.receiptTableHeaderCell}>Petsa ng Pagbasa</Text>
                    </View>
                    <View style={styles.receiptTableRow}>
                      <Text style={styles.receiptTableCell}>{selectedConsumer.Consumer_ID}</Text>
                      <Text style={styles.receiptTableCell}>1234</Text>
                      <Text style={styles.receiptTableCell}>{new Date().toLocaleDateString('en-PH')}</Text>
                    </View>
                  </View>

                  {/* Consumer Info */}
                  <View style={styles.receiptTable}>
                    <View style={styles.receiptTableRow}>
                      <Text style={[styles.receiptTableHeaderCell, { flex: 1 }]}>Pangalan ng Consumer</Text>
                    </View>
                    <View style={styles.receiptTableRow}>
                      <Text style={[styles.receiptTableCell, { flex: 1 }]}>{(selectedConsumer.First_Name || '') + ' ' + (selectedConsumer.Last_Name || '')}</Text>
                    </View>
                    <View style={styles.receiptTableRow}>
                      <Text style={[styles.receiptTableHeaderCell, { flex: 1 }]}>Address</Text>
                    </View>
                    <View style={styles.receiptTableRow}>
                      <Text style={[styles.receiptTableCell, { flex: 1 }]}>{selectedConsumer.Address || 'No address'}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.receiptDescription}>
                    Ang tagapagbasa ng metro ng tubig ay pumunta sa inyo ngayong araw upang basahin at kwentahin ang konsumo ng tubig ayon sa mga sumusunod:
                  </Text>

                  {/* Consumption */}
                  <View style={styles.receiptSection}>
                    <Text style={styles.sectionTitle}>Konsumo:</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Ngayong Buwan</Text>
                        <Text style={styles.receiptDetailValue}>{(selectedConsumer.Previous_Reading || 0) + 8} metro kubiko</Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Nakaraang Buwan</Text>
                        <Text style={styles.receiptDetailValue}>{selectedConsumer.Previous_Reading || 0} metro kubiko</Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Kabuuang Konsumo</Text>
                        <Text style={styles.receiptDetailValue}>8 metro kubiko</Text>
                      </View>
                    </View>
                  </View>

                  {/* Charges */}
                  <View style={styles.receiptSection}>
                    <Text style={styles.sectionTitle}>Takdang Halaga:</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Bayarin ngayong Buwan</Text>
                        <Text style={styles.receiptDetailValue}>₱200.00</Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Multa (10%)</Text>
                        <Text style={styles.receiptDetailValue}>₱20.00</Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Di pa Bayad na Bayarin</Text>
                        <Text style={styles.receiptDetailValue}>₱300.00</Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Multa (10%)</Text>
                        <Text style={styles.receiptDetailValue}>₱30.00</Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Bayarin sa Koneksyon/Metro</Text>
                        <Text style={styles.receiptDetailValue}>₱0.00</Text>
                      </View>
                      <View style={[styles.receiptDetailRow, { borderTopWidth: 2, borderTopColor: '#000', paddingTop: 8, marginTop: 8 }]}>
                        <Text style={[styles.receiptDetailLabel, { fontWeight: '700' }]}>Kabuuang Bayarin</Text>
                        <Text style={[styles.receiptDetailValue, { fontWeight: '700', fontSize: 14 }]}>₱550.00</Text>
                      </View>
                    </View>
                  </View>

                  {/* Note */}
                  <Text style={styles.receiptNote}>
                    "Kung ang bayarin sa metro ng tubig/bayarin sa koneksyon/mga nakaraang buwan at multa ay nabayaran na, kasalukuyang buwan lang ang babayaran. <Text style={{ fontWeight: '700' }}>2025 SEPT</Text>"
                  </Text>

                  {/* Footer Table */}
                  <View style={styles.receiptTable}>
                    <View style={styles.receiptTableRow}>
                      <Text style={styles.receiptTableHeaderCell}>Water Bill #</Text>
                      <Text style={styles.receiptTableHeaderCell}>Tagabasa ng Metro</Text>
                      <Text style={styles.receiptTableHeaderCell}>Para sa Buwang</Text>
                    </View>
                    <View style={[styles.receiptTableRow, { height: 40 }]}>
                      <Text style={styles.receiptTableCell}></Text>
                      <Text style={styles.receiptTableCell}>__________</Text>
                      <Text style={styles.receiptTableCell}></Text>
                    </View>
                  </View>

                  {/* Disclaimer */}
                  <Text style={styles.receiptDisclaimer}>
                    *** Hindi ito Patunay ng Kabayaran ***
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.receiptModalFooter}>
              <TouchableOpacity
                style={styles.printReceiptButton}
                onPress={() => {
                  setReceiptModalVisible(false);
                  // Print functionality would go here
                }}
              >
                <Text style={styles.printReceiptButtonText}>🖨 Print Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  // Header Section
  headerSection: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerContent: {
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  // Stats Section
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statCardTotal: {
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  statCardRead: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  statCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statIconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // Refresh Indicator
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  refreshIconContainer: {
    marginRight: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
  },
  // Filters Section
  filtersSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  // Search Container
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#64748b',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  // Sort Container
  sortContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  sortButtonActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Zone Filter Container
  zoneFilterContainer: {
    marginBottom: 0,
  },
  zoneFilters: {
    flexDirection: 'row',
  },
  zoneChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginRight: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  zoneChipActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  zoneChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  zoneChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Consumers Section
  consumersSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  consumersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  // Consumer Item
  consumerItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  lastConsumerItem: {
    borderBottomWidth: 0,
  },
  consumerMainContent: {
    flex: 1,
  },
  consumerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  consumerAccountContainer: {
    flex: 1,
  },
  consumerAccountLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  consumerAccount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    height: 28,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  statusBadgeRead: {
    backgroundColor: '#dcfce7',
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    includeFontPadding: false,
  },
  statusBadgeTextRead: {
    color: '#166534',
  },
  statusBadgeTextPending: {
    color: '#92400e',
  },
  consumerDetails: {
    marginBottom: 12,
  },
  consumerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  consumerMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  consumerActions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 16,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 80,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // Simple Action Buttons
  simpleActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  simpleActionIcon: {
    fontSize: 18,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Legacy styles (keeping for compatibility)
  card: {
    backgroundColor: '#fff',
    margin: 12,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  // Legacy zone styles (keeping for compatibility)
  legacyZoneFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legacyZoneButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  legacyZoneButtonActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  legacyZoneButtonText: {
    fontSize: 13,
    color: '#374151',
  },
  legacyZoneButtonTextActive: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Legacy consumer item (keeping for compatibility)
  legacyConsumerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  consumerInfo: {
    flex: 1,
  },
  accountNo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  // Legacy consumer name style
  legacyConsumerName: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
    marginBottom: 2,
  },
  consumerZone: {
    fontSize: 12,
    color: '#6b7280',
  },
  consumerRight: {
    marginLeft: 12,
  },
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusRead: {
    backgroundColor: '#d4edda',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextRead: {
    color: '#155724',
  },
  statusTextPending: {
    color: '#856404',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  closeModalButton: {
    marginTop: 16,
    backgroundColor: '#1a73e8',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Grid and Sort Styles
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
  select: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectButton: {
    padding: 12,
  },
  selectText: {
    fontSize: 14,
    color: '#374151',
  },
  // Table Styles
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
  },
  clickableName: {
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 14,
  },
  // Legacy meta text style
  legacyMetaText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  eyeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  eyeIcon: {
    fontSize: 16,
  },
  // Receipt Modal Styles
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 500,
    width: '100%',
    maxHeight: '90%',
  },
  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  receiptModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  receiptScrollView: {
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
  receiptTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  receiptTableHeaderCell: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontWeight: '600',
    fontSize: 10,
  },
  receiptTableCell: {
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
  // Receipt section title (different from main sectionTitle)
  receiptSectionTitle: {
    fontWeight: '700',
    marginBottom: 2,
    fontSize: 9,
  },
  sectionContent: {
    paddingLeft: 5,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  receiptDetailLabel: {
    fontSize: 9,
    flex: 1,
  },
  receiptDetailValue: {
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
  receiptDisclaimer: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  receiptModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  printReceiptButton: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  printReceiptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  refreshSpinner: {
    marginRight: 8,
  },
});
