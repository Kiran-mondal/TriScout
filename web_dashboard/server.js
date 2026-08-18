const express = require('express');
const jwt = require('jsonwebtoken');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();

// Initialize Neon database connection (Requires DATABASE_URL in Vercel env variables)
const sql = neon(process.env.DATABASE_URL || 'postgres://placeholder');

const JWT_SECRET = process.env.JWT_SECRET || 'triscout_super_secret_key_2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Authentication Routes ---
app.get('/login', (req, res) => {
    // Fixed: Added backticks for multi-line string
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
        // Fixed: Added backticks for multi-line string
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

// --- Dashboard Route ---
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
                .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
                .High { background: #ef4444; color: white; }
                .Medium { background: #f97316; color: white; }
                .Low { background: #eab308; color: black; }
                .None { background: #22c55e; color: white; }
                button { background: #0ea5e9; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>🛰️ TriScout Real-Time Web Console</h1>
            <div id="auth-status">Verifying secure pipeline session...</div>
            
            <div id="dashboard-content" style="display:none;">
                <div class="card">
                    <h3>⚡ Active Session Target</h3>
                    <p id="target-ip">Awaiting manual scan trigger...</p>
                    <p><strong>Scan Timestamp:</strong> <span id="scan-time">N/A</span></p>
                    <button onclick="triggerPipeline()">Run Pipeline Scan</button>
                </div>
                
                <div class="card">
                    <h3>🔍 Discovered Vulnerabilities & Ports</h3>
                    <div id="port-listings">No active streams found.</div>
                </div>
            </div>

            <script>
                // 1. Check Authentication
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/login';
                } else {
                    document.getElementById('auth-status').style.display = 'none';
                    document.getElementById('dashboard-content').style.display = 'block';
                }

                // 2. Fetch Data (Replaces WebSockets)
                async function triggerPipeline() {
                    document.getElementById('target-ip').innerText = "Scanning... please wait.";
                    try {
                        // Call the pipeline API we built earlier
                        const res = await fetch('/api/run-pipeline');
                        const data = await res.json();
                        
                        document.getElementById('target-ip').innerText = "Scan Complete.";
                        document.getElementById('scan-time').innerText = new Date().toLocaleTimeString();
                        
                        // Display the raw JSON response for now
                        document.getElementById('port-listings').innerHTML = 
                            '<pre style="background: #0f172a; padding: 10px;">' + JSON.stringify(data, null, 2) + '</pre>';
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

// --- Orchestrator API (from previous steps) ---
app.get('/api/run-pipeline', async (req, res) => {
  try {
    const host = req.headers.host;
    const protocol = req.protocol === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    // 1. Trigger the Go Scanner API
    const scannerResponse = await fetch(`${baseUrl}/api/scanner`);
    const scannerData = await scannerResponse.json();

    // 2. Trigger the Python Processor API
    const processorResponse = await fetch(`${baseUrl}/api/processor`);
    const processorData = await processorResponse.json();

    // Return results
    res.json({
      status: 'Pipeline complete',
      scanner: scannerData,
      processor: processorData
    });
  } catch (err) {
    res.status(500).json({ error: 'Pipeline failed', details: err.message });
  }
});

// Export for Vercel
module.exports = app;

// Local Development Fallback
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(\`Local server running on port \${PORT}\`);
  });
}
