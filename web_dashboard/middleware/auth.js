const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

function getEnv(key) {
    if (process.env[key]) return process.env[key].trim();
    const foundKey = Object.keys(process.env).find(k => k.trim() === key);
    return foundKey ? process.env[foundKey].trim() : undefined;
}

const configuredSecret = getEnv('JWT_SECRET');
const dbUrl = getEnv('DATABASE_URL');

if (!configuredSecret) {
    console.warn('[SECURITY WARN] JWT_SECRET is not set in environment variables. Configure a dedicated JWT_SECRET in production.');
}

const JWT_SECRET = configuredSecret
    || (dbUrl ? crypto.createHash('sha256').update(dbUrl).digest('hex') : crypto.randomBytes(32).toString('hex'));

const VERIFY_OPTS = { algorithms: ['HS256'] };

function requireHTTPAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: Missing secure pipeline token.' });
    }

    jwt.verify(token, JWT_SECRET, VERIFY_OPTS, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Session expired or token invalid.' });
        }
        req.user = user;
        next();
    });
}

function verifyWSToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, VERIFY_OPTS);
    } catch (err) {
        return null;
    }
}

module.exports = { requireHTTPAuth, verifyWSToken, JWT_SECRET, getEnv };
