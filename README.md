# 🚀 AI-Powered E-commerce Analytics Platform

A comprehensive microservices-based analytics platform that leverages artificial intelligence to predict customer churn, perform customer segmentation, and analyze Customer Lifetime Value (CLTV) for e-commerce businesses.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Contributing](#contributing)

## 🎯 Overview

This platform provides a complete analytics solution for e-commerce businesses with the following capabilities:

- **Churn Prediction**: Machine learning models to predict customer churn
- **Customer Segmentation**: K-means clustering for customer segmentation
- **CLTV Analysis**: Customer Lifetime Value analysis and predictions
- **Data Management**: Secure data upload and management system
- **Real-time Analytics**: Interactive dashboards and visualizations
- **Authentication**: Secure user authentication and authorization

## 🏗️ Architecture

The project follows a **microservices architecture** with the following components:

### Backend Services

1. **API Gateway** (`api_gateway.py`)
   - Central routing and load balancing
   - CORS handling and request forwarding
   - Service discovery and health checks

2. **Authentication Service** (`services/auth_service/`)
   - User registration and login
   - JWT token management
   - Password hashing and security

3. **Data Service** (`services/data_service/`)
   - File upload and management
   - Data validation and preprocessing
   - Column mapping functionality

4. **Churn Prediction Service** (`services/churn_service/`)
   - ML model for churn prediction
   - Feature engineering and preprocessing
   - Real-time predictions

5. **Segmentation Service** (`services/segmentation_service/`)
   - K-means clustering for customer segmentation
   - Customer grouping and analysis

6. **CLTV Service** (`services/cltv_service/`)
   - Customer Lifetime Value calculations
   - Revenue analysis and predictions

### Frontend

- **React + TypeScript**: Modern, type-safe frontend
- **Shadcn/ui**: Beautiful, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Data visualization library
- **React Query**: Server state management

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication
- Secure password hashing with bcrypt
- Token refresh mechanism
- Role-based access control

### 📊 Analytics Dashboard
- **KPI Cards**: Key performance indicators
- **Churn Prediction**: ML-powered churn analysis
- **Customer Segmentation**: K-means clustering visualization
- **CLTV Analysis**: Customer lifetime value insights
- **Revenue Charts**: Interactive revenue analytics
- **Engagement Metrics**: Customer engagement tracking

### 🤖 AI
- **Churn Prediction Model**: Neural network-based predictions
- **Customer Segmentation**: K-means clustering algorithm
- **Feature Engineering**: Automated data preprocessing
- **Model Persistence**: Saved models for quick inference

### 📁 Data Management
- **File Upload**: Support for CSV/Excel files
- **Column Mapping**: Intelligent column detection
- **Data Validation**: Input validation and cleaning
- **Upload History**: Track and manage data uploads

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **PyTorch**: Deep learning framework
- **Scikit-learn**: Machine learning library
- **Pandas**: Data manipulation
- **NumPy**: Numerical computing

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Shadcn/ui**: UI components
- **React Query**: Data fetching
- **React Router**: Navigation
- **Recharts**: Charts and graphs

### DevOps & Tools
- **Docker**: Containerization
- **Python-dotenv**: Environment management
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

## 📁 Project Structure

```
ChurnPredection/
├── api_gateway.py              # Main API gateway
├── config.py                   # Configuration settings
├── requirements.txt            # Python dependencies
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   └── package.json
├── services/                   # Microservices
│   ├── auth_service/          # Authentication service
│   ├── churn_service/         # Churn prediction service
│   ├── data_service/          # Data management service
│   ├── segmentation_service/   # Customer segmentation
│   └── cltv_service/          # CLTV analysis service
└── AI notebooks/              # Jupyter notebooks for AI model training
```

## 🚀 Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis (optional, for caching)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChurnPredection
   ```

2. **Create virtual environment**
   ```bash
   python -m venv churn_env
   source churn_env/bin/activate  # On Windows: churn_env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file
   cp .secrets.example .secrets
   ```

   Add the following to `.secrets`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost/churn_prediction_db
   SECRET_KEY=your-secret-key-here
   AUTH_SERVICE_BASE_URL=http://localhost:8001
   DATA_SERVICE_BASE_URL=http://localhost:8002
   CHURN_SERVICE_BASE_URL=http://localhost:8003
   SEGMENTATION_SERVICE_BASE_URL=http://localhost:8004
   CLTV_SERVICE_BASE_URL=http://localhost:8005
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb churn_prediction_db
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🏃‍♂️ Usage

### Starting the Services

1. **Start API Gateway**
   ```bash
   uvicorn api_gateway:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Individual Services**
   ```bash
   # Authentication Service
   uvicorn services.auth_service.main:app --host 0.0.0.0 --port 8001 --reload
   
   # Data Service
   uvicorn services.data_service.main:app --host 0.0.0.0 --port 8002 --reload
   
   # Churn Service
   uvicorn services.churn_service.main:app --host 0.0.0.0 --port 8003 --reload
   
   # Segmentation Service
   uvicorn services.segmentation_service.main:app --host 0.0.0.0 --port 8004 --reload
   
   # CLTV Service
   uvicorn services.cltv_service.main:app --host 0.0.0.0 --port 8005 --reload
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

### Accessing the Application

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📚 API Documentation

### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

### Data Management Endpoints

- `POST /data/upload` - Upload data file
- `GET /data/history` - Get upload history
- `POST /data/map-columns` - Map data columns

### Churn Prediction Endpoints

- `POST /churn/predict` - Predict customer churn
- `GET /churn/features` - Get feature importance
- `POST /churn/batch-predict` - Batch churn prediction

### Segmentation Endpoints

- `POST /segmentation/segment` - Perform customer segmentation
- `GET /segmentation/clusters` - Get cluster information
- `POST /segmentation/analyze` - Analyze customer segments

### CLTV Endpoints

- `POST /cltv/calculate` - Calculate CLTV
- `GET /cltv/analysis` - Get CLTV analysis
- `POST /cltv/predict` - Predict future CLTV

## 🔧 Development

### Code Structure

The project follows clean architecture principles:

- **Domain Layer**: Business logic and entities
- **Service Layer**: Application services
- **Infrastructure Layer**: External dependencies
- **Presentation Layer**: API controllers and UI
