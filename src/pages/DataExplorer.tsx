import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MainNavbar } from '../components/layout/MainNavbar';

export const DataExplorer: React.FC = () => {
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [searchRowQuery, setSearchRowQuery] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSV(text);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) {
      alert("El archivo CSV está vacío.");
      return;
    }

    // Cabeceras
    const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());

    // Filas
    const rows = lines.slice(1).map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    });

    setCsvData({ headers, rows });
    setSelectedColumn('');
    setStats(null);
  };

  const handleColumnSelect = (colName: string) => {
    setSelectedColumn(colName);
    if (!csvData) return;

    const colIndex = csvData.headers.indexOf(colName);
    if (colIndex === -1) return;

    // Extraer valores numéricos
    const numbers = csvData.rows
      .map(row => parseFloat(row[colIndex]))
      .filter(val => !isNaN(val));

    if (numbers.length === 0) {
      setStats({ isNumeric: false });
      return;
    }

    // Calcular Estadísticas
    const count = numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    const mean = sum / count;

    // Mediana
    const sorted = [...numbers].sort((a, b) => a - b);
    const half = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 
      ? sorted[half] 
      : (sorted[half - 1] + sorted[half]) / 2;

    // Desviación Estándar
    const squareDiffs = numbers.map(val => {
      const diff = val - mean;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((acc, curr) => acc + curr, 0) / count;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Preparar datos para Recharts (Muestra de las primeras 50 filas)
    const chartData = numbers.slice(0, 50).map((val, idx) => ({
      index: `Fila ${idx + 1}`,
      valor: val
    }));

    setStats({
      isNumeric: true,
      count,
      min: min.toFixed(2),
      max: max.toFixed(2),
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      stdDev: stdDev.toFixed(2),
      chartData
    });
  };

  // Filtrar filas según búsqueda
  const filteredRows = csvData
    ? csvData.rows.filter(row => 
        row.some(cell => cell.toLowerCase().includes(searchRowQuery.toLowerCase()))
      )
    : [];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MainNavbar />

      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', overflowY: 'auto', maxHeight: 'calc(100vh - 56px)' }}>
        
        {/* Header de la sección */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 700 }}>📊 Explorador de Datos y Ciencia de Datos CSV</h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Sube tu dataset (ej: subastas, ventas) para auditar, calcular métricas y visualizar tendencias.</p>
          </div>
          <Link to="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', border: '1px solid #334155', padding: '8px 16px', borderRadius: '6px' }}>
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Carga del archivo */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
            <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              📁 Elegir archivo CSV
            </button>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              style={{ position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', height: '100%', width: '100%' }}
            />
          </div>
          <span style={{ color: fileName ? '#3b82f6' : '#64748b', fontSize: '14px', fontWeight: fileName ? 'bold' : 'normal' }}>
            {fileName || 'Ningún archivo seleccionado.'}
          </span>
        </div>

        {csvData && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
            
            {/* PANEL IZQUIERDO: COLUMNAS Y ESTADÍSTICAS */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Selector de Columna */}
              <div className="saas-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#e2e8f0', fontWeight: 600 }}>1. Elige una Columna Numérica</h3>
                <select 
                  value={selectedColumn}
                  onChange={(e) => handleColumnSelect(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', padding: '10px 12px', outline: 'none', fontSize: '14px' }}
                >
                  <option value="">-- Seleccionar Columna --</option>
                  {csvData.headers.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Estadísticas */}
              {stats && (
                <div className="saas-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#e2e8f0', fontWeight: 600 }}>2. Estadísticas Descriptivas</h3>
                  {!stats.isNumeric ? (
                    <div style={{ color: '#ef4444', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      ⚠️ La columna seleccionada no contiene datos numéricos válidos.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Registros</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>{stats.count}</div>
                      </div>
                      <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Media</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>{stats.mean}</div>
                      </div>
                      <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Mediana</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>{stats.median}</div>
                      </div>
                      <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Desv. Est.</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>{stats.stdDev}</div>
                      </div>
                      <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Mínimo</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>{stats.min}</div>
                      </div>
                      <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Máximo</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>{stats.max}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PANEL DERECHO: VISUALIZACIÓN Y TABLA */}
            <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Gráfico Recharts */}
              {stats && stats.isNumeric && (
                <div className="saas-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#e2e8f0', fontWeight: 600 }}>Tendencia e Histograma (Muestra 50 filas)</h3>
                    <div style={{ display: 'flex', gap: '8px', background: '#0f172a', padding: '3px', borderRadius: '6px', border: '1px solid #334155' }}>
                      <button 
                        onClick={() => setChartType('bar')}
                        style={{ background: chartType === 'bar' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Barras
                      </button>
                      <button 
                        onClick={() => setChartType('line')}
                        style={{ background: chartType === 'line' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Línea
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="index" stroke="#64748b" fontSize={11} hide />
                          <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3b82f6', color: '#f8fafc', borderRadius: '8px' }} />
                          <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="index" stroke="#64748b" fontSize={11} hide />
                          <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#10b981', color: '#f8fafc', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Vista previa de Tabla */}
              <div className="saas-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#e2e8f0', fontWeight: 600 }}>Vista Previa de Datos ({filteredRows.length} registros)</h3>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Buscar en datos..."
                      value={searchRowQuery}
                      onChange={(e) => setSearchRowQuery(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', padding: '8px 12px 8px 32px', fontSize: '13px', outline: 'none', width: '100%', minWidth: '200px' }}
                    />
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px' }}>🔍</span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid #334155', borderRadius: '8px', background: '#0f172a' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#0f172a' }}>
                      <tr style={{ color: '#94a3b8', borderBottom: '2px solid #334155' }}>
                        {csvData.headers.map((h, i) => (
                          <th key={i} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, 100).map((row, rowIdx) => (
                        <tr key={rowIdx} style={{ borderBottom: '1px solid #1e293b', background: rowIdx % 2 === 0 ? '#0f172a' : '#1e293b', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#334155'} onMouseLeave={(e) => e.currentTarget.style.background = rowIdx % 2 === 0 ? '#0f172a' : '#1e293b'}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} style={{ padding: '10px 16px', color: '#cbd5e1' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredRows.length > 100 && (
                  <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '16px', background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                    Mostrando solo las primeras 100 filas filtradas por rendimiento.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default DataExplorer;
