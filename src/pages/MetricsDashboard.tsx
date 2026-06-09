import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export const MetricsDashboard: React.FC = () => {
  const { id: diagramId } = useParams<{ id: string }>();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLane, setSelectedLane] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, [diagramId, startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      let url = `${apiBase}/metrics/diagram/${diagramId}`;
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data);
    } catch (error) {
      console.error(error);
      alert('Error cargando métricas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setSelectedLane('');
  };

  if (isLoading && !metrics) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div style={{
          width: '44px', height: '44px',
          border: '3px solid transparent',
          borderTopColor: 'var(--clr-teal)',
          borderLeftColor: 'var(--clr-purple)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '18px', fontWeight: 700, fontSize: '15px', color: 'var(--clr-yellow)', fontFamily: "var(--font-body)" }}>
          Cargando Inteligencia de Negocios...
        </p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!metrics) return null;

  const filteredBottlenecks = metrics.bottlenecks.filter((b: any) => {
    const matchesSearch = b.nodeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLane = selectedLane === '' || b.laneId === selectedLane;
    return matchesSearch && matchesLane;
  });

  return (
    <div className="app-layout" style={{ background: 'var(--bg-base)', overflowY: 'auto' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--txt-primary)' }}>
              <span style={{ 
                width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--clr-purple), var(--clr-purple-dark))', 
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-purple)'
              }}>
                📊
              </span>
              Inteligencia de Procesos (KPIs)
            </h1>
            <p style={{ margin: '8px 0 0 0', color: 'var(--txt-secondary)', fontSize: '15px', fontFamily: 'var(--font-body)' }}>
              Análisis retro-vintage en tiempo real para optimización de flujos y cuellos de botella.
            </p>
          </div>
          <Link to={`/d/${diagramId}`} className="saas-button" style={{ width: 'auto', textDecoration: 'none' }}>
            ← Volver al Editor
          </Link>
        </div>

        {/* BARRA DE FILTROS DINÁMICOS */}
        <div className="saas-card" style={{ padding: '20px', marginBottom: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="label">Fecha Inicio</label>
            <input 
              type="date" 
              className="saas-input"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="label">Fecha Fin</label>
            <input 
              type="date" 
              className="saas-input"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="label">Filtrar Área (Carril)</label>
            <select 
              className="saas-input"
              value={selectedLane} 
              onChange={(e) => setSelectedLane(e.target.value)}
              style={{ minWidth: '180px', cursor: 'pointer' }}
            >
              <option value="">Todas las Áreas</option>
              {metrics.performanceByLane.map((lane: any) => (
                <option key={lane.laneId} value={lane.laneId}>{lane.laneName}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '220px' }}>
            <label className="label">Buscar Actividad (Nodo)</label>
            <input 
              type="text" 
              className="saas-input"
              placeholder="Ej: Aprobación de Solicitud..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleClearFilters}
            className="saas-button secondary"
            style={{ width: 'auto', height: '44px' }}
          >
            Limpiar
          </button>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="saas-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--txt-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              Trámites Activos
              <span title="Instancias en ejecución." style={{ cursor: 'help', color: 'var(--clr-teal)' }}>ⓘ</span>
            </div>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--clr-teal)', fontFamily: 'var(--font-display)' }}>
              {metrics.activeProcesses}
            </div>
          </div>
          
          <div className="saas-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--txt-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              Trámites Completados
              <span title="Instancias terminadas." style={{ cursor: 'help', color: 'var(--clr-sage)' }}>ⓘ</span>
            </div>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--clr-sage)', fontFamily: 'var(--font-display)' }}>
              {metrics.completedProcesses}
            </div>
          </div>
          
          <div className="saas-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--txt-secondary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>Tiempo Promedio de Resolución</div>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--clr-yellow)', fontFamily: 'var(--font-display)' }}>
              {metrics.averageTimeMs ? `${(metrics.averageTimeMs / 1000 / 60).toFixed(1)}m` : 'N/A'}
            </div>
          </div>

          <div className="saas-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--txt-secondary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>Colaboradores Activos</div>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--clr-purple-light)', fontFamily: 'var(--font-display)' }}>
              {metrics.activeUsers}
            </div>
          </div>
        </div>

        {/* GRÁFICOS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', flexWrap: 'wrap' }}>
          
          {/* Rendimiento por Área */}
          <div className="saas-card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              Rendimiento por Área (Tiempo Promedio)
            </h3>
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.performanceByLane} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis dataKey="laneName" stroke="var(--txt-muted)" fontSize={12} fontFamily="var(--font-mono)" />
                  <YAxis stroke="var(--txt-muted)" fontSize={12} tickFormatter={(val) => `${(val/1000).toFixed(0)}s`} fontFamily="var(--font-mono)" />
                  <Tooltip 
                    cursor={{ fill: 'var(--clr-purple-mist)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--txt-primary)', borderRadius: '8px' }}
                    formatter={(value: any) => [`${(Number(value) / 1000).toFixed(1)} seg`, 'Tiempo Promedio']}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--txt-secondary)' }} />
                  <Bar dataKey="averageTimeMs" fill="var(--clr-teal)" name="Tiempo Promedio (ms)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cuellos de Botella */}
          <div className="saas-card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              Top Cuellos de Botella (Nodos Críticos)
            </h3>
            <div style={{ overflowY: 'auto', maxHeight: '320px', paddingRight: '10px' }}>
              {filteredBottlenecks.length === 0 ? (
                <p style={{ color: 'var(--txt-muted)', fontSize: '14px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
                  No hay datos que coincidan con la búsqueda.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>
                    <tr style={{ color: 'var(--clr-teal)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '1px' }}>
                      <th style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-default)' }}>Actividad (Nodo)</th>
                      <th style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-default)' }}>Área (Carril)</th>
                      <th style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-default)', textAlign: 'right' }}>Tiempo Prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBottlenecks.map((b: any, i: number) => (
                      <tr key={b.nodeId} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                        <td 
                          style={{ padding: '16px 0', color: i === 0 ? 'rgb(220,120,120)' : 'var(--txt-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}
                          title={b.nodeLabel}
                        >
                          {i === 0 && '🔥 '} {b.nodeLabel}
                        </td>
                        <td style={{ padding: '16px 0', color: 'var(--txt-secondary)' }}>{b.laneName}</td>
                        <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600, color: i === 0 ? 'rgb(220,120,120)' : 'var(--clr-sage)', fontFamily: 'var(--font-mono)' }}>
                          {(b.averageTimeMs / 1000).toFixed(1)} seg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
