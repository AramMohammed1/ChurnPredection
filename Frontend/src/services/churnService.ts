const API_BASE_URL = 'http://127.0.0.1:8000';

export interface ChurnPredictionResponse {
  customer_id: number;
  churn_probability: number;
  churn_prediction: boolean;
  confidence: string;
}

export interface Customer {
  'Customer ID': number;
  'Customer Name': string;
  'Email': string;
  'Age': number;
  'Gender': string;
  'Product Price': number;
  'Quantity': number;
  'Total Purchase Amount': number;
  'Returns': number;
  'Purchase Date': string;
  'Payment Method': string;
  'Product Category': string;
  'Churn': number;
  [key: string]: any;
}


export interface CustomerData {
  "id": 44605,
  "name": string;
  "email":  string;
  "totalSpent":  string;
  "last_purchase_date": string;
  [key: string]: any;
}
export interface ChurnData {
  [customerId: number]: {
    prediction: ChurnPredictionResponse[];
    actual: number[];
  };
}

class ChurnService {
  async getChurnedCustomers(tableName: string = 'ecommerce'): Promise<ChurnData> {
    try {
      const response = await fetch(`${API_BASE_URL}/Churns/?table_name=${tableName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching churned customers:', error);
      throw error;
    }
  }
 
  async getAllCustomers(tableName: string = 'ecommerce'): Promise<Customer[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/all/${tableName}/`);
     
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async getCustomerById(customerId: number, tableName: string = 'ecommerce'): Promise<CustomerData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${tableName}/${customerId}/data`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  async predictChurn(customerId: number): Promise<ChurnPredictionResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/customers_predicts/${customerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data[0]; // The API returns [result, labels], we want the result
    } catch (error) {
      console.error('Error predicting churn:', error);
      throw error;
    }
  }
}

export const churnService = new ChurnService(); 