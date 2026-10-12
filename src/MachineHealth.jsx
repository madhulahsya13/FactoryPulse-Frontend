
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL ?? 'https://factorypulse-backend-also.onrender.com'}/api`;

const panelStyle = {
    background: '#111827',
    border: '1px solid #344054',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    color: '#ffffff',
};

const cellStyle = {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #344054',
};

function statusColor(status) {
    if (status === 'HEALTHY') return '#22c55e';
    if (status === 'WARNING') return '#f59e0b';
    return '#ef4444';
}

export default function MachineHealth() {
    const [machinesHealth, setMachinesHealth] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadHealth = useCallback(async () => {
        const token = sessionStorage.getItem('factorypulse_token');

        if (!token) {
            setError('Please log in again to view machine health.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`${API_URL}/machine-health`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setMachinesHealth(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (err) {
            setError(
                err.response?.status === 401 || err.response?.status === 403
                    ? 'You are not authorized. Please log in again.'
                    : 'Could not load machine health. Check that the backend is running.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHealth();
    }, [loadHealth]);

    const healthyCount = machinesHealth.filter(
        machine => machine.healthStatus === 'HEALTHY'
    ).length;

    const warningCount = machinesHealth.filter(
        machine => machine.healthStatus === 'WARNING'
    ).length;

    const criticalCount = machinesHealth.filter(
        machine => machine.healthStatus === 'CRITICAL'
    ).length;

    const averageScore = machinesHealth.length
        ? Math.round(
            machinesHealth.reduce(
                (total, machine) => total + Number(machine.healthScore || 0),
                0
            ) / machinesHealth.length
        )
        : 0;

    return (
        <div>
            <section style={panelStyle}>
                <p style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 700 }}>
                    FACTORYPULSE INTELLIGENCE
                </p>

                <h2 style={{ marginBottom: '8px' }}>Machine Health Intelligence</h2>

                <p style={{ color: '#cbd5e1' }}>
                    Review machine health scores, sensor conditions and recommended
                    maintenance actions.
                </p>

                <button
                    type="button"
                    onClick={loadHealth}
                    disabled={loading}
                    style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                    }}
                >
                    {loading ? 'Loading...' : 'Refresh Health Data'}
                </button>
            </section>

            {error && (
                <section style={panelStyle}>
                    <p style={{ color: '#fca5a5' }}>{error}</p>
                </section>
            )}

            <section
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px',
                }}
            >
                {[
                    { label: 'Machines Analyzed', value: machinesHealth.length, color: '#ffffff' },
                    { label: 'Average Health Score', value: `${averageScore}/100`, color: '#60a5fa' },
                    { label: 'Healthy', value: healthyCount, color: '#22c55e' },
                    { label: 'Warning', value: warningCount, color: '#f59e0b' },
                    { label: 'Critical', value: criticalCount, color: '#ef4444' },
                ].map(item => (
                    <div key={item.label} style={panelStyle}>
                        <p style={{ color: '#cbd5e1', marginTop: 0 }}>{item.label}</p>
                        <h2 style={{ color: item.color, marginBottom: 0 }}>
                            {item.value}
                        </h2>
                    </div>
                ))}
            </section>

            <section style={panelStyle}>
                <h3>Machine Health Results</h3>

                {loading && machinesHealth.length === 0 ? (
                    <p>Loading machine health...</p>
                ) : machinesHealth.length === 0 ? (
                    <p>
                        No machine health results are available. Make sure your machines
                        have sensor readings recorded in FactoryPulse.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                color: '#ffffff',
                            }}
                        >
                            <thead>
                            <tr>
                                {[
                                    'Machine',
                                    'Health Score',
                                    'Condition',
                                    'Temperature',
                                    'Vibration',
                                    'Pressure',
                                    'Power',
                                    'Recommendation',
                                ].map(label => (
                                    <th key={label} style={cellStyle}>{label}</th>
                                ))}
                            </tr>
                            </thead>

                            <tbody>
                            {machinesHealth.map(machine => (
                                <tr key={machine.machineId}>
                                    <td style={cellStyle}>
                                        <strong>{machine.machineName || `Machine ${machine.machineId}`}</strong>
                                    </td>

                                    <td style={cellStyle}>
                                        <strong style={{ color: statusColor(machine.healthStatus) }}>
                                            {machine.healthScore}/100
                                        </strong>
                                    </td>

                                    <td style={cellStyle}>
                      <span
                          style={{
                              color: statusColor(machine.healthStatus),
                              fontWeight: 700,
                          }}
                      >
                        {machine.healthStatus}
                      </span>
                                    </td>

                                    <td style={cellStyle}>
                                        {machine.temperature == null ? '—' : `${machine.temperature}°C`}
                                    </td>

                                    <td style={cellStyle}>
                                        {machine.vibration == null ? '—' : machine.vibration}
                                    </td>

                                    <td style={cellStyle}>
                                        {machine.pressure == null ? '—' : machine.pressure}
                                    </td>

                                    <td style={cellStyle}>
                                        {machine.powerConsumption == null
                                            ? '—'
                                            : machine.powerConsumption}
                                    </td>

                                    <td style={{ ...cellStyle, minWidth: '220px' }}>
                                        {machine.recommendation || 'Continue monitoring.'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '13px' }}>
                    Health scores are based on the configured rules and the latest saved
                    sensor reading for each machine. They are indicative assessments,
                    not guarantees of machine failure.
                </p>
            </section>
        </div>
    );
}
