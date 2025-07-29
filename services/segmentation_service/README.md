# Customer Segmentation Service

This service provides AI-powered customer segmentation using K-means clustering. It uses pre-trained models to categorize customers into different segments based on their behavior and characteristics.

## Features

- **Customer Segmentation**: Categorizes customers into 5 segments using K-means clustering
- **Behavioral Analysis**: Analyzes purchase patterns, and engagement scores
- **Real-time Processing**: Processes customer data in real-time
- **RESTful API**: Provides comprehensive API endpoints for segmentation

## Customer Segments

1. **Champions** - High value, highly engaged customers
2. **Loyal Customers** - Regular purchasers with good engagement
3. **Potential Loyalists** - Recent customers with growth potential
4. **At Risk** - Declining engagement, at risk of churning
5. **New Customers** - Recent first-time buyers

## API Endpoints

### POST `/segmentation/segment_customers`
Segment all customers in a table

**Request Body:**
```json
{
  "table_name": "customer_data"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer segmentation completed successfully",
  "data": {
    "segments": {
      "0": {
        "name": "Champions",
        "description": "High value, highly engaged customers",
        "color": "#10B981",
        "count": 1247,
        "percentage": 12.4,
        "avg_spent": 2340.0,
        "avg_quantity": 5.2,
        "avg_age": 35.1
      }
    },
    "behavior_analysis": [...],
    "total_customers": 10000,
    "customer_data": [...]
  }
}
```

### GET `/segmentation/segments/{table_name}`
Get segments for a specific table

### GET `/segmentation/segment/{customer_id}?table_name={table_name}`
Get segment information for a specific customer

### GET `/segmentation/behavior_analysis/{table_name}`
Get behavioral analysis for all segments

## Setup

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Service:**
   ```bash
   python start_segmentation_service.py
   ```

3. **Environment Variables:**
   - `DATA_SERVICE_URL`: URL of the data service (default: http://localhost:8011)
   - `AUTH_SERVICE_URL`: URL of the auth service (default: http://localhost:8001)

## Model Files

The service uses pre-trained models located in `utils/`:
- `kmeans.pkl`: Trained K-means clustering model
- `scaler.pkl`: StandardScaler for feature normalization

## Features Used for Segmentation

- Total Purchase Amount
- Quantity
- Returns
- Age
- Product Price

## Integration

The service integrates with:
- **Data Service**: Fetches customer data
- **Auth Service**: Validates user authentication
- **API Gateway**: Routes requests to the service

## Error Handling

The service includes comprehensive error handling for:
- Missing model files
- Invalid data formats
- Authentication failures
- Data service connection issues

## Performance

- Processes customer data efficiently using pandas
- Uses scikit-learn for fast clustering
- Supports real-time segmentation requests
- Handles large datasets with optimized memory usage 