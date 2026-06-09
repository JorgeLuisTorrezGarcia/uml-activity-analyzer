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

    lines.push('=== INFORMACIÓN DEL DIAGRAMA ===');
    lines.push('Nombre,Propietario,Email Propietario,Creado,Actualizado');
    const d = auditData.diagram;
    lines.push(`"${d.name}","${d.owner.name}","${d.owner.email}","${new Date(d.createdAt).toLocaleString()}","${new Date(d.updatedAt).toLocaleString()}"`);
    lines.push('');

    lines.push('=== COLABORADORES ===');
    lines.push('Nombre,Email,Puede Editar,Puede Guardar,Puede Eliminar');
    (d.collaborators || []).forEach((c: any) => {
      lines.push(`"${c.name}","${c.email}","${c.canEdit ? 'Sí' : 'No'}","${c.canSave ? 'Sí' : 'No'}","${c.canDelete ? 'Sí' : 'No'}"`);
    });
    lines.push('');

    lines.push('=== EJECUCIONES ===');
    lines.push('ID Instancia,Estado,Iniciada por,Email,Fecha Inicio,Fecha Fin,Total Pasos');
    (auditData.instances || []).forEach((inst: any) => {
      lines.push(`"${inst.id}","${inst.status}","${inst.startedBy.name}","${inst.startedBy.email}","${new Date(inst.startedAt).toLocaleString()}","${inst.endedAt ? new Date(inst.endedAt).toLocaleString() : 'En curso'}","${inst.steps.length}"`);
    });
    lines.push('');

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

    lines.push('=== DOCUMENTOS ===');
    lines.push('Nombre Documento,Versión,Estado,Subido Por,Email,Fecha,URL');
    (auditData.documents || []).forEach((doc: any) => {
      (doc.versions || []).forEach((v: any) => {
        const statusText = v.status === 'ACEPTADO' ? 'Aceptado' : v.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión';
        lines.push(`"${doc.name}","v${v.versionNumber}","${statusText}","${v.uploadedBy.name}","${v.uploadedBy.email}","${new Date(v.createdAt).toLocaleString()}","${v.url}"`);
      });
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Backlog_${auditData?.diagram?.name || 'Diagrama'}.csv`;
    link.click();
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString() : '—';

  const thStyle: React.CSSProperties = { padding: '14px 18px', textAlign: 'left', color: 'var(--txt-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-default)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' };
  const tdStyle: React.CSSProperties = { padding: '14px 18px', fontSize: '13px', color: 'var(--txt-primary)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' };
  const tabBase: React.CSSProperties = { padding: '12px 24px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', borderBottom: '3px solid transparent', fontFamily: 'var(--font-body)' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '90vw', maxWidth: '1100px', maxHeight: '85vh', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'var(--txt-primary)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-display)', color: 'var(--clr-yellow)', fontWeight: 700 }}>
              <span style={{ fontSize: '24px' }}>📋</span> Backlog del Sistema — Auditoría Global
            </h3>
            <p style={{ margin: '6px 0 0', color: 'var(--txt-secondary)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
              Registro completo de ejecuciones, documentos, usuarios y datos del proceso.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleExportCsv} disabled={isLoading || !auditData} className="saas-button" style={{ width: 'auto', background: 'var(--clr-teal-mist)', color: 'var(--clr-teal)', borderColor: 'rgba(132, 197, 177, 0.4)' }}>
              📄 Exportar CSV
            </button>
            <button onClick={handleExportPdf} disabled={isLoading || !auditData} className="saas-button" style={{ width: 'auto', background: 'rgba(220,120,120,0.1)', color: 'rgb(220,120,120)', borderColor: 'rgba(220,120,120,0.4)' }}>
              📕 Exportar PDF
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--txt-muted)', cursor: 'pointer', fontSize: '28px', lineHeight: 1, padding: '0 8px' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--clr-yellow)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-muted)'}>&times;</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)', flexShrink: 0, padding: '0 24px' }}>
          <button onClick={() => setActiveTab('info')} style={{ ...tabBase, borderBottomColor: activeTab === 'info' ? 'var(--clr-purple)' : 'transparent', color: activeTab === 'info' ? 'var(--clr-purple)' : 'var(--txt-muted)' }}>
            🏢 Proceso & Usuarios
          </button>
          <button onClick={() => setActiveTab('executions')} style={{ ...tabBase, borderBottomColor: activeTab === 'executions' ? 'var(--clr-teal)' : 'transparent', color: activeTab === 'executions' ? 'var(--clr-teal)' : 'var(--txt-muted)' }}>
            ▶ Ejecuciones ({auditData?.instances?.length || 0})
          </button>
          <button onClick={() => setActiveTab('documents')} style={{ ...tabBase, borderBottomColor: activeTab === 'documents' ? 'var(--clr-yellow)' : 'transparent', color: activeTab === 'documents' ? 'var(--clr-yellow)' : 'var(--txt-muted)' }}>
            📂 Documentos ({auditData?.documents?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div ref={printRef} style={{ flex: 1, overflowY: 'auto', padding: '32px', background: 'var(--bg-base)' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--clr-purple)' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid transparent', borderTopColor: 'var(--clr-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px' }}>Cargando auditoría...</div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : !auditData ? (
            <div style={{ textAlign: 'center', color: 'var(--txt-muted)', padding: '40px', fontStyle: 'italic' }}>No se pudieron cargar los datos.</div>
          ) : (
            <>
              {/* TAB: Info del Diagrama y Usuarios */}
              {activeTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* KPIs Resumen */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div className="saas-card" style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--txt-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>Total Ejecuciones</div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--clr-purple-light)', fontFamily: 'var(--font-display)' }}>{auditData.instances.length}</div>
                    </div>
                    <div className="saas-card" style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--txt-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>Total Pasos</div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--clr-teal)', fontFamily: 'var(--font-display)' }}>{auditData.instances.reduce((acc: number, i: any) => acc + i.steps.length, 0)}</div>
                    </div>
                    <div className="saas-card" style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--txt-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>Total Documentos</div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--clr-yellow)', fontFamily: 'var(--font-display)' }}>{auditData.documents.length}</div>
                    </div>
                    <div className="saas-card" style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--txt-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>Completadas</div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--clr-sage)', fontFamily: 'var(--font-display)' }}>{auditData.instances.filter((i: any) => i.status === 'COMPLETED').length}</div>
                    </div>
                  </div>

                  {/* Info general */}
                  <div className="saas-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', background: 'var(--bg-overlay)', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--clr-purple-light)', borderBottom: '1px solid var(--border-subtle)' }}>Información del Proceso</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', padding: '24px' }}>
                      <div>
                        <div style={{ color: 'var(--txt-muted)', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Nombre</div>
                        <div style={{ fontWeight: 600, marginTop: '6px', fontSize: '15px' }}>{auditData.diagram.name}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--txt-muted)', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Propietario</div>
                        <div style={{ fontWeight: 600, marginTop: '6px', fontSize: '15px' }}>{auditData.diagram.owner.name} <span style={{ color: 'var(--txt-secondary)', fontWeight: 400 }}>({auditData.diagram.owner.email})</span></div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--txt-muted)', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Creado</div>
                        <div style={{ marginTop: '6px', fontSize: '14px' }}>{fmtDate(auditData.diagram.createdAt)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--txt-muted)', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Última actualización</div>
                        <div style={{ marginTop: '6px', fontSize: '14px' }}>{fmtDate(auditData.diagram.updatedAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Colaboradores */}
                  <div className="saas-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', background: 'var(--bg-overlay)', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--clr-purple-light)', borderBottom: '1px solid var(--border-subtle)' }}>
                      Colaboradores ({(auditData.diagram.collaborators || []).length})
                    </div>
                    {(auditData.diagram.collaborators || []).length === 0 ? (
                      <div style={{ padding: '32px', color: 'var(--txt-muted)', textAlign: 'center', fontStyle: 'italic' }}>No hay colaboradores invitados.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: 'var(--bg-elevated)' }}>
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
                              <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                                <td style={{...tdStyle, fontWeight: 600}}>{c.name}</td>
                                <td style={tdStyle}>{c.email}</td>
                                <td style={tdStyle}><span style={{ color: c.canEdit ? 'var(--clr-sage)' : 'rgb(220,120,120)' }}>{c.canEdit ? '✓' : '✕'}</span></td>
                                <td style={tdStyle}><span style={{ color: c.canSave ? 'var(--clr-sage)' : 'rgb(220,120,120)' }}>{c.canSave ? '✓' : '✕'}</span></td>
                                <td style={tdStyle}><span style={{ color: c.canDelete ? 'var(--clr-sage)' : 'rgb(220,120,120)' }}>{c.canDelete ? '✓' : '✕'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Ejecuciones */}
              {activeTab === 'executions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {auditData.instances.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--txt-muted)', padding: '60px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-default)' }}>No hay ejecuciones registradas para este diagrama.</div>
                  ) : (
                    auditData.instances.map((inst: any) => (
                      <div key={inst.id} className="saas-card" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Instance Header (clickable) */}
                        <div 
                          onClick={() => setExpandedInstance(expandedInstance === inst.id ? null : inst.id)}
                          style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedInstance === inst.id ? 'var(--bg-overlay)' : 'var(--bg-surface)', transition: 'background 0.2s', borderBottom: expandedInstance === inst.id ? '1px solid var(--border-subtle)' : 'none' }}
                        >
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={`badge ${inst.status === 'COMPLETED' ? 'badge-sage' : inst.status === 'RUNNING' ? 'badge-purple' : 'badge-yellow'}`}>
                              {inst.status}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-mono)' }}>ID: {inst.id.substring(0, 8)}...</span>
                            <span style={{ color: 'var(--txt-secondary)', fontSize: '14px' }}>por <span style={{fontWeight: 600}}>{inst.startedBy.name}</span></span>
                            <span style={{ color: 'var(--txt-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{fmtDate(inst.startedAt)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--clr-yellow)', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{inst.steps.length} pasos</span>
                            <span style={{ fontSize: '16px', color: 'var(--txt-muted)' }}>{expandedInstance === inst.id ? '▼' : '▶'}</span>
                          </div>
                        </div>

                        {/* Steps Table (expanded) */}
                        {expandedInstance === inst.id && (
                          <div style={{ overflowX: 'auto', background: 'var(--bg-base)' }}>
                            {inst.steps.length === 0 ? (
                              <div style={{ padding: '30px', color: 'var(--txt-muted)', textAlign: 'center', fontStyle: 'italic' }}>Sin pasos registrados.</div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--bg-elevated)' }}>
                                  <tr>
                                    <th style={thStyle}>#</th>
                                    <th style={thStyle}>Nodo ID</th>
                                    <th style={thStyle}>Carril</th>
                                    <th style={thStyle}>Ejecutado Por</th>
                                    <th style={thStyle}>Fecha</th>
                                    <th style={thStyle}>Datos Formulario</th>
                                    <th style={thStyle}>Archivos</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inst.steps.map((step: any, idx: number) => (
                                    <tr key={step.id} style={{ background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                                      <td style={{...tdStyle, fontWeight: 700, color: 'var(--clr-purple-light)'}}>{idx + 1}</td>
                                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{step.nodeId.substring(0, 8)}</td>
                                      <td style={{...tdStyle, color: 'var(--clr-teal)'}}>{step.laneId ? step.laneId.substring(0, 8) : '—'}</td>
                                      <td style={{...tdStyle, fontWeight: 600}}>{step.executedBy.name}</td>
                                      <td style={{...tdStyle, fontFamily: 'var(--font-mono)'}}>{fmtDate(step.executedAt)}</td>
                                      <td style={{ ...tdStyle, maxWidth: '250px' }}>
                                        {step.formData ? (
                                          <details>
                                            <summary style={{ cursor: 'pointer', color: 'var(--clr-teal)', fontSize: '13px', fontWeight: 600 }}>Ver JSON</summary>
                                            <pre style={{ fontSize: '11px', color: 'var(--clr-yellow)', whiteSpace: 'pre-wrap', marginTop: '8px', background: 'var(--bg-overlay)', padding: '12px', borderRadius: '6px', maxHeight: '150px', overflow: 'auto', border: '1px solid var(--border-default)', fontFamily: 'var(--font-mono)' }}>
                                              {JSON.stringify(step.formData, null, 2)}
                                            </pre>
                                          </details>
                                        ) : <span style={{ color: 'var(--txt-muted)' }}>—</span>}
                                      </td>
                                      <td style={tdStyle}>
                                        {step.artifactsUrls && step.artifactsUrls.length > 0 ? (
                                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {step.artifactsUrls.map((url: string, i: number) => (
                                              <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', background: 'var(--clr-purple-mist)', color: 'var(--clr-purple-light)', border: '1px solid var(--clr-purple)', padding: '4px 8px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
                                                📎 {i + 1}
                                              </a>
                                            ))}
                                          </div>
                                        ) : <span style={{ color: 'var(--txt-muted)' }}>—</span>}
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
                    <div style={{ textAlign: 'center', color: 'var(--txt-muted)', padding: '60px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-default)' }}>No hay documentos registrados.</div>
                  ) : (
                    <div className="saas-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: 'var(--bg-elevated)' }}>
                            <tr>
                              <th style={thStyle}>Nombre Documento</th>
                              <th style={thStyle}>Versión</th>
                              <th style={thStyle}>Estado</th>
                              <th style={thStyle}>Subido Por</th>
                              <th style={thStyle}>Email</th>
                              <th style={thStyle}>Fecha</th>
                              <th style={thStyle}>Enlace</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditData.documents.flatMap((doc: any) =>
                              doc.versions.map((v: any, vIdx: number) => (
                                <tr key={v.id} style={{ background: vIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                                  <td style={{ ...tdStyle, fontWeight: vIdx === 0 ? 700 : 400, color: vIdx === 0 ? 'var(--clr-yellow)' : 'var(--txt-primary)' }}>
                                    {vIdx === 0 ? `📄 ${doc.name}` : ''}
                                  </td>
                                  <td style={tdStyle}>
                                    <span style={{ background: vIdx === 0 ? 'var(--clr-purple-mist)' : 'var(--bg-overlay)', color: vIdx === 0 ? 'var(--clr-purple)' : 'var(--txt-secondary)', border: `1px solid ${vIdx === 0 ? 'var(--clr-purple)' : 'var(--border-default)'}`, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                      v{v.versionNumber}
                                    </span>
                                  </td>
                                  <td style={tdStyle}>
                                    <span className={`badge ${v.status === 'ACEPTADO' ? 'badge-sage' : v.status === 'RECHAZADO' ? 'badge-purple' : 'badge-yellow'}`}>
                                      {v.status === 'ACEPTADO' ? 'Aceptado' : v.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión'}
                                    </span>
                                  </td>
                                  <td style={{...tdStyle, fontWeight: 600}}>{v.uploadedBy.name}</td>
                                  <td style={tdStyle}>{v.uploadedBy.email}</td>
                                  <td style={{...tdStyle, fontFamily: 'var(--font-mono)'}}>{fmtDate(v.createdAt)}</td>
                                  <td style={tdStyle}>
                                    <a href={v.url} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-teal)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
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

export default AuditoriaModal;
