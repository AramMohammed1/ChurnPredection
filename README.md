# AI-Powered E-commerce Analytics Platform

A comprehensive analytics platform that provides churn prediction, customer segmentation, and lifetime value analysis using machine learning.

## 🚀 Features

### Core Analytics
- **Churn Prediction**: Identify at-risk customers before they leave
- **Customer Segmentation**: Group customers by behavior and value using K-means clustering
- **CLTV Analysis**: Calculate and optimize customer lifetime value
- **Real-time Processing**: Process customer data in real-time
- **Interactive Dashboards**: Beautiful, responsive UI with charts and visualizations

### Customer Segments
1. **Champions** - High value, highly engaged customers
2. **Loyal Customers** - Regular purchasers with good engagement  
3. **Potential Loyalists** - Recent customers with growth potential
4. **At Risk** - Declining engagement, at risk of churning
5. **New Customers** - Recent first-time buyers

## 🏗️ Architecture

### Microservices
- **Auth Service** (Port 8012): User authentication and authorization
- **Data Service** (Port 8011): Data management and storage
- **Churn Service** (Port 8013): Churn prediction using transformer models
- **Segmentation Service** (Port 8014): Customer segmentation using K-means
- **CLTV Service** (Port 8015): Customer lifetime value analysis
- **API Gateway** (Port 8000): Route requests to appropriate services

### Frontend
- **React + TypeScript**: Modern, responsive UI
- **Tailwind CSS**: Beautiful styling
- **Recharts**: Interactive data visualizations
- **Shadcn/ui**: Component library

## 🛠️ Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL

### Backend Setup
1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Services:**
   ```bash
   # Start API Gateway
   python api_gateway.py
   
   # Start Auth Service
   cd services/auth_service && python main.py
   
   # Start Data Service  
   cd services/data_service && python main.py
   
   # Start Churn Service
   cd services/churn_service && python main.py
   
   # Start Segmentation Service
   python start_segmentation_service.py
   ```

### Frontend Setup
1. **Install Dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

## 📊 API Endpoints

### Segmentation Service
- `POST /segmentation/segment_customers` - Segment all customers
- `GET /segmentation/segments/{table_name}` - Get segments for a table
- `GET /segmentation/segment/{customer_id}` - Get customer segment
- `GET /segmentation/behavior_analysis/{table_name}` - Get behavioral analysis

### Churn Service
- `POST /churn/predict_batch` - Batch churn prediction
- `GET /churn/predict/{customer_id}` - Single customer prediction
- `GET /churn/progress/{task_id}` - Get prediction progress

### Data Service
- `POST /data/upload` - Upload customer data
- `GET /data/customers/all/{table_name}` - Get all customers

## 🧪 Testing

### Test Segmentation Service
```bash
python test_segmentation_service.py
```

### Test API Integration
```bash
python api_integration_test.py
```

## 📈 Model Information

### Segmentation Model
- **Algorithm**: K-means clustering
- **Features**: Total Purchase Amount, Quantity, Returns, Age, Product Price
- **Segments**: 5 customer segments
- **Model Files**: `kmeans.pkl`, `scaler.pkl`

### Churn Model
- **Algorithm**: Transformer neural network
- **Features**: Customer behavior sequences
- **Output**: Churn probability (0-1)
- **Model Files**: `best_model.pth`, `scaler.pkl`

## 🔧 Configuration

### Environment Variables
- `DATA_SERVICE_URL`: Data service URL (default: http://localhost:8011)
- `AUTH_SERVICE_URL`: Auth service URL (default: http://localhost:8001)
- `CHURN_SERVICE_URL`: Churn service URL (default: http://localhost:8013)
- `SEGMENTATION_SERVICE_URL`: Segmentation service URL (default: http://localhost:8014)

### Service Ports
- API Gateway: 8000
- Auth Service: 8012
- Data Service: 8011
- Churn Service: 8013
- Segmentation Service: 8014
- Frontend: 5173

## 📱 Frontend Features

### Dashboard Components
- **KPI Cards**: Key performance indicators
- **Revenue Chart**: Revenue trends over time
- **Engagement Metrics**: Customer engagement analysis
- **Churn Prediction**: Real-time churn predictions
- **Customer Segmentation**: Interactive segment analysis
- **CLTV Analysis**: Lifetime value calculations
- **Data Import**: Upload and manage customer data

### Interactive Features
- Real-time data refresh
- Interactive charts and graphs
- Responsive design
- Toast notifications
- Loading states
- Error handling

## 🚀 Deployment

### Production Setup
1. Set up environment variables
2. Configure database connections
3. Deploy services to containers
4. Set up reverse proxy
5. Configure SSL certificates

### Docker Support
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📚 Documentation

- **API Documentation**: Available at `/docs` for each service
- **Frontend Documentation**: Component documentation in code
- **Service Documentation**: Individual README files in service directories

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Test with the provided scripts
- Check service logs for errors
