const db = require('../config/database');
const bcrypt = require('bcrypt');

// Get all users
const getUsers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, username, email, role, first_name, last_name, is_active, last_login, created_at 
             FROM users 
             ORDER BY created_at DESC`
        );
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Create user (Admin only)
const createUser = async (req, res) => {
    try {
        const { username, email, password, role, first_name, last_name, phone } = req.body;

        // Validation
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'Username, email, password, and role are required' });
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

        // Insert user
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, username, email, role, first_name, last_name, created_at`,
            [username, email, password_hash, role, first_name, last_name, phone]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Update user role/status
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, is_active } = req.body;

        const result = await db.query(
            `UPDATE users 
             SET role = COALESCE($1, role),
                 is_active = COALESCE($2, is_active)
             WHERE id = $3
             RETURNING id, username, email, role, is_active`,
            [role, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser
};
