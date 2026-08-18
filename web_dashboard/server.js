const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
const sql = neon(process.env.DATABASE_URL || 'postgres://placeholder');
const JWT_SECRET = process.env.JWT_SECRET || 'triscout_super_secret_key_2026';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// --- Authentication Routes (With GitHub OAuth) ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TRISCOUT // AUTH</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; background: #050505; color: #d4ff00; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 50px 50px; background-position: -1px -1px; }
                .login-box { border: 1px solid #333; padding: 30px; background: #0a0a0a; width: 350px; position: relative; text-align: center; }
                .login-box::before { content: ''; position: absolute; top: -1px; left: -1px; width: 15px; height: 15px; border-top: 2px solid #d4ff00; border-left: 2px solid #d4ff00; }
                
                /* Divider */
                .divider { display: flex; align-items: center; margin: 20px 0; color: #555; }
                .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px dashed #333; }
                .divider span { padding: 0 10px; font-size: 12px; }

                input { width: 100%; padding: 15px; margin-bottom: 20px; background: #000; border: 1px solid #333; color: #d4ff00; font-family: inherit; box-sizing: border-box; outline: none; font-size: 14px; }
                input:focus { border-color: #d4ff00; box-shadow: 0 0 8px rgba(212, 255, 0, 0.2); }
                
                button { width: 100%; padding: 15px; background: #d4ff00; color: #000; border: 1px solid #d4ff00; font-weight: bold; cursor: pointer; font-family: inherit; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; }
                button:hover { background: #000; color: #d4ff00; }
                
                .github-btn { background: #000; color: #fff; border: 1px solid #fff; margin-bottom: 20px; }
                .github-btn:hover { background: #fff; color: #000; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h2 style="margin-top:0; letter-spacing: 2px;">TRISCOUT // AUTH</h2>
                
                <!-- GitHub OAuth Login -->
                <a href="https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user">
                    <button class="github-btn">> AUTHENTICATE VIA GITHUB</button>
                </a>

                <div class="divider"><span>OR LOCAL ADMIN</span></div>

                <!-- Fallback Admin Login -->
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

// Existing Local Admin Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'triscout2026') {
        const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/';</script>`);
    } else {
        res.status(401).send('<h3 style="color:red; font-family:monospace; text-align:center;">[!] ACCESS DENIED. <a href="/login" style="color:#d4ff00;">RETRY</a></h3>');
    }
});

// GitHub OAuth Callback Route
app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        // 1. Exchange code for Access Token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code
            })
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) throw new Error('Failed to get access token');

        // 2. Fetch User Profile from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'TriScout-App'
            }
        });
        const userData = await userResponse.json();

        // 3. Issue TriScout JWT
        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url }, JWT_SECRET, { expiresIn: '1h' });

        // 4. Inject token into browser localStorage and redirect
        res.send(`
            <script>
                localStorage.setItem('token', '${token}');
                window.location.href = '/';
            </script>
        `);
    } catch (error) {
        console.error('GitHub Auth Error:', error);
        res.status(500).send('<h3 style="color:red; font-family:monospace; text-align:center;">[!] OAUTH FAILURE. <a href="/login" style="color:#d4ff00;">RETRY</a></h3>');
    }
});

// --- Dashboard Route (Serves index.html from public) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
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
                             
