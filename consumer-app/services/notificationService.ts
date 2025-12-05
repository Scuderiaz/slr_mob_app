// In-App Notification Service for Consumer App
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'bill' | 'payment' | 'reminder' | 'info';
  timestamp: string;
  read: boolean;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notifications: Notification[]) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Add notification listener
  addListener(callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);
  }

  // Remove notification listener
  removeListener(callback: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners(notifications: Notification[]) {
    this.listeners.forEach(listener => listener(notifications));
  }

  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const stored = await AsyncStorage.getItem('consumer_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Add new notification
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      };

      notifications.unshift(newNotification); // Add to beginning
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }

      await AsyncStorage.setItem('consumer_notifications', JSON.stringify(notifications));
      this.notifyListeners(notifications);
      
      console.log('✅ Notification added:', newNotification.title);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('consumer_notifications', JSON.stringify(updated));
      this.notifyListeners(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n => ({ ...n, read: true }));
      
      await AsyncStorage.setItem('consumer_notifications', JSON.stringify(updated));
      this.notifyListeners(updated);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem('consumer_notifications');
      this.notifyListeners([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Predefined notification templates
  async notifyNewBill(billAmount: number, dueDate: string, billId: string): Promise<void> {
    await this.addNotification({
      title: '💧 New Water Bill Available',
      message: `Your water bill of ₱${billAmount.toFixed(2)} is now ready. Due: ${dueDate}`,
      type: 'bill',
      data: { billId, amount: billAmount, dueDate }
    });
  }

  async notifyPaymentReceived(amount: number, receiptNo: string): Promise<void> {
    await this.addNotification({
      title: '✅ Payment Received',
      message: `Payment of ₱${amount.toFixed(2)} has been processed. Receipt: ${receiptNo}`,
      type: 'payment',
      data: { amount, receiptNo }
    });
  }

  async notifyBillOverdue(billAmount: number, daysPastDue: number): Promise<void> {
    await this.addNotification({
      title: '⚠️ Bill Overdue',
      message: `Your bill of ₱${billAmount.toFixed(2)} is ${daysPastDue} days overdue. Please pay immediately.`,
      type: 'reminder',
      data: { amount: billAmount, daysPastDue }
    });
  }

  async notifyMeterReading(consumption: number, readingDate: string): Promise<void> {
    await this.addNotification({
      title: '📊 Meter Reading Completed',
      message: `Your meter has been read. Consumption: ${consumption} cubic meters on ${readingDate}`,
      type: 'info',
      data: { consumption, readingDate }
    });
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
