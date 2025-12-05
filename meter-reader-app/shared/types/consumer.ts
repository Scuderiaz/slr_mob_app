// Consumer Data Types for SLR Water System - Updated for actual DB schema

export interface Account {
  AccountID: number;
  Username: string;
  Password: string;
  Role_ID: number;
}

export interface Role {
  Role_ID: number;
  Role_Name: string; // 'Consumer', 'Meter Reader', 'Billing Officer', 'Treasurer', 'Assessor'
}

export interface Consumer {
  Consumer_ID: number;
  First_Name: string;
  Last_Name: string;
  Address: string;
  Zone_ID: number;
  Classification_ID: number;
  Login_ID: number;
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
}

export interface ConsumerAccount {
  accountNo: string;
  meterNo: string;
  fullName: string;
  address: string;
  zone: string;
  status: 'active' | 'inactive' | 'suspended';
  connectionDate: string;
  lastReadingDate: string;
  currentBalance: number;
  totalConsumption: number;
}

export interface Reading {
  Reading_ID: number;
  Route_ID: number;
  Consumer_ID: number;
  Meter_ID: number;
  Meter_Reader_ID: number;
  Created_Date: string;
  Reading_Status: 'Normal' | 'Locked' | 'Malfunction' | 'Estimated';
  Previous_Reading: number;
  Current_Reading: number;
}

export interface Bill {
  Bill_ID: number;
  Consumer_ID: number;
  Reading_ID: number;
  Billing_Officer_ID: number;
  Billing_Month: string;
  Amount_Due: number;
  Penalty: number;
  Previous_Balance: number;
  Previous_Penalty: number;
  Connection_Fee: number;
  Total_Amount: number;
  Due_Date: string;
}

export interface Payment {
  PaymentID: number;
  ConsumerID: number;
  BillID: number;
  PaymentDate: string;
  AmountPaid: number;
  ORNumber: string;
}

export interface Rate {
  Rate_ID: number;
  Min_Rate: number;
  Price_Per_Cubic: number;
  Effective_Date: string;
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
  notifications: Notification[];
  consumptionHistory: {
    month: string;
    consumption: number;
    amount: number;
  }[];
}

export interface Notification {
  id: string;
  type: 'bill_ready' | 'payment_due' | 'payment_received' | 'reading_scheduled' | 'system_maintenance';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
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
  role: 'consumer';
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: string;
  profile: ConsumerProfile;
}
