from pydantic import BaseModel
    
class ColumnMapping(BaseModel):
    customer_id: str
    customer_name: str
    purchase_date: str
    product_price: str
    quantity: str
    total_purchase_amount: str
    returns: str
    age: str
    gender: str
    payment_method: str
    product_category: str
    churn: str