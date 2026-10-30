const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios'); 
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const { requireHTTPAuth, JWT_SECRET, getEnv } = require('./middleware/auth.js');

const app = express();

const DATABASE_URL = getEnv('DATABASE_URL');
const GITHUB_CLIENT_ID = getEnv('GITHUB_CLIENT_ID');
const GITHUB_CLIENT_SECRET = getEnv('GITHUB_CLIENT_SECRET');
const ADMIN_USER = getEnv('ADMIN_USERNAME');
const ADMIN_PASS = getEnv('ADMIN_PASSWORD');

const sql = DATABASE_URL ? neon(DATABASE_URL) : async () => { throw new Error("Database URL not configured"); };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ১. লগইন ও সাইন-আপ পেজ (public/index.html) সার্ভ করা - কোনো ক্যাশ থাকবে না
const authHtmlPath = path.join(__dirname, '../public/index.html');

app.get(['/', '/login', '/index.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const html = fs.readFileSync(authHtmlPath, 'utf8');
    res.status(200).send(html);
});

// স্ট্যাটিক ফাইলগুলোর জন্য (index: false দেওয়া হয়েছে যাতে পুরনো ক্যাশড index.html লোড না হয়)
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/logo.svg'));
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: getEnv('GMAIL_USER'), pass: getEnv('GMAIL_PASS') }
}); 

// ২. ডাটাবেস টেবিল তৈরি (Users + Email OTP Verification Table)
let isDbInitialized = false;
async function ensureUsersTable() {
    if (isDbInitialized) return;
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            password_hash TEXT,
            avatar_url TEXT,
            provider VARCHAR(50) DEFAULT 'local',
            is_verified BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE`;

    await sql`
        CREATE TABLE IF NOT EXISTS auth_otps (
            email VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255),
            password_hash TEXT,
            otp_code VARCHAR(10) NOT NULL,
            purpose VARCHAR(30) NOT NULL,
            expires_at TIMESTAMP NOT NULL
        )
    `;
    isDbInitialized = true;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

function generateOTP() {
    return String(crypto.randomInt(100000, 999999));
}

// ৩A. সাইন-আপ ধাপ ১: ইউনিক নাম চেক ও ইমেইলে ৬-ডিজিটের OTP পাঠানো
app.post('/api/auth/register-request', async (req, res) => {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Username, Email, and Passkey are required.' });
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
        return res.status(400).json({ success: false, error: 'Username must be 3-30 characters (letters, numbers, _ or -).' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Passkey must be at least 6 characters long.' });
    }
    if (ADMIN_USER && username.toLowerCase() === ADMIN_USER.toLowerCase()) {
        return res.status(409).json({ success: false, error: 'This username is reserved. Please choose a different name.' });
    }

    try {
        await ensureUsersTable();

        // একই ইউজারনেম বা ইমেইল আগে থেকে আছে কি না তা কঠোরভাবে চেক করা হচ্ছে
        const existingUser = await sql`
            SELECT username, email FROM users 
            WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${email})
            LIMIT 1
        `;
        if (existingUser.length > 0) {
            if (existingUser[0].username && existingUser[0].username.toLowerCase() === username.toLowerCase()) {
                return res.status(409).json({ success: false, error: 'Username "' + username + '" is already taken! Please choose another name.' });
            }
            return res.status(409).json({ success: false, error: 'This email address is already registered.' });
        }

        const otp = generateOTP();
        const passHash = hashPassword(password);

        await sql`
            INSERT INTO auth_otps (email, username, password_hash, otp_code, purpose, expires_at)
            VALUES (${email}, ${username}, ${passHash}, ${otp}, 'register', NOW() + INTERVAL '10 minutes')
            ON CONFLICT (email) DO UPDATE
            SET username = EXCLUDED.username,
                password_hash = EXCLUDED.password_hash,
                otp_code = EXCLUDED.otp_code,
                purpose = 'register',
                expires_at = NOW() + INTERVAL '10 minutes'
        `;

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: email,
            subject: `[TriScout] Email Verification Code: ${otp}`,
            text: `Hello Operator ${username},\n\nYour TriScout v2.4 TAC-OPS verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`
        });

        res.json({ success: true, message: 'Verification code sent to ' + email });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send verification email. Check SMTP settings.' });
    }
});

// ৩B. সাইন-আপ ধাপ ২: ইমেইল OTP মিলিয়ে দেখা এবং অ্যাকাউন্ট তৈরি করা
app.post('/api/auth/register-verify', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit verification code are required.' });
    }

    try {
        await ensureUsersTable();
        const records = await sql`
            SELECT * FROM auth_otps 
            WHERE LOWER(email) = LOWER(${email}) AND purpose = 'register' AND expires_at > NOW()
            LIMIT 1
        `;

        if (records.length === 0 || records[0].otp_code !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired verification code.' });
        }

        const pending = records[0];

        const nameTaken = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${pending.username}) LIMIT 1`;
        if (nameTaken.length > 0) {
            return res.status(409).json({ success: false, error: 'Username was just taken. Please register with a new username.' });
        }

        await sql`
            INSERT INTO users (username, email, password_hash, provider, is_verified, last_login)
            VALUES (${pending.username}, ${pending.email}, ${pending.password_hash}, 'registered', TRUE, NOW())
        `;
        await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;

        const token = jwt.sign({ user: pending.username, email: pending.email, provider: 'registered' }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Could not complete registration.' });
    }
});

// ৪. লগইন API (লোকাল অ্যাডমিন এবং রেজিস্টার্ড ইউজার উভয়ের জন্য)
app.post('/api/auth/login', async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h' });
        return res.json({ success: true, token });
    }

    try {
        await ensureUsersTable();
        const rows = await sql`
            SELECT username, email, password_hash, avatar_url, provider
            FROM users
            WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${username})
            LIMIT 1
        `;
        if (rows.length === 0 || !rows[0].password_hash) {
            return res.status(401).json({ success: false, error: 'Account not found or uses GitHub OAuth.' });
        }

        const userRecord = rows[0];
        if (!verifyPassword(password, userRecord.password_hash)) {
            return res.status(401).json({ success: false, error: 'ACCESS DENIED: Incorrect passkey.' });
        }

        await sql`UPDATE users SET last_login = NOW() WHERE username = ${userRecord.username}`;
        const token = jwt.sign(
            { user: userRecord.username, email: userRecord.email, avatar: userRecord.avatar_url, provider: userRecord.provider || 'registered' },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        return res.json({ success: true, token });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Authentication service unavailable.' });
    }
});

// ৫A. ফরগট পাসওয়ার্ড ধাপ ১: ইমেইলে রিসেট কোড পাঠানো
app.post('/api/auth/forgot-password', async (req, res) => {
    const identifier = (req.body.identifier || '').trim();
    if (!identifier) {
        return res.status(400).json({ success: false, error: 'Please enter your registered Email or Username.' });
    }

    try {
        await ensureUsersTable();
        const rows = await sql`
            SELECT username, email, provider FROM users
            WHERE LOWER(email) = LOWER(${identifier}) OR LOWER(username) = LOWER(${identifier})
            LIMIT 1
        `;
        if (rows.length === 0 || !rows[0].email) {
            return res.status(404).json({ success: false, error: 'No registered email found for that account.' });
        }

        const user = rows[0];
        const otp = generateOTP();

        await sql`
            INSERT INTO auth_otps (email, username, otp_code, purpose, expires_at)
            VALUES (${user.email}, ${user.username}, ${otp}, 'reset', NOW() + INTERVAL '10 minutes')
            ON CONFLICT (email) DO UPDATE
            SET otp_code = EXCLUDED.otp_code,
                purpose = 'reset',
                expires_at = NOW() + INTERVAL '10 minutes'
        `;

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: user.email,
            subject: `[TriScout] Password Reset Code: ${otp}`,
            text: `Hello Operator ${user.username},\n\nYour password reset verification code is: ${otp}\n\nThis code expires in 10 minutes.`
        });

        res.json({ success: true, email: user.email, message: 'Password reset code sent to your email.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send reset email.' });
    }
});

// ৫B. ফরগট পাসওয়ার্ড ধাপ ২: কোড ভেরিফাই করে নতুন পাসওয়ার্ড সেভ করা
app.post('/api/auth/reset-password', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();
    const newPassword = req.body.newPassword || '';

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New passkey must be at least 6 characters.' });
    }

    try {
        await ensureUsersTable();
        const records = await sql`
            SELECT * FROM auth_otps
            WHERE LOWER(email) = LOWER(${email}) AND purpose = 'reset' AND expires_at > NOW()
            LIMIT 1
        `;
        if (records.length === 0 || records[0].otp_code !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset code.' });
        }

        const newHash = hashPassword(newPassword);
        await sql`UPDATE users SET password_hash = ${newHash} WHERE LOWER(email) = LOWER(${email})`;
        await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;

        res.json({ success: true, message: 'Passkey updated successfully! You can now sign in.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
});

// ফলব্যাক ফর্ম লগইন
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h' });
        return res.send(`<script>localStorage.setItem('token', '${token}'); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    }
    res.send(`<script>alert("ACCESS DENIED: Invalid credentials."); window.location.href="/";</script>`);
});

// ৬. ড্যাশবোর্ড HTML সার্ভ করা (ক্যাশ বন্ধ করে সরাসরি নতুন ফাইল রিড করা হচ্ছে)
const dashboardHtmlPath = path.join(__dirname, 'views', 'index.html');

app.get(['/dashboard', '/reports', '/cli', '/about', '/project', '/profile'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const html = fs.readFileSync(dashboardHtmlPath, 'utf8');
    res.status(200).send(html);
});

// ৭. প্যাসিভ সিকিউরিটি স্ক্যানার ইঞ্জিন
const scanCache = new Map();
const CACHE_TTL = 60 * 1000;
const MAX_CACHE_SIZE = 1000;

const isPrivateIp = (ipStr) => {
    if (ipStr === '::1' || ipStr === '0.0.0.0' || ipStr === '::' || ipStr.startsWith('127.') || ipStr.startsWith('10.') || ipStr.startsWith('192.168.') || ipStr.startsWith('169.254.')) return true;
    if (ipStr.startsWith('172.')) {
        const secondOctet = parseInt(ipStr.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    const ipv6 = ipStr.toLowerCase();
    return ipv6.startsWith('fc') || ipv6.startsWith('fd') || ipv6.startsWith('fe8');
};

const secretRegex = /(?:AIza[0-9A-Za-z\-_]{35}|sk-(?:proj-)?[a-zA-Z0-9\-_]{32,}|gh[pousr]_[A-Za-z0-9_]{36,255}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9a-zA-Z\-]{10,48}|sk_live_[0-9a-zA-Z]{24,}|-----BEGIN (?:RSA|OPENSSH|EC|PGP) PRIVATE KEY-----)/;

app.post('/api/scan-headers', requireHTTPAuth, async (req, res) => {
    let { target } = req.body;
    if (!target) return res.status(400).json({ success: false, error: 'Target URL is required' });
    if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;

    try {
        const parsedUrl = new URL(target);
        const hostname = parsedUrl.hostname;
        const lookupResult = await require('dns').promises.lookup(hostname);
        const ip = lookupResult.address;

        if (isPrivateIp(ip)) {
            return res.status(403).json({ success: false, error: 'Ethical Guardrail: Scanning internal or private network resources is strictly prohibited.' });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format or host resolution failed' });
    }

    if (scanCache.has(target)) {
        const cached = scanCache.get(target);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ success: true, report: cached.report, score: cached.score, checks: cached.checks, _bolt_cached: true });
        } else {
            scanCache.delete(target);
        }
    }

    try {
        const response = await axios.get(target, {
            timeout: 10000,
            validateStatus: () => true,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            headers: {
                'User-Agent': 'TriScout-Ethical-Passive-Scanner/2.4 (+https://triscout.quarry.dpdns.org)'
            }
        });
        const headers = response.headers;
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        let report = `--- ETHICAL PASSIVE SECURITY ANALYSIS FOR: ${target} ---\n\n`;
        let score = 100;
        const checks = [];

        if (htmlBody.includes('Stack trace:') || htmlBody.includes('SyntaxError:') || htmlBody.includes('SQL syntax')) {
            report += `[!] Error Handling: CRITICAL (Stack trace exposed!)\n`;
            score -= 20;
            checks.push({ name: 'Error Handling', status: 'CRITICAL', category: 'Source Leak', impact: '-20 pts', detail: 'Stack traces or SQL errors exposed in response body.' });
        } else {
            report += `[+] Error Handling: SECURE\n`;
            checks.push({ name: 'Error Handling', status: 'SECURE', category: 'Source Leak', impact: '0 pts', detail: 'No raw stack traces or database errors leaked.' });
        }

        if (htmlBody.includes('api_key') || secretRegex.test(htmlBody)) {
            report += `[!] Secrets Exposure: CRITICAL (Possible API Keys found)\n`;
            score -= 25;
            checks.push({ name: 'Secrets Exposure', status: 'CRITICAL', category: 'Credentials', impact: '-25 pts', detail: 'Potential API keys or secret tokens detected in HTML source.' });
        } else {
            report += `[+] Secrets Exposure: SECURE\n`;
            checks.push({ name: 'Secrets Exposure', status: 'SECURE', category: 'Credentials', impact: '0 pts', detail: 'No exposed API keys or secret tokens found in page source.' });
        }

        if (headers['x-ratelimit-limit'] || headers['retry-after'] || headers['ratelimit-limit']) {
            report += `[+] Rate Limiting: SECURE\n`;
            checks.push({ name: 'Rate Limiting', status: 'SECURE', category: 'Traffic', impact: '0 pts', detail: 'Rate-limiting headers are actively enforced.' });
        } else {
            report += `[-] Rate Limiting: NOTICE (No public rate-limit header)\n`;
            score -= 5;
            checks.push({ name: 'Rate Limiting', status: 'NOTICE', category: 'Traffic', impact: '-5 pts', detail: 'No explicit rate-limit headers exposed (may be handled by WAF).' });
        }

        if (headers['x-powered-by']) {
            report += `[!] Dependencies: WARNING (Tech Stack Exposed: ${headers['x-powered-by']})\n`;
            score -= 10;
            checks.push({ name: 'Tech Stack Hide', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: `Server exposes X-Powered-By (${headers['x-powered-by']}).` });
        } else if (htmlBody.includes('<meta name="generator" content="WordPress')) {
            report += `[!] Dependencies: WARNING (WordPress version exposed)\n`;
            score -= 10;
            checks.push({ name: 'Tech Stack Hide', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: 'CMS generator version meta tag is publicly visible.' });
        } else {
            report += `[+] Dependencies: SECURE\n`;
            checks.push({ name: 'Tech Stack Hide', status: 'SECURE', category: 'Fingerprinting', impact: '0 pts', detail: 'X-Powered-By and generator tags are properly hidden.' });
        }

        report += `\n--- DEFENSIVE HTTP SECURITY HEADERS ---\n`;

        if (headers['strict-transport-security']) {
            report += `[+] HSTS (Strict-Transport-Security): SECURE\n`;
            checks.push({ name: 'HSTS Policy', status: 'SECURE', category: 'SSL/TLS', impact: '0 pts', detail: 'Enforces encrypted HTTPS connections against downgrade attacks.' });
        } else {
            report += `[!] HSTS (Strict-Transport-Security): MISSING\n`;
            score -= 10;
            checks.push({ name: 'HSTS Policy', status: 'MISSING', category: 'SSL/TLS', impact: '-10 pts', detail: 'Missing Strict-Transport-Security header.' });
        }

        if (headers['content-security-policy']) {
            report += `[+] CSP (Content-Security-Policy): SECURE\n`;
            checks.push({ name: 'CSP Header', status: 'SECURE', category: 'XSS Defense', impact: '0 pts', detail: 'Content-Security-Policy is active to mitigate XSS injection.' });
        } else {
            report += `[!] CSP (Content-Security-Policy): MISSING\n`;
            score -= 10;
            checks.push({ name: 'CSP Header', status: 'MISSING', category: 'XSS Defense', impact: '-10 pts', detail: 'No Content-Security-Policy defined against script injection.' });
        }

        if (headers['x-frame-options']) {
            report += `[+] X-Frame-Options: SECURE\n`;
            checks.push({ name: 'X-Frame-Options', status: 'SECURE', category: 'Clickjacking', impact: '0 pts', detail: `Protected against iframe clickjacking (${headers['x-frame-options']}).` });
        } else {
            report += `[!] X-Frame-Options: MISSING\n`;
            score -= 10;
            checks.push({ name: 'X-Frame-Options', status: 'MISSING', category: 'Clickjacking', impact: '-10 pts', detail: 'Site can be embedded in unauthorized external iframes.' });
        }

        if (headers['x-content-type-options']) {
            report += `[+] X-Content-Type-Options: SECURE\n`;
            checks.push({ name: 'MIME Sniffing', status: 'SECURE', category: 'Headers', impact: '0 pts', detail: 'Prevents browser MIME-type sniffing (nosniff).' });
        } else {
            report += `[!] X-Content-Type-Options: MISSING\n`;
            score -= 10;
            checks.push({ name: 'MIME Sniffing', status: 'MISSING', category: 'Headers', impact: '-10 pts', detail: 'Missing X-Content-Type-Options: nosniff header.' });
        }

        if (score < 0) score = 0;
        report += `\nOVERALL SECURITY SCORE: ${score}/100`;

        if (scanCache.size >= MAX_CACHE_SIZE) scanCache.clear();
        scanCache.set(target, { report, score, checks, timestamp: Date.now() });

        res.json({ success: true, report, score, checks });
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Target unreachable.' }); 
    }
});

app.post('/api/send-report', requireHTTPAuth, async (req, res) => {
    const { target, reportData, emailTo } = req.body;
    if(!target || !reportData || !emailTo) return res.status(400).json({ success: false, error: "Missing information." });

    try {
        const mailOptions = {
            from: getEnv('GMAIL_USER'),
            to: emailTo,
            subject: `[ALERT] TriScout Security Assessment: ${target}`,
            text: `TriScout Defensive Cyber Security System\n\nTarget Analyzed: ${target}\n\n${reportData}\n\n--------------------\nConfidential Report Generated by TriScout.`
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Internal Email Service Error.' }); 
    }
});

app.get('/api/auth/github', (req, res) => {
    const redirectUri = `https://${req.headers.host}/api/auth/github/callback`;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user`);
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
        
        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'TriScout-App' }
        });
        const userData = await userResponse.json();

        try {
            await ensureUsersTable();
            await sql`
                INSERT INTO users (username, avatar_url, provider, is_verified, last_login)
                VALUES (${userData.login}, ${userData.avatar_url}, 'github', TRUE, NOW())
                ON CONFLICT (username) DO UPDATE 
                SET avatar_url = EXCLUDED.avatar_url, last_login = NOW()
            `;
        } catch (dbError) {
            console.error("[-] Neon Database save failed.");
        }

        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url, provider: 'github' }, JWT_SECRET, { expiresIn: '2h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    } catch (error) { 
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>'); 
    }
});

app.post('/api/account/delete', requireHTTPAuth, async (req, res) => {
    try {
        const username = req.user.user;
        await sql`DELETE FROM users WHERE username = ${username}`;
        res.json({ success: true, message: "Your account and personal data have been permanently deleted from our database." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to delete account data." });
    }
});

app.get('/sitemap.xml', (req, res) => {
    const domain = 'https://triscout.quarry.dpdns.org'; 
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
    <url><loc>${domain}/about</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
    <url><loc>${domain}/cli</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
    <url><loc>${domain}/project</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
    <url><loc>${domain}/dashboard</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
    <url><loc>${domain}/reports</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
});

app.get('/robots.txt', (req, res) => {
    const domain = 'https://triscout.quarry.dpdns.org';
    const robots = `User-agent: *\nAllow: /\nDisallow: /profile\nDisallow: /api/\n\nSitemap: ${domain}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

module.exports = app;
