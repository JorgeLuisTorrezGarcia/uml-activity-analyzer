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

  const incomingArrows = state.arrows.filter(a => a.toId === activeNode.id);
  const incomingNodes = incomingArrows.map(a => state.nodes.find(n => n.id === a.fromId)).filter(Boolean);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 280, 
      width: '420px',
      height: '100%',
      backgroundColor: 'var(--bg-elevated)', 
      borderLeft: '1px solid var(--border-default)',
      boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 140,
      color: 'var(--txt-primary)',
      fontFamily: 'var(--font-body)'
    }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
          ⚙️ Configuración: {activeNode.type === 'decision' ? 'Decisión' : 'Actividad'}
        </h3>
        <button onClick={() => setActiveConfigNodeId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--txt-muted)', cursor: 'pointer', fontSize: '22px' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-yellow)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--txt-muted)'}>×</button>
      </div>

      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ENTRADA */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--txt-secondary)', fontFamily: 'var(--font-mono)' }}>Datos de Entrada (Previsión)</h4>
          {incomingNodes.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--txt-muted)', fontSize: '13px', fontStyle: 'italic' }}>No hay nodos conectados a la entrada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incomingNodes.map(n => {
                if (!n) return null;
                const isExpanded = expandedNodeId === n.id;
                const incomingSchema = n.executionConfig?.formSchema 
                  ? JSON.stringify(n.executionConfig.formSchema.map(f => f.name), null, 2)
                  : (n.executionConfig?.jsonTemplate || '{\n  // Sin configuración\n}');
                
                return (
                  <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt-primary)', fontSize: '14px', cursor: 'pointer', fontWeight: 600, background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => setExpandedNodeId(isExpanded ? null : n.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--clr-teal)" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      {n.label || n.type}
                    </div>
                    {isExpanded && (
                      <pre style={{ margin: '0', padding: '12px', background: 'var(--bg-overlay)', borderRadius: '6px', fontSize: '12px', color: 'var(--clr-teal)', border: '1px solid var(--border-default)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                        {incomingSchema}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: 0 }} />

        {/* BUILDER */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--clr-purple-light)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Constructor de Formulario</h4>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--txt-secondary)' }}>Agrega campos para que los usuarios llenen al ejecutar este nodo.</p>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button className="saas-button secondary" style={{ width: 'auto', fontSize: '11px', padding: '6px 12px' }} onClick={() => handleAddField('text')}>+ Texto Corto</button>
            <button className="saas-button secondary" style={{ width: 'auto', fontSize: '11px', padding: '6px 12px' }} onClick={() => handleAddField('textarea')}>+ Párrafo</button>
            <button className="saas-button secondary" style={{ width: 'auto', fontSize: '11px', padding: '6px 12px' }} onClick={() => handleAddField('number')}>+ Número</button>
            <button className="saas-button secondary" style={{ width: 'auto', fontSize: '11px', padding: '6px 12px' }} onClick={() => handleAddField('select')}>+ Desplegable</button>
            <button className="saas-button secondary" style={{ width: 'auto', fontSize: '11px', padding: '6px 12px' }} onClick={() => handleAddField('boolean')}>+ Checkbox</button>
            <button className="saas-button secondary" style={{ width: 'auto', fontSize: '11px', padding: '6px 12px' }} onClick={() => handleAddField('file')}>+ Archivo</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formFields.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', borderRadius: '10px', color: 'var(--txt-muted)', fontSize: '14px', fontStyle: 'italic' }}>
                El formulario está vacío. Agrega campos arriba.
              </div>
            )}
            
            {formFields.map((field, index) => (
              <div key={field.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    #{index + 1} - {field.type.toUpperCase()}
                  </span>
                  <button onClick={() => removeField(field.id)} style={{ background: 'transparent', border: 'none', color: 'rgb(220,120,120)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>&times;</button>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Pregunta Visible (Label)</label>
                  <input 
                    className="saas-input"
                    value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label className="label">Variable JSON (Name)</label>
                    <input 
                      className="saas-input"
                      value={field.name} onChange={(e) => updateField(field.id, { name: e.target.value })}
                    />
                  </div>
                  
                  <div style={{ paddingBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--txt-primary)', cursor: 'pointer', fontWeight: 600 }}>
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} style={{ accentColor: 'var(--clr-purple)' }} />
                      Obligatorio
                    </label>
                  </div>
                </div>

                {field.type === 'select' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Opciones (Separadas por coma)</label>
                    <input 
                      className="saas-input"
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
