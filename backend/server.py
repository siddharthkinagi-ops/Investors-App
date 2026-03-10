# from fastapi import FastAPI
# from starlette.middleware.cors import CORSMiddleware
# import os

# # Minimal backend - Firebase handles all data operations
# app = FastAPI(title="Investor Database API - Firebase Backend")

# @app.get("/api/")
# async def root():
#     return {"message": "Investor Database API - Using Firebase", "status": "healthy"}

# @app.get("/api/health")
# async def health():
#     return {"status": "healthy", "backend": "firebase"}

# app.add_middleware(
#     CORSMiddleware,
#     allow_credentials=True,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os
import json
from typing import Optional

load_dotenv()

app = FastAPI(title="Investor Database API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


class ExtractRequest(BaseModel):
    content: Optional[str] = None
    sourceUrl: Optional[str] = ""


@app.get("/api/")
async def root():
    return {"message": "Investor Database API", "status": "healthy"}


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "backend": "fastapi",
        "openai_configured": bool(api_key),
    }


@app.post("/api/extract-investor")
async def extract_investor(payload: ExtractRequest):
    if not client:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing in backend environment",
        )

    content = (payload.content or "").strip()
    source_url = (payload.sourceUrl or "").strip()

    if not content:
        raise HTTPException(status_code=400, detail="content is required")

    prompt = f"""
Extract one investor/contact record from the content below.

Return ONLY valid JSON in this exact shape:
{{
  "name": "",
  "institution": "",
  "title": "",
  "cheque_size": "",
  "geographies": [],
  "sectors": [],
  "stage": "",
  "shareholding": "",
  "email": "",
  "website": "",
  "source": "",
  "notes": ""
}}

Rules:
- Return JSON only
- No markdown
- No explanation
- Use empty strings if unknown
- Use [] if unknown
- "name" = person name
- "institution" = investor firm/fund/company
- "title" = designation
- "source" = use sourceUrl if provided
- "notes" = short summary of why this investor is relevant

sourceUrl: {source_url}

content:
{content}
"""

    try:
        response = client.responses.create(
            model="gpt-5.4",
            input=prompt
        )

        raw = response.output_text.strip()
        data = json.loads(raw)

        return {
            "name": data.get("name", ""),
            "institution": data.get("institution", ""),
            "title": data.get("title", ""),
            "cheque_size": data.get("cheque_size", ""),
            "geographies": data.get("geographies", []) or [],
            "sectors": data.get("sectors", []) or [],
            "stage": data.get("stage", ""),
            "shareholding": data.get("shareholding", ""),
            "email": data.get("email", ""),
            "website": data.get("website", ""),
            "source": data.get("source", "") or source_url,
            "notes": data.get("notes", ""),
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))