import AsyncStorage from '@react-native-async-storage/async-storage';
import { Consumer, MeterReaderProfile, Reading } from '../types/index';

// Storage keys
const KEYS = {
  READINGS: 'readings',
  PROFILE: 'meterProfile',
  CONSUMERS: 'consumers',
  LAST_SYNC: 'lastSyncTime',
  RECEIPTS_PRINTED: 'receiptsPrinted',
};

// Readings
export const saveReading = async (reading: Reading): Promise<void> => {
  try {
    const readings = await getReadings();
    readings.push(reading);
    await AsyncStorage.setItem(KEYS.READINGS, JSON.stringify(readings));
  } catch (error) {
    console.error('Error saving reading:', error);
    throw error;
  }
};

export const getReadings = async (): Promise<Reading[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.READINGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting readings:', error);
    return [];
  }
};

export const getUnsyncedReadings = async (): Promise<Reading[]> => {
  try {
    const readings = await getReadings();
    return readings.filter(r => !r.synced);
  } catch (error) {
    console.error('Error getting unsynced readings:', error);
    return [];
  }
};

export const markReadingsAsSynced = async (): Promise<void> => {
  try {
    const readings = await getReadings();
    const syncedReadings = readings.map(r => ({ ...r, synced: true }));
    await AsyncStorage.setItem(KEYS.READINGS, JSON.stringify(syncedReadings));
  } catch (error) {
    console.error('Error marking readings as synced:', error);
    throw error;
  }
};

// Profile
export const saveProfile = async (profile: MeterReaderProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getProfile = async (): Promise<MeterReaderProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
};

// Consumers
export const saveConsumers = async (consumers: Consumer[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.CONSUMERS, JSON.stringify(consumers));
  } catch (error) {
    console.error('Error saving consumers:', error);
    throw error;
  }
};

export const getConsumers = async (): Promise<Consumer[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CONSUMERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting consumers:', error);
    return [];
  }
};

// Sync
export const updateLastSync = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.LAST_SYNC, now);
  } catch (error) {
    console.error('Error updating last sync:', error);
    throw error;
  }
};

export const getLastSync = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Error getting last sync:', error);
    return null;
  }
};

// Receipts
export const incrementReceiptCount = async (): Promise<void> => {
  try {
    const count = await getReceiptCount();
    await AsyncStorage.setItem(KEYS.RECEIPTS_PRINTED, String(count + 1));
  } catch (error) {
    console.error('Error incrementing receipt count:', error);
    throw error;
  }
};

export const getReceiptCount = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECEIPTS_PRINTED);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('Error getting receipt count:', error);
    return 0;
  }
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.READINGS,
      KEYS.CONSUMERS,
      KEYS.LAST_SYNC,
      KEYS.RECEIPTS_PRINTED,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
