import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { NotificationBell } from '../ui/NotificationBell';

export const MainNavbar: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  return (
    <header className="header" style={{ padding: '0 24px' }}>
      {/* ── Logo + Nombre ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, rgb(116, 69, 119), rgb(80, 45, 82))',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(116,69,119,0.6)',
          boxShadow: '0 0 14px rgba(116,69,119,0.5)',
          flexShrink: 0
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(240,233,182)" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '17px',
            fontWeight: 700,
            color: 'rgb(240, 233, 182)',
            letterSpacing: '0.3px'
          }}>
            UML Flow
          </span>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '9px',
            color: 'rgb(132, 197, 177)',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            Activity Analyzer
          </span>
        </div>
      </div>

      {/* ── Navegación central ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/data-explorer')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            color: 'rgb(172, 207, 163)',
            cursor: 'pointer', fontWeight: 600,
            border: '1px solid rgba(172, 207, 163, 0.30)',
            padding: '6px 14px', borderRadius: '6px',
            background: 'rgba(172, 207, 163, 0.08)',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            letterSpacing: '0.3px'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(172, 207, 163, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(172, 207, 163, 0.55)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(172,207,163,0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(172, 207, 163, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(172, 207, 163, 0.30)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          Explorador CSV
        </button>
      </div>

      {/* ── Acciones de usuario ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <NotificationBell />

        {/* Nombre de usuario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(132,197,177), rgb(90,155,135))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700,
            color: 'rgb(26, 15, 30)',
            border: '2px solid rgba(132,197,177,0.4)'
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span style={{
            fontSize: '13px',
            color: 'rgba(240, 233, 182, 0.8)',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user?.name}
          </span>
        </div>

        {/* Botón settings */}
        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(240,233,182,0.45)',
            cursor: 'pointer', padding: '6px', borderRadius: '6px',
            display: 'flex', alignItems: 'center',
            transition: 'all 0.2s'
          }}
          title="Configuración"
          onMouseEnter={e => {
            e.currentTarget.style.color = 'rgb(240,233,182)';
            e.currentTarget.style.background = 'rgba(116,69,119,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(240,233,182,0.45)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        {/* Botón salir */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid rgba(116, 69, 119, 0.45)',
            color: 'rgb(152, 100, 156)',
            borderRadius: '6px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            letterSpacing: '0.4px',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(116,69,119,0.2)';
            e.currentTarget.style.borderColor = 'rgb(152,100,156)';
            e.currentTarget.style.color = 'rgb(240,233,182)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(116,69,119,0.45)';
            e.currentTarget.style.color = 'rgb(152,100,156)';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Salir
        </button>
      </div>
    </header>
  );
};
