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

const Editor: React.FC = () => {
  const { state, setState, activeConfigNodeId, isLeftPanelOpen, isRightPanelOpen, toggleLeftPanel, toggleRightPanel } = useDiagramStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const executionMode = useExecutionStore(state => state.mode);

  const [diagramName, setDiagramName] = React.useState(state.name || 'Diagrama sin título');
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isAuditoriaModalOpen, setIsAuditoriaModalOpen] = React.useState(false);
  
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');

  React.useEffect(() => {
    if (state.name) setDiagramName(state.name);
  }, [state.name]);

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
      const res = await api.post('/ai/generate', { 
        prompt: aiPrompt, 
        currentDiagram: state 
      });
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
      alert("Tu navegador no soporta Reconocimiento de Voz nativo. Usa Chrome o Edge para esta funcionalidad.");
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false; // Fix: Evita que el navegador repita palabras interinas
    recognition.continuous = true;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setAiPrompt((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + currentTranscript);
    };

    recognition.onerror = (e: any) => {
      console.error('mic error', e);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
    // Parar automáticamente a los 10 segundos por si acaso (MVP limite)
    setTimeout(() => { try { recognition.stop(); } catch(e){} }, 10000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await api.post(`/diagrams/${id}/invite`, { 
        email: inviteEmail, 
        canEdit: true, 
        canSave: true, 
        canDelete: false 
      });
      alert('Invitación enviada exitosamente.');
      setIsShareModalOpen(false);
      setInviteEmail('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al enviar invitación.');
    }
  };

  return (
    <div id="root" className="app-layout">
      {/* HEADER TIPO DRAW.IO */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
             onClick={() => navigate('/dashboard')}
             style={{ cursor: 'pointer', width: '32px', height: '32px', background: '#e34f26', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
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
            style={{ borderColor: '#10b981', color: '#10b981' }}
            onClick={() => setIsAuditoriaModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Auditoría
          </button>

          <button 
            className="header-action-btn ai-btn"
            onClick={() => setIsAiModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm0 16a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM4 10a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm16 0a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2z" />
              <path d="M12 6v4M12 14v4M6 12h4M14 12h4" />
            </svg>
            AI Assistant
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
              {user?.name?.[0].toUpperCase()}
            </div>
            {user?.name}
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* LEFT SIDEBAR */}
        <aside className={`sidebar left-sidebar ${isLeftPanelOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <span>Formas</span>
          </div>
          <div className="sidebar-scrollable">
            <Toolbar />
          </div>
        </aside>
        
        {/* Toggler Izquierdo fuera del aside */}
        <div className={`toggle-btn toggle-left`} onClick={toggleLeftPanel} style={{ left: isLeftPanelOpen ? '220px' : '0' }}>
          {isLeftPanelOpen ? '◀' : '▶'}
        </div>

        {/* WORKSPACE (CANVAS) */}
        <div id="grid-container" className="workspace-container">
          <DiagramStage roomId={id} />
          <div className="status-bar">
            {state.nodes.length} nodos | {state.arrows.length} flechas | {state.lanes.length} calles
          </div>
        </div>

        {/* Toggler Derecho fuera del aside */}
        <div className={`toggle-btn toggle-right`} onClick={toggleRightPanel} style={{ right: isRightPanelOpen ? '280px' : '0' }}>
          {isRightPanelOpen ? '▶' : '◀'}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className={`sidebar right-sidebar ${isRightPanelOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <span>Estilo / Propiedades</span>
          </div>
          <div className="sidebar-scrollable">
            <PropertiesPanel />
          </div>
        </aside>
      </main>

      {/* AI ASSISTANT MODAL */}
      {isAiModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div className="saas-card" style={{ width: '550px', border: '1px solid #3b82f6', position: 'relative', overflow: 'hidden' }}>
            
            {/* OVERLAY DE CARGA AI */}
            {isGenerating && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 10, color: '#60a5fa'
              }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid transparent', borderTopColor: '#60a5fa', borderLeftColor: '#60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '16px', fontWeight: 'bold', fontSize: '15px' }}>Materializando Diagrama...</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Gemini está procesando la estructura</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            <h3 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm0 16a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM4 10a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm16 0a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM6 12h4m4 0h4" /></svg>
              Gemini AI Architect
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Describe el cambio o el diagrama que deseas generar y la IA lo dibujará por ti.</p>
            
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <textarea 
                className="saas-input"
                style={{ height: '140px', resize: 'none', paddingRight: '50px', background: isRecording ? '#1e293b' : '#0f172a', borderColor: isRecording ? '#ef4444' : '#3b82f6', width: '100%' }}
                placeholder="Ej: Agrega una calle para 'Soporte' y un nodo de decisión para 'Ticket aprobado'..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isGenerating}
              />
              
              {/* MICROPHONE BUTTON */}
              <button
                onClick={toggleRecording}
                style={{
                  position: 'absolute', right: '12px', bottom: '12px', 
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: isRecording ? '#ef4444' : '#334155',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isRecording ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
                  transition: 'all 0.2s', zIndex: 5
                }}
                title="Dictar por voz"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="saas-button" 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
              >
                Generar Cambios
              </button>
              <button 
                className="saas-button secondary" 
                onClick={() => setIsAiModalOpen(false)}
                disabled={isGenerating}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="saas-card" style={{ width: '400px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Invitar Colaborador
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Comparte este diagrama con otros usuarios usando su correo.</p>
            
            <div className="form-group">
              <label className="label">Correo Electrónico del Usuario</label>
              <input 
                type="email"
                className="saas-input"
                placeholder="email@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="saas-button" 
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
              >
                Enviar Invitación
              </button>
              <button 
                className="saas-button secondary" 
                onClick={() => setIsShareModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAYS DE EJECUCION (BPM MOTOR) */}
      <ExecutionControls />
      {executionMode === 'play' && <DynamicFormPanel />}
      {executionMode === 'edit' && activeConfigNodeId && <NodeConfigPanel />}
      
      {/* MODAL DE AUDITORIA Y REPORTES */}
      {isAuditoriaModalOpen && <AuditoriaModal diagramId={id} onClose={() => setIsAuditoriaModalOpen(false)} />}
    </div>
  );
};

export default Editor;
