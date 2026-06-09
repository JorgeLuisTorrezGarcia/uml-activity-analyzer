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
    } catch {
      alert('Error al crear diagrama');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar el diagrama permanentemente?')) return;
    try {
      await api.delete(`/diagrams/${id}`);
      cargarDiagramas();
    } catch {
      alert('Error eliminando');
    }
  };

  return (
    <div className="app-layout" style={{
      background: 'linear-gradient(160deg, #1a0f1e 0%, #140c18 100%)',
      minHeight: '100vh'
    }}>
      <MainNavbar />

      {/* ── Orb decorativo fondo ── */}
      <div style={{
        position: 'fixed', top: '10%', right: '5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(116,69,119,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '5%', left: '10%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(132,197,177,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <main style={{
        flex: 1, padding: '40px 48px',
        maxWidth: '1280px', margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1
      }}>

        {/* ── Sección: Mis Diagramas ── */}
        <section style={{ marginBottom: '56px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '28px'
          }}>
            <div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '26px',
                fontWeight: 700,
                color: 'rgb(240, 233, 182)',
                margin: '0 0 4px 0'
              }}>
                Mis Diagramas
              </h2>
              <p style={{
                color: 'rgba(240,233,182,0.4)',
                fontSize: '13px', margin: 0,
                fontFamily: "'DM Sans', system-ui, sans-serif"
              }}>
                {owned.length} diagrama{owned.length !== 1 ? 's' : ''} creados
              </p>
            </div>

            <button
              onClick={handleCreateNew}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '11px 22px',
                background: 'linear-gradient(135deg, rgb(116,69,119), rgb(80,45,82))',
                color: 'rgb(240, 233, 182)',
                border: '1px solid rgba(116,69,119,0.7)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '13px',
                letterSpacing: '0.3px',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 4px 16px rgba(116,69,119,0.4)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(116,69,119,0.55)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(116,69,119,0.4)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo Diagrama
            </button>
          </div>

          {/* Grid de tarjetas propias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
            {owned.map((d, idx) => (
              <DiagramCard
                key={d.id}
                name={d.name}
                updatedAt={d.updatedAt}
                index={idx}
                onClick={() => navigate(`/d/${d.id}`)}
                onDelete={() => handleDelete(d.id)}
              />
            ))}

            {owned.length === 0 && (
              <EmptyState message="No tienes diagramas creados aún." onAction={handleCreateNew} />
            )}
          </div>
        </section>

        {/* ── Sección: Compartidos ── */}
        <section>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '22px',
              fontWeight: 700,
              color: 'rgb(240, 233, 182)',
              margin: '0 0 4px 0'
            }}>
              Compartidos Conmigo
            </h2>
            <div style={{
              height: '2px',
              width: '60px',
              background: 'linear-gradient(90deg, rgb(132,197,177), transparent)',
              borderRadius: '2px'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
            {shared.map(d => (
              <SharedCard
                key={d.id}
                name={d.name}
                ownerName={d.owner.name}
                role={d.role}
                canEdit={d.permissions.canEdit}
                onClick={() => navigate(`/d/${d.id}`)}
              />
            ))}
            {shared.length === 0 && (
              <div style={{
                gridColumn: '1/-1',
                padding: '28px',
                color: 'rgba(240,233,182,0.3)',
                fontSize: '14px',
                fontStyle: 'italic',
                fontFamily: "'DM Sans', system-ui, sans-serif"
              }}>
                No hay diagramas compartidos contigo aún.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

/* ── Subcomponentes internos ── */

const CARD_COLORS = [
  { from: 'rgba(116,69,119,0.18)', accent: 'rgba(116,69,119,0.55)', tag: 'rgb(152,100,156)' },
  { from: 'rgba(132,197,177,0.12)', accent: 'rgba(132,197,177,0.40)', tag: 'rgb(90,155,135)' },
  { from: 'rgba(172,207,163,0.12)', accent: 'rgba(172,207,163,0.35)', tag: 'rgb(130,165,120)' },
  { from: 'rgba(240,233,182,0.08)', accent: 'rgba(240,233,182,0.25)', tag: 'rgb(200,190,130)' },
];

const DiagramCard: React.FC<{
  name: string;
  updatedAt: string;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}> = ({ name, updatedAt, index, onClick, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const palette = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(145deg, ${palette.from}, rgba(35,21,40,0.7))`,
        border: `1px solid ${hovered ? palette.accent : 'rgba(116,69,119,0.2)'}`,
        borderRadius: '14px',
        padding: '22px 22px 18px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered
          ? `0 16px 36px rgba(0,0,0,0.4), 0 0 0 1px ${palette.accent}`
          : '0 2px 8px rgba(0,0,0,0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Línea top decorativa */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${palette.tag}, transparent)`,
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 0.3s'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        {/* Icono diagrama */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '8px',
          background: 'rgba(0,0,0,0.25)',
          border: `1px solid ${palette.accent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.tag} strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>
          </svg>
        </div>

        {/* Botón eliminar */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(240,233,182,0.25)',
            cursor: 'pointer', padding: '6px', borderRadius: '6px',
            display: 'flex', alignItems: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.stopPropagation();
            e.currentTarget.style.color = 'rgb(204,100,100)';
            e.currentTarget.style.background = 'rgba(200,80,80,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(240,233,182,0.25)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <h4 style={{
        margin: '0 0 8px 0',
        fontSize: '16px',
        fontWeight: 600,
        color: 'rgb(240, 233, 182)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {name}
      </h4>
      <p style={{
        fontSize: '11px',
        fontFamily: "'Space Mono', monospace",
        color: 'rgba(240,233,182,0.35)',
        margin: 0
      }}>
        Actualizado {new Date(updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
};

const SharedCard: React.FC<{
  name: string;
  ownerName: string;
  role: string;
  canEdit: boolean;
  onClick: () => void;
}> = ({ name, ownerName, role, canEdit, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(145deg, rgba(45,30,50,0.8), rgba(35,21,40,0.6))',
        border: `1px solid ${hovered ? 'rgba(132,197,177,0.4)' : 'rgba(116,69,119,0.18)'}`,
        borderRadius: '14px',
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.2)'
      }}
    >
      <h4 style={{
        margin: '0 0 5px 0',
        fontSize: '15px',
        fontWeight: 600,
        color: 'rgb(240, 233, 182)',
        fontFamily: "'DM Sans', system-ui, sans-serif"
      }}>
        {name}
      </h4>
      <p style={{
        fontSize: '12px',
        color: 'rgba(240,233,182,0.4)',
        margin: '0 0 14px 0',
        fontFamily: "'DM Sans', system-ui, sans-serif"
      }}>
        De: {ownerName}
      </p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '3px 10px', borderRadius: '99px',
          fontSize: '10px', fontFamily: "'Space Mono', monospace", fontWeight: 700,
          background: 'rgba(116,69,119,0.15)',
          color: 'rgb(152,100,156)',
          border: '1px solid rgba(116,69,119,0.3)'
        }}>
          {role}
        </span>
        {canEdit && (
          <span style={{
            padding: '3px 10px', borderRadius: '99px',
            fontSize: '10px', fontFamily: "'Space Mono', monospace", fontWeight: 700,
            background: 'rgba(132,197,177,0.12)',
            color: 'rgb(90,155,135)',
            border: '1px solid rgba(132,197,177,0.3)'
          }}>
            Editor
          </span>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string; onAction: () => void }> = ({ message, onAction }) => (
  <div
    style={{
      gridColumn: '1/-1',
      textAlign: 'center',
      padding: '64px 40px',
      background: 'rgba(35,21,40,0.4)',
      borderRadius: '16px',
      border: '2px dashed rgba(116,69,119,0.25)'
    }}
  >
    <div style={{
      width: '56px', height: '56px', borderRadius: '14px',
      background: 'rgba(116,69,119,0.12)',
      border: '1px solid rgba(116,69,119,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 16px'
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(116,69,119)" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    </div>
    <p style={{
      color: 'rgba(240,233,182,0.4)', fontSize: '15px', marginBottom: '20px',
      fontFamily: "'DM Sans', system-ui, sans-serif"
    }}>
      {message}
    </p>
    <button
      onClick={onAction}
      style={{
        padding: '9px 20px',
        background: 'rgba(116,69,119,0.2)',
        border: '1px solid rgba(116,69,119,0.45)',
        color: 'rgb(152,100,156)',
        borderRadius: '8px', cursor: 'pointer',
        fontSize: '13px', fontWeight: 600,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(116,69,119,0.35)';
        e.currentTarget.style.color = 'rgb(240,233,182)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(116,69,119,0.2)';
        e.currentTarget.style.color = 'rgb(152,100,156)';
      }}
    >
      Crear mi primer diagrama →
    </button>
  </div>
);
