import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './Login';
import './App.css';

const API_URL = 'http://localhost:8080/api';

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px',
  margin: '8px 0 18px',
  borderRadius: '8px',
  border: '1px solid #344054',
  background: '#111827',
  color: '#ffffff',
};

const primaryButtonStyle = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  background: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
};

const deleteButtonStyle = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '6px',
  background: '#b91c1c',
  color: '#ffffff',
  cursor: 'pointer',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const cellStyle = {
  padding: '12px',
  borderBottom: '1px solid #344054',
};

function healthColor(status) {
  if (status === 'HEALTHY') return '#22c55e';
  if (status === 'WARNING') return '#f59e0b';
  return '#ef4444';
}

function App() {
  const [token, setToken] = useState(() =>
      sessionStorage.getItem('factorypulse_token')
  );

  const [dashboard, setDashboard] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [page, setPage] = useState('Dashboard');

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingFactories, setLoadingFactories] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadingSensors, setLoadingSensors] = useState(false);

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
  const [sensorError, setSensorError] = useState('');

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

  // Machine Health state
  const [machineHealth, setMachineHealth] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState('');

  // Maintenance state
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [addingMaintenance, setAddingMaintenance] = useState(false);

  const [maintenanceMachineId, setMaintenanceMachineId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState(
      'Preventive Maintenance'
  );
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState('SCHEDULED');

  const getAuthConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const logout = useCallback(() => {
    [
      'factorypulse_token',
      'factorypulse_name',
      'factorypulse_email',
      'factorypulse_role',
    ].forEach(key => sessionStorage.removeItem(key));

    setToken(null);
    setDashboard(null);
    setMachines([]);
    setAlerts([]);
    setFactories([]);
    setProductionLines([]);
    setSensorReadings([]);
    setMachineHealth([]);
    setMaintenanceRecords([]);
    setPage('Dashboard');
    setDashboardError('');
    setSensorError('');
    setHealthError('');
    setMaintenanceError('');
    setMaintenanceMessage('');
  }, []);

  const handleLogin = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    const data = response.data;

    if (!data.token) {
      throw new Error('The server did not return a login token.');
    }

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
      const response = await axios.get(
          `${API_URL}/factories`,
          getAuthConfig()
      );
      setFactories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setFactoryError(
          error.response?.data?.message ||
          'Could not load factories. Check the backend and your permissions.'
      );
    } finally {
      setLoadingFactories(false);
    }
  }, [token, getAuthConfig]);

  const loadProductionLines = useCallback(async () => {
    if (!token) return;

    setLoadingLines(true);
    setLineError('');

    try {
      const response = await axios.get(
          `${API_URL}/production-lines`,
          getAuthConfig()
      );
      setProductionLines(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setLineError(
          error.response?.data?.message ||
          'Could not load production lines. Check the backend.'
      );
    } finally {
      setLoadingLines(false);
    }
  }, [token, getAuthConfig]);

  const loadMachines = useCallback(async () => {
    if (!token) return;

    setLoadingMachines(true);
    setMachineError('');

    try {
      const response = await axios.get(
          `${API_URL}/machines`,
          getAuthConfig()
      );
      setMachines(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMachineError(
          error.response?.data?.message ||
          'Could not load machines. Check the backend.'
      );
    } finally {
      setLoadingMachines(false);
    }
  }, [token, getAuthConfig]);

  const loadSensorReadings = useCallback(async () => {
    if (!token) return;

    setLoadingSensors(true);
    setSensorError('');

    try {
      const response = await axios.get(
          `${API_URL}/sensor-readings`,
          getAuthConfig()
      );

      const readings = Array.isArray(response.data) ? response.data : [];

      readings.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      setSensorReadings(readings);
    } catch (error) {
      setSensorError(
          error.response?.data?.message ||
          'Could not load sensor readings. Check the backend and your login.'
      );
    } finally {
      setLoadingSensors(false);
    }
  }, [token, getAuthConfig]);

  const loadMachineHealth = useCallback(async () => {
    if (!token) return;

    setLoadingHealth(true);
    setHealthError('');

    try {
      const response = await axios.get(
          `${API_URL}/machine-health`,
          getAuthConfig()
      );
      setMachineHealth(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setHealthError(
          error.response?.status === 401 || error.response?.status === 403
              ? 'Your session may have expired. Please log in again.'
              : 'Could not load machine health. Check that the backend is running.'
      );
    } finally {
      setLoadingHealth(false);
    }
  }, [token, getAuthConfig]);

  // Load maintenance records from the backend.
  const loadMaintenance = useCallback(async () => {
    if (!token) return;

    setLoadingMaintenance(true);
    setMaintenanceError('');

    try {
      const response = await axios.get(
          `${API_URL}/maintenance`,
          getAuthConfig()
      );

      setMaintenanceRecords(
          Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      setMaintenanceError(
          error.response?.data?.message ||
          'Could not load maintenance records. Check the backend.'
      );
    } finally {
      setLoadingMaintenance(false);
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
      setDashboardError(
          'Could not load dashboard data. Check the backend.'
      );
    }

    if (results[1].status === 'fulfilled') {
      setMachines(
          Array.isArray(results[1].value.data)
              ? results[1].value.data
              : []
      );
    }

    if (results[2].status === 'fulfilled') {
      setAlerts(
          Array.isArray(results[2].value.data)
              ? results[2].value.data
              : []
      );
    }

    setLoadingDashboard(false);
  }, [token, getAuthConfig, logout]);

  useEffect(() => {
    if (token) loadDashboardData();
  }, [token, loadDashboardData]);

  useEffect(() => {
    if (!token) return;

    if (page === 'Factories') {
      loadFactories();
    }

    if (page === 'Production Lines') {
      loadFactories();
      loadProductionLines();
    }

    if (page === 'Machines') {
      loadProductionLines();
      loadMachines();
    }

    if (page === 'Sensor Monitoring') {
      loadSensorReadings();
    }

    if (page === 'Machine Health') {
      loadMachineHealth();
    }

    if (page === 'Maintenance') {
      loadMachines();
      loadMaintenance();
    }
  }, [
    token,
    page,
    loadFactories,
    loadProductionLines,
    loadMachines,
    loadSensorReadings,
    loadMachineHealth,
    loadMaintenance,
  ]);

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
      setFactoryError(
          error.response?.data?.message ||
          'Could not add factory. Check the Factory model.'
      );
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
      setFactoryError(
          error.response?.data?.message ||
          'Could not delete factory. Check whether it has related records.'
      );
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
      const response = await axios.post(
          `${API_URL}/production-lines`,
          {
            name: lineName.trim(),
            description: lineDescription.trim(),
            factory: { id: Number(selectedFactoryId) },
          },
          getAuthConfig()
      );

      setProductionLines(current => [...current, response.data]);
      setLineName('');
      setLineDescription('');
      setSelectedFactoryId('');
      setLineMessage('Production line added successfully.');
    } catch (error) {
      setLineError(
          error.response?.data?.message ||
          'Could not add production line. Verify that the selected factory exists.'
      );
    } finally {
      setAddingLine(false);
    }
  }

  async function deleteProductionLine(id) {
    if (!window.confirm('Delete this production line?')) return;

    setLineError('');
    setLineMessage('');

    try {
      await axios.delete(
          `${API_URL}/production-lines/${id}`,
          getAuthConfig()
      );
      setProductionLines(current => current.filter(line => line.id !== id));
      setLineMessage('Production line deleted successfully.');
    } catch (error) {
      setLineError(
          error.response?.data?.message ||
          'Could not delete production line. Check whether machines use it.'
      );
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
      const response = await axios.post(
          `${API_URL}/machines`,
          {
            name: machineNameInput.trim(),
            machineType: machineTypeInput.trim(),
            status: machineStatusInput,
            operatingHours: Number(operatingHoursInput),
            productionLine: { id: Number(selectedLineId) },
          },
          getAuthConfig()
      );

      setMachines(current => [...current, response.data]);
      setMachineNameInput('');
      setMachineTypeInput('');
      setMachineStatusInput('RUNNING');
      setOperatingHoursInput('0');
      setSelectedLineId('');
      setMachineMessage('Machine added successfully.');
    } catch (error) {
      setMachineError(
          error.response?.data?.message ||
          'Could not add machine. Check the selected production line and backend logs.'
      );
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

  // Add a maintenance record.
  async function addMaintenance(event) {
    event.preventDefault();
    setMaintenanceError('');
    setMaintenanceMessage('');

    if (!maintenanceMachineId) {
      setMaintenanceError('Please select a machine.');
      return;
    }

    if (!maintenanceDate) {
      setMaintenanceError('Please select a scheduled date.');
      return;
    }

    setAddingMaintenance(true);

    try {
      const payload = {
        machineId: Number(maintenanceMachineId),
        maintenanceType: maintenanceType.trim(),
        description: maintenanceDescription.trim(),
        scheduledDate: maintenanceDate,
        status: maintenanceStatus,
      };

      const response = await axios.post(
          `${API_URL}/maintenance`,
          payload,
          getAuthConfig()
      );

      setMaintenanceRecords(current => [
        ...current,
        response.data,
      ]);

      setMaintenanceMachineId('');
      setMaintenanceType('Preventive Maintenance');
      setMaintenanceDescription('');
      setMaintenanceDate('');
      setMaintenanceStatus('SCHEDULED');
      setMaintenanceMessage('Maintenance scheduled successfully.');

      // Refresh records from the database.
      await loadMaintenance();
    } catch (error) {
      setMaintenanceError(
          error.response?.data?.message ||
          'Could not schedule maintenance. Check the selected machine and backend.'
      );
    } finally {
      setAddingMaintenance(false);
    }
  }

  // Update the status of a maintenance record.
  async function updateMaintenanceStatus(record, newStatus) {
    setMaintenanceError('');
    setMaintenanceMessage('');

    try {
      await axios.put(
          `${API_URL}/maintenance/${record.id}`,
          {
            machineId: record.machine?.id ?? record.machineId,
            maintenanceType: record.maintenanceType,
            description: record.description,
            scheduledDate: record.scheduledDate,
            status: newStatus,
          },
          getAuthConfig()
      );

      setMaintenanceMessage('Maintenance status updated successfully.');
      await loadMaintenance();
    } catch (error) {
      setMaintenanceError(
          error.response?.data?.message ||
          'Could not update maintenance status.'
      );
    }
  }

  async function deleteMaintenance(id) {
    if (!window.confirm('Delete this maintenance record?')) return;

    setMaintenanceError('');
    setMaintenanceMessage('');

    try {
      await axios.delete(`${API_URL}/maintenance/${id}`, getAuthConfig());

      setMaintenanceRecords(current =>
          current.filter(record => record.id !== id)
      );

      setMaintenanceMessage('Maintenance record deleted successfully.');
    } catch (error) {
      setMaintenanceError(
          error.response?.data?.message ||
          'Could not delete maintenance record.'
      );
    }
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const latestReading = dashboard?.latestReading;

  const totalMachines = dashboard?.totalMachines ?? machines.length;

  const runningMachines =
      dashboard?.runningMachines ??
      machines.filter(machine => machine.status?.toUpperCase() === 'RUNNING').length;

  const stoppedMachines =
      dashboard?.stoppedMachines ??
      machines.filter(machine => machine.status?.toUpperCase() === 'STOPPED').length;

  const activeAlerts =
      dashboard?.activeAlerts ??
      alerts.filter(alert => !alert.resolved).length;

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

  const temperatureHigh =
      typeof temperature === 'number' && temperature > 80;

  const vibrationHigh =
      typeof vibration === 'number' && vibration > 6;

  const pressureNormal =
      typeof pressure === 'number' && pressure >= 70 && pressure <= 110;

  const latestSensorReading = sensorReadings[0];

  const monitoredMachineCount = new Set(
      sensorReadings
          .map(reading => reading.machine?.id)
          .filter(id => id != null)
  ).size;

  const highTemperatureCount = sensorReadings.filter(
      reading => reading.temperature != null && Number(reading.temperature) > 80
  ).length;

  const highVibrationCount = sensorReadings.filter(
      reading => reading.vibration != null && Number(reading.vibration) > 6
  ).length;

  const healthyCount = machineHealth.filter(
      machine => machine.healthStatus === 'HEALTHY'
  ).length;

  const warningCount = machineHealth.filter(
      machine => machine.healthStatus === 'WARNING'
  ).length;

  const criticalCount = machineHealth.filter(
      machine => machine.healthStatus === 'CRITICAL'
  ).length;

  const averageHealthScore = machineHealth.length
      ? Math.round(
          machineHealth.reduce(
              (total, machine) => total + Number(machine.healthScore ?? 0),
              0
          ) / machineHealth.length
      )
      : 0;

  return (
      <div className="app">
        <aside className="sidebar">
          <h2>⚙ FactoryPulse</h2>
          <p className="sidebar-subtitle">Industrial Intelligence</p>

          <nav>
            {[
              ['Dashboard', '▦'],
              ['Factories', '▤'],
              ['Production Lines', '⌁'],
              ['Machines', '⚙'],
              ['Sensor Monitoring', '⌁'],
              ['Machine Health', '♥'],
              ['Alerts', '⚠'],
              ['Maintenance', '🔧'],
            ].map(([name, icon]) => (
                <button
                    type="button"
                    key={name}
                    className={`nav-item ${page === name ? 'active' : ''}`}
                    onClick={() => setPage(name)}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      font: 'inherit',
                    }}
                >
                  {icon} {name}
                </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className="status-dot"></span>System Online
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <h1>{page === 'Dashboard' ? 'Factory Dashboard' : page}</h1>
              <p>Monitor your factory operations in one place.</p>
            </div>

            <div className="user-info">
              <span className="status-dot"></span>
              <span>{userName} · {userRole}</span>
              <button
                  type="button"
                  className="logout-button"
                  onClick={logout}
              >
                Logout
              </button>
            </div>
          </header>

          {/* FACTORIES */}
          {page === 'Factories' && (
              <>
                <section className="welcome">
                  <div>
                    <p className="eyebrow">FACTORY MANAGEMENT</p>
                    <h2>Your Factories</h2>
                    <p>Register and manage your factories.</p>
                  </div>
                  <div className="welcome-icon">▤</div>
                </section>

                <section className="panel" style={{ marginBottom: 24 }}>
                  <h3>Add a Factory</h3>
                  <form onSubmit={addFactory}>
                    <label htmlFor="factoryName">Factory name</label>
                    <input
                        id="factoryName"
                        value={factoryName}
                        onChange={event => setFactoryName(event.target.value)}
                        placeholder="Factory name"
                        required
                        style={inputStyle}
                    />

                    <label htmlFor="factoryLocation">Location</label>
                    <input
                        id="factoryLocation"
                        value={factoryLocation}
                        onChange={event => setFactoryLocation(event.target.value)}
                        placeholder="City, state"
                        style={inputStyle}
                    />

                    <label htmlFor="factoryDescription">Description</label>
                    <textarea
                        id="factoryDescription"
                        value={factoryDescription}
                        onChange={event => setFactoryDescription(event.target.value)}
                        rows={3}
                        style={inputStyle}
                    />

                    <button type="submit" disabled={addingFactory} style={primaryButtonStyle}>
                      {addingFactory ? 'Adding...' : '+ Add Factory'}
                    </button>
                  </form>

                  {factoryMessage && <p className="green">{factoryMessage}</p>}
                  {factoryError && <p className="orange" role="alert">{factoryError}</p>}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <h3>Registered Factories</h3>
                    <button type="button" onClick={loadFactories} style={primaryButtonStyle}>
                      Refresh
                    </button>
                  </div>

                  {loadingFactories ? (
                      <p>Loading factories...</p>
                  ) : factories.length === 0 ? (
                      <p>No factories found.</p>
                  ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                          <tr>
                            {['ID', 'Name', 'Location', 'Description', 'Action'].map(heading => (
                                <th key={heading} style={cellStyle}>{heading}</th>
                            ))}
                          </tr>
                          </thead>
                          <tbody>
                          {factories.map(factory => (
                              <tr key={factory.id}>
                                <td style={cellStyle}>{factory.id}</td>
                                <td style={cellStyle}>{factory.name}</td>
                                <td style={cellStyle}>{factory.location || '—'}</td>
                                <td style={cellStyle}>{factory.description || '—'}</td>
                                <td style={cellStyle}>
                                  <button
                                      type="button"
                                      onClick={() => deleteFactory(factory.id)}
                                      style={deleteButtonStyle}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}
                </section>
              </>
          )}

          {/* PRODUCTION LINES */}
          {page === 'Production Lines' && (
              <>
                <section className="welcome">
                  <div>
                    <p className="eyebrow">PRODUCTION MANAGEMENT</p>
                    <h2>Production Lines</h2>
                    <p>Organize production lines inside your registered factories.</p>
                  </div>
                  <div className="welcome-icon">⌁</div>
                </section>

                <section className="panel" style={{ marginBottom: 24 }}>
                  <h3>Add a Production Line</h3>

                  {factories.length === 0 && !loadingFactories && (
                      <p className="orange">Register a factory first, then return here to add a production line.</p>
                  )}

                  <form onSubmit={addProductionLine}>
                    <label htmlFor="lineName">Production line name</label>
                    <input
                        id="lineName"
                        value={lineName}
                        onChange={event => setLineName(event.target.value)}
                        placeholder="e.g. Production Line A"
                        required
                        style={inputStyle}
                    />

                    <label htmlFor="selectedFactory">Select factory</label>
                    <select
                        id="selectedFactory"
                        value={selectedFactoryId}
                        onChange={event => setSelectedFactoryId(event.target.value)}
                        required
                        style={inputStyle}
                    >
                      <option value="">Choose a factory</option>
                      {factories.map(factory => (
                          <option key={factory.id} value={factory.id}>
                            {factory.name} (ID: {factory.id})
                          </option>
                      ))}
                    </select>

                    <label htmlFor="lineDescription">Description</label>
                    <textarea
                        id="lineDescription"
                        value={lineDescription}
                        onChange={event => setLineDescription(event.target.value)}
                        placeholder="Describe this production line"
                        rows={3}
                        style={inputStyle}
                    />

                    <button
                        type="submit"
                        disabled={addingLine || factories.length === 0}
                        style={primaryButtonStyle}
                    >
                      {addingLine ? 'Adding...' : '+ Add Production Line'}
                    </button>
                  </form>

                  {lineMessage && <p className="green">{lineMessage}</p>}
                  {lineError && <p className="orange" role="alert">{lineError}</p>}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <h3>Registered Production Lines</h3>
                    <button type="button" onClick={loadProductionLines} style={primaryButtonStyle}>
                      Refresh
                    </button>
                  </div>

                  {loadingLines ? (
                      <p>Loading production lines...</p>
                  ) : productionLines.length === 0 ? (
                      <p>No production lines found. Add your first production line above.</p>
                  ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                          <tr>
                            {['ID', 'Line Name', 'Factory', 'Description', 'Action'].map(heading => (
                                <th key={heading} style={cellStyle}>{heading}</th>
                            ))}
                          </tr>
                          </thead>
                          <tbody>
                          {productionLines.map(line => (
                              <tr key={line.id}>
                                <td style={cellStyle}>{line.id}</td>
                                <td style={cellStyle}>{line.name}</td>
                                <td style={cellStyle}>
                                  {line.factory?.name || `Factory ID ${line.factory?.id ?? '—'}`}
                                </td>
                                <td style={cellStyle}>{line.description || '—'}</td>
                                <td style={cellStyle}>
                                  <button
                                      type="button"
                                      onClick={() => deleteProductionLine(line.id)}
                                      style={deleteButtonStyle}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}
                </section>
              </>
          )}

          {/* MACHINES */}
          {page === 'Machines' && (
              <>
                <section className="welcome">
                  <div>
                    <p className="eyebrow">EQUIPMENT MANAGEMENT</p>
                    <h2>Machines Management</h2>
                    <p>Register machines, assign them to production lines, and track their status.</p>
                  </div>
                  <div className="welcome-icon">⚙</div>
                </section>

                <section className="panel" style={{ marginBottom: 24 }}>
                  <h3>Add a Machine</h3>

                  {productionLines.length === 0 && !loadingLines && (
                      <p className="orange">Add a production line first, then return here to register a machine.</p>
                  )}

                  <form onSubmit={addMachine}>
                    <label htmlFor="machineNameInput">Machine name</label>
                    <input
                        id="machineNameInput"
                        value={machineNameInput}
                        onChange={event => setMachineNameInput(event.target.value)}
                        placeholder="e.g. CNC-02"
                        required
                        style={inputStyle}
                    />

                    <label htmlFor="machineTypeInput">Machine type</label>
                    <input
                        id="machineTypeInput"
                        value={machineTypeInput}
                        onChange={event => setMachineTypeInput(event.target.value)}
                        placeholder="e.g. CNC Milling Machine"
                        required
                        style={inputStyle}
                    />

                    <label htmlFor="machineStatusInput">Status</label>
                    <select
                        id="machineStatusInput"
                        value={machineStatusInput}
                        onChange={event => setMachineStatusInput(event.target.value)}
                        required
                        style={inputStyle}
                    >
                      <option value="RUNNING">RUNNING</option>
                      <option value="STOPPED">STOPPED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>

                    <label htmlFor="operatingHoursInput">Operating hours</label>
                    <input
                        id="operatingHoursInput"
                        type="number"
                        min="0"
                        step="0.1"
                        value={operatingHoursInput}
                        onChange={event => setOperatingHoursInput(event.target.value)}
                        required
                        style={inputStyle}
                    />

                    <label htmlFor="selectedLineId">Production line</label>
                    <select
                        id="selectedLineId"
                        value={selectedLineId}
                        onChange={event => setSelectedLineId(event.target.value)}
                        required
                        style={inputStyle}
                    >
                      <option value="">Choose a production line</option>
                      {productionLines.map(line => (
                          <option key={line.id} value={line.id}>
                            {line.name} (ID: {line.id})
                          </option>
                      ))}
                    </select>

                    <button
                        type="submit"
                        disabled={addingMachine || productionLines.length === 0}
                        style={primaryButtonStyle}
                    >
                      {addingMachine ? 'Adding...' : '+ Add Machine'}
                    </button>
                  </form>

                  {machineMessage && <p className="green">{machineMessage}</p>}
                  {machineError && <p className="orange" role="alert">{machineError}</p>}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <h3>Registered Machines</h3>
                    <button type="button" onClick={loadMachines} style={primaryButtonStyle}>
                      Refresh
                    </button>
                  </div>

                  {loadingMachines ? (
                      <p>Loading machines...</p>
                  ) : machines.length === 0 ? (
                      <p>No machines found. Add your first machine above.</p>
                  ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                          <tr>
                            {['ID', 'Machine', 'Type', 'Status', 'Operating Hours', 'Production Line', 'Action'].map(heading => (
                                <th key={heading} style={cellStyle}>{heading}</th>
                            ))}
                          </tr>
                          </thead>
                          <tbody>
                          {machines.map(machine => (
                              <tr key={machine.id}>
                                <td style={cellStyle}>{machine.id}</td>
                                <td style={cellStyle}>{machine.name || '—'}</td>
                                <td style={cellStyle}>{machine.machineType || machine.type || '—'}</td>
                                <td style={cellStyle}>
                            <span className={`badge ${machine.status?.toUpperCase() === 'RUNNING' ? 'running' : ''}`}>
                              {machine.status || 'UNKNOWN'}
                            </span>
                                </td>
                                <td style={cellStyle}>{machine.operatingHours ?? '—'}</td>
                                <td style={cellStyle}>
                                  {machine.productionLine?.name || `Line ID ${machine.productionLine?.id ?? '—'}`}
                                </td>
                                <td style={cellStyle}>
                                  <button
                                      type="button"
                                      onClick={() => deleteMachine(machine.id)}
                                      style={deleteButtonStyle}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}
                </section>
              </>
          )}

          {/* DASHBOARD */}
          {page === 'Dashboard' && (
              <>
                <section className="welcome">
                  <div>
                    <p className="eyebrow">INDUSTRIAL INTELLIGENCE PLATFORM</p>
                    <h2>Welcome to FactoryPulse</h2>
                    <p>Monitor machines, detect abnormalities, and improve production performance.</p>
                  </div>
                  <div className="welcome-icon">⌁</div>
                </section>

                {dashboardError && (
                    <div className="panel" role="alert">
                      <p className="orange">{dashboardError}</p>
                      <p>Make sure the Spring Boot backend is running on port 8080.</p>
                    </div>
                )}

                {loadingDashboard && <div className="panel">Loading your factory data...</div>}

                <section className="stats-grid">
                  <div className="stat-card">
                    <p>Total Machines</p>
                    <h2>{totalMachines}</h2>
                    <span>Registered machines</span>
                  </div>
                  <div className="stat-card">
                    <p>Running Machines</p>
                    <h2 className="green">{runningMachines}</h2>
                    <span>Currently running</span>
                  </div>
                  <div className="stat-card">
                    <p>Active Alerts</p>
                    <h2 className="orange">{activeAlerts}</h2>
                    <span>Unresolved alerts</span>
                  </div>
                  <div className="stat-card">
                    <p>Production Count</p>
                    <h2>{productionCount}</h2>
                    <span>Latest recorded reading</span>
                  </div>
                </section>

                <section className="content-grid">
                  <div className="panel machine-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Machine Status</h3>
                        <p>Your registered industrial equipment</p>
                      </div>
                      <span className={`badge ${machineStatus.toUpperCase() === 'RUNNING' ? 'running' : ''}`}>
                    ● {machineStatus.toUpperCase()}
                  </span>
                    </div>

                    <div className="machine-details">
                      <div className="machine-icon">⚙</div>
                      <div>
                        <h3>{machineName}</h3>
                        <p>
                          {displayedMachine?.machineType || displayedMachine?.type || 'Industrial Machine'}
                          {' · '}
                          {displayedMachine?.productionLine?.name || 'Production Line A'}
                        </p>
                        <span className="muted">
                      {displayedMachine?.productionLine?.factory?.name || 'Hyderabad Manufacturing Plant'}
                    </span>
                      </div>
                    </div>

                    <div className="sensor-grid">
                      <div className="sensor-card">
                        <span>Temperature</span>
                        <h3>{typeof temperature === 'number' ? `${temperature}°C` : '—'}</h3>
                        <small className={temperatureHigh ? 'orange' : 'green'}>
                          {temperature == null ? 'No reading available' : temperatureHigh ? 'Above safe limit' : 'Within temperature limit'}
                        </small>
                      </div>
                      <div className="sensor-card">
                        <span>Vibration</span>
                        <h3>{typeof vibration === 'number' ? `${vibration} mm/s` : '—'}</h3>
                        <small className={vibrationHigh ? 'orange' : 'green'}>
                          {vibration == null ? 'No reading available' : vibrationHigh ? 'Above safe limit' : 'Within vibration limit'}
                        </small>
                      </div>
                      <div className="sensor-card">
                        <span>Pressure</span>
                        <h3>{typeof pressure === 'number' ? `${pressure} PSI` : '—'}</h3>
                        <small className={pressureNormal ? 'green' : 'orange'}>
                          {pressure == null ? 'No reading available' : pressureNormal ? 'Within range' : 'Check pressure'}
                        </small>
                      </div>
                    </div>

                    {stoppedMachines > 0 && (
                        <p className="orange">{stoppedMachines} machine(s) currently stopped.</p>
                    )}
                  </div>

                  <div className="panel alert-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Machine Alerts</h3>
                        <p>Monitor abnormal conditions</p>
                      </div>
                      <span className="alert-icon">!</span>
                    </div>

                    {unresolvedAlerts.length > 0
                        ? unresolvedAlerts.slice(0, 5).map(alert => (
                            <div className="alert-message" key={alert.id}>
                              <span className="alert-indicator"></span>
                              <div>
                                <h4>{alert.alertType || 'Machine Alert'}</h4>
                                <p>{alert.message || 'Abnormal condition detected.'}</p>
                                <small>
                                  {alert.severity || 'NOTICE'}
                                  {alert.machine?.name ? ` · ${alert.machine.name}` : ''}
                                </small>
                              </div>
                            </div>
                        ))
                        : (
                            <div className="alert-message">
                              <span className="status-dot"></span>
                              <div>
                                <h4>No unresolved alerts</h4>
                                <p>
                                  {alerts.length > 0
                                      ? 'All retrieved alerts are resolved.'
                                      : 'No active alerts were returned by the server.'}
                                </p>
                              </div>
                            </div>
                        )}

                    <div className="alert-footer">
                      <span>Alert system</span>
                      <strong>Enabled</strong>
                    </div>
                  </div>
                </section>
              </>
          )}

          {/* SENSOR MONITORING */}
          {page === 'Sensor Monitoring' && (
              <>
                <section className="welcome">
                  <div>
                    <p className="eyebrow">INDUSTRIAL SENSOR DATA</p>
                    <h2>Sensor Monitoring</h2>
                    <p>View recorded machine readings and monitor operating conditions.</p>
                  </div>
                  <div className="welcome-icon">⌁</div>
                </section>

                {sensorError && (
                    <section className="panel" role="alert">
                      <p className="orange">{sensorError}</p>
                    </section>
                )}

                <section className="stats-grid">
                  <div className="stat-card">
                    <p>Total Readings</p>
                    <h2>{sensorReadings.length}</h2>
                    <span>Saved sensor records</span>
                  </div>
                  <div className="stat-card">
                    <p>Machines Monitored</p>
                    <h2>{monitoredMachineCount}</h2>
                    <span>Machines with readings</span>
                  </div>
                  <div className="stat-card">
                    <p>Latest Temperature</p>
                    <h2>{latestSensorReading?.temperature != null ? `${latestSensorReading.temperature}°C` : '—'}</h2>
                    <span>Most recent recorded reading</span>
                  </div>
                  <div className="stat-card">
                    <p>Latest Vibration</p>
                    <h2>{latestSensorReading?.vibration != null ? `${latestSensorReading.vibration} mm/s` : '—'}</h2>
                    <span>Most recent recorded reading</span>
                  </div>
                </section>

                <section className="stats-grid">
                  <div className="stat-card">
                    <p>High Temperature Records</p>
                    <h2 className={highTemperatureCount > 0 ? 'orange' : 'green'}>{highTemperatureCount}</h2>
                    <span>Recorded values above 80°C</span>
                  </div>
                  <div className="stat-card">
                    <p>High Vibration Records</p>
                    <h2 className={highVibrationCount > 0 ? 'orange' : 'green'}>{highVibrationCount}</h2>
                    <span>Recorded values above 6 mm/s</span>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recorded Sensor Readings</h3>
                      <p>Readings retrieved from your FactoryPulse database</p>
                    </div>
                    <button
                        type="button"
                        onClick={loadSensorReadings}
                        disabled={loadingSensors}
                        style={primaryButtonStyle}
                    >
                      {loadingSensors ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>

                  {loadingSensors && sensorReadings.length === 0 ? (
                      <p>Loading sensor readings...</p>
                  ) : sensorReadings.length === 0 ? (
                      <p>No sensor readings found. Add a reading through your API first.</p>
                  ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                          <tr>
                            {['ID', 'Machine', 'Temperature (°C)', 'Vibration', 'Pressure', 'RPM', 'Power Consumption', 'Production Count', 'Timestamp'].map(heading => (
                                <th key={heading} style={cellStyle}>{heading}</th>
                            ))}
                          </tr>
                          </thead>
                          <tbody>
                          {sensorReadings.map(reading => {
                            const tempHigh = reading.temperature != null && Number(reading.temperature) > 80;
                            const vibrationIsHigh = reading.vibration != null && Number(reading.vibration) > 6;

                            return (
                                <tr key={reading.id}>
                                  <td style={cellStyle}>{reading.id}</td>
                                  <td style={cellStyle}>{reading.machine?.name || `Machine ID ${reading.machine?.id ?? '—'}`}</td>
                                  <td style={cellStyle}><span className={tempHigh ? 'orange' : ''}>{reading.temperature ?? '—'}</span></td>
                                  <td style={cellStyle}><span className={vibrationIsHigh ? 'orange' : ''}>{reading.vibration ?? '—'}</span></td>
                                  <td style={cellStyle}>{reading.pressure ?? '—'}</td>
                                  <td style={cellStyle}>{reading.rpm ?? '—'}</td>
                                  <td style={cellStyle}>{reading.powerConsumption ?? '—'}</td>
                                  <td style={cellStyle}>{reading.productionCount ?? '—'}</td>
                                  <td style={cellStyle}>{reading.timestamp ? String(reading.timestamp).replace('T', ' ') : '—'}</td>
                                </tr>
                            );
                          })}
                          </tbody>
                        </table>
                      </div>
                  )}

                  <p className="muted" style={{ marginTop: 16 }}>
                    These are saved/test readings from the database, not live measurements from physical sensors.
                  </p>
                </section>
              </>
          )}

          {/* MACHINE HEALTH */}
          {page === 'Machine Health' && (
              <>
                <section className="welcome">
                  <div>
                    <p className="eyebrow">FACTORYPULSE INTELLIGENCE</p>
                    <h2>Machine Health Intelligence</h2>
                    <p>Review machine health scores, sensor conditions and recommended maintenance actions.</p>
                  </div>
                  <div className="welcome-icon">♥</div>
                </section>

                {healthError && (
                    <section className="panel" role="alert">
                      <p className="orange">{healthError}</p>
                    </section>
                )}

                <section className="stats-grid">
                  <div className="stat-card">
                    <p>Machines Analyzed</p>
                    <h2>{machineHealth.length}</h2>
                    <span>Machines with saved sensor readings</span>
                  </div>
                  <div className="stat-card">
                    <p>Average Health Score</p>
                    <h2>{averageHealthScore}/100</h2>
                    <span>Average rule-based score</span>
                  </div>
                  <div className="stat-card">
                    <p>Healthy Machines</p>
                    <h2 className="green">{healthyCount}</h2>
                    <span>Score of 80 or above</span>
                  </div>
                  <div className="stat-card">
                    <p>Warning</p>
                    <h2 className="orange">{warningCount}</h2>
                    <span>Score from 50 to 79</span>
                  </div>
                  <div className="stat-card">
                    <p>Critical</p>
                    <h2 style={{ color: '#ef4444' }}>{criticalCount}</h2>
                    <span>Score below 50</span>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Machine Health Results</h3>
                      <p>Health assessment based on each machine's latest saved reading.</p>
                    </div>
                    <button
                        type="button"
                        onClick={loadMachineHealth}
                        disabled={loadingHealth}
                        style={primaryButtonStyle}
                    >
                      {loadingHealth ? 'Refreshing...' : 'Refresh Health Data'}
                    </button>
                  </div>

                  {loadingHealth && machineHealth.length === 0 ? (
                      <p>Loading machine health assessments...</p>
                  ) : machineHealth.length === 0 ? (
                      <p>No machine health results are available yet. Make sure at least one machine has a saved sensor reading.</p>
                  ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                          <tr>
                            {['Machine', 'Health Score', 'Condition', 'Temperature', 'Vibration', 'Pressure', 'Power', 'Recommendation', 'Last Updated'].map(heading => (
                                <th key={heading} style={cellStyle}>{heading}</th>
                            ))}
                          </tr>
                          </thead>
                          <tbody>
                          {machineHealth.map(machine => (
                              <tr key={machine.machineId}>
                                <td style={cellStyle}><strong>{machine.machineName || `Machine ${machine.machineId}`}</strong></td>
                                <td style={cellStyle}><strong style={{ color: healthColor(machine.healthStatus) }}>{machine.healthScore}/100</strong></td>
                                <td style={cellStyle}><span style={{ color: healthColor(machine.healthStatus), fontWeight: 700 }}>{machine.healthStatus}</span></td>
                                <td style={cellStyle}>{machine.temperature == null ? '—' : `${machine.temperature}°C`}</td>
                                <td style={cellStyle}>{machine.vibration == null ? '—' : machine.vibration}</td>
                                <td style={cellStyle}>{machine.pressure == null ? '—' : machine.pressure}</td>
                                <td style={cellStyle}>{machine.powerConsumption == null ? '—' : machine.powerConsumption}</td>
                                <td style={{ ...cellStyle, minWidth: '230px' }}>{machine.recommendation || 'Continue monitoring.'}</td>
                                <td style={{ ...cellStyle, minWidth: '150px' }}>{machine.lastUpdated ? String(machine.lastUpdated).replace('T', ' ') : '—'}</td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}

                  <p className="muted" style={{ marginTop: 16 }}>
                    Health scores use configured rules and saved sensor readings. They are indicative assessments, not guarantees of machine failure.
                  </p>
                </section>
              </>
          )}

          {/* ALERTS */}
          {page === 'Alerts' && (
              <section className="panel">
                <h2>Alerts</h2>
                {alerts.length ? (
                    <ul>
                      {alerts.map(alert => (
                          <li key={alert.id}>
                            {alert.alertType || 'Alert'} — {alert.message || 'No details'}
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p>No alerts found.</p>
                )}
              </section>
          )}

          {/* MAINTENANCE */}
          {page === 'Maintenance' && (
              <>
                <section className="welcome">
                  <div>
                    <p className="eyebrow">EQUIPMENT CARE</p>
                    <h2>Maintenance Management</h2>
                    <p>Schedule preventive maintenance and track maintenance work for your machines.</p>
                  </div>
                  <div className="welcome-icon">🔧</div>
                </section>

                <section className="stats-grid">
                  <div className="stat-card">
                    <p>Total Records</p>
                    <h2>{maintenanceRecords.length}</h2>
                    <span>Saved maintenance plans</span>
                  </div>

                  <div className="stat-card">
                    <p>Scheduled</p>
                    <h2>
                      {maintenanceRecords.filter(record => record.status === 'SCHEDULED').length}
                    </h2>
                    <span>Waiting to be performed</span>
                  </div>

                  <div className="stat-card">
                    <p>In Progress</p>
                    <h2 className="orange">
                      {maintenanceRecords.filter(record => record.status === 'IN_PROGRESS').length}
                    </h2>
                    <span>Maintenance underway</span>
                  </div>

                  <div className="stat-card">
                    <p>Completed</p>
                    <h2 className="green">
                      {maintenanceRecords.filter(record => record.status === 'COMPLETED').length}
                    </h2>
                    <span>Finished maintenance tasks</span>
                  </div>
                </section>

                <section className="panel" style={{ marginBottom: 24 }}>
                  <h3>Schedule Maintenance</h3>
                  <p className="muted">
                    Select a machine and enter the planned maintenance details.
                  </p>

                  <form onSubmit={addMaintenance}>
                    <label htmlFor="maintenanceMachineId">Select machine</label>
                    <select
                        id="maintenanceMachineId"
                        value={maintenanceMachineId}
                        onChange={event => setMaintenanceMachineId(event.target.value)}
                        required
                        style={inputStyle}
                    >
                      <option value="">Choose a machine</option>
                      {machines.map(machine => (
                          <option key={machine.id} value={machine.id}>
                            {machine.name || `Machine ${machine.id}`} (ID: {machine.id})
                          </option>
                      ))}
                    </select>

                    {machines.length === 0 && !loadingMachines && (
                        <p className="orange">
                          No machines are available. Register a machine first.
                        </p>
                    )}

                    <label htmlFor="maintenanceType">Maintenance type</label>
                    <select
                        id="maintenanceType"
                        value={maintenanceType}
                        onChange={event => setMaintenanceType(event.target.value)}
                        required
                        style={inputStyle}
                    >
                      <option value="Preventive Maintenance">Preventive Maintenance</option>
                      <option value="Corrective Maintenance">Corrective Maintenance</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Repair">Repair</option>
                      <option value="Calibration">Calibration</option>
                    </select>

                    <label htmlFor="maintenanceDescription">Description</label>
                    <textarea
                        id="maintenanceDescription"
                        value={maintenanceDescription}
                        onChange={event => setMaintenanceDescription(event.target.value)}
                        placeholder="Describe the maintenance work to be performed"
                        rows={3}
                        required
                        style={inputStyle}
                    />

                    <label htmlFor="maintenanceDate">Scheduled date</label>
                    <input
                        id="maintenanceDate"
                        type="date"
                        value={maintenanceDate}
                        onChange={event => setMaintenanceDate(event.target.value)}
                        required
                        style={inputStyle}
                    />

                    <label htmlFor="maintenanceStatus">Status</label>
                    <select
                        id="maintenanceStatus"
                        value={maintenanceStatus}
                        onChange={event => setMaintenanceStatus(event.target.value)}
                        required
                        style={inputStyle}
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    <button
                        type="submit"
                        disabled={addingMaintenance || machines.length === 0}
                        style={primaryButtonStyle}
                    >
                      {addingMaintenance ? 'Scheduling...' : '+ Schedule Maintenance'}
                    </button>
                  </form>

                  {maintenanceMessage && (
                      <p className="green" role="status">{maintenanceMessage}</p>
                  )}

                  {maintenanceError && (
                      <p className="orange" role="alert">{maintenanceError}</p>
                  )}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Maintenance Records</h3>
                      <p>Maintenance tasks saved in your FactoryPulse database.</p>
                    </div>

                    <button
                        type="button"
                        onClick={loadMaintenance}
                        disabled={loadingMaintenance}
                        style={primaryButtonStyle}
                    >
                      {loadingMaintenance ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>

                  {loadingMaintenance && maintenanceRecords.length === 0 ? (
                      <p>Loading maintenance records...</p>
                  ) : maintenanceRecords.length === 0 ? (
                      <p>No maintenance records found. Schedule your first maintenance task above.</p>
                  ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                          <tr>
                            {['ID', 'Machine', 'Maintenance Type', 'Description', 'Scheduled Date', 'Status', 'Update Status', 'Action'].map(heading => (
                                <th key={heading} style={cellStyle}>{heading}</th>
                            ))}
                          </tr>
                          </thead>

                          <tbody>
                          {maintenanceRecords.map(record => (
                              <tr key={record.id}>
                                <td style={cellStyle}>{record.id}</td>

                                <td style={cellStyle}>
                                  {record.machine?.name ||
                                      `Machine ID ${record.machine?.id ?? record.machineId ?? '—'}`}
                                </td>

                                <td style={cellStyle}>
                                  {record.maintenanceType || '—'}
                                </td>

                                <td style={{ ...cellStyle, minWidth: '200px' }}>
                                  {record.description || '—'}
                                </td>

                                <td style={cellStyle}>
                                  {record.scheduledDate || '—'}
                                </td>

                                <td style={cellStyle}>
                            <span
                                className={`badge ${
                                    record.status === 'COMPLETED'
                                        ? 'running'
                                        : ''
                                }`}
                                style={{
                                  color:
                                      record.status === 'COMPLETED'
                                          ? '#22c55e'
                                          : record.status === 'CANCELLED'
                                              ? '#ef4444'
                                              : record.status === 'IN_PROGRESS'
                                                  ? '#f59e0b'
                                                  : '#93c5fd',
                                }}
                            >
                              {record.status || 'SCHEDULED'}
                            </span>
                                </td>

                                <td style={{ ...cellStyle, minWidth: '170px' }}>
                                  <select
                                      aria-label={`Update status for maintenance ${record.id}`}
                                      value={record.status || 'SCHEDULED'}
                                      onChange={event =>
                                          updateMaintenanceStatus(record, event.target.value)
                                      }
                                      style={{
                                        ...inputStyle,
                                        margin: 0,
                                        minWidth: '150px',
                                      }}
                                  >
                                    <option value="SCHEDULED">SCHEDULED</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </select>
                                </td>

                                <td style={cellStyle}>
                                  <button
                                      type="button"
                                      onClick={() => deleteMaintenance(record.id)}
                                      style={deleteButtonStyle}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}

                  <p className="muted" style={{ marginTop: 16 }}>
                    Changes are sent to your backend. Refresh the list to retrieve the latest saved records.
                  </p>
                </section>
              </>
          )}

          <footer className="footer">
            FactoryPulse · Industrial Intelligence &amp; Predictive Maintenance
          </footer>
        </main>
      </div>
  );
}

export default App;