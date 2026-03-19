"""
RAG Engine - Retrieval Augmented Generation for medical knowledge
Uses sentence-transformers for embeddings + FAISS for similarity search
"""
import json
import numpy as np
import os
from pathlib import Path
from typing import List, Dict


class MedicalRAGEngine:

    def __init__(self, knowledge_path: str = None):
        self.knowledge_base: List[Dict] = []
        self.embeddings: np.ndarray = None
        self.model = None
        self.use_embeddings = False

        if knowledge_path is None:
            knowledge_path = str(
                Path(__file__).parent.parent.parent / "data" / "medical_knowledge" / "knowledge_base.json"
            )

        self._load_knowledge(knowledge_path)
        self._try_init_embeddings()

    def _load_knowledge(self, path: str):
        try:
            with open(path, "r") as f:
                self.knowledge_base = json.load(f)
            print(f"[RAG] Loaded {len(self.knowledge_base)} knowledge entries")
        except Exception as e:
            print(f"[RAG] Could not load knowledge base: {e}")
            self.knowledge_base = []

    def _try_init_embeddings(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            texts = [f"{e['title']} {e['content']}" for e in self.knowledge_base]
            if texts:
                self.embeddings = self.model.encode(
                    texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True
                )
                self.use_embeddings = True
                print("[RAG] Semantic search initialized with sentence-transformers")
        except Exception as e:
            print(f"[RAG] Sentence-transformers unavailable, using keyword search: {e}")
            self.use_embeddings = False

    def retrieve(self, query: str, top_k: int = 5, specialty_filter: str = None) -> List[Dict]:
        if not self.knowledge_base:
            return []

        candidates = self.knowledge_base
        if specialty_filter:
            filtered = [e for e in self.knowledge_base if e.get("specialty") == specialty_filter]
            if filtered:
                candidates = filtered

        if self.use_embeddings and self.model is not None:
            return self._semantic_search(query, candidates, top_k)
        else:
            return self._keyword_search(query, candidates, top_k)

    def _semantic_search(self, query: str, candidates: List[Dict], top_k: int) -> List[Dict]:
        query_emb = self.model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        candidate_indices = [i for i, e in enumerate(self.knowledge_base) if e in candidates]
        if not candidate_indices:
            return []

        candidate_embs = self.embeddings[candidate_indices]
        scores = (query_emb @ candidate_embs.T).flatten()
        top_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for idx in top_indices:
            entry = candidates[candidate_indices[idx]].copy()
            entry["relevance_score"] = float(scores[idx])
            results.append(entry)
        return results

    def _keyword_search(self, query: str, candidates: List[Dict], top_k: int) -> List[Dict]:
        query_terms = set(query.lower().split())
        scored = []
        for entry in candidates:
            keywords = set(kw.lower() for kw in entry.get("keywords", []))
            content_words = set((entry["title"] + " " + entry["content"]).lower().split())
            keyword_overlap = len(query_terms & keywords)
            content_overlap = len(query_terms & content_words)
            score = keyword_overlap * 3 + content_overlap * 1
            if score > 0:
                e = entry.copy()
                e["relevance_score"] = float(score)
                scored.append(e)
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored[:top_k]

    def get_context_for_case(self, case_text: str) -> str:
        results = self.retrieve(case_text, top_k=6)
        if not results:
            return "No specific knowledge base entries retrieved."

        lines = ["## Relevant Medical Knowledge (RAG Retrieved)\n"]
        for i, r in enumerate(results, 1):
            score_val = r.get("relevance_score", 0)
            score_pct = int(score_val * 100) if score_val <= 1.0 else int(score_val)
            lines.append(
                f"**[{i}] {r['title']}** (Specialty: {r['specialty']}, Relevance: {score_pct}%)"
            )
            lines.append(r["content"])
            lines.append("")
        return "\n".join(lines)

    def recommend_specialists(self, case_text: str) -> List[str]:
        results = self.retrieve(case_text, top_k=8)
        specialty_scores: Dict[str, float] = {}
        for r in results:
            sp = r.get("specialty", "general_practice")
            specialty_scores[sp] = specialty_scores.get(sp, 0) + r.get("relevance_score", 1.0)

        sorted_specs = sorted(specialty_scores.items(), key=lambda x: x[1], reverse=True)
        return [sp for sp, _ in sorted_specs]