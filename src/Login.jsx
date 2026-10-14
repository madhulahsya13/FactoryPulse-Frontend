import { useState } from 'react';
import { Icon } from './icons';
import './Login.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

function passwordScore(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
}

function Login({ onLogin, onRegister }) {
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [factoryName, setFactoryName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [slow, setSlow] = useState(false);

    const isRegister = mode === 'register';
    const score = passwordScore(password);
    const rules = [
        { ok: password.length >= 8, text: 'At least 8 characters' },
        { ok: /[A-Za-z]/.test(password) && /\d/.test(password), text: 'A letter and a number' },
        { ok: confirm.length > 0 && password === confirm, text: 'Passwords match' },
    ];

    const switchMode = (next) => {
        setMode(next);
        setError('');
        setNotice('');
        setPassword('');
        setConfirm('');
        setShowPassword(false);
    };

    // Shows loading state, plus a hint if the free server is slow to wake up.
    const run = async (task) => {
        setLoading(true);
        setSlow(false);
        const timer = setTimeout(() => setSlow(true), 6000);
        try {
            await task();
        } finally {
            clearTimeout(timer);
            setLoading(false);
            setSlow(false);
        }
    };

    const loginMessage = (err) => {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            return 'Incorrect email or password. Please try again.';
        }
        if (err.code === 'ERR_NETWORK') {
            return 'Cannot connect to the server. Please try again in a minute.';
        }
        return err.response?.data?.message || err.message || 'Login failed. Please try again.';
    };

    const registerMessage = (err) => {
        const status = err.response?.status;
        if (status === 409) {
            return 'This email is already registered. Try signing in instead.';
        }
        if (status === 400) {
            return err.response?.data?.message || 'Please check the details you entered.';
        }
        if (err.code === 'ERR_NETWORK') {
            return 'Cannot connect to the server. Please try again in a minute.';
        }
        return err.response?.data?.message || 'Could not create the account. Please try again.';
    };

    const validateRegister = () => {
        if (name.trim().length < 2) return 'Please enter your full name.';
        if (factoryName.trim().length < 2) return 'Please enter your factory name.';
        if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
        if (password.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            return 'Password must include at least one letter and one number.';
        }
        if (password !== confirm) return 'Passwords do not match.';
        return '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setNotice('');

        if (!isRegister) {
            if (!email.trim() || !password) {
                setError('Please enter your email and password.');
                return;
            }
            await run(async () => {
                try {
                    await onLogin(email.trim(), password);
                } catch (err) {
                    setError(loginMessage(err));
                }
            });
            return;
        }

        const problem = validateRegister();
        if (problem) {
            setError(problem);
            return;
        }

        const cleanEmail = email.trim().toLowerCase();
        await run(async () => {
            try {
                await onRegister(name.trim(), cleanEmail, password, factoryName.trim());
            } catch (err) {
                setError(registerMessage(err));
                return;
            }
            try {
                await onLogin(cleanEmail, password);
            } catch {
                setMode('login');
                setEmail(cleanEmail);
                setPassword('');
                setConfirm('');
                setNotice('Account created. Please sign in.');
            }
        });
    };

    return (
        <div className="auth-page">
            <div className="auth-blob blob-1" />
            <div className="auth-blob blob-2" />

            <div className="auth-shell">
                <aside className="auth-hero">
                    <div className="auth-brand">
                        <div className="auth-logo"><Icon name="cpu" size={24} /></div>
                        <span>FactoryPulse</span>
                    </div>
                    <h1>Run your factory with confidence.</h1>
                    <p className="auth-lead">
                        Industrial intelligence for machine health, production and predictive maintenance.
                    </p>
                    <ul className="auth-features">
                        <li><Icon name="activity" size={18} /><span>Live sensor monitoring for every machine</span></li>
                        <li><Icon name="bell" size={18} /><span>Instant alerts before breakdowns happen</span></li>
                        <li><Icon name="wrench" size={18} /><span>Plan and track maintenance in one place</span></li>
                    </ul>
                    <p className="auth-tagline">Monitor. Predict. Prevent. Optimize.</p>
                </aside>

                <div className="login-card">
                    <div className="auth-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={!isRegister}
                            className={`auth-tab ${!isRegister ? 'active' : ''}`}
                            onClick={() => switchMode('login')}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isRegister}
                            className={`auth-tab ${isRegister ? 'active' : ''}`}
                            onClick={() => switchMode('register')}
                        >
                            Register as Factory Owner
                        </button>
                    </div>

                    <div className="login-heading">
                        <h2>{isRegister ? 'Register as Factory Owner' : 'Welcome back'}</h2>
                        <p>
                            {isRegister
                                ? 'Create your account and your first factory in one step.'
                                : 'Sign in to monitor your factory operations.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {isRegister && (
                            <>
                                <label htmlFor="name">Full name</label>
                                <div className="field">
                                    <Icon name="user" size={17} />
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="e.g. Ravi Kumar"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoComplete="name"
                                    />
                                </div>
                            </>
                        )}

                        {isRegister && (
                            <>
                                <label htmlFor="factoryName">Factory name</label>
                                <div className="field">
                                    <Icon name="factory" size={17} />
                                    <input
                                        id="factoryName"
                                        type="text"
                                        placeholder="e.g. Sunrise Auto Parts"
                                        value={factoryName}
                                        onChange={(e) => setFactoryName(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <label htmlFor="email">Email address</label>
                        <div className="field">
                            <Icon name="mail" size={17} />
                            <input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        <label htmlFor="password">Password</label>
                        <div className="field">
                            <Icon name="lock" size={17} />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder={isRegister ? 'Create a password' : 'Enter your password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                            />
                            <button
                                type="button"
                                className="pw-toggle"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <Icon name={showPassword ? 'eyeoff' : 'eye'} size={17} />
                            </button>
                        </div>

                        {isRegister && (
                            <>
                                <div className="strength">
                                    <div className="strength-bars">
                                        {[1, 2, 3, 4].map((n) => (
                                            <span key={n} className={score >= n ? `on s${score}` : ''} />
                                        ))}
                                    </div>
                                    <small>{password ? STRENGTH_LABELS[score] : 'Password strength'}</small>
                                </div>

                                <label htmlFor="confirm">Confirm password</label>
                                <div className="field">
                                    <Icon name="lock" size={17} />
                                    <input
                                        id="confirm"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Re-enter your password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <ul className="rules">
                                    {rules.map((rule) => (
                                        <li key={rule.text} className={rule.ok ? 'ok' : ''}>
                                            <Icon name="check" size={14} />
                                            {rule.text}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {notice && <p className="login-notice" role="status">{notice}</p>}
                        {error && <p className="login-error" role="alert">{error}</p>}

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading
                                ? (isRegister ? 'Creating account...' : 'Signing in...')
                                : (isRegister ? 'Register as Factory Owner' : 'Sign in')}
                        </button>

                        {loading && slow && (
                            <p className="slow-hint">
                                The server is waking up (free hosting). This can take up to a minute.
                            </p>
                        )}
                    </form>

                    <p className="switch-line">
                        {isRegister ? 'Already have an account?' : 'New to FactoryPulse?'}{' '}
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => switchMode(isRegister ? 'login' : 'register')}
                        >
                            {isRegister ? 'Sign in' : 'Register as Factory Owner'}
                        </button>
                    </p>

                    <div className="login-security">
                        <Icon name="lock" size={13} /> Protected with secure authentication
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
