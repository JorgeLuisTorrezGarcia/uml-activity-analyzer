import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

interface AuditoriaModalProps {
  diagramId: string;
  onClose: () => void;
}

export const AuditoriaModal: React.FC<AuditoriaModalProps> = ({ diagramId, onClose }) => {
  const [auditData, setAuditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'executions' | 'documents'>('info');
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAuditLog();
  }, [diagramId]);

  const fetchAuditLog = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await axios.get(`${apiBase}/execute/diagram/${diagramId}/audit-log`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditData(res.data);
    } catch (e) {
      console.error(e);
      alert('Error cargando datos de auditoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!printRef.current) return;
    const opt = {
      margin: 10,
      filename: `Backlog_${auditData?.diagram?.name || 'Diagrama'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };
    html2pdf().from(printRef.current).set(opt).save();
  };

  const handleExportCsv = () => {
    if (!auditData) return;
    const lines: string[] = [];

    // Sección: Información del Diagrama
    lines.push('=== INFORMACIÓN DEL DIAGRAMA ===');
    lines.push('Nombre,Propietario,Email Propietario,Creado,Actualizado');
    const d = auditData.diagram;
    lines.push(`"${d.name}","${d.owner.name}","${d.owner.email}","${new Date(d.createdAt).toLocaleString()}","${new Date(d.updatedAt).toLocaleString()}"`);
    lines.push('');

    // Sección: Colaboradores
    lines.push('=== COLABORADORES ===');
    lines.push('Nombre,Email,Puede Editar,Puede Guardar,Puede Eliminar');
    (d.collaborators || []).forEach((c: any) => {
      lines.push(`"${c.name}","${c.email}","${c.canEdit ? 'Sí' : 'No'}","${c.canSave ? 'Sí' : 'No'}","${c.canDelete ? 'Sí' : 'No'}"`);
    });
    lines.push('');

    // Sección: Ejecuciones
    lines.push('=== EJECUCIONES ===');
    lines.push('ID Instancia,Estado,Iniciada por,Email,Fecha Inicio,Fecha Fin,Total Pasos');
    (auditData.instances || []).forEach((inst: any) => {
      lines.push(`"${inst.id}","${inst.status}","${inst.startedBy.name}","${inst.startedBy.email}","${new Date(inst.startedAt).toLocaleString()}","${inst.endedAt ? new Date(inst.endedAt).toLocaleString() : 'En curso'}","${inst.steps.length}"`);
    });
    lines.push('');

    // Sección: Pasos detallados
    lines.push('=== PASOS DE EJECUCIÓN (DETALLE) ===');
    lines.push('ID Instancia,ID Paso,Nodo,Carril,Ejecutado Por,Email,Fecha,Datos del Formulario,Archivos Adjuntos');
    (auditData.instances || []).forEach((inst: any) => {
      (inst.steps || []).forEach((step: any) => {
        const formStr = step.formData ? JSON.stringify(step.formData).replace(/"/g, '""') : '';
        const filesStr = (step.artifactsUrls || []).join(' | ');
        lines.push(`"${inst.id.substring(0,8)}","${step.id.substring(0,8)}","${step.nodeId.substring(0,8)}","${step.laneId || 'N/A'}","${step.executedBy.name}","${step.executedBy.email}","${new Date(step.executedAt).toLocaleString()}","${formStr}","${filesStr}"`);
      });
    });
    lines.push('');

    // Sección: Documentos
    lines.push('=== DOCUMENTOS ===');
    lines.push('Nombre Documento,Versión,Estado,Subido Por,Email,Fecha,URL');
    (auditData.documents || []).forEach((doc: any) => {
      (doc.versions || []).forEach((v: any) => {
        const statusText = v.status === 'ACEPTADO' ? 'Aceptado' : v.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión';
        lines.push(`"${doc.name}","v${v.versionNumber}","${statusText}","${v.uploadedBy.name}","${v.uploadedBy.email}","${new Date(v.createdAt).toLocaleString()}","${v.url}"`);
      });
    });

    const csvContent = '\uFEFF' + lines.join('\n'); // BOM para Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Backlog_${auditData?.diagram?.name || 'Diagrama'}.csv`;
    link.click();
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString() : '—';

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #334155', whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' };
  const tabBase: React.CSSProperties = { padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, borderRadius: '6px 6px 0 0', transition: 'all 0.2s' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
      <div style={{ width: '90vw', maxWidth: '1100px', maxHeight: '85vh', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#f8fafc' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Backlog del Sistema — Auditoría Global
            </h3>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Registro completo de ejecuciones, documentos, usuarios y datos del diagrama.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleExportCsv} disabled={isLoading || !auditData} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              📄 Exportar CSV
            </button>
            <button onClick={handleExportPdf} disabled={isLoading || !auditData} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              📕 Exportar PDF
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', cursor: 'pointer', fontSize: '20px', width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: '#1e293b', flexShrink: 0, padding: '0 24px' }}>
          <button onClick={() => setActiveTab('info')} style={{ ...tabBase, background: activeTab === 'info' ? '#0f172a' : 'transparent', color: activeTab === 'info' ? '#3b82f6' : '#94a3b8' }}>
            🏢 Diagrama & Usuarios
          </button>
          <button onClick={() => setActiveTab('executions')} style={{ ...tabBase, background: activeTab === 'executions' ? '#0f172a' : 'transparent', color: activeTab === 'executions' ? '#3b82f6' : '#94a3b8' }}>
            ▶ Ejecuciones ({auditData?.instances?.length || 0})
          </button>
          <button onClick={() => setActiveTab('documents')} style={{ ...tabBase, background: activeTab === 'documents' ? '#0f172a' : 'transparent', color: activeTab === 'documents' ? '#3b82f6' : '#94a3b8' }}>
            📂 Documentos ({auditData?.documents?.length || 0})
          </button>
        </div>

        {/* Content (scrollable) */}
        <div ref={printRef} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid transparent', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
              <div>Cargando datos de auditoría...</div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : !auditData ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No se pudieron cargar los datos.</div>
          ) : (
            <>
              {/* TAB: Info del Diagrama y Usuarios */}
              {activeTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Info general */}
                  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#334155', fontSize: '14px', fontWeight: 600 }}>Información del Diagrama</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px' }}>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Nombre</div>
                        <div style={{ fontWeight: 600, marginTop: '4px' }}>{auditData.diagram.name}</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Propietario</div>
                        <div style={{ fontWeight: 600, marginTop: '4px' }}>{auditData.diagram.owner.name} ({auditData.diagram.owner.email})</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Creado</div>
                        <div style={{ marginTop: '4px' }}>{fmtDate(auditData.diagram.createdAt)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Última actualización</div>
                        <div style={{ marginTop: '4px' }}>{fmtDate(auditData.diagram.updatedAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Colaboradores */}
                  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#334155', fontSize: '14px', fontWeight: 600 }}>
                      Colaboradores ({(auditData.diagram.collaborators || []).length})
                    </div>
                    {(auditData.diagram.collaborators || []).length === 0 ? (
                      <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>No hay colaboradores invitados.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={thStyle}>Nombre</th>
                              <th style={thStyle}>Email</th>
                              <th style={thStyle}>Editar</th>
                              <th style={thStyle}>Guardar</th>
                              <th style={thStyle}>Eliminar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(auditData.diagram.collaborators || []).map((c: any, i: number) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                <td style={tdStyle}>{c.name}</td>
                                <td style={tdStyle}>{c.email}</td>
                                <td style={tdStyle}><span style={{ color: c.canEdit ? '#10b981' : '#ef4444' }}>{c.canEdit ? '✅' : '❌'}</span></td>
                                <td style={tdStyle}><span style={{ color: c.canSave ? '#10b981' : '#ef4444' }}>{c.canSave ? '✅' : '❌'}</span></td>
                                <td style={tdStyle}><span style={{ color: c.canDelete ? '#10b981' : '#ef4444' }}>{c.canDelete ? '✅' : '❌'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* KPIs Resumen */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Total Ejecuciones</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{auditData.instances.length}</div>
                    </div>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Total Pasos</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{auditData.instances.reduce((acc: number, i: any) => acc + i.steps.length, 0)}</div>
                    </div>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Total Documentos</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{auditData.documents.length}</div>
                    </div>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Completadas</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{auditData.instances.filter((i: any) => i.status === 'COMPLETED').length}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Ejecuciones */}
              {activeTab === 'executions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {auditData.instances.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', background: '#1e293b', borderRadius: '8px' }}>No hay ejecuciones registradas para este diagrama.</div>
                  ) : (
                    auditData.instances.map((inst: any) => (
                      <div key={inst.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
                        {/* Instance Header (clickable) */}
                        <div 
                          onClick={() => setExpandedInstance(expandedInstance === inst.id ? null : inst.id)}
                          style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#334155' }}
                        >
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ 
                              background: inst.status === 'COMPLETED' ? '#10b981' : inst.status === 'RUNNING' ? '#3b82f6' : '#ef4444',
                              color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600
                            }}>
                              {inst.status}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>Instancia: {inst.id.substring(0, 8)}...</span>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>por {inst.startedBy.name}</span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>{fmtDate(inst.startedAt)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{inst.steps.length} pasos</span>
                            <span style={{ fontSize: '14px', color: '#94a3b8' }}>{expandedInstance === inst.id ? '▼' : '▶'}</span>
                          </div>
                        </div>

                        {/* Steps Table (expanded) */}
                        {expandedInstance === inst.id && (
                          <div style={{ overflowX: 'auto' }}>
                            {inst.steps.length === 0 ? (
                              <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>Sin pasos registrados.</div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={thStyle}>#</th>
                                    <th style={thStyle}>Nodo ID</th>
                                    <th style={thStyle}>Carril</th>
                                    <th style={thStyle}>Ejecutado Por</th>
                                    <th style={thStyle}>Fecha</th>
                                    <th style={thStyle}>Datos del Formulario</th>
                                    <th style={thStyle}>Archivos</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inst.steps.map((step: any, idx: number) => (
                                    <tr key={step.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                      <td style={tdStyle}>{idx + 1}</td>
                                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{step.nodeId.substring(0, 8)}</td>
                                      <td style={tdStyle}>{step.laneId ? step.laneId.substring(0, 8) : '—'}</td>
                                      <td style={tdStyle}>{step.executedBy.name}</td>
                                      <td style={tdStyle}>{fmtDate(step.executedAt)}</td>
                                      <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {step.formData ? (
                                          <details>
                                            <summary style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '12px' }}>Ver datos</summary>
                                            <pre style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'pre-wrap', marginTop: '6px', background: '#0f172a', padding: '8px', borderRadius: '4px', maxHeight: '150px', overflow: 'auto' }}>
                                              {JSON.stringify(step.formData, null, 2)}
                                            </pre>
                                          </details>
                                        ) : <span style={{ color: '#64748b' }}>—</span>}
                                      </td>
                                      <td style={tdStyle}>
                                        {step.artifactsUrls && step.artifactsUrls.length > 0 ? (
                                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {step.artifactsUrls.map((url: string, i: number) => (
                                              <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                                                📎 {i + 1}
                                              </a>
                                            ))}
                                          </div>
                                        ) : <span style={{ color: '#64748b' }}>—</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: Documentos */}
              {activeTab === 'documents' && (
                <div>
                  {auditData.documents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', background: '#1e293b', borderRadius: '8px' }}>No hay documentos registrados.</div>
                  ) : (
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={thStyle}>Nombre del Documento</th>
                              <th style={thStyle}>Versión</th>
                              <th style={thStyle}>Estado</th>
                              <th style={thStyle}>Subido Por</th>
                              <th style={thStyle}>Email</th>
                              <th style={thStyle}>Fecha</th>
                              <th style={thStyle}>Link</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditData.documents.flatMap((doc: any) =>
                              doc.versions.map((v: any, vIdx: number) => (
                                <tr key={v.id} style={{ background: vIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                  <td style={{ ...tdStyle, fontWeight: vIdx === 0 ? 600 : 400 }}>
                                    {vIdx === 0 ? `📄 ${doc.name}` : ''}
                                  </td>
                                  <td style={tdStyle}>
                                    <span style={{ background: vIdx === 0 ? '#3b82f6' : '#475569', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                                      v{v.versionNumber}
                                    </span>
                                  </td>
                                  <td style={tdStyle}>
                                    <span style={{
                                      background: v.status === 'ACEPTADO' ? '#10b981' : v.status === 'RECHAZADO' ? '#ef4444' : '#f59e0b',
                                      color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600
                                    }}>
                                      {v.status === 'ACEPTADO' ? 'Aceptado' : v.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión'}
                                    </span>
                                  </td>
                                  <td style={tdStyle}>{v.uploadedBy.name}</td>
                                  <td style={tdStyle}>{v.uploadedBy.email}</td>
                                  <td style={tdStyle}>{fmtDate(v.createdAt)}</td>
                                  <td style={tdStyle}>
                                    <a href={v.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '12px' }}>
                                      Descargar ↗
                                    </a>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
