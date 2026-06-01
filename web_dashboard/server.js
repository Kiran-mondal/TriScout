const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET = 'triscout_super_secret_key_2026';
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve simple inline styles/scripts dynamically to eliminate complex front-end file management
app.get('/login', (req, res) => {
    res.send(
        <div style="font-family: sans-serif; max-width: 300px; margin: 100px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
            <h2>TriScout Console Login</h2>
            <form action="/login" method="POST">
                <input type="text" name="username" placeholder="Username" required style="width:100%; margin-bottom:10; padding:8px;"><br>
                <input type="password" name="password" placeholder="Password" required style="width:100%; margin-bottom:10; padding:8px;"><br>
                <button type="submit" style="width:100%; padding:10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Authenticate</button>
            </form>
        </div>
    );
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Matching specified default credentials: admin / triscout2026
    if (username === 'admin' && password === 'triscout2026') {
        const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(
            <script>
                localStorage.setItem('token', '${token}');
                window.location.href = '/';
            </script>
        );
    } else {
        res.status(401).send('<h3>Invalid Credentials. <a href="/login">Try again</a></h3>');
    }
});

// Main Dashboard Interface
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TriScout Live Dashboard</title>
            <style>
                body { font-family: #999, sans-serif; background: #0f172a; color: #e2e8f0; padding: 30px; }
                .card { background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #334155; }
                h1 { color: #38bdf8; }
                .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
                .High { background: #ef4444; color: white; }
                .Medium { background: #f97316; color: white; }
                .Low { background: #eab308; color: black; }
                .None { background: #22c55e; color: white; }
            </style>
        </head>
        <body>
            <h1>🛰️ TriScout Real-Time Web Console</h1>
            <div id="auth-status">Verifying secure pipeline session...</div>
            
            <div id="dashboard-content" style="display:none;">
                <div class="card">
                    <h3>⚡ Active Session Target</h3>
                    <p id="target-ip">Loading...</p>
                    <p><strong>Scan Timestamp:</strong> <span id="scan-time">N/A</span></p>
                </div>
                
                <div class="card">
                    <h3>🔍 Discovered Vulnerabilities & Ports</h3>
                    <div id="port-listings">No active streams found.</div>
                </div>
            </div>

            <script>
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/login';
                } else {
                    document.getElementById('auth-status').style.display = 'none';
                    document.getElementById('dashboard-content').style.display = 'block';