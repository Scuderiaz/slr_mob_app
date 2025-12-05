// Server configuration for syncing with office MySQL database
export const SERVER_CONFIG = {
  // Base URL for your office server API
  BASE_URL: 'https://slr-water-billing.gov.ph/api',
  
  // API endpoints
  ENDPOINTS: {
    SYNC_READINGS: '/sync/readings',
    SYNC_CONSUMERS: '/sync/consumers',
    SYNC_ACCOUNTS: '/sync/accounts',
    AUTH: '/auth/mobile',
    HEALTH: '/health',
    PING: '/ping'
  },
  
  // Sync settings
  SYNC: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 seconds
    BATCH_SIZE: 10 // Number of readings to sync at once
  },
  
  // Network settings
  NETWORK: {
    WIFI_ONLY: false, // Set to true to sync only on WiFi
    OFFICE_WIFI_SSID: 'SLR-Office-WiFi' // Office WiFi name for auto-sync
  }
};

// Development/Testing server (local)
export const DEV_SERVER_CONFIG = {
  ...SERVER_CONFIG,
  BASE_URL: 'http://192.168.1.100:3000/api' // Your local server IP
};

// Production server configuration
export const PROD_SERVER_CONFIG = {
  ...SERVER_CONFIG,
  BASE_URL: 'https://slr-water-billing.gov.ph/api' // Your production server
};

// Get current server config based on environment
export function getServerConfig() {
  // You can switch this based on your environment
  const isDevelopment = __DEV__;
  
  return isDevelopment ? DEV_SERVER_CONFIG : PROD_SERVER_CONFIG;
}

// MySQL database structure mapping
export const MYSQL_SCHEMA = {
  // Table names in MySQL database
  TABLES: {
    METERREADINGS: 'meterreadings',
    CONSUMER: 'consumer',
    ACCOUNTS: 'accounts',
    ZONE: 'zone'
  },
  
  // Field mappings from SQLite to MySQL
  FIELD_MAPPINGS: {
    // SQLite field -> MySQL field
    'Reading_ID': 'Reading_ID',
    'Consumer_ID': 'Consumer_ID',
    'Current_Reading': 'Current_Reading',
    'Previous_Reading': 'Previous_Reading',
    'Consumption': 'Consumption',
    'Notes': 'Notes',
    'Status': 'Status',
    'Reading_Date': 'Reading_Date',
    'Created_Date': 'Created_Date'
  }
};
