const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
import { authService } from './authService';

export interface UploadResponse {
  message: string;
  filename: string;
  table_name: string;
  size: number;
  records_count: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ColumnMapping {
  customer_id: string;
  customer_name: string;
  purchase_date: string;
  product_price: string;
  quantity: string;
  total_purchase_amount: string;
  returns: string;
  age: string;
  gender: string;
  payment_method: string;
  product_category: string;
  churn: string;
}

export interface CSVValidationResponse {
  columns: string[];
  filename: string;
  total_columns: number;
}

export interface RequiredColumn {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
  description: string;
}

export interface UploadHistoryEntry {
  id: string;
  filename: string;
  tableName: string;
  uploadTime: string;
  status: 'success' | 'error';
  fileSize: number;
  recordsCount?: number;
  errorMessage?: string;
}

class UploadService {
  private getHeaders(): HeadersInit {
    const authHeaders = authService.getAuthHeaders();
    return {
      'Content-Type': 'application/json',
      ...authHeaders,
    };
  }

  async getUploadHistory(limit: number = 50): Promise<UploadHistoryEntry[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/upload_history?limit=${limit}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.upload_history || [];
    } catch (error) {
      console.error('Error fetching upload history:', error);
      return [];
    }
  }

  async validateCSVColumns(file: File): Promise<CSVValidationResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/data/validate_csv_columns`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating CSV columns:', error);
      throw error;
    }
  }

  async uploadCSV(
    file: File,
    tableName: string,
    columnMapping: ColumnMapping | null,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('table_name', tableName);
      
      if (columnMapping) {
        formData.append('column_mapping_json', JSON.stringify(columnMapping));
      }

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `${API_BASE_URL}/data/upload_csv`);
        
        // Set headers manually for FormData
        const token = localStorage.getItem('access_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw error;
    }
  }

  getRequiredColumns(): RequiredColumn[] {
    return [
      {
        key: 'customer_id',
        label: 'Customer ID',
        required: true,
        description: 'Unique identifier for each customer'
      },
      {
        key: 'customer_name',
        label: 'Customer Name',
        required: true,
        description: 'Name of the customer'
      },
      {
        key: 'purchase_date',
        label: 'Purchase Date',
        required: true,
        description: 'Date when the purchase was made (YYYY-MM-DD format)'
      },
      {
        key: 'product_price',
        label: 'Product Price',
        required: true,
        description: 'Price of the individual product'
      },
      {
        key: 'quantity',
        label: 'Quantity',
        required: true,
        description: 'Number of items purchased'
      },
      {
        key: 'total_purchase_amount',
        label: 'Total Purchase Amount',
        required: true,
        description: 'Total amount for the transaction'
      },
      {
        key: 'returns',
        label: 'Returns',
        required: true,
        description: 'Return amount (0 if no returns)'
      },
      {
        key: 'age',
        label: 'Age',
        required: true,
        description: 'Customer age'
      },
      {
        key: 'gender',
        label: 'Gender',
        required: true,
        description: 'Customer gender (Male/Female)'
      },
      {
        key: 'payment_method',
        label: 'Payment Method',
        required: true,
        description: 'Payment method used'
      },
      {
        key: 'product_category',
        label: 'Product Category',
        required: true,
        description: 'Category of product'
      },
      {
        key: 'churn',
        label: 'Churn',
        required: true,
        description: 'Churn status (0 = not churned, 1 = churned)'
      }
    ];
  }

  validateCSVFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return { isValid: false, error: 'Please select a CSV file' };
    }

    return { isValid: true };
  }
}

export const uploadService = new UploadService(); 