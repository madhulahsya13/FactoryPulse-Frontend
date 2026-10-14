import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './Login';
import { Icon } from './icons';
import DashboardInsights from './Insights';
import { AlertsPage, SensorPage, MaintenancePage } from './ExtraPages';
import './App.css';

const API_URL = `${import.meta.env.VITE_API_URL ?? 'https://factorypulse-backend-also.onrender.com'}/api`;

const NAV = [
  ['Dashboard', 'dashboard'], ['Factories', 'factory'], ['Production Lines', 'layers'],
  ['Machines', 'cpu'], ['Sensor Monitoring', 'activity'], ['Alerts', 'bell'], ['Maintenance', 'wrench'],
];

const PAGE_INFO = {
  Dashboard: ['Factory Dashboard', 'Monitor your factory operations in one place.'],
  Factories: ['Factories', 'Register and manage your factories.'],
  'Production Lines': ['Production Lines', 'Organise the lines inside each factory.'],
  Machines: ['Machines', 'Register machines and track their status.'],
  'Sensor Monitoring': ['Sensor Monitoring', 'Record and review machine sensor readings.'],
  Alerts: ['Alerts', 'Raise, track and resolve machine alerts.'],
  Maintenance: ['Maintenance', 'Schedule and track maintenance work.'],
};

function statusClass(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'RUNNING') return 'running';
  if (value === 'STOPPED') return 'stopped';
  if (value === 'MAINTENANCE') return 'maint';
  return '';
}

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('factorypulse_token'));
  const [dashboard, setDashboard] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [page, setPage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);

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

  // No role is sent: the server always makes public sign-ups Factory Owners.
  const handleRegister = async (name, email, password, factoryName) => {
    await axios.post(`${API_URL}/users/register`, { name, email, password, factoryName });
  };

  function goTo(name) {
    setPage(name);
    if (window.innerWidth <= 900) setSidebarOpen(false);
  }

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
  // Wake the free server while the person is still on the login page.
  useEffect(() => { if (!token) axios.get(`${API_URL}/health`).catch(() => {}); }, [token]);
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
      }, getAuthConfig());
      setFactories(current => [...current, response.data]);
      setFactoryName('');
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

  if (!token) return <Login onLogin={handleLogin} onRegister={handleRegister} />;

  const latestReading = dashboard?.latestReading;
  const totalMachines = dashboard?.totalMachines ?? machines.length;
  const runningMachines = dashboard?.runningMachines ?? machines.filter(m => m.status?.toUpperCase() === 'RUNNING').length;
  const stoppedMachines = dashboard?.stoppedMachines ?? machines.filter(m => m.status?.toUpperCase() === 'STOPPED').length;
  const activeAlerts = dashboard?.activeAlerts ?? alerts.filter(a => !a.resolved).length;
  const productionCount = latestReading?.productionCount ?? '—';
  const temperature = latestReading?.temperature;
  const vibration = latestReading?.vibration;
  const pressure = latestReading?.pressure;
  const userName = sessionStorage.getItem('factorypulse_name') || 'User';
  const isAdmin = (sessionStorage.getItem('factorypulse_role') || '').toUpperCase() === 'ADMIN';
  const userRole = isAdmin ? 'Admin' : 'Factory Owner';
  const ownerOf = (owner) => (owner ? `${owner.name || '—'} (${owner.email})` : 'Unassigned');
  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const displayedMachine = machines[0];
  const machineName = displayedMachine?.name || 'No machines yet';
  const machineStatus = displayedMachine?.status || 'UNKNOWN';
  const temperatureHigh = typeof temperature === 'number' && temperature > 80;
  const vibrationHigh = typeof vibration === 'number' && vibration > 6;
  const pressureNormal = typeof pressure === 'number' && pressure >= 70 && pressure <= 110;

  return (
      <div className={`app ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <aside className="sidebar" aria-hidden={!sidebarOpen}>
          <div className="brand">
            <div className="brand-logo"><Icon name="cpu" size={22} /></div>
            <div className="brand-text">
              <h2>FactoryPulse</h2>
              <p className="sidebar-subtitle">Industrial Intelligence</p>
            </div>
            <button type="button" className="icon-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <Icon name="menu" />
            </button>
          </div>
          <p className="nav-label">MENU</p>
          <nav>
            {NAV.map(([name, icon]) => (
                <button type="button" key={name} className={`nav-item ${page === name ? 'active' : ''}`}
                        onClick={() => goTo(name)}>
                  <Icon name={icon} />
                  <span>{name}</span>
                  {name === 'Alerts' && unresolvedAlerts.length > 0 && <span className="nav-badge">{unresolvedAlerts.length}</span>}
                </button>
            ))}
          </nav>
          <div className="sidebar-footer"><span className="status-dot"></span>System Online</div>
        </aside>
        {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

        <main className="main-content">
          <header className="topbar">
            <button type="button" className="icon-btn" onClick={() => setSidebarOpen(open => !open)}
                    aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}>
              <Icon name="menu" />
            </button>
            <div className="topbar-title">
              <h1>{(PAGE_INFO[page] || PAGE_INFO.Dashboard)[0]}</h1>
              <p>{(PAGE_INFO[page] || PAGE_INFO.Dashboard)[1]}</p>
            </div>
            <div className="user-info">
              <div className="avatar">{(userName || 'U').trim().charAt(0).toUpperCase()}</div>
              <div className="user-meta"><strong>{userName}</strong><span>{userRole}</span></div>
              <button type="button" className="logout-button" onClick={logout}>
                <Icon name="logout" size={15} /><span>Logout</span>
              </button>
            </div>
          </header>

          {page === 'Factories' && <>
            <section className="welcome"><div><p className="eyebrow">FACTORY MANAGEMENT</p><h2>{isAdmin ? 'All Factories' : 'Your Factories'}</h2><p>{isAdmin ? 'Every factory with its owner.' : 'Register and manage your factories.'}</p></div><div className="welcome-icon">▤</div></section>
            {!isAdmin && <section className="panel" style={{ marginBottom: 24 }}>
              <h3>Add a Factory</h3>
              <form onSubmit={addFactory}>
                <label htmlFor="factoryName">Factory name</label>
                <input id="factoryName" value={factoryName} onChange={e => setFactoryName(e.target.value)} placeholder="Factory name" required />
                <button type="submit" disabled={addingFactory} className="btn-primary">{addingFactory ? 'Adding...' : '+ Add Factory'}</button>
              </form>
              {factoryMessage && <p className="green">{factoryMessage}</p>}
              {factoryError && <p className="orange" role="alert">{factoryError}</p>}
            </section>}
            <section className="panel">
              <div className="panel-heading"><h3>{isAdmin ? 'All Factories' : 'My Factories'}</h3><button type="button" onClick={loadFactories} className="btn-primary">Refresh</button></div>
              {isAdmin && factoryError && <p className="orange" role="alert">{factoryError}</p>}
              {loadingFactories ? <p>Loading factories...</p> : factories.length === 0 ? <p>No factories found.</p> : (
                  <div style={{ overflowX: 'auto' }}><table><thead><tr>
                    {['Factory', ...(isAdmin ? ['Owner'] : []), 'Action'].map(h => <th key={h}>{h}</th>)}
                  </tr></thead><tbody>{factories.map(factory => <tr key={factory.id}>
                    <td>{factory.name}</td>{isAdmin && <td>{ownerOf(factory.owner)}</td>}
                    <td><button type="button" onClick={() => deleteFactory(factory.id)} className="btn-danger">Delete</button></td>
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
                <input id="lineName" value={lineName} onChange={e => setLineName(e.target.value)} placeholder="e.g. Production Line A" required />
                <label htmlFor="selectedFactory">Select factory</label>
                <select id="selectedFactory" value={selectedFactoryId} onChange={e => setSelectedFactoryId(e.target.value)} required>
                  <option value="">Choose a factory</option>{factories.map(factory => <option key={factory.id} value={factory.id}>{factory.name} (ID: {factory.id})</option>)}
                </select>
                <label htmlFor="lineDescription">Description</label>
                <textarea id="lineDescription" value={lineDescription} onChange={e => setLineDescription(e.target.value)} placeholder="Describe this production line" rows={3} />
                <button type="submit" disabled={addingLine || factories.length === 0} className="btn-primary">{addingLine ? 'Adding...' : '+ Add Production Line'}</button>
              </form>
              {lineMessage && <p className="green">{lineMessage}</p>}{lineError && <p className="orange" role="alert">{lineError}</p>}
            </section>
            <section className="panel">
              <div className="panel-heading"><h3>Registered Production Lines</h3><button type="button" onClick={loadProductionLines} className="btn-primary">Refresh</button></div>
              {loadingLines ? <p>Loading production lines...</p> : productionLines.length === 0 ? <p>No production lines found. Add your first production line above.</p> : (
                  <div style={{ overflowX: 'auto' }}><table><thead><tr>
                    {['ID', 'Line Name', 'Factory', ...(isAdmin ? ['Owner'] : []), 'Description', 'Action'].map(h => <th key={h}>{h}</th>)}
                  </tr></thead><tbody>{productionLines.map(line => <tr key={line.id}>
                    <td>{line.id}</td><td>{line.name}</td><td>{line.factory?.name || `Factory ID ${line.factory?.id ?? '—'}`}</td>{isAdmin && <td>{ownerOf(line.factory?.owner)}</td>}<td>{line.description || '—'}</td>
                    <td><button type="button" onClick={() => deleteProductionLine(line.id)} className="btn-danger">Delete</button></td>
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
                <input id="machineNameInput" value={machineNameInput} onChange={e => setMachineNameInput(e.target.value)} placeholder="e.g. CNC-02" required />
                <label htmlFor="machineTypeInput">Machine type</label>
                <input id="machineTypeInput" value={machineTypeInput} onChange={e => setMachineTypeInput(e.target.value)} placeholder="e.g. CNC Milling Machine" required />
                <label htmlFor="machineStatusInput">Status</label>
                <select id="machineStatusInput" value={machineStatusInput} onChange={e => setMachineStatusInput(e.target.value)} required>
                  <option value="RUNNING">RUNNING</option><option value="STOPPED">STOPPED</option><option value="MAINTENANCE">MAINTENANCE</option>
                </select>
                <label htmlFor="operatingHoursInput">Operating hours</label>
                <input id="operatingHoursInput" type="number" min="0" step="0.1" value={operatingHoursInput} onChange={e => setOperatingHoursInput(e.target.value)} required />
                <label htmlFor="selectedLineId">Production line</label>
                <select id="selectedLineId" value={selectedLineId} onChange={e => setSelectedLineId(e.target.value)} required>
                  <option value="">Choose a production line</option>{productionLines.map(line => <option key={line.id} value={line.id}>{line.name} (ID: {line.id})</option>)}
                </select>
                <button type="submit" disabled={addingMachine || productionLines.length === 0} className="btn-primary">{addingMachine ? 'Adding...' : '+ Add Machine'}</button>
              </form>
              {machineMessage && <p className="green">{machineMessage}</p>}{machineError && <p className="orange" role="alert">{machineError}</p>}
            </section>
            <section className="panel">
              <div className="panel-heading"><h3>Registered Machines</h3><button type="button" onClick={loadMachines} className="btn-primary">Refresh</button></div>
              {loadingMachines ? <p>Loading machines...</p> : machines.length === 0 ? <p>No machines found. Add your first machine above.</p> : (
                  <div style={{ overflowX: 'auto' }}><table><thead><tr>
                    {['ID', 'Machine', 'Type', 'Status', 'Operating Hours', 'Production Line', ...(isAdmin ? ['Factory', 'Owner'] : []), 'Action'].map(h => <th key={h}>{h}</th>)}
                  </tr></thead><tbody>{machines.map(machine => <tr key={machine.id}>
                    <td>{machine.id}</td><td>{machine.name || '—'}</td><td>{machine.machineType || machine.type || '—'}</td>
                    <td><span className={`badge ${statusClass(machine.status)}`}>{machine.status || 'UNKNOWN'}</span></td>
                    <td>{machine.operatingHours ?? '—'}</td>
                    <td>{machine.productionLine?.name || `Line ID ${machine.productionLine?.id ?? '—'}`}</td>{isAdmin && <><td>{machine.productionLine?.factory?.name || '—'}</td><td>{ownerOf(machine.productionLine?.factory?.owner)}</td></>}
                    <td><button type="button" onClick={() => deleteMachine(machine.id)} className="btn-danger">Delete</button></td>
                  </tr>)}</tbody></table></div>
              )}
            </section>
          </>}

          {page === 'Dashboard' && <>
            <section className="welcome"><div><p className="eyebrow">INDUSTRIAL INTELLIGENCE PLATFORM</p><h2>Welcome to FactoryPulse</h2><p>Monitor machines, detect abnormalities, and improve production performance.</p></div><div className="welcome-icon">⌁</div></section>
            {dashboardError && <div className="panel" role="alert"><p className="orange">{dashboardError}</p><p className="muted">The server may be waking up (free hosting). Wait up to a minute, then retry.</p><button type="button" className="btn-primary" style={{ marginTop: 14 }} onClick={loadDashboardData}>Retry</button></div>}
            {loadingDashboard && <div className="panel">Loading your factory data...</div>}
            <section className="stats-grid">
              <div className="stat-card"><div className="stat-icon"><Icon name="cpu" /></div><p>Total Machines</p><h2>{totalMachines}</h2><span>Registered machines</span></div>
              <div className="stat-card"><div className="stat-icon"><Icon name="activity" /></div><p>Running Machines</p><h2 className="green">{runningMachines}</h2><span>Currently running</span></div>
              <div className="stat-card"><div className="stat-icon"><Icon name="bell" /></div><p>Active Alerts</p><h2 className="orange">{activeAlerts}</h2><span>Unresolved alerts</span></div>
              <div className="stat-card"><div className="stat-icon"><Icon name="layers" /></div><p>Production Count</p><h2>{productionCount}</h2><span>Latest recorded reading</span></div>
            </section>
            <section className="content-grid">
              <div className="panel machine-panel">
                <div className="panel-heading"><div><h3>Machine Status</h3><p>Your registered industrial equipment</p></div><span className={`badge ${statusClass(machineStatus)}`}>● {machineStatus.toUpperCase()}</span></div>
                <div className="machine-details"><div className="machine-icon">⚙</div><div><h3>{machineName}</h3><p>{displayedMachine?.machineType || displayedMachine?.type || 'Add a machine to see its status'}{' · '}{displayedMachine?.productionLine?.name || '—'}</p><span className="muted">{displayedMachine?.productionLine?.factory?.name || ''}</span></div></div>
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
          <DashboardInsights apiUrl={API_URL} token={token} />
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
