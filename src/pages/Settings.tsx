import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { MainNavbar } from '../components/layout/MainNavbar';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/auth/me');
      setHasKey(res.data.hasGeminiKey);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      await api.put('/auth/settings', { geminiApiKey: apiKey });
      setStatus({ type: 'success', msg: 'Configuración guardada correctamente.' });
      setApiKey('');
      fetchStatus();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Error al guardar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout" style={{ background: '#0f172a', minHeight: '100vh' }}>
      <MainNavbar />
      
      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '32px' }}>Configuración de la Cuenta</h2>

        <div className="saas-card">
          <h3 style={{ fontSize: '18px', color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm0 16a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM4 10a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm16 0a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zM6 12h4m4 0h4" /></svg>
            Google Gemini AI
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            Para habilitar el Asistente AI, ingresa tu API Key de Google AI Studio. 
            Tu llave se almacenará de forma <strong>encriptada (AES-256)</strong> y nunca será expuesta en el navegador.
          </p>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="label">API KEY</label>
              <input
                type="password"
                className="saas-input"
                placeholder={hasKey ? "••••••••••••••••••••••••" : "Ingresa tu API Key aquí"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              {hasKey && (
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Ya tienes una llave configurada y activa.
                </p>
              )}
            </div>

            {status.msg && (
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px', 
                fontSize: '13px',
                background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: status.type === 'success' ? '#10b981' : '#f87171',
                border: status.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {status.msg}
              </div>
            )}

            <button type="submit" className="saas-button" disabled={loading || !apiKey}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
          <h4 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '15px' }}>Zona de Peligro</h4>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>Una vez eliminada la llave, el asistente AI dejará de funcionar inmediatamente.</p>
          <button 
            onClick={() => { if(window.confirm('¿Eliminar la API Key?')) handleSave({ preventDefault: () => {} } as any); }}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
          >
            Eliminar API Key
          </button>
        </div>
      </main>
    </div>
  );
};
