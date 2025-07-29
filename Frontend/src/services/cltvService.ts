const API_BASE_URL = import.meta.env.VITE_API_GETWAY_BASE_URL;

export interface CLTVCustomer {
  customer_id: number;
  customer_name: string;
  total_transaction: number;
  total_unit: number;
  total_price: number;
  average_order_value: number;
  purchase_frequency: number;
  profit_margin: number;
  customer_value: number;
  cltv: number;
}

export interface CLTVSummary {
  total_customers: number;
  average_cltv: number;
  median_cltv: number;
  max_cltv: number;
  min_cltv: number;
  total_revenue: number;
  average_order_value: number;
  repeat_rate: number;
  churn_rate: number;
}

export interface CLTVSegment {
  segment: string;
  customer_count: number;
  average_cltv: number;
  total_revenue: number;
  average_order_value: number;
  purchase_frequency: number;
}

export interface CLTVResponse {
  summary: CLTVSummary;
  top_customers: CLTVCustomer[];
  message: string;
}

export interface CLTVSegmentsResponse {
  segments: CLTVSegment[];
  total_customers: number;
  churn_rate: number;
  message: string;
}

import { authService } from './authService';

class CLTVService {
  private getHeaders(): HeadersInit {
    const authHeaders = authService.getAuthHeaders();
    return {
      'Content-Type': 'application/json',
      ...authHeaders,
    };
  }

  async calculateCLTV(limit: number = 100): Promise<CLTVResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cltv/calculate?limit=${limit}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      
      // Validate response structure
      if (!data.summary || !data.top_customers) {
        throw new Error('Invalid response format from CLTV service');
      }
      
      return data;
    } catch (error) {
      console.error('Error calculating CLTV:', error);
      throw error;
    }
  }

  async getCustomerCLTV(customerId: number): Promise<CLTVCustomer> {
    try {
      const response = await fetch(`${API_BASE_URL}/cltv/customer/${customerId}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer CLTV:', error);
      throw error;
    }
  }

  async getCLTVSegments(): Promise<CLTVSegmentsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cltv/segments`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      
      // Validate response structure
      if (!data.segments) {
        throw new Error('Invalid response format from CLTV segments service');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching CLTV segments:', error);
      throw error;
    }
  }
}

export const cltvService = new CLTVService(); 