
import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);

        try {
            await onLogin(email.trim(), password);
        } catch (err) {
            const status = err.response?.status;

            if (status === 401 || status === 403) {
                setError('Incorrect email or password. Please try again.');
            } else if (err.code === 'ERR_NETWORK') {
                setError(
                    'Cannot connect to the server. Check that the backend is running.'
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Login failed. Please try again.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">⚙</div>

                <h1>FactoryPulse</h1>
                <p className="login-subtitle">
                    Industrial Intelligence Platform
                </p>

                <div className="login-heading">
                    <h2>Welcome back</h2>
                    <p>Sign in to monitor your factory operations.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="username"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                <div className="login-security">
                    <span>🔒</span> Protected with secure authentication
                </div>

                <p className="login-tagline">
                    Monitor. Predict. Prevent. Optimize.
                </p>
            </div>
        </div>
    );
}

export default Login;