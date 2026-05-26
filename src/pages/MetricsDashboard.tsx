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
    return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Cargando Inteligencia de Negocios...</div>;
  }

  if (!metrics) return null;

  // Filtrar cuellos de botella dinámicamente en el frontend
  const filteredBottlenecks = metrics.bottlenecks.filter((b: any) => {
    const matchesSearch = b.nodeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLane = selectedLane === '' || b.laneId === selectedLane;
    return matchesSearch && matchesLane;
  });

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            📊 Inteligencia de Procesos (Dashboard KPI)
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Análisis multiusuario en tiempo real para optimización de flujos y cuellos de botella.</p>
        </div>
        <Link to={`/d/${diagramId}`} style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)', transition: 'all 0.2s' }}>
          Volver al Editor
        </Link>
      </div>

      {/* BARRA DE FILTROS DINÁMICOS */}
      <div style={{ display: 'flex', gap: '16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Fecha Inicio</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Fecha Fin</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Filtrar Área (Carril)</label>
          <select 
            value={selectedLane} 
            onChange={(e) => setSelectedLane(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', padding: '8px 12px', fontSize: '13px', outline: 'none', minWidth: '150px' }}
          >
            <option value="">Todas las Áreas</option>
            {metrics.performanceByLane.map((lane: any) => (
              <option key={lane.laneId} value={lane.laneId}>{lane.laneName}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Buscar Actividad (Nodo)</label>
          <input 
            type="text" 
            placeholder="Ej: Aprobación de Solicitud..."
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <button 
          onClick={handleClearFilters}
          style={{ background: '#334155', color: '#94a3b8', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, height: '38px', alignSelf: 'flex-end' }}
        >
          Limpiar
        </button>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="saas-card" style={{ padding: '20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', position: 'relative' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Trámites Activos
            <span title="Instancias del workflow que se encuentran en ejecución (simulación en curso)." style={{ cursor: 'help', color: '#3b82f6' }}>ⓘ</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{metrics.activeProcesses}</div>
        </div>
        
        <div className="saas-card" style={{ padding: '20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', position: 'relative' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Trámites Completados
            <span title="Instancias que han recorrido exitosamente todo el flujo y alcanzaron el evento Fin (End Node)." style={{ cursor: 'help', color: '#10b981' }}>ⓘ</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{metrics.completedProcesses}</div>
        </div>
        
        <div className="saas-card" style={{ padding: '20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Tiempo Promedio de Resolución</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
            {metrics.averageTimeMs ? `${(metrics.averageTimeMs / 1000 / 60).toFixed(1)} min` : 'N/A'}
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Colaboradores Activos</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>{metrics.activeUsers}</div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Rendimiento por Área */}
        <div className="saas-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#e2e8f0', fontWeight: 600 }}>Rendimiento por Área (Tiempo Promedio)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.performanceByLane} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="laneName" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${(val/1000).toFixed(0)}s`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value: number) => [`${(value / 1000).toFixed(1)} seg`, 'Tiempo Promedio']}
                />
                <Legend />
                <Bar dataKey="averageTimeMs" fill="#3b82f6" name="Tiempo Promedio (ms)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cuellos de Botella */}
        <div className="saas-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#e2e8f0', fontWeight: 600 }}>Top Cuellos de Botella (Nodos Críticos)</h3>
          <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
            {filteredBottlenecks.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>No hay datos que coincidan con la búsqueda.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '10px' }}>Actividad (Nodo)</th>
                    <th style={{ paddingBottom: '10px' }}>Área (Carril)</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'right' }}>Tiempo Prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBottlenecks.map((b: any, i: number) => (
                    <tr key={b.nodeId} style={{ borderBottom: '1px solid #334155' }}>
                      <td 
                        style={{ padding: '12px 0', color: i === 0 ? '#ef4444' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}
                        title={b.nodeLabel}
                      >
                        {i === 0 && '🔥 '} {b.nodeLabel}
                      </td>
                      <td style={{ padding: '12px 0', color: '#cbd5e1' }}>{b.laneName}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 500, color: i === 0 ? '#ef4444' : '#3b82f6' }}>
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
  );
};

export default MetricsDashboard;
