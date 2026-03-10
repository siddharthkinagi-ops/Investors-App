from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os

# Minimal backend - Firebase handles all data operations
app = FastAPI(title="Investor Database API - Firebase Backend")

@app.get("/api/")
async def root():
    return {"message": "Investor Database API - Using Firebase", "status": "healthy"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "backend": "firebase"}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
