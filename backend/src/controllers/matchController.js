const db = require('../config/database');

// Get all matches with filters
const getMatches = async (req, res) => {
    try {
        const { divisionId, round, status, teamId } = req.query;

        let query = `
      SELECT m.*, 
             ht.name as home_team_name,
             at.name as away_team_name,
             v.name as venue_name,
             mr.home_score, mr.away_score, mr.winner_team_id
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN venues v ON m.venue_id = v.id
      LEFT JOIN match_results mr ON m.id = mr.match_id
      WHERE 1=1
    `;

        const params = [];
        let paramCount = 1;

        if (divisionId) {
            query += ` AND m.division_id = $${paramCount}`;
            params.push(divisionId);
            paramCount++;
        }

        if (round) {
            query += ` AND m.round = $${paramCount}`;
            params.push(round);
            paramCount++;
        }

        if (status) {
            query += ` AND m.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (teamId) {
            query += ` AND (m.home_team_id = $${paramCount} OR m.away_team_id = $${paramCount})`;
            params.push(teamId);
            paramCount++;
        }

        query += ' ORDER BY m.match_date, m.match_time, m.round';

        const result = await db.query(query, params);
        res.json({ matches: result.rows });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ error: 'Failed to get matches' });
    }
};

// Get match by ID
const getMatchById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Fetching match with ID:', id);

        const result = await db.query(
            `SELECT m.*, 
              ht.name as home_team_name,
              at.name as away_team_name,
              v.name as venue_name, v.address as venue_address,
              mr.home_score, mr.away_score, mr.winner_team_id,
              mr.is_approved, mr.submitted_by, mr.submitted_at
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN venues v ON m.venue_id = v.id
       LEFT JOIN match_results mr ON m.id = mr.match_id
       WHERE m.id = $1`,
            [id]
        );

        console.log('Match query result:', result.rows.length, 'rows');

        if (result.rows.length === 0) {
            console.log('Match not found with ID:', id);
            return res.status(404).json({ error: 'Match not found' });
        }

        console.log('Match found:', result.rows[0].home_team_name, 'vs', result.rows[0].away_team_name);
        res.json({ match: result.rows[0] });
    } catch (error) {
        console.error('Get match error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to get match', details: error.message });
    }
};

// Create match (admin only)
const createMatch = async (req, res) => {
    try {
        const {
            division_id, round, home_team_id, away_team_id,
            match_date, match_time, venue_id, race_to
        } = req.body;

        const result = await db.query(
            `INSERT INTO matches (division_id, round, home_team_id, away_team_id, match_date, match_time, venue_id, race_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [division_id, round, home_team_id, away_team_id, match_date, match_time, venue_id || 1, race_to || 13, req.user.id]
        );

        res.status(201).json({
            message: 'Match created successfully',
            match: result.rows[0],
        });
    } catch (error) {
        console.error('Create match error:', error);
        res.status(500).json({ error: 'Failed to create match' });
    }
};

// Submit match result
const submitResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { home_score, away_score } = req.body;

        // Determine winner
        let winner_team_id = null;
        if (home_score > away_score) {
            const matchResult = await db.query('SELECT home_team_id FROM matches WHERE id = $1', [id]);
            winner_team_id = matchResult.rows[0].home_team_id;
        } else if (away_score > home_score) {
            const matchResult = await db.query('SELECT away_team_id FROM matches WHERE id = $1', [id]);
            winner_team_id = matchResult.rows[0].away_team_id;
        }

        // Check if result already exists
        const existing = await db.query('SELECT id FROM match_results WHERE match_id = $1', [id]);

        if (existing.rows.length > 0) {
            // Update existing result
            const result = await db.query(
                `UPDATE match_results 
         SET home_score = $1, away_score = $2, winner_team_id = $3,
             submitted_by = $4, submitted_at = CURRENT_TIMESTAMP
         WHERE match_id = $5
         RETURNING *`,
                [home_score, away_score, winner_team_id, req.user.id, id]
            );

            // Update match status and scores
            await db.query(
                'UPDATE matches SET status = $1, home_score = $2, away_score = $3, winner_team_id = $4 WHERE id = $5',
                ['completed', home_score, away_score, winner_team_id, id]
            );

            res.json({
                message: 'Match result updated successfully',
                result: result.rows[0],
            });
        } else {
            // Insert new result
            const result = await db.query(
                `INSERT INTO match_results 
         (match_id, home_score, away_score, winner_team_id, submitted_by, is_approved)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
                [id, home_score, away_score, winner_team_id, req.user.id]
            );

            // Update match status and scores
            await db.query(
                'UPDATE matches SET status = $1, home_score = $2, away_score = $3, winner_team_id = $4 WHERE id = $5',
                ['completed', home_score, away_score, winner_team_id, id]
            );

            res.status(201).json({
                message: 'Match result submitted successfully',
                result: result.rows[0],
            });
        }
    } catch (error) {
        console.error('Submit result error:', error);
        res.status(500).json({ error: 'Failed to submit result' });
    }
};

// Get schedule by division and round
const getScheduleByRound = async (req, res) => {
    try {
        const { divisionId, round } = req.params;

        const result = await db.query(
            `SELECT m.*, 
              ht.name as home_team_name,
              at.name as away_team_name,
              v.name as venue_name,
              mr.home_score, mr.away_score, mr.winner_team_id
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN venues v ON m.venue_id = v.id
       LEFT JOIN match_results mr ON m.id = mr.match_id
       WHERE m.division_id = $1 AND m.round = $2
       ORDER BY m.match_time, m.id`,
            [divisionId, round]
        );

        res.json({
            division_id: divisionId,
            round: parseInt(round),
            matches: result.rows
        });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ error: 'Failed to get schedule' });
    }
};

// Generate round-robin fixtures
const generateFixtures = async (req, res) => {
    try {
        const { tournament_id, team_ids, start_date, rounds = 2 } = req.body;

        if (!tournament_id || !team_ids || !Array.isArray(team_ids) || team_ids.length < 2) {
            return res.status(400).json({ error: 'Invalid tournament or team data' });
        }

        // Get division_id from the first team (all teams should be in same division)
        const teamResult = await db.query('SELECT division_id FROM teams WHERE id = $1', [team_ids[0]]);
        if (teamResult.rows.length === 0) {
            return res.status(400).json({ error: 'Team not found' });
        }
        const division_id = teamResult.rows[0].division_id;

        // Delete existing fixtures for this division to prevent duplicates
        await db.query('DELETE FROM matches WHERE division_id = $1 AND status = $2', [division_id, 'scheduled']);

        // Get venue (Nick's Pool Lounge Parow)
        const venueResult = await db.query(
            "SELECT id FROM venues WHERE name ILIKE '%parow%' OR name ILIKE '%nick%' LIMIT 1"
        );
        const venue_id = venueResult.rows[0]?.id || 1;

        // Generate round-robin pairings
        const fixtures = generateRoundRobinPairings(team_ids, rounds);

        // Calculate match dates (every Sunday starting from start_date)
        const startDate = new Date(start_date);
        // Ensure start date is a Sunday
        const dayOfWeek = startDate.getDay();
        if (dayOfWeek !== 0) {
            startDate.setDate(startDate.getDate() + (7 - dayOfWeek));
        }

        const matches = [];
        let currentDate = new Date(startDate);

        // Group fixtures by week
        const fixturesByWeek = {};
        for (const fixture of fixtures) {
            const weekKey = `${fixture.round}-${fixture.week}`;
            if (!fixturesByWeek[weekKey]) {
                fixturesByWeek[weekKey] = [];
            }
            fixturesByWeek[weekKey].push(fixture);
        }

        // Schedule matches week by week
        const sortedWeeks = Object.keys(fixturesByWeek).sort((a, b) => {
            const [r1, w1] = a.split('-').map(Number);
            const [r2, w2] = b.split('-').map(Number);
            return r1 === r2 ? w1 - w2 : r1 - r2;
        });

        console.log(`Scheduling ${fixtures.length} matches over ${sortedWeeks.length} weeks`);

        for (const weekKey of sortedWeeks) {
            const weekFixtures = fixturesByWeek[weekKey];
            const dateStr = currentDate.toISOString().split('T')[0];

            console.log(`Week ${weekKey}: Scheduling ${weekFixtures.length} matches on ${dateStr}`);

            // Batch insert for this week (optional, but at least we can use Promise.all or just be faster)
            const insertPromises = weekFixtures.map(fixture => {
                return db.query(
                    `INSERT INTO matches (
                        division_id, round, home_team_id, away_team_id, 
                        match_date, match_time, venue_id, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
                    RETURNING *`,
                    [
                        division_id,
                        fixture.round,
                        fixture.home_team_id,
                        fixture.away_team_id,
                        dateStr,
                        '14:00:00',
                        venue_id
                    ]
                );
            });

            const results = await Promise.all(insertPromises);
            results.forEach(r => matches.push(r.rows[0]));

            // Move to next Sunday for next week's matches
            currentDate.setDate(currentDate.getDate() + 7);
        }

        console.log(`Generation complete: ${matches.length} matches created`);

        res.status(201).json({
            message: `Generated ${matches.length} fixtures successfully`,
            matches,
            total_weeks: sortedWeeks.length
        });
    } catch (error) {
        console.error('Generate fixtures error:', error);
        res.status(500).json({ error: 'Failed to generate fixtures: ' + error.message });
    }
};

// Round-robin pairing algorithm
function generateRoundRobinPairings(teamIds, rounds = 2) {
    const fixtures = [];
    let teams = [...teamIds];
    const n = teams.length;

    // Add a "bye" if odd number of teams
    if (n % 2 !== 0) {
        teams.push(null);
    }

    const totalTeams = teams.length;
    const matchesPerRound = totalTeams / 2;
    let globalWeek = 1;

    for (let round = 1; round <= rounds; round++) {
        // Reset teams for each round
        teams = [...teamIds];
        if (n % 2 !== 0) {
            teams.push(null);
        }

        for (let week = 0; week < totalTeams - 1; week++) {
            for (let match = 0; match < matchesPerRound; match++) {
                const home = teams[match];
                const away = teams[totalTeams - 1 - match];

                if (home !== null && away !== null) {
                    fixtures.push({
                        round: round,
                        week: globalWeek,
                        home_team_id: home,
                        away_team_id: away
                    });
                }
            }

            // Rotate teams (keep first team fixed)
            teams.splice(1, 0, teams.pop());
            globalWeek++;
        }
    }

    return fixtures;
}

// Submit frame result
const submitFrame = async (req, res) => {
    try {
        const { id } = req.params;
        const { frame_number, home_player_id, away_player_id, winner_player_id, break_score } = req.body;

        // Validate frame number
        if (frame_number < 1 || frame_number > 25) {
            return res.status(400).json({ error: 'Frame number must be between 1 and 25' });
        }

        // Validate winner is one of the players
        if (winner_player_id !== home_player_id && winner_player_id !== away_player_id) {
            return res.status(400).json({ error: 'Winner must be one of the playing players' });
        }

        // Get match to determine teams
        const matchResult = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
        if (matchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const match = matchResult.rows[0];

        // Insert or update frame
        const frameResult = await db.query(
            `INSERT INTO match_frames (match_id, frame_number, home_player_id, away_player_id, winner_player_id, break_score)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (match_id, frame_number)
             DO UPDATE SET home_player_id = $3, away_player_id = $4, winner_player_id = $5, break_score = $6
             RETURNING *`,
            [id, frame_number, home_player_id, away_player_id, winner_player_id, break_score]
        );

        // Calculate current match score
        const scoresResult = await db.query(
            `SELECT 
                SUM(CASE WHEN winner_player_id IN (
                    SELECT player_id FROM team_players WHERE team_id = $1
                ) THEN 1 ELSE 0 END) as home_score,
                SUM(CASE WHEN winner_player_id IN (
                    SELECT player_id FROM team_players WHERE team_id = $2
                ) THEN 1 ELSE 0 END) as away_score
             FROM match_frames
             WHERE match_id = $3`,
            [match.home_team_id, match.away_team_id, id]
        );

        const { home_score, away_score } = scoresResult.rows[0];

        // Update match score
        let status = 'in_progress';
        let winner_team_id = null;

        if (home_score >= 13) {
            status = 'completed';
            winner_team_id = match.home_team_id;
        } else if (away_score >= 13) {
            status = 'completed';
            winner_team_id = match.away_team_id;
        }

        await db.query(
            'UPDATE matches SET home_score = $1, away_score = $2, status = $3, winner_team_id = $4 WHERE id = $5',
            [home_score || 0, away_score || 0, status, winner_team_id, id]
        );

        res.json({
            message: 'Frame submitted successfully',
            frame: frameResult.rows[0],
            match_score: { home_score: home_score || 0, away_score: away_score || 0 },
            match_status: status
        });
    } catch (error) {
        console.error('Submit frame error:', error);
        res.status(500).json({ error: 'Failed to submit frame' });
    }
};

// Get frames for a match
const getMatchFrames = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT * FROM match_frames 
             WHERE match_id = $1 
             ORDER BY frame_number`,
            [id]
        );

        res.json({ frames: result.rows });
    } catch (error) {
        console.error('Get match frames error:', error);
        res.status(500).json({ error: 'Failed to get match frames' });
    }
};

// Get upcoming matches
const getUpcomingMatches = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const result = await db.query(
            `SELECT m.*,
                    ht.name as home_team_name,
                    at.name as away_team_name,
                    v.name as venue_name
             FROM matches m
             LEFT JOIN teams ht ON m.home_team_id = ht.id
             LEFT JOIN teams at ON m.away_team_id = at.id
             LEFT JOIN venues v ON m.venue_id = v.id
             WHERE m.match_date >= CURRENT_DATE AND m.status = 'scheduled'
             ORDER BY m.match_date, m.match_number
             LIMIT $1`,
            [limit]
        );

        res.json({ matches: result.rows });
    } catch (error) {
        console.error('Get upcoming matches error:', error);
        res.status(500).json({ error: 'Failed to get upcoming matches' });
    }
};

module.exports = {
    getMatches,
    getMatchById,
    createMatch,
    submitResult,
    getScheduleByRound,
    generateFixtures,
    submitFrame,
    getMatchFrames,
    getUpcomingMatches
};
