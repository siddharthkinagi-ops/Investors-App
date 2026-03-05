from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import io
import pandas as pd
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Investor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    institution: Optional[str] = None
    title: Optional[str] = None
    cheque_size: Optional[str] = None
    geographies: Optional[List[str]] = []
    sectors: Optional[List[str]] = []
    stage: Optional[str] = None
    shareholding: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_new: bool = True

class InvestorCreate(BaseModel):
    name: str
    institution: Optional[str] = None
    title: Optional[str] = None
    cheque_size: Optional[str] = None
    geographies: Optional[List[str]] = []
    sectors: Optional[List[str]] = []
    stage: Optional[str] = None
    shareholding: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class InvestorUpdate(BaseModel):
    name: Optional[str] = None
    institution: Optional[str] = None
    title: Optional[str] = None
    cheque_size: Optional[str] = None
    geographies: Optional[List[str]] = None
    sectors: Optional[List[str]] = None
    stage: Optional[str] = None
    shareholding: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class ExtractRequest(BaseModel):
    content: str

class ExtractResponse(BaseModel):
    investors: List[Investor]
    message: str

# Helper to serialize investor for MongoDB
def serialize_investor(investor: Investor) -> dict:
    doc = investor.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    return doc

def deserialize_investor(doc: dict) -> dict:
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc

# Routes
@api_router.get("/")
async def root():
    return {"message": "Investor Database API"}

@api_router.get("/investors", response_model=List[Investor])
async def get_investors(
    search: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    cheque_size: Optional[str] = Query(None)
):
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"institution": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    if geography:
        query["geographies"] = {"$in": [geography]}
    
    if sector:
        query["sectors"] = {"$in": [sector]}
    
    if stage:
        query["stage"] = stage
    
    if cheque_size:
        query["cheque_size"] = cheque_size
    
    investors = await db.investors.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [deserialize_investor(inv) for inv in investors]

@api_router.get("/investors/new", response_model=List[Investor])
async def get_new_investors():
    """Get investors added in the last 24 hours"""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    investors = await db.investors.find(
        {"created_at": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return [deserialize_investor(inv) for inv in investors]

@api_router.get("/investors/filters")
async def get_filter_options():
    """Get unique values for filter dropdowns"""
    geographies = await db.investors.distinct("geographies")
    sectors = await db.investors.distinct("sectors")
    stages = await db.investors.distinct("stage")
    cheque_sizes = await db.investors.distinct("cheque_size")
    
    return {
        "geographies": [g for g in geographies if g],
        "sectors": [s for s in sectors if s],
        "stages": [s for s in stages if s],
        "cheque_sizes": [c for c in cheque_sizes if c]
    }

@api_router.post("/investors", response_model=Investor)
async def create_investor(input: InvestorCreate):
    investor = Investor(**input.model_dump())
    doc = serialize_investor(investor)
    await db.investors.insert_one(doc)
    return investor

@api_router.put("/investors/{investor_id}", response_model=Investor)
async def update_investor(investor_id: str, input: InvestorUpdate):
    existing = await db.investors.find_one({"id": investor_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Investor not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.investors.update_one(
            {"id": investor_id},
            {"$set": update_data}
        )
    
    updated = await db.investors.find_one({"id": investor_id}, {"_id": 0})
    return deserialize_investor(updated)

@api_router.delete("/investors/{investor_id}")
async def delete_investor(investor_id: str):
    result = await db.investors.delete_one({"id": investor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Investor not found")
    return {"message": "Investor deleted successfully"}

@api_router.post("/extract-investors", response_model=ExtractResponse)
async def extract_investors(request: ExtractRequest):
    """Extract investor information from pasted content using AI"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="""You are an expert at extracting investor information from articles and news content.
            
Extract investor details from the provided content and return them in a structured JSON format.
For each investor found, extract:
- name: Full name of the investor
- institution: Name of the fund, company, or institution
- title: Their role/title (e.g., "Partner", "Managing Director", "Angel Investor")
- cheque_size: Average investment amount (e.g., "$500K-$2M", "₹1-5 Cr")
- geographies: List of regions they invest in (e.g., ["India", "Southeast Asia"])
- sectors: List of sectors they focus on (e.g., ["Fintech", "SaaS", "HealthTech"])
- stage: Investment stage (e.g., "Seed", "Series A", "Growth")
- shareholding: Typical equity percentage (e.g., "10-20%")
- email: Email address if mentioned
- website: Website URL if mentioned
- source: Source of the information

Return ONLY a valid JSON array of investor objects. If no investors are found, return an empty array [].
Example response format:
[
  {
    "name": "John Doe",
    "institution": "ABC Ventures",
    "title": "Partner",
    "cheque_size": "$1-5M",
    "geographies": ["USA", "India"],
    "sectors": ["Fintech", "SaaS"],
    "stage": "Series A",
    "shareholding": "15-25%",
    "email": "john@abcventures.com",
    "website": "https://abcventures.com",
    "source": "Article from Inc42"
  }
]"""
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"Extract all investor information from the following content:\n\n{request.content}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        try:
            # Clean up the response - remove markdown code blocks if present
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            investors_data = json.loads(cleaned_response)
            
            if not isinstance(investors_data, list):
                investors_data = [investors_data]
            
            created_investors = []
            for inv_data in investors_data:
                if inv_data.get('name'):
                    investor = Investor(
                        name=inv_data.get('name', ''),
                        institution=inv_data.get('institution'),
                        title=inv_data.get('title'),
                        cheque_size=inv_data.get('cheque_size'),
                        geographies=inv_data.get('geographies', []),
                        sectors=inv_data.get('sectors', []),
                        stage=inv_data.get('stage'),
                        shareholding=inv_data.get('shareholding'),
                        email=inv_data.get('email'),
                        website=inv_data.get('website'),
                        source=inv_data.get('source'),
                        is_new=True
                    )
                    doc = serialize_investor(investor)
                    await db.investors.insert_one(doc)
                    created_investors.append(investor)
            
            return ExtractResponse(
                investors=created_investors,
                message=f"Successfully extracted {len(created_investors)} investor(s)"
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {response}")
            raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
            
    except Exception as e:
        logger.error(f"AI extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")

@api_router.get("/investors/export")
async def export_investors(
    search: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    stage: Optional[str] = Query(None)
):
    """Export investors to Excel"""
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"institution": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}}
        ]
    
    if geography:
        query["geographies"] = {"$in": [geography]}
    
    if sector:
        query["sectors"] = {"$in": [sector]}
    
    if stage:
        query["stage"] = stage
    
    investors = await db.investors.find(query, {"_id": 0}).to_list(10000)
    
    # Prepare data for Excel
    data = []
    for inv in investors:
        data.append({
            "Name": inv.get("name", ""),
            "Institution/Fund": inv.get("institution", ""),
            "Title": inv.get("title", ""),
            "Cheque Size": inv.get("cheque_size", ""),
            "Geographies": ", ".join(inv.get("geographies", [])),
            "Sectors": ", ".join(inv.get("sectors", [])),
            "Stage": inv.get("stage", ""),
            "Shareholding": inv.get("shareholding", ""),
            "Email": inv.get("email", ""),
            "Website": inv.get("website", ""),
            "Source": inv.get("source", ""),
            "Notes": inv.get("notes", ""),
            "Added On": inv.get("created_at", "")
        })
    
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Investors')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=investor_database.xlsx"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
