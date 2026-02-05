const db = require('../config/database');

// Get all frames for a match
const getMatchFrames = async (req, res) => {
    try {
        const { matchId } = req.params;

        const result = await db.query(
            `SELECT 
                fr.*,
                hp.first_name as home_player_first_name,
                hp.last_name as home_player_last_name,
                ap.first_name as away_player_first_name,
                ap.last_name as away_player_last_name,
                wp.first_name as winner_first_name,
                wp.last_name as winner_last_name
            FROM frame_results fr
            LEFT JOIN players hp ON fr.home_player_id = hp.id
            LEFT JOIN players ap ON fr.away_player_id = ap.id
            LEFT JOIN players wp ON fr.winner_player_id = wp.id
            WHERE fr.match_id = $1
            ORDER BY fr.frame_number`,
            [matchId]
        );

        res.json({ frames: result.rows });
    } catch (error) {
        console.error('Get match frames error:', error);
        res.status(500).json({ error: 'Failed to get match frames' });
    }
};

// Save/update frame results (batch operation)
const saveFrameResults = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { frames } = req.body; // Array of frame objects

        console.log(`Saving ${frames.length} frames for match ${matchId}`);

        // Start transaction
        await db.query('BEGIN');

        for (const frame of frames) {
            const { frame_number, home_player_id, away_player_id, winner_player_id } = frame;

            // Upsert frame result
            await db.query(
                `INSERT INTO frame_results 
                    (match_id, frame_number, home_player_id, away_player_id, winner_player_id, updated_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                ON CONFLICT (match_id, frame_number)
                DO UPDATE SET
                    home_player_id = EXCLUDED.home_player_id,
                    away_player_id = EXCLUDED.away_player_id,
                    winner_player_id = EXCLUDED.winner_player_id,
                    updated_at = CURRENT_TIMESTAMP`,
                [matchId, frame_number, home_player_id, away_player_id, winner_player_id]
            );
        }

        // Calculate match score from frames directly without relying on match_lineups
        // We trust home_player_id and away_player_id in the frame_results
        const scoreResult = await db.query(
            `SELECT 
                SUM(CASE WHEN winner_player_id = home_player_id THEN 1 ELSE 0 END) as home_score,
                SUM(CASE WHEN winner_player_id = away_player_id THEN 1 ELSE 0 END) as away_score
            FROM frame_results
            WHERE match_id = $1 AND winner_player_id IS NOT NULL`,
            [matchId]
        );

        const { home_score, away_score } = scoreResult.rows[0];

        // Update match scores and status
        if (home_score !== null && away_score !== null) {
            // Check if match is actually finished (First to 13 wins, or all 25 frames played)
            // Using 13 as threshold for 25-frame match
            const hScoreInt = parseInt(home_score);
            const aScoreInt = parseInt(away_score);
            const isFinished = hScoreInt >= 13 || aScoreInt >= 13 || (hScoreInt + aScoreInt >= 25);
            const status = isFinished ? 'completed' : 'in_progress';

            const winner_team_id = hScoreInt > aScoreInt
                ? (await db.query('SELECT home_team_id FROM matches WHERE id = $1', [matchId])).rows[0].home_team_id
                : aScoreInt > hScoreInt
                    ? (await db.query('SELECT away_team_id FROM matches WHERE id = $1', [matchId])).rows[0].away_team_id
                    : null;

            await db.query(
                `UPDATE matches 
                SET home_score = $1, away_score = $2, winner_team_id = $3, status = $4
                WHERE id = $5`,
                [home_score, away_score, winner_team_id, status, matchId]
            );

            // Also update match_results table
            const existingResult = await db.query(
                'SELECT id FROM match_results WHERE match_id = $1',
                [matchId]
            );

            if (existingResult.rows.length > 0) {
                await db.query(
                    `UPDATE match_results 
                    SET home_score = $1, away_score = $2, winner_team_id = $3, submitted_at = CURRENT_TIMESTAMP
                    WHERE match_id = $4`,
                    [home_score, away_score, winner_team_id, matchId]
                );
            } else {
                await db.query(
                    `INSERT INTO match_results (match_id, home_score, away_score, winner_team_id, submitted_by, is_approved)
                    VALUES ($1, $2, $3, $4, $5, true)`,
                    [matchId, home_score, away_score, winner_team_id, req.user.id]
                );
            }
        }

        await db.query('COMMIT');

        res.json({
            message: 'Frame results saved successfully',
            home_score,
            away_score
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Save frame results error:', error);
        res.status(500).json({ error: 'Failed to save frame results' });
    }
};

// Get match lineup
const getMatchLineup = async (req, res) => {
    try {
        const { matchId } = req.params;

        const result = await db.query(
            `SELECT 
                ml.*,
                p.first_name,
                p.last_name,
                t.name as team_name
            FROM match_lineups ml
            JOIN players p ON ml.player_id = p.id
            JOIN teams t ON ml.team_id = t.id
            WHERE ml.match_id = $1
            ORDER BY ml.team_id, ml.is_reserve, ml.lineup_position`,
            [matchId]
        );

        res.json({ lineup: result.rows });
    } catch (error) {
        console.error('Get match lineup error:', error);
        res.status(500).json({ error: 'Failed to get match lineup' });
    }
};

// Save match lineup
const saveMatchLineup = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { lineup } = req.body; // Array of { team_id, player_id, is_reserve, lineup_position }

        console.log(`Saving lineup for match ${matchId}:`, lineup);

        await db.query('BEGIN');

        // Delete existing lineup
        await db.query('DELETE FROM match_lineups WHERE match_id = $1', [matchId]);

        // Insert new lineup
        for (const player of lineup) {
            await db.query(
                `INSERT INTO match_lineups (match_id, team_id, player_id, is_reserve, lineup_position)
                VALUES ($1, $2, $3, $4, $5)`,
                [matchId, player.team_id, player.player_id, player.is_reserve || false, player.lineup_position]
            );
        }

        await db.query('COMMIT');

        res.json({ message: 'Lineup saved successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Save match lineup error:', error);
        res.status(500).json({ error: 'Failed to save lineup' });
    }
};

// Get available players for a team
const getTeamPlayers = async (req, res) => {
    try {
        const { teamId } = req.params;

        const result = await db.query(
            `SELECT p.id, p.first_name, p.last_name
            FROM players p
            JOIN team_players tp ON p.id = tp.player_id
            WHERE tp.team_id = $1 AND tp.is_active = true AND p.is_active = true
            ORDER BY p.last_name, p.first_name`,
            [teamId]
        );

        res.json({ players: result.rows });
    } catch (error) {
        console.error('Get team players error:', error);
        res.status(500).json({ error: 'Failed to get team players' });
    }
};

module.exports = {
    getMatchFrames,
    saveFrameResults,
    getMatchLineup,
    saveMatchLineup,
    getTeamPlayers,
};
