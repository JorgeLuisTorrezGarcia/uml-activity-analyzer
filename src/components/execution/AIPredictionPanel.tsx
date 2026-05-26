import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface AIPredictionModalProps {
  onClose: () => void;
}

export const AIPredictionModal: React.FC<AIPredictionModalProps> = ({ onClose }) => {
  const { id: diagramId } = useParams<{ id: string }>();

  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await axios.post(`${apiBase}/ai/predict-instance`, 
        { diagramId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPrediction(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al obtener la predicción de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'ALTO': return '#ef4444';
      case 'MEDIO': return '#f59e0b';
      case 'BAJO': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
      <div style={{
        width: '500px',
        maxHeight: '80vh',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ background: '#334155', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔮 Predicción Predictiva IA
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
          
          {/* Botón para generar la predicción manualmente */}
          {!prediction && !isLoading && !error && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
                Presiona el botón para que la IA analice el diagrama actual y genere una predicción de tiempos y riesgos.
              </p>
              <button 
                onClick={fetchPrediction}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}
              >
                🚀 Generar Predicción
              </button>
            </div>
          )}

          {isLoading && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid transparent', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
              <div style={{ fontSize: '14px' }}>Gemini estimando tiempos y riesgos...</div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: '#ef4444', marginBottom: '12px' }}>{error}</div>
              <button 
                onClick={fetchPrediction}
                style={{ background: '#334155', color: '#e2e8f0', border: '1px solid #475569', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                Reintentar
              </button>
            </div>
          )}

          {prediction && (
            <>
              {/* KPI Predictivo */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: '#0f172a', padding: '14px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase' }}>Tiempo Total Est.</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa' }}>{prediction.estimatedMinutes} min</div>
                </div>
                <div style={{ flex: 1, background: '#0f172a', padding: '14px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase' }}>Nivel de Riesgo</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: getRiskColor(prediction.riskLevel) }}>{prediction.riskLevel}</div>
                </div>
              </div>

              {/* Explicación de Riesgo */}
              <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>Explicación de Riesgo:</div>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: '1.5' }}>{prediction.riskExplanation}</p>
              </div>

              {/* Puntos Críticos */}
              {prediction.bottlenecks && prediction.bottlenecks.length > 0 && (
                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Actividades con Mayor Retraso:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {prediction.bottlenecks.map((b: any, i: number) => (
                      <div key={i} style={{ background: '#334155', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                        <div style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '13px' }}>⚠️ {b.nodeLabel}</div>
                        <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '4px' }}>{b.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>Recomendaciones IA:</div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {prediction.recommendations.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botón recargar */}
              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <button 
                  onClick={fetchPrediction}
                  disabled={isLoading}
                  style={{ background: '#334155', color: '#e2e8f0', border: '1px solid #475569', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  🔄 Regenerar Predicción
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPredictionModal;
