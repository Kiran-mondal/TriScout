const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Vercel বা লোকাল এনভায়রনমেন্টের স্পেসজনিত সমস্যা এড়ানোর জন্য সেফ রিডার
function getEnv(key) {
    if (process.env[key]) return process.env[key].trim();
    const foundKey = Object.keys(process.env).find(k => k.trim() === key);
    return foundKey ? process.env[foundKey].trim() : undefined;
}

const JWT_SECRET = getEnv('JWT_SECRET') || crypto.randomBytes(32).toString('hex');

/**
 * Express Middleware to protect HTTP routes.
 */
function requireHTTPAuth(req, res, next) {
    // Read token from headers or query params
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: Missing secure pipeline token.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Session expired or token invalid.' });
        }
        req.user = user;
        next();
    });
}

/**
 * Hook for verifying structural handshake security over WebSockets
 */
function verifyWSToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

module.exports = { requireHTTPAuth, verifyWSToken };
