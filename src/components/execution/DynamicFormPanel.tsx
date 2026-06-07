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

  // Verificación de permisos de carril (Lane)
  const lane = state.lanes.find(l => l.id === activeNode.laneId);
  const hasPermission = !lane || !lane.title || (user && user.name.toLowerCase() === lane.title.toLowerCase());
  
  const handleAdvance = async (forcedPathToId?: string) => {
    let parsedPayload = {};
    
    // Si el nodo tiene esquema creado por el form builder, usamos formData
    if (hasSchema) {
      // Validación básica
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
      // Modo Legacy
      if (jsonText.trim()) {
        try {
          parsedPayload = JSON.parse(jsonText);
        } catch (e: any) {
          setErrorObj(e.message);
          return;
        }
      }
    }

    // Opcional: Persistir al Backend antes de avanzar (BPM Tracking)
    setIsSubmitting(true);
    let uploadedUrls: string[] = [];
    try {
      const tokenLocal = localStorage.getItem('token');
      if (tokenLocal) {
        // Envolver en FormData HTML web API
        const formPayload = new FormData();
        // El diagrama global no guarda el Token Instance en backend todavia, pero enviamos los datos si hay API.
        // Fallback: asumo "instance_test" por ahora
        formPayload.append('instanceId', activeToken.id);
        formPayload.append('nodeId', activeNode.id);
        formPayload.append('laneId', activeNode.laneId || '');
        formPayload.append('formData', JSON.stringify(parsedPayload));

        // Enviamos el token activo para que el backend actualice activeTokens
        const nextNodeId = state.arrows.find(a => a.fromId === activeNode.id)?.toId || 'end';
        formPayload.append('activeTokens', JSON.stringify([{ 
          tokenId: activeToken.id, 
          currentNodeId: nextNodeId,
          laneId: activeNode.laneId || null
        }]));

        // Subir los filesData
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
        return; // Detener el avance si la persistencia falló por ID inválido
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
    
    // Algoritmo de Avance
    const outgoingArrows = state.arrows.filter(a => a.fromId === activeNode.id);
    
    if (forcedPathToId) { 
      moveToken(activeToken.id, forcedPathToId, outgoingData);
    } else if (outgoingArrows.length === 1) {
      moveToken(activeToken.id, outgoingArrows[0].toId, outgoingData);
    } else if (outgoingArrows.length > 1) {
      moveToken(activeToken.id, outgoingArrows[0].toId, outgoingData);
    } else {
      endExecution(activeToken.id);
      
      // Marcar ejecución como finalizada en el backend
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
        <h3 style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos de Entrada recibidos:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) 2fr', gap: '8px', background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
          {entries.map(([key, value]) => {
            let displayValue: React.ReactNode = String(value);
            if (typeof value === 'string' && value.startsWith('http')) {
              displayValue = <button onClick={() => setPreviewDoc({ url: value, name: key })} style={{ color: '#3b82f6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Ver Archivo 📎</button>;
            }
            return (
              <React.Fragment key={key}>
                <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500, alignSelf: 'center', wordBreak: 'break-word' }}>{key}</div>
                <div style={{ fontSize: '13px', color: '#f8fafc', wordBreak: 'break-word', background: '#0f172a', padding: '6px 10px', borderRadius: '4px' }}>{displayValue}</div>
              </React.Fragment>
            );
          })}
          
          {payload.artifacts && payload.artifacts.length > 0 && (
            <React.Fragment>
              <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500, alignSelf: 'center' }}>Archivos Adjuntos</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', background: '#0f172a', padding: '6px 10px', borderRadius: '4px' }}>
                {payload.artifacts.map((url: string, i: number) => {
                  const rootUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
                  const fullUrl = url.startsWith('http') ? url : `${rootUrl}${url}`;
                  // Extraer nombre del path de S3
                  const rawName = decodeURIComponent(fullUrl.split('?')[0].split('/').pop() || `Adjunto ${i+1}`);
                  return (
                    <button 
                      key={i} 
                      onClick={() => setPreviewDoc({ url: fullUrl, name: rawName })}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer', padding: 0 }}
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
      width: '360px',
      height: '95%',
      backgroundColor: '#0f172a',
      borderLeft: '1px solid #334155',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 150,
      color: '#f8fafc',
      padding: '24px',
      overflowY: 'auto'
    }}>
      <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>
        ⚙️ {activeNode.label || nodeType}
      </h2>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('actual')}
          style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'actual' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'actual' ? '#3b82f6' : '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Tarea Actual
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'history' ? '2px solid #10b981' : '2px solid transparent', color: activeTab === 'history' ? '#10b981' : '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Historial Pasado
        </button>
      </div>

      {activeTab === 'actual' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* TABLA DE DATOS N8N STYLE EN LUGAR DE PRE JSON */}
        {renderIncomingData(activeToken.payload)}

        {!hasPermission ? (
          <div style={{ background: '#334155', padding: '20px', borderRadius: '8px', textAlign: 'center', marginTop: '20px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>Acceso Restringido</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px' }}>
              Esperando a que el responsable <strong>{lane?.title}</strong> complete esta tarea.
            </p>
          </div>
        ) : !isDecision ? (
          <>
            {hasSchema ? (
              // RENDER DEL FORMULARIO DINÁMICO
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', margin: 0, borderBottom: '1px solid #334155', paddingBottom: '8px' }}>Por favor completa el formulario:</p>
                {schema.map(field => (
                  <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#cbd5e1' }}>
                      {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
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
                      <select className="saas-input" value={formData[field.name] || ''} onChange={e => handleFieldChange(field.name, e.target.value)} style={{ appearance: 'auto' }}>
                        {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    )}

                    {field.type === 'file' && (
                      <input 
                        className="saas-input" 
                        type="file" 
                        onChange={e => handleFileChange(field.name, e.target.files ? e.target.files[0] : null)} 
                        style={{ padding: '8px' }}
                      />
                    )}

                    {field.type === 'boolean' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!formData[field.name]} onChange={e => handleFieldChange(field.name, e.target.checked)} />
                        Sí / Confirmar
                      </label>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // FALLBACK A INYECCION RAW JSON
              <>
                <p style={{ fontSize: '13px', margin: 0 }}>Inyección JSON (Sin formulario configurado):</p>
                <textarea 
                  className="saas-input"
                  style={{ flex: 1, minHeight: '150px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setErrorObj('');
                  }}
                  placeholder='{&#10; "data": "value"&#10;}'
                />
              </>
            )}

            {errorObj && <p style={{ color: '#ef4444', fontSize: '11px', margin: 0, padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>Errores: {errorObj}</p>}
            
            <button className="saas-button" onClick={() => handleAdvance()} disabled={isSubmitting} style={{ marginTop: 'auto', background: '#3b82f6', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Procesando...' : 'Completar y Avanzar ➔'}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', margin: 0 }}>Decisión Manual Requerida:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    style={{ background: isTruePath ? '#10b981' : '#ef4444' }}
                  >
                    Ruta: {visualText}
                  </button>
                )
              }) : (
                 <p style={{ fontSize: '12px', color: 'gray' }}>No hay salidas conectadas.</p>
              )}
            </div>
          </>
        )}
      </div>
      )}

      {/* RENDER TAB HISTORIAL */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Visualizando las veces que este bloque fue completado por otros usuarios en el pasado.
          </p>

          {isLoadingHistory && <p style={{ fontSize: '12px', color: '#3b82f6' }}>Cargando registros...</p>}
          {!isLoadingHistory && nodeHistory.length === 0 && <p style={{ fontSize: '12px', color: '#64748b' }}>Aún no hay registros paralelos para este nodo.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {nodeHistory.map(entry => (
              <div key={entry.id} style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0' }}>{entry.executedBy?.name || 'Usuario'}</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(entry.executedAt).toLocaleDateString()}</span>
                </div>
                
                {entry.formData && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 2fr', gap: '6px' }}>
                    {Object.entries(entry.formData).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{k}</div>
                        <div style={{ fontSize: '12px', color: '#f8fafc', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>{String(v)}</div>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {entry.artifactsUrls && entry.artifactsUrls.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                     {entry.artifactsUrls.map((url: string, i: number) => {
                        const rootUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
                        const fullUrl = url.startsWith('http') ? url : `${rootUrl}${url}`;
                        return (
                           <button key={i} onClick={() => setPreviewDoc({ url: fullUrl, name: `Adjunto ${i+1}` })} style={{ fontSize: '11px', background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Adjunto {i+1}</button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>Visor: {previewDoc.name}</span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Si el visor no carga, usa el botón "Descargar".</span>
              <a href={previewDoc.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                Descargar Directo ↗
              </a>
              <button onClick={() => setPreviewDoc(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>
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
            style={{ width: '100%', flex: 1, border: 'none', background: '#e2e8f0' }}
            title="Visor"
          />
        </div>
      )}
    </div>
  );
};
