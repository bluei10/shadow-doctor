import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const SPECIALISTS_META = {
  oncologist:       { name: 'Dr. Sarah Chen',      title: 'Oncologist',           icon: '🔬', color: '#e74c3c' },
  cardiologist:     { name: 'Dr. Michael Torres',  title: 'Cardiologist',          icon: '❤️',  color: '#c0392b' },
  neurologist:      { name: 'Dr. Priya Patel',     title: 'Neurologist',           icon: '🧠', color: '#8e44ad' },
  gp:               { name: 'Dr. James Okafor',    title: 'General Practitioner',  icon: '🩺', color: '#27ae60' },
  ethicist:         { name: 'Dr. Elena Vasquez',   title: 'Clinical Ethicist',     icon: '⚖️',  color: '#d68910' },
  patient_advocate: { name: 'Alex Rivera',          title: 'Patient Advocate',      icon: '🛡️', color: '#2980b9' },
  synthesizer:      { name: 'AI Synthesis',         title: 'Clinical Decision Support', icon: '🤖', color: '#1abc9c' },
};

const PHASE_LABELS = {
  initial_assessment: { label: 'Initial Assessments', step: 1 },
  debate:             { label: 'Cross-Specialty Debate', step: 2 },
  advocacy:           { label: 'Patient Advocacy', step: 3 },
  synthesis:          { label: 'Consensus Synthesis', step: 4 },
};

const SAMPLE_CASES = [
  {
    label: 'Lung Nodule + Weight Loss',
    symptoms: '62-year-old male, 40 pack-year smoker. 3-week history of progressive fatigue, 8kg unintentional weight loss, mild hemoptysis, right-sided chest ache. No fever.',
    labs: 'CBC: mild normocytic anemia (Hb 10.2). LFTs mildly elevated (ALT 65, ALP 120). Ca 11.2 mg/dL (hypercalcemia). LDH 380 U/L. CEA 8.4 ng/mL.',
    imaging: 'Chest CT: 2.8cm spiculated right upper lobe mass. Ipsilateral hilar lymphadenopathy. 2 small hepatic hypodensities.',
    history: 'Active smoker, COPD, hypertension. Father died of lung cancer age 68.',
  },
  {
    label: 'Chest Pain + Syncope',
    symptoms: '54-year-old female, sudden onset crushing central chest pain radiating to left jaw and arm, diaphoresis, nausea. Near-syncope 30 min prior. Onset 2 hours ago.',
    labs: 'hs-Troponin I: 450 ng/L (markedly elevated, normal <26). BNP: 340 pg/mL. CK-MB elevated. D-dimer: 0.8 μg/mL.',
    imaging: 'ECG: ST elevation 3mm V1-V4, reciprocal ST depression in II, III, aVF.',
    history: 'HTN, type 2 DM, hyperlipidemia, BMI 32. Family history of MI in father at 55.',
  },
  {
    label: 'Thunderclap Headache',
    symptoms: '38-year-old female. Severe thunderclap headache onset 2 hours ago. Now confused and drowsy. Neck stiffness. T 38.2 degrees C.',
    labs: 'WBC 14,000 (neutrophilia). CRP 45. LP pending. Blood cultures sent.',
    imaging: 'Non-contrast CT head: no hemorrhage seen. Mild sulcal effacement.',
    history: 'No significant PMH. Oral contraceptives. Recent upper respiratory tract infection 1 week ago.',
  },
];

function MdText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="md-text">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith('## '))  return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith('# '))   return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i}>{formatInline(line.slice(2))}</li>;
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ol-item">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>;
        if (line.trim() === '') return <br key={i} />;
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4)
          return <strong key={i} className="block-strong">{line.slice(2, -2)}</strong>;
        return <p key={i}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={m.index}>{m[1]}</strong>);
    else if (m[2]) parts.push(<em key={m.index}>{m[2]}</em>);
    else if (m[3]) parts.push(<code key={m.index}>{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

function AgentCard({ specialist, phase, response, isStreaming, isActive }) {
  const meta = SPECIALISTS_META[specialist] || SPECIALISTS_META.gp;
  const cardRef = useRef(null);

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isActive]);

  return (
    <div
      ref={cardRef}
      className={`agent-card ${isActive ? 'active' : ''} ${isStreaming ? 'streaming' : ''}`}
      style={{ '--agent-color': meta.color }}
    >
      <div className="agent-header">
        <div className="agent-avatar">
          <span className="agent-icon">{meta.icon}</span>
        </div>
        <div className="agent-info">
          <div className="agent-name">{meta.name}</div>
          <div className="agent-title">{meta.title}</div>
        </div>
        <div className="agent-phase-badge">
          {phase === 'initial' ? 'Initial' : phase === 'debate' ? 'Debate' : 'Challenge'}
        </div>
        {isStreaming && (
          <div className="streaming-indicator">
            <span /><span /><span />
          </div>
        )}
      </div>
      <div className="agent-response">
        {response
          ? <MdText text={response} />
          : isStreaming
          ? <span className="cursor-blink">▍</span>
          : null
        }
      </div>
    </div>
  );
}

function SynthesisPanel({ text, isStreaming }) {
  if (!text && !isStreaming) return null;
  return (
    <div className="synthesis-panel">
      <div className="synthesis-header">
        <span className="synthesis-icon">🤖</span>
        <div>
          <div className="synthesis-title">Clinical Decision Support — Consensus Synthesis</div>
          <div className="synthesis-subtitle">Final recommendation with confidence scoring</div>
        </div>
        {isStreaming && (
          <div className="streaming-indicator large" style={{ marginLeft: 'auto' }}>
            <span /><span /><span />
          </div>
        )}
      </div>
      <div className="synthesis-body">
        {text
          ? <MdText text={text} />
          : <span className="cursor-blink">▍</span>
        }
      </div>
    </div>
  );
}

function ProgressTracker({ currentPhase, completedPhases, agentProgress }) {
  const phases = Object.entries(PHASE_LABELS);
  return (
    <div className="progress-tracker">
      <div className="progress-phases">
        {phases.map(([key, val]) => (
          <div
            key={key}
            className={`progress-phase
              ${currentPhase === key ? 'active' : ''}
              ${completedPhases.includes(key) ? 'done' : ''}`}
          >
            <div className="phase-dot">
              {completedPhases.includes(key) ? '✓' : val.step}
            </div>
            <div className="phase-label">{val.label}</div>
          </div>
        ))}
      </div>
      {agentProgress.length > 0 && (
        <div className="agent-progress-list">
          {agentProgress.map((a, i) => {
            const meta = SPECIALISTS_META[a.specialist] || {};
            return (
              <span
                key={i}
                className={`agent-pill ${a.done ? 'done' : 'active'}`}
                style={{ '--pill-color': meta.color }}
              >
                {meta.icon} {meta.name?.split(' ')[1] || a.specialist}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RAGViewer({ entries }) {
  const [open, setOpen] = useState(false);
  if (!entries || entries.length === 0) return null;
  return (
    <div className="rag-viewer">
      <button className="rag-toggle" onClick={() => setOpen(o => !o)}>
        🗄️ RAG Knowledge Retrieved ({entries.length} entries) {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="rag-entries">
          {entries.map((e, i) => (
            <div key={i} className="rag-entry">
              <div className="rag-entry-header">
                <span className="rag-title">{e.title}</span>
                <span className="rag-specialty">{e.specialty}</span>
                {e.relevance_score != null && (
                  <span className="rag-score">
                    {Math.round(e.relevance_score * (e.relevance_score <= 1 ? 100 : 1))}% match
                  </span>
                )}
              </div>
              <div className="rag-content">{e.content?.slice(0, 200)}…</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [symptoms, setSymptoms]   = useState('');
  const [labs, setLabs]           = useState('');
  const [imaging, setImaging]     = useState('');
  const [history, setHistory]     = useState('');
  const [selectedSpecialists, setSelectedSpecialists] = useState(
    ['oncologist', 'cardiologist', 'neurologist', 'gp', 'ethicist']
  );
  const [includeAdvocate, setIncludeAdvocate] = useState(true);

  const [phase, setPhase]               = useState(null);
  const [currentPhase, setCurrentPhase] = useState('');
  const [completedPhases, setCompletedPhases] = useState([]);
  const [agentProgress, setAgentProgress]     = useState([]);
  const [agentResponses, setAgentResponses]   = useState({});
  const [synthesisText, setSynthesisText]     = useState('');
  const [synthStreaming, setSynthStreaming]    = useState(false);
  const [ragEntries, setRagEntries]           = useState([]);
  const [apiBase, setApiBase]                 = useState('http://localhost:8000');
  const [error, setError]                     = useState('');

  const streamRef          = useRef(null);
  const bottomRef          = useRef(null);
  const agentStreamBuffers = useRef({});

  const loadSample = (sample) => {
    setSymptoms(sample.symptoms);
    setLabs(sample.labs);
    setImaging(sample.imaging);
    setHistory(sample.history || '');
  };

  const toggleSpecialist = (key) => {
    setSelectedSpecialists(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const fetchRAGContext = useCallback(async (caseData) => {
    try {
      const res = await fetch(`${apiBase}/api/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${caseData.symptoms} ${caseData.labs} ${caseData.imaging}`,
          top_k: 6
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRagEntries(data.results || []);
      }
    } catch (e) { /* silent */ }
  }, [apiBase]);

  const startConsultation = async () => {
    if (!symptoms.trim()) { setError('Please describe the patient symptoms.'); return; }
    setError('');
    setPhase('running');
    setCurrentPhase('initial_assessment');
    setCompletedPhases([]);
    setAgentResponses({});
    setSynthesisText('');
    setSynthStreaming(false);
    setAgentProgress([]);
    agentStreamBuffers.current = {};

    const caseData = {
      symptoms,
      labs,
      imaging,
      history,
      specialists: selectedSpecialists,
      include_advocate: includeAdvocate
    };

    fetchRAGContext(caseData);

    try {
      const res = await fetch(`${apiBase}/api/consult/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      streamRef.current = reader;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch (e) { /* skip malformed */ }
          }
        }
      }
    } catch (e) {
      setError(`Connection error: ${e.message}. Make sure the backend is running on ${apiBase}`);
      setPhase(null);
    }
  };

  const handleEvent = (event) => {
    switch (event.type) {
      case 'phase_change':
        setCurrentPhase(event.phase);
        if (event.phase !== 'initial_assessment') {
          setCompletedPhases(prev => {
            const order = ['initial_assessment', 'debate', 'advocacy', 'synthesis'];
            const prevIdx = order.indexOf(event.phase) - 1;
            if (prevIdx >= 0) return [...new Set([...prev, order[prevIdx]])];
            return prev;
          });
        }
        break;

      case 'agent_start': {
        const key = `${event.specialist}_${event.phase}_${Date.now()}`;
        agentStreamBuffers.current[event.specialist] = { key, phase: event.phase, text: '' };
        setAgentResponses(prev => ({
          ...prev,
          [key]: { specialist: event.specialist, phase: event.phase, response: '', streaming: true }
        }));
        setAgentProgress(prev => [...prev, { specialist: event.specialist, done: false }]);
        break;
      }

      case 'agent_token': {
        const buf = agentStreamBuffers.current[event.specialist];
        if (buf) {
          buf.text += event.token;
          setAgentResponses(prev => ({
            ...prev,
            [buf.key]: { ...prev[buf.key], response: buf.text }
          }));
        }
        break;
      }

      case 'agent_done': {
        const buf = agentStreamBuffers.current[event.specialist];
        if (buf) {
          setAgentResponses(prev => ({
            ...prev,
            [buf.key]: { ...prev[buf.key], response: event.response, streaming: false }
          }));
          setAgentProgress(prev =>
            prev.map(a =>
              a.specialist === event.specialist && !a.done ? { ...a, done: true } : a
            )
          );
        }
        break;
      }

      case 'synthesis_start':
        setSynthStreaming(true);
        setCurrentPhase('synthesis');
        break;

      case 'synthesis_token':
        setSynthesisText(prev => prev + event.token);
        break;

      case 'synthesis_done':
        setSynthesisText(event.response);
        setSynthStreaming(false);
        setCompletedPhases(['initial_assessment', 'debate', 'advocacy', 'synthesis']);
        setPhase('done');
        break;

      case 'stream_end':
        if (phase === 'running') setPhase('done');
        break;

      case 'error':
        setError(event.message);
        setPhase('done');
        break;

      default:
        break;
    }
  };

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.cancel(); streamRef.current = null; }
    setPhase('done');
  };

  const reset = () => {
    stopStream();
    setPhase(null);
    setAgentResponses({});
    setSynthesisText('');
    setCompletedPhases([]);
    setCurrentPhase('');
    setAgentProgress([]);
    setRagEntries([]);
    setError('');
  };

  const agentCardList = Object.entries(agentResponses);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <div>
              <div className="logo-title">Shadow Doctor</div>
              <div className="logo-subtitle">Multi-Specialist AI Tumor Board</div>
            </div>
          </div>
          <div className="header-tags">
            <span className="tag">Agentic AI</span>
            <span className="tag">RAG</span>
            <span className="tag">Semantic Search</span>
            <span className="tag">Multi-Agent</span>
          </div>
          <div className="api-input-wrap">
            <input
              className="api-input"
              value={apiBase}
              onChange={e => setApiBase(e.target.value)}
              placeholder="API Base URL"
            />
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="input-panel">
          <div className="panel-title">📋 Patient Case</div>

          <div className="sample-cases">
            <div className="sample-label">Quick load:</div>
            {SAMPLE_CASES.map((s, i) => (
              <button key={i} className="sample-btn" onClick={() => loadSample(s)}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Symptoms & Presentation *</label>
            <textarea
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              rows={4}
              placeholder="Age, sex, chief complaint, duration, associated symptoms..."
            />
          </div>
          <div className="form-group">
            <label>Laboratory Results</label>
            <textarea
              value={labs}
              onChange={e => setLabs(e.target.value)}
              rows={3}
              placeholder="CBC, BMP, troponin, tumor markers, cultures..."
            />
          </div>
          <div className="form-group">
            <label>Imaging Findings</label>
            <textarea
              value={imaging}
              onChange={e => setImaging(e.target.value)}
              rows={3}
              placeholder="CT, MRI, ECG, X-ray findings..."
            />
          </div>
          <div className="form-group">
            <label>Medical History</label>
            <textarea
              value={history}
              onChange={e => setHistory(e.target.value)}
              rows={2}
              placeholder="PMH, medications, allergies, social history..."
            />
          </div>

          <div className="specialist-selector">
            <div className="specialist-label">Specialists to consult:</div>
            <div className="specialist-grid">
              {Object.entries(SPECIALISTS_META)
                .filter(([k]) => !['synthesizer', 'patient_advocate'].includes(k))
                .map(([key, meta]) => (
                  <button
                    key={key}
                    className={`spec-toggle ${selectedSpecialists.includes(key) ? 'selected' : ''}`}
                    onClick={() => toggleSpecialist(key)}
                    style={{ '--spec-color': meta.color }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.title}</span>
                  </button>
                ))}
            </div>
            <label className="advocate-toggle">
              <input
                type="checkbox"
                checked={includeAdvocate}
                onChange={e => setIncludeAdvocate(e.target.checked)}
              />
              Include Patient Advocate 🛡️
            </label>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="start-btn"
            onClick={startConsultation}
            disabled={phase === 'running'}
          >
            {phase === 'running' ? '⏳ Consulting...' : '🚀 Start Consultation'}
          </button>
        </aside>

        <main className="discussion-panel">
          {!phase && (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h2>Virtual Tumor Board</h2>
              <p>
                Enter a patient case on the left to convene your specialist panel.
                The AI agents will debate, challenge each other, and synthesize a consensus recommendation.
              </p>
              <div className="feature-grid">
                <div className="feature">🔬 Agentic AI Workflow</div>
                <div className="feature">🗄️ RAG Knowledge Retrieval</div>
                <div className="feature">🔍 Semantic Search</div>
                <div className="feature">🛡️ Patient Advocate</div>
                <div className="feature">📊 Confidence Scoring</div>
                <div className="feature">⚡ Real-time Streaming</div>
              </div>
            </div>
          )}

          {(phase === 'running' || phase === 'done') && (
            <>
              <div className="discussion-header">
                <div className="discussion-title">Multidisciplinary Tumor Board</div>
                <div className="discussion-actions">
                  {phase === 'running' && (
                    <button className="stop-btn" onClick={stopStream}>⏹ Stop</button>
                  )}
                  <button className="reset-btn" onClick={reset}>↺ New Case</button>
                </div>
              </div>

              <ProgressTracker
                currentPhase={currentPhase}
                completedPhases={completedPhases}
                agentProgress={agentProgress}
              />

              <RAGViewer entries={ragEntries} />

              <div className="agent-discussion">
                {agentCardList.map(([key, data]) => (
                  <AgentCard
                    key={key}
                    specialist={data.specialist}
                    phase={data.phase}
                    response={data.response}
                    isStreaming={data.streaming}
                    isActive={data.streaming}
                  />
                ))}

                <SynthesisPanel text={synthesisText} isStreaming={synthStreaming} />

                <div ref={bottomRef} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}