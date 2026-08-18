const express = require('express');
const jwt = require('jsonwebtoken');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
const sql = neon(process.env.DATABASE_URL || 'postgres://placeholder');
const JWT_SECRET = process.env.JWT_SECRET || 'triscout_super_secret_key_2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Authentication Routes (Updated Design) ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TRISCOUT // AUTH</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; background: #050505; color: #d4ff00; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-box { border: 1px solid #333; padding: 30px; background: #0a0a0a; width: 300px; }
                input { width: 100%; padding: 10px; margin-bottom: 15px; background: #000; border: 1px solid #333; color: #d4ff00; font-family: inherit; box-sizing: border-box; outline: none; }
                input:focus { border-color: #d4ff00; }
                button { width: 100%; padding: 12px; background: #d4ff00; color: #000; border: none; font-weight: bold; cursor: pointer; font-family: inherit; text-transform: uppercase; }
                button:hover { background: #fff; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h2>TRISCOUT // AUTH</h2>
                <form action="/login" method="POST">
                    <input type="text" name="username" placeholder="USERNAME" required>
                    <input type="password" name="password" placeholder="PASSWORD" required>
                    <button type="submit">ACCESS SYSTEM</button>
                </form>
            </div>
        </body>
        </html>
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
        res.status(401).send('<h3 style="color:red; font-family:monospace; text-align:center; margin-top:50px;">INVALID CREDENTIALS. <a href="/login" style="color:#d4ff00;">RETRY</a></h3>');
    }
});

// --- Dashboard Route (Cyber Brutalism + Session Logout) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TRISCOUT // CYBER_BRUTALISM</title>
            <style>
                :root { --bg-color: #050505; --card-bg: #0a0a0a; --border-color: #333333; --accent-green: #d4ff00; --text-main: #e0e0e0; --text-muted: #888888; --danger-red: #ff3333; }
                body { font-family: 'Courier New', Courier, monospace; background-color: var(--bg-color); color: var(--text-main); padding: 30px; line-height: 1.6; text-transform: uppercase; background-image: linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px); background-size: 50px 50px; background-position: -1px -1px; }
                
                /* Header Flexbox for Logout */
                .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-color); padding-bottom: 10px; margin-bottom: 30px; }
                h1 { color: var(--accent-green); letter-spacing: 2px; font-size: 2em; margin: 0; text-shadow: 0 0 5px rgba(212, 255, 0, 0.3); }
                .logout-btn { background: var(--danger-red); color: #000; border: none; padding: 10px 15px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-family: inherit; }
                .logout-btn:hover { background: #000; color: var(--danger-red); border: 1px solid var(--danger-red); }

                h3 { color: #ffffff; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; font-weight: normal; letter-spacing: 1.5px; }
                h3::before { content: '> '; color: var(--accent-green); }
                
                .card { background: var(--card-bg); padding: 25px; border: 1px solid var(--border-color); border-radius: 0; margin-bottom: 25px; position: relative; }
                .card::before { content: ''; position: absolute; top: -1px; left: -1px; width: 15px; height: 15px; border-top: 2px solid var(--accent-green); border-left: 2px solid var(--accent-green); }
                
                .input-box { width: 100%; padding: 15px; margin-bottom: 20px; border: 1px solid var(--border-color); background: #000; color: var(--accent-green); box-sizing: border-box; font-family: inherit; font-size: 16px; outline: none; }
                .input-box:focus { border-color: var(--accent-green); }
                
                .consent-box { display: block; margin-bottom: 20px; color: var(--text-main); background: #000; padding: 15px; border: 1px dashed var(--border-color); cursor: pointer; }
                
                .scan-btn { background: var(--accent-green); color: #000; border: 1px solid var(--accent-green); padding: 15px 25px; cursor: pointer; font-weight: bold; font-size: 16px; font-family: inherit; text-transform: uppercase; }
                .scan-btn:disabled { background: #111; color: #555; border-color: #333; cursor: not-allowed; }
                .scan-btn:hover:not(:disabled) { background: #000; color: var(--accent-green); }
                
                .cyber-table { width: 100%; border-collapse: collapse; background: #000; border: 1px solid var(--border-color); margin-top: 15px; }
                .cyber-table th { padding: 15px; background: #111; color: var(--accent-green); border: 1px solid var(--border-color); font-weight: normal; }
                .cyber-table td { padding: 15px; border: 1px solid var(--border-color); color: var(--text-main); }
                
                .status-badge { padding: 5px 10px; font-weight: bold; display: inline-block; }
                .status-secure { color: #000; background: var(--accent-green); }
                .status-danger { color: #000; background: var(--danger-red); }
                .status-missing { color: var(--danger-red); border: 1px solid var(--danger-red); }
                
                .cyber-alert { padding: 15px; background: rgba(255, 51, 51, 0.1); border-left: 4px solid var(--danger-red); color: var(--danger-red); margin-bottom: 20px; }
                .cyber-success { padding: 15px; background: rgba(212, 255, 0, 0.1); border-left: 4px solid var(--accent-green); color: var(--accent-green); }
            </style>
        </head>
        <body>
            <div class="header-container">
                <h1>TRISCOUT // SYS_SCANNER</h1>
                <button class="logout-btn" onclick="logoutSession()">[X] LOGOUT</button>
            </div>

            <div id="auth-status" style="color: var(--accent-green);">[!] VERIFYING SECURE NODE...</div>
            
            <div id="dashboard-content" style="display:none;">
                
                <div class="card">
                    <h3>01 // TARGET_CONFIG</h3>
                    <p style="color: var(--text-muted);">INITIALIZE RECONNAISSANCE SEQUENCE ON TARGET DOMAIN OR IP.</p>
                    <input type="text" id="target-input" class="input-box" placeholder="INPUT TARGET (E.G. EXAMPLE.COM)">
                    
                    <label class="consent-box">
                        <input type="checkbox" id="consent-check" onchange="toggleButton()">
                        <strong> [!] I CONFIRM EXPLICIT AUTHORIZATION TO INITIATE SCAN ON THIS TARGET.</strong>
                    </label>
                    
                    <button id="scan-btn" class="scan-btn" onclick="triggerPipeline()" disabled>INITIATE SECURITY SCAN ↗</button>
                </div>

                <div class="card">
                    <h3>02 // SYSTEM_STATUS</h3>
                    <p id="target-ip" style="color: var(--text-muted);">AWAITING TARGET INPUT...</p>
                    <p><strong>SYS_TIME:</strong> <span id="scan-time" style="color: var(--accent-green);">--:--:--</span></p>
                </div>
                
                <div class="card">
                    <h3>03 // SECURITY_HEADERS</h3>
                    <div id="header-listings"><span style="color: var(--text-muted);">// NO DATA.</span></div>
                </div>

                <div class="card">
                    <h3>04 // PORT_VULNERABILITIES</h3>
                    <div id="port-listings"><span style="color: var(--text-muted);">// NO DATA.</span></div>
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

                // --- Session Logout Function ---
                function logoutSession() {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }

                function toggleButton() {
                    const consent = document.getElementById('consent-check').checked;
                    document.getElementById('scan-btn').disabled = !consent;
                }

                async function triggerPipeline() {
                    const target = document.getElementById('target-input').value.trim();
                    if(!target) {
                        alert("ERROR: NO TARGET SPECIFIED.");
                        return;
                    }

                    document.getElementById('target-ip').innerHTML = "SCANNING TARGET: <span style='color: var(--accent-green);'>" + target + "</span> ... RENDERING.";
                    document.getElementById('header-listings').innerHTML = "<span style='color: var(--text-muted);'>// ANALYZING HEADERS...</span>";
                    document.getElementById('port-listings').innerHTML = "<span style='color: var(--text-muted);'>// SCANNING PORTS...</span>";
                    
                    try {
                        const res = await fetch('/api/run-pipeline', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ target: target })
                        });
                        const data = await res.json();
                        
                        document.getElementById('target-ip').innerHTML = "SCAN COMPLETE FOR: <span style='color: var(--accent-green);'>" + target + "</span>";
                        document.getElementById('scan-time').innerText = new Date().toLocaleTimeString();
                        
                        const scannerData = data.scanner || {};
                        const openPorts = scannerData.open_ports || [];
                        const securityHeaders = scannerData.security_headers || [];
                        
                        let headerHtml = "<table class='cyber-table'>";
                        headerHtml += "<tr><th>SECURITY_HEADER</th><th>STATUS</th><th>EXPLANATION</th></tr>";
                        securityHeaders.forEach(h => {
                            let badgeClass = h.status === 'Secure' ? 'status-secure' : 'status-missing';
                            headerHtml += "<tr>";
                            headerHtml += "<td>" + h.header_name + "</td>";
                            headerHtml += "<td><span class='status-badge " + badgeClass + "'>" + h.status.toUpperCase() + "</span></td>";
                            headerHtml += "<td style='color: var(--text-muted); text-transform: none;'>" + h.details + "</td>";
                            headerHtml += "</tr>";
                        });
                        headerHtml += "</table>";
                        document.getElementById('header-listings').innerHTML = headerHtml;

                        let portHtml = "";
                        if (openPorts.length === 0) {
                            portHtml = "<div class='cyber-success'>[+] ZERO VULNERABLE PORTS DETECTED. SYSTEM REMAINS SECURE.</div>";
                        } else {
                            portHtml = "<div class='cyber-alert'>[!] WARNING: EXPOSED PORTS DETECTED.</div>";
                            portHtml += "<table class='cyber-table'>";
                            portHtml += "<tr><th>PORT</th><th>SERVICE</th><th>SECURITY_ADVICE</th></tr>";
                            openPorts.forEach(p => {
                                let advice = "Ensure this port is strictly monitored.";
                                let portClass = "";
                                if(p.port === 21 || p.port === 23) { advice = "INSECURE PROTOCOL. DISABLE IMMEDIATELY."; portClass = "status-badge status-danger"; }
                                else if(p.port === 80) advice = "HTTP is open. Redirect to HTTPS.";
                                else if(p.port === 3306 || p.port === 5432) { advice = "CRITICAL RISK! Database exposed."; portClass = "status-badge status-danger"; }
                                
                                portHtml += "<tr>";
                                portHtml += "<td><span class='" + portClass + "'>" + p.port + "</span></td>";
                                portHtml += "<td>" + p.service + "</td>";
                                portHtml += "<td style='color: var(--text-muted); text-transform: none;'>" + advice + "</td>";
                                portHtml += "</tr>";
                            });
                            portHtml += "</table>";
                        }
                        document.getElementById('port-listings').innerHTML = portHtml;

                    } catch(err) {
                        document.getElementById('target-ip').innerHTML = "<span style='color: var(--danger-red);'>[!] SCAN FAILED.</span>";
                        console.error(err);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// --- Pipeline API ---
app.post('/api/run-pipeline', async (req, res) => {
  try {
    const { target } = req.body;
    if(!target) throw new Error("Target is required.");

    const host = req.headers.host;
    const protocol = req.protocol === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const scannerResponse = await fetch(`${baseUrl}/api/scanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target })
    });
    const scannerData = await scannerResponse.json();

    const processorResponse = await fetch(`${baseUrl}/api/processor`);
    const processorData = await processorResponse.json();

    res.json({
      status: 'Advanced Pipeline complete',
      target_scanned: target,
      scanner: scannerData,
      processor: processorData
    });
  } catch (err) {
    res.status(500).json({ error: 'Pipeline failed', details: err.message });
  }
});

module.exports = app;
        
