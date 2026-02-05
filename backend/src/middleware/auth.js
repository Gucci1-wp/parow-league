const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }

            // Get user from database
            const result = await db.query(
                'SELECT id, username, email, role, first_name, last_name FROM users WHERE id = $1 AND is_active = true',
                [decoded.userId]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({ error: 'User not found or inactive' });
            }

            req.user = result.rows[0];
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }

};

// Middleware to optionally verify JWT token (doesn't block if missing)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return next();
        }

        // Verify token with promise wrapper
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });

        // Get user from database
        const result = await db.query(
            'SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true',
            [decoded.userId]
        );

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        }
        next();
    } catch (error) {
        // Any error (token invalid, db fail, etc), just treat as guest
        next();
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Middleware to check if user is captain or admin
const requireCaptain = (req, res, next) => {
    if (req.user.role !== 'captain' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Captain or admin access required' });
    }
    next();
};

// Middleware to check if user is team captain or admin
const requireTeamCaptain = async (req, res, next) => {
    try {
        const teamId = req.params.teamId || req.params.id;

        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user is captain of this team
        const result = await db.query(
            'SELECT id FROM teams WHERE id = $1 AND captain_id = $2',
            [teamId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'You must be the team captain to perform this action' });
        }

        next();
    } catch (error) {
        console.error('Team captain check error:', error);
        return res.status(500).json({ error: 'Authorization check failed' });
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    requireCaptain,
    requireTeamCaptain,
};
