const db = require('../config/database');

// Get all teams with players
const getAllTeams = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.*, 
              COUNT(tp.id) as player_count
       FROM teams t
       LEFT JOIN team_players tp ON t.id = tp.team_id AND tp.is_active = true
       WHERE t.is_active = true AND t.name != 'BYE'
       GROUP BY t.id
       ORDER BY t.name`
        );

        res.json({ teams: result.rows });
    } catch (error) {
        console.error('Get all teams error:', error);
        res.status(500).json({ error: 'Failed to get teams' });
    }
};

// Create new team
const createTeam = async (req, res) => {
    try {
        const { name, division_id } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const result = await db.query(
            `INSERT INTO teams (division_id, name, is_active, registration_fee_paid)
       VALUES ($1, $2, true, true)
       RETURNING *`,
            [division_id || 1, name]
        );

        res.status(201).json({
            message: 'Team created successfully',
            team: result.rows[0],
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
};

// Update team
const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const result = await db.query(
            `UPDATE teams SET name = $1 WHERE id = $2 RETURNING *`,
            [name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json({
            message: 'Team updated successfully',
            team: result.rows[0],
        });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
};

// Delete team
const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('UPDATE teams SET is_active = false WHERE id = $1', [id]);

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
};

// Get all players
const getAllPlayers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, 
              t.name as team_name,
              tp.team_id
       FROM players p
       LEFT JOIN team_players tp ON p.id = tp.player_id AND tp.is_active = true
       LEFT JOIN teams t ON tp.team_id = t.id
       WHERE p.is_active = true
       ORDER BY p.last_name, p.first_name`
        );

        res.json({ players: result.rows });
    } catch (error) {
        console.error('Get all players error:', error);
        res.status(500).json({ error: 'Failed to get players' });
    }
};

// Create new player
const createPlayer = async (req, res) => {
    try {
        const { first_name, last_name, sa_id_number, phone, email, team_id } = req.body;

        console.log('Creating player with data:', { first_name, last_name, sa_id_number, phone, email, team_id });

        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        // Insert player
        console.log('Inserting player into database...');
        const playerResult = await db.query(
            `INSERT INTO players (first_name, last_name, sa_id_number, phone, email, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
            [first_name, last_name, sa_id_number || null, phone || null, email || null]
        );

        const player = playerResult.rows[0];
        console.log('Player created:', player);

        // If team_id provided, assign player to team
        if (team_id) {
            console.log('Assigning player to team:', team_id);
            await db.query(
                `INSERT INTO team_players (team_id, player_id, is_active)
         VALUES ($1, $2, true)`,
                [team_id, player.id]
            );
        }

        res.status(201).json({
            message: 'Player created successfully',
            player,
        });
    } catch (error) {
        console.error('Create player error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint,
        });
        res.status(500).json({
            error: 'Failed to create player',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update player
const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, sa_id_number, phone, email, team_id } = req.body;

        const result = await db.query(
            `UPDATE players 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           sa_id_number = COALESCE($3, sa_id_number),
           phone = COALESCE($4, phone),
           email = COALESCE($5, email)
       WHERE id = $6
       RETURNING *`,
            [first_name, last_name, sa_id_number, phone, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Update team assignment if provided
        if (team_id !== undefined) {
            // Deactivate old team assignments
            await db.query(
                'UPDATE team_players SET is_active = false WHERE player_id = $1',
                [id]
            );

            // Create new team assignment if team_id is not null
            if (team_id) {
                // Check if assignment already exists
                const existingAssignment = await db.query(
                    'SELECT id FROM team_players WHERE team_id = $1 AND player_id = $2',
                    [team_id, id]
                );

                if (existingAssignment.rows.length > 0) {
                    // Reactivate existing assignment
                    await db.query(
                        'UPDATE team_players SET is_active = true WHERE team_id = $1 AND player_id = $2',
                        [team_id, id]
                    );
                } else {
                    // Create new assignment
                    await db.query(
                        'INSERT INTO team_players (team_id, player_id, is_active) VALUES ($1, $2, true)',
                        [team_id, id]
                    );
                }
            }
        }

        res.json({
            message: 'Player updated successfully',
            player: result.rows[0],
        });
    } catch (error) {
        console.error('Update player error:', error);
        res.status(500).json({ error: 'Failed to update player' });
    }
};

// Delete player
const deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('UPDATE players SET is_active = false WHERE id = $1', [id]);
        await db.query('UPDATE team_players SET is_active = false WHERE player_id = $1', [id]);

        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Delete player error:', error);
        res.status(500).json({ error: 'Failed to delete player' });
    }
};

module.exports = {
    getAllTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getAllPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
};
