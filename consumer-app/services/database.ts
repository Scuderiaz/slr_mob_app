// SQLite Database Service for Consumer Mobile App
// Uses the same database schema as the Meter Reader app for data sharing
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
      // Use the same database name as meter-reader-app for shared data
      this.db = await SQLite.openDatabaseAsync('water_billing_system-1.db');
      console.log('✅ Consumer App: Database opened successfully');
      
      // Check if migration is needed first
      await this.checkAndMigrateSchema();
      
      await this.createTables();
      console.log('✅ Consumer App: Database initialized successfully');
    } catch (error) {
      console.error('❌ Consumer App: Database initialization failed:', error);
      throw error;
    }
  }

  private async checkAndMigrateSchema(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if bill table exists
      const tables = await this.db.getAllAsync(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='bill'
      `);
      
      if (tables.length === 0) {
        console.log('📝 Consumer App: Bill table not found - database needs initialization');
        return; // Let createTables handle it
      }

      // Check if Payment_Status column exists in bill table
      const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(bill)`);
      const hasPaymentStatus = tableInfo.some((col: any) => col.name === 'Payment_Status');
      
      if (!hasPaymentStatus) {
        console.log('🔄 Consumer App: Schema migration needed - rebuilding database...');
        await this.clearAllData();
        return;
      }

      console.log('✅ Consumer App: Database schema is up to date');
    } catch (error) {
      console.error('❌ Consumer App: Schema check failed:', error);
      // If schema check fails, rebuild database
      await this.clearAllData();
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
        Payment_Status TEXT DEFAULT 'Unpaid',
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

    console.log('🔨 Consumer App: Creating database tables...');
    
    for (let i = 0; i < tables.length; i++) {
      try {
        await this.db.execAsync(tables[i]);
      } catch (error) {
        console.error(`❌ Failed to create table ${i + 1}:`, error);
        throw error;
      }
    }

    console.log('✅ Consumer App: All tables created successfully');

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
      // Seed roles data
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

      // Seed zones data (7 zones)
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

      // Seed classifications data
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

      // Seed rate data
      await this.db.runAsync(
        'INSERT OR REPLACE INTO rate (Rate_ID, Min_Rate, Price_Per_Cubic, Effective_Date) VALUES (?, ?, ?, ?)',
        [1, 82.50, 15.00, '2024-01-01']
      );

      console.log('✅ Consumer App: Reference data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding reference data:', error);
      throw error;
    }
  }

  async seedSampleData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if consumer accounts already exist
      const accountsCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM accounts WHERE Role_ID = 5');
      if (accountsCount && (accountsCount as any).count > 0) {
        console.log('Sample data already seeded');
        return;
      }

      // Sample consumer accounts (Role_ID: 5 = Consumer)
      const sampleAccounts = [
        { AccountID: 7, Username: 'daniel.domingo56', Password: 'password123', Role_ID: 5, First_Name: 'Daniel', Last_Name: 'Domingo' },
        { AccountID: 8, Username: 'rowena.garcia58', Password: 'password123', Role_ID: 5, First_Name: 'Rowena', Last_Name: 'Garcia' },
        { AccountID: 9, Username: 'grace.domingo41', Password: 'password123', Role_ID: 5, First_Name: 'Grace', Last_Name: 'Domingo' },
        { AccountID: 10, Username: 'jenny.ramos25', Password: 'password123', Role_ID: 5, First_Name: 'Jenny', Last_Name: 'Ramos' },
        { AccountID: 11, Username: 'paulo.mendoza78', Password: 'password123', Role_ID: 5, First_Name: 'Paulo', Last_Name: 'Mendoza' },
        { AccountID: 12, Username: 'allan.mendoza33', Password: 'password123', Role_ID: 5, First_Name: 'Allan', Last_Name: 'Mendoza' },
        { AccountID: 13, Username: 'jessa.garcia44', Password: 'password123', Role_ID: 5, First_Name: 'Jessa', Last_Name: 'Garcia' },
        { AccountID: 14, Username: 'maria.aquino55', Password: 'password123', Role_ID: 5, First_Name: 'Maria', Last_Name: 'Aquino' }
      ];

      for (const account of sampleAccounts) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO accounts (AccountID, Username, Password, Role_ID, First_Name, Last_Name) VALUES (?, ?, ?, ?, ?, ?)',
          [account.AccountID, account.Username, account.Password, account.Role_ID, account.First_Name, account.Last_Name]
        );
      }

      // Sample consumer data
      const sampleConsumers = [
        { Consumer_ID: 1, First_Name: 'Daniel', Last_Name: 'Domingo', Address: 'Purok 2, Barangay 5', Zone_ID: 1, Classification_ID: 1, Login_ID: 7, Account_Number: 'ACC-001', Meter_Number: 'MS-30251', Status: 'Active', Contact_Number: '09171234567', Connection_Date: '2020-01-15' },
        { Consumer_ID: 2, First_Name: 'Rowena', Last_Name: 'Garcia', Address: 'Purok 4, Barangay 3', Zone_ID: 3, Classification_ID: 1, Login_ID: 8, Account_Number: 'ACC-002', Meter_Number: 'MS-66392', Status: 'Active', Contact_Number: '09181234567', Connection_Date: '2019-06-20' },
        { Consumer_ID: 3, First_Name: 'Grace', Last_Name: 'Domingo', Address: 'Purok 2, Barangay 2', Zone_ID: 2, Classification_ID: 1, Login_ID: 9, Account_Number: 'ACC-003', Meter_Number: 'MS-36909', Status: 'Active', Contact_Number: '09191234567', Connection_Date: '2021-03-10' },
        { Consumer_ID: 4, First_Name: 'Jenny', Last_Name: 'Ramos', Address: 'Purok 1, Barangay 4', Zone_ID: 2, Classification_ID: 1, Login_ID: 10, Account_Number: 'ACC-004', Meter_Number: 'MS-27354', Status: 'Active', Contact_Number: '09201234567', Connection_Date: '2018-11-05' },
        { Consumer_ID: 5, First_Name: 'Paulo', Last_Name: 'Mendoza', Address: 'Purok 1, Barangay 6', Zone_ID: 4, Classification_ID: 2, Login_ID: 11, Account_Number: 'ACC-005', Meter_Number: 'MS-53429', Status: 'Active', Contact_Number: '09211234567', Connection_Date: '2022-02-28' },
        { Consumer_ID: 6, First_Name: 'Allan', Last_Name: 'Mendoza', Address: 'Purok 3, Barangay 9', Zone_ID: 5, Classification_ID: 1, Login_ID: 12, Account_Number: 'ACC-006', Meter_Number: 'MS-44521', Status: 'Active', Contact_Number: '09221234567', Connection_Date: '2020-07-15' },
        { Consumer_ID: 7, First_Name: 'Jessa', Last_Name: 'Garcia', Address: 'Purok 2, Barangay 1', Zone_ID: 3, Classification_ID: 2, Login_ID: 13, Account_Number: 'ACC-007', Meter_Number: 'MS-55632', Status: 'Active', Contact_Number: '09231234567', Connection_Date: '2019-09-22' },
        { Consumer_ID: 8, First_Name: 'Maria', Last_Name: 'Aquino', Address: 'Purok 4, Barangay 5', Zone_ID: 2, Classification_ID: 1, Login_ID: 14, Account_Number: 'ACC-008', Meter_Number: 'MS-66743', Status: 'Active', Contact_Number: '09241234567', Connection_Date: '2021-05-18' }
      ];

      for (const consumer of sampleConsumers) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO consumer (Consumer_ID, First_Name, Last_Name, Address, Zone_ID, Classification_ID, Login_ID, Account_Number, Meter_Number, Status, Contact_Number, Connection_Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [consumer.Consumer_ID, consumer.First_Name, consumer.Last_Name, consumer.Address, consumer.Zone_ID, consumer.Classification_ID, consumer.Login_ID, consumer.Account_Number, consumer.Meter_Number, consumer.Status, consumer.Contact_Number, consumer.Connection_Date]
        );
      }

      // Sample meter data
      const sampleMeters = [
        { Meter_ID: 1, Consumer_ID: 1, Meter_Serial_Number: 'MS-30251', Meter_Size: '1/2 inch' },
        { Meter_ID: 2, Consumer_ID: 2, Meter_Serial_Number: 'MS-66392', Meter_Size: '3/4 inch' },
        { Meter_ID: 3, Consumer_ID: 3, Meter_Serial_Number: 'MS-36909', Meter_Size: '1/2 inch' },
        { Meter_ID: 4, Consumer_ID: 4, Meter_Serial_Number: 'MS-27354', Meter_Size: '3/4 inch' },
        { Meter_ID: 5, Consumer_ID: 5, Meter_Serial_Number: 'MS-53429', Meter_Size: '3/4 inch' },
        { Meter_ID: 6, Consumer_ID: 6, Meter_Serial_Number: 'MS-44521', Meter_Size: '1/2 inch' },
        { Meter_ID: 7, Consumer_ID: 7, Meter_Serial_Number: 'MS-55632', Meter_Size: '1/2 inch' },
        { Meter_ID: 8, Consumer_ID: 8, Meter_Serial_Number: 'MS-66743', Meter_Size: '1/2 inch' }
      ];

      for (const meter of sampleMeters) {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO meter (Meter_ID, Consumer_ID, Meter_Serial_Number, Meter_Size) VALUES (?, ?, ?, ?)',
          [meter.Meter_ID, meter.Consumer_ID, meter.Meter_Serial_Number, meter.Meter_Size]
        );
      }

      // Sample bills for consumers
      const sampleBills = [
        { Bill_ID: 1, Consumer_ID: 1, Reading_ID: 1, Billing_Month: 'November 2025', Amount_Due: 82.50, Penalty: 0, Previous_Balance: 165.00, Previous_Penalty: 0, Connection_Fee: 0, Total_Amount: 247.50, Due_Date: '2025-12-15', Payment_Status: 'Unpaid' },
        { Bill_ID: 2, Consumer_ID: 1, Reading_ID: 2, Billing_Month: 'October 2025', Amount_Due: 82.50, Penalty: 0, Previous_Balance: 82.50, Previous_Penalty: 0, Connection_Fee: 0, Total_Amount: 165.00, Due_Date: '2025-11-15', Payment_Status: 'Unpaid' },
        { Bill_ID: 3, Consumer_ID: 1, Reading_ID: 3, Billing_Month: 'September 2025', Amount_Due: 82.50, Penalty: 0, Previous_Balance: 0, Previous_Penalty: 0, Connection_Fee: 0, Total_Amount: 82.50, Due_Date: '2025-10-15', Payment_Status: 'Paid' },
        { Bill_ID: 4, Consumer_ID: 2, Reading_ID: 4, Billing_Month: 'November 2025', Amount_Due: 97.50, Penalty: 0, Previous_Balance: 0, Previous_Penalty: 0, Connection_Fee: 0, Total_Amount: 97.50, Due_Date: '2025-12-15', Payment_Status: 'Unpaid' },
        { Bill_ID: 5, Consumer_ID: 3, Reading_ID: 5, Billing_Month: 'November 2025', Amount_Due: 112.50, Penalty: 0, Previous_Balance: 0, Previous_Penalty: 0, Connection_Fee: 0, Total_Amount: 112.50, Due_Date: '2025-12-15', Payment_Status: 'Unpaid' }
      ];

      for (const bill of sampleBills) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO bill (Bill_ID, Consumer_ID, Reading_ID, Billing_Month, Amount_Due, Penalty, Previous_Balance, Previous_Penalty, Connection_Fee, Total_Amount, Due_Date, Payment_Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [bill.Bill_ID, bill.Consumer_ID, bill.Reading_ID, bill.Billing_Month, bill.Amount_Due, bill.Penalty, bill.Previous_Balance, bill.Previous_Penalty, bill.Connection_Fee, bill.Total_Amount, bill.Due_Date, bill.Payment_Status]
        );
      }

      // Sample meter readings
      const sampleReadings = [
        { Reading_ID: 1, Consumer_ID: 1, Meter_ID: 1, Previous_Reading: 1240, Current_Reading: 1242, Consumption: 2, Reading_Date: '2025-11-13', Status: 'Completed', sync_status: 'synced' },
        { Reading_ID: 2, Consumer_ID: 1, Meter_ID: 1, Previous_Reading: 1238, Current_Reading: 1240, Consumption: 2, Reading_Date: '2025-10-13', Status: 'Completed', sync_status: 'synced' },
        { Reading_ID: 3, Consumer_ID: 1, Meter_ID: 1, Previous_Reading: 1235, Current_Reading: 1238, Consumption: 3, Reading_Date: '2025-09-13', Status: 'Completed', sync_status: 'synced' },
        { Reading_ID: 4, Consumer_ID: 2, Meter_ID: 2, Previous_Reading: 856, Current_Reading: 859, Consumption: 3, Reading_Date: '2025-11-13', Status: 'Completed', sync_status: 'synced' },
        { Reading_ID: 5, Consumer_ID: 3, Meter_ID: 3, Previous_Reading: 432, Current_Reading: 436, Consumption: 4, Reading_Date: '2025-11-13', Status: 'Completed', sync_status: 'synced' }
      ];

      for (const reading of sampleReadings) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO meterreadings (Reading_ID, Consumer_ID, Meter_ID, Previous_Reading, Current_Reading, Consumption, Reading_Date, Status, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [reading.Reading_ID, reading.Consumer_ID, reading.Meter_ID, reading.Previous_Reading, reading.Current_Reading, reading.Consumption, reading.Reading_Date, reading.Status, reading.sync_status]
        );
      }

      // Sample payments
      const samplePayments = [
        { PaymentID: 1, ConsumerID: 1, BillID: 3, PaymentDate: '2025-10-10', AmountPaid: 82.50, ORNumber: 'OR-2025-001' }
      ];

      for (const payment of samplePayments) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO payment (PaymentID, ConsumerID, BillID, PaymentDate, AmountPaid, ORNumber) VALUES (?, ?, ?, ?, ?, ?)',
          [payment.PaymentID, payment.ConsumerID, payment.BillID, payment.PaymentDate, payment.AmountPaid, payment.ORNumber]
        );
      }

      console.log('✅ Consumer App: Sample data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding sample data:', error);
      throw error;
    }
  }

  // Authentication - for consumer login
  async authenticateConsumer(username: string, password: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        a.AccountID,
        a.Username,
        a.Role_ID,
        a.First_Name as Account_First_Name,
        a.Last_Name as Account_Last_Name,
        r.Role_Name,
        c.Consumer_ID,
        c.First_Name,
        c.Last_Name,
        c.Address,
        c.Zone_ID,
        c.Account_Number,
        c.Meter_Number,
        c.Status,
        c.Contact_Number,
        c.Connection_Date,
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
      WHERE a.Username = ? AND a.Password = ? AND a.Role_ID = 5
    `, [username, password]);

    if (results.length > 0) {
      console.log('✅ Consumer authenticated:', results[0]);
      return results[0];
    }
    
    return null;
  }

  // Get consumer profile by Login_ID
  async getConsumerProfile(loginId: number): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        c.*,
        a.Username,
        a.Role_ID,
        r.Role_Name,
        m.Meter_Serial_Number,
        m.Meter_Size,
        z.Zone_Name,
        cl.Classification_Name
      FROM consumer c
      LEFT JOIN accounts a ON c.Login_ID = a.AccountID
      LEFT JOIN roles r ON a.Role_ID = r.Role_ID
      LEFT JOIN meter m ON c.Consumer_ID = m.Consumer_ID
      LEFT JOIN zone z ON c.Zone_ID = z.Zone_ID
      LEFT JOIN classification cl ON c.Classification_ID = cl.Classification_ID
      WHERE c.Login_ID = ?
    `, [loginId]);

    return results.length > 0 ? results[0] : null;
  }

  // Get consumer bills
  async getConsumerBills(consumerId: number, limit: number = 12): Promise<Bill[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        b.*,
        r.Previous_Reading,
        r.Current_Reading,
        r.Consumption,
        r.Reading_Date
      FROM bill b
      LEFT JOIN meterreadings r ON b.Reading_ID = r.Reading_ID
      WHERE b.Consumer_ID = ? 
      ORDER BY b.Due_Date DESC 
      LIMIT ?
    `, [consumerId, limit]);

    return results as Bill[];
  }

  // Get latest bill for consumer
  async getLatestBill(consumerId: number): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        b.*,
        r.Previous_Reading,
        r.Current_Reading,
        r.Consumption,
        r.Reading_Date
      FROM bill b
      LEFT JOIN meterreadings r ON b.Reading_ID = r.Reading_ID
      WHERE b.Consumer_ID = ? 
      ORDER BY b.Due_Date DESC 
      LIMIT 1
    `, [consumerId]);

    return results.length > 0 ? results[0] : null;
  }

  // Get total amount due for consumer
  async getTotalAmountDue(consumerId: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT COALESCE(SUM(Total_Amount), 0) as total
      FROM bill 
      WHERE Consumer_ID = ? AND Payment_Status = 'Unpaid'
    `, [consumerId]);

    return (result as any)?.total || 0;
  }

  // Get unpaid bills count
  async getUnpaidBillsCount(consumerId: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT COUNT(*) as count
      FROM bill 
      WHERE Consumer_ID = ? AND Payment_Status = 'Unpaid'
    `, [consumerId]);

    return (result as any)?.count || 0;
  }

  // Get consumer payments
  async getConsumerPayments(consumerId: number): Promise<Payment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        p.*,
        b.Billing_Month,
        b.Total_Amount as Bill_Amount
      FROM payment p
      LEFT JOIN bill b ON p.BillID = b.Bill_ID
      WHERE p.ConsumerID = ? 
      ORDER BY p.PaymentDate DESC
    `, [consumerId]);

    return results as Payment[];
  }

  // Get latest reading for consumer
  async getLatestReading(consumerId: number): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM meterreadings 
      WHERE Consumer_ID = ? 
      ORDER BY Reading_Date DESC, Created_Date DESC 
      LIMIT 1
    `, [consumerId]);

    return results.length > 0 ? results[0] : null;
  }

  // Get consumption history
  async getConsumptionHistory(consumerId: number, months: number = 6): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT 
        r.Reading_Date,
        r.Consumption,
        b.Billing_Month,
        b.Amount_Due
      FROM meterreadings r
      LEFT JOIN bill b ON r.Reading_ID = b.Reading_ID
      WHERE r.Consumer_ID = ?
      ORDER BY r.Reading_Date DESC
      LIMIT ?
    `, [consumerId, months]);

    return results;
  }

  // Get rate information
  async getCurrentRate(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT * FROM rate ORDER BY Effective_Date DESC LIMIT 1
    `);

    return result;
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('🗑️ Clearing all database data...');
    
    // Drop all tables to reset schema
    await this.db.execAsync(`
      DROP TABLE IF EXISTS meterreadings;
      DROP TABLE IF EXISTS consumer;
      DROP TABLE IF EXISTS accounts;
      DROP TABLE IF EXISTS zone;
      DROP TABLE IF EXISTS classification;
      DROP TABLE IF EXISTS meter;
      DROP TABLE IF EXISTS bill;
      DROP TABLE IF EXISTS payment;
      DROP TABLE IF EXISTS sync_log;
      DROP TABLE IF EXISTS roles;
      DROP TABLE IF EXISTS rate;
    `);
    
    console.log('✅ All tables dropped');
    
    // Recreate tables
    await this.createTables();
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
