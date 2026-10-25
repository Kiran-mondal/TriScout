const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
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
app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1d' }));

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/logo.svg'));
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: getEnv('GMAIL_USER'), pass: getEnv('GMAIL_PASS') }
}); 

app.get('/login', (req, res) => {
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } else {
        res.send(`<script>alert("ACCESS DENIED: Invalid credentials."); window.location.href="/";</script>`);
    }
});

// সমস্ত ড্যাশবোর্ড এবং সাব-পেজ রাউট এখন সরাসরি খাঁটি HTML ফাইল (views/index.html) সার্ভ করবে
const dashboardHtmlPath = path.join(__dirname, 'views', 'index.html');

app.get(['/dashboard', '/reports', '/cli', '/about', '/project', '/profile'], (req, res) => {
    res.sendFile(dashboardHtmlPath);
});

// উন্নত প্যাসিভ স্ক্যানার API (Protected + SSRF Guard + Structured Checks)
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
const secretRegex = /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{48}|[A-Za-z0-9_]{40,})/;

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

let isDbInitialized = false;

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
            if (!isDbInitialized) {
                await sql`
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(255) UNIQUE NOT NULL,
                        avatar_url TEXT,
                        provider VARCHAR(50),
                        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `;
                isDbInitialized = true;
            }
            await sql`
                INSERT INTO users (username, avatar_url, provider, last_login)
                VALUES (${userData.login}, ${userData.avatar_url}, 'github', NOW())
                ON CONFLICT (username) DO UPDATE 
                SET avatar_url = EXCLUDED.avatar_url, last_login = NOW()
            `;
        } catch (dbError) {
            console.error("[-] Neon Database save failed.");
        }

        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url, provider: 'github' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
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
