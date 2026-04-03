import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MainNavbar } from '../components/layout/MainNavbar';

export const Dashboard: React.FC = () => {
  const [owned, setOwned] = useState<any[]>([]);
  const [shared, setShared] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDiagramas();
  }, []);

  const cargarDiagramas = async () => {
    try {
      const res = await api.get('/diagrams');
      setOwned(res.data.owned);
      setShared(res.data.sharedWithMe);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNew = async () => {
    try {
      const res = await api.post('/diagrams', { name: 'Diagrama Nuevo' });
      navigate(`/d/${res.data.id}`);
    } catch (error) {
      alert("Error al crear diagrama");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar el diagrama permanentemente?")) return;
    try {
      await api.delete(`/diagrams/${id}`);
      cargarDiagramas();
    } catch (error) {
      alert('Error eliminando');
    }
  };

  return (
    <div className="app-layout" style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MainNavbar />

      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <section style={{ marginBottom: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '24px', margin: 0 }}>Mis Diagramas</h3>
            <button 
              onClick={handleCreateNew}
              style={{ 
                padding: '10px 24px', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              + Nuevo Diagrama
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {owned.map(d => (
              <div key={d.id} className="card" style={{ 
                background: '#1e293b', 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/d/${d.id}`)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.5)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#f1f5f9' }}>{d.name}</h4>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '0' }}>
                  Actualizado {new Date(d.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {owned.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#64748b', fontSize: '16px' }}>No tienes diagramas creados aún.</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 style={{ color: '#f8fafc', fontSize: '20px', marginBottom: '24px' }}>Compartidos Conmigo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {shared.map(d => (
              <div key={d.id} style={{ 
                background: '#1e293b', 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/d/${d.id}`)}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#f1f5f9' }}>{d.name}</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>De: {d.owner.name}</p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', padding: '4px 10px', background: '#0f172a', color: '#94a3b8', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {d.role}
                  </span>
                  {d.permissions.canEdit && (
                    <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      Editor
                    </span>
                  )}
                </div>
              </div>
            ))}
            {shared.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '24px', color: '#475569', fontSize: '14px', fontStyle: 'italic' }}>
                No hay diagramas compartidos contigo.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
