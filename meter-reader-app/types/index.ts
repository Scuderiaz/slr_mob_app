// Type definitions for the Meter Reader app - Updated to match water_billing_system.sql

// Database schema interfaces
export interface Account {
  AccountID: number;
  Username: string;
  Password: string;
  Role_ID: number;
}

export interface Role {
  Role_ID: number;
  Role_Name: string;
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

export interface Route {
  Route_ID: number;
  Meter_Reader_ID: number;
  Zone_ID: number;
}

export interface Reading {
  Reading_ID?: number;
  Route_ID: number;
  Consumer_ID: number;
  Meter_ID: number;
  Meter_Reader_ID: number;
  Created_Date: string;
  Reading_Status: 'Normal' | 'Locked' | 'Malfunction' | 'Estimated';
  Previous_Reading: number;
  Current_Reading: number;
  Consumption?: number;
  Notes?: string;
  Status?: string; // Reading status (Pending/Completed)
  Reading_Date?: string;
  // Mobile-specific fields
  sync_status?: string;
  last_modified?: number;
  created_locally?: number;
  synced?: boolean;
  photo?: string;
}

// Combined interfaces for app use
export interface ConsumerWithDetails {
  Consumer_ID: number;
  First_Name: string;
  Last_Name: string;
  Address: string;
  Zone_ID: number;
  Zone_Name?: string; // Optional, derived from Zone_ID
  Classification_ID: number;
  Classification_Name?: string; // Optional, derived from Classification_ID
  Account_Number?: string;
  Meter_Number?: string;
  Status?: string; // Consumer status (Active/Inactive)
  Contact_Number?: string;
  Connection_Date?: string;
  Meter_Serial_Number?: string;
  Meter_Size?: string;
  Previous_Reading?: number;
  Current_Reading?: number;
  status: 'Read' | 'Pending' | 'Flagged'; // Reading status
}

export interface MeterReaderUser {
  AccountID: number;
  Username: string;
  Role_Name: string;
  First_Name?: string;
  Last_Name?: string;
  Zone_Name?: string;
}

export interface MeterReaderProfile {
  AccountID: number;
  Username: string;
  First_Name?: string;
  Last_Name?: string;
  email?: string;
  phone?: string;
  Zone_ID: number;
  Zone_Name: string;
  Role_Name: string;
}

export interface DashboardStats {
  totalAssigned: number;
  readToday: number;
  remaining: number;
  flagged: number;
  completionPercentage: number;
}

export interface Activity {
  id: string;
  type: 'reading' | 'flag' | 'sync';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  iconColor: string;
  backgroundColor: string;
}
