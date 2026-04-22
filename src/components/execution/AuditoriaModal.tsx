import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

interface AuditoriaModalProps {
  diagramId: string;
  onClose: () => void;
}

export const AuditoriaModal: React.FC<AuditoriaModalProps> = ({ diagramId, onClose }) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInstances();
  }, [diagramId]);

  const fetchInstances = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await axios.get(`${apiBase}/execute/diagram/${diagramId}/instances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInstances(res.data);
    } catch (e) {
      console.error(e);
      alert('Error cargando historial global');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePdf = async (instanceId: string) => {
    setIsGenerating(true);
    setAiReport(null);
    try {
      const token = localStorage.getItem('token');
      // 1. Pedir el markdown a la IA
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await axios.post(`${apiBase}/execute/instance/${instanceId}/ai-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const markdownData = res.data.markdown;
      setAiReport(markdownData);

      // 2. Esperar que React renderice el Markdown en el DOM invisible
      setTimeout(() => {
        if (reportRef.current) {
          const element = reportRef.current;
          const opt = {
            margin:       10,
            filename:     `Auditoria_BPM_${instanceId.split('-')[0]}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          // 3. Generar PDF y Descargar
          html2pdf().from(element).set(opt).save().then(() => {
            setIsGenerating(false);
            setAiReport(null); // Limpiar DOM
          });
        } else {
          setIsGenerating(false);
        }
      }, 500);

    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Error generando reporte IA');
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
      <div className="saas-card" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 Auditoría Global (Reportes IA)
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
        </div>
        
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
          Lista de todas las ejecuciones (Instancias) de este diagrama. Puedes generar un reporte gerencial en PDF analizado por Inteligencia Artificial para cada ejecución.
        </p>

        {isGenerating && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '12px', borderRadius: '8px', color: '#60a5fa', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <div style={{ width: '20px', height: '20px', border: '2px solid transparent', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
             Generando auditoría IA y PDF... Esto tomará unos segundos.
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
          {isLoading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Cargando instancias...</div>
          ) : instances.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px', background: '#0f172a', borderRadius: '8px' }}>No hay ejecuciones registradas para este diagrama.</div>
          ) : (
            instances.map(inst => (
              <div key={inst.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>Instancia: {inst.id.split('-')[0]}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Iniciada por: <span style={{ color: '#e2e8f0' }}>{inst.startedBy.name}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Fecha: {new Date(inst.startedAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    Pasos registrados: {inst.steps.length}
                  </div>
                </div>
                <button 
                  className="saas-button"
                  style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleGeneratePdf(inst.id)}
                  disabled={isGenerating || inst.steps.length === 0}
                  title={inst.steps.length === 0 ? "No hay datos para reportar" : "Generar PDF"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Reporte IA
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DOM Invisible para renderizar el reporte a PDF */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '800px', background: 'white', padding: '40px', color: 'black' }} ref={reportRef}>
        {aiReport && (
          <div style={{ fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>
              <h1 style={{ color: '#1e293b', margin: 0 }}>Reporte de Auditoría BPM</h1>
              <p style={{ color: '#64748b', margin: '5px 0' }}>UML Flow SaaS Intelligence</p>
            </div>
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h2 style={{color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginTop: '20px'}} {...props} />,
                h2: ({node, ...props}) => <h3 style={{color: '#1e293b', marginTop: '15px'}} {...props} />,
                p: ({node, ...props}) => <p style={{color: '#334155', lineHeight: '1.6'}} {...props} />,
                li: ({node, ...props}) => <li style={{color: '#334155', lineHeight: '1.6'}} {...props} />,
                strong: ({node, ...props}) => <strong style={{color: '#0f172a'}} {...props} />,
              }}
            >
              {aiReport}
            </ReactMarkdown>
            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              Documento generado automáticamente por Gemini AI Architect.
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
