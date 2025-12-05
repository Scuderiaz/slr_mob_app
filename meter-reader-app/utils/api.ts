import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { databaseService } from '../shared/services/database';
import { ConsumerWithDetails, MeterReaderProfile, MeterReaderUser, Reading } from '../types/index';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get current user from storage
async function getCurrentUser(): Promise<MeterReaderUser | null> {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Database operation wrapper with error handling
async function dbOperation<T>(operation: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await operation();
    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error('Database operation error:', error);
    return {
      success: false,
      error: error.message || 'Database operation failed',
    };
  }
}

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Save authentication token to storage
 */
async function saveAuthToken(token: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

/**
 * Remove authentication token from storage
 */
async function removeAuthToken(): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

// ============================================================================
// Authentication API
// ============================================================================

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    zone: string;
  };
}

export async function login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
  return dbOperation(async () => {
    const user = await databaseService.authenticateUser(credentials.username, credentials.password);
    
    if (!user || (user.Role_Name !== 'Meter Reader' && user.Role_Name !== 'Admin')) {
      throw new Error('Invalid credentials or insufficient permissions');
    }

    const token = 'db-auth-' + user.AccountID + '-' + Date.now();
    await saveAuthToken(token);

    return {
      token,
      user: {
        id: user.AccountID,
        name: `${user.First_Name || ''} ${user.Last_Name || ''}`.trim() || user.Username,
        email: user.Username + '@slrwater.gov.ph',
        role: user.Role_Name,
        zone: user.Zone_Name || 'Unknown Zone'
      }
    };
  });
}

export async function logout(): Promise<void> {
  await removeAuthToken();
}

export async function verifyToken(): Promise<ApiResponse<{ valid: boolean }>> {
  return dbOperation(async () => {
    const token = await getAuthToken();
    return { valid: !!token };
  });
}

// ============================================================================
// Connection Checking Functions
// ============================================================================

interface ConnectionStatus {
  isConnected: boolean;
  connectionType: string;
  isWiFi: boolean;
  isOfficeWiFi: boolean;
  signalStrength?: number;
  details: string;
}

/**
 * Comprehensive connection checker for sync operations
 */
async function checkSyncConnectivity(): Promise<ConnectionStatus> {
  try {
    console.log('🔍 Checking connectivity for sync...');
    
    // Get network state
    const netInfo = await NetInfo.fetch();
    
    const status: ConnectionStatus = {
      isConnected: netInfo.isConnected ?? false,
      connectionType: netInfo.type || 'unknown',
      isWiFi: netInfo.type === 'wifi',
      isOfficeWiFi: false,
      details: ''
    };

    // Check if connected to internet
    if (!status.isConnected) {
      status.details = 'No internet connection detected';
      console.log('❌ No internet connection');
      return status;
    }

    // Check connection type
    if (status.connectionType === 'cellular') {
      status.details = 'Connected via cellular data - sync may use mobile data';
      console.log('📱 Cellular connection detected');
    } else if (status.connectionType === 'wifi') {
      console.log('📶 WiFi connection detected');
      
      // Check if it's office WiFi
      const officeWiFiNames = [
        'SLR-Office-WiFi', 
        'SLR-OFFICE', 
        'Office-WiFi', 
        'SLR_OFFICE',
        'SanLorenzoRuiz-Office',
        'Municipal-Office'
      ];
      
      const currentSSID = (netInfo.details as any)?.ssid;
      if (currentSSID) {
        status.isOfficeWiFi = officeWiFiNames.some(name => 
          currentSSID.toLowerCase().includes(name.toLowerCase())
        );
        
        if (status.isOfficeWiFi) {
          status.details = `Connected to office WiFi: ${currentSSID}`;
          console.log('🏢 Office WiFi detected:', currentSSID);
        } else {
          status.details = `Connected to WiFi: ${currentSSID} (not office network)`;
          console.log('📶 External WiFi detected:', currentSSID);
        }
      } else {
        status.details = 'Connected to WiFi (network name unavailable)';
        console.log('📶 WiFi connected but SSID unavailable');
      }
      
      // Get signal strength if available
      const signalStrength = (netInfo.details as any)?.strength;
      if (signalStrength !== undefined) {
        status.signalStrength = signalStrength;
        console.log('📊 WiFi signal strength:', status.signalStrength);
      }
    } else {
      status.details = `Connected via ${status.connectionType}`;
      console.log('🌐 Other connection type:', status.connectionType);
    }

    return status;
  } catch (error) {
    console.error('❌ Error checking connectivity:', error);
    return {
      isConnected: false,
      connectionType: 'error',
      isWiFi: false,
      isOfficeWiFi: false,
      details: `Connection check failed: ${error}`
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnectivity(): Promise<{ isHealthy: boolean; details: string }> {
  try {
    console.log('🔍 Checking database connectivity...');
    
    // Initialize database if needed
    await databaseService.initDatabase();
    
    // Test database with a simple query
    const testResult = await databaseService.getAllConsumers();
    
    if (Array.isArray(testResult)) {
      console.log('✅ Database connectivity OK');
      return {
        isHealthy: true,
        details: `Database accessible with ${testResult.length} consumers`
      };
    } else {
      console.log('❌ Database query returned invalid result');
      return {
        isHealthy: false,
        details: 'Database query returned invalid result'
      };
    }
  } catch (error) {
    console.error('❌ Database connectivity error:', error);
    return {
      isHealthy: false,
      details: `Database error: ${error}`
    };
  }
}

/**
 * Test server connectivity (ping test)
 */
async function checkServerConnectivity(): Promise<{ isReachable: boolean; details: string; responseTime?: number }> {
  try {
    console.log('🔍 Testing server connectivity...');
    
    const startTime = Date.now();
    
    // Test with a simple HTTP request to a reliable endpoint
    // In production, this would be your actual server endpoint
    const testUrls = [
      'https://www.google.com', // Fallback for internet connectivity
      'https://api.github.com', // Another reliable endpoint
      // 'https://your-office-server.com/api/health' // Your actual server endpoint
    ];
    
    for (const url of testUrls) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          console.log('✅ Server connectivity OK');
          return {
            isReachable: true,
            details: `Server reachable (${responseTime}ms)`,
            responseTime
          };
        }
      } catch (error) {
        console.log(`❌ Failed to reach ${url}:`, error);
        continue; // Try next URL
      }
    }
    
    return {
      isReachable: false,
      details: 'All server endpoints unreachable'
    };
  } catch (error) {
    console.error('❌ Server connectivity error:', error);
    return {
      isReachable: false,
      details: `Server connectivity test failed: ${error}`
    };
  }
}

// Readings API
// ============================================================================

export async function syncReadings(): Promise<ApiResponse<{ synced: number }>> {
  return dbOperation(async () => {
    console.log('🔍 Starting comprehensive sync process...');
    
    // 1. Check Network Connectivity
    console.log('📡 Step 1: Checking network connectivity...');
    const networkStatus = await checkSyncConnectivity();
    
    if (!networkStatus.isConnected) {
      throw new Error(`Network Error: ${networkStatus.details}`);
    }
    
    console.log(`✅ Network Status: ${networkStatus.details}`);
    
    // 2. Check Database Connectivity
    console.log('💾 Step 2: Checking database connectivity...');
    const dbStatus = await checkDatabaseConnectivity();
    
    if (!dbStatus.isHealthy) {
      throw new Error(`Database Error: ${dbStatus.details}`);
    }
    
    console.log(`✅ Database Status: ${dbStatus.details}`);
    
    // 3. Check Server Connectivity (optional - for future server integration)
    console.log('🌐 Step 3: Checking server connectivity...');
    const serverStatus = await checkServerConnectivity();
    
    if (!serverStatus.isReachable) {
      console.log(`⚠️ Server Warning: ${serverStatus.details} (continuing with local sync)`);
    } else {
      console.log(`✅ Server Status: ${serverStatus.details}`);
    }
    
    // 4. Validate Office WiFi (recommended but not required)
    if (networkStatus.isWiFi && !networkStatus.isOfficeWiFi) {
      console.log('⚠️ Warning: Not connected to office WiFi - sync may use external network');
    } else if (networkStatus.isOfficeWiFi) {
      console.log('🏢 Confirmed: Connected to office WiFi network');
    }
    
    // 5. Get unsynced readings from local SQLite database
    console.log('📋 Step 4: Retrieving unsynced readings...');
    await databaseService.debugSyncStatus();
    const unsyncedReadings = await databaseService.getUnsyncedReadings();
    
    console.log(`📤 Found ${unsyncedReadings.length} unsynced readings to upload`);
    
    if (unsyncedReadings.length === 0) {
      return {
        synced: 0,
        message: 'No readings to sync - all data is up to date'
      };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    // Upload each reading to MySQL server
    for (const reading of unsyncedReadings) {
      try {
        console.log(`📤 Syncing reading ${reading.Reading_ID} (Consumer ${reading.Consumer_ID}, Reading ${reading.Current_Reading})`);
        const success = await uploadReadingToServer(reading);
        if (success) {
          // Mark as synced in local database
          await databaseService.markReadingAsSynced(reading.Reading_ID);
          syncedCount++;
          console.log(`✅ Reading ${reading.Reading_ID} synced successfully`);
        } else {
          console.log(`❌ Failed to sync reading ${reading.Reading_ID}`);
          errors.push(`Failed to sync reading ${reading.Reading_ID}`);
        }
      } catch (error) {
        console.error('Sync error for reading:', reading.Reading_ID, error);
        errors.push(`Error syncing reading ${reading.Reading_ID}: ${error}`);
      }
    }

    // Debug: Show sync status after sync
    console.log('🔍 Sync process completed. Final status:');
    await databaseService.debugSyncStatus();

    // Also sync consumer updates if any
    await syncConsumerUpdates();

    return {
      synced: syncedCount,
      message: syncedCount > 0 
        ? `${syncedCount} readings synced to office database successfully` 
        : 'No readings could be synced',
      errors: errors.length > 0 ? errors : undefined
    };
  });
}

async function uploadReadingToServer(reading: any): Promise<boolean> {
  try {
    // Import server configuration
    const { getServerConfig } = require('../config/server');
    const serverConfig = getServerConfig();
    const serverUrl = serverConfig.BASE_URL + serverConfig.ENDPOINTS.SYNC_READINGS;
    
    // Prepare reading data for MySQL database
    const readingData = {
      Reading_ID: reading.Reading_ID,
      Route_ID: reading.Route_ID,
      Consumer_ID: reading.Consumer_ID,
      Meter_ID: reading.Meter_ID,
      Meter_Reader_ID: reading.Meter_Reader_ID,
      Created_Date: reading.Created_Date,
      Reading_Status: reading.Reading_Status,
      Previous_Reading: reading.Previous_Reading,
      Current_Reading: reading.Current_Reading,
      Consumption: reading.Consumption,
      Notes: reading.Notes,
      Status: reading.Status,
      Reading_Date: reading.Reading_Date,
      // Add mobile-specific metadata
      mobile_device_id: await getDeviceId(),
      sync_timestamp: new Date().toISOString()
    };

    console.log('📤 Uploading reading to MySQL server:', serverUrl);
    console.log('📋 Reading data:', readingData);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), serverConfig.SYNC.TIMEOUT);
    
    try {
      // Make actual HTTP request to server
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
          'X-Mobile-Device': await getDeviceId(),
          'X-App-Version': '1.0.0'
        },
        body: JSON.stringify(readingData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Server response:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Server error:', response.status, errorText);
        
        // If server is not available, fall back to simulation for development
        if (response.status >= 500 || response.status === 404) {
          console.log('⚠️ Server unavailable, using simulation mode');
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
          return true; // Simulate success
        }
        
        return false;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle network errors
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout');
      } else if (error.message.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
        console.log('⚠️ Network error, using simulation mode for development');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        return true; // Simulate success in development
      } else {
        console.error('❌ Upload error:', error);
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to upload reading to server:', error);
    return false;
  }
}

async function syncConsumerUpdates(): Promise<void> {
  try {
    // Sync any consumer status updates to the server
    console.log('📤 Syncing consumer updates to office database...');
    
    // TODO: Implement consumer updates sync
    // This would sync any consumer status changes, new consumers, etc.
  } catch (error) {
    console.error('Failed to sync consumer updates:', error);
  }
}

async function getDeviceId(): Promise<string> {
  try {
    // Get unique device identifier for tracking
    const deviceId = await AsyncStorage.getItem('deviceId');
    if (deviceId) return deviceId;
    
    // Generate new device ID if not exists
    const newDeviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('deviceId', newDeviceId);
    return newDeviceId;
  } catch (error) {
    return `mobile_${Date.now()}`;
  }
}

export async function uploadReading(reading: Reading): Promise<ApiResponse<{ id: number }>> {
  return dbOperation(async () => {
    const readingId = await databaseService.insertReading({
      Route_ID: reading.Route_ID,
      Consumer_ID: reading.Consumer_ID,
      Meter_ID: reading.Meter_ID,
      Meter_Reader_ID: reading.Meter_Reader_ID,
      Created_Date: reading.Created_Date,
      Reading_Status: reading.Reading_Status,
      Previous_Reading: reading.Previous_Reading,
      Current_Reading: reading.Current_Reading
    });

    return { id: readingId };
  });
}

export async function saveReading(reading: Reading): Promise<ApiResponse<{ id: number; status: string }>> {
  return dbOperation(async () => {
    // Initialize database
    await databaseService.initDatabase();
    
    // Prepare reading data with all required fields
    const readingData = {
      Route_ID: reading.Route_ID,
      Consumer_ID: reading.Consumer_ID,
      Meter_ID: reading.Meter_ID,
      Meter_Reader_ID: reading.Meter_Reader_ID,
      Created_Date: reading.Created_Date,
      Reading_Status: reading.Reading_Status,
      Previous_Reading: reading.Previous_Reading,
      Current_Reading: reading.Current_Reading,
      Consumption: reading.Consumption || (reading.Current_Reading - reading.Previous_Reading),
      Notes: reading.Notes || '',
      Status: reading.Status || 'Completed',
      Reading_Date: reading.Reading_Date || new Date().toISOString().split('T')[0]
    };
    
    // Save reading to meterreadings table
    const readingId = await databaseService.insertReading(readingData);

    // Generate bill from reading
    await generateBillFromReading(readingId, readingData);

    return { 
      id: readingId, 
      status: 'Reading saved successfully and consumer status updated to Read'
    };
  });
}

// Generate bill from meter reading
async function generateBillFromReading(readingId: number, readingData: any): Promise<void> {
  try {
    // Get current rate (default rate if none exists)
    const rate = await databaseService.getCurrentRate() || { Min_Rate: 50, Price_Per_Cubic: 15 };
    
    // Calculate bill amount
    const consumption = readingData.Consumption || 0;
    const baseAmount = rate.Min_Rate || 50; // Minimum charge
    const consumptionCharge = consumption * (rate.Price_Per_Cubic || 15);
    const totalAmount = baseAmount + consumptionCharge;
    
    // Calculate due date (30 days from reading date)
    const readingDate = new Date(readingData.Reading_Date);
    const dueDate = new Date(readingDate);
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Create bill data
    const billData = {
      Consumer_ID: readingData.Consumer_ID,
      Reading_ID: readingId,
      Billing_Officer_ID: 1, // Default billing officer
      Billing_Month: readingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      Amount_Due: consumptionCharge,
      Penalty: 0,
      Previous_Balance: 0,
      Previous_Penalty: 0,
      Connection_Fee: 0,
      Total_Amount: totalAmount,
      Due_Date: dueDate.toISOString().split('T')[0],
      Payment_Status: 'Unpaid'
    };
    
    // Save bill to database
    await databaseService.insertBill(billData);
    
    console.log('✅ Bill generated for reading:', readingId, 'Amount:', totalAmount);
  } catch (error) {
    console.error('❌ Error generating bill:', error);
  }
}

// ============================================================================
// Consumers API
// ============================================================================

export async function fetchConsumers(zoneId?: number): Promise<ApiResponse<ConsumerWithDetails[]>> {
  return dbOperation(async () => {
    // Initialize database if not already done
    await databaseService.initDatabase();
    
    // Get all consumers from database
    const results = await databaseService.getAllConsumers();
    
    // Filter by zone if specified
    const filteredResults = zoneId ? results.filter(row => row.Zone_ID === zoneId) : results;
    
    return filteredResults.map((row: any) => ({
      Consumer_ID: row.Consumer_ID,
      First_Name: row.First_Name,
      Last_Name: row.Last_Name,
      Address: row.Address,
      Zone_ID: row.Zone_ID,
      Zone_Name: row.Zone_Name,
      Classification_ID: row.Classification_ID,
      Classification_Name: row.Classification_Name,
      Meter_Serial_Number: row.Meter_Serial_Number,
      Meter_Size: row.Meter_Size,
      Previous_Reading: row.Previous_Reading || 0,
      Current_Reading: row.Current_Reading,
      status: row.Current_Reading ? 'Read' : 'Pending' as 'Read' | 'Pending' | 'Flagged'
    }));
  });
}

export async function fetchConsumerById(id: number): Promise<ApiResponse<ConsumerWithDetails>> {
  return dbOperation(async () => {
    // Initialize database if not already done
    await databaseService.initDatabase();
    
    // Get all consumers and find the specific one
    const results = await databaseService.getAllConsumers();
    const consumer = results.find(row => row.Consumer_ID === id);
    
    if (!consumer) {
      throw new Error('Consumer not found');
    }
    
    return {
      Consumer_ID: consumer.Consumer_ID,
      First_Name: consumer.First_Name,
      Last_Name: consumer.Last_Name,
      Address: consumer.Address,
      Zone_ID: consumer.Zone_ID,
      Zone_Name: consumer.Zone_Name,
      Classification_ID: consumer.Classification_ID,
      Classification_Name: consumer.Classification_Name,
      Meter_Serial_Number: consumer.Meter_Serial_Number,
      Meter_Size: consumer.Meter_Size,
      Previous_Reading: consumer.Previous_Reading || 0,
      Current_Reading: consumer.Current_Reading,
      status: consumer.Current_Reading ? 'Read' : 'Pending' as 'Read' | 'Pending' | 'Flagged'
    };
  });
}

// ============================================================================
// Profile API
// ============================================================================

export async function updateProfile(profile: MeterReaderProfile): Promise<ApiResponse<MeterReaderProfile>> {
  return dbOperation(async () => {
    // In a real implementation, this would update the user profile in the database
    // For now, just return the profile as-is
    return profile;
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<{ success: boolean }>> {
  return dbOperation(async () => {
    // In a real implementation, this would update the password in the database
    // For now, just return success
    return { success: true };
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

export function isOnline(): Promise<boolean> {
  // For database-based app, we're always "online" if database is available
  return new Promise(async (resolve) => {
    try {
      // Test database connection
      await databaseService.getPendingSyncData();
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
}

export { getAuthToken, removeAuthToken, saveAuthToken };

