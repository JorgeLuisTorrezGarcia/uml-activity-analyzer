import React, { useState, useEffect } from 'react';
import { useDiagramStore } from '../../store/diagramStore';
import { v4 as uuidv4 } from 'uuid';
import { FormField, FormFieldType } from '../../types/diagram';

export const NodeConfigPanel: React.FC = () => {
  const { state, activeConfigNodeId, updateNode, setActiveConfigNodeId } = useDiagramStore();

  const activeNode = state.nodes.find(n => n.id === activeConfigNodeId);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (activeNode) {
      if (activeNode.executionConfig?.formSchema) {
        setFormFields(activeNode.executionConfig.formSchema);
      } else {
        setFormFields([]);
      }
      setExpandedNodeId(null);
    }
  }, [activeConfigNodeId, activeNode]);

  if (!activeNode) return null;

  const saveFieldsToNode = (fields: FormField[]) => {
    setFormFields(fields);
    updateNode(activeNode.id, { 
      executionConfig: { ...activeNode.executionConfig, type: 'manual', formSchema: fields } 
    });
  };

  const handleAddField = (type: FormFieldType) => {
    const newField: FormField = {
      id: uuidv4(),
      name: `campo_${formFields.length + 1}`,
      label: 'Nueva Pregunta',
      type,
      required: false,
      options: type === 'select' ? ['Opción 1', 'Opción 2'] : undefined
    };
    saveFieldsToNode([...formFields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    const newFields = formFields.map(f => f.id === id ? { ...f, ...updates } : f);
    saveFieldsToNode(newFields);
  };

  const removeField = (id: string) => {
    const newFields = formFields.filter(f => f.id !== id);
    saveFieldsToNode(newFields);
  };

  // Buscar nodos entrantes
  const incomingArrows = state.arrows.filter(a => a.toId === activeNode.id);
  const incomingNodes = incomingArrows.map(a => state.nodes.find(n => n.id === a.fromId)).filter(Boolean);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 280, 
      width: '400px', // un poco mas ancho para el builder
      height: '100%',
      backgroundColor: '#1e293b', 
      borderLeft: '1px solid #334155',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 140,
      color: '#f8fafc'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#e2e8f0', fontWeight: 600 }}>Configuración de {activeNode.type === 'decision' ? 'Decisión' : 'Actividad'}</h3>
        <button onClick={() => setActiveConfigNodeId(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>×</button>
      </div>

      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ENTRADA */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontStyle: 'italic', color: '#f8fafc' }}>Datos de Entrada (Previsión)</h4>
          {incomingNodes.length === 0 ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No hay nodos conectados a la entrada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incomingNodes.map(n => {
                if (!n) return null;
                const isExpanded = expandedNodeId === n.id;
                // Intentamos mostrar el schema de entrada como JSON visual si lo hay
                const incomingSchema = n.executionConfig?.formSchema 
                  ? JSON.stringify(n.executionConfig.formSchema.map(f => f.name), null, 2)
                  : (n.executionConfig?.jsonTemplate || '{\n  // Sin configuración\n}');
                
                return (
                  <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '14px', cursor: 'pointer' }}
                      onClick={() => setExpandedNodeId(isExpanded ? null : n.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      {n.label || n.type}
                    </div>
                    {isExpanded && (
                      <pre style={{ margin: '4px 0 0 22px', padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#94a3b8', border: '1px solid #334155', whiteSpace: 'pre-wrap' }}>
                        {incomingSchema}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '2px solid rgba(255,255,255,0.1)', margin: 0 }} />

        {/* BUILDER MODO MOODLE */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' }}>Constructor de Formulario</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>Agrega campos para que los usuarios llenen al ejecutar este nodo.</p>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button className="saas-button" style={{ fontSize: '11px', padding: '6px 10px', background: '#3b82f6' }} onClick={() => handleAddField('text')}>+ Texto Corto</button>
            <button className="saas-button" style={{ fontSize: '11px', padding: '6px 10px', background: '#3b82f6' }} onClick={() => handleAddField('textarea')}>+ Párrafo</button>
            <button className="saas-button" style={{ fontSize: '11px', padding: '6px 10px', background: '#10b981' }} onClick={() => handleAddField('number')}>+ Número</button>
            <button className="saas-button" style={{ fontSize: '11px', padding: '6px 10px', background: '#f59e0b' }} onClick={() => handleAddField('select')}>+ Desplegable</button>
            <button className="saas-button" style={{ fontSize: '11px', padding: '6px 10px', background: '#8b5cf6' }} onClick={() => handleAddField('boolean')}>+ Checkbox</button>
            <button className="saas-button" style={{ fontSize: '11px', padding: '6px 10px', background: '#ef4444' }} onClick={() => handleAddField('file')}>+ Archivo</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {formFields.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', background: '#0f172a', border: '1px dashed #334155', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                El formulario está vacío. Agrega campos arriba.
              </div>
            )}
            
            {formFields.map((field, index) => (
              <div key={field.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>
                    #{index + 1} - {field.type.toUpperCase()}
                  </span>
                  <button onClick={() => removeField(field.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Pregunta Visible (Label)</label>
                  <input 
                    className="saas-input" style={{ background: '#1e293b', border: '1px solid #334155' }}
                    value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Variable JSON (Name)</label>
                    <input 
                      className="saas-input" style={{ background: '#1e293b', border: '1px solid #334155' }}
                      value={field.name} onChange={(e) => updateField(field.id, { name: e.target.value })}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} />
                      Obligatorio
                    </label>
                  </div>
                </div>

                {field.type === 'select' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>Opciones (Separadas por coma)</label>
                    <input 
                      className="saas-input" style={{ background: '#1e293b', border: '1px solid #334155' }}
                      value={(field.options || []).join(', ')} 
                      onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(o => o.trim()) })}
                    />
                  </div>
                )}
                
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
