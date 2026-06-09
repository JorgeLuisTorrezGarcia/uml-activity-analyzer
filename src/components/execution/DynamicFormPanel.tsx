import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useExecutionStore } from '../../store/executionStore';
import { useDiagramStore } from '../../store/diagramStore';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

export const DynamicFormPanel: React.FC = () => {
  const { id: dbDiagramId } = useParams<{ id: string }>();
  const { tokens, moveToken, endExecution } = useExecutionStore();
  const state = useDiagramStore(s => s.state);
  const user = useAuthStore(s => s.user);
  
  const [jsonText, setJsonText] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [filesData, setFilesData] = useState<Record<string, File>>({});
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{url: string, name: string} | null>(null);
  
  const [activeTab, setActiveTab] = useState<'actual' | 'history'>('actual');
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const activeToken = tokens.find(t => t.status === 'running');
  const activeNode = state.nodes.find(n => n.id === activeToken?.currentNodeId);

  useEffect(() => {
    if (activeNode) {
      setJsonText(activeNode.executionConfig?.jsonTemplate || '');
      setErrorObj('');
      const initialData: Record<string, any> = {};
      const schema = activeNode.executionConfig?.formSchema || [];
      schema.forEach(field => {
        if (field.type === 'boolean') initialData[field.name] = false;
        else if (field.type === 'number') initialData[field.name] = 0;
        else if (field.type === 'select' && field.options?.[0]) initialData[field.name] = field.options[0];
        else if (field.type !== 'file') initialData[field.name] = '';
      });
      setFormData(initialData);
      setFilesData({});
    }
  }, [activeNode?.id, activeNode?.executionConfig]);

  const fetchHistory = async () => {
    if (!activeNode?.id || !dbDiagramId) return;
    setIsLoadingHistory(true);
    try {
      const tokenLocal = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await axios.get(`${apiBase}/execute/diagram/${dbDiagramId}/node/${activeNode.id}`, {
        headers: { Authorization: `Bearer ${tokenLocal}` }
      });
      setNodeHistory(res.data);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, activeNode?.id]);

  if (!activeToken || !activeNode) return null;

  const nodeType = activeNode.type;
  const schema = activeNode.executionConfig?.formSchema || [];
  const hasSchema = schema.length > 0;

  const lane = state.lanes.find(l => l.id === activeNode.laneId);
  const hasPermission = !lane || !lane.title || (user && user.name.toLowerCase() === lane.title.toLowerCase());
  
  const handleAdvance = async (forcedPathToId?: string) => {
    let parsedPayload = {};
    
    if (hasSchema) {
      for (const field of schema) {
        if (field.required) {
          if (field.type === 'file' && !filesData[field.name]) {
            setErrorObj(`El archivo "${field.label}" es obligatorio.`);
            return;
          }
          if (field.type !== 'file' && (formData[field.name] === '' || formData[field.name] === null || formData[field.name] === undefined)) {
            setErrorObj(`El campo "${field.label}" es obligatorio.`);
            return;
          }
        }
      }
      parsedPayload = { ...formData };
    } else {
      if (jsonText.trim()) {
        try {
          parsedPayload = JSON.parse(jsonText);
        } catch (e: any) {
          setErrorObj(e.message);
          return;
        }
      }
    }

    setIsSubmitting(true);
    let uploadedUrls: string[] = [];
    try {
      const tokenLocal = localStorage.getItem('token');
      if (tokenLocal) {
        const formPayload = new FormData();
        formPayload.append('instanceId', activeToken.id);
        formPayload.append('nodeId', activeNode.id);
        formPayload.append('laneId', activeNode.laneId || '');
        formPayload.append('formData', JSON.stringify(parsedPayload));

        const nextNodeId = state.arrows.find(a => a.fromId === activeNode.id)?.toId || 'end';
        formPayload.append('activeTokens', JSON.stringify([{ 
          tokenId: activeToken.id, 
          currentNodeId: nextNodeId,
          laneId: activeNode.laneId || null
        }]));

        Object.values(filesData).forEach(file => {
          formPayload.append('files', file);
        });

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await axios.post(`${apiBase}/execute/step`, formPayload, {
          headers: { 
            Authorization: `Bearer ${tokenLocal}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (res.data && res.data.artifactsUrls) {
          uploadedUrls = res.data.artifactsUrls;
        }
      }
    } catch (e: any) {
      if (e.response && e.response.status === 400) {
        setErrorObj(e.response.data.suggestion || e.response.data.error);
        setIsSubmitting(false);
        return;
      }
      console.warn("Ejecución en frontend sin persistencia online (Offline Mode)");
    }
    setIsSubmitting(false);

    const outgoingData = { 
      timestamp: Date.now(), 
      from: activeNode.id, 
      ...parsedPayload,
      ...(uploadedUrls.length > 0 ? { artifacts: uploadedUrls } : {})
    };
    
    const outgoingArrows = state.arrows.filter(a => a.fromId === activeNode.id);
    
    if (forcedPathToId) { 
      moveToken(activeToken.id, forcedPathToId, outgoingData);
    } else if (outgoingArrows.length === 1) {
      moveToken(activeToken.id, outgoingArrows[0].toId, outgoingData);
    } else if (outgoingArrows.length > 1) {
      moveToken(activeToken.id, outgoingArrows[0].toId, outgoingData);
    } else {
      endExecution(activeToken.id);
      
      try {
        const tokenLocal = localStorage.getItem('token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        await axios.put(`${apiBase}/execute/instance/${activeToken.id}/complete`, {}, {
          headers: { Authorization: `Bearer ${tokenLocal}` }
        });
        alert('¡Ejecución Finalizada Exitosamente y Guardada!');
      } catch (err) {
        console.error('Error al finalizar la instancia en backend:', err);
        alert('¡Ejecución Finalizada localmente (error al guardar en la nube)!');
      }
    }
  };

  const isDecision = nodeType === 'decision';
  const decisionArrows = state.arrows.filter(a => a.fromId === activeNode.id);

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorObj('');
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setFilesData(prev => ({ ...prev, [name]: file }));
    } else {
      const newFiles = { ...filesData };
      delete newFiles[name];
      setFilesData(newFiles);
    }
    setErrorObj('');
  };

  const renderIncomingData = (payload: any) => {
    if (!payload) return null;
    const entries = Object.entries(payload).filter(([k]) => k !== 'timestamp' && k !== 'from' && k !== 'artifacts');
    if (entries.length === 0 && (!payload.artifacts || payload.artifacts.length === 0)) return null;

    return (
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '12px', color: 'var(--clr-yellow)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>Datos de Entrada recibidos:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 2fr', gap: '10px', background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
          {entries.map(([key, value]) => {
            let displayValue: React.ReactNode = String(value);
            if (typeof value === 'string' && value.startsWith('http')) {
              displayValue = <button onClick={() => setPreviewDoc({ url: value, name: key })} style={{ color: 'var(--clr-teal)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver Archivo 📎</button>;
            }
            return (
              <React.Fragment key={key}>
                <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', fontWeight: 600, alignSelf: 'center', wordBreak: 'break-word', fontFamily: 'var(--font-mono)' }}>{key}</div>
                <div style={{ fontSize: '14px', color: 'var(--txt-primary)', wordBreak: 'break-word', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>{displayValue}</div>
              </React.Fragment>
            );
          })}
          
          {payload.artifacts && payload.artifacts.length > 0 && (
            <React.Fragment>
              <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', fontWeight: 600, alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>Archivos Adjuntos</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                {payload.artifacts.map((url: string, i: number) => {
                  const rootUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
                  const fullUrl = url.startsWith('http') ? url : `${rootUrl}${url}`;
                  const rawName = decodeURIComponent(fullUrl.split('?')[0].split('/').pop() || `Adjunto ${i+1}`);
                  return (
                    <button 
                      key={i} 
                      onClick={() => setPreviewDoc({ url: fullUrl, name: rawName })}
                      style={{ background: 'var(--clr-purple-mist)', border: '1px solid var(--clr-purple)', color: 'var(--clr-yellow)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    >
                      {rawName} 📎
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute',
      top: 55,
      right: 0,
      width: '400px',
      height: '95%',
      backgroundColor: 'var(--bg-elevated)',
      borderLeft: '1px solid var(--border-default)',
      boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 150,
      color: 'var(--txt-primary)',
      padding: '24px',
      overflowY: 'auto',
      fontFamily: 'var(--font-body)'
    }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', fontFamily: 'var(--font-display)', color: 'var(--clr-yellow)', fontWeight: 700 }}>
        ⚙️ {activeNode.label || nodeType}
      </h2>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('actual')}
          style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeTab === 'actual' ? '3px solid var(--clr-purple)' : '3px solid transparent', color: activeTab === 'actual' ? 'var(--clr-purple)' : 'var(--txt-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
        >
          Tarea Actual
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: activeTab === 'history' ? '3px solid var(--clr-teal)' : '3px solid transparent', color: activeTab === 'history' ? 'var(--clr-teal)' : 'var(--txt-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
        >
          Historial Pasado
        </button>
      </div>

      {activeTab === 'actual' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {renderIncomingData(activeToken.payload)}

        {!hasPermission ? (
          <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', textAlign: 'center', marginTop: '20px', border: '1px solid var(--border-default)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--clr-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--txt-primary)', fontFamily: 'var(--font-display)' }}>Acceso Restringido</h3>
            <p style={{ fontSize: '14px', color: 'var(--txt-secondary)', marginTop: '10px', lineHeight: '1.5' }}>
              Esperando a que el responsable <strong style={{ color: 'var(--clr-yellow)' }}>{lane?.title}</strong> complete esta tarea.
            </p>
          </div>
        ) : !isDecision ? (
          <>
            {hasSchema ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', margin: 0, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', color: 'var(--txt-secondary)', fontWeight: 600 }}>Por favor completa el formulario:</p>
                {schema.map(field => (
                  <div key={field.id} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">
                      {field.label} {field.required && <span style={{ color: 'rgb(220,120,120)' }}>*</span>}
                    </label>
                    
                    {field.type === 'text' && (
                      <input className="saas-input" type="text" value={formData[field.name] || ''} onChange={e => handleFieldChange(field.name, e.target.value)} />
                    )}
                    
                    {field.type === 'textarea' && (
                      <textarea className="saas-input" rows={3} value={formData[field.name] || ''} onChange={e => handleFieldChange(field.name, e.target.value)} style={{ resize: 'vertical' }} />
                    )}
                    
                    {field.type === 'number' && (
                      <input className="saas-input" type="number" value={formData[field.name] || ''} onChange={e => handleFieldChange(field.name, Number(e.target.value))} />
                    )}
                    
                    {field.type === 'date' && (
                      <input className="saas-input" type="date" value={formData[field.name] || ''} onChange={e => handleFieldChange(field.name, e.target.value)} />
                    )}

                    {field.type === 'select' && (
                      <select className="saas-input" value={formData[field.name] || ''} onChange={e => handleFieldChange(field.name, e.target.value)} style={{ appearance: 'auto', cursor: 'pointer' }}>
                        {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    )}

                    {field.type === 'file' && (
                      <div style={{ background: 'var(--bg-surface)', padding: '8px', borderRadius: '8px', border: '1px dashed var(--border-default)' }}>
                        <input 
                          type="file" 
                          onChange={e => handleFileChange(field.name, e.target.files ? e.target.files[0] : null)} 
                          style={{ color: 'var(--txt-secondary)', fontSize: '13px' }}
                        />
                      </div>
                    )}

                    {field.type === 'boolean' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: 'var(--txt-primary)', fontWeight: 600 }}>
                        <input type="checkbox" checked={!!formData[field.name]} onChange={e => handleFieldChange(field.name, e.target.checked)} style={{ accentColor: 'var(--clr-purple)' }} />
                        Sí / Confirmar
                      </label>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p style={{ fontSize: '14px', margin: 0, color: 'var(--txt-secondary)', fontWeight: 600 }}>Inyección JSON (Sin formulario):</p>
                <textarea 
                  className="saas-input"
                  style={{ flex: 1, minHeight: '180px', fontFamily: 'var(--font-mono)', fontSize: '13px', resize: 'vertical' }}
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setErrorObj('');
                  }}
                  placeholder='{&#10; "data": "value"&#10;}'
                />
              </>
            )}

            {errorObj && <p style={{ color: 'rgb(220,120,120)', fontSize: '13px', margin: 0, padding: '12px', background: 'rgba(220,120,120,0.1)', borderRadius: '6px', border: '1px solid rgba(220,120,120,0.3)', fontWeight: 600 }}>Error: {errorObj}</p>}
            
            <button className="saas-button" onClick={() => handleAdvance()} disabled={isSubmitting} style={{ marginTop: 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Procesando...' : 'Completar y Avanzar ➔'}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: 'var(--txt-secondary)', fontWeight: 600 }}>Decisión Manual Requerida:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {decisionArrows.length > 0 ? decisionArrows.map((arrow, idx) => {
                const labelRaw = (arrow.label || '').toLowerCase();
                const isExplicitTrue = labelRaw.includes('si') || labelRaw.includes('sí') || labelRaw.includes('yes') || labelRaw.includes('true');
                const isExplicitFalse = labelRaw.includes('no') || labelRaw.includes('false');
                
                let isTruePath = false;
                if (isExplicitTrue) isTruePath = true;
                else if (isExplicitFalse) isTruePath = false;
                else if (arrow.fromPort === 'bottom') isTruePath = true;
                else if (idx === 0) isTruePath = true; 

                const visualText = arrow.label ? `${arrow.label} (${isTruePath ? 'Verdadero' : 'Falso'})` : (isTruePath ? 'Verdadero (Sí)' : 'Falso (No)');

                return (
                  <button 
                    key={arrow.id}
                    className="saas-button" 
                    onClick={() => handleAdvance(arrow.toId)} 
                    style={{ 
                      background: isTruePath ? 'var(--clr-sage-mist)' : 'rgba(220,120,120,0.1)',
                      color: isTruePath ? 'var(--clr-sage-deep)' : 'rgb(220,120,120)',
                      borderColor: isTruePath ? 'rgba(172, 207, 163, 0.4)' : 'rgba(220,120,120,0.4)',
                      padding: '14px',
                      fontSize: '15px'
                    }}
                  >
                    {isTruePath ? '✓' : '✕'} Ruta: {visualText}
                  </button>
                )
              }) : (
                 <p style={{ fontSize: '13px', color: 'var(--txt-muted)', fontStyle: 'italic' }}>No hay salidas conectadas.</p>
              )}
            </div>
          </>
        )}
      </div>
      )}

      {/* RENDER TAB HISTORIAL */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <p style={{ fontSize: '14px', color: 'var(--txt-secondary)', margin: 0, lineHeight: '1.5' }}>
            Visualizando las veces que este bloque fue completado por otros usuarios en el pasado.
          </p>

          {isLoadingHistory && <p style={{ fontSize: '13px', color: 'var(--clr-teal)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Cargando registros...</p>}
          {!isLoadingHistory && nodeHistory.length === 0 && <p style={{ fontSize: '13px', color: 'var(--txt-muted)', fontStyle: 'italic' }}>Aún no hay registros paralelos para este nodo.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {nodeHistory.map(entry => (
              <div key={entry.id} style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-purple-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>👤 {entry.executedBy?.name || 'Usuario'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--txt-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(entry.executedAt).toLocaleDateString()}</span>
                </div>
                
                {entry.formData && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) 2fr', gap: '10px' }}>
                    {Object.entries(entry.formData).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', fontWeight: 600, alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>{k}</div>
                        <div style={{ fontSize: '13px', color: 'var(--txt-primary)', background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>{String(v)}</div>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {entry.artifactsUrls && entry.artifactsUrls.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                     {entry.artifactsUrls.map((url: string, i: number) => {
                        const rootUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
                        const fullUrl = url.startsWith('http') ? url : `${rootUrl}${url}`;
                        return (
                           <button key={i} onClick={() => setPreviewDoc({ url: fullUrl, name: `Adjunto ${i+1}` })} style={{ fontSize: '12px', background: 'var(--clr-purple-mist)', color: 'var(--clr-yellow)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--clr-purple)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>📎 Adjunto {i+1}</button>
                        );
                     })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visor Modal de Adjuntos */}
      {previewDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--clr-yellow)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '18px' }}>Visor: {previewDoc.name}</span>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: 'var(--txt-muted)', fontSize: '13px' }}>Si el visor no carga, usa "Descargar".</span>
              <a href={previewDoc.url} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-teal)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                Descargar Directo ↗
              </a>
              <button onClick={() => setPreviewDoc(null)} className="saas-button secondary" style={{ width: 'auto', padding: '8px 16px' }}>
                Cerrar Visor
              </button>
            </div>
          </div>
          <iframe 
            src={
              previewDoc.name.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i)
              ? `https://docs.google.com/viewer?url=${encodeURIComponent(previewDoc.url)}&embedded=true`
              : `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documents/proxy?url=${encodeURIComponent(previewDoc.url)}&token=${localStorage.getItem('token')}`
            } 
            style={{ width: '100%', flex: 1, border: 'none', background: 'white' }}
            title="Visor"
          />
        </div>
      )}
    </div>
  );
};

export default DynamicFormPanel;
