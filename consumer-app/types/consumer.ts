// Consumer Data Types for SLR Water System - Updated for actual DB schema
// Matches the meter-reader-app schema for data sharing

export interface Account {
  AccountID: number;
  Username: string;
  Password: string;
  Role_ID: number;
  First_Name?: string;
  Last_Name?: string;
  sync_status?: string;
  last_modified?: number;
}

export interface Role {
  Role_ID: number;
  Role_Name: string; // 'Admin', 'Meter Reader', 'Billing Officer', 'Cashier', 'Consumer'
}

export interface Consumer {
  Consumer_ID: number;
  First_Name: string;
  Last_Name: string;
  Address: string;
  Zone_ID: number;
  Classification_ID: number;
  Login_ID: number;
  Account_Number?: string;
  Meter_Number?: string;
  Status?: string;
  Contact_Number?: string;
  Connection_Date?: string;
  sync_status?: string;
  last_modified?: number;
}

export interface Zone {
  Zone_ID: number;
  Zone_Name: string;
}

export interface Classification {
  Classification_ID: number;
  Classification_Name: string;
}

export interface Meter {
  Meter_ID: number;
  Consumer_ID: number;
  Meter_Serial_Number: string;
  Meter_Size: string;
  sync_status?: string;
  last_modified?: number;
}

export interface Reading {
  Reading_ID: number;
  Route_ID?: number;
  Consumer_ID: number;
  Meter_ID?: number;
  Meter_Reader_ID?: number;
  Created_Date?: string;
  Reading_Status?: 'Normal' | 'Locked' | 'Malfunction' | 'Estimated';
  Previous_Reading: number;
  Current_Reading: number;
  Consumption?: number;
  Notes?: string;
  Status?: string;
  Reading_Date?: string;
  sync_status?: string;
  last_modified?: number;
}

export interface Bill {
  Bill_ID: number;
  Consumer_ID: number;
  Reading_ID?: number;
  Billing_Officer_ID?: number;
  Billing_Month: string;
  Amount_Due: number;
  Penalty: number;
  Previous_Balance: number;
  Previous_Penalty: number;
  Connection_Fee: number;
  Total_Amount: number;
  Due_Date: string;
  Payment_Status?: 'Paid' | 'Unpaid';
  sync_status?: string;
  last_modified?: number;
  // Joined fields from reading
  Previous_Reading?: number;
  Current_Reading?: number;
  Consumption?: number;
  Reading_Date?: string;
}

export interface Payment {
  PaymentID: number;
  ConsumerID: number;
  BillID: number;
  PaymentDate: string;
  AmountPaid: number;
  ORNumber: string;
  sync_status?: string;
  last_modified?: number;
  // Joined fields from bill
  Billing_Month?: string;
  Bill_Amount?: number;
}

export interface Rate {
  Rate_ID: number;
  Min_Rate: number;
  Price_Per_Cubic: number;
  Effective_Date: string;
}

// User type for authenticated consumer
export interface User {
  AccountID: number;
  Username: string;
  Role_ID: number;
  Role_Name: string;
  Consumer_ID: number;
  First_Name: string;
  Last_Name: string;
  Address: string;
  Zone_ID: number;
  Zone_Name: string;
  Account_Number: string;
  Meter_Number: string;
  Meter_Serial_Number: string;
  Meter_Size: string;
  Status: string;
  Contact_Number: string;
  Connection_Date: string;
  Classification_Name: string;
}

// Combined interfaces for mobile app use
export interface ConsumerProfile {
  consumer: Consumer;
  account: Account;
  meter: Meter;
  zone: Zone;
  classification: Classification;
}

export interface ConsumerDashboard {
  profile: ConsumerProfile;
  currentBill: Bill | null;
  latestReading: Reading | null;
  recentPayments: Payment[];
  totalAmountDue: number;
  unpaidBillsCount: number;
  consumptionHistory: {
    month: string;
    consumption: number;
    amount: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: string;
  profile: ConsumerProfile;
}
