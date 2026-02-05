const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Generate unique URL slug for tournament
function generateSlug(name) {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
}

// GET /api/tournaments - List all tournaments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { league_id, status, game_type } = req.query;

        let query = `
            SELECT 
                t.*,
                l.name as league_name,
                u.username as created_by_username,
                COUNT(DISTINCT tp.id) as participant_count
            FROM tournaments t
            LEFT JOIN leagues l ON t.league_id = l.id
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        // Filter by league
        if (league_id) {
            query += ` AND t.league_id = $${paramCount}`;
            params.push(league_id);
            paramCount++;
        }

        // Filter by status
        if (status) {
            query += ` AND t.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        // Filter by game type
        if (game_type) {
            query += ` AND t.game_type = $${paramCount}`;
            params.push(game_type);
            paramCount++;
        }

        query += `
            GROUP BY t.id, l.name, u.username
            ORDER BY t.created_at DESC
        `;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            tournaments: result.rows
        });
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
});

// GET /api/tournaments/:id - Get tournament details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get tournament details
        const tournamentResult = await pool.query(`
            SELECT 
                t.*,
                l.name as league_name,
                u.username as created_by_username
            FROM tournaments t
            LEFT JOIN leagues l ON t.league_id = l.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.id = $1
        `, [id]);

        if (tournamentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const tournament = tournamentResult.rows[0];

        // Get participants
        const participantsResult = await pool.query(`
            SELECT 
                tp.*,
                p.first_name,
                p.last_name,
                t.name as team_name
            FROM tournament_participants tp
            JOIN players p ON tp.player_id = p.id
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE tp.tournament_id = $1
            ORDER BY tp.seed NULLS LAST, tp.id
        `, [id]);

        tournament.participants = participantsResult.rows;

        res.json({
            success: true,
            tournament
        });
    } catch (error) {
        console.error('Error fetching tournament:', error);
        res.status(500).json({ error: 'Failed to fetch tournament' });
    }
});

// POST /api/tournaments - Create new tournament
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            league_id,
            game_type,
            format,
            start_date,
            description,
            is_public,
            race_to
        } = req.body;

        // Validate required fields
        if (!name || !league_id || !game_type || !format) {
            return res.status(400).json({
                error: 'Missing required fields: name, league_id, game_type, format'
            });
        }

        // Verify league exists
        const leagueCheck = await pool.query('SELECT id FROM leagues WHERE id = $1', [league_id]);
        if (leagueCheck.rows.length === 0) {
            return res.status(404).json({ error: 'League not found' });
        }

        // Generate unique URL slug
        const public_url_slug = generateSlug(name);

        const result = await pool.query(`
            INSERT INTO tournaments (
                name, league_id, game_type, format, start_date, 
                description, is_public, race_to, public_url_slug, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            name,
            league_id,
            game_type,
            format,
            start_date || null,
            description || null,
            is_public || false,
            race_to || 13,
            public_url_slug,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            tournament: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ error: 'Failed to create tournament' });
    }
});

// PUT /api/tournaments/:id - Update tournament
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            game_type,
            format,
            start_date,
            description,
            is_public,
            race_to
        } = req.body;

        // Check if tournament exists and is in draft status
        const tournamentCheck = await pool.query(
            'SELECT status FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournamentCheck.rows[0].status !== 'draft') {
            return res.status(400).json({
                error: 'Can only edit tournaments in draft status'
            });
        }

        const result = await pool.query(`
            UPDATE tournaments
            SET 
                name = COALESCE($1, name),
                game_type = COALESCE($2, game_type),
                format = COALESCE($3, format),
                start_date = COALESCE($4, start_date),
                description = COALESCE($5, description),
                is_public = COALESCE($6, is_public),
                race_to = COALESCE($7, race_to),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [name, game_type, format, start_date, description, is_public, race_to, id]);

        res.json({
            success: true,
            tournament: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({ error: 'Failed to update tournament' });
    }
});

// DELETE /api/tournaments/:id - Delete tournament
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if tournament is in draft status
        const tournamentCheck = await pool.query(
            'SELECT status FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournamentCheck.rows[0].status !== 'draft') {
            return res.status(400).json({
                error: 'Can only delete tournaments in draft status'
            });
        }

        await pool.query('DELETE FROM tournaments WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Tournament deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({ error: 'Failed to delete tournament' });
    }
});

module.exports = router;
