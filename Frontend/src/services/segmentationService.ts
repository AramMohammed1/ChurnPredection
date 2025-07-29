import { authService } from './authService';

const SEGMENTATION_SERVICE_URL = import.meta.env.VITE_API_GETWAY_BASE_URL;

export interface SegmentInfo {
  name: string;
  description: string;
  color: string;
  count: number;
  percentage: number;
  avg_spent: number;
  avg_quantity: number;
  avg_age: number;
}

export interface BehaviorAnalysis {
  segment: string;
  purchases: number;
  engagement: number;
  avg_spent: number;
}

export interface SegmentationResponse {
  segments: { [key: string]: SegmentInfo };
  behavior_analysis: BehaviorAnalysis[];
  total_customers: number;
  customer_data: any[];
}

export interface CustomerSegment {
  customer_id: number;
  segment: number;
  segment_name: string;
  segment_description: string;
  segment_color: string;
}

class SegmentationService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async segmentCustomers(tableName: string): Promise<SegmentationResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${SEGMENTATION_SERVICE_URL}/segmentation/segment_customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ table_name: tableName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error segmenting customers:', error);
      throw error;
    }
  }

  async getSegments(tableName: string): Promise<SegmentationResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const user = await authService.getCurrentUser();
      const userTableName = user ? `user_data_${user.id || 9}` : 'user_data_9';
      
      const response = await fetch(`${SEGMENTATION_SERVICE_URL}/segmentation/segments/${userTableName}/`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting segments:', error);
      throw error;
    }
  }

  async getCustomerSegment(customerId: number, tableName: string): Promise<CustomerSegment> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${SEGMENTATION_SERVICE_URL}/segmentation/segment/${customerId}?table_name=${tableName}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer segment:', error);
      throw error;
    }
  }

  async getBehaviorAnalysis(tableName: string): Promise<{ behavior_analysis: BehaviorAnalysis[], total_customers: number }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${SEGMENTATION_SERVICE_URL}/segmentation/behavior_analysis/${tableName}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting behavior analysis:', error);
      throw error;
    }
  }
}

export const segmentationService = new SegmentationService(); 