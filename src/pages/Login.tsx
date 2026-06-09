import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
      {/* ── Decoraciones de fondo ── */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(116,69,119,0.18) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', right: '-5%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(132,197,177,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '20%',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(240,233,182,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* ── Panel izquierdo decorativo ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative'
      }}>
        {/* Logo grande */}
        <div style={{
          width: '80px', height: '80px',
          background: 'linear-gradient(135deg, rgb(116,69,119), rgb(80,45,82))',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '28px',
          border: '1px solid rgba(116,69,119,0.7)',
          boxShadow: '0 0 40px rgba(116,69,119,0.45), 0 16px 40px rgba(0,0,0,0.4)'
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgb(240,233,182)" strokeWidth="1.8">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '42px',
          fontWeight: 700,
          color: 'rgb(240, 233, 182)',
          margin: '0 0 12px 0',
          textAlign: 'center',
          lineHeight: 1.2
        }}>
          UML Flow
        </h1>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '11px',
          color: 'rgb(132, 197, 177)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          margin: '0 0 40px 0',
          textAlign: 'center'
        }}>
          Activity Analyzer
        </p>

        <p style={{
          color: 'rgba(240,233,182,0.55)',
          fontSize: '15px',
          textAlign: 'center',
          maxWidth: '320px',
          lineHeight: 1.7,
          fontFamily: "'DM Sans', system-ui, sans-serif"
        }}>
          Diseña, analiza y exporta diagramas de actividad UML con inteligencia colaborativa en tiempo real.
        </p>

        {/* Decoración ornamental */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          marginTop: '40px', width: '280px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(116,69,119,0.5))' }} />
          <span style={{ color: 'rgba(116,69,119,0.6)', fontSize: '18px' }}>✦</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(116,69,119,0.5), transparent)' }} />
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Colaborativo', 'IA Integrada', 'Exportación'].map((feat, i) => (
            <span key={feat} style={{
              padding: '4px 12px',
              borderRadius: '99px',
              fontSize: '11px',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              letterSpacing: '0.5px',
              border: '1px solid',
              ...(i === 0 ? { background: 'rgba(116,69,119,0.12)', color: 'rgb(152,100,156)', borderColor: 'rgba(116,69,119,0.3)' } :
                 i === 1 ? { background: 'rgba(132,197,177,0.12)', color: 'rgb(90,155,135)', borderColor: 'rgba(132,197,177,0.3)' } :
                           { background: 'rgba(172,207,163,0.12)', color: 'rgb(130,165,120)', borderColor: 'rgba(172,207,163,0.3)' })
            }}>
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* ── Divisor vertical ── */}
      <div style={{
        width: '1px',
        background: 'linear-gradient(180deg, transparent, rgba(116,69,119,0.3) 30%, rgba(132,197,177,0.2) 70%, transparent)',
        alignSelf: 'stretch'
      }} />

      {/* ── Panel derecho: formulario ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div className="saas-card fade-in" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '26px',
              fontWeight: 700,
              color: 'rgb(240, 233, 182)',
              margin: '0 0 8px 0'
            }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ color: 'rgba(240,233,182,0.45)', fontSize: '14px', margin: 0 }}>
              Ingresa a tu cuenta UML Flow
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

          <form onSubmit={handleLogin}>
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
                placeholder="••••••••"
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
                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Ornamental divider */}
          <div className="ornamental-divider" style={{ marginTop: '28px' }}>
            o
          </div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(240,233,182,0.4)' }}>
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              style={{
                color: 'rgb(132, 197, 177)',
                textDecoration: 'none',
                fontWeight: 600,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                borderBottom: '1px solid rgba(132,197,177,0.35)',
                paddingBottom: '1px',
                transition: 'all 0.2s'
              }}
            >
              Regístrate aquí
            </Link>
          </div>
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
