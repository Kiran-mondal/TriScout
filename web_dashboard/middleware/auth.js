const jwt = require('jsonwebtoken');
const JWT_SECRET = 'triscout_super_secret_key_2026';

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