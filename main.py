from fastapi import FastAPI
from . import models
from .database import engine

app = FastAPI()

models.Base.metadata.create_all(bind=engine)
models.create_table_from_csv('ecommerce_customer_data_large.csv', 'customer_data', engine)
models.insert_csv_data_to_table('ecommerce_customer_data_large.csv', 'customer_data', engine)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
