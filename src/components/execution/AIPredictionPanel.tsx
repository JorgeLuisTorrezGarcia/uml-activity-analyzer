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
      case 'ALTO': return 'rgb(220,120,120)';
      case 'MEDIO': return 'var(--clr-yellow)';
      case 'BAJO': return 'var(--clr-sage)';
      default: return 'var(--txt-muted)';
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}>
      <div style={{
        width: '560px',
        maxHeight: '85vh',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        color: 'var(--txt-primary)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ background: 'var(--bg-surface)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--clr-yellow)', fontFamily: 'var(--font-display)' }}>
            <span style={{ fontSize: '20px' }}>🔮</span> Predicción IA
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--txt-muted)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--clr-yellow)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt-muted)')}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
          
          {/* Botón inicial */}
          {!prediction && !isLoading && !error && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: 'var(--txt-secondary)', marginBottom: '24px', fontSize: '15px' }}>
                La Inteligencia Artificial analizará la estructura de tu proceso para predecir tiempos de ejecución, identificar posibles cuellos de botella y evaluar riesgos.
              </p>
              <button 
                onClick={fetchPrediction}
                className="saas-button"
                style={{ width: 'auto', padding: '14px 28px', fontSize: '15px' }}
              >
                🚀 Generar Predicción
              </button>
            </div>
          )}

          {isLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--clr-yellow)' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid transparent', borderTopColor: 'var(--clr-purple)', borderRightColor: 'var(--clr-teal)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
              <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Analizando proceso...</div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '32px 0', background: 'rgba(220,120,120,0.1)', borderRadius: '10px', border: '1px solid rgba(220,120,120,0.3)' }}>
              <div style={{ color: 'rgb(220,120,120)', marginBottom: '16px', fontWeight: 600 }}>{error}</div>
              <button onClick={fetchPrediction} className="saas-button secondary" style={{ width: 'auto' }}>
                Reintentar
              </button>
            </div>
          )}

          {prediction && (
            <>
              {/* KPIs Predictivos */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--txt-secondary)', fontSize: '11px', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>TIEMPO TOTAL EST.</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--clr-teal)', fontFamily: 'var(--font-display)' }}>{prediction.estimatedMinutes} min</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--txt-secondary)', fontSize: '11px', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>NIVEL DE RIESGO</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getRiskColor(prediction.riskLevel), fontFamily: 'var(--font-display)' }}>{prediction.riskLevel}</div>
                </div>
              </div>

              {/* Explicación de Riesgo */}
              <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--clr-purple-light)', fontWeight: 700, marginBottom: '10px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>EXPLICACIÓN DEL RIESGO</div>
                <p style={{ margin: 0, color: 'var(--txt-primary)', lineHeight: '1.6' }}>{prediction.riskExplanation}</p>
              </div>

              {/* Puntos Críticos */}
              {prediction.bottlenecks && prediction.bottlenecks.length > 0 && (
                <div>
                  <div style={{ color: 'var(--clr-purple-light)', fontWeight: 700, marginBottom: '12px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>POSIBLES CUELLOS DE BOTELLA</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {prediction.bottlenecks.map((b: any, i: number) => (
                      <div key={i} style={{ background: 'var(--bg-overlay)', padding: '14px 16px', borderRadius: '8px', borderLeft: '4px solid var(--clr-yellow)', borderTop: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--clr-yellow)', fontSize: '14px', marginBottom: '6px' }}>⚠️ {b.nodeLabel}</div>
                        <div style={{ color: 'var(--txt-secondary)', fontSize: '13px', lineHeight: '1.5' }}>{b.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <div>
                  <div style={{ color: 'var(--clr-purple-light)', fontWeight: 700, marginBottom: '12px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>RECOMENDACIONES</div>
                  <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--txt-primary)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.6' }}>
                    {prediction.recommendations.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botón recargar */}
              <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                <button onClick={fetchPrediction} disabled={isLoading} className="saas-button secondary" style={{ width: 'auto', fontSize: '13px' }}>
                  🔄 Regenerar Análisis
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
