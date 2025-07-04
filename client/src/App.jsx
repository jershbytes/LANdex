import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Admin from './Admin.jsx';
import './App.css';

function useAdminAuth() {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('adminAuth');
    if (!stored) return false;
    const { expires } = JSON.parse(stored);
    return Date.now() < expires;
  });
  useEffect(() => {
    if (admin) {
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      localStorage.setItem('adminAuth', JSON.stringify({ expires }));
    } else {
      localStorage.removeItem('adminAuth');
    }
  }, [admin]);
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('adminAuth');
      if (stored) {
        const { expires } = JSON.parse(stored);
        if (Date.now() > expires) setAdmin(false);
      }
    }, 1000 * 10); // check every 10s
    return () => clearInterval(interval);
  }, []);
  return [admin, setAdmin];
}

function ServerList({ servers, admin, handleDelete }) {
  // Copy to clipboard handler
  const handleCopy = (ip) => {
    navigator.clipboard.writeText(ip);
  };
  return (
    <ul className="server-list">
      {servers.map(server => (
        <li key={server.id}>
          <b>{server.name}</b> <span>{server.ip}</span>
          <button onClick={() => handleCopy(server.ip)} className="copy-btn" title="Copy IP">Copy</button>
          {admin && (
            <button onClick={() => handleDelete(server.id)} className="delete-btn">Delete</button>
          )}
        </li>
      ))}
    </ul>
  );
}

function AddServerForm({ newServer, setNewServer, handleAdd }) {
  return (
    <form className="add-form" onSubmit={handleAdd}>
      <h2>Add Server</h2>
      <input
        type="text"
        placeholder="Server Name"
        value={newServer.name}
        onChange={e => setNewServer({ ...newServer, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="IP Address"
        value={newServer.ip}
        onChange={e => setNewServer({ ...newServer, ip: e.target.value })}
        required
      />
      <button type="submit">Add</button>
    </form>
  );
}

function Home({ servers, loading, error }) {
  return (
    <div className="container">
      <h1>LAN Server List</h1>
      {error && <div className="error">{error}</div>}
      {loading ? <div>Loading...</div> : <ServerList servers={servers} admin={false} handleDelete={() => {}} />}
      <div style={{marginTop: '2rem', textAlign: 'center'}}>
        <a href="/admin" style={{color: '#a6e22e'}}>Admin Login</a>
      </div>
    </div>
  );
}

function AdminPage(props) {
  const navigate = useNavigate();
  const { admin, setAdmin, ...rest } = props;
  useEffect(() => {
    if (!admin) return;
    // Redirect to /admin after login
    navigate('/admin', { replace: true });
  }, [admin, navigate]);
  const handleLogout = () => {
    setAdmin(false);
    navigate('/');
  };
  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>LAN Server List (Admin)</h1>
      </div>
      {rest.error && <div className="error">{rest.error}</div>}
      <ServerList servers={rest.servers} admin={admin} handleDelete={rest.handleDelete} />
      <AddServerForm newServer={rest.newServer} setNewServer={rest.setNewServer} handleAdd={rest.handleAdd} />
      <div style={{marginTop: '1rem', textAlign: 'right'}}>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

function App() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [admin, setAdmin] = useAdminAuth();
  const [auth, setAuth] = useState({ username: '', password: '' });
  const [newServer, setNewServer] = useState({ name: '', ip: '' });

  // Fetch servers
  useEffect(() => {
    fetch('/api/servers')
      .then(res => res.json())
      .then(setServers)
      .catch(() => setError('Failed to load servers'))
      .finally(() => setLoading(false));
  }, []);

  // Add server
  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(auth.username + ':' + auth.password),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newServer),
    });
    if (res.ok) {
      setServers([...servers, await res.json()]);
      setNewServer({ name: '', ip: '' });
      setError('');
    } else {
      setError('Failed to add server');
    }
  };

  // Delete server
  const handleDelete = async (id) => {
    const res = await fetch(`/api/servers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + btoa(auth.username + ':' + auth.password),
      },
    });
    if (res.ok) {
      setServers(servers.filter(s => s.id !== id));
      setError('');
    } else {
      setError('Failed to delete server');
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home servers={servers} loading={loading} error={error} />} />
        <Route path="/admin" element={
          !admin ? (
            <div className="container">
              <Admin auth={auth} setAuth={setAuth} setAdmin={setAdmin} setError={setError} />
            </div>
          ) : (
            <AdminPage
              admin={admin}
              setAdmin={setAdmin}
              servers={servers}
              error={error}
              handleDelete={handleDelete}
              newServer={newServer}
              setNewServer={setNewServer}
              handleAdd={handleAdd}
            />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
