"""
Shadow Doctor API - FastAPI backend with SSE streaming
Using Google Gemini API
"""
import json
import os
import sys
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.orchestrator import ShadowDoctorOrchestrator
from agents.agent_definitions import SPECIALIST_PERSONAS
from rag.rag_engine import MedicalRAGEngine

app = FastAPI(title="Shadow Doctor API - Gemini", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_engine = MedicalRAGEngine()


class PatientCase(BaseModel):
    symptoms: str
    labs: Optional[str] = ""
    imaging: Optional[str] = ""
    history: Optional[str] = ""
    specialists: Optional[List[str]] = [
        "oncologist", "cardiologist", "neurologist", "gp", "ethicist"
    ]
    include_advocate: Optional[bool] = True


class RAGQuery(BaseModel):
    query: str
    specialty: Optional[str] = None
    top_k: Optional[int] = 5


def build_case_text(case: PatientCase) -> str:
    parts = []
    if case.symptoms:
        parts.append(f"**Presenting Symptoms:** {case.symptoms}")
    if case.history:
        parts.append(f"**Medical History:** {case.history}")
    if case.labs:
        parts.append(f"**Laboratory Results:** {case.labs}")
    if case.imaging:
        parts.append(f"**Imaging Findings:** {case.imaging}")
    return "\n\n".join(parts)


@app.get("/api/health")
async def health_check():
    gemini_key_set = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "provider": "Google Gemini",
        "model": "gemini-1.5-pro",
        "gemini_key_configured": gemini_key_set,
        "rag_entries": len(rag_engine.knowledge_base),
        "semantic_search": rag_engine.use_embeddings,
    }


@app.get("/api/specialists")
async def get_specialists():
    return {
        k: {
            "name": v["name"],
            "title": v["title"],
            "icon": v["icon"],
            "color": v["color"],
            "focus": v["focus"]
        }
        for k, v in SPECIALIST_PERSONAS.items()
        if k != "synthesizer"
    }


@app.post("/api/rag/search")
async def rag_search(query: RAGQuery):
    results = rag_engine.retrieve(
        query.query,
        top_k=query.top_k,
        specialty_filter=query.specialty
    )
    return {"results": results, "count": len(results)}


@app.post("/api/rag/recommend-specialists")
async def recommend_specialists(query: RAGQuery):
    recommended = rag_engine.recommend_specialists(query.query)
    return {"recommended": recommended}


@app.post("/api/consult/stream")
async def stream_consultation(case: PatientCase):
    case_text = build_case_text(case)
    rag_context = rag_engine.get_context_for_case(case_text)

    valid_specialists = [
        s for s in case.specialists
        if s in SPECIALIST_PERSONAS and s != "synthesizer"
    ]
    if not valid_specialists:
        valid_specialists = ["gp", "cardiologist", "oncologist"]

    orchestrator = ShadowDoctorOrchestrator()

    async def event_generator():
        try:
            async for event in orchestrator.run_full_debate(
                patient_case=case_text,
                rag_context=rag_context,
                selected_specialists=valid_specialists,
                include_advocate=case.include_advocate
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'stream_end'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/consult/rag-context")
async def get_rag_context(case: PatientCase):
    case_text = build_case_text(case)
    context = rag_engine.get_context_for_case(case_text)
    recommended = rag_engine.recommend_specialists(case_text)
    return {
        "rag_context": context,
        "recommended_specialists": recommended,
        "case_text": case_text,
        "provider": "Google Gemini"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)