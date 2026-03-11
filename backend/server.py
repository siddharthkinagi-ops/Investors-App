from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import os
import json
import re
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

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

# Use a free-tier eligible Gemini model.
# If this model is unavailable in your account, try:
# "gemini-3-flash-preview"
MODEL_NAME = "gemini-2.5-flash-lite"


class ExtractRequest(BaseModel):
    content: Optional[str] = None
    sourceUrl: Optional[str] = ""


def clean_json_text(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"^```\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


@app.get("/api/")
async def root():
    return {"message": "Investor Database API", "status": "healthy"}


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "backend": "fastapi",
        "provider": "gemini",
        "gemini_configured": bool(api_key),
        "model": MODEL_NAME,
    }


@app.post("/api/extract-investor")
async def extract_investor(payload: ExtractRequest):
    if not client:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing in backend environment",
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
- If a field is not clearly present, leave it blank

sourceUrl: {source_url}

content:
{content}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        raw = response.text or ""
        cleaned = clean_json_text(raw)
        data = json.loads(cleaned)

        return {
            "name": data.get("name", "") or "",
            "institution": data.get("institution", "") or "",
            "title": data.get("title", "") or "",
            "cheque_size": data.get("cheque_size", "") or "",
            "geographies": data.get("geographies", []) or [],
            "sectors": data.get("sectors", []) or [],
            "stage": data.get("stage", "") or "",
            "shareholding": data.get("shareholding", "") or "",
            "email": data.get("email", "") or "",
            "website": data.get("website", "") or "",
            "source": data.get("source", "") or source_url,
            "notes": data.get("notes", "") or "",
        }

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Model returned invalid JSON. Try shorter/cleaner article text.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))