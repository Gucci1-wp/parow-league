const db = require('../config/database');

// Get all teams
const getTeams = async (req, res) => {
    try {
        const { divisionId } = req.query;

        let query = `
      SELECT t.*, 
             u.username as captain_username,
             u.first_name || ' ' || u.last_name as captain_name,
             d.name as division_name,
             COUNT(tp.id) as player_count
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      LEFT JOIN divisions d ON t.division_id = d.id
      LEFT JOIN team_players tp ON t.id = tp.team_id AND tp.is_active = true
      WHERE t.is_active = true
    `;

        const params = [];
        if (divisionId) {
            query += ' AND t.division_id = $1';
            params.push(divisionId);
        }

        query += ' GROUP BY t.id, u.username, u.first_name, u.last_name, d.name ORDER BY t.name';

        const result = await db.query(query, params);

        // Add match statistics for each team
        const teamsWithStats = await Promise.all(result.rows.map(async (team) => {
            const statsResult = await db.query(
                `SELECT 
                    COUNT(id) as played, 
                    SUM(CASE WHEN winner_team_id = $1 THEN 1 ELSE 0 END) as won,
                    SUM(CASE WHEN winner_team_id IS NOT NULL AND winner_team_id != $1 THEN 1 ELSE 0 END) as lost,
                    SUM(CASE WHEN winner_team_id = $1 THEN 3 ELSE 0 END) as points 
                 FROM matches 
                 WHERE (home_team_id = $1 OR away_team_id = $1) AND status = 'completed'`,
                [team.id]
            );
            const stats = statsResult.rows[0] || {};
            return {
                ...team,
                played: parseInt(stats.played) || 0,
                won: parseInt(stats.won) || 0,
                lost: parseInt(stats.lost) || 0,
                points: parseInt(stats.points) || 0
            };
        }));

        res.json({ teams: teamsWithStats });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to get teams' });
    }
};

// Get team by ID with roster
const getTeamById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Fetching team with ID:', id);

        const teamResult = await db.query(
            `SELECT t.*, 
              u.username as captain_username,
              u.first_name || ' ' || u.last_name as captain_name,
              d.name as division_name
       FROM teams t
       LEFT JOIN users u ON t.captain_id = u.id
       LEFT JOIN divisions d ON t.division_id = d.id
       WHERE t.id = $1`,
            [id]
        );

        console.log('Team query result:', teamResult.rows.length, 'rows');

        if (teamResult.rows.length === 0) {
            console.log('Team not found with ID:', id);
            return res.status(404).json({ error: 'Team not found' });
        }

        const rosterResult = await db.query(
            `SELECT tp.id, tp.team_id, tp.player_id, tp.is_active,
                    p.first_name, p.last_name, p.handicap, p.elo_rating
       FROM team_players tp
       JOIN players p ON tp.player_id = p.id
       WHERE tp.team_id = $1 AND tp.is_active = true
       ORDER BY p.last_name`,
            [id]
        );

        console.log('Roster query result:', rosterResult.rows.length, 'players');

        const statsResult = await db.query(
            `SELECT 
                COUNT(id) as played, 
                SUM(CASE WHEN winner_team_id = $1 THEN 1 ELSE 0 END) as won,
                SUM(CASE WHEN winner_team_id IS NOT NULL AND winner_team_id != $1 THEN 1 ELSE 0 END) as lost,
                SUM(CASE WHEN winner_team_id = $1 THEN 3 ELSE 0 END) as points 
             FROM matches 
             WHERE (home_team_id = $1 OR away_team_id = $1) AND status = 'completed'`,
            [id]
        );
        const stats = statsResult.rows[0] || {};
        const teamWithStats = {
            ...teamResult.rows[0],
            played: parseInt(stats.played) || 0,
            won: parseInt(stats.won) || 0,
            lost: parseInt(stats.lost) || 0,
            points: parseInt(stats.points) || 0
        };

        res.json({
            team: teamWithStats,
            roster: rosterResult.rows,
        });
    } catch (error) {
        console.error('Get team error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to get team', details: error.message });
    }
};

// Create team
const createTeam = async (req, res) => {
    try {
        const { division_id, name, captain_id } = req.body;

        const result = await db.query(
            `INSERT INTO teams (division_id, name, captain_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [division_id, name, captain_id || req.user.id]
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

// Add player to team
const addPlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { player_id, is_substitute, jersey_number } = req.body;

        const result = await db.query(
            `INSERT INTO team_players (team_id, player_id, is_substitute, jersey_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [id, player_id, is_substitute || false, jersey_number]
        );

        res.status(201).json({
            message: 'Player added to team successfully',
            team_player: result.rows[0],
        });
    } catch (error) {
        console.error('Add player error:', error);
        res.status(500).json({ error: 'Failed to add player to team' });
    }
};

// Get team players
const getTeamPlayers = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT p.*, tp.id as team_player_id, tp.is_active
       FROM players p
       JOIN team_players tp ON p.id = tp.player_id
       WHERE tp.team_id = $1 AND tp.is_active = true
       ORDER BY p.last_name`,
            [id]
        );

        res.json({ players: result.rows });
    } catch (error) {
        console.error('Get team players error:', error);
        res.status(500).json({ error: 'Failed to get team players' });
    }
};

module.exports = {
    getTeams,
    getTeamById,
    createTeam,
    addPlayer,
    getTeamPlayers,
};
