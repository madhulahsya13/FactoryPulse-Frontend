import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Icon } from './icons';

const METRICS = {
  temperature: { label: 'Temperature', unit: '°C', limit: 80, color: '#f87171' },
  vibration: { label: 'Vibration', unit: 'mm/s', limit: 6, color: '#fbbf24' },
  pressure: { label: 'Pressure', unit: 'PSI', limit: null, color: '#60a5fa' },
};

const asList = result =>
  result.status === 'fulfilled' && Array.isArray(result.value.data) ? result.value.data : [];

const fmtDate = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '—');

function Gauge({ value, color }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const shown = value == null ? 0 : value;
  return (
    <div className="gauge">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={radius} fill="none" stroke="rgba(139,152,181,0.18)" strokeWidth="12" />
        <circle
          cx="66" cy="66" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          style={{ transition: 'stroke-dashoffset 0.9s ease' }}
        />
      </svg>
      <div className="gauge-value">
        <div><strong>{value == null ? '—' : value}</strong><span>/ 100</span></div>
      </div>
    </div>
  );
}

function TrendChart({ values, metric }) {
  const width = 600;
  const height = 210;
  const pad = { left: 44, right: 14, top: 16, bottom: 26 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const all = metric.limit != null ? [...values, metric.limit] : values;
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.08;
  max += span * 0.08;

  const x = i => pad.left + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
  const y = v => pad.top + (1 - (v - min) / (max - min)) * innerH;

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(1)},${pad.top + innerH} L${x(0).toFixed(1)},${pad.top + innerH} Z`;
  const gradId = `grad-${metric.label}`;
  const ticks = [max, (max + min) / 2, min];

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric.label} trend`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={metric.color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="rgba(139,152,181,0.15)" />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end">{t.toFixed(1)}</text>
        </g>
      ))}
      {metric.limit != null && (
        <g>
          <line x1={pad.left} x2={width - pad.right} y1={y(metric.limit)} y2={y(metric.limit)}
                stroke="#fbbf24" strokeDasharray="5 5" strokeOpacity="0.7" />
          <text x={width - pad.right} y={y(metric.limit) - 6} textAnchor="end" style={{ fill: '#fbbf24' }}>
            limit {metric.limit}{metric.unit}
          </text>
        </g>
      )}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={metric.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#0e1627" stroke={metric.color} strokeWidth="2" />
      ))}
      <text x={pad.left} y={height - 6}>older</text>
      <text x={width - pad.right} y={height - 6} textAnchor="end">latest</text>
    </svg>
  );
}

function DashboardInsights({ apiUrl, token }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [metricKey, setMetricKey] = useState('temperature');

  const load = useCallback(async () => {
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    const results = await Promise.allSettled([
      axios.get(`${apiUrl}/factories`, headers),
      axios.get(`${apiUrl}/production-lines`, headers),
      axios.get(`${apiUrl}/machines`, headers),
      axios.get(`${apiUrl}/alerts`, headers),
      axios.get(`${apiUrl}/sensor-readings`, headers),
      axios.get(`${apiUrl}/maintenance`, headers),
    ]);
    if (results.every(result => result.status === 'rejected')) {
      setFailed(true);
      return;
    }
    setFailed(false);
    setData({
      factories: asList(results[0]),
      lines: asList(results[1]),
      machines: asList(results[2]),
      alerts: asList(results[3]),
      readings: asList(results[4]),
      maintenance: asList(results[5]),
    });
  }, [apiUrl, token]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (failed) {
    return (
      <>
        <div className="section-title"><div><h2>Factory Insights</h2></div></div>
        <div className="panel">
          <p className="orange">Could not load insights. The server may be waking up.</p>
          <button type="button" className="btn-primary" style={{ marginTop: 14 }} onClick={load}>Retry</button>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <div className="section-title"><div><h2>Factory Insights</h2></div></div>
        <div className="panel"><p className="muted">Loading insights...</p></div>
      </>
    );
  }

  const { factories, lines, machines, alerts, readings, maintenance } = data;
  const metric = METRICS[metricKey];

  /* machine status mix */
  const statusOf = m => String(m.status || '').toUpperCase();
  const running = machines.filter(m => statusOf(m) === 'RUNNING').length;
  const stopped = machines.filter(m => statusOf(m) === 'STOPPED').length;
  const inMaintenance = machines.filter(m => statusOf(m) === 'MAINTENANCE').length;
  const otherStatus = machines.length - running - stopped - inMaintenance;
  const mix = [
    { label: 'Running', count: running, color: '#34d399' },
    { label: 'Stopped', count: stopped, color: '#f87171' },
    { label: 'Maintenance', count: inMaintenance, color: '#fbbf24' },
    { label: 'Other', count: otherStatus, color: '#8b98b5' },
  ].filter(item => item.count > 0);

  /* alerts */
  const openAlerts = alerts.filter(a => !a.resolved);
  const severityOf = a => String(a.severity || '').toUpperCase();
  const bySeverity = [
    { label: 'High', key: 'HIGH', color: '#f87171' },
    { label: 'Medium', key: 'MEDIUM', color: '#fbbf24' },
    { label: 'Low', key: 'LOW', color: '#60a5fa' },
  ].map(item => ({ ...item, count: openAlerts.filter(a => severityOf(a) === item.key).length }));
  const maxSeverity = Math.max(1, ...bySeverity.map(item => item.count));
  const openHigh = bySeverity[0].count;
  const openOther = openAlerts.length - openHigh;

  /* readings (backend returns newest first) */
  const recent = readings.slice(0, 15).reverse();
  const series = recent
    .map(r => r[metricKey])
    .filter(v => typeof v === 'number');
  const tempValues = readings.slice(0, 20).map(r => r.temperature).filter(v => typeof v === 'number');
  const avgTemp = tempValues.length
    ? (tempValues.reduce((sum, v) => sum + v, 0) / tempValues.length).toFixed(1)
    : null;

  /* totals */
  const totalHours = machines.reduce((sum, m) => sum + (Number(m.operatingHours) || 0), 0);
  const pendingMaintenance = maintenance
    .filter(r => String(r.status || '').toUpperCase() !== 'COMPLETED')
    .sort((a, b) => String(a.scheduledDate || '').localeCompare(String(b.scheduledDate || '')));

  /* plant health score */
  let health = null;
  if (machines.length > 0) {
    const stoppedShare = (stopped + inMaintenance * 0.5) / machines.length;
    health = Math.round(100 - stoppedShare * 40 - openHigh * 15 - openOther * 5);
    health = Math.max(0, Math.min(100, health));
  }
  let healthLabel = 'No data yet';
  let healthColor = '#8b98b5';
  if (health != null) {
    if (health >= 85) { healthLabel = 'Excellent'; healthColor = '#34d399'; }
    else if (health >= 65) { healthLabel = 'Good'; healthColor = '#60a5fa'; }
    else if (health >= 40) { healthLabel = 'Needs attention'; healthColor = '#fbbf24'; }
    else { healthLabel = 'Critical'; healthColor = '#f87171'; }
  }

  /* factory overview */
  const overview = factories.map(factory => {
    const factoryLines = lines.filter(line => line.factory?.id === factory.id);
    const lineIds = new Set(factoryLines.map(line => line.id));
    const factoryMachines = machines.filter(m => lineIds.has(m.productionLine?.id));
    return { factory, lineCount: factoryLines.length, machineCount: factoryMachines.length };
  });

  return (
    <>
      <div className="section-title">
        <div><h2>Factory Insights</h2><p>Live summary of your factories, machines, alerts and maintenance.</p></div>
        <button type="button" className="btn-primary" onClick={load}>Refresh</button>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Icon name="factory" /></div>
          <p>Factories</p><h2>{factories.length}</h2>
          <span>{lines.length} production line{lines.length === 1 ? '' : 's'}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Icon name="thermometer" /></div>
          <p>Avg Temperature</p><h2>{avgTemp != null ? `${avgTemp}°C` : '—'}</h2>
          <span>{tempValues.length ? `Last ${tempValues.length} readings` : 'No readings yet'}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Icon name="clock" /></div>
          <p>Operating Hours</p><h2>{Math.round(totalHours).toLocaleString()}</h2>
          <span>Across all machines</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Icon name="wrench" /></div>
          <p>Maintenance Due</p><h2 className={pendingMaintenance.length ? 'orange' : 'green'}>{pendingMaintenance.length}</h2>
          <span>{pendingMaintenance[0]?.scheduledDate ? `Next: ${pendingMaintenance[0].scheduledDate}` : 'Nothing scheduled'}</span>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <div className="panel-heading"><div><h3>Plant Health</h3><p>Based on machine status and open alerts</p></div></div>
          <div className="health-wrap">
            <Gauge value={health} color={healthColor} />
            <div className="health-text">
              <h4 style={{ color: healthColor }}>{healthLabel}</h4>
              <p>
                {machines.length === 0
                  ? 'Add machines to see your plant health score.'
                  : `${running} of ${machines.length} machine${machines.length === 1 ? '' : 's'} running, ${openAlerts.length} open alert${openAlerts.length === 1 ? '' : 's'}.`}
              </p>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><div><h3>Machine Status Mix</h3><p>{machines.length} registered machine{machines.length === 1 ? '' : 's'}</p></div></div>
          {machines.length === 0 ? <p className="empty">No machines yet.</p> : (
            <>
              <div className="stack-bar">
                {mix.map(item => (
                  <div key={item.label} className="stack-seg" title={`${item.label}: ${item.count}`}
                       style={{ width: `${(item.count / machines.length) * 100}%`, background: item.color }} />
                ))}
              </div>
              <div className="legend">
                {mix.map(item => <span key={item.label}><i style={{ background: item.color }} />{item.label} ({item.count})</span>)}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid-2 wide-left">
        <div className="panel">
          <div className="panel-heading">
            <div><h3>Sensor Trend</h3><p>Latest {series.length || 0} readings</p></div>
            <div className="tabs">
              {Object.entries(METRICS).map(([key, item]) => (
                <button key={key} type="button" className={`tab ${metricKey === key ? 'active' : ''}`} onClick={() => setMetricKey(key)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {series.length === 0
            ? <p className="empty">No sensor readings yet. Add some in Sensor Monitoring.</p>
            : <TrendChart values={series} metric={metric} />}
        </div>

        <div className="panel">
          <div className="panel-heading"><div><h3>Open Alerts by Severity</h3><p>{openAlerts.length} unresolved of {alerts.length} total</p></div></div>
          {alerts.length === 0 ? <p className="empty">No alerts recorded.</p> : bySeverity.map(item => (
            <div className="bar-row" key={item.key}>
              <span>{item.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.count / maxSeverity) * 100}%`, background: item.color }} /></div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <div className="panel-heading"><div><h3>Upcoming Maintenance</h3><p>Not yet completed</p></div></div>
          {pendingMaintenance.length === 0 ? <p className="empty">No pending maintenance.</p> : pendingMaintenance.slice(0, 5).map(r => (
            <div className="list-row" key={r.id}>
              <div className="list-icon"><Icon name="calendar" /></div>
              <div className="list-main">
                <strong>{r.machine?.name || 'Machine'} · {r.maintenanceType || 'Maintenance'}</strong>
                <span>{r.description || 'No description'}</span>
              </div>
              <span className="badge info">{r.scheduledDate || '—'}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-heading"><div><h3>Factory Overview</h3><p>Production lines and machines per factory</p></div></div>
          {overview.length === 0 ? <p className="empty">No factories yet.</p> : overview.slice(0, 5).map(item => (
            <div className="list-row" key={item.factory.id}>
              <div className="list-icon"><Icon name="factory" /></div>
              <div className="list-main">
                <strong>{item.factory.name}</strong>
                <span>{item.factory.location || item.factory.industryType || 'No details'}</span>
              </div>
              <span className="badge">{item.lineCount} lines · {item.machineCount} machines</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h3>Recent Sensor Readings</h3><p>Newest first</p></div></div>
        {readings.length === 0 ? <p className="empty">No sensor readings yet.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr>{['Machine', 'Temp °C', 'Vibration', 'Pressure', 'RPM', 'Count', 'Time'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {readings.slice(0, 5).map(r => (
                  <tr key={r.id}>
                    <td>{r.machine?.name || '—'}</td>
                    <td>{r.temperature ?? '—'}</td>
                    <td>{r.vibration ?? '—'}</td>
                    <td>{r.pressure ?? '—'}</td>
                    <td>{r.rpm ?? '—'}</td>
                    <td>{r.productionCount ?? '—'}</td>
                    <td>{fmtDate(r.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default DashboardInsights;
