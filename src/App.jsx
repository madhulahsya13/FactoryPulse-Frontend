import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './Login';
import { AlertsPage, SensorPage, MaintenancePage } from './ExtraPages';
import './App.css';

const API_URL = `${import.meta.env.VITE_API_URL ?? 'https://factorypulse-backend-also.onrender.com'}/api`;

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
  background: '#b91c1c', color: '#ffffff', cursor: 'pointer',
};
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const cellStyle = { padding: '12px', borderBottom: '1px solid #344054' };

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('factorypulse_token'));
  const [dashboard, setDashboard] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [page, setPage] = useState('Dashboard');

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingFactories, setLoadingFactories] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [addingFactory, setAddingFactory] = useState(false);
  const [addingLine, setAddingLine] = useState(false);
  const [addingMachine, setAddingMachine] = useState(false);

  const [dashboardError, setDashboardError] = useState('');
  const [factoryError, setFactoryError] = useState('');
  const [factoryMessage, setFactoryMessage] = useState('');
  const [lineError, setLineError] = useState('');
  const [lineMessage, setLineMessage] = useState('');
  const [machineError, setMachineError] = useState('');
  const [machineMessage, setMachineMessage] = useState('');

  const [factoryName, setFactoryName] = useState('');
  const [factoryLocation, setFactoryLocation] = useState('');
  const [factoryDescription, setFactoryDescription] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineDescription, setLineDescription] = useState('');
  const [selectedFactoryId, setSelectedFactoryId] = useState('');
  const [machineNameInput, setMachineNameInput] = useState('');
  const [machineTypeInput, setMachineTypeInput] = useState('');
  const [machineStatusInput, setMachineStatusInput] = useState('RUNNING');
  const [operatingHoursInput, setOperatingHoursInput] = useState('0');
  const [selectedLineId, setSelectedLineId] = useState('');

  const getAuthConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const logout = useCallback(() => {
    ['factorypulse_token', 'factorypulse_name', 'factorypulse_email', 'factorypulse_role']
        .forEach(key => sessionStorage.removeItem(key));
    setToken(null);
    setDashboard(null);
    setMachines([]);
    setAlerts([]);
    setFactories([]);
    setProductionLines([]);
    setPage('Dashboard');
    setDashboardError('');
  }, []);

  const handleLogin = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const data = response.data;
    if (!data.token) throw new Error('The server did not return a login token.');
    sessionStorage.setItem('factorypulse_token', data.token);
    sessionStorage.setItem('factorypulse_name', data.name || '');
    sessionStorage.setItem('factorypulse_email', data.email || email);
    sessionStorage.setItem('factorypulse_role', data.role || 'USER');
    setToken(data.token);
  };

  const loadFactories = useCallback(async () => {
    if (!token) return;
    setLoadingFactories(true);
    setFactoryError('');
    try {
      const response = await axios.get(`${API_URL}/factories`, getAuthConfig());
      setFactories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setFactoryError(error.response?.data?.message || 'Could not load factories. Check the backend and your permissions.');
    } finally {
      setLoadingFactories(false);
    }
  }, [token, getAuthConfig]);

  const loadProductionLines = useCallback(async () => {
    if (!token) return;
    setLoadingLines(true);
    setLineError('');
    try {
      const response = await axios.get(`${API_URL}/production-lines`, getAuthConfig());
      setProductionLines(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setLineError(error.response?.data?.message || 'Could not load production lines. Check the backend.');
    } finally {
      setLoadingLines(false);
    }
  }, [token, getAuthConfig]);

  const loadMachines = useCallback(async () => {
    if (!token) return;
    setLoadingMachines(true);
    setMachineError('');
    try {
      const response = await axios.get(`${API_URL}/machines`, getAuthConfig());
      setMachines(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMachineError(error.response?.data?.message || 'Could not load machines. Check the backend.');
    } finally {
      setLoadingMachines(false);
    }
  }, [token, getAuthConfig]);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    setLoadingDashboard(true);
    setDashboardError('');
    const results = await Promise.allSettled([
      axios.get(`${API_URL}/dashboard/summary`, getAuthConfig()),
      axios.get(`${API_URL}/machines`, getAuthConfig()),
      axios.get(`${API_URL}/alerts`, getAuthConfig()),
    ]);
    if (results[0].status === 'fulfilled') {
      setDashboard(results[0].value.data);
    } else if (results[0].reason?.response?.status === 401) {
      logout();
      setLoadingDashboard(false);
      return;
    } else {
      setDashboardError('Could not load dashboard data. Check the backend.');
    }
    if (results[1].status === 'fulfilled') {
      setMachines(Array.isArray(results[1].value.data) ? results[1].value.data : []);
    }
    if (results[2].status === 'fulfilled') {
      setAlerts(Array.isArray(results[2].value.data) ? results[2].value.data : []);
    }
    setLoadingDashboard(false);
  }, [token, getAuthConfig, logout]);

  useEffect(() => { if (token) loadDashboardData(); }, [token, loadDashboardData]);
  useEffect(() => {
    if (!token) return;
    if (page === 'Factories') loadFactories();
    if (page === 'Production Lines') {
      loadFactories();
      loadProductionLines();
    }
    if (page === 'Machines') {
      loadProductionLines();
      loadMachines();
    }
  }, [token, page, loadFactories, loadProductionLines, loadMachines]);

  async function addFactory(event) {
    event.preventDefault();
    setFactoryError('');
    setFactoryMessage('');
    setAddingFactory(true);
    try {
      const response = await axios.post(`${API_URL}/factories`, {
        name: factoryName.trim(),
        location: factoryLocation.trim(),
        description: factoryDescription.trim(),
      }, getAuthConfig());
      setFactories(current => [...current, response.data]);
      setFactoryName('');
      setFactoryLocation('');
      setFactoryDescription('');
      setFactoryMessage('Factory added successfully.');
    } catch (error) {
      setFactoryError(error.response?.data?.message || 'Could not add factory. Check the Factory model.');
    } finally {
      setAddingFactory(false);
    }
  }

  async function deleteFactory(id) {
    if (!window.confirm('Delete this factory?')) return;
    setFactoryError('');
    setFactoryMessage('');
    try {
      await axios.delete(`${API_URL}/factories/${id}`, getAuthConfig());
      setFactories(current => current.filter(factory => factory.id !== id));
      setFactoryMessage('Factory deleted successfully.');
    } catch (error) {
      setFactoryError(error.response?.data?.message || 'Could not delete factory. Check whether it has related records.');
    }
  }

  async function addProductionLine(event) {
    event.preventDefault();
    setLineError('');
    setLineMessage('');
    if (!selectedFactoryId) {
      setLineError('Please select a factory.');
      return;
    }
    setAddingLine(true);
    try {
      const response = await axios.post(`${API_URL}/production-lines`, {
        name: lineName.trim(),
        description: lineDescription.trim(),
        factory: { id: Number(selectedFactoryId) },
      }, getAuthConfig());
      setProductionLines(current => [...current, response.data]);
      setLineName('');
      setLineDescription('');
      setSelectedFactoryId('');
      setLineMessage('Production line added successfully.');
    } catch (error) {
      setLineError(error.response?.data?.message || 'Could not add production line. Verify that the selected factory exists.');
    } finally {
      setAddingLine(false);
    }
  }

  async function deleteProductionLine(id) {
    if (!window.confirm('Delete this production line?')) return;
    setLineError('');
    setLineMessage('');
    try {
      await axios.delete(`${API_URL}/production-lines/${id}`, getAuthConfig());
      setProductionLines(current => current.filter(line => line.id !== id));
      setLineMessage('Production line deleted successfully.');
    } catch (error) {
      setLineError(error.response?.data?.message || 'Could not delete production line. Check whether machines use it.');
    }
  }

  async function addMachine(event) {
    event.preventDefault();
    setMachineError('');
    setMachineMessage('');
    if (!selectedLineId) {
      setMachineError('Please select a production line.');
      return;
    }
    setAddingMachine(true);
    try {
      const response = await axios.post(`${API_URL}/machines`, {
        name: machineNameInput.trim(),
        machineType: machineTypeInput.trim(),
        status: machineStatusInput,
        operatingHours: Number(operatingHoursInput),
        productionLine: { id: Number(selectedLineId) },
      }, getAuthConfig());
      setMachines(current => [...current, response.data]);
      setMachineNameInput('');
      setMachineTypeInput('');
      setMachineStatusInput('RUNNING');
      setOperatingHoursInput('0');
      setSelectedLineId('');
      setMachineMessage('Machine added successfully.');
    } catch (error) {
      setMachineError(error.response?.data?.message || 'Could not add machine. Check the selected production line and backend logs.');
    } finally {
      setAddingMachine(false);
    }
  }

  async function deleteMachine(id) {
    if (!window.confirm('Delete this machine?')) return;
    setMachineError('');
    setMachineMessage('');
    try {
      await axios.delete(`${API_URL}/machines/${id}`, getAuthConfig());
      setMachines(current => current.filter(machine => machine.id !== id));
      setMachineMessage('Machine deleted successfully.');
    } catch (error) {
      setMachineError(error.response?.data?.message || 'Could not delete machine.');
    }
  }

  if (!token) return <Login onLogin={handleLogin} />;

  const latestReading = dashboard?.latestReading;
  const totalMachines = dashboard?.totalMachines ?? machines.length;
  const runningMachines = dashboard?.runningMachines ?? machines.filter(m => m.status?.toUpperCase() === 'RUNNING').length;
  const stoppedMachines = dashboard?.stoppedMachines ?? machines.filter(m => m.status?.toUpperCase() === 'STOPPED').length;
  const activeAlerts = dashboard?.activeAlerts ?? alerts.filter(a => !a.resolved).length;
  const productionCount = latestReading?.productionCount ?? '—';
  const temperature = latestReading?.temperature;
  const vibration = latestReading?.vibration;
  const pressure = latestReading?.pressure;
  const userName = sessionStorage.getItem('factorypulse_name') || 'Admin';
  const userRole = sessionStorage.getItem('factorypulse_role') || 'USER';
  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const displayedMachine = machines[0];
  const machineName = displayedMachine?.name || 'CNC-01';
  const machineStatus = displayedMachine?.status || 'UNKNOWN';
  const temperatureHigh = typeof temperature === 'number' && temperature > 80;
  const vibrationHigh = typeof vibration === 'number' && vibration > 6;
  const pressureNormal = typeof pressure === 'number' && pressure >= 70 && pressure <= 110;

  return (
      <div className="app">
        <aside className="sidebar">
          <h2>⚙ FactoryPulse</h2>
          <p className="sidebar-subtitle">Industrial Intelligence</p>
          <nav>
            {[
              ['Dashboard', '▦'], ['Factories', '▤'], ['Production Lines', '⌁'],
              ['Machines', '⚙'], ['Sensor Monitoring', '⌁'], ['Alerts', '⚠'], ['Maintenance', '🔧'],
            ].map(([name, icon]) => (
                <button type="button" key={name} className={`nav-item ${page === name ? 'active' : ''}`}
                        onClick={() => setPage(name)}
                        style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
                  {icon} {name}
                </button>
            ))}
          </nav>
          <div className="sidebar-footer"><span className="status-dot"></span>System Online</div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <h1>{page === 'Dashboard' ? 'Factory Dashboard' : page}</h1>
              <p>Monitor your factory operations in one place.</p>
            </div>
            <div className="user-info">
              <span className="status-dot"></span><span>{userName} · {userRole}</span>
              <button type="button" className="logout-button" onClick={logout}>Logout</button>
            </div>
          </header>

          {page === 'Factories' && <>
            <section className="welcome"><div><p className="eyebrow">FACTORY MANAGEMENT</p><h2>Your Factories</h2><p>Register and manage your factories.</p></div><div className="welcome-icon">▤</div></section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h3>Add a Factory</h3>
              <form onSubmit={addFactory}>
                <label htmlFor="factoryName">Factory name</label>
                <input id="factoryName" value={factoryName} onChange={e => setFactoryName(e.target.value)} placeholder="Factory name" required style={inputStyle} />
                <label htmlFor="factoryLocation">Location</label>
                <input id="factoryLocation" value={factoryLocation} onChange={e => setFactoryLocation(e.target.value)} placeholder="City, state" style={inputStyle} />
                <label htmlFor="factoryDescription">Description</label>
                <textarea id="factoryDescription" value={factoryDescription} onChange={e => setFactoryDescription(e.target.value)} rows={3} style={inputStyle} />
                <button type="submit" disabled={addingFactory} style={primaryButtonStyle}>{addingFactory ? 'Adding...' : '+ Add Factory'}</button>
              </form>
              {factoryMessage && <p className="green">{factoryMessage}</p>}
              {factoryError && <p className="orange" role="alert">{factoryError}</p>}
            </section>
            <section className="panel">
              <div className="panel-heading"><h3>Registered Factories</h3><button type="button" onClick={loadFactories} style={primaryButtonStyle}>Refresh</button></div>
              {loadingFactories ? <p>Loading factories...</p> : factories.length === 0 ? <p>No factories found.</p> : (
                  <div style={{ overflowX: 'auto' }}><table style={tableStyle}><thead><tr>
                    {['ID', 'Name', 'Location', 'Description', 'Action'].map(h => <th key={h} style={cellStyle}>{h}</th>)}
                  </tr></thead><tbody>{factories.map(factory => <tr key={factory.id}>
                    <td style={cellStyle}>{factory.id}</td><td style={cellStyle}>{factory.name}</td><td style={cellStyle}>{factory.location || '—'}</td><td style={cellStyle}>{factory.description || '—'}</td>
                    <td style={cellStyle}><button type="button" onClick={() => deleteFactory(factory.id)} style={deleteButtonStyle}>Delete</button></td>
                  </tr>)}</tbody></table></div>
              )}
            </section>
          </>}

          {page === 'Production Lines' && <>
            <section className="welcome"><div><p className="eyebrow">PRODUCTION MANAGEMENT</p><h2>Production Lines</h2><p>Organize production lines inside your registered factories.</p></div><div className="welcome-icon">⌁</div></section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h3>Add a Production Line</h3>
              {factories.length === 0 && !loadingFactories && <p className="orange">Register a factory first, then return here to add a production line.</p>}
              <form onSubmit={addProductionLine}>
                <label htmlFor="lineName">Production line name</label>
                <input id="lineName" value={lineName} onChange={e => setLineName(e.target.value)} placeholder="e.g. Production Line A" required style={inputStyle} />
                <label htmlFor="selectedFactory">Select factory</label>
                <select id="selectedFactory" value={selectedFactoryId} onChange={e => setSelectedFactoryId(e.target.value)} required style={inputStyle}>
                  <option value="">Choose a factory</option>{factories.map(factory => <option key={factory.id} value={factory.id}>{factory.name} (ID: {factory.id})</option>)}
                </select>
                <label htmlFor="lineDescription">Description</label>
                <textarea id="lineDescription" value={lineDescription} onChange={e => setLineDescription(e.target.value)} placeholder="Describe this production line" rows={3} style={inputStyle} />
                <button type="submit" disabled={addingLine || factories.length === 0} style={primaryButtonStyle}>{addingLine ? 'Adding...' : '+ Add Production Line'}</button>
              </form>
              {lineMessage && <p className="green">{lineMessage}</p>}{lineError && <p className="orange" role="alert">{lineError}</p>}
            </section>
            <section className="panel">
              <div className="panel-heading"><h3>Registered Production Lines</h3><button type="button" onClick={loadProductionLines} style={primaryButtonStyle}>Refresh</button></div>
              {loadingLines ? <p>Loading production lines...</p> : productionLines.length === 0 ? <p>No production lines found. Add your first production line above.</p> : (
                  <div style={{ overflowX: 'auto' }}><table style={tableStyle}><thead><tr>
                    {['ID', 'Line Name', 'Factory', 'Description', 'Action'].map(h => <th key={h} style={cellStyle}>{h}</th>)}
                  </tr></thead><tbody>{productionLines.map(line => <tr key={line.id}>
                    <td style={cellStyle}>{line.id}</td><td style={cellStyle}>{line.name}</td><td style={cellStyle}>{line.factory?.name || `Factory ID ${line.factory?.id ?? '—'}`}</td><td style={cellStyle}>{line.description || '—'}</td>
                    <td style={cellStyle}><button type="button" onClick={() => deleteProductionLine(line.id)} style={deleteButtonStyle}>Delete</button></td>
                  </tr>)}</tbody></table></div>
              )}
            </section>
          </>}

          {page === 'Machines' && <>
            <section className="welcome"><div><p className="eyebrow">EQUIPMENT MANAGEMENT</p><h2>Machines Management</h2><p>Register machines, assign them to production lines, and track their status.</p></div><div className="welcome-icon">⚙</div></section>
            <section className="panel" style={{ marginBottom: 24 }}>
              <h3>Add a Machine</h3>
              {productionLines.length === 0 && !loadingLines && <p className="orange">Add a production line first, then return here to register a machine.</p>}
              <form onSubmit={addMachine}>
                <label htmlFor="machineNameInput">Machine name</label>
                <input id="machineNameInput" value={machineNameInput} onChange={e => setMachineNameInput(e.target.value)} placeholder="e.g. CNC-02" required style={inputStyle} />
                <label htmlFor="machineTypeInput">Machine type</label>
                <input id="machineTypeInput" value={machineTypeInput} onChange={e => setMachineTypeInput(e.target.value)} placeholder="e.g. CNC Milling Machine" required style={inputStyle} />
                <label htmlFor="machineStatusInput">Status</label>
                <select id="machineStatusInput" value={machineStatusInput} onChange={e => setMachineStatusInput(e.target.value)} required style={inputStyle}>
                  <option value="RUNNING">RUNNING</option><option value="STOPPED">STOPPED</option><option value="MAINTENANCE">MAINTENANCE</option>
                </select>
                <label htmlFor="operatingHoursInput">Operating hours</label>
                <input id="operatingHoursInput" type="number" min="0" step="0.1" value={operatingHoursInput} onChange={e => setOperatingHoursInput(e.target.value)} required style={inputStyle} />
                <label htmlFor="selectedLineId">Production line</label>
                <select id="selectedLineId" value={selectedLineId} onChange={e => setSelectedLineId(e.target.value)} required style={inputStyle}>
                  <option value="">Choose a production line</option>{productionLines.map(line => <option key={line.id} value={line.id}>{line.name} (ID: {line.id})</option>)}
                </select>
                <button type="submit" disabled={addingMachine || productionLines.length === 0} style={primaryButtonStyle}>{addingMachine ? 'Adding...' : '+ Add Machine'}</button>
              </form>
              {machineMessage && <p className="green">{machineMessage}</p>}{machineError && <p className="orange" role="alert">{machineError}</p>}
            </section>
            <section className="panel">
              <div className="panel-heading"><h3>Registered Machines</h3><button type="button" onClick={loadMachines} style={primaryButtonStyle}>Refresh</button></div>
              {loadingMachines ? <p>Loading machines...</p> : machines.length === 0 ? <p>No machines found. Add your first machine above.</p> : (
                  <div style={{ overflowX: 'auto' }}><table style={tableStyle}><thead><tr>
                    {['ID', 'Machine', 'Type', 'Status', 'Operating Hours', 'Production Line', 'Action'].map(h => <th key={h} style={cellStyle}>{h}</th>)}
                  </tr></thead><tbody>{machines.map(machine => <tr key={machine.id}>
                    <td style={cellStyle}>{machine.id}</td><td style={cellStyle}>{machine.name || '—'}</td><td style={cellStyle}>{machine.machineType || machine.type || '—'}</td>
                    <td style={cellStyle}><span className={`badge ${machine.status?.toUpperCase() === 'RUNNING' ? 'running' : ''}`}>{machine.status || 'UNKNOWN'}</span></td>
                    <td style={cellStyle}>{machine.operatingHours ?? '—'}</td>
                    <td style={cellStyle}>{machine.productionLine?.name || `Line ID ${machine.productionLine?.id ?? '—'}`}</td>
                    <td style={cellStyle}><button type="button" onClick={() => deleteMachine(machine.id)} style={deleteButtonStyle}>Delete</button></td>
                  </tr>)}</tbody></table></div>
              )}
            </section>
          </>}

          {page === 'Dashboard' && <>
            <section className="welcome"><div><p className="eyebrow">INDUSTRIAL INTELLIGENCE PLATFORM</p><h2>Welcome to FactoryPulse</h2><p>Monitor machines, detect abnormalities, and improve production performance.</p></div><div className="welcome-icon">⌁</div></section>
            {dashboardError && <div className="panel" role="alert"><p className="orange">{dashboardError}</p><p>Make sure the Spring Boot backend is running on port 8080.</p></div>}
            {loadingDashboard && <div className="panel">Loading your factory data...</div>}
            <section className="stats-grid">
              <div className="stat-card"><p>Total Machines</p><h2>{totalMachines}</h2><span>Registered machines</span></div>
              <div className="stat-card"><p>Running Machines</p><h2 className="green">{runningMachines}</h2><span>Currently running</span></div>
              <div className="stat-card"><p>Active Alerts</p><h2 className="orange">{activeAlerts}</h2><span>Unresolved alerts</span></div>
              <div className="stat-card"><p>Production Count</p><h2>{productionCount}</h2><span>Latest recorded reading</span></div>
            </section>
            <section className="content-grid">
              <div className="panel machine-panel">
                <div className="panel-heading"><div><h3>Machine Status</h3><p>Your registered industrial equipment</p></div><span className={`badge ${machineStatus.toUpperCase() === 'RUNNING' ? 'running' : ''}`}>● {machineStatus.toUpperCase()}</span></div>
                <div className="machine-details"><div className="machine-icon">⚙</div><div><h3>{machineName}</h3><p>{displayedMachine?.machineType || displayedMachine?.type || 'Industrial Machine'}{' · '}{displayedMachine?.productionLine?.name || 'Production Line A'}</p><span className="muted">{displayedMachine?.productionLine?.factory?.name || 'Hyderabad Manufacturing Plant'}</span></div></div>
                <div className="sensor-grid">
                  <div className="sensor-card"><span>Temperature</span><h3>{typeof temperature === 'number' ? `${temperature}°C` : '—'}</h3><small className={temperatureHigh ? 'orange' : 'green'}>{temperature == null ? 'No reading available' : temperatureHigh ? 'Above safe limit' : 'Within temperature limit'}</small></div>
                  <div className="sensor-card"><span>Vibration</span><h3>{typeof vibration === 'number' ? `${vibration} mm/s` : '—'}</h3><small className={vibrationHigh ? 'orange' : 'green'}>{vibration == null ? 'No reading available' : vibrationHigh ? 'Above safe limit' : 'Within vibration limit'}</small></div>
                  <div className="sensor-card"><span>Pressure</span><h3>{typeof pressure === 'number' ? `${pressure} PSI` : '—'}</h3><small className={pressureNormal ? 'green' : 'orange'}>{pressure == null ? 'No reading available' : pressureNormal ? 'Within range' : 'Check pressure'}</small></div>
                </div>
                {stoppedMachines > 0 && <p className="orange">{stoppedMachines} machine(s) currently stopped.</p>}
              </div>
              <div className="panel alert-panel">
                <div className="panel-heading"><div><h3>Machine Alerts</h3><p>Monitor abnormal conditions</p></div><span className="alert-icon">!</span></div>
                {unresolvedAlerts.length > 0 ? unresolvedAlerts.slice(0, 5).map(alert => (
                    <div className="alert-message" key={alert.id}><span className="alert-indicator"></span><div><h4>{alert.alertType || 'Machine Alert'}</h4><p>{alert.message || 'Abnormal condition detected.'}</p><small>{alert.severity || 'NOTICE'}{alert.machine?.name ? ` · ${alert.machine.name}` : ''}</small></div></div>
                )) : <div className="alert-message"><span className="status-dot"></span><div><h4>No unresolved alerts</h4><p>{alerts.length > 0 ? 'All retrieved alerts are resolved.' : 'No active alerts were returned by the server.'}</p></div></div>}
                <div className="alert-footer"><span>Alert system</span><strong>Enabled</strong></div>
              </div>
            </section>
          </>}

          {page === 'Alerts' && <AlertsPage apiUrl={API_URL} token={token} onChange={loadDashboardData} />}
          {page === 'Sensor Monitoring' && <SensorPage apiUrl={API_URL} token={token} onChange={loadDashboardData} />}
          {page === 'Maintenance' && <MaintenancePage apiUrl={API_URL} token={token} />}
          <footer className="footer">FactoryPulse · Industrial Intelligence &amp; Predictive Maintenance</footer>
        </main>
      </div>
  );
}

export default App;
