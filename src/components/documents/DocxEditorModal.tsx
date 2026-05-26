import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { asBlob } from 'html-docx-js-typescript';

interface DocxEditorModalProps {
  docUrl: string;
  docName: string;
  onClose: () => void;
  onSave: (newFile: File) => Promise<void>;
}

export const DocxEditorModal: React.FC<DocxEditorModalProps> = ({ docUrl, docName, onClose, onSave }) => {
  const [contentHtml, setContentHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocx();
  }, [docUrl]);

  const loadDocx = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch the DOCX file as an ArrayBuffer via Proxy to bypass CORS
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const proxyUrl = `${apiBase}/documents/proxy?url=${encodeURIComponent(docUrl)}&token=${localStorage.getItem('token')}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Error al descargar el archivo original.');
      const arrayBuffer = await response.arrayBuffer();

      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setContentHtml(result.value); // The generated HTML
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar o parsear el documento DOCX.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Convert HTML back to DOCX
      const blob = await asBlob(contentHtml);
      if (!blob) throw new Error("Error al convertir HTML a DOCX");
      
      // Create a File object
      const newFile = new File([blob], docName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      // Pass to parent
      await onSave(newFile);
    } catch (err: any) {
      console.error(err);
      alert('Error al guardar el documento: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 2100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <span style={{ color: 'white', fontWeight: 'bold' }}>Editor DOCX: {docName}</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleSave} 
            disabled={isLoading || isSaving}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: (isLoading || isSaving) ? 'not-allowed' : 'pointer' }}
          >
            {isSaving ? 'Guardando...' : 'Guardar Nueva Versión'}
          </button>
          <button onClick={onClose} disabled={isSaving} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '20px', background: '#e2e8f0', overflowY: 'auto' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#475569', marginTop: '40px' }}>Cargando y parseando documento...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '40px' }}>{error}</p>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', minHeight: '800px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <ReactQuill 
              theme="snow" 
              value={contentHtml} 
              onChange={setContentHtml} 
              style={{ height: '700px' }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
