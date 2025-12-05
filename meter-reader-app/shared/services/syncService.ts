// Sync Service for SQLite ↔ MySQL synchronization
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { databaseService } from './database';

interface SyncConfig {
  officeWifiSSID: string;
  apiBaseUrl: string;
  syncInterval: number; // milliseconds
}

class SyncService {
  private config: SyncConfig = {
    officeWifiSSID: 'SLR_OFFICE_WIFI', // Configure this to your office WiFi name
    apiBaseUrl: 'http://192.168.1.100:3000/api', // Configure this to your server IP
    syncInterval: 30000, // 30 seconds
  };

  private syncTimer: any = null;
  private isSyncing = false;

  async startAutoSync(): Promise<void> {
    console.log('Starting auto-sync service...');
    
    // Initial sync check
    await this.checkAndSync();
    
    // Set up periodic sync checks
    this.syncTimer = setInterval(async () => {
      await this.checkAndSync();
    }, this.config.syncInterval);
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    console.log('Auto-sync service stopped');
  }

  private async checkAndSync(): Promise<void> {
    if (this.isSyncing) return;

    try {
      const netInfo = await NetInfo.fetch();
      
      // Check if connected to office WiFi
      if (this.isOfficeWiFi(netInfo)) {
        console.log('Connected to office WiFi, starting sync...');
        await this.performFullSync();
      } else {
        console.log('Not connected to office WiFi, skipping sync');
      }
    } catch (error) {
      console.error('Sync check error:', error);
    }
  }

  private isOfficeWiFi(netInfo: any): boolean {
    return (
      netInfo.isConnected &&
      netInfo.type === 'wifi' &&
      netInfo.details?.ssid === this.config.officeWifiSSID
    );
  }

  async performFullSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    
    try {
      console.log('Starting full synchronization...');
      
      // Step 1: Push local changes to server
      await this.pushLocalChanges();
      
      // Step 2: Pull server updates
      await this.pullServerUpdates();
      
      // Step 3: Update last sync timestamp
      await AsyncStorage.setItem('lastSyncTime', Date.now().toString());
      
      console.log('Full synchronization completed successfully');
      
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushLocalChanges(): Promise<void> {
    console.log('Pushing local changes to server...');
    
    const pendingSync = await databaseService.getPendingSyncData();
    
    for (const syncItem of pendingSync) {
      try {
        await this.pushSyncItem(syncItem);
        await databaseService.markSynced(syncItem.id);
      } catch (error) {
        console.error(`Failed to sync item ${syncItem.id}:`, error);
        // Continue with other items
      }
    }
  }

  private async pushSyncItem(syncItem: any): Promise<void> {
    const { table_name, record_id, action } = syncItem;
    
    switch (table_name) {
      case 'readings':
        if (action === 'insert') {
          await this.pushNewReading(record_id);
        }
        break;
      
      case 'consumers':
        if (action === 'update') {
          console.log(`Consumer update sync not implemented yet for record ${record_id}`);
        }
        break;
        
      default:
        console.log(`Sync not implemented for table: ${table_name}`);
    }
  }

  private async pushNewReading(readingId: number): Promise<void> {
    // Get reading from local SQLite
    const reading = await this.getLocalReading(readingId);
    if (!reading) return;

    // Send to server
    const response = await fetch(`${this.config.apiBaseUrl}/sync/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify({
        Route_ID: reading.Route_ID,
        Consumer_ID: reading.Consumer_ID,
        Meter_ID: reading.Meter_ID,
        Meter_Reader_ID: reading.Meter_Reader_ID,
        Created_Date: reading.Created_Date,
        Reading_Status: reading.Reading_Status,
        Previous_Reading: reading.Previous_Reading,
        Current_Reading: reading.Current_Reading,
        mobile_timestamp: reading.last_modified,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to push reading: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local record with server ID
    await databaseService.markSynced(readingId, result.Reading_ID);
  }

  private async pullServerUpdates(): Promise<void> {
    console.log('Pulling server updates...');
    
    const lastSync = await AsyncStorage.getItem('lastSyncTime');
    const timestamp = lastSync ? parseInt(lastSync) : 0;
    
    // Pull bills updates
    await this.pullBills(timestamp);
    
    // Pull payments updates
    await this.pullPayments(timestamp);
    
    // Pull reference data (zones, classifications)
    await this.pullReferenceData();
  }

  private async pullBills(since: number): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/sync/bills?since=${since}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (response.ok) {
        const bills = await response.json();
        
        for (const bill of bills) {
          await this.upsertLocalBill(bill);
        }
        
        console.log(`Pulled ${bills.length} bill updates`);
      }
    } catch (error) {
      console.error('Failed to pull bills:', error);
    }
  }

  private async pullPayments(since: number): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/sync/payments?since=${since}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (response.ok) {
        const payments = await response.json();
        
        for (const payment of payments) {
          await this.upsertLocalPayment(payment);
        }
        
        console.log(`Pulled ${payments.length} payment updates`);
      }
    } catch (error) {
      console.error('Failed to pull payments:', error);
    }
  }

  private async pullReferenceData(): Promise<void> {
    // Pull zones, classifications, etc.
    // This data doesn't change often, so we can pull it less frequently
    const lastRefSync = await AsyncStorage.getItem('lastRefDataSync');
    const daysSinceRefSync = lastRefSync ? 
      (Date.now() - parseInt(lastRefSync)) / (1000 * 60 * 60 * 24) : 999;
    
    if (daysSinceRefSync > 1) { // Sync reference data daily
      try {
        // Pull zones
        const zonesResponse = await fetch(`${this.config.apiBaseUrl}/sync/zones`);
        if (zonesResponse.ok) {
          const zones = await zonesResponse.json();
          for (const zone of zones) {
            await this.upsertLocalZone(zone);
          }
        }

        // Pull classifications
        const classResponse = await fetch(`${this.config.apiBaseUrl}/sync/classifications`);
        if (classResponse.ok) {
          const classifications = await classResponse.json();
          for (const classification of classifications) {
            await this.upsertLocalClassification(classification);
          }
        }

        await AsyncStorage.setItem('lastRefDataSync', Date.now().toString());
        console.log('Reference data synchronized');
        
      } catch (error) {
        console.error('Failed to pull reference data:', error);
      }
    }
  }

  // Helper methods for database operations
  private async getLocalReading(readingId: number): Promise<any> {
    // Implementation depends on your SQLite query method
    // This is a placeholder - implement based on your database service
    return null;
  }

  private async upsertLocalBill(bill: any): Promise<void> {
    // Insert or update bill in local SQLite
    // Implementation depends on your database service
  }

  private async upsertLocalPayment(payment: any): Promise<void> {
    // Insert or update payment in local SQLite
    // Implementation depends on your database service
  }

  private async upsertLocalZone(zone: any): Promise<void> {
    // Insert or update zone in local SQLite
    // Implementation depends on your database service
  }

  private async upsertLocalClassification(classification: any): Promise<void> {
    // Insert or update classification in local SQLite
    // Implementation depends on your database service
  }

  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token available');
    }
    return token;
  }

  // Manual sync trigger (for testing or user-initiated sync)
  async manualSync(): Promise<boolean> {
    try {
      await this.performFullSync();
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    lastSync: Date | null;
    pendingItems: number;
    isConnectedToOfficeWifi: boolean;
  }> {
    const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
    const pendingSync = await databaseService.getPendingSyncData();
    const netInfo = await NetInfo.fetch();
    
    return {
      lastSync: lastSyncTime ? new Date(parseInt(lastSyncTime)) : null,
      pendingItems: pendingSync.length,
      isConnectedToOfficeWifi: this.isOfficeWiFi(netInfo),
    };
  }
}

// Create singleton instance
export const syncService = new SyncService();
export default syncService;
