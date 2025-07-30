import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict, Any
from ..domain import segmentation_service
from ..models.models import SegmentationResponse, SegmentCustomerResponse
from ..utils.auth import get_current_user
from ..utils.data_service import get_all_customers

router = APIRouter(prefix="/segmentation", tags=["customer segmentation"])

class SegmentRequest(BaseModel):
    table_name: str

@router.post("/segment_customers")
async def segment_customers_endpoint(
    request: SegmentRequest,
    current_user: dict = Depends(get_current_user),
    request_obj: Request = None
):
    """
    Segment customers using the K-means model
    """
    try:
        access_token = request_obj.headers.get("Authorization", "").replace("Bearer ", "")
        user_id = current_user["id"]
        table_name = f"user_data_{user_id}"

        customers = await get_all_customers(table_name, access_token)
        
        if not customers:
            raise HTTPException(status_code=404, detail="No customer data found")
        
        df = pd.DataFrame(customers)
        
        segmentation_result = segmentation_service.segment_customers(df)
        behavior_analysis = segmentation_service.get_segment_behavior_analysis(df)
        
        response_data = {
            "segments": segmentation_result["segments"],
            "behavior_analysis": behavior_analysis,
            "total_customers": segmentation_result["total_customers"],
            "customer_data": segmentation_result["customer_data"]
        }
        
        return SegmentCustomerResponse(
            success=True,
            message="Customer segmentation completed successfully",
            data=response_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation error: {str(e)}")

@router.get("/segments/{table_name}/")
async def get_segments(
    table_name: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Get customer segments for a specific table
    """
    try:
       
        access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        user_id = current_user["id"]
        table_name = f"user_data_{user_id}"
        customers = await get_all_customers(table_name, access_token)
        if not customers:
            raise HTTPException(status_code=404, detail="No customer data found")
        
        df = pd.DataFrame(customers)
        
        segmentation_result = segmentation_service.segment_customers(df)
        
        behavior_analysis = segmentation_service.get_segment_behavior_analysis(df)

        return {
            "segments": segmentation_result["segments"],
            "behavior_analysis": behavior_analysis,
            "total_customers": segmentation_result["total_customers"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting segments: {str(e)}")

@router.get("/segment/{customer_id}")
async def get_customer_segment(
    customer_id: int,
    table_name: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Get segment information for a specific customer
    """
    try:
        access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        user_id = current_user["id"]
        table_name = f"user_data_{user_id}"
        customers = await get_all_customers(table_name, access_token)
        
        if not customers:
            raise HTTPException(status_code=404, detail="No customer data found")
        
        df = pd.DataFrame(customers)
        customer_data = df[df['Customer ID'] == customer_id]
        
        if customer_data.empty:
            raise HTTPException(status_code=404, detail="Customer not found")
        segmentation_result = segmentation_service.segment_customers(customer_data)
        
        customer_segment = customer_data.iloc[0]
        
        return {
            "customer_id": customer_id,
            "segment": int(customer_segment['segment']),
            "segment_name": customer_segment['segment_name'],
            "segment_description": segmentation_service.segment_descriptions[int(customer_segment['segment'])],
            "segment_color": segmentation_service.segment_colors[int(customer_segment['segment'])]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting customer segment: {str(e)}")

@router.get("/behavior_analysis/{table_name}")
async def get_behavior_analysis(
    table_name: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Get behavioral analysis for all segments
    """
    try:
        access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        user_id = current_user["id"]
        table_name = f"user_data_{user_id}"
        customers = await get_all_customers(table_name, access_token)
        
        if not customers:
            raise HTTPException(status_code=404, detail="No customer data found")
        df = pd.DataFrame(customers)
        
        behavior_analysis = segmentation_service.get_segment_behavior_analysis(df)
        
        return {
            "behavior_analysis": behavior_analysis,
            "total_customers": len(df)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting behavior analysis: {str(e)}") 