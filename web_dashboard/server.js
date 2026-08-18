const express = require('express');
const jwt = require('jsonwebtoken');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
const sql = neon(process.env.DATABASE_URL || 'postgres://placeholder');
const JWT_SECRET = process.env.JWT_SECRET || 'triscout_super_secret_key_2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Authentication Routes ---
app.get('/login', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; max-width: 300px; margin: 100px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
            <h2>TriScout Console Login</h2>
            <form action="/login" method="POST">
                <input type="text" name="username" placeholder="Username" required style="width:100%; margin-bottom:10px; padding:8px;"><br>
                <input type="password" name="password" placeholder="Password" required style="width:100%; margin-bottom:10px; padding:8px;"><br>
                <button type="submit" style="width:100%; padding:10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Authenticate</button>
            </form>
        </div>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'triscout2026') {
        const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`
            <script>
                localStorage.setItem('token', '${token}');
                window.location.href = '/';
            </script>
        `);
    } else {
        res.status(401).send('<h3>Invalid Credentials. <a href="/login">Try again</a></h3>');
    }
});

// --- Dashboard Route (Updated with Authorization Check) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TriScout Live Dashboard</title>
            <style>
                body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 30px; }
                .card { background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #334155; }
                h1 { color: #38bdf8; }
                .input-box { width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 5px; border: 1px solid #475569; background: #0f172a; color: white; box-sizing: border-box; }
                button { background: #0ea5e9; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
                button:disabled { background: #475569; cursor: not-allowed; }
            </style>
        </head>
        <body>
            <h1>🛰️ TriScout Real-Time Web Console</h1>
            <div id="auth-status">Verifying secure pipeline session...</div>
            
            <div id="dashboard-content" style="display:none;">
                
                <div class="card">
                    <h3>🎯 Target Configuration & Authorization</h3>
                    <p>Enter the target IP or Domain you wish to scan.</p>
                    <input type="text" id="target-input" class="input-box" placeholder="e.g., 192.168.1.100 or example.com">
                    
                    <label style="display: block; margin-bottom: 15px; color: #f87171;">
                        <input type="checkbox" id="consent-check" onchange="toggleButton()">
                        <strong>I confirm that I have explicit authorization to scan this target.</strong>
                    </label>
                    
                    <button id="scan-btn" onclick="triggerPipeline()" disabled>Run Authorized Scan</button>
                </div>

                <div class="card">
                    <h3>⚡ Scan Status</h3>
                    <p id="target-ip">Awaiting authorized target...</p>
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
                }

                function toggleButton() {
                    const consent = document.getElementById('consent-check').checked;
                    document.getElementById('scan-btn').disabled = !consent;
                }

                async function triggerPipeline() {
                    const target = document.getElementById('target-input').value.trim();
                    if(!target) {
                        alert("Please enter a valid target IP or Domain.");
                        return;
                    }

                    document.getElementById('target-ip').innerText = "Scanning target: " + target + " ... please wait.";
                    
                    try {
                        const res = await fetch('/api/run-pipeline', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ target: target })
                        });
                        const data = await res.json();
                        
                        document.getElementById('target-ip').innerText = "Scan Complete for: " + target;
                        document.getElementById('scan-time').innerText = new Date().toLocaleTimeString();
                        
                        document.getElementById('port-listings').innerHTML = 
                            '<pre style="background: #0f172a; padding: 10px; overflow-x: auto;">' + JSON.stringify(data, null, 2) + '</pre>';
                    } catch(err) {
                        document.getElementById('target-ip').innerText = "Scan Failed.";
                        console.error(err);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// --- Orchestrator API (Updated to POST) ---
app.post('/api/run-pipeline', async (req, res) => {
  try {
    const { target } = req.body;
    if(!target) throw new Error("Target is required for scanning.");

    const host = req.headers.host;
    const protocol = req.protocol === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    // 1. Pass target to Go Scanner
    const scannerResponse = await fetch(`${baseUrl}/api/scanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target })
    });
    const scannerData = await scannerResponse.json();

    // 2. Pass data to Python Processor
    const processorResponse = await fetch(`${baseUrl}/api/processor`);
    const processorData = await processorResponse.json();

    res.json({
      status: 'Authorized Pipeline complete',
      target_scanned: target,
      scanner: scannerData,
      processor: processorData
    });
  } catch (err) {
    res.status(500).json({ error: 'Pipeline failed', details: err.message });
  }
});

module.exports = app;
