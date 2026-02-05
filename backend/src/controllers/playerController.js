const db = require('../config/database');

// Get all players
const getPlayers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, u.username, u.email
       FROM players p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.is_active = true
       ORDER BY p.last_name, p.first_name`
        );

        res.json({ players: result.rows });
    } catch (error) {
        console.error('Get players error:', error);
        res.status(500).json({ error: 'Failed to get players' });
    }
};

// Get player by ID
const getPlayerById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT p.*, u.username, u.email
       FROM players p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json({ player: result.rows[0] });
    } catch (error) {
        console.error('Get player error:', error);
        res.status(500).json({ error: 'Failed to get player' });
    }
};

// Create player
const createPlayer = async (req, res) => {
    try {
        const { first_name, last_name, sa_id_number, phone, email, date_of_birth, handicap } = req.body;

        const result = await db.query(
            `INSERT INTO players (user_id, first_name, last_name, sa_id_number, phone, email, date_of_birth, handicap)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [req.user.id, first_name, last_name, sa_id_number, phone, email, date_of_birth, handicap || 0]
        );

        res.status(201).json({
            message: 'Player created successfully',
            player: result.rows[0],
        });
    } catch (error) {
        console.error('Create player error:', error);
        res.status(500).json({ error: 'Failed to create player' });
    }
};

module.exports = {
    getPlayers,
    getPlayerById,
    createPlayer,
};
