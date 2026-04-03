import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useDiagramStore } from '../store/diagramStore';
import { DiagramStage } from '../components/canvas/DiagramStage';
import { Toolbar } from '../components/toolbar/Toolbar';
import { PropertiesPanel } from '../components/panels/PropertiesPanel';

const Editor: React.FC = () => {
  const { state, setState, isLeftPanelOpen, isRightPanelOpen, toggleLeftPanel, toggleRightPanel } = useDiagramStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const [diagramName, setDiagramName] = React.useState(state.name || 'Diagrama sin título');
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="saas-card" style={{ width: '500px', border: '1px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm0 16a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM4 10a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm16 0a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM6 12h4m4 0h4" /></svg>
              Gemini AI Architect
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Describe el cambio o el diagrama que deseas generar y la IA lo dibujará por ti.</p>
            
            <textarea 
              className="saas-input"
              style={{ height: '120px', resize: 'none', marginBottom: '20px' }}
              placeholder="Ej: Agrega una calle para 'Soporte' y un nodo de decisión para 'Ticket aprobado'..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isGenerating}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="saas-button" 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
              >
                {isGenerating ? 'Generando Magia...' : 'Generar Cambios'}
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
    </div>
  );
};

export default Editor;
