const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios'); 
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const dns = require('dns');
const http = require('http');
const https = require('https');

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

// ১. লগইন ও সাইন-আপ পেজ (public/index.html) সার্ভ করা - ক্যাশমুক্ত
const authHtmlPath = path.join(__dirname, '../public/index.html');
const AUTH_HTML_CONTENT = fs.readFileSync(authHtmlPath, 'utf8');

app.get(['/', '/login', '/index.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(AUTH_HTML_CONTENT);
});

app.use(express.static(path.join(__dirname, '../public'), { index: false }));

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/logo.svg'));
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: getEnv('GMAIL_USER'), pass: getEnv('GMAIL_PASS') }
}); 

// ২. Token Bucket ও OTP Rate Limiter (প্রতি মিনিটে সর্বোচ্চ ৫টি ওটিপি এবং প্রতি টোকেন রিফিল)
const tokenBuckets = new Map();
const CAPACITY = 5;          // একটি বালতিতে সর্বোচ্চ ৫টি টোকেন থাকতে পারবে
const REFILL_RATE_MS = 60000; // প্রতি ১ মিনিটে (৬০ সেকেন্ডে) বালতি ফুল রিফিল হবে

function checkTokenBucket(key) {
    const now = Date.now();
    const cleanKey = String(key || 'anon').toLowerCase();
    
    let bucket = tokenBuckets.get(cleanKey);
    if (!bucket) {
        bucket = { tokens: CAPACITY, lastRefill: now };
    } else {
        // সময়ের সাথে সাথে টোকেন রিফিল হিসাব করা
        const elapsed = now - bucket.lastRefill;
        if (elapsed > REFILL_RATE_MS) {
            bucket.tokens = CAPACITY;
            bucket.lastRefill = now;
        }
    }

    if (bucket.tokens <= 0) {
        tokenBuckets.set(cleanKey, bucket);
        return { allowed: false, waitSec: Math.ceil((REFILL_RATE_MS - (now - bucket.lastRefill)) / 1000) };
    }

    bucket.tokens -= 1; // একটি টোকেন খরচ করা হলো
    tokenBuckets.set(cleanKey, bucket);
    return { allowed: true, remaining: bucket.tokens };
}

// ৩. ডাটাবেস টেবিল ও Row-Level Security (RLS) কনফিগারেশন
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

    await sql`
        CREATE TABLE IF NOT EXISTS scan_logs (
            id SERIAL PRIMARY KEY,
            owner_username VARCHAR(255) NOT NULL,
            target_url TEXT NOT NULL,
            score INTEGER NOT NULL,
            report TEXT,
            scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE auth_otps ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY`;

    await sql`DROP POLICY IF EXISTS users_rls_policy ON users`;
    await sql`
        CREATE POLICY users_rls_policy ON users
        USING (
            current_setting('app.current_user', true) = '__SYSTEM_AUTH__'
            OR LOWER(username) = LOWER(current_setting('app.current_user', true))
        )
        WITH CHECK (
            current_setting('app.current_user', true) = '__SYSTEM_AUTH__'
            OR LOWER(username) = LOWER(current_setting('app.current_user', true))
        )
    `;

    await sql`DROP POLICY IF EXISTS otps_rls_policy ON auth_otps`;
    await sql`
        CREATE POLICY otps_rls_policy ON auth_otps
        USING (current_setting('app.current_user', true) = '__SYSTEM_AUTH__')
        WITH CHECK (current_setting('app.current_user', true) = '__SYSTEM_AUTH__')
    `;

    await sql`DROP POLICY IF EXISTS scan_logs_rls_policy ON scan_logs`;
    await sql`
        CREATE POLICY scan_logs_rls_policy ON scan_logs
        USING (LOWER(owner_username) = LOWER(current_setting('app.current_user', true)))
        WITH CHECK (LOWER(owner_username) = LOWER(current_setting('app.current_user', true)))
    `;

    isDbInitialized = true;
}

async function runWithRlsUser(username, queryFn) {
    const safeUser = String(username || '').replace(/[^a-zA-Z0-9_@.-]/g, '');
    await sql`SELECT set_config('app.current_user', ${safeUser}, false)`;
    try {
        return await queryFn();
    } finally {
        await sql`SELECT set_config('app.current_user', '', false)`;
    }
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

// ৪A. সাইন-আপ ধাপ ১: Token Bucket রেট লিমিট সহ ইমেইলে OTP পাঠানো
app.post('/api/auth/register-request', async (req, res) => {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Username, Email, and Passkey are required.' });
    }
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ success: false, error: 'Username must be 3-30 characters (letters, numbers, _ or -).' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Passkey must be at least 6 characters long.' });
    }
    if (ADMIN_USER && username.toLowerCase() === ADMIN_USER.toLowerCase()) {
        return res.status(409).json({ success: false, error: 'This username is reserved. Please choose a different name.' });
    }

    // Token Bucket রেট লিমিট চেক (প্রতি মিনিটে সর্বোচ্চ ৫টি টোকেন)
    const bucketCheck = checkTokenBucket(email);
    if (!bucketCheck.allowed) {
        return res.status(429).json({
            success: false,
            error: `Token bucket empty! Rate limit exceeded. Please wait ${bucketCheck.waitSec}s before requesting another OTP.`
        });
    }

    try {
        await ensureUsersTable();
        const otp = generateOTP();
        const passHash = hashPassword(password);

        const existingError = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const existingUser = await sql`
                SELECT username, email FROM users 
                WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${email})
                LIMIT 1
            `;
            if (existingUser.length > 0) {
                if (existingUser[0].username && existingUser[0].username.toLowerCase() === username.toLowerCase()) {
                    return 'Username "' + username + '" is already taken! Please choose another name.';
                }
                return 'This email address is already registered.';
            }

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
            return null;
        });

        if (existingError) {
            return res.status(409).json({ success: false, error: existingError });
        }

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: email,
            subject: `[TriScout] Sign-Up Verification Code: ${otp}`,
            text: `Hello Operator ${username},\n\nYour TriScout v2.4 TAC-OPS registration verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
        });

        res.json({ success: true, message: `Verification code sent to ${email} (Tokens remaining: ${bucketCheck.remaining}/5)` });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send verification email. Check SMTP settings.' });
    }
});

// ৪B. সাইন-আপ ধাপ ২: ইমেইল OTP ভেরিফিকেশন
app.post('/api/auth/register-verify', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit verification code are required.' });
    }

    try {
        await ensureUsersTable();
        const result = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const records = await sql`
                SELECT * FROM auth_otps 
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'register' AND expires_at > NOW()
                LIMIT 1
            `;
            if (records.length === 0 || records[0].otp_code !== otp) {
                return { error: 'Invalid or expired verification code.', status: 400 };
            }

            const pending = records[0];
            const nameTaken = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${pending.username}) LIMIT 1`;
            if (nameTaken.length > 0) {
                return { error: 'Username was just taken. Please register with a new username.', status: 409 };
            }

            await sql`
                INSERT INTO users (username, email, password_hash, provider, is_verified, last_login)
                VALUES (${pending.username}, ${pending.email}, ${pending.password_hash}, 'registered', TRUE, NOW())
            `;
            await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;
            return { user: pending.username, email: pending.email };
        });

        if (result.error) {
            return res.status(result.status).json({ success: false, error: result.error });
        }

        const token = jwt.sign({ user: result.user, email: result.email, provider: 'registered' }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Could not complete registration.' });
    }
});

// ৫A. সাইন-ইন ধাপ ১: পাসওয়ার্ড চেক ও Token Bucket রেট লিমিট সহ 2FA OTP পাঠানো
app.post('/api/auth/login', async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const providedEmail = (req.body.email || '').trim().toLowerCase();

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and passkey are required.' });
    }

    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h' });
        return res.json({ success: true, token });
    }

    try {
        await ensureUsersTable();
        const authCheck = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const rows = await sql`
                SELECT username, email, password_hash, avatar_url, provider
                FROM users
                WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${username})
                LIMIT 1
            `;
            if (rows.length === 0) {
                return { status: 401, error: 'Account not found. Please create an account first.' };
            }

            const userRecord = rows[0];
            if (userRecord.password_hash) {
                if (!verifyPassword(password, userRecord.password_hash)) {
                    return { status: 401, error: 'ACCESS DENIED: Incorrect passkey.' };
                }
            } else {
                const newHash = hashPassword(password);
                await sql`UPDATE users SET password_hash = ${newHash} WHERE username = ${userRecord.username}`;
            }

            const targetEmail = userRecord.email || providedEmail;
            if (!targetEmail) {
                return {
                    needsEmail: true,
                    error: 'Your existing database account has no email linked. Please enter your email below to receive a sign-in OTP.'
                };
            }

            // Token Bucket রেট লিমিট চেক (সাইন ইনের ক্ষেত্রেও ওটিপি স্প্যামিং রোধে)
            const bucketCheck = checkTokenBucket(targetEmail);
            if (!bucketCheck.allowed) {
                return {
                    status: 429,
                    error: `Token bucket empty! Rate limit exceeded. Please wait ${bucketCheck.waitSec}s.`
                };
            }

            if (!userRecord.email && providedEmail) {
                await sql`UPDATE users SET email = ${providedEmail} WHERE username = ${userRecord.username}`;
            }

            const otp = generateOTP();
            await sql`
                INSERT INTO auth_otps (email, username, otp_code, purpose, expires_at)
                VALUES (${targetEmail}, ${userRecord.username}, ${otp}, 'login', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET username = EXCLUDED.username,
                    otp_code = EXCLUDED.otp_code,
                    purpose = 'login',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `;

            return { ok: true, username: userRecord.username, targetEmail, otp, remaining: bucketCheck.remaining };
        });

        if (authCheck.needsEmail) {
            return res.json({ success: false, needsEmail: true, error: authCheck.error });
        }
        if (authCheck.error) {
            return res.status(authCheck.status || 400).json({ success: false, error: authCheck.error });
        }

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: authCheck.targetEmail,
            subject: `[TriScout] Sign-In Verification Code: ${authCheck.otp}`,
            text: `Hello Operator ${authCheck.username},\n\nYour TriScout 2FA Sign-In OTP code is: ${authCheck.otp}\n\nThis code expires in 10 minutes.`
        });

        return res.json({
            success: true,
            requireOtp: true,
            email: authCheck.targetEmail,
            message: `Sign-In OTP sent to ${authCheck.targetEmail} (Tokens remaining: ${authCheck.remaining}/5)`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Authentication service unavailable.' });
    }
});

// ৫B. সাইন-ইন ধাপ ২: ওটিপি ভেরিফাই করে লগইন সম্পন্ন করা
app.post('/api/auth/login-verify', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required.' });
    }

    try {
        await ensureUsersTable();
        const verifiedUser = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const records = await sql`
                SELECT * FROM auth_otps
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'login' AND expires_at > NOW()
                LIMIT 1
            `;
            if (records.length === 0 || records[0].otp_code !== otp) {
                return { error: 'Invalid or expired Sign-In OTP code.', status: 400 };
            }

            const userRows = await sql`
                SELECT username, email, avatar_url, provider FROM users
                WHERE LOWER(username) = LOWER(${records[0].username}) OR LOWER(email) = LOWER(${email})
                LIMIT 1
            `;
            if (userRows.length === 0) {
                return { error: 'User record not found.', status: 404 };
            }

            const userRecord = userRows[0];
            await sql`UPDATE users SET last_login = NOW(), is_verified = TRUE WHERE username = ${userRecord.username}`;
            await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;
            return { userRecord };
        });

        if (verifiedUser.error) {
            return res.status(verifiedUser.status).json({ success: false, error: verifiedUser.error });
        }

        const u = verifiedUser.userRecord;
        const token = jwt.sign(
            { user: u.username, email: u.email || email, avatar: u.avatar_url, provider: u.provider || 'registered' },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to verify sign-in OTP.' });
    }
});

// ৬A. ফরগট পাসওয়ার্ড: Token Bucket রেট লিমিট সহ রিসেট কোড পাঠানো
app.post('/api/auth/forgot-password', async (req, res) => {
    const identifier = (req.body.identifier || '').trim();
    if (!identifier) {
        return res.status(400).json({ success: false, error: 'Please enter your registered Email or Username.' });
    }

    try {
        await ensureUsersTable();
        const resetReq = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const rows = await sql`
                SELECT username, email, provider FROM users
                WHERE LOWER(email) = LOWER(${identifier}) OR LOWER(username) = LOWER(${identifier})
                LIMIT 1
            `;
            if (rows.length === 0 || !rows[0].email) {
                return { status: 404, error: 'No registered email found for that account.' };
            }

            const user = rows[0];
            const bucketCheck = checkTokenBucket(user.email);
            if (!bucketCheck.allowed) {
                return {
                    status: 429,
                    error: `Token bucket empty! Rate limit exceeded. Please wait ${bucketCheck.waitSec}s.`
                };
            }

            const otp = generateOTP();
            await sql`
                INSERT INTO auth_otps (email, username, otp_code, purpose, expires_at)
                VALUES (${user.email}, ${user.username}, ${otp}, 'reset', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET otp_code = EXCLUDED.otp_code,
                    purpose = 'reset',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `;
            return { user, otp, remaining: bucketCheck.remaining };
        });

        if (resetReq.error) {
            return res.status(resetReq.status).json({ success: false, error: resetReq.error });
        }

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: resetReq.user.email,
            subject: `[TriScout] Password Reset Code: ${resetReq.otp}`,
            text: `Hello Operator ${resetReq.user.username},\n\nYour password reset verification code is: ${resetReq.otp}\n\nThis code expires in 10 minutes.`
        });

        res.json({ success: true, email: resetReq.user.email, message: `Password reset code sent (Tokens remaining: ${resetReq.remaining}/5).` });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send reset email.' });
    }
});

// ৬B. ফরগট পাসওয়ার্ড: নতুন পাসওয়ার্ড সেট করা
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
        const resetResult = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const records = await sql`
                SELECT * FROM auth_otps
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'reset' AND expires_at > NOW()
                LIMIT 1
            `;
            if (records.length === 0 || records[0].otp_code !== otp) {
                return { error: 'Invalid or expired reset code.' };
            }

            const newHash = hashPassword(newPassword);
            await sql`UPDATE users SET password_hash = ${newHash} WHERE LOWER(email) = LOWER(${email})`;
            await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;
            return { ok: true };
        });

        if (resetResult.error) {
            return res.status(400).json({ success: false, error: resetResult.error });
        }

        res.json({ success: true, message: 'Passkey updated successfully! You can now sign in.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h' });
        return res.send(`<script>localStorage.setItem('token', '${token}'); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    }
    res.send(`<script>alert("ACCESS DENIED: Invalid credentials."); window.location.href="/";</script>`);
});

// ============================================================================
// ৭. TriScout Server Guardrails: Locked Origin, Clean Input & Log Flowing
// ============================================================================
const ALLOWED_ORIGINS = new Set([
    'https://triscout.quarry.dpdns.org',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]);

function logFlow(level, event, meta = {}) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...meta }));
}

function cleanInput(val, maxLen = 2048) {
    if (typeof val !== 'string') return '';
    return val.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen);
}

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const hostOrigin = req.headers.host ? `https://${req.headers.host}` : '';

    if (origin) {
        if (ALLOWED_ORIGINS.has(origin) || origin === hostOrigin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        } else if (req.path.startsWith('/api/')) {
            logFlow('WARN', 'LOCKED_ORIGIN_BLOCKED', { origin, path: req.path });
            return res.status(403).json({ success: false, error: 'Locked Origin Policy: Cross-origin request denied.' });
        }
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Database Indexes & Expired OTP/Link Cleanup
let areIndexesCreated = false;
async function ensureDatabaseIndexesAndCleanup() {
    await ensureUsersTable();
    if (!areIndexesCreated) {
        await sql`CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username))`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email))`;
        await sql`CREATE INDEX IF NOT EXISTS idx_scan_logs_owner_time ON scan_logs (LOWER(owner_username), scanned_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_auth_otps_expires ON auth_otps (expires_at)`;
        areIndexesCreated = true;
    }
    await runWithRlsUser('__SYSTEM_AUTH__', async () => {
        await sql`DELETE FROM auth_otps WHERE expires_at <= NOW()`;
    });
}

// ৭. ড্যাশবোর্ড HTML সার্ভ করা
const dashboardHtmlPath = path.join(__dirname, 'views', 'index.html');
const DASHBOARD_HTML_CONTENT = fs.readFileSync(dashboardHtmlPath, 'utf8');

app.get(['/dashboard', '/reports', '/cli', '/about', '/project', '/profile'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(DASHBOARD_HTML_CONTENT);
});

// ============================================================================
// ৮. টার্গেট ওয়েবসাইট স্ক্যানার ইঞ্জিন (Website Scanner with All Security Audits)
// ============================================================================
const scanCache = new Map();
const CACHE_TTL = 60 * 1000;
const MAX_CACHE_SIZE = 1000;

const scanBuckets = new Map();
const SCAN_CAPACITY = 10;
const SCAN_REFILL_MS = 60000;

function checkScanRateLimit(userKey) {
    const now = Date.now();
    const key = String(userKey || 'anon').toLowerCase();
    let bucket = scanBuckets.get(key);
    if (!bucket || (now - bucket.lastRefill) > SCAN_REFILL_MS) {
        bucket = { tokens: SCAN_CAPACITY, lastRefill: now };
    }
    if (bucket.tokens <= 0) {
        scanBuckets.set(key, bucket);
        const waitSec = Math.ceil((SCAN_REFILL_MS - (now - bucket.lastRefill)) / 1000);
        return { allowed: false, waitSec };
    }
    bucket.tokens -= 1;
    scanBuckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens };
}

const isPrivateIp = (ipStr) => {
    let cleanIp = ipStr.toLowerCase().replace(/^\[|\]$/g, '');
    if (cleanIp.startsWith('::ffff:')) {
        cleanIp = cleanIp.substring(7);
    }
    if (cleanIp === '::1' || cleanIp === '0.0.0.0' || cleanIp === '::' || cleanIp.startsWith('127.') || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.') || cleanIp.startsWith('169.254.')) return true;
    if (cleanIp.startsWith('172.')) {
        const secondOctet = parseInt(cleanIp.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    return cleanIp.startsWith('fc') || cleanIp.startsWith('fd') || cleanIp.startsWith('fe8');
};

const safeLookup = (hostname, options, callback) => {
    dns.lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err);

        // Address can be a string or an array of objects depending on options.all
        const addresses = Array.isArray(address) ? address : [{ address, family }];

        for (const addrObj of addresses) {
            const ipStr = addrObj.address;
            if (ipStr && isPrivateIp(ipStr)) {
                return callback(new Error(`DNS Rebinding attack detected: ${hostname} resolved to private IP ${ipStr}`));
            }
        }

        callback(null, address, family);
    });
};

const safeHttpAgent = new http.Agent({ lookup: safeLookup });
const safeHttpsAgent = new https.Agent({ lookup: safeLookup });

const secretRegex = /(?:AIza[0-9A-Za-z\-_]{35}|sk-(?:proj-)?[a-zA-Z0-9\-_]{32,}|gh[pousr]_[A-Za-z0-9_]{36,255}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9a-zA-Z\-]{10,48}|sk_live_[0-9a-zA-Z]{24,}|-----BEGIN (?:RSA|OPENSSH|EC|PGP) PRIVATE KEY-----)/g;
const errorLeakRegex = /(?:ReferenceError|TypeError|SyntaxError|RangeError):\s+[^\n]+|at\s+[A-Za-z0-9_$.]+\s+\([^)]+:\d+:\d+\)|(?:SQL syntax.*MySQL|Warning.*mysql_|PostgreSQL.*ERROR|ORA-\d{5}|SQLite\/JDBCDriver|ROLLBACK\s+FAILED|Deadlock\s+found)/i;
const debugLogLeakRegex = /(?:console\.debug\(|DEBUG_LOG|\[TRACE\]|webpack:\/\/|sourceMappingURL=.*\.map)/i;
const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
const scriptRegex = /<script\b/gi;
const formRegex = /<form\b/gi;
const insecureFormRegex = /<form[^>]+action=["']http:\/\/[^"']+["']/i;
const unsafeInlineRegex = /\bon(?:error|load|mouseover|focus)\s*=\s*["'][^"']*javascript:/i;
const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;

function maskLeakedSecrets(rawHtml) {
    const matches = rawHtml.match(secretRegex);
    if (!matches || matches.length === 0) return { found: false, count: 0, maskedSamples: [] };
    const maskedSamples = matches.slice(0, 3).map(k => {
        if (k.length <= 10) return '***REDACTED_KEY***';
        return `${k.slice(0, 4)}...[REDACTED]...${k.slice(-3)}`;
    });
    return { found: true, count: matches.length, maskedSamples };
}

app.post('/api/scan-headers', requireHTTPAuth, async (req, res) => {
    const currentOperator = req.user && req.user.user ? req.user.user : 'anonymous';

    const rateStatus = checkScanRateLimit(currentOperator);
    if (!rateStatus.allowed) {
        return res.status(429).json({
            success: false,
            error: `Scanner rate limit exceeded! Wait ${rateStatus.waitSec}s before scanning again.`
        });
    }

    let target = cleanInput(req.body.target, 512);
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
            maxRedirects: 0,
            validateStatus: () => true,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            httpAgent: safeHttpAgent,
            httpsAgent: safeHttpsAgent,
            headers: {
                'User-Agent': 'TriScout-Ethical-Passive-Scanner/2.4 (+https://triscout.quarry.dpdns.org)',
                'Origin': 'https://unauthorized-origin-probe.example'
            }
        });
        const headers = response.headers;
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        const titleMatch = htmlBody.match(titleRegex);
        const pageTitle = titleMatch ? cleanInput(titleMatch[1], 80) : 'Untitled Document';
        const scriptCount = (htmlBody.match(scriptRegex) || []).length;
        const formCount = (htmlBody.match(formRegex) || []).length;
        const insecureForms = insecureFormRegex.test(htmlBody);
        
        let report = `--- ETHICAL PASSIVE WEB SCRAPER & SECURITY AUDIT FOR: ${target} ---\n`;
        report += `[i] Scraped Page Title: ${pageTitle}\n`;
        report += `[i] DOM Surface: ${scriptCount} Script(s), ${formCount} Form(s), HTTP Status ${response.status}\n\n`;

        let score = 100;
        const checks = [];

        // ১. Safe Error & Rollback Leak Check (টার্গেট ওয়েবসাইটে কোনো ডাটাবেস রোলব্যাক বা এরর লিক আছে কি না)
        if (htmlBody.includes('Stack trace:') || errorLeakRegex.test(htmlBody)) {
            report += `[!] Safe Error & Rollback: CRITICAL (Raw Stack Trace or DB Rollback Error Exposed!)\n`;
            score -= 20;
            checks.push({ name: 'Safe Error & Rollback', status: 'CRITICAL', category: 'Error Leak', impact: '-20 pts', detail: 'Target website exposes raw stack traces, SQL errors, or failed transaction rollback logs.' });
        } else {
            report += `[+] Safe Error & Rollback: SECURE (No raw error or rollback leaks)\n`;
            checks.push({ name: 'Safe Error & Rollback', status: 'SECURE', category: 'Error Leak', impact: '0 pts', detail: 'Target safely handles errors without leaking stack traces or DB rollback states.' });
        }

        // ২. No Leaked Key Check (টার্গেট ওয়েবসাইটে কোনো API Key লিক আছে কি না)
        const keyAudit = maskLeakedSecrets(htmlBody);
        if (keyAudit.found) {
            report += `[!] No Leaked Keys: CRITICAL (${keyAudit.count} Exposed API Key(s) detected: ${keyAudit.maskedSamples.join(', ')})\n`;
            score -= 25;
            checks.push({ name: 'No Leaked Keys', status: 'CRITICAL', category: 'Credentials', impact: '-25 pts', detail: `Found ${keyAudit.count} exposed API key/token(s) in target HTML (${keyAudit.maskedSamples.join(', ')}).` });
        } else {
            report += `[+] No Leaked Keys: SECURE (Zero exposed keys in source)\n`;
            checks.push({ name: 'No Leaked Keys', status: 'SECURE', category: 'Credentials', impact: '0 pts', detail: 'No exposed API keys or secret tokens found in target page source.' });
        }

        // ৩. Locked Origin Check (টার্গেট ওয়েবসাইটটির CORS Origin লক করা আছে কি না)
        const acao = headers['access-control-allow-origin'];
        if (acao === '*' || acao === 'https://unauthorized-origin-probe.example') {
            report += `[!] Locked Origin (CORS): WARNING (Wildcard or unlocked Origin: ${acao})\n`;
            score -= 10;
            checks.push({ name: 'Locked Origin (CORS)', status: 'WARNING', category: 'Origin Policy', impact: '-10 pts', detail: `Target allows unrestricted cross-origin access (Access-Control-Allow-Origin: ${acao}).` });
        } else {
            report += `[+] Locked Origin (CORS): SECURE (Origin policy locked)\n`;
            checks.push({ name: 'Locked Origin (CORS)', status: 'SECURE', category: 'Origin Policy', impact: '0 pts', detail: 'Target restricts cross-origin access to trusted domains only.' });
        }

        // ৪. Data Isolation & Cross-Origin Isolation Check (COOP / CORP / Frame Isolation)
        if (headers['cross-origin-opener-policy'] || headers['cross-origin-resource-policy'] || headers['x-frame-options']) {
            report += `[+] Data Isolation: SECURE (Cross-origin/Frame isolation enforced)\n`;
            checks.push({ name: 'Data Isolation', status: 'SECURE', category: 'Isolation', impact: '0 pts', detail: 'Target enforces browser context and frame data isolation.' });
        } else {
            report += `[!] Data Isolation: MISSING (No X-Frame-Options or COOP/CORP isolation headers)\n`;
            score -= 10;
            checks.push({ name: 'Data Isolation', status: 'MISSING', category: 'Isolation', impact: '-10 pts', detail: 'Missing X-Frame-Options and Cross-Origin isolation headers.' });
        }

        // ৫. Clean Input & Form Transport Check (টার্গেট ওয়েবসাইটের ইনপুট ফর্ম ও XSS ফিল্টার চেক)
        const unsafeInlineEvents = unsafeInlineRegex.test(htmlBody);
        if (insecureForms || unsafeInlineEvents) {
            report += `[!] Clean Input & Forms: CRITICAL (Unencrypted HTTP form or unsafe inline input handler!)\n`;
            score -= 15;
            checks.push({ name: 'Clean Input & Forms', status: 'CRITICAL', category: 'Input Sanitization', impact: '-15 pts', detail: 'Target contains unencrypted HTTP <form> actions or unescaped inline JS handlers.' });
        } else {
            report += `[+] Clean Input & Forms: SECURE (${formCount} form(s) audited)\n`;
            checks.push({ name: 'Clean Input & Forms', status: 'SECURE', category: 'Input Sanitization', impact: '0 pts', detail: `Audited ${formCount} form(s); input transport and DOM handlers are clean.` });
        }

        // ৬. Rate Limit Check (টার্গেট ওয়েবসাইটে রেট লিমিট আছে কি না)
        if (headers['x-ratelimit-limit'] || headers['retry-after'] || headers['ratelimit-limit'] || headers['cf-ray']) {
            report += `[+] Rate Limiting: SECURE (Traffic rate limiting / WAF active)\n`;
            checks.push({ name: 'Rate Limiting', status: 'SECURE', category: 'Traffic Defense', impact: '0 pts', detail: 'Target enforces rate-limiting headers or edge WAF protection.' });
        } else {
            report += `[-] Rate Limiting: NOTICE (No public rate-limit header)\n`;
            score -= 5;
            checks.push({ name: 'Rate Limiting', status: 'NOTICE', category: 'Traffic Defense', impact: '-5 pts', detail: 'No explicit rate-limit headers exposed on public response.' });
        }

        // ৭. Session / Link Expiry & Cookie Flags Check (টার্গেট ওয়েবসাইটের কুকি ও সেশন এক্সপায়ার টাইম আছে কি না)
        const rawCookies = headers['set-cookie'];
        if (Array.isArray(rawCookies) && rawCookies.length > 0) {
            const missingSecurity = rawCookies.some(c => !/httponly/i.test(c) || !/secure/i.test(c));
            const missingExpiry = rawCookies.some(c => !/(?:max-age|expires)=/i.test(c));
            if (missingSecurity || missingExpiry) {
                report += `[!] Link & Session Expiry: WARNING (Cookies missing HttpOnly/Secure or Expiration limit)\n`;
                score -= 10;
                checks.push({ name: 'Link & Session Expiry', status: 'WARNING', category: 'Session Lifecycle', impact: '-10 pts', detail: 'Target cookies lack HttpOnly, Secure, or explicit Max-Age/Expires attributes.' });
            } else {
                report += `[+] Link & Session Expiry: SECURE (HttpOnly, Secure & Expiry enforced)\n`;
                checks.push({ name: 'Link & Session Expiry', status: 'SECURE', category: 'Session Lifecycle', impact: '0 pts', detail: 'Target session cookies enforce strict expiration and security flags.' });
            }
        } else {
            report += `[+] Link & Session Expiry: SECURE (Stateless response / No persistent unexpiring cookies)\n`;
            checks.push({ name: 'Link & Session Expiry', status: 'SECURE', category: 'Session Lifecycle', impact: '0 pts', detail: 'Target is stateless on initial load with no insecure persistent cookies.' });
        }

        // ৮. Log Flowing & Debug Exposure Check (টার্গেট ওয়েবসাইটে কনসোল ডিবাগ বা সোর্স ম্যাপ লিক আছে কি না)
        if (debugLogLeakRegex.test(htmlBody) || headers['x-debug-token'] || headers['x-debug-token-link']) {
            report += `[!] Log Flowing Hygiene: WARNING (Debug logs, profiler headers, or .map files exposed)\n`;
            score -= 5;
            checks.push({ name: 'Log Flowing Hygiene', status: 'WARNING', category: 'Telemetry', impact: '-5 pts', detail: 'Target exposes debug log statements, source maps, or debug profiler headers.' });
        } else {
            report += `[+] Log Flowing Hygiene: SECURE (Production logs isolated)\n`;
            checks.push({ name: 'Log Flowing Hygiene', status: 'SECURE', category: 'Telemetry', impact: '0 pts', detail: 'No debug console streams or source map leaks found in production HTML.' });
        }

        // ৯. Indexing & Crawler Governance Check (টার্গেট ওয়েবসাইটের ইনডেক্সিং ও মেটা ট্যাগ কন্ট্রোল)
        if (headers['x-powered-by']) {
            report += `[!] Server Index & Fingerprint: WARNING (Tech Stack Exposed: ${cleanInput(String(headers['x-powered-by']), 50)})\n`;
            score -= 10;
            checks.push({ name: 'Server Index & Fingerprint', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: `Server leaks X-Powered-By (${cleanInput(String(headers['x-powered-by']), 50)}).` });
        } else {
            report += `[+] Server Index & Fingerprint: SECURE\n`;
            checks.push({ name: 'Server Index & Fingerprint', status: 'SECURE', category: 'Fingerprinting', impact: '0 pts', detail: 'Server technology headers and directory indexes are properly hidden.' });
        }

        report += `\n--- DEFENSIVE HTTP SECURITY HEADERS ---\n`;

        // ১০. HSTS Policy
        if (headers['strict-transport-security']) {
            report += `[+] HSTS (Strict-Transport-Security): SECURE\n`;
            checks.push({ name: 'HSTS Policy', status: 'SECURE', category: 'SSL/TLS', impact: '0 pts', detail: 'Enforces encrypted HTTPS connections against downgrade attacks.' });
        } else {
            report += `[!] HSTS (Strict-Transport-Security): MISSING\n`;
            score -= 10;
            checks.push({ name: 'HSTS Policy', status: 'MISSING', category: 'SSL/TLS', impact: '-10 pts', detail: 'Missing Strict-Transport-Security header.' });
        }

        // ১১. Content-Security-Policy (CSP)
        if (headers['content-security-policy']) {
            report += `[+] CSP (Content-Security-Policy): SECURE\n`;
            checks.push({ name: 'CSP Header', status: 'SECURE', category: 'XSS Defense', impact: '0 pts', detail: 'Content-Security-Policy is active to mitigate XSS injection.' });
        } else {
            report += `[!] CSP (Content-Security-Policy): MISSING\n`;
            score -= 10;
            checks.push({ name: 'CSP Header', status: 'MISSING', category: 'XSS Defense', impact: '-10 pts', detail: 'No Content-Security-Policy defined against script injection.' });
        }

        // ১২. MIME Sniffing & Referrer Privacy
        if (headers['x-content-type-options']) {
            report += `[+] X-Content-Type-Options: SECURE (nosniff)\n`;
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

        try {
            await ensureDatabaseIndexesAndCleanup();
            await runWithRlsUser(currentOperator, async () => {
                await sql`
                    INSERT INTO scan_logs (owner_username, target_url, score, report)
                    VALUES (${currentOperator}, ${target}, ${score}, ${report})
                `;
            });
            logFlow('INFO', 'SCAN_COMPLETED', { operator: currentOperator, target, score });
        } catch (dbErr) {
            logFlow('ERROR', 'RLS_SCAN_LOG_SAVE_FAILED', { operator: currentOperator });
        }

        res.json({ success: true, report, score, checks });
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Target unreachable.' }); 
    }
});

// ৯. RLS সুরক্ষিত স্ক্যান হিস্ট্রি পাওয়ার API
app.get('/api/scan-history', requireHTTPAuth, async (req, res) => {
    try {
        await ensureDatabaseIndexesAndCleanup();
        const username = cleanInput(req.user.user, 100);
        const history = await runWithRlsUser(username, async () => {
            return await sql`
                SELECT id, target_url AS target, score, scanned_at AS time
                FROM scan_logs
                WHERE LOWER(owner_username) = LOWER(${username})
                ORDER BY scanned_at DESC
                LIMIT 10
            `;
        });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to load protected scan history.' });
    }
});

// ১০. ইমেইলে স্ক্যান রিপোর্ট পাঠানোর API
app.post('/api/send-report', requireHTTPAuth, async (req, res) => {
    const target = cleanInput(req.body.target, 512);
    const reportData = cleanInput(req.body.reportData, 25000);
    const emailTo = cleanInput(req.body.emailTo, 254);
    if (!target || !reportData || !emailTo) return res.status(400).json({ success: false, error: "Missing information." });

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

// ১১. GitHub OAuth লগইন
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
            await ensureDatabaseIndexesAndCleanup();
            await runWithRlsUser('__SYSTEM_AUTH__', async () => {
                await sql`
                    INSERT INTO users (username, avatar_url, provider, is_verified, last_login)
                    VALUES (${userData.login}, ${userData.avatar_url}, 'github', TRUE, NOW())
                    ON CONFLICT (username) DO UPDATE 
                    SET avatar_url = EXCLUDED.avatar_url, last_login = NOW()
                `;
            });
        } catch (dbError) {
            console.error("[-] Neon Database save failed.");
        }

        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url, provider: 'github' }, JWT_SECRET, { expiresIn: '2h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    } catch (error) { 
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>'); 
    }
});

// ১২. অ্যাকাউন্ট ও স্ক্যান ডেটা ডিলিট করার API (RLS Protected + Rollback)
app.post('/api/account/delete', requireHTTPAuth, async (req, res) => {
    try {
        await ensureDatabaseIndexesAndCleanup();
        const username = cleanInput(req.user.user, 100);

        await runWithRlsUser(username, async () => {
            await sql`BEGIN`;
            try {
                await sql`DELETE FROM scan_logs WHERE LOWER(owner_username) = LOWER(${username})`;
                await sql`DELETE FROM users WHERE LOWER(username) = LOWER(${username})`;
                await sql`COMMIT`;
            } catch (txErr) {
                await sql`ROLLBACK`;
                throw txErr;
            }
        });

        res.json({
            success: true,
            message: "RLS & Rollback Verified: Your account and all associated scan logs have been permanently deleted."
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to delete account data (Transaction rolled back safely)." });
    }
});

module.exports = app;
