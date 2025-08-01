import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
import httpx
import os
import math
from ..utils.auth import get_current_user
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/cltv", tags=["CLTV Analysis"])

DATA_SERVICE_URL = os.getenv("DATA_SERVICE_BASE_URL")
CHURN_SERVICE_URL = os.getenv("CHURN_SERVICE_BASE_URL")

def make_json_safe(value):
    """
    Convert value to JSON-safe format, handling infinity and NaN
    """
    if isinstance(value, (int, float)):
        if math.isinf(value) or math.isnan(value):
            return 0
        return value
    return value

async def get_churn_rate_from_service(table_name: str, auth_token: str) -> float:
    """
    Get churn rate from churn service
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CHURN_SERVICE_URL}/churn/churn_rate?table_name={table_name}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()

                return data.get("churn_rate", 0.01) 
            else:
                print(f"Warning: Failed to get churn rate from churn service: {response.status_code}")
                return 0.01  
                
    except Exception as e:
        print(f"Warning: Error getting churn rate from churn service: {e}")
        return 0.01 

def calculate_cltv(df: pd.DataFrame, churn_rate: float) -> pd.DataFrame:
    """
    Calculate Customer Lifetime Value (CLTV) using the provided logic
    """
    try:
        df["Customer ID copy"] = df["Customer ID"].copy()
        cltv_c = df.groupby('Customer ID copy').agg({
            'Customer ID copy': lambda x: x.value_counts(),
            'Quantity': lambda x: x.sum(),
            'Total Purchase Amount': lambda x: x.sum(),
            'Customer ID': 'first',
            'Customer Name': 'first' 
        })

        cltv_c.columns = ['Total Transaction', 'Total Unit', 'Total Price', 'Customer ID', 'Customer Name']
        
        cltv_c["Average Order Value"] = cltv_c["Total Price"] / cltv_c["Total Transaction"].replace(0, 1)
        cltv_c["Purchase Frequency"] = cltv_c["Total Transaction"] / max(1, cltv_c.shape[0])
        cltv_c['Profit Margin'] = cltv_c['Total Price'] * 0.01
        
       
        safe_churn_rate = max(0.01, min(0.99, churn_rate))
        print(churn_rate)
        cltv_c['CLT'] = 1 / safe_churn_rate

        cltv_c['Customer Value'] = cltv_c['Average Order Value'] * cltv_c["Purchase Frequency"]
        cltv_c["CLTV"] = (cltv_c["Customer Value"] / safe_churn_rate) * cltv_c["Profit Margin"]
        
        cltv_c["CLTV"] = cltv_c["CLTV"].replace([float('inf'), float('-inf')], 0)
        cltv_c["CLTV"] = cltv_c["CLTV"].fillna(0)
        
        numeric_columns = ['Total Transaction', 'Total Unit', 'Total Price', 'Average Order Value', 
                          'Purchase Frequency', 'Profit Margin', 'Customer Value', 'CLTV']
        for col in numeric_columns:
            if col in cltv_c.columns:
                cltv_c[col] = cltv_c[col].replace([float('inf'), float('-inf')], 0)
                cltv_c[col] = cltv_c[col].fillna(0)
        
        cltv_c = cltv_c.reset_index()
        
        return cltv_c
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating CLTV: {str(e)}")

async def get_data_from_service(table_name: str, auth_token: str) -> pd.DataFrame:
    """
    Get data from the data service via API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{DATA_SERVICE_URL}/data/customers/all/{table_name}/",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return pd.DataFrame(data)
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch data from data service")
                
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Data service unavailable")

@router.get("/calculate")
async def calculate_cltv_for_table(
    limit: Optional[int] = 100,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Calculate CLTV for all customers in the user's table
    """
    try:
        table_name = f"user_data_{current_user['id']}"
        
        auth_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        
        
        df = await get_data_from_service(table_name, auth_token)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found in the specified table")
        
        # churn_rate = await get_churn_rate_from_service(table_name, auth_token)
        churn_rate = 0.5
        cltv_results = calculate_cltv(df, churn_rate)
        
        limit_value = limit if limit is not None else 100
        cltv_results_sorted = cltv_results.sort_values(by="CLTV", ascending=False).head(limit_value)
        
        results = []
        for _, row in cltv_results_sorted.iterrows():
            results.append({
                "customer_id": int(row['Customer ID']),
                "customer_name": str(row['Customer Name']),
                "total_transaction": make_json_safe(int(row['Total Transaction'])),
                "total_unit": make_json_safe(int(row['Total Unit'])),
                "total_price": make_json_safe(float(row['Total Price'])),
                "average_order_value": make_json_safe(float(row['Average Order Value'])),
                "purchase_frequency": make_json_safe(float(row['Purchase Frequency'])),
                "profit_margin": make_json_safe(float(row['Profit Margin'])),
                "customer_value": make_json_safe(float(row['Customer Value'])),
                "cltv": make_json_safe(float(row['CLTV']))
            })
        
        summary = {
            "total_customers": len(cltv_results),
            "average_cltv": make_json_safe(float(cltv_results['CLTV'].mean())),
            "median_cltv": make_json_safe(float(cltv_results['CLTV'].median())),
            "max_cltv": make_json_safe(float(cltv_results['CLTV'].max())),
            "min_cltv": make_json_safe(float(cltv_results['CLTV'].min())),
            "total_revenue": make_json_safe(float(cltv_results['Total Price'].sum())),
            "average_order_value": make_json_safe(float(cltv_results['Average Order Value'].mean())),
            "repeat_rate": make_json_safe(float(len(cltv_results[cltv_results['Total Transaction'] > 1]) / len(cltv_results))),
            "churn_rate": churn_rate  
        }
        
        return {
            "summary": summary,
            "top_customers": results,
            "message": f"CLTV calculated successfully for {len(cltv_results)} customers using churn rate: {churn_rate:.2%}"
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing CLTV calculation: {str(e)}")

@router.get("/customer/{customer_id}")
async def get_customer_cltv(
    customer_id: int,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Get CLTV for a specific customer
    """
    try:
        table_name = f"user_data_{current_user['id']}"
        
        auth_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        
        df = await get_data_from_service(table_name, auth_token)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found in the specified table")
        
        customer_data = df[df['Customer ID'] == customer_id]
        
        if customer_data.empty:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
        
        # churn_rate = await get_churn_rate_from_service(table_name, auth_token)
        churn_rate = 0.5
        cltv_results = calculate_cltv(customer_data.to_frame().T if len(customer_data) == 1 else customer_data, churn_rate)
        
        if cltv_results.empty:
            raise HTTPException(status_code=404, detail=f"Could not calculate CLTV for customer {customer_id}")
        
        customer_cltv = cltv_results.iloc[0]
        
        return {
            "customer_id": int(customer_cltv['Customer ID']),
            "customer_name": str(customer_cltv['Customer Name']) if pd.notna(customer_cltv['Customer Name']) else f"Customer {int(customer_cltv['Customer ID'])}",
            "total_transaction": make_json_safe(int(customer_cltv['Total Transaction'])),
            "total_unit": make_json_safe(int(customer_cltv['Total Unit'])),
            "total_price": make_json_safe(float(customer_cltv['Total Price'])),
            "average_order_value": make_json_safe(float(customer_cltv['Average Order Value'])),
            "purchase_frequency": make_json_safe(float(customer_cltv['Purchase Frequency'])),
            "profit_margin": make_json_safe(float(customer_cltv['Profit Margin'])),
            "customer_value": make_json_safe(float(customer_cltv['Customer Value'])),
            "cltv": make_json_safe(float(customer_cltv['CLTV']))
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing customer CLTV: {str(e)}")

@router.get("/segments")
async def get_cltv_segments(
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Get CLTV analysis by customer segments
    """
    try:
        table_name = f"user_data_{current_user['id']}"
        
        auth_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        
        df = await get_data_from_service(table_name, auth_token)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found in the specified table")
        
        # churn_rate = await get_churn_rate_from_service(table_name, auth_token)
        churn_rate = 0.5
        cltv_results = calculate_cltv(df, churn_rate)
        
        def categorize_cltv(cltv_value):
            if cltv_value >= 5000:
                return "Champions"
            elif cltv_value >= 2000:
                return "Loyal"
            elif cltv_value >= 1000:
                return "Potential"
            elif cltv_value >= 500:
                return "At Risk"
            else:
                return "New"
        
        cltv_results['Segment'] = cltv_results['CLTV'].apply(categorize_cltv)
        
        segments = []
        for segment in cltv_results['Segment'].unique():
            segment_data = cltv_results[cltv_results['Segment'] == segment]
            segments.append({
                "segment": segment,
                "customer_count": int(len(segment_data)),
                "average_cltv": make_json_safe(float(segment_data['CLTV'].mean())),
                "total_revenue": make_json_safe(float(segment_data['Total Price'].sum())),
                "average_order_value": make_json_safe(float(segment_data['Average Order Value'].mean())),
                "purchase_frequency": make_json_safe(float(segment_data['Purchase Frequency'].mean()))
            })
        
        segments.sort(key=lambda x: x['average_cltv'], reverse=True)
        
        return {
            "segments": segments,
            "total_customers": len(cltv_results),
            "churn_rate": churn_rate,
            "message": "CLTV segments calculated successfully"
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing CLTV segments: {str(e)}")
