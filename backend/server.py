# server.py

from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
import os
import json
import re

load_dotenv()

app = FastAPI(title="Investor Discovery API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

MODEL_NAME = "gemini-2.5-flash"

grounding_tool = types.Tool(
    google_search=types.GoogleSearch()
)

class DiscoverRequest(BaseModel):
    sector: str = ""
    geography: str = ""
    stage: str = ""
    count: int = 5

def clean_json_text(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"^```\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "provider": "gemini",
        "gemini_configured": bool(api_key),
        "model": MODEL_NAME,
    }

@app.post("/api/discover-investors")
async def discover_investors(payload: DiscoverRequest):
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing")

    sector = (payload.sector or "").strip()
    geography = (payload.geography or "").strip()
    stage = (payload.stage or "").strip()
    count = max(1, min(payload.count or 5, 20))

    prompt = f"""
Find {count} real investors or investor-firm contacts currently active in {geography or "the target market"}.

Focus:
- sector: {sector or "general venture investing"}
- stage: {stage or "early stage"}

Requirements:
- Prefer named investors, partners, principals, managing directors, or clearly identified fund contacts
- Use current web information
- Prefer investors actually relevant to the given sector/geography/stage
- Return ONLY valid JSON
- No markdown
- No explanation

Return this exact JSON shape:
{{
  "investors": [
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
  ]
}}
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[grounding_tool]
            ),
        )

        raw = response.text or ""
        cleaned = clean_json_text(raw)
        parsed = json.loads(cleaned)

        investors = parsed.get("investors", [])

        # Optional: collect grounded source URLs from Gemini metadata
        source_urls = []
        try:
            chunks = response.candidates[0].grounding_metadata.grounding_chunks
            for chunk in chunks:
                uri = getattr(getattr(chunk, "web", None), "uri", None)
                if uri and uri not in source_urls:
                    source_urls.append(uri)
        except Exception:
            pass

        return {
            "investors": investors,
            "sources": source_urls
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Gemini returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))