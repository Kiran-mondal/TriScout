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

// ১. মূল ডোমেইনে (/) ঢুকলে আপনার public/index.html (লগইন পেজ) লোড হবে
app.use(express.static(path.join(__dirname, '../public')));

// ২. লগইন চেক করার লজিক
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Admin / Admin দিয়ে লগইন চেক
    if (username === 'Admin' && password === 'Admin') {
        const token = jwt.sign({ user: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
        
        // লগইন সফল হলে টোকেন সেভ করে সরাসরি /dashboard-এ পাঠিয়ে দেবে
        res.send(`
            <script>
                localStorage.setItem('token', '${token}');
                window.location.href = '/dashboard';
            </script>
        `);
    } else {
        // লগইন ফেল করলে এরর মেসেজ
        res.send(`
            <body style="background:#050505; color:red; font-family:monospace; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
                <div style="text-align:center; border:1px solid red; padding:40px; background:#0a0a0a;">
                    <h2>[!] ACCESS DENIED</h2>
                    <a href="/" style="color:#d4ff00; text-decoration:none;">> RETRY LOGIN</a>
                </div>
            </body>
        `);
    }
});

// ৩. সার্ভার-সাইড ড্যাশবোর্ড (লগইন হওয়ার পর এই পেজটি সার্ভার থেকে আসবে)
app.get('/dashboard', (req, res) => {
    // এখানে সার্ভার সরাসরি ড্যাশবোর্ডের HTML পাঠাচ্ছে
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TRISCOUT // DASHBOARD</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { background: #050505; color: #d4ff00; font-family: 'Courier New', Courier, monospace; padding: 20px; }
                .header { border-bottom: 1px dashed #333; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;}
                button { padding: 10px 20px; background: red; color: white; border: none; font-weight: bold; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>TRISCOUT COMMAND CENTER</h2>
                <button onclick="localStorage.removeItem('token'); window.location.href='/'">LOGOUT</button>
            </div>
            <h3>SYSTEM STATUS: ONLINE</h3>
            <p>Welcome to the TriScout Dashboard. Server is running perfectly.</p>
            <!-- আপনার স্ক্যানার বা অন্যান্য টুলসের ডিজাইন এখানে বসাতে পারবেন -->
        </body>
        </html>
    `);
});

// ৪. গিটহাব লগইন লজিক (আগের মতোই আছে)
app.get('/api/auth/github', (req, res) => {
    const redirectUri = `https://${req.headers.host}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user`;
    res.redirect(githubAuthUrl);
});

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

        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } catch (error) {
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>');
    }
});

module.exports = app;
