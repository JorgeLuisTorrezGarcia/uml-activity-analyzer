import React, { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface DocxEditorModalProps {
  diagramId: string;
  documentId: string;
  docUrl: string;
  docName: string;
  onClose: () => void;
  onSave: (contentHtml: string) => Promise<void>;
}

export const DocxEditorModal: React.FC<DocxEditorModalProps> = ({ 
  diagramId, 
  documentId, 
  docUrl, 
  docName, 
  onClose, 
  onSave 
}) => {
  const [contentHtml, setContentHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadDocx();
  }, [docUrl]);

  // Sockets para edición colaborativa en tiempo real
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: { token }
    });

    socketRef.current = socket;

    socket.emit('join-room', diagramId);

    socket.on('document-edited', ({ documentId: remoteDocId, contentHtml: remoteHtml }: { documentId: string; contentHtml: string }) => {
      if (remoteDocId === documentId) {
        setContentHtml(remoteHtml);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [diagramId, documentId]);

  const loadDocx = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const proxyUrl = `${apiBase}/documents/proxy?url=${encodeURIComponent(docUrl)}&token=${localStorage.getItem('token')}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Error al descargar el archivo original.');
      const arrayBuffer = await response.arrayBuffer();

      const result = await mammoth.convertToHtml({ arrayBuffer });
      setContentHtml(result.value);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar o parsear el documento DOCX.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (content: string, _delta: any, source: string) => {
    setContentHtml(content);
    if (source === 'user' && socketRef.current) {
      socketRef.current.emit('edit-document', {
        roomId: diagramId,
        documentId,
        contentHtml: content
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(contentHtml);
    } catch (err: any) {
      console.error(err);
      alert('Error al guardar el documento: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', zIndex: 2100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)' }}>
        <span style={{ color: 'var(--clr-yellow)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '18px' }}>Documento: {docName}</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleSave} 
            disabled={isLoading || isSaving}
            className="saas-button"
            style={{ width: 'auto', padding: '8px 16px', opacity: (isLoading || isSaving) ? 0.6 : 1 }}
          >
            {isSaving ? 'Guardando...' : 'Guardar Nueva Versión'}
          </button>
          <button onClick={onClose} disabled={isSaving} className="saas-button secondary" style={{ width: 'auto', padding: '8px 16px' }}>
            Cancelar
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '32px', background: 'var(--bg-base)', overflowY: 'auto' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: 'var(--txt-muted)', marginTop: '40px', fontFamily: 'var(--font-mono)' }}>Cargando y parseando documento...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', color: 'rgb(220,120,120)', marginTop: '40px', background: 'rgba(220,120,120,0.1)', padding: '16px', borderRadius: '8px', maxWidth: '400px', margin: '40px auto' }}>{error}</p>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto', background: '#f8f9fa', minHeight: '800px', padding: '40px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)', border: '1px solid #e2e8f0' }}>
            <ReactQuill 
              theme="snow" 
              value={contentHtml} 
              onChange={handleChange} 
              style={{ height: '700px', color: '#1e293b' }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
            />
            <style>{`
              .ql-toolbar.ql-snow { border: 1px solid #cbd5e1; border-radius: 4px 4px 0 0; background: white; }
              .ql-container.ql-snow { border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 4px 4px; background: white; }
              .ql-editor { font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.5; }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};
