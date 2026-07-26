import { useState } from 'react';
import { login, register } from '../api/auth';

interface Props {
  onAuth: () => void;
}

export default function LoginPage({ onAuth }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      onAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>{isRegister ? 'Register' : 'Login'}</h1>
        {error && <p className="error" role="alert">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" />
              {isRegister ? 'Registering...' : 'Logging in...'}
            </span>
          ) : (
            isRegister ? 'Register' : 'Login'
          )}
        </button>
        <p className="toggle" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </form>
    </div>
  );
}
