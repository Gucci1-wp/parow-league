const db = require('../config/database');

// Get all leagues
const getLeagues = async (req, res) => {
    try {
        let query = `SELECT l.*, v.name as venue_name, v.address as venue_address
       FROM leagues l
       LEFT JOIN venues v ON l.venue_id = v.id
       WHERE 1=1`;

        // If not admin, only show public leagues
        if (!req.user || req.user.role !== 'admin') {
            query += ` AND l.is_public = true`;
        }

        query += ` ORDER BY l.id DESC`;

        const result = await db.query(query);

        res.json({ leagues: result.rows });
    } catch (error) {
        console.error('Get leagues error:', error);
        res.status(500).json({ error: 'Failed to get leagues' });
    }
};

// Get league by ID with seasons
const getLeagueById = async (req, res) => {
    try {
        const { id } = req.params;

        const leagueResult = await db.query(
            `SELECT l.*, v.name as venue_name, v.address as venue_address
       FROM leagues l
       LEFT JOIN venues v ON l.venue_id = v.id
       WHERE l.id = $1`,
            [id]
        );

        if (leagueResult.rows.length === 0) {
            return res.status(404).json({ error: 'League not found' });
        }

        const league = leagueResult.rows[0];

        // Check access: non-admin users can only view public leagues
        if (!req.user || req.user.role !== 'admin') {
            if (!league.is_public) {
                return res.status(403).json({ error: 'This league is private' });
            }
        }

        const seasonsResult = await db.query(
            'SELECT * FROM seasons WHERE league_id = $1 ORDER BY start_date DESC',
            [id]
        );

        res.json({
            league,
            seasons: seasonsResult.rows,
        });
    } catch (error) {
        console.error('Get league error:', error);
        res.status(500).json({ error: 'Failed to get league' });
    }
};

// Create league (admin only)
const createLeague = async (req, res) => {
    try {
        console.log('Create League Request Body:', req.body);
        const { name, venue_id, points_per_win, points_per_tie, race_to_default, is_public } = req.body;

        // Handle empty string or undefined for venue_id
        const venueIdValue = (venue_id === '' || venue_id === undefined) ? null : venue_id;

        const result = await db.query(
            `INSERT INTO leagues (name, venue_id, points_per_win, points_per_tie, race_to_default, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [
                name ?? null,
                venueIdValue,
                points_per_win ?? 3,
                points_per_tie ?? 1,
                race_to_default ?? 13,
                is_public ?? false
            ]
        );

        res.status(201).json({
            message: 'League created successfully',
            league: result.rows[0],
        });
    } catch (error) {
        console.error('Create league error:', error);
        res.status(500).json({ error: 'Failed to create league', details: error.message });
    }
};

// Update league (admin only)
const updateLeague = async (req, res) => {
    try {
        console.log('Update League Request Body:', req.body);
        const { id } = req.params;
        const { name, venue_id, points_per_win, points_per_tie, race_to_default, is_public } = req.body;

        // Handle empty string or undefined for venue_id
        const venueIdValue = (venue_id === '' || venue_id === undefined) ? null : venue_id;

        const result = await db.query(
            `UPDATE leagues 
             SET name = COALESCE($1, name),
                 venue_id = COALESCE($2, venue_id),
                 points_per_win = COALESCE($3, points_per_win),
                 points_per_tie = COALESCE($4, points_per_tie),
                 race_to_default = COALESCE($5, race_to_default),
                 is_public = COALESCE($6, is_public)
             WHERE id = $7
             RETURNING *`,
            [
                name ?? null,
                venueIdValue,
                points_per_win ?? null,
                points_per_tie ?? null,
                race_to_default ?? null,
                is_public ?? null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'League not found' });
        }

        res.json({
            message: 'League updated successfully',
            league: result.rows[0],
        });
    } catch (error) {
        console.error('Update league error:', error);
        res.status(500).json({ error: 'Failed to update league', details: error.message });
    }
};

// Get seasons for a league
const getSeasons = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM seasons WHERE league_id = $1 ORDER BY start_date DESC',
            [id]
        );

        res.json({ seasons: result.rows });
    } catch (error) {
        console.error('Get seasons error:', error);
        res.status(500).json({ error: 'Failed to get seasons' });
    }
};

// Create season (admin only)
const createSeason = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, start_date, end_date, registration_deadline } = req.body;

        const result = await db.query(
            `INSERT INTO seasons (league_id, name, description, start_date, end_date, registration_deadline)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [id, name, description, start_date, end_date, registration_deadline]
        );

        res.status(201).json({
            message: 'Season created successfully',
            season: result.rows[0],
        });
    } catch (error) {
        console.error('Create season error:', error);
        res.status(500).json({ error: 'Failed to create season' });
    }
};

// Get standings for a league (current active season)
const getLeagueStandings = async (req, res) => {
    try {
        const { id } = req.params;

        // Check league access
        const leagueCheck = await db.query('SELECT is_public FROM leagues WHERE id = $1', [id]);
        if (leagueCheck.rows.length === 0) {
            return res.status(404).json({ error: 'League not found' });
        }

        if (!req.user || req.user.role !== 'admin') {
            if (!leagueCheck.rows[0].is_public) {
                return res.status(403).json({ error: 'This league is private' });
            }
        }

        // Get active season
        const seasonResult = await db.query(
            'SELECT id FROM seasons WHERE league_id = $1 AND is_active = true LIMIT 1',
            [id]
        );

        if (seasonResult.rows.length === 0) {
            return res.json({ standings: [], message: 'No active season' });
        }

        const seasonId = seasonResult.rows[0].id;

        // Get divisions for this season
        const divisionsResult = await db.query(
            'SELECT id FROM divisions WHERE season_id = $1',
            [seasonId]
        );

        if (divisionsResult.rows.length === 0) {
            return res.json({ standings: [] });
        }

        const divisionIds = divisionsResult.rows.map(d => d.id);

        // Get team standings
        const standingsResult = await db.query(
            `SELECT 
                t.id,
                t.name,
                t.division_id,
                COUNT(DISTINCT m.id) as matches_played,
                SUM(CASE WHEN m.home_team_id = t.id AND m.home_score > m.away_score THEN 1
                         WHEN m.away_team_id = t.id AND m.away_score > m.home_score THEN 1
                         ELSE 0 END) as wins,
                SUM(CASE WHEN m.home_team_id = t.id AND m.home_score < m.away_score THEN 1
                         WHEN m.away_team_id = t.id AND m.away_score < m.home_score THEN 1
                         ELSE 0 END) as losses,
                SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE m.away_score END) as frames_won,
                SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE m.home_score END) as frames_lost
             FROM teams t
             LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) 
                AND m.status = 'completed'
             WHERE t.division_id = ANY($1)
             GROUP BY t.id, t.name, t.division_id
             ORDER BY wins DESC, frames_won DESC`,
            [divisionIds]
        );

        res.json({ standings: standingsResult.rows });
    } catch (error) {
        console.error('Get league standings error:', error);
        res.status(500).json({ error: 'Failed to get standings' });
    }
};

// Get fixtures for a league (current active season)
const getLeagueFixtures = async (req, res) => {
    try {
        const { id } = req.params;

        // Check league access
        const leagueCheck = await db.query('SELECT is_public FROM leagues WHERE id = $1', [id]);
        if (leagueCheck.rows.length === 0) {
            return res.status(404).json({ error: 'League not found' });
        }

        if (!req.user || req.user.role !== 'admin') {
            if (!leagueCheck.rows[0].is_public) {
                return res.status(403).json({ error: 'This league is private' });
            }
        }

        // Get active season
        const seasonResult = await db.query(
            'SELECT id FROM seasons WHERE league_id = $1 AND is_active = true LIMIT 1',
            [id]
        );

        if (seasonResult.rows.length === 0) {
            return res.json({ fixtures: [], message: 'No active season' });
        }

        const seasonId = seasonResult.rows[0].id;

        // Get divisions for this season
        const divisionsResult = await db.query(
            'SELECT id FROM divisions WHERE season_id = $1',
            [seasonId]
        );

        if (divisionsResult.rows.length === 0) {
            return res.json({ fixtures: [] });
        }

        const divisionIds = divisionsResult.rows.map(d => d.id);

        // Get upcoming and recent matches
        const fixturesResult = await db.query(
            `SELECT 
                m.*,
                ht.name as home_team_name,
                at.name as away_team_name,
                v.name as venue_name,
                v.address as venue_address
             FROM matches m
             JOIN teams ht ON m.home_team_id = ht.id
             JOIN teams at ON m.away_team_id = at.id
             LEFT JOIN venues v ON m.venue_id = v.id
             WHERE ht.division_id = ANY($1)
             ORDER BY m.match_date DESC
             LIMIT 50`,
            [divisionIds]
        );

        res.json({ fixtures: fixturesResult.rows });
    } catch (error) {
        console.error('Get league fixtures error:', error);
        res.status(500).json({ error: 'Failed to get fixtures' });
    }
};

module.exports = {
    getLeagues,
    getLeagueById,
    createLeague,
    updateLeague,
    getSeasons,
    createSeason,
    getLeagueStandings,
    getLeagueFixtures,
};
