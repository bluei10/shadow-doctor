"""
Agent Orchestrator - manages the multi-agent debate cycle
Updated to use Google Gemini API
"""
import asyncio
import os
from typing import AsyncGenerator, List, Dict
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

from .agent_definitions import (
    SPECIALIST_PERSONAS,
    get_debate_prompt,
    get_synthesis_prompt
)

# Configure Gemini with API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class ShadowDoctorOrchestrator:
    """
    Orchestrates the multi-agent debate between specialist personas.
    Uses Google Gemini 1.5 Pro for all agents.

    Workflow:
    1. RAG retrieval to build context
    2. Round 1: Each specialist gives initial assessment
    3. Round 2: Specialists respond to each other (debate)
    4. Patient advocate challenges the plan
    5. Final synthesis with confidence score
    """

    def __init__(self):
        self.model_name = "gemini-1.5-pro"

    def _get_model(self, system_prompt: str):
        """Create a Gemini model instance with a system prompt."""
        return genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=800,
            )
        )

    async def stream_agent(
        self,
        specialist_key: str,
        patient_case: str,
        rag_context: str,
        previous_discussion: str = "",
        max_tokens: int = 600
    ) -> AsyncGenerator[str, None]:
        """Stream a single specialist response token by token using Gemini."""

        persona = SPECIALIST_PERSONAS[specialist_key]

        # Build user message content
        user_content = f"""## Retrieved Medical Knowledge (RAG Context)
{rag_context}

## Patient Case
{patient_case}
"""
        if previous_discussion and specialist_key != "synthesizer":
            user_content += f"""
## Previous Discussion from Colleagues
{previous_discussion}

Please respond to your colleagues points where relevant, building on the discussion.
"""
        elif not previous_discussion:
            user_content += "\nPlease provide your initial specialist assessment."

        if specialist_key == "synthesizer":
            user_content = f"""## Retrieved Medical Knowledge (RAG Context)
{rag_context}

## Patient Case
{patient_case}

## Full Multidisciplinary Discussion
{previous_discussion}

Now provide your complete synthesis following the format in your instructions.
"""

        # Set max tokens based on agent type
        output_tokens = 1500 if specialist_key == "synthesizer" else max_tokens

        try:
            # Create model with system prompt
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=persona["system_prompt"],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=output_tokens,
                )
            )

            # Run the blocking Gemini stream call in a thread
            # because Gemini's Python SDK is synchronous
            loop = asyncio.get_event_loop()

            def run_gemini_stream():
                return model.generate_content(user_content, stream=True)

            response = await loop.run_in_executor(None, run_gemini_stream)

            # Stream the chunks
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    # Small sleep to prevent overwhelming the frontend
                    await asyncio.sleep(0.01)

        except Exception as e:
            yield f"\n[Gemini streaming error for {specialist_key}: {str(e)}]"

    async def run_full_debate(
        self,
        patient_case: str,
        rag_context: str,
        selected_specialists: List[str],
        include_advocate: bool = True
    ) -> AsyncGenerator[Dict, None]:
        """
        Run the full agentic debate workflow, yielding events for SSE streaming.

        Event types:
        - agent_start:    { type, specialist, name, title, icon, color, phase }
        - agent_token:    { type, specialist, token }
        - agent_done:     { type, specialist, response, phase }
        - phase_change:   { type, phase, description }
        - synthesis_start:{ type }
        - synthesis_token:{ type, token }
        - synthesis_done: { type, response }
        - complete:       { type, total_agents }
        """

        full_discussion_text = ""

        # ── Phase 1: Initial assessments ─────────────────────────────────────
        yield {
            "type": "phase_change",
            "phase": "initial_assessment",
            "description": "Round 1: Initial specialist assessments"
        }

        for specialist_key in selected_specialists:
            persona = SPECIALIST_PERSONAS[specialist_key]

            yield {
                "type": "agent_start",
                "specialist": specialist_key,
                "name": persona["name"],
                "title": persona["title"],
                "icon": persona["icon"],
                "color": persona["color"],
                "phase": "initial"
            }

            response_text = ""
            async for token in self.stream_agent(
                specialist_key,
                patient_case,
                rag_context,
                max_tokens=500
            ):
                yield {"type": "agent_token", "specialist": specialist_key, "token": token}
                response_text += token

            full_discussion_text += (
                f"\n\n**{persona['name']} ({persona['title']}) - Initial Assessment:**\n"
                f"{response_text}"
            )

            yield {
                "type": "agent_done",
                "specialist": specialist_key,
                "response": response_text,
                "phase": "initial"
            }

        # ── Phase 2: Debate round ─────────────────────────────────────────────
        yield {
            "type": "phase_change",
            "phase": "debate",
            "description": "Round 2: Cross-specialty debate and clarification"
        }

        debate_specialists = (
            selected_specialists[:3]
            if len(selected_specialists) > 3
            else selected_specialists
        )

        for specialist_key in debate_specialists:
            persona = SPECIALIST_PERSONAS[specialist_key]

            yield {
                "type": "agent_start",
                "specialist": specialist_key,
                "name": persona["name"],
                "title": persona["title"],
                "icon": persona["icon"],
                "color": persona["color"],
                "phase": "debate"
            }

            response_text = ""
            async for token in self.stream_agent(
                specialist_key,
                patient_case,
                rag_context,
                previous_discussion=full_discussion_text,
                max_tokens=400
            ):
                yield {"type": "agent_token", "specialist": specialist_key, "token": token}
                response_text += token

            full_discussion_text += (
                f"\n\n**{persona['name']} - Debate Response:**\n{response_text}"
            )

            yield {
                "type": "agent_done",
                "specialist": specialist_key,
                "response": response_text,
                "phase": "debate"
            }

        # ── Phase 3: Patient advocate ─────────────────────────────────────────
        if include_advocate:
            yield {
                "type": "phase_change",
                "phase": "advocacy",
                "description": "Patient Advocate challenges the plan"
            }

            advocate_persona = SPECIALIST_PERSONAS["patient_advocate"]

            yield {
                "type": "agent_start",
                "specialist": "patient_advocate",
                "name": advocate_persona["name"],
                "title": advocate_persona["title"],
                "icon": advocate_persona["icon"],
                "color": advocate_persona["color"],
                "phase": "advocacy"
            }

            response_text = ""
            async for token in self.stream_agent(
                "patient_advocate",
                patient_case,
                rag_context,
                previous_discussion=full_discussion_text,
                max_tokens=400
            ):
                yield {"type": "agent_token", "specialist": "patient_advocate", "token": token}
                response_text += token

            full_discussion_text += (
                f"\n\n**{advocate_persona['name']} (Patient Advocate) - Challenge:**\n"
                f"{response_text}"
            )

            yield {
                "type": "agent_done",
                "specialist": "patient_advocate",
                "response": response_text,
                "phase": "advocacy"
            }

        # ── Phase 4: Final synthesis ──────────────────────────────────────────
        yield {
            "type": "phase_change",
            "phase": "synthesis",
            "description": "Final synthesis and consensus recommendation"
        }

        yield {"type": "synthesis_start"}

        synthesis_text = ""
        async for token in self.stream_agent(
            "synthesizer",
            patient_case,
            rag_context,
            previous_discussion=full_discussion_text,
            max_tokens=1500
        ):
            yield {"type": "synthesis_token", "token": token}
            synthesis_text += token

        yield {"type": "synthesis_done", "response": synthesis_text}
        yield {"type": "complete", "total_agents": len(selected_specialists) + 2}