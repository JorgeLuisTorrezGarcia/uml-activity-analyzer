import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { DocxEditorModal } from './DocxEditorModal';
import { io } from 'socket.io-client';

export const DocumentRepository: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { id: diagramId } = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocUrl, setSelectedDocUrl] = useState<{
    url: string;
    name: string;
    versionId: string;
    status: string;
  } | null>(null);
  const [editingDoc, setEditingDoc] = useState<{id: string, url: string, name: string} | null>(null);

  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const handleUpdateStatus = async (versionId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await axios.put(
        `${apiBase}/documents/version/${versionId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (selectedDocUrl && selectedDocUrl.versionId === versionId) {
        setSelectedDocUrl({ ...selectedDocUrl, status: newStatus });
      }
      
      await fetchDocuments();
    } catch (error: any) {
      console.error(error);
      alert('Error al actualizar el estado del documento: ' + (error.response?.data?.error || error.message));
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [diagramId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !diagramId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: { token }
    });

    socket.emit('join-room', diagramId);

    socket.on('document-status-updated', ({ versionId, status: newStatus }: { versionId: string; status: string }) => {
      fetchDocuments();
      setSelectedDocUrl(current => {
        if (current && current.versionId === versionId) {
          return { ...current, status: newStatus };
        }
        return current;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [diagramId]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await axios.get(`${apiBase}/documents/diagram/${diagramId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getViewerUrl = (fileUrl: string, fileName: string) => {
    if (fileName.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const token = localStorage.getItem('token');
    return `${apiBase}/documents/proxy?url=${encodeURIComponent(fileUrl)}&token=${token}`;
  };

  const handleFileUploadVersion = async (documentId: string, file: File | null) => {
    if (!file) return;
    setUploadingDocId(documentId);
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${apiBase}/documents/${documentId}/version`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Nueva versión subida con éxito.');
      await fetchDocuments();
    } catch (error) {
      console.error(error);
      alert('Error al subir la versión.');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleSaveHtmlVersion = async (documentId: string, contentHtml: string, docName: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await axios.post(`${apiBase}/documents/${documentId}/version-html`, {
        contentHtml,
        docName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Nueva versión generada y guardada con éxito.');
      await fetchDocuments();
    } catch (error: any) {
      console.error(error);
      alert('Error al guardar la nueva versión del documento: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh',
      backgroundColor: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-default)',
      boxShadow: '-8px 0 24px rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', color: 'var(--txt-primary)',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
        <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-display)', color: 'var(--clr-yellow)' }}>
          <span style={{ fontSize: '20px' }}>🗂️</span> Repositorio de Documentos
        </h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--txt-muted)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-yellow)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--txt-muted)'}>×</button>
      </div>

      {/* List */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: 'var(--txt-muted)', fontFamily: 'var(--font-mono)' }}>Cargando documentos...</p>
        ) : documents.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--txt-muted)', marginTop: '40px', fontStyle: 'italic' }}>No hay documentos adjuntos en este proceso.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: 'var(--bg-overlay)', fontWeight: 600, fontSize: '14px', wordBreak: 'break-all', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--clr-teal)' }}>📄 {doc.name}</span>
                
                {/* Botón Subir Nueva Versión */}
                <label style={{ cursor: uploadingDocId === doc.id ? 'wait' : 'pointer', background: 'var(--clr-purple-mist)', color: 'var(--clr-yellow)', border: '1px solid var(--clr-purple)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', transition: 'all 0.2s' }}>
                  {uploadingDocId === doc.id ? 'Subiendo...' : '↑ Subir v.Nueva'}
                  <input 
                    type="file" 
                    style={{ display: 'none' }}
                    disabled={uploadingDocId === doc.id}
                    onChange={(e) => handleFileUploadVersion(doc.id, e.target.files ? e.target.files[0] : null)}
                  />
                </label>
              </div>
              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
                {doc.versions.map((v: any, index: number) => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: index < doc.versions.length - 1 ? '1px solid var(--border-subtle)' : 'none', padding: '16px 0' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--clr-purple-light)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '14px' }}>v{v.versionNumber}</span>
                        <span className={`badge ${v.status === 'ACEPTADO' ? 'badge-sage' : v.status === 'RECHAZADO' ? 'badge-purple' : 'badge-yellow'}`}>
                          {v.status === 'ACEPTADO' ? 'Aceptado' : v.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--txt-secondary)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Por {v.uploadedBy.name}</div>
                      <div style={{ color: 'var(--txt-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{new Date(v.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={v.url} target="_blank" rel="noreferrer" style={{ background: 'var(--bg-overlay)', color: 'var(--txt-secondary)', border: '1px solid var(--border-default)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                         Bajar
                      </a>
                      <button 
                        onClick={() => setSelectedDocUrl({
                          url: v.url,
                          name: doc.name,
                          versionId: v.id,
                          status: v.status
                        })}
                        style={{ background: 'var(--clr-teal-mist)', color: 'var(--clr-teal)', border: '1px solid rgba(132, 197, 177, 0.4)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        Ver
                      </button>
                      {doc.name.match(/\.(docx|doc)$/i) && (
                        <button 
                          onClick={() => setEditingDoc({id: doc.id, url: v.url, name: doc.name})}
                          style={{ background: 'var(--clr-purple-mist)', color: 'var(--clr-yellow)', border: '1px solid var(--clr-purple-light)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Visor Modal (Fullscreen) */}
      {selectedDocUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'var(--clr-yellow)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '18px' }}>Visor: {selectedDocUrl.name}</span>
              <span className={`badge ${selectedDocUrl.status === 'ACEPTADO' ? 'badge-sage' : selectedDocUrl.status === 'RECHAZADO' ? 'badge-purple' : 'badge-yellow'}`}>
                {selectedDocUrl.status === 'ACEPTADO' ? 'Aceptado' : selectedDocUrl.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleUpdateStatus(selectedDocUrl.versionId, 'ACEPTADO')}
                style={{ background: 'var(--clr-sage-mist)', color: 'var(--clr-sage-deep)', border: '1px solid rgba(172, 207, 163, 0.4)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                ✓ Aceptar
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedDocUrl.versionId, 'RECHAZADO')}
                style={{ background: 'rgba(220,120,120,0.1)', color: 'rgb(220,120,120)', border: '1px solid rgba(220,120,120,0.4)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                ✕ Rechazar
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedDocUrl.versionId, 'EN_REVISION')}
                style={{ background: 'var(--clr-yellow-pale)', color: 'var(--clr-yellow-warm)', border: '1px solid rgba(240, 233, 182, 0.4)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                ⟲ En Revisión
              </button>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-default)' }} />

              <a href={selectedDocUrl.url} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-teal)', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                Descargar Directo ↗
              </a>
              <button onClick={() => setSelectedDocUrl(null)} className="saas-button secondary" style={{ width: 'auto', marginLeft: '12px' }}>
                Cerrar Visor
              </button>
            </div>
          </div>
          <iframe 
            src={getViewerUrl(selectedDocUrl.url, selectedDocUrl.name)} 
            style={{ width: '100%', flex: 1, border: 'none', background: 'white' }}
            title="Visor"
          />
        </div>
      )}

      {/* Editor DOCX */}
      {editingDoc && (
        <DocxEditorModal 
           diagramId={diagramId || ''}
           documentId={editingDoc.id}
           docUrl={editingDoc.url} 
           docName={editingDoc.name} 
           onClose={() => setEditingDoc(null)} 
           onSave={async (contentHtml: string) => {
             await handleSaveHtmlVersion(editingDoc.id, contentHtml, editingDoc.name);
             setEditingDoc(null);
           }}
        />
      )}
    </div>
  );
};

export default DocumentRepository;
