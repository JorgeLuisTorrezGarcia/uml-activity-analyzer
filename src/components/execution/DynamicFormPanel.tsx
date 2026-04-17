import React, { useState, useEffect } from 'react';
import { useExecutionStore } from '../../store/executionStore';
import { useDiagramStore } from '../../store/diagramStore';

export const DynamicFormPanel: React.FC = () => {
  const { tokens, moveToken, endExecution } = useExecutionStore();
  const state = useDiagramStore(s => s.state);
  
  const [jsonText, setJsonText] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errorObj, setErrorObj] = useState<string>('');

  const activeToken = tokens.find(t => t.status === 'running');
  const activeNode = state.nodes.find(n => n.id === activeToken?.currentNodeId);

  useEffect(() => {
    if (activeNode) {
      setJsonText(activeNode.executionConfig?.jsonTemplate || '');
      setErrorObj('');
      // Iniciar el form data vacío o con valores por defecto
      const initialData: Record<string, any> = {};
      const schema = activeNode.executionConfig?.formSchema || [];
      schema.forEach(field => {
        if (field.type === 'boolean') initialData[field.name] = false;
        else if (field.type === 'number') initialData[field.name] = 0;
        else if (field.type === 'select' && field.options?.[0]) initialData[field.name] = field.options[0];
        else initialData[field.name] = '';
      });
      setFormData(initialData);
    }
  }, [activeNode?.id, activeNode?.executionConfig]);

  if (!activeToken || !activeNode) return null;

  const nodeType = activeNode.type;
  const schema = activeNode.executionConfig?.formSchema || [];
  const hasSchema = schema.length > 0;
  
  const handleAdvance = (forcedPathToId?: string) => {
    let parsedPayload = {};
    
    // Si el nodo tiene esquema creado por el form builder, usamos formData
    if (hasSchema) {
      // Validación básica
      for (const field of schema) {
        if (field.required && (formData[field.name] === '' || formData[field.name] === null || formData[field.name] === undefined)) {
          setErrorObj(`El campo "${field.label}" es obligatorio.`);
          return;
        }
      }
      parsedPayload = { ...formData };
    } else {
      // Modo Legacy (inyección de JSON Crudo)
      if (jsonText.trim()) {
        try {
          parsedPayload = JSON.parse(jsonText);
        } catch (e: any) {
          setErrorObj(e.message);
          return;
        }
      }
    }

    const outgoingData = { timestamp: Date.now(), from: activeNode.id, ...parsedPayload };
    
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
      alert('¡Ejecución Finalizada Exitosamente!');
    }
  };

  const isDecision = nodeType === 'decision';
  const decisionArrows = state.arrows.filter(a => a.fromId === activeNode.id);

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorObj('');
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '360px',
      height: '100%',
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
      <h2 style={{ fontSize: '18px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
        ⚙️ Tarea en Progreso
      </h2>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
        Nodo actual: <strong style={{ color: '#e2e8f0'}}>{activeNode.label || nodeType}</strong>
      </p>

      <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', color: '#60a5fa', margin: 0 }}>Payload Acumulado:</p>
        <pre style={{ margin: '8px 0 0 0', fontSize: '11px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '100px', overflowY: 'auto' }}>
          {JSON.stringify(activeToken.payload, null, 2)}
        </pre>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {!isDecision ? (
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
            
            <button className="saas-button" onClick={() => handleAdvance()} style={{ marginTop: 'auto', background: '#3b82f6' }}>
              Completar y Avanzar ➔
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
    </div>
  );
};
