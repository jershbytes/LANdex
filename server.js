require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { isAdmin } = require('./server/auth');

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, 'servers.json');

app.use(express.json());

// Ensure servers.json exists and is valid
if (!fs.existsSync(DATA_PATH)) {
  fs.writeFileSync(DATA_PATH, '[]', 'utf8');
} else {
  // Validate existing file
  try {
    const content = fs.readFileSync(DATA_PATH, 'utf8');
    if (!content || !content.trim()) {
      fs.writeFileSync(DATA_PATH, '[]', 'utf8');
    } else {
      JSON.parse(content); // Validate JSON
    }
  } catch (err) {
    console.error('Invalid servers.json, reinitializing...', err.message);
    fs.writeFileSync(DATA_PATH, '[]', 'utf8');
  }
}

// Utilities
const readData = () => JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const writeData = (data) =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

// API Routes

// GET all servers
app.get('/api/servers', (_, res) => {
  res.json(readData());
});

// POST new server
app.post('/api/servers', isAdmin, (req, res) => {
  // Ignore test login requests
  if (req.body && req.body.test) {
    return res.status(204).end(); // No Content, do not log or return error
  }
  if (!req.body.name || !req.body.ip) {
    return res.status(400).json({ error: 'Missing name or ip' });
  }
  const servers = readData();
  const newServer = { ...req.body, id: Date.now() };
  servers.push(newServer);
  writeData(servers);
  res.status(201).json(newServer);
});

// DELETE server by ID
app.delete('/api/servers/:id', isAdmin, (req, res) => {
  const id = +req.params.id;
  const servers = readData();
  const updated = servers.filter(s => s.id !== id);
  if (updated.length === servers.length) {
    return res.sendStatus(404); // Not found
  }
  writeData(updated);
  res.sendStatus(200); // OK
});

// Serve static files AFTER API routes
app.use(express.static(path.join(__dirname, 'public')));

// Serve React app for all remaining routes (SPA fallback)
app.use((req, res) => {
  // Only send index.html for GET requests to avoid issues with POST/DELETE
  if (req.method === 'GET') {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).end();
  }
});

// Start the server
app.listen(PORT, () =>
  console.log(`LAN Server List running on http://0.0.0.0:${PORT}`)
);
