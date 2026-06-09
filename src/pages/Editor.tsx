import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useDiagramStore } from '../store/diagramStore';
import { DiagramStage } from '../components/canvas/DiagramStage';
import { Toolbar } from '../components/toolbar/Toolbar';
import { PropertiesPanel } from '../components/panels/PropertiesPanel';
import { ExecutionControls } from '../components/execution/ExecutionControls';
import { DynamicFormPanel } from '../components/execution/DynamicFormPanel';
import { NodeConfigPanel } from '../components/execution/NodeConfigPanel';
import { useExecutionStore } from '../store/executionStore';
import { AuditoriaModal } from '../components/execution/AuditoriaModal';
import { DocumentRepository } from '../components/documents/DocumentRepository';
import { AIPredictionModal } from '../components/execution/AIPredictionPanel';

/* ══════════════════════════════════════════════════
   Editor Principal — Retro Vintage Pastel
   ══════════════════════════════════════════════════ */
const Editor: React.FC = () => {
  const { state, setState, activeConfigNodeId, isLeftPanelOpen, isRightPanelOpen, toggleLeftPanel, toggleRightPanel } = useDiagramStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const executionMode = useExecutionStore(state => state.mode);

  const [diagramName, setDiagramName] = React.useState(state.name || 'Diagrama sin título');
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isAuditoriaModalOpen, setIsAuditoriaModalOpen] = React.useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = React.useState(false);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [activeInstances, setActiveInstances] = React.useState<any[]>([]);
  const [activeInstanceBanner, setActiveInstanceBanner] = React.useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [isAiReportPromptOpen, setIsAiReportPromptOpen] = React.useState(false);
  const [aiReportPrompt, setAiReportPrompt] = React.useState('');

  React.useEffect(() => {
    if (state.name) setDiagramName(state.name);
  }, [state.name]);

  React.useEffect(() => {
    if (!id) return;
    const fetchActiveInstances = async () => {
      try {
        const tokenLocal = localStorage.getItem('token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiBase}/execute/diagram/${id}/active`, {
          headers: { Authorization: `Bearer ${tokenLocal}` }
        });
        if (res.ok) {
          const data = await res.json();
          setActiveInstances(data);
          if (data.length > 0) {
            setActiveInstanceBanner(`Ejecución en curso por ${data[0].startedBy?.name || 'otro usuario'}`);
          }
        }
      } catch (e) { /* sin conexión */ }
    };
    fetchActiveInstances();
    const interval = setInterval(fetchActiveInstances, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (!id) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/diagrams/${id}`, {
        name: diagramName,
        content: { ...state, name: diagramName }
      });
      alert('Diagrama guardado en la nube.');
    } catch (e) {
      alert('Error al guardar el diagrama.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await api.post('/ai/generate', { prompt: aiPrompt, currentDiagram: state });
      setState(res.data);
      setIsAiModalOpen(false);
      setAiPrompt('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al generar con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta Reconocimiento de Voz nativo. Usa Chrome o Edge.');
      return;
    }
    if (isRecording) { setIsRecording(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      let t = '';
      for (let i = event.resultIndex; i < event.results.length; i++) t += event.results[i][0].transcript;
      setAiPrompt(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + t);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setTimeout(() => { try { recognition.stop(); } catch (e) {} }, 10000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await api.post(`/diagrams/${id}/invite`, { email: inviteEmail, canEdit: true, canSave: true, canDelete: false });
      alert('Invitación enviada exitosamente.');
      setIsShareModalOpen(false);
      setInviteEmail('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al enviar invitación.');
    }
  };

  /* ──────────── ESTILOS DE BOTONES DEL HEADER ──────────── */
  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', borderRadius: '7px',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    letterSpacing: '0.3px', border: '1px solid',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div id="root" className="app-layout">
      {/* ══════════ HEADER DEL EDITOR ══════════ */}
      <header className="header" style={{ padding: '0 16px', gap: '12px' }}>

        {/* ── Grupo 1: Logo + Nombre del diagrama ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
          <div
            onClick={() => navigate('/dashboard')}
            title="Volver al Dashboard"
            style={{
              cursor: 'pointer', width: '34px', height: '34px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(39, 0, 236, 1), rgb(80,45,82))',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(15, 8, 236, 0.7)',
              boxShadow: '0 0 12px rgba(30, 7, 211, 0.45)',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(228, 204, 21, 1)" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
                onBlur={() => useDiagramStore.getState().setState({ ...state, name: diagramName })}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#f8fafc', 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  outline: 'none',
                  borderBottom: '1px solid transparent',
                  padding: '2px 0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = '#3b82f6'}
                onBlurCapture={(e) => e.target.style.borderBottomColor = 'transparent'}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
              <span style={{ cursor: 'pointer' }}>Archivo</span>
              <span style={{ cursor: 'pointer' }}>Editar</span>
              <span style={{ cursor: 'pointer', color: '#3b82f6' }} onClick={() => setIsShareModalOpen(true)}>Compartir</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {executionMode === 'play' && (
            <button 
              className="header-action-btn"
              style={{ borderColor: '#a855f7', color: '#a855f7' }}
              onClick={() => setIsPredictionModalOpen(true)}
            >
              🔮 Predicción IA
            </button>
          )}
          <button 
            className="header-action-btn" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          
          <button 
            className="header-action-btn"
            style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
            onClick={() => navigate(`/d/${id}/metrics`)}
          >
            📊 Dashboard KPI
          </button>

          {/* Documentos */}
          <button
            onClick={() => setIsDocsModalOpen(true)}
          >
            🗂️ Docs
          </button>

          {/* Reporte IA */}
          <button
            onClick={() => setIsAiReportPromptOpen(true)}
            title="Reporte de auditoría IA"
            style={{ ...btnBase, background: 'rgba(240,233,182,0.08)', borderColor: 'rgba(240,233,182,0.25)', color: 'rgb(200,190,130)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,233,182,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(240,233,182,0.08)'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Reporte AI
          </button>
        </div>

        {/* ── Separador vertical ── */}
        <div style={{ width: '1px', height: '32px', background: 'rgba(116,69,119,0.3)', flexShrink: 0 }} />

        {/* ── Grupo 3: IA (botón destacado) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
          {executionMode === 'play' && (
            <button
              onClick={() => setIsPredictionModalOpen(true)}
              title="Predicción de flujo con IA"
              style={{ ...btnBase, background: 'rgba(116,69,119,0.2)', borderColor: 'rgba(116,69,119,0.5)', color: 'rgb(152,100,156)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(116,69,119,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(116,69,119,0.2)'; e.currentTarget.style.transform = 'none'; }}
            >
              🔮 Predicción
            </button>
          )}

          {/* AI Assistant — botón principal */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            title="Asistente IA para generar diagramas"
            style={{
              ...btnBase,
              background: 'linear-gradient(135deg, rgba(132,197,177,0.25), rgba(116,69,119,0.25))',
              borderColor: 'rgba(132,197,177,0.5)',
              color: 'rgb(132,197,177)',
              padding: '7px 16px',
              boxShadow: '0 0 16px rgba(132,197,177,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(132,197,177,0.4), rgba(116,69,119,0.4))';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(132,197,177,0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(132,197,177,0.25), rgba(116,69,119,0.25))';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(132,197,177,0.2)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm0 16a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM4 10a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm16 0a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2z" />
              <path d="M12 6v4M12 14v4M6 12h4M14 12h4" />
            </svg>
            AI Assistant
          </button>
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Grupo 4: Avatar de usuario ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(132,197,177), rgb(90,155,135))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: 'rgb(26,15,30)',
            border: '2px solid rgba(132,197,177,0.4)',
            flexShrink: 0
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(240,233,182,0.6)', fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </span>
        </div>
      </header>

      {/* ══════════ ÁREA PRINCIPAL ══════════ */}
      <main className="main-content">

        {/* LEFT SIDEBAR — Formas UML */}
        <aside className={`sidebar left-sidebar ${isLeftPanelOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            Elementos UML
          </div>
          <div className="sidebar-scrollable">
            <Toolbar />
          </div>
        </aside>

        <div className="toggle-btn toggle-left" onClick={toggleLeftPanel} style={{ left: isLeftPanelOpen ? '228px' : '0' }}>
          {isLeftPanelOpen ? '◀' : '▶'}
        </div>

        {/* WORKSPACE (CANVAS) — fondo blanco */}
        <div id="grid-container" className="workspace-container">
          <DiagramStage roomId={id} />

          {/* Status bar */}
          <div className="status-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>{state.nodes.length} nodos · {state.arrows.length} flechas · {state.lanes.length} calles</span>
            {activeInstanceBanner && executionMode !== 'play' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px', color: 'rgba(232, 220, 220, 1)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(200,100,100)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  {activeInstanceBanner}
                </span>
                <button
                  onClick={() => {
                    const inst = activeInstances[0];
                    if (inst?.activeTokens?.length > 0) {
                      const { startExecution, setMode } = useExecutionStore.getState();
                      setMode('play');
                      startExecution(inst.activeTokens[0].currentNodeId, inst.id);
                    }
                  }}
                  style={{
                    fontSize: '11px', padding: '2px 8px',
                    background: 'rgba(200,100,100,0.2)',
                    color: 'rgb(200,100,100)',
                    border: '1px solid rgba(200,100,100,0.4)',
                    borderRadius: '4px', cursor: 'pointer',
                    fontFamily: "'Space Mono', monospace"
                  }}
                >
                  Unirse ▶
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="toggle-btn toggle-right" onClick={toggleRightPanel} style={{ right: isRightPanelOpen ? '284px' : '0' }}>
          {isRightPanelOpen ? '▶' : '◀'}
        </div>

        {/* RIGHT SIDEBAR — Propiedades */}
        <aside className={`sidebar right-sidebar ${isRightPanelOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Propiedades
          </div>
          <div className="sidebar-scrollable">
            <PropertiesPanel />
          </div>
        </aside>
      </main>

      {/* ══════════ MODAL: AI ASSISTANT ══════════ */}
      {isAiModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,5,14,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(6px)'
        }}>
          <div className="saas-card fade-in" style={{ width: '540px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(132,197,177,0.4)' }}>

            {/* Overlay cargando */}
            {isGenerating && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(26,15,30,0.88)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 10
              }}>
                <div style={{
                  width: '44px', height: '44px',
                  border: '3px solid transparent',
                  borderTopColor: 'rgb(132,197,177)',
                  borderLeftColor: 'rgb(116,69,119)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '18px', fontWeight: 700, fontSize: '15px', color: 'rgb(240,233,182)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Materializando Diagrama...
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,233,182,0.45)', fontFamily: "'Space Mono', monospace" }}>
                  Gemini está procesando la estructura
                </p>
              </div>
            )}

            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h3 style={{
                margin: 0, display: 'flex', alignItems: 'center', gap: '10px',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '20px', color: 'rgb(240,233,182)'
              }}>
               
                AI Generator
              </h3>
              <button
                onClick={() => setIsAiModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(240,233,182,0.4)', cursor: 'pointer', fontSize: '20px', padding: '4px', lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgb(240,233,182)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,233,182,0.4)'}
              >
                ×
              </button>
            </div>
            <p style={{ color: 'rgba(240,233,182,0.5)', fontSize: '13px', marginBottom: '20px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Describe el diagrama o cambio que deseas y la IA lo generará.
            </p>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <textarea
                className="saas-input"
                style={{
                  height: '130px', resize: 'none', paddingRight: '52px',
                  background: isRecording ? 'rgba(116,69,119,0.12)' : undefined,
                  borderColor: isRecording ? 'rgba(116,69,119,0.7)' : undefined,
                  width: '100%', lineHeight: 1.6,
                  fontFamily: "'DM Sans', system-ui, sans-serif"
                }}
                placeholder="Ej: Agrega una calle para 'Soporte' y un nodo de decisión para 'Ticket aprobado'..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                disabled={isGenerating}
              />
              {/* Botón micrófono */}
              <button
                onClick={toggleRecording}
                title="Dictar por voz"
                style={{
                  position: 'absolute', right: '10px', bottom: '10px',
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: isRecording ? 'rgb(116,69,119)' : 'rgba(116,69,119,0.2)',
                  border: `1px solid ${isRecording ? 'rgb(116,69,119)' : 'rgba(116,69,119,0.4)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isRecording ? '0 0 14px rgba(116,69,119,0.6)' : 'none',
                  transition: 'all 0.2s', zIndex: 5
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(240,233,182)" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            </div>

            <div style={{ display: 'block', gap: '16px' }}>
              <button
                className="saas-button"
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Generar Diagrama
              </button>
              <button
                className="saas-button secondary"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isGenerating}
                style={{ flexShrink: 0 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: COMPARTIR ══════════ */}
      {isShareModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,5,14,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(6px)'
        }}>
          <div className="saas-card fade-in" style={{ width: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '20px', color: 'rgb(240,233,182)',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>⇄</span>
                Invitar Colaborador
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(240,233,182,0.4)', cursor: 'pointer', fontSize: '20px' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgb(240,233,182)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,233,182,0.4)'}
              >×</button>
            </div>
            <p style={{ color: 'rgba(240,233,182,0.5)', fontSize: '13px', marginBottom: '20px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Comparte este diagrama con otros usuarios usando su correo electrónico.
            </p>

            <div className="form-group">
              <label className="label">Correo del Colaborador</label>
              <input
                type="email"
                className="saas-input"
                placeholder="colaborador@ejemplo.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="saas-button" onClick={handleInvite} disabled={!inviteEmail.trim()}>
                Enviar Invitación
              </button>
              <button className="saas-button secondary" onClick={() => setIsShareModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: AI REPORT PROMPT ══════════ */}
      {isAiReportPromptOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,5,14,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(6px)'
        }}>
          <div className="saas-card fade-in" style={{ width: '540px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(240,233,182,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h3 style={{
                margin: 0, display: 'flex', alignItems: 'center', gap: '10px',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '20px', color: 'rgb(240,233,182)'
              }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                Generador de Reporte IA
              </h3>
              <button
                onClick={() => setIsAiReportPromptOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(240,233,182,0.4)', cursor: 'pointer', fontSize: '20px', padding: '4px', lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgb(240,233,182)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,233,182,0.4)'}
              >
                ×
              </button>
            </div>
            <p style={{ color: 'rgba(240,233,182,0.5)', fontSize: '13px', marginBottom: '20px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              ¿Qué tipo de análisis o reporte deseas generar sobre la ejecución? Describe tus requerimientos.
            </p>

            <textarea
              className="saas-input"
              style={{
                height: '130px', resize: 'none',
                width: '100%', lineHeight: 1.6, marginBottom: '16px',
                fontFamily: "'DM Sans', system-ui, sans-serif"
              }}
              placeholder="Ej: Analiza los tiempos de ejecución y detecta los cuellos de botella más importantes..."
              value={aiReportPrompt}
              onChange={e => setAiReportPrompt(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="saas-button"
                style={{ background: 'var(--clr-yellow-pale)', color: 'var(--clr-yellow-warm)', borderColor: 'rgba(240,233,182,0.4)' }}
                onClick={() => {
                  setIsAiReportPromptOpen(false);
                  setIsAuditoriaModalOpen(true);
                }}
              >
                Continuar a Auditoría ➔
              </button>
              <button
                className="saas-button secondary"
                onClick={() => setIsAiReportPromptOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ OVERLAYS DE EJECUCIÓN ══════════ */}
      <ExecutionControls />
      {executionMode === 'play' && <DynamicFormPanel />}
      {executionMode === 'edit' && activeConfigNodeId && <NodeConfigPanel />}
      {isPredictionModalOpen && <AIPredictionModal onClose={() => setIsPredictionModalOpen(false)} />}
      {isAuditoriaModalOpen && <AuditoriaModal diagramId={id} onClose={() => setIsAuditoriaModalOpen(false)} />}
      {isDocsModalOpen && <DocumentRepository onClose={() => setIsDocsModalOpen(false)} />}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default Editor;