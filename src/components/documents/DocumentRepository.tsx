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
    // Si es un docx, xlsx, pptx usar Google Docs Viewer con la URL original intacta
    if (fileName.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    // PDF o Imágenes usar proxy para bypasear CORS y forzar inline
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
      await fetchDocuments(); // Recargar la lista
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
      position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh',
      backgroundColor: '#0f172a', borderLeft: '1px solid #334155',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', color: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🗂️ Repositorio de Documentos
        </h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>×</button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando documentos...</p>
        ) : documents.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>No hay documentos adjuntos en este proceso.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: '#334155', fontWeight: 500, fontSize: '14px', wordBreak: 'break-all', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📄 {doc.name}</span>
                  
                  {/* Botón Subir Nueva Versión */}
                  <label style={{ cursor: uploadingDocId === doc.id ? 'wait' : 'pointer', background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}>
                    {uploadingDocId === doc.id ? 'Subiendo...' : '↑ Nueva versión'}
                    <input 
                      type="file" 
                      style={{ display: 'none' }}
                      disabled={uploadingDocId === doc.id}
                      onChange={(e) => handleFileUploadVersion(doc.id, e.target.files ? e.target.files[0] : null)}
                    />
                  </label>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {doc.versions.map((v: any, index: number) => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: index < doc.versions.length - 1 ? '1px solid #334155' : 'none', paddingBottom: index < doc.versions.length - 1 ? '8px' : 0 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>v{v.versionNumber}</span>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            background: v.status === 'ACEPTADO' ? '#10b981' : v.status === 'RECHAZADO' ? '#ef4444' : '#f59e0b',
                            color: 'white'
                          }}>
                            {v.status === 'ACEPTADO' ? 'Aceptado' : v.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión'}
                          </span>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>Por {v.uploadedBy.name}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{new Date(v.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a href={v.url} target="_blank" rel="noreferrer" style={{ background: '#475569', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px' }}>
                           Bajar
                        </a>
                        <button 
                          onClick={() => setSelectedDocUrl({
                            url: v.url,
                            name: doc.name,
                            versionId: v.id,
                            status: v.status
                          })}
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Ver
                        </button>
                        {doc.name.match(/\.(docx|doc)$/i) && (
                          <button 
                            onClick={() => setEditingDoc({id: doc.id, url: v.url, name: doc.name})}
                            style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visor Modal (Fullscreen) */}
      {selectedDocUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Visor: {selectedDocUrl.name}</span>
              <span style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                background: selectedDocUrl.status === 'ACEPTADO' ? '#10b981' : selectedDocUrl.status === 'RECHAZADO' ? '#ef4444' : '#f59e0b',
                color: 'white'
              }}>
                {selectedDocUrl.status === 'ACEPTADO' ? 'Aceptado' : selectedDocUrl.status === 'RECHAZADO' ? 'Rechazado' : 'En Revisión'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleUpdateStatus(selectedDocUrl.versionId, 'ACEPTADO')}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                Aceptar
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedDocUrl.versionId, 'RECHAZADO')}
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                Rechazar
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedDocUrl.versionId, 'EN_REVISION')}
                style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                En Revisión
              </button>

              <div style={{ width: '1px', height: '20px', background: '#334155' }} />

              <a href={selectedDocUrl.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                Descargar Directo ↗
              </a>
              <button onClick={() => setSelectedDocUrl(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                Cerrar Visor
              </button>
            </div>
          </div>
          <iframe 
            src={getViewerUrl(selectedDocUrl.url, selectedDocUrl.name)} 
            style={{ width: '100%', flex: 1, border: 'none', background: '#e2e8f0' }}
            title="Visor"
          />
        </div>
      )}

      {/* Editor DOCX (Implementación a continuación) */}
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
