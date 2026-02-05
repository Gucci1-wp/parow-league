const db = require('../config/database');

// GET /api/tournaments/:id/matches - Get all matches for a tournament
const getTournamentMatches = async (req, res) => {
    try {
        const { id } = req.params;

        const matchesResult = await db.query(`
            SELECT 
                tm.*,
                p1.first_name as participant1_first_name,
                p1.last_name as participant1_last_name,
                p2.first_name as participant2_first_name,
                p2.last_name as participant2_last_name,
                w.first_name as winner_first_name,
                w.last_name as winner_last_name
            FROM tournament_matches tm
            LEFT JOIN tournament_participants tp1 ON tm.participant1_id = tp1.id
            LEFT JOIN players p1 ON tp1.player_id = p1.id
            LEFT JOIN tournament_participants tp2 ON tm.participant2_id = tp2.id
            LEFT JOIN players p2 ON tp2.player_id = p2.id
            LEFT JOIN tournament_participants tw ON tm.winner_id = tw.id
            LEFT JOIN players w ON tw.player_id = w.id
            WHERE tm.tournament_id = $1
            ORDER BY tm.round, tm.match_number
        `, [id]);

        res.json({
            success: true,
            matches: matchesResult.rows
        });
    } catch (error) {
        console.error('Error fetching tournament matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
};

// GET /api/tournaments/:id/matches/:matchId/frames - Get frames for a match
const getMatchFrames = async (req, res) => {
    try {
        const { matchId } = req.params;

        const framesResult = await db.query(`
            SELECT 
                tf.*,
                p.first_name,
                p.last_name
            FROM tournament_frames tf
            LEFT JOIN tournament_participants tp ON tf.winner_id = tp.id
            LEFT JOIN players p ON tp.player_id = p.id
            WHERE tf.match_id = $1
            ORDER BY tf.frame_number
        `, [matchId]);

        res.json({
            success: true,
            frames: framesResult.rows
        });
    } catch (error) {
        console.error('Error fetching match frames:', error);
        res.status(500).json({ error: 'Failed to fetch frames' });
    }
};

// PUT /api/tournaments/:id/matches/:matchId/frames - Update frame results
const updateMatchFrames = async (req, res) => {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const { id, matchId } = req.params;
        const { frames } = req.body;

        if (!frames || !Array.isArray(frames)) {
            return res.status(400).json({ error: 'frames array is required' });
        }

        // Get match details
        const matchResult = await client.query(`
            SELECT tm.*, t.race_to, t.format
            FROM tournament_matches tm
            JOIN tournaments t ON tm.tournament_id = t.id
            WHERE tm.id = $1 AND tm.tournament_id = $2
        `, [matchId, id]);

        if (matchResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Match not found' });
        }

        const match = matchResult.rows[0];
        const race_to = match.race_to;

        // Delete existing frames and insert new ones
        await client.query('DELETE FROM tournament_frames WHERE match_id = $1', [matchId]);

        for (const frame of frames) {
            await client.query(`
                INSERT INTO tournament_frames (match_id, frame_number, winner_id)
                VALUES ($1, $2, $3)
            `, [matchId, frame.frame_number, frame.winner_id]);
        }

        // Count frames won by each participant
        const frameCountResult = await client.query(`
            SELECT 
                winner_id,
                COUNT(*) as frames_won
            FROM tournament_frames
            WHERE match_id = $1
            GROUP BY winner_id
        `, [matchId]);

        let participant1_frames = 0;
        let participant2_frames = 0;
        let winner_id = null;
        let match_status = 'in-progress';

        for (const row of frameCountResult.rows) {
            if (row.winner_id === match.participant1_id) {
                participant1_frames = parseInt(row.frames_won);
            } else if (row.winner_id === match.participant2_id) {
                participant2_frames = parseInt(row.frames_won);
            }
        }

        // Determine winner if race_to is reached
        if (participant1_frames >= race_to) {
            winner_id = match.participant1_id;
            match_status = 'completed';
        } else if (participant2_frames >= race_to) {
            winner_id = match.participant2_id;
            match_status = 'completed';
        }

        // Update match
        await client.query(`
            UPDATE tournament_matches
            SET 
                participant1_frames = $1,
                participant2_frames = $2,
                winner_id = $3,
                status = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [participant1_frames, participant2_frames, winner_id, match_status, matchId]);

        // If match is completed, update standings (for round robin) or advance winner (for elimination)
        if (match_status === 'completed') {
            if (match.format === 'round-robin') {
                await updateRoundRobinStandings(client, id, matchId, match.participant1_id, match.participant2_id, winner_id, participant1_frames, participant2_frames);
            } else if (match.format === 'single-elimination' && match.next_match_id) {
                await advanceWinnerToNextMatch(client, match.next_match_id, winner_id, match.match_number);
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Frames updated successfully',
            match_status,
            winner_id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating match frames:', error);
        res.status(500).json({ error: 'Failed to update frames' });
    } finally {
        client.release();
    }
};

// Helper: Update round robin standings
async function updateRoundRobinStandings(client, tournamentId, matchId, participant1_id, participant2_id, winner_id, participant1_frames, participant2_frames) {
    const loser_id = winner_id === participant1_id ? participant2_id : participant1_id;

    // Update winner's standings
    await client.query(`
        UPDATE tournament_standings
        SET 
            matches_played = matches_played + 1,
            wins = wins + 1,
            frames_won = frames_won + $1,
            frames_lost = frames_lost + $2,
            frame_difference = frame_difference + ($1 - $2),
            updated_at = CURRENT_TIMESTAMP
        WHERE tournament_id = $3 AND participant_id = $4
    `, [
        winner_id === participant1_id ? participant1_frames : participant2_frames,
        winner_id === participant1_id ? participant2_frames : participant1_frames,
        tournamentId,
        winner_id
    ]);

    // Update loser's standings
    await client.query(`
        UPDATE tournament_standings
        SET 
            matches_played = matches_played + 1,
            losses = losses + 1,
            frames_won = frames_won + $1,
            frames_lost = frames_lost + $2,
            frame_difference = frame_difference + ($1 - $2),
            updated_at = CURRENT_TIMESTAMP
        WHERE tournament_id = $3 AND participant_id = $4
    `, [
        loser_id === participant1_id ? participant1_frames : participant2_frames,
        loser_id === participant1_id ? participant2_frames : participant1_frames,
        tournamentId,
        loser_id
    ]);

    // Recalculate ranks
    await client.query(`
        UPDATE tournament_standings ts
        SET rank = subquery.rank
        FROM (
            SELECT 
                id,
                ROW_NUMBER() OVER (
                    ORDER BY wins DESC, frame_difference DESC, frames_won DESC
                ) as rank
            FROM tournament_standings
            WHERE tournament_id = $1
        ) AS subquery
        WHERE ts.id = subquery.id
    `, [tournamentId]);
}

// Helper: Advance winner to next match in elimination bracket
async function advanceWinnerToNextMatch(client, nextMatchId, winnerId, matchNumber) {
    // Determine slot based on match matchNumber (Odd -> P1, Even -> P2)
    // This assumes standard bracket ordering (Match 1+2 -> NextMatch)
    const slot = matchNumber % 2 !== 0 ? 'participant1_id' : 'participant2_id';

    await client.query(
        `UPDATE tournament_matches SET ${slot} = $1 WHERE id = $2`,
        [winnerId, nextMatchId]
    );
}

// GET /api/tournaments/:id/bracket - Get bracket structure
const getTournamentBracket = async (req, res) => {
    try {
        const { id } = req.params;

        // Get tournament format
        const tournamentResult = await db.query(
            'SELECT format FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const format = tournamentResult.rows[0].format;

        if (format !== 'single-elimination' && format !== 'double-elimination') {
            return res.status(400).json({
                error: 'Bracket view only available for elimination tournaments'
            });
        }

        // Get all matches with participant details
        const matchesResult = await db.query(`
            SELECT 
                tm.*,
                p1.first_name as participant1_first_name,
                p1.last_name as participant1_last_name,
                p2.first_name as participant2_first_name,
                p2.last_name as participant2_last_name
            FROM tournament_matches tm
            LEFT JOIN tournament_participants tp1 ON tm.participant1_id = tp1.id
            LEFT JOIN players p1 ON tp1.player_id = p1.id
            LEFT JOIN tournament_participants tp2 ON tm.participant2_id = tp2.id
            LEFT JOIN players p2 ON tp2.player_id = p2.id
            WHERE tm.tournament_id = $1
            ORDER BY tm.round, tm.match_number
        `, [id]);

        // Group matches by round
        const bracket = {};
        for (const match of matchesResult.rows) {
            if (!bracket[match.round]) {
                bracket[match.round] = [];
            }
            bracket[match.round].push(match);
        }

        res.json({
            success: true,
            bracket
        });
    } catch (error) {
        console.error('Error fetching tournament bracket:', error);
        res.status(500).json({ error: 'Failed to fetch bracket' });
    }
};

// GET /api/tournaments/:id/standings - Get tournament standings
const getTournamentStandings = async (req, res) => {
    try {
        const { id } = req.params;

        const standingsResult = await db.query(`
            SELECT 
                ts.*,
                p.first_name,
                p.last_name,
                (
                    SELECT t.name 
                    FROM teams t 
                    JOIN team_players tp ON t.id = tp.team_id 
                    WHERE tp.player_id = p.id 
                    LIMIT 1
                ) as team_name
            FROM tournament_standings ts
            JOIN tournament_participants tp ON ts.participant_id = tp.id
            JOIN players p ON tp.player_id = p.id
            WHERE ts.tournament_id = $1
            ORDER BY ts.rank NULLS LAST, ts.wins DESC, ts.frame_difference DESC
        `, [id]);

        res.json({
            success: true,
            standings: standingsResult.rows
        });
    } catch (error) {
        console.error('Error fetching tournament standings:', error);
        res.status(500).json({ error: 'Failed to fetch standings' });
    }
};

module.exports = {
    getTournamentMatches,
    getMatchFrames,
    updateMatchFrames,
    getTournamentBracket,
    getTournamentStandings
};
