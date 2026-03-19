# 🏥 Shadow Doctor — Multi-Specialist AI Tumor Board

A production-grade Agentic AI system that simulates a real multidisciplinary tumor board. Multiple specialist AI agents debate a patient case and converge on a consensus recommendation with a confidence score.

---

## 🌟 Overview

Shadow Doctor brings together multiple specialist AI personas to debate and analyze complex patient cases. Enter symptoms, lab results, and imaging findings and watch 7 AI specialists discuss, debate, challenge each other, and synthesize a final recommendation with a confidence score.

---

## ✨ Features

- 🔬 Multi-Agent Swarm — 5 specialist doctors + 1 patient advocate + 1 synthesizer
- 🗄️ RAG Pipeline — FAISS vector search over medical knowledge base
- 🔍 Semantic Search — sentence-transformers embeddings for intelligent retrieval
- 📊 Recommendation System — automatically suggests most relevant specialists
- ⚡ Real-time Streaming — Server-Sent Events for live token streaming
- 🛡️ Patient Advocate — challenges overly aggressive or expensive plans
- 📈 Confidence Scoring — final synthesis includes LOW/MODERATE/HIGH confidence percentage
- 🎨 Dark Medical UI — professional clinical-grade interface

---

## 🧠 AI Techniques Used

| Technique             | Implementation                     | File                 |
| --------------------- | ---------------------------------- | -------------------- |
| Agentic AI Workflow   | 4-round debate orchestration       | orchestrator.py      |
| RAG                   | FAISS + sentence-transformers      | rag_engine.py        |
| Semantic Search       | cosine similarity over embeddings  | rag_engine.py        |
| Recommendation System | specialty scoring from RAG results | rag_engine.py        |
| Multi-Agent Swarm     | 7 specialist personas              | agent_definitions.py |
| SSE Streaming         | real-time token streaming          | main.py              |
| Confidence Scoring    | LOW/MODERATE/HIGH + percentage     | agent_definitions.py |
| Prompt Engineering    | role-based specialist prompts      | agent_definitions.py |

---

## 🏗️ Architecture

```
Patient Case Input
      │
      ▼
RAG Engine (FAISS)
Semantic Search + Keyword Fallback
Specialist Recommendation System
      │
      ▼
AGENT SWARM

Round 1 — Initial Assessments
Oncologist + Cardiologist + Neurologist + GP + Ethicist

Round 2 — Cross-Specialty Debate
Specialists respond to each other

Round 3 — Patient Advocate Challenge
Challenges aggressive and expensive plans

Round 4 — Final Synthesis
Consensus + Confidence Score + Red Flags
      │
      ▼
React Frontend — Real-time token streaming
```

---

## 🎭 The 7 Specialist Agents

| Agent | Persona             | Specialty                             |
| ----- | ------------------- | ------------------------------------- |
| 🔬    | Dr. Sarah Chen      | Senior Oncologist                     |
| ❤️    | Dr. Michael Torres  | Interventional Cardiologist           |
| 🧠    | Dr. Priya Patel     | Neurologist and Epileptologist        |
| 🩺    | Dr. James Okafor    | General Practitioner and Hospitalist  |
| ⚖️    | Dr. Elena Vasquez   | Clinical Ethicist and Palliative Care |
| 🛡️    | Alex Rivera         | Patient Advocate                      |
| 🤖    | AI Synthesis Engine | Final consensus and confidence score  |

---

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.11
- Node.js 18+
- Google Gemini API key — free at https://aistudio.google.com

### 1. Clone the Repository

```
git clone https://github.com/bluei10/shadow-doctor.git
cd shadow-doctor
```

### 2. Backend Setup

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create backend/.env file:

```
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Frontend Setup

```
cd frontend
npm install
```

---

## 🚀 How to Run

### Terminal 1 — Start Backend

```
cd backend
venv\Scripts\activate
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at http://localhost:8000

### Terminal 2 — Start Frontend

```
cd frontend
npm start
```

Frontend runs at http://localhost:3000

---

## 📁 Project Structure

```
shadow-doctor/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── agent_definitions.py
│   │   └── orchestrator.py
│   ├── rag/
│   │   ├── __init__.py
│   │   └── rag_engine.py
│   ├── api/
│   │   └── main.py
│   └── requirements.txt
├── data/
│   └── medical_knowledge/
│       └── knowledge_base.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── App.css
│       └── index.js
├── shadow_doctor_standalone.html
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint                       | Description                     |
| ------ | ------------------------------ | ------------------------------- |
| GET    | /api/health                    | Health check                    |
| GET    | /api/specialists               | List all specialists            |
| POST   | /api/consult/stream            | Main SSE streaming consultation |
| POST   | /api/rag/search                | Search medical knowledge base   |
| POST   | /api/rag/recommend-specialists | Get specialist recommendations  |

---

## 🏥 Sample Cases Included

### Case 1 — Lung Nodule and Weight Loss

62-year-old male smoker with 8kg weight loss, hemoptysis, and 2.8cm spiculated lung mass.

### Case 2 — Chest Pain and Syncope

54-year-old female with crushing chest pain, ST elevation on ECG, and markedly elevated troponin.

### Case 3 — Thunderclap Headache

38-year-old female with worst headache of her life, neck stiffness, and confusion.

---

## 🛠️ Tech Stack

| Layer             | Technology                             |
| ----------------- | -------------------------------------- |
| AI Provider       | Google Gemini 1.5 Pro                  |
| Backend Framework | FastAPI                                |
| Streaming         | Server-Sent Events SSE                 |
| Vector Search     | FAISS                                  |
| Embeddings        | sentence-transformers all-MiniLM-L6-v2 |
| Frontend          | React 18                               |
| Runtime           | Python 3.11 and Node.js 18             |

---

## ⚠️ Disclaimer

This is an AI research and demonstration project only. Not intended for actual clinical use. AI agents may produce incorrect medical information. Never use for real medical decision making. Always consult qualified healthcare professionals.

---

## 📄 License

MIT License — free to use and modify.

---

Built with FastAPI, React, Google Gemini, FAISS, and sentence-transformers
