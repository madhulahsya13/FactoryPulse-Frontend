import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const inputStyle = {
  display: 'block', width: '100%', boxSizing: 'border-box',
  padding: '12px', margin: '8px 0 18px', borderRadius: '8px',
  border: '1px solid #344054', background: '#111827', color: '#ffffff',
};
const primaryButtonStyle = {
  padding: '10px 16px', border: 'none', borderRadius: '8px',
  background: '#2563eb', color: '#ffffff', cursor: 'pointer',
};
const deleteButtonStyle = {
  padding: '8px 12px', border: 'none', borderRadius: '6px',
  background: '#b91c1c', color: '#ffffff', cursor: 'pointer', marginLeft: 6,
};
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const cellStyle = { padding: '12px', borderBottom: '1px solid #344054' };

function useList(apiUrl, path, token) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch {
      setError('Could not load data. Backend may be waking up, press Refresh.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, path, token]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  return { items, setItems, loading, error, setError, load };
}

function Header({ eyebrow, title, text, icon }) {
  return (
    <section className="welcome">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p></div>
      <div className="welcome-icon">{icon}</div>
    </section>
  );
}

function MachineSelect({ machines, value, onChange }) {
  return (
    <>
      <label>Machine</label>
      <select value={value} onChange={e => onChange(e.target.value)} required style={inputStyle}>
        <option value="">Choose a machine</option>
        {machines.map(m => <option key={m.id} value={m.id}>{m.name} (ID: {m.id})</option>)}
      </select>
    </>
  );
}

function NumberField({ label, value, onChange, step = '0.1', required = false }) {
  return (
    <>
      <label>{label}</label>
      <input type="number" step={step} value={value} required={required}
             onChange={e => onChange(e.target.value)} style={inputStyle} />
    </>
  );
}

const nowLocal = () => new Date().toISOString().slice(0, 19);
const fmtTime = t => (t ? String(t).replace('T', ' ').slice(0, 19) : '—');

/* ---------------- ALERTS ---------------- */
export function AlertsPage({ apiUrl, token, onChange }) {
  const alerts = useList(apiUrl, '/alerts', token);
  const machines = useList(apiUrl, '/machines', token);
  const [machineId, setMachineId] = useState('');
  const [alertType, setAlertType] = useState('HIGH_TEMPERATURE');
  const [severity, setSeverity] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  async function addAlert(e) {
    e.preventDefault();
    setSaving(true);
    alerts.setError('');
    setNote('');
    try {
      const res = await axios.post(`${apiUrl}/alerts`, {
        alertType, severity, message: message.trim(),
        resolved: false, timestamp: nowLocal(),
        machine: { id: Number(machineId) },
      }, headers);
      alerts.setItems(cur => [...cur, res.data]);
      setMessage('');
      setNote('Alert added successfully.');
      if (onChange) onChange();
    } catch (err) {
      alerts.setError(err.response?.data?.message || 'Could not add alert.');
    } finally {
      setSaving(false);
    }
  }

  async function resolveAlert(id) {
    try {
      const res = await axios.put(`${apiUrl}/alerts/${id}/resolve`, {}, headers);
      alerts.setItems(cur => cur.map(a => (a.id === id ? res.data : a)));
      if (onChange) onChange();
    } catch {
      alerts.setError('Could not resolve alert.');
    }
  }

  async function deleteAlert(id) {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await axios.delete(`${apiUrl}/alerts/${id}`, headers);
      alerts.setItems(cur => cur.filter(a => a.id !== id));
      if (onChange) onChange();
    } catch {
      alerts.setError('Could not delete alert.');
    }
  }

  return (
    <>
      <Header eyebrow="ALERT CENTER" title="Alerts" text="Raise, track and resolve machine alerts." icon="⚠" />
      <section className="panel" style={{ marginBottom: 24 }}>
        <h3>Add an Alert</h3>
        {machines.items.length === 0 && !machines.loading && <p className="orange">Add a machine first.</p>}
        <form onSubmit={addAlert}>
          <MachineSelect machines={machines.items} value={machineId} onChange={setMachineId} />
          <label>Alert type</label>
          <select value={alertType} onChange={e => setAlertType(e.target.value)} style={inputStyle}>
            <option value="HIGH_TEMPERATURE">HIGH_TEMPERATURE</option>
            <option value="HIGH_VIBRATION">HIGH_VIBRATION</option>
            <option value="LOW_PRESSURE">LOW_PRESSURE</option>
            <option value="OTHER">OTHER</option>
          </select>
          <label>Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value)} style={inputStyle}>
            <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option>
          </select>
          <label>Message</label>
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Temperature above limit" required style={inputStyle} />
          <button type="submit" disabled={saving || machines.items.length === 0} style={primaryButtonStyle}>{saving ? 'Adding...' : '+ Add Alert'}</button>
        </form>
        {note && <p className="green">{note}</p>}
        {alerts.error && <p className="orange" role="alert">{alerts.error}</p>}
      </section>
      <section className="panel">
        <div className="panel-heading"><h3>All Alerts</h3><button type="button" onClick={alerts.load} style={primaryButtonStyle}>Refresh</button></div>
        {alerts.loading ? <p>Loading alerts...</p> : alerts.items.length === 0 ? <p>No alerts found.</p> : (
          <div style={{ overflowX: 'auto' }}><table style={tableStyle}><thead><tr>
            {['ID', 'Machine', 'Type', 'Severity', 'Message', 'Time', 'Status', 'Action'].map(h => <th key={h} style={cellStyle}>{h}</th>)}
          </tr></thead><tbody>{alerts.items.map(a => <tr key={a.id}>
            <td style={cellStyle}>{a.id}</td>
            <td style={cellStyle}>{a.machine?.name || '—'}</td>
            <td style={cellStyle}>{a.alertType || '—'}</td>
            <td style={cellStyle}>{a.severity || '—'}</td>
            <td style={cellStyle}>{a.message || '—'}</td>
            <td style={cellStyle}>{fmtTime(a.timestamp)}</td>
            <td style={cellStyle}><span className={`badge ${a.resolved ? 'running' : ''}`}>{a.resolved ? 'RESOLVED' : 'OPEN'}</span></td>
            <td style={cellStyle}>
              {!a.resolved && <button type="button" onClick={() => resolveAlert(a.id)} style={primaryButtonStyle}>Resolve</button>}
              <button type="button" onClick={() => deleteAlert(a.id)} style={deleteButtonStyle}>Delete</button>
            </td>
          </tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}

/* ---------------- SENSOR MONITORING ---------------- */
export function SensorPage({ apiUrl, token, onChange }) {
  const readings = useList(apiUrl, '/sensor-readings', token);
  const machines = useList(apiUrl, '/machines', token);
  const [machineId, setMachineId] = useState('');
  const [temperature, setTemperature] = useState('');
  const [vibration, setVibration] = useState('');
  const [pressure, setPressure] = useState('');
  const [rpm, setRpm] = useState('');
  const [power, setPower] = useState('');
  const [count, setCount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  async function addReading(e) {
    e.preventDefault();
    setSaving(true);
    readings.setError('');
    setNote('');
    try {
      const res = await axios.post(`${apiUrl}/sensor-readings`, {
        temperature: Number(temperature),
        vibration: Number(vibration),
        pressure: Number(pressure),
        rpm: Number(rpm),
        powerConsumption: Number(power),
        productionCount: Number(count),
        timestamp: nowLocal(),
        machine: { id: Number(machineId) },
      }, headers);
      readings.setItems(cur => [res.data, ...cur]);
      setTemperature(''); setVibration(''); setPressure('');
      setRpm(''); setPower(''); setCount('');
      setNote('Sensor reading saved.');
      if (onChange) onChange();
    } catch (err) {
      readings.setError(err.response?.data?.message || 'Could not save reading.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReading(id) {
    if (!window.confirm('Delete this reading?')) return;
    try {
      await axios.delete(`${apiUrl}/sensor-readings/${id}`, headers);
      readings.setItems(cur => cur.filter(r => r.id !== id));
      if (onChange) onChange();
    } catch {
      readings.setError('Could not delete reading.');
    }
  }

  return (
    <>
      <Header eyebrow="LIVE DATA" title="Sensor Monitoring" text="Record and view machine sensor readings." icon="⌁" />
      <section className="panel" style={{ marginBottom: 24 }}>
        <h3>Add a Sensor Reading</h3>
        {machines.items.length === 0 && !machines.loading && <p className="orange">Add a machine first.</p>}
        <form onSubmit={addReading}>
          <MachineSelect machines={machines.items} value={machineId} onChange={setMachineId} />
          <NumberField label="Temperature (°C)" value={temperature} onChange={setTemperature} required />
          <NumberField label="Vibration (mm/s)" value={vibration} onChange={setVibration} required />
          <NumberField label="Pressure (PSI)" value={pressure} onChange={setPressure} required />
          <NumberField label="RPM" value={rpm} onChange={setRpm} step="1" required />
          <NumberField label="Power consumption (kW)" value={power} onChange={setPower} required />
          <NumberField label="Production count" value={count} onChange={setCount} step="1" required />
          <button type="submit" disabled={saving || machines.items.length === 0} style={primaryButtonStyle}>{saving ? 'Saving...' : '+ Add Reading'}</button>
        </form>
        {note && <p className="green">{note}</p>}
        {readings.error && <p className="orange" role="alert">{readings.error}</p>}
      </section>
      <section className="panel">
        <div className="panel-heading"><h3>Latest Readings</h3><button type="button" onClick={readings.load} style={primaryButtonStyle}>Refresh</button></div>
        {readings.loading ? <p>Loading readings...</p> : readings.items.length === 0 ? <p>No sensor readings yet. Add one above.</p> : (
          <div style={{ overflowX: 'auto' }}><table style={tableStyle}><thead><tr>
            {['ID', 'Machine', 'Temp °C', 'Vibration', 'Pressure', 'RPM', 'Power', 'Count', 'Time', 'Action'].map(h => <th key={h} style={cellStyle}>{h}</th>)}
          </tr></thead><tbody>{readings.items.slice(0, 50).map(r => <tr key={r.id}>
            <td style={cellStyle}>{r.id}</td>
            <td style={cellStyle}>{r.machine?.name || '—'}</td>
            <td style={cellStyle}>{r.temperature ?? '—'}</td>
            <td style={cellStyle}>{r.vibration ?? '—'}</td>
            <td style={cellStyle}>{r.pressure ?? '—'}</td>
            <td style={cellStyle}>{r.rpm ?? '—'}</td>
            <td style={cellStyle}>{r.powerConsumption ?? '—'}</td>
            <td style={cellStyle}>{r.productionCount ?? '—'}</td>
            <td style={cellStyle}>{fmtTime(r.timestamp)}</td>
            <td style={cellStyle}><button type="button" onClick={() => deleteReading(r.id)} style={deleteButtonStyle}>Delete</button></td>
          </tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}

/* ---------------- MAINTENANCE ---------------- */
export function MaintenancePage({ apiUrl, token }) {
  const records = useList(apiUrl, '/maintenance', token);
  const machines = useList(apiUrl, '/machines', token);
  const [machineId, setMachineId] = useState('');
  const [type, setType] = useState('PREVENTIVE');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  async function addRecord(e) {
    e.preventDefault();
    setSaving(true);
    records.setError('');
    setNote('');
    try {
      const res = await axios.post(`${apiUrl}/maintenance`, {
        machineId: Number(machineId),
        maintenanceType: type,
        description: description.trim(),
        scheduledDate: date,
        status,
      }, headers);
      records.setItems(cur => [...cur, res.data]);
      setDescription('');
      setDate('');
      setNote('Maintenance scheduled.');
    } catch (err) {
      records.setError(err.response?.data?.message || 'Could not save maintenance record.');
    } finally {
      setSaving(false);
    }
  }

  async function markCompleted(r) {
    try {
      const res = await axios.put(`${apiUrl}/maintenance/${r.id}`, {
        machineId: r.machine?.id,
        maintenanceType: r.maintenanceType,
        description: r.description,
        scheduledDate: r.scheduledDate,
        status: 'COMPLETED',
      }, headers);
      records.setItems(cur => cur.map(x => (x.id === r.id ? res.data : x)));
    } catch {
      records.setError('Could not update record.');
    }
  }

  async function deleteRecord(id) {
    if (!window.confirm('Delete this maintenance record?')) return;
    try {
      await axios.delete(`${apiUrl}/maintenance/${id}`, headers);
      records.setItems(cur => cur.filter(x => x.id !== id));
    } catch {
      records.setError('Could not delete record.');
    }
  }

  return (
    <>
      <Header eyebrow="PREDICTIVE MAINTENANCE" title="Maintenance" text="Schedule and track machine maintenance work." icon="🔧" />
      <section className="panel" style={{ marginBottom: 24 }}>
        <h3>Schedule Maintenance</h3>
        {machines.items.length === 0 && !machines.loading && <p className="orange">Add a machine first.</p>}
        <form onSubmit={addRecord}>
          <MachineSelect machines={machines.items} value={machineId} onChange={setMachineId} />
          <label>Maintenance type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
            <option value="PREVENTIVE">PREVENTIVE</option>
            <option value="CORRECTIVE">CORRECTIVE</option>
            <option value="INSPECTION">INSPECTION</option>
          </select>
          <label>Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Replace needle and oil motor" required style={inputStyle} />
          <label>Scheduled date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
          <label>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <button type="submit" disabled={saving || machines.items.length === 0} style={primaryButtonStyle}>{saving ? 'Saving...' : '+ Add Maintenance'}</button>
        </form>
        {note && <p className="green">{note}</p>}
        {records.error && <p className="orange" role="alert">{records.error}</p>}
      </section>
      <section className="panel">
        <div className="panel-heading"><h3>Maintenance Records</h3><button type="button" onClick={records.load} style={primaryButtonStyle}>Refresh</button></div>
        {records.loading ? <p>Loading records...</p> : records.items.length === 0 ? <p>No maintenance records yet. Add one above.</p> : (
          <div style={{ overflowX: 'auto' }}><table style={tableStyle}><thead><tr>
            {['ID', 'Machine', 'Type', 'Description', 'Date', 'Status', 'Action'].map(h => <th key={h} style={cellStyle}>{h}</th>)}
          </tr></thead><tbody>{records.items.map(r => <tr key={r.id}>
            <td style={cellStyle}>{r.id}</td>
            <td style={cellStyle}>{r.machine?.name || '—'}</td>
            <td style={cellStyle}>{r.maintenanceType || '—'}</td>
            <td style={cellStyle}>{r.description || '—'}</td>
            <td style={cellStyle}>{r.scheduledDate || '—'}</td>
            <td style={cellStyle}><span className={`badge ${r.status === 'COMPLETED' ? 'running' : ''}`}>{r.status || '—'}</span></td>
            <td style={cellStyle}>
              {r.status !== 'COMPLETED' && <button type="button" onClick={() => markCompleted(r)} style={primaryButtonStyle}>Complete</button>}
              <button type="button" onClick={() => deleteRecord(r.id)} style={deleteButtonStyle}>Delete</button>
            </td>
          </tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}
