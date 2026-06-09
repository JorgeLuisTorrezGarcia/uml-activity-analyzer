import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      setAuth(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a0f1e 0%, #231528 50%, #140c18 100%)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ── Orbs decorativos ── */}
      <div style={{
        position: 'absolute', top: '-8%', right: '-5%',
        width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(116,69,119,0.16) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', left: '-5%',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(172,207,163,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* ── Formulario (izquierda) ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div className="saas-card fade-in" style={{ width: '100%', maxWidth: '420px' }}>
          {/* Header tarjeta */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px', height: '32px',
                background: 'linear-gradient(135deg, rgb(116,69,119), rgb(80,45,82))',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(116,69,119,0.6)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(240,233,182)" strokeWidth="2.2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: 'rgb(132, 197, 177)',
                letterSpacing: '2.5px',
                textTransform: 'uppercase'
              }}>
                UML Flow
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '26px',
              fontWeight: 700,
              color: 'rgb(240, 233, 182)',
              margin: '0 0 8px 0'
            }}>
              Crear una cuenta
            </h2>
            <p style={{ color: 'rgba(240,233,182,0.45)', fontSize: '14px', margin: 0 }}>
              Únete a la mejor plataforma de diagramación UML
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(116, 69, 119, 0.12)',
              color: 'rgb(204, 160, 210)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '13px',
              border: '1px solid rgba(116, 69, 119, 0.35)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="label">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                className="saas-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Correo Electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="saas-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="saas-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="saas-button"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="ornamental-divider" style={{ marginTop: '28px' }}>o</div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(240,233,182,0.4)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              style={{
                color: 'rgb(132, 197, 177)',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '1px solid rgba(132,197,177,0.35)',
                paddingBottom: '1px'
              }}
            >
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>

      {/* ── Divisor ── */}
      <div style={{
        width: '1px',
        background: 'linear-gradient(180deg, transparent, rgba(116,69,119,0.3) 30%, rgba(132,197,177,0.2) 70%, transparent)',
        alignSelf: 'stretch'
      }} />

      {/* ── Panel derecho decorativo ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px'
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '34px',
          color: 'rgb(240, 233, 182)',
          marginBottom: '20px',
          textAlign: 'center',
          lineHeight: 1.3
        }}>
          Diagramas UML<br />
          <span style={{ color: 'rgb(132, 197, 177)' }}>al siguiente nivel</span>
        </h2>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px', width: '100%' }}>
          {[
            { icon: '⬡', color: 'rgb(116,69,119)', label: 'Editor visual en tiempo real', desc: 'Arrastra, conecta y edita nodos UML de forma intuitiva' },
            { icon: '◈', color: 'rgb(132,197,177)', label: 'Análisis con IA', desc: 'Detecta errores y optimiza tu diagrama automáticamente' },
            { icon: '◉', color: 'rgb(172,207,163)', label: 'Exportación múltiple', desc: 'PNG, SVG, PDF y documentos Word desde un solo clic' },
          ].map(feat => (
            <div key={feat.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '14px 16px',
              background: 'rgba(35,21,40,0.6)',
              border: '1px solid rgba(116,69,119,0.2)',
              borderRadius: '10px',
            }}>
              <span style={{ fontSize: '20px', color: feat.color, lineHeight: 1, marginTop: '2px' }}>{feat.icon}</span>
              <div>
                <div style={{
                  fontWeight: 600, fontSize: '13px',
                  color: 'rgb(240,233,182)',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  marginBottom: '3px'
                }}>
                  {feat.label}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(240,233,182,0.4)', lineHeight: 1.5 }}>
                  {feat.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
