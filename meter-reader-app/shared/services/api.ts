// API Service Layer for Consumer Mobile App
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ApiResponse,
    AuthToken,
    Bill,
    ConsumerDashboard,
    LoginCredentials,
    Payment
} from '../types/consumer';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-api.com/api';  // Production

class ApiService {
  private authToken: string | null = null;

  constructor() {
    this.loadAuthToken();
  }

  private async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      this.authToken = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async saveAuthToken(token: string) {
    try {
      await AsyncStorage.setItem('auth_token', token);
      this.authToken = token;
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  private async clearAuthToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
      this.authToken = null;
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthToken>> {
    const response = await this.makeRequest<AuthToken>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>('/auth/logout', {
      method: 'POST',
    });

    await this.clearAuthToken();
    return response;
  }

  async refreshToken(): Promise<ApiResponse<AuthToken>> {
    const response = await this.makeRequest<AuthToken>('/auth/refresh', {
      method: 'POST',
    });

    if (response.success && response.data) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/auth/profile');
  }

  // Consumer Dashboard Methods
  async getDashboard(): Promise<ApiResponse<ConsumerDashboard>> {
    return this.makeRequest<ConsumerDashboard>('/consumer/dashboard');
  }

  // Bill Management Methods
  async getBills(page: number = 1, limit: number = 10): Promise<ApiResponse<{
    bills: Bill[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    return this.makeRequest(`/consumer/bills?page=${page}&limit=${limit}`);
  }

  async getBillById(billId: string): Promise<ApiResponse<Bill>> {
    return this.makeRequest<Bill>(`/consumer/bills/${billId}`);
  }

  async searchBills(query: string): Promise<ApiResponse<Bill[]>> {
    return this.makeRequest<Bill[]>(`/consumer/bills/search?q=${encodeURIComponent(query)}`);
  }

  // Payment Methods
  async getPayments(page: number = 1, limit: number = 10): Promise<ApiResponse<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    return this.makeRequest(`/consumer/payments?page=${page}&limit=${limit}`);
  }

  async getPaymentsByBill(billId: string): Promise<ApiResponse<Payment[]>> {
    return this.makeRequest<Payment[]>(`/consumer/payments/bill/${billId}`);
  }

  // Receipt Generation
  async generateReceipt(billId: string): Promise<ApiResponse<{
    receiptUrl: string;
    receiptData: any;
  }>> {
    return this.makeRequest(`/consumer/receipt/${billId}`);
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Mock data for development (when backend is not available)
export const mockData: any = {
  user: {
    id: '1',
    username: 'juan.delacruz',
    fullName: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    role: 'consumer' as const,
    accountNo: '07-11-46-2',
    meterNo: '1234',
    address: 'Purok 1, Barangay Poblacion, San Lorenzo Ruiz, Camarines Norte',
    zone: 'Zone A',
    status: 'active' as const,
    createdAt: '2023-01-15T00:00:00Z',
  },
  
  bills: [
    {
      id: '1',
      accountNo: '07-11-46-2',
      receiptNo: 'SLR-2025-001234',
      billingPeriod: 'November 2025',
      month: 'November',
      year: 2025,
      previousReading: 1234,
      currentReading: 1242,
      consumption: 8,
      basicCharge: 150.00,
      consumptionCharge: 200.00,
      penalty: 20.00,
      previousBalance: 300.00,
      totalAmount: 670.00,
      dueDate: '2025-12-15',
      status: 'unpaid' as const,
      issueDate: '2025-11-15',
    },
    {
      id: '2',
      accountNo: '07-11-46-2',
      receiptNo: 'SLR-2025-001233',
      billingPeriod: 'October 2025',
      month: 'October',
      year: 2025,
      previousReading: 1226,
      currentReading: 1234,
      consumption: 8,
      basicCharge: 150.00,
      consumptionCharge: 200.00,
      penalty: 0.00,
      previousBalance: 0.00,
      totalAmount: 350.00,
      dueDate: '2025-11-15',
      status: 'paid' as const,
      issueDate: '2025-10-15',
      paymentDate: '2025-11-10',
    },
  ],
};

export default apiService;
