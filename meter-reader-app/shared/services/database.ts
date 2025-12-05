// SQLite Database Service for Mobile App
import * as SQLite from 'expo-sqlite';
import {
  Bill,
  Payment,
  Reading
} from '../types/consumer';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    if (this.db) return; // Already initialized

    try {
      this.db = await SQLite.openDatabaseAsync('water_billing_system-1.db');
      console.log('✅ Database opened successfully');
      
      // Check if migration is needed
      await this.checkAndMigrateSchema();
      
      await this.createTables();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async checkAndMigrateSchema(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if consumer table exists
      const tables = await this.db.getAllAsync(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='consumer'
      `);
      
      if (tables.length === 0) {
        console.log('📝 Consumer table not found - database needs initialization');
        return; // Let createTables handle it
      }

      // Check if Account_Number column exists in consumer table
      const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(consumer)`);
      const hasAccountNumber = tableInfo.some((col: any) => col.name === 'Account_Number');
      
      if (!hasAccountNumber) {
        console.log('🔄 Schema migration needed - rebuilding database...');
        await this.clearAllData();
        console.log('✅ Database schema migrated successfully');
      }
    } catch (error) {
      console.log('📝 Database migration check failed, will create fresh tables:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Accounts table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS accounts (
        AccountID INTEGER PRIMARY KEY,
        Username TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        Role_ID INTEGER,
        First_Name TEXT,
        Last_Name TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_modified INTEGER DEFAULT 0
      )`,

      // Roles table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS roles (
        Role_ID INTEGER PRIMARY KEY,
        Role_Name TEXT NOT NULL
      )`,

      // Consumer table - matches water_billing_system-1.sql
      `CREATE TABLE IF NOT EXISTS consumer (
        Consumer_ID INTEGER PRIMARY KEY,
        First_Name TEXT,
        Last_Name TEXT,
        Address TEXT,
        Zone_ID INTEGER,
        Classification_ID INTEGER,
        Login_ID INTEGER,
        Account_Number TEXT,
        Meter_Number TEXT,
        Status TEXT DEFAULT 'Active',
        Contact_Number TEXT,
        Connection_Date TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_modified INTEGER DEFAULT 0
      )`,

      // Zone table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS zone (
        Zone_ID INTEGER PRIMARY KEY,
        Zone_Name TEXT NOT NULL
      )`,

      // Classification table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS classification (
        Classification_ID INTEGER PRIMARY KEY,
        Classification_Name TEXT NOT NULL
      )`,

      // Meter table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS meter (
        Meter_ID INTEGER PRIMARY KEY,
        Consumer_ID INTEGER UNIQUE,
        Meter_Serial_Number TEXT,
        Meter_Size TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_modified INTEGER DEFAULT 0
      )`,

      // Route table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS route (
        Route_ID INTEGER PRIMARY KEY,
        Meter_Reader_ID INTEGER,
        Zone_ID INTEGER
      )`,

      // MeterReadings table - matches water_billing_system-1.sql
      `CREATE TABLE IF NOT EXISTS meterreadings (
        Reading_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Route_ID INTEGER,
        Consumer_ID INTEGER,
        Meter_ID INTEGER,
        Meter_Reader_ID INTEGER,
        Created_Date TEXT DEFAULT CURRENT_TIMESTAMP,
        Reading_Status TEXT CHECK(Reading_Status IN ('Normal','Locked','Malfunction','Estimated')),
        Previous_Reading REAL,
        Current_Reading REAL,
        Consumption REAL,
        Notes TEXT,
        Status TEXT DEFAULT 'Pending',
        Reading_Date TEXT DEFAULT (date('now')),
        sync_status TEXT DEFAULT 'pending',
        last_modified INTEGER DEFAULT 0,
        created_locally INTEGER DEFAULT 1
      )`,

      // Bill table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS bill (
        Bill_ID INTEGER PRIMARY KEY,
        Consumer_ID INTEGER,
        Reading_ID INTEGER UNIQUE,
        Billing_Officer_ID INTEGER,
        Billing_Month TEXT,
        Amount_Due REAL,
        Penalty REAL,
        Previous_Balance REAL,
        Previous_Penalty REAL,
        Connection_Fee REAL,
        Total_Amount REAL,
        Due_Date TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_modified INTEGER DEFAULT 0
      )`,

      // Payment table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS payment (
        PaymentID INTEGER PRIMARY KEY,
        ConsumerID INTEGER,
        BillID INTEGER,
        PaymentDate TEXT,
        AmountPaid REAL,
        ORNumber TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_modified INTEGER DEFAULT 0
      )`,

      // Rate table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS rate (
        Rate_ID INTEGER PRIMARY KEY,
        Min_Rate REAL,
        Price_Per_Cubic REAL,
        Effective_Date TEXT
      )`,

      // Consumer_bill table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS consumer_bill (
        Consumer_Bill_ID INTEGER PRIMARY KEY,
        Consumer_ID INTEGER,
        Bill_ID INTEGER,
        Selected_Months TEXT,
        Total_Amount REAL,
        Created_Date TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Payment_allocation table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS payment_allocation (
        Payment_Allocation_ID INTEGER PRIMARY KEY,
        Payment_ID INTEGER,
        Bill_ID INTEGER,
        Amount_Applied REAL
      )`,

      // Ledger_entry table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS ledger_entry (
        Ledger_ID INTEGER PRIMARY KEY,
        Consumer_ID INTEGER,
        Transaction_Type TEXT,
        Reference_ID INTEGER,
        Amount REAL,
        Transaction_Date TEXT DEFAULT CURRENT_TIMESTAMP,
        Notes TEXT
      )`,

      // System_logs table - matches water_billing_system.sql
      `CREATE TABLE IF NOT EXISTS system_logs (
        Log_ID INTEGER PRIMARY KEY,
        Account_ID INTEGER,
        Role TEXT,
        Action TEXT,
        Timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Sync log table (mobile-specific)
      `CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT CHECK(action IN ('insert','update','delete')),
        timestamp INTEGER DEFAULT (strftime('%s','now')),
        synced INTEGER DEFAULT 0
      )`
    ];

    console.log('🔨 Creating database tables...');
    
    for (let i = 0; i < tables.length; i++) {
      try {
        await this.db.execAsync(tables[i]);
        console.log(`✅ Table ${i + 1}/${tables.length} created successfully`);
      } catch (error) {
        console.error(`❌ Failed to create table ${i + 1}:`, error);
        throw error;
      }
    }

    console.log('✅ All tables created successfully');

    // Seed reference data
    await this.seedReferenceData();
    
    // Seed sample data for testing
    await this.seedSampleData();
  }

  private async seedReferenceData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const rolesCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM roles');
    if (rolesCount && (rolesCount as any).count > 0) {
      console.log('Reference data already seeded');
      return;
    }

    try {
      // Seed roles data from water_billing_system.sql
      const rolesData = [
        { Role_ID: 1, Role_Name: 'Admin' },
        { Role_ID: 2, Role_Name: 'Meter Reader' },
        { Role_ID: 3, Role_Name: 'Billing Officer' },
        { Role_ID: 4, Role_Name: 'Cashier' },
        { Role_ID: 5, Role_Name: 'Consumer' }
      ];

      for (const role of rolesData) {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO roles (Role_ID, Role_Name) VALUES (?, ?)',
          [role.Role_ID, role.Role_Name]
        );
      }

      // Seed zones data from water_billing_system-1.sql (7 zones)
      const zonesData = [
        { Zone_ID: 1, Zone_Name: 'Zone 1' },
        { Zone_ID: 2, Zone_Name: 'Zone 2' },
        { Zone_ID: 3, Zone_Name: 'Zone 3' },
        { Zone_ID: 4, Zone_Name: 'Zone 4' },
        { Zone_ID: 5, Zone_Name: 'Zone 5' },
        { Zone_ID: 6, Zone_Name: 'Zone 6' },
        { Zone_ID: 7, Zone_Name: 'Zone 7' }
      ];

      for (const zone of zonesData) {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO zone (Zone_ID, Zone_Name) VALUES (?, ?)',
          [zone.Zone_ID, zone.Zone_Name]
        );
      }

      // Seed classifications data from water_billing_system.sql
      const classificationsData = [
        { Classification_ID: 1, Classification_Name: 'Residential' },
        { Classification_ID: 2, Classification_Name: 'Commercial' },
        { Classification_ID: 3, Classification_Name: 'Government' },
        { Classification_ID: 4, Classification_Name: 'Industrial' }
      ];

      for (const classification of classificationsData) {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO classification (Classification_ID, Classification_Name) VALUES (?, ?)',
          [classification.Classification_ID, classification.Classification_Name]
        );
      }

      console.log('✅ Reference data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding reference data:', error);
      throw error;
    }
  }

  // Method to seed sample data from water_billing_system.sql (for testing)
  async seedSampleData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Sample meter reader accounts only (mobile app is for meter readers only)
      const sampleAccounts = [
        { AccountID: 2, Username: 'joey.fernandez19', Password: '123456', Role_ID: 2, First_Name: 'Joey', Last_Name: 'Fernandez' },
        { AccountID: 7, Username: 'daniel.domingo56', Password: 'password123', Role_ID: 5, First_Name: 'Daniel', Last_Name: 'Domingo' },
        { AccountID: 8, Username: 'rowena.garcia58', Password: 'password123', Role_ID: 5, First_Name: 'Rowena', Last_Name: 'Garcia' },
        { AccountID: 9, Username: 'grace.domingo41', Password: 'password123', Role_ID: 5, First_Name: 'Grace', Last_Name: 'Domingo' },
        { AccountID: 10, Username: 'jenny.ramos25', Password: 'password123', Role_ID: 5, First_Name: 'Jenny', Last_Name: 'Ramos' },
        { AccountID: 11, Username: 'paulo.mendoza78', Password: 'password123', Role_ID: 5, First_Name: 'Paulo', Last_Name: 'Mendoza' }
      ];

      for (const account of sampleAccounts) {
        // Only insert if account doesn't exist (preserve existing data including password changes)
        await this.db.runAsync(
          'INSERT OR IGNORE INTO accounts (AccountID, Username, Password, Role_ID, First_Name, Last_Name) VALUES (?, ?, ?, ?, ?, ?)',
          [account.AccountID, account.Username, account.Password, account.Role_ID, account.First_Name, account.Last_Name]
        );
      }

      // Sample consumer data from water_billing_system-1.sql (first 20 consumers)
      const sampleConsumers = [
        { Consumer_ID: 1, First_Name: 'Daniel', Last_Name: 'Domingo', Address: 'Purok 2, Barangay 5', Zone_ID: 1, Classification_ID: 4, Login_ID: 7, Account_Number: 'ACC-001', Status: 'Active' },
        { Consumer_ID: 2, First_Name: 'Rowena', Last_Name: 'Garcia', Address: 'Purok 4, Barangay 3', Zone_ID: 3, Classification_ID: 1, Login_ID: 8, Account_Number: 'ACC-002', Status: 'Active' },
        { Consumer_ID: 3, First_Name: 'Grace', Last_Name: 'Domingo', Address: 'Purok 2, Barangay 2', Zone_ID: 2, Classification_ID: 3, Login_ID: 9, Account_Number: 'ACC-003', Status: 'Active' },
        { Consumer_ID: 4, First_Name: 'Jenny', Last_Name: 'Ramos', Address: 'Purok 1, Barangay 4', Zone_ID: 2, Classification_ID: 3, Login_ID: 10, Account_Number: 'ACC-004', Status: 'Active' },
        { Consumer_ID: 5, First_Name: 'Paulo', Last_Name: 'Mendoza', Address: 'Purok 1, Barangay 6', Zone_ID: 4, Classification_ID: 3, Login_ID: 11, Account_Number: 'ACC-005', Status: 'Active' },
        { Consumer_ID: 6, First_Name: 'Allan', Last_Name: 'Mendoza', Address: 'Purok 3, Barangay 9', Zone_ID: 5, Classification_ID: 3, Login_ID: 12, Account_Number: 'ACC-006', Status: 'Active' },
        { Consumer_ID: 7, First_Name: 'Jessa', Last_Name: 'Garcia', Address: 'Purok 2, Barangay 1', Zone_ID: 3, Classification_ID: 2, Login_ID: 13, Account_Number: 'ACC-007', Status: 'Active' },
        { Consumer_ID: 8, First_Name: 'Maria', Last_Name: 'Aquino', Address: 'Purok 4, Barangay 5', Zone_ID: 2, Classification_ID: 3, Login_ID: 14, Account_Number: 'ACC-008', Status: 'Active' },
        { Consumer_ID: 9, First_Name: 'Hazel', Last_Name: 'Bautista', Address: 'Purok 2, Barangay 10', Zone_ID: 2, Classification_ID: 2, Login_ID: 15, Account_Number: 'ACC-009', Status: 'Active' },
        { Consumer_ID: 10, First_Name: 'Grace', Last_Name: 'Bautista', Address: 'Purok 3, Barangay 11', Zone_ID: 1, Classification_ID: 3, Login_ID: 16, Account_Number: 'ACC-010', Status: 'Active' },
        { Consumer_ID: 11, First_Name: 'Arlene', Last_Name: 'Santos', Address: 'Purok 7, Barangay 6', Zone_ID: 1, Classification_ID: 4, Login_ID: 17, Account_Number: 'ACC-011', Status: 'Active' },
        { Consumer_ID: 12, First_Name: 'Grace', Last_Name: 'Torres', Address: 'Purok 3, Barangay 5', Zone_ID: 4, Classification_ID: 2, Login_ID: 18, Account_Number: 'ACC-012', Status: 'Active' },
        { Consumer_ID: 13, First_Name: 'Jenny', Last_Name: 'Gomez', Address: 'Purok 1, Barangay 6', Zone_ID: 1, Classification_ID: 3, Login_ID: 19, Account_Number: 'ACC-013', Status: 'Active' },
        { Consumer_ID: 14, First_Name: 'Jose', Last_Name: 'Domingo', Address: 'Purok 1, Barangay 11', Zone_ID: 2, Classification_ID: 3, Login_ID: 20, Account_Number: 'ACC-014', Status: 'Active' },
        { Consumer_ID: 15, First_Name: 'Daniel', Last_Name: 'Navarro', Address: 'Purok 7, Barangay 11', Zone_ID: 2, Classification_ID: 4, Login_ID: 21, Account_Number: 'ACC-015', Status: 'Active' },
        { Consumer_ID: 16, First_Name: 'Grace', Last_Name: 'Reyes', Address: 'Purok 1, Barangay 9', Zone_ID: 1, Classification_ID: 4, Login_ID: 22, Account_Number: 'ACC-016', Status: 'Active' },
        { Consumer_ID: 17, First_Name: 'Liza', Last_Name: 'Bautista', Address: 'Purok 5, Barangay 11', Zone_ID: 5, Classification_ID: 4, Login_ID: 23, Account_Number: 'ACC-017', Status: 'Active' },
        { Consumer_ID: 18, First_Name: 'Rowena', Last_Name: 'Torres', Address: 'Purok 4, Barangay 11', Zone_ID: 1, Classification_ID: 1, Login_ID: 24, Account_Number: 'ACC-018', Status: 'Active' },
        { Consumer_ID: 19, First_Name: 'Ramon', Last_Name: 'Garcia', Address: 'Purok 3, Barangay 10', Zone_ID: 2, Classification_ID: 3, Login_ID: 25, Account_Number: 'ACC-019', Status: 'Active' },
        { Consumer_ID: 20, First_Name: 'Liza', Last_Name: 'Garcia', Address: 'Purok 7, Barangay 4', Zone_ID: 2, Classification_ID: 3, Login_ID: 26, Account_Number: 'ACC-020', Status: 'Active' }
      ];

      for (const consumer of sampleConsumers) {
        // Only insert if consumer doesn't exist (preserve existing data including profile changes)
        await this.db.runAsync(
          'INSERT OR IGNORE INTO consumer (Consumer_ID, First_Name, Last_Name, Address, Zone_ID, Classification_ID, Login_ID, Account_Number, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [consumer.Consumer_ID, consumer.First_Name, consumer.Last_Name, consumer.Address, consumer.Zone_ID, consumer.Classification_ID, consumer.Login_ID, consumer.Account_Number, consumer.Status]
        );
      }

      // Sample meter data (first 5 from SQL file)
      const sampleMeters = [
        { Meter_ID: 1, Consumer_ID: 1, Meter_Serial_Number: 'MS-30251', Meter_Size: '1/2 inch' },
        { Meter_ID: 2, Consumer_ID: 2, Meter_Serial_Number: 'MS-66392', Meter_Size: '3/4 inch' },
        { Meter_ID: 3, Consumer_ID: 3, Meter_Serial_Number: 'MS-36909', Meter_Size: '1/2 inch' },
        { Meter_ID: 4, Consumer_ID: 4, Meter_Serial_Number: 'MS-27354', Meter_Size: '3/4 inch' },
        { Meter_ID: 5, Consumer_ID: 5, Meter_Serial_Number: 'MS-53429', Meter_Size: '3/4 inch' }
      ];

      for (const meter of sampleMeters) {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO meter (Meter_ID, Consumer_ID, Meter_Serial_Number, Meter_Size) VALUES (?, ?, ?, ?)',
          [meter.Meter_ID, meter.Consumer_ID, meter.Meter_Serial_Number, meter.Meter_Size]
        );
      }

      console.log('✅ Sample data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding sample data:', error);
      throw error;
    }
  }

  // Authentication operations
  async authenticateUser(username: string, password: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        a.*,
        r.Role_Name,
        c.Consumer_ID,
        c.Address,
        z.Zone_Name,
        cl.Classification_Name,
        m.Meter_Serial_Number,
        m.Meter_Size
      FROM accounts a
      LEFT JOIN roles r ON a.Role_ID = r.Role_ID
      LEFT JOIN consumer c ON a.AccountID = c.Login_ID
      LEFT JOIN zone z ON c.Zone_ID = z.Zone_ID
      LEFT JOIN classification cl ON c.Classification_ID = cl.Classification_ID
      LEFT JOIN meter m ON c.Consumer_ID = m.Consumer_ID
      WHERE a.Username = ? AND a.Password = ?
    `, [username, password]);

    return results.length > 0 ? results[0] : null;
  }

  // Update user password
  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.runAsync(
        'UPDATE accounts SET Password = ? WHERE AccountID = ?',
        [newPassword, userId]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  // Update user profile information
  async updateUserProfile(accountId: number, profileData: { name?: string, email?: string, phone?: string }): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Split name into first and last name
      const nameParts = profileData.name ? profileData.name.trim().split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update consumer table (where personal info is stored)
      const result = await this.db.runAsync(`
        UPDATE consumer 
        SET First_Name = ?, Last_Name = ?, Contact_Number = ?
        WHERE Login_ID = ?
      `, [firstName, lastName, profileData.phone || null, accountId]);

      return result.changes > 0;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Get updated user data after profile changes
  async getUserData(accountId: number): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync(`
        SELECT 
          a.AccountID,
          a.Username,
          a.Password,
          a.Role_ID,
          r.Role_Name,
          c.Consumer_ID,
          c.First_Name,
          c.Last_Name,
          c.Address,
          c.Zone_ID,
          c.Contact_Number,
          z.Zone_Name,
          cl.Classification_Name,
          m.Meter_Serial_Number,
          m.Meter_Size
        FROM accounts a
        LEFT JOIN roles r ON a.Role_ID = r.Role_ID
        LEFT JOIN consumer c ON a.AccountID = c.Login_ID
        LEFT JOIN zone z ON c.Zone_ID = z.Zone_ID
        LEFT JOIN classification cl ON c.Classification_ID = cl.Classification_ID
        LEFT JOIN meter m ON c.Consumer_ID = m.Consumer_ID
        WHERE a.AccountID = ?
      `, [accountId]);

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Consumer operations
  async getAllConsumers(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        c.Consumer_ID,
        c.First_Name,
        c.Last_Name,
        c.Address,
        c.Zone_ID,
        z.Zone_Name,
        c.Classification_ID,
        cl.Classification_Name,
        m.Meter_Serial_Number,
        m.Meter_Size,
        r.Previous_Reading,
        r.Current_Reading
      FROM consumer c
      LEFT JOIN zone z ON c.Zone_ID = z.Zone_ID
      LEFT JOIN classification cl ON c.Classification_ID = cl.Classification_ID
      LEFT JOIN meter m ON c.Consumer_ID = m.Consumer_ID
      LEFT JOIN (
        SELECT Consumer_ID, Previous_Reading, Current_Reading,
               ROW_NUMBER() OVER (PARTITION BY Consumer_ID ORDER BY Created_Date DESC) as rn
        FROM meterreadings
      ) r ON c.Consumer_ID = r.Consumer_ID AND r.rn = 1
      ORDER BY c.Zone_ID, c.Consumer_ID
    `);

    return results;
  }

  async getConsumerProfile(loginId: number): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        c.*,
        a.Username,
        a.Role_ID,
        m.Meter_Serial_Number,
        m.Meter_Size,
        z.Zone_Name,
        cl.Classification_Name
      FROM consumer c
      LEFT JOIN accounts a ON c.Login_ID = a.AccountID
      LEFT JOIN meter m ON c.Consumer_ID = m.Consumer_ID
      LEFT JOIN zone z ON c.Zone_ID = z.Zone_ID
      LEFT JOIN classification cl ON c.Classification_ID = cl.Classification_ID
      WHERE c.Login_ID = ?
    `, [loginId]);

    return results.length > 0 ? results[0] : null;
  }

  // Bills operations
  async getConsumerBills(consumerId: number, limit: number = 12): Promise<Bill[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM bill 
      WHERE Consumer_ID = ? 
      ORDER BY Due_Date DESC 
      LIMIT ?
    `, [consumerId, limit]);

    return results as Bill[];
  }

  // Readings operations (for meter readers)
  async getUnsyncedReadings(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM meterreadings 
      WHERE sync_status = 'pending' OR sync_status IS NULL
      ORDER BY Created_Date DESC
    `);

    return results;
  }

  async markReadingAsSynced(readingId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      UPDATE meterreadings 
      SET sync_status = 'synced', last_modified = ? 
      WHERE Reading_ID = ?
    `, [Date.now(), readingId]);

    console.log(`✅ Reading ${readingId} marked as synced`);
  }

  async debugSyncStatus(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const allReadings = await this.db.getAllAsync(`
      SELECT Reading_ID, Consumer_ID, Current_Reading, sync_status, Created_Date 
      FROM meterreadings 
      ORDER BY Created_Date DESC
    `);

    console.log('📊 Debug: All readings sync status:');
    allReadings.forEach((reading: any) => {
      console.log(`Reading ${reading.Reading_ID}: Consumer ${reading.Consumer_ID}, Reading ${reading.Current_Reading}, Status: ${reading.sync_status || 'NULL'}, Date: ${reading.Created_Date}`);
    });

    const pendingCount = allReadings.filter((r: any) => r.sync_status === 'pending' || r.sync_status === null).length;
    const syncedCount = allReadings.filter((r: any) => r.sync_status === 'synced').length;
    
    console.log(`📈 Summary: ${pendingCount} pending, ${syncedCount} synced, ${allReadings.length} total`);
  }

  async resetAllSyncStatus(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Reset all readings to pending status for testing
    await this.db.runAsync(`
      UPDATE meterreadings 
      SET sync_status = 'pending', last_modified = ?
    `, [Date.now()]);

    console.log('🔄 All reading sync statuses reset to pending');
  }

  async insertReading(reading: any): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const timestamp = Date.now();
    
    const result = await this.db.runAsync(`
      INSERT INTO meterreadings (
        Route_ID, Consumer_ID, Meter_ID, Meter_Reader_ID,
        Created_Date, Reading_Status, Previous_Reading, Current_Reading,
        Consumption, Notes, Status, Reading_Date, sync_status, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reading.Route_ID,
      reading.Consumer_ID,
      reading.Meter_ID,
      reading.Meter_Reader_ID,
      reading.Created_Date,
      reading.Reading_Status,
      reading.Previous_Reading,
      reading.Current_Reading,
      reading.Consumption || (reading.Current_Reading - reading.Previous_Reading),
      reading.Notes || '',
      reading.Status || 'Completed',
      reading.Reading_Date || new Date().toISOString().split('T')[0],
      'pending', // Set sync_status to pending for new readings
      timestamp  // Set last_modified timestamp
    ]);

    // Log for sync
    await this.logSync('meterreadings', result.lastInsertRowId, 'insert');
    
    console.log('Reading inserted with ID:', result.lastInsertRowId);
    
    return result.lastInsertRowId;
  }

  // Payments operations
  async getConsumerPayments(consumerId: number): Promise<Payment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM payment 
      WHERE ConsumerID = ? 
      ORDER BY PaymentDate DESC
    `, [consumerId]);

    return results as Payment[];
  }

  // Sync operations
  async getPendingSyncData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM sync_log WHERE synced = 0 ORDER BY timestamp ASC
    `);

    return results;
  }

  async markSynced(syncLogId: number, serverId?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      UPDATE sync_log SET synced = 1 WHERE id = ?
    `, [syncLogId]);

    // Update server_id if provided (for new records)
    if (serverId) {
      const syncItems = await this.db.getAllAsync(`
        SELECT * FROM sync_log WHERE id = ?
      `, [syncLogId]);
      
      if (syncItems.length > 0) {
        const item = syncItems[0] as any;
        await this.db.runAsync(`
          UPDATE ${item.table_name} SET sync_status = 'synced' 
          WHERE ${item.table_name === 'meterreadings' ? 'Reading_ID' : 'id'} = ?
        `, [item.record_id]);
      }
    }
  }

  private async logSync(tableName: string, recordId: number, action: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      INSERT INTO sync_log (table_name, record_id, action) 
      VALUES (?, ?, ?)
    `, [tableName, recordId, action]);
  }

  // Get current rate
  async getCurrentRate(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT * FROM rate ORDER BY Effective_Date DESC LIMIT 1
    `);

    return result;
  }

  // Insert bill
  async insertBill(billData: any): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(`
      INSERT INTO bill (
        Consumer_ID, Reading_ID, Billing_Officer_ID, Billing_Month,
        Amount_Due, Penalty, Previous_Balance, Previous_Penalty,
        Connection_Fee, Total_Amount, Due_Date, Payment_Status,
        sync_status, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      billData.Consumer_ID,
      billData.Reading_ID,
      billData.Billing_Officer_ID,
      billData.Billing_Month,
      billData.Amount_Due,
      billData.Penalty || 0,
      billData.Previous_Balance || 0,
      billData.Previous_Penalty || 0,
      billData.Connection_Fee || 0,
      billData.Total_Amount,
      billData.Due_Date,
      billData.Payment_Status || 'Unpaid',
      'synced',
      Date.now()
    ]);

    // Log for sync
    await this.logSync('bill', result.lastInsertRowId, 'insert');
    
    console.log('Bill inserted with ID:', result.lastInsertRowId);
    
    return result.lastInsertRowId;
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('🗑️ Clearing all database data...');
    
    // Drop and recreate all tables to fix schema issues
    await this.db.execAsync(`
      DROP TABLE IF EXISTS meterreadings;
      DROP TABLE IF EXISTS consumer;
      DROP TABLE IF EXISTS accounts;
      DROP TABLE IF EXISTS zone;
      DROP TABLE IF EXISTS classification;
      DROP TABLE IF EXISTS meter;
      DROP TABLE IF EXISTS bill;
      DROP TABLE IF EXISTS payment;
      DROP TABLE IF EXISTS route;
      DROP TABLE IF EXISTS sync_log;
      DROP TABLE IF EXISTS roles;
      DROP TABLE IF EXISTS consumer_bill;
      DROP TABLE IF EXISTS payment_allocation;
      DROP TABLE IF EXISTS ledger_entry;
      DROP TABLE IF EXISTS system_logs;
      DROP TABLE IF EXISTS rate;
    `);
    
    console.log('✅ All tables dropped');
    
    // Recreate tables with correct schema
    await this.createTables();
  }

  async forceReset(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('🔄 Force resetting database...');
    await this.clearAllData();
    console.log('✅ Database force reset complete');
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Create singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
