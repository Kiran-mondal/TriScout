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
app.use(express.static(path.join(__dirname, '../public')));

// --- 1. Login Page Route ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TRISCOUT // AUTH</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Courier New', Courier, monospace; background: #050505; color: #d4ff00; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 50px 50px; background-position: -1px -1px; }
                .login-box { border: 1px solid #333; padding: 35px; background: #0a0a0a; width: 100%; max-width: 400px; position: relative; box-sizing: border-box; }
                .login-box::before { content: ''; position: absolute; top: -1px; left: -1px; width: 15px; height: 15px; border-top: 2px solid #d4ff00; border-left: 2px solid #d4ff00; }
                .logo-header { display: flex; align-items: center; justify-content: center; margin-bottom: 30px; gap: 15px; }
                .logo-header img { width: 40px; height: 40px; }
                .logo-header h2 { margin: 0; letter-spacing: 3px; font-size: 26px; color: #d4ff00; text-shadow: 0 0 8px rgba(212, 255, 0, 0.3); }
                .divider { display: flex; align-items: center; margin: 25px 0; color: #555; }
                .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px dashed #333; }
                .divider span { padding: 0 10px; font-size: 11px; letter-spacing: 1px; }
                input { width: 100%; padding: 14px; margin-bottom: 15px; background: #000; border: 1px solid #333; color: #d4ff00; font-family: inherit; box-sizing: border-box; outline: none; font-size: 14px; }
                input:focus { border-color: #d4ff00; box-shadow: 0 0 8px rgba(212, 255, 0, 0.2); }
                button { width: 100%; padding: 14px; background: #d4ff00; color: #000; border: 1px solid #d4ff00; font-weight: bold; cursor: pointer; font-family: inherit; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; }
                button:hover { background: #000; color: #d4ff00; }
                .github-btn { background: #000; color: #fff; border: 1px solid #fff; display: flex; align-items: center; justify-content: center; gap: 10px; text-decoration: none; margin-bottom: 10px; }
                .github-btn:hover { background: #fff; color: #000; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <div class="logo-header">
                    <img src="/logo.svg" alt="Logo">
                    <h2>TRISCOUT</h2>
                </div>
                
                <a href="/api/auth/github" style="text-decoration: none;">
                    <button class="github-btn" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        AUTHENTICATE VIA GITHUB
                    </button>
                </a>

                <div class="divider"><span>OR LOCAL ADMIN</span></div>

                <!-- 100% Working Standard HTML Form -->
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

// --- 2. Local Admin Login Logic ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check credentials (Admin / Admin)
    if (username === 'Admin' && password === 'Admin') {
        const token = jwt.sign({ user: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
        
        // Auto-save token and redirect to dashboard
        res.send(`
            <script>
                localStorage.setItem('token', '${token}');
                window.location.href = '/';
            </script>
        `);
    } else {
        // Show error page if wrong details
        res.send(`
            <body style="background:#050505; color:red; font-family:'Courier New', monospace; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
                <div style="text-align:center; border:1px solid red; padding:40px; background:#0a0a0a;">
                    <h2>[!] ACCESS DENIED</h2>
                    <p>INVALID USERNAME OR PASSWORD</p>
                    <br>
                    <a href="/login" style="color:#d4ff00; text-decoration:none; border:1px solid #d4ff00; padding:10px 20px;">> RETRY LOGIN</a>
                </div>
            </body>
        `);
    }
});

// --- 3. GitHub OAuth Init ---
app.get('/api/auth/github', (req, res) => {
    const redirectUri = `https://${req.headers.host}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user`;
    res.redirect(githubAuthUrl);
});

// --- 4. GitHub OAuth Callback ---
app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code: code })
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) throw new Error('Failed to get access token');

        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'TriScout-App' }
        });
        const userData = await userResponse.json();
        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url }, JWT_SECRET, { expiresIn: '1h' });

        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/';</script>`);
    } catch (error) {
        res.status(500).send('<h3 style="color:red; font-family:monospace; text-align:center;">[!] OAUTH FAILURE. <a href="/login" style="color:#d4ff00;">RETRY</a></h3>');
    }
});

// --- 5. Dashboard Page ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// --- 6. Pipeline API ---
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

    res.json({ status: 'Advanced Pipeline complete', target_scanned: target, scanner: scannerData, processor: processorData });
  } catch (err) {
    res.status(500).json({ error: 'Pipeline failed', details: err.message });
  }
});

module.exports = app;
            
