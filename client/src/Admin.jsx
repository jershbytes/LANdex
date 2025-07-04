import { useState } from 'react';
import './App.css';

export default function Admin({ auth, setAuth, setAdmin, setError }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(auth.username + ':' + auth.password),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true, name: '', ip: '' }), // send name/ip to pass backend check
    });
    setLoading(false);
    if (res.status === 204) {
      setAdmin(true);
      setError('');
    } else {
      setError('Login failed');
    }
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <h2>Admin Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={auth.username}
        onChange={e => setAuth({ ...auth, username: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={auth.password}
        onChange={e => setAuth({ ...auth, password: e.target.value })}
        required
      />
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </form>
  );
}
