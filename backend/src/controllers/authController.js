const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Register new user
const register = async (req, res) => {
    try {
        const { username, email, password, first_name, last_name, phone } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert user - always create as admin
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, 'read_only', $4, $5, $6)
       RETURNING id, username, email, role, first_name, last_name, created_at`,
            [username, email, password_hash, first_name, last_name, phone]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user,
            token,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Get user from database
        const result = await db.query(
            'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check if account is locked
        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
            return res.status(423).json({
                error: 'Account is locked. Please try again later.',
                locked_until: user.account_locked_until
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            // Increment failed login attempts
            const failedAttempts = user.failed_login_attempts + 1;
            let lockUntil = null;

            // Lock account after 5 failed attempts for 15 minutes
            if (failedAttempts >= 5) {
                lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }

            await db.query(
                'UPDATE users SET failed_login_attempts = $1, account_locked_until = $2 WHERE id = $3',
                [failedAttempts, lockUntil, user.id]
            );

            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Reset failed login attempts and update last login
        await db.query(
            'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, username, email, role, first_name, last_name, phone, 
              email_verified, two_factor_enabled, last_login, created_at
       FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { first_name, last_name, phone, email } = req.body;

        const result = await db.query(
            `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email)
       WHERE id = $5
       RETURNING id, username, email, role, first_name, last_name, phone`,
            [first_name, last_name, phone, email, req.user.id]
        );

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        // Get user with password hash
        const result = await db.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];

        // Verify current password
        const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const new_password_hash = await bcrypt.hash(new_password, saltRounds);

        // Update password
        await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [new_password_hash, req.user.id]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
};
