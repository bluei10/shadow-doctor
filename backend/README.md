# Shadow Doctor - Multi-Specialist AI Tumor Board

A multi-agent AI system that simulates a real multidisciplinary tumor board.
Multiple specialist AI agents debate a patient case and converge on a
consensus recommendation with confidence score.

## Tech Stack

- Backend: FastAPI + Python
- Frontend: React
- AI: Google Gemini 1.5 Pro
- RAG: FAISS + Sentence Transformers
- Streaming: Server-Sent Events (SSE)

## AI Techniques Used

- Agentic AI Workflow
- RAG (Retrieval Augmented Generation)
- Semantic Search
- Multi-Agent Swarm
- Confidence Scoring

## Setup Instructions

### Backend

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

Create backend/.env file with:
GEMINI_API_KEY=AIzaSyDBEy24Q1i7rFB8UzUxEXSfQ0YhhzuQbT8

python api/main.py

### Frontend

cd frontend
npm install
npm start

## Specialists

- Dr. Sarah Chen - Oncologist
- Dr. Michael Torres - Cardiologist
- Dr. Priya Patel - Neurologist
- Dr. James Okafor - General Practitioner
- Dr. Elena Vasquez - Clinical Ethicist
- Alex Rivera - Patient Advocate
- AI Synthesis Engine - Final Recommendation
