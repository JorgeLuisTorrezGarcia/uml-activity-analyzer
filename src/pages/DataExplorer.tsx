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
    <div className="app-layout" style={{ background: 'var(--bg-base)', overflowY: 'auto' }}>
      <MainNavbar />

      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Header de la sección */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '28px', margin: 0, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--txt-primary)' }}>
              📊 Explorador de Datos y Ciencia de Datos CSV
            </h2>
            <p style={{ margin: '8px 0 0 0', color: 'var(--txt-secondary)', fontSize: '15px' }}>
              Sube tu dataset para auditar, calcular métricas y visualizar tendencias con estilo retro.
            </p>
          </div>
          <Link to="/dashboard" className="saas-button secondary" style={{ width: 'auto', textDecoration: 'none' }}>
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Carga del archivo */}
        <div className="saas-card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
            <button className="saas-button" style={{ padding: '12px 24px' }}>
              📁 Elegir archivo CSV
            </button>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              style={{ position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', height: '100%', width: '100%' }}
            />
          </div>
          <span style={{ color: fileName ? 'var(--clr-teal)' : 'var(--txt-muted)', fontSize: '14px', fontWeight: fileName ? 600 : 400, fontFamily: 'var(--font-mono)' }}>
            {fileName || 'Ningún archivo seleccionado.'}
          </span>
        </div>

        {csvData && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* PANEL IZQUIERDO: COLUMNAS Y ESTADÍSTICAS */}
            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Selector de Columna */}
              <div className="saas-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  1. Elige una Columna Numérica
                </h3>
                <select 
                  className="saas-input"
                  value={selectedColumn}
                  onChange={(e) => handleColumnSelect(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">-- Seleccionar Columna --</option>
                  {csvData.headers.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Estadísticas */}
              {stats && (
                <div className="saas-card" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                    2. Estadísticas Descriptivas
                  </h3>
                  {!stats.isNumeric ? (
                    <div style={{ color: 'rgb(220,120,120)', fontSize: '14px', background: 'rgba(220,120,120,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(220,120,120,0.3)' }}>
                      ⚠️ La columna seleccionada no contiene datos numéricos válidos.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                      <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <div className="label">Registros</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--txt-primary)', fontFamily: 'var(--font-mono)' }}>{stats.count}</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <div className="label">Media</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--clr-teal)', fontFamily: 'var(--font-mono)' }}>{stats.mean}</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <div className="label">Mediana</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--clr-sage)', fontFamily: 'var(--font-mono)' }}>{stats.median}</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <div className="label">Desv. Est.</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--clr-yellow)', fontFamily: 'var(--font-mono)' }}>{stats.stdDev}</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <div className="label">Mínimo</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--clr-purple-light)', fontFamily: 'var(--font-mono)' }}>{stats.min}</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <div className="label">Máximo</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--clr-purple-light)', fontFamily: 'var(--font-mono)' }}>{stats.max}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PANEL DERECHO: VISUALIZACIÓN Y TABLA */}
            <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Gráfico Recharts */}
              {stats && stats.isNumeric && (
                <div className="saas-card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      Tendencia e Histograma (Muestra 50 filas)
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <button 
                        onClick={() => setChartType('bar')}
                        style={{ background: chartType === 'bar' ? 'var(--clr-purple-mist)' : 'transparent', color: chartType === 'bar' ? 'var(--clr-yellow)' : 'var(--txt-secondary)', border: '1px solid', borderColor: chartType === 'bar' ? 'var(--clr-purple)' : 'transparent', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
                      >
                        Barras
                      </button>
                      <button 
                        onClick={() => setChartType('line')}
                        style={{ background: chartType === 'line' ? 'var(--clr-teal-mist)' : 'transparent', color: chartType === 'line' ? 'var(--clr-teal)' : 'var(--txt-secondary)', border: '1px solid', borderColor: chartType === 'line' ? 'rgba(132, 197, 177, 0.4)' : 'transparent', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
                      >
                        Línea
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: '320px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                          <XAxis dataKey="index" stroke="var(--txt-muted)" fontSize={11} hide />
                          <YAxis stroke="var(--txt-muted)" fontSize={11} axisLine={false} tickLine={false} fontFamily="var(--font-mono)" />
                          <Tooltip cursor={{ fill: 'var(--clr-purple-mist)', opacity: 0.4 }} contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--txt-primary)', borderRadius: '8px', fontFamily: 'var(--font-mono)' }} />
                          <Bar dataKey="valor" fill="var(--clr-purple-light)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                          <XAxis dataKey="index" stroke="var(--txt-muted)" fontSize={11} hide />
                          <YAxis stroke="var(--txt-muted)" fontSize={11} axisLine={false} tickLine={false} fontFamily="var(--font-mono)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--clr-teal)', color: 'var(--txt-primary)', borderRadius: '8px', fontFamily: 'var(--font-mono)' }} />
                          <Line type="monotone" dataKey="valor" stroke="var(--clr-teal)" strokeWidth={3} dot={{ r: 3, fill: 'var(--clr-teal)', strokeWidth: 0 }} activeDot={{ r: 6, fill: 'var(--clr-yellow)' }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Vista previa de Tabla */}
              <div className="saas-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--clr-yellow)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                    Vista Previa de Datos ({filteredRows.length} registros)
                  </h3>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="saas-input"
                      placeholder="Buscar en datos..."
                      value={searchRowQuery}
                      onChange={(e) => setSearchRowQuery(e.target.value)}
                      style={{ paddingLeft: '36px', minWidth: '240px' }}
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-muted)', fontSize: '14px' }}>🔍</span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '420px', border: '1px solid var(--border-default)', borderRadius: '10px', background: 'var(--bg-surface)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border-default)' }}>
                      <tr>
                        {csvData.headers.map((h, i) => (
                          <th key={i} style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--clr-teal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, 100).map((row, rowIdx) => (
                        <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border-subtle)', background: rowIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-overlay)'} onMouseLeave={(e) => e.currentTarget.style.background = rowIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)'}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} style={{ padding: '12px 18px', color: 'var(--txt-secondary)' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredRows.length > 100 && (
                  <div style={{ color: 'var(--txt-muted)', fontSize: '13px', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
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
