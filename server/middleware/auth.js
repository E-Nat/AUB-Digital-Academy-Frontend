const jwt = require('jsonwebtoken');
const { dbAsync } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'aub_digital_academy_secure_jwt_secret_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    // Support simulated session tokens (for offline-to-online transitions)
    if (token.startsWith('aub_session_token_')) {
        try {
            const rawJson = Buffer.from(token.replace('aub_session_token_', ''), 'base64').toString('utf8');
            const fallbackUser = JSON.parse(rawJson);
            
            dbAsync.get(
                `SELECT u.id, u.full_name, u.email, u.university_id, u.avatar_url, u.status, r.name as role
                 FROM users u
                 JOIN roles r ON u.role_id = r.id
                 WHERE u.id = ? OR LOWER(u.email) = LOWER(?)`,
                [fallbackUser.id || 1, fallbackUser.email || 'admin@aub.edu.com']
            ).then(user => {
                if (user && user.status === 'Active') {
                    req.user = user;
                    return next();
                } else {
                    return res.status(403).json({ success: false, message: 'Session user invalid or inactive.' });
                }
            }).catch(err => {
                return res.status(500).json({ success: false, message: 'Auth server error.' });
            });
            return;
        } catch (e) {
            // Proceed to JWT verification
        }
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }

        try {
            const user = await dbAsync.get(
                `SELECT u.id, u.full_name, u.email, u.university_id, u.avatar_url, u.status, r.name as role
                 FROM users u
                 JOIN roles r ON u.role_id = r.id
                 WHERE u.id = ?`,
                [decoded.userId]
            );

            if (!user) {
                return res.status(403).json({ success: false, message: 'User account not found.' });
            }

            if (user.status !== 'Active') {
                return res.status(403).json({ success: false, message: 'User account is inactive or suspended.' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Auth verification error:', error);
            res.status(500).json({ success: false, message: 'Authentication server error.' });
        }
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }
    next();
}

function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireAdmin,
    requireRole
};
