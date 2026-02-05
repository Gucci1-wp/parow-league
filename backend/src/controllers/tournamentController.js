const db = require('../config/database');

// Generate unique URL slug for tournament
function generateSlug(name) {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
}

// GET /api/tournaments - List all tournaments
const getTournaments = async (req, res) => {
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

        const result = await db.query(query, params);

        res.json({
            success: true,
            tournaments: result.rows
        });
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
};

// GET /api/tournaments/:id - Get tournament details
const getTournamentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get tournament details
        const tournamentResult = await db.query(`
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
        const participantsResult = await db.query(`
            SELECT 
                tp.*,
                p.first_name,
                p.last_name,
                t.name as team_name
            FROM tournament_participants tp
            JOIN players p ON tp.player_id = p.id
            LEFT JOIN team_players tpl ON p.id = tpl.player_id
            LEFT JOIN teams t ON tpl.team_id = t.id
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
};

// POST /api/tournaments - Create new tournament
const createTournament = async (req, res) => {
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
        const leagueCheck = await db.query('SELECT id FROM leagues WHERE id = $1', [league_id]);
        if (leagueCheck.rows.length === 0) {
            return res.status(404).json({ error: 'League not found' });
        }

        // Generate unique URL slug
        const public_url_slug = generateSlug(name);

        const result = await db.query(`
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
};

// PUT /api/tournaments/:id - Update tournament
const updateTournament = async (req, res) => {
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
        const tournamentCheck = await db.query(
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

        const result = await db.query(`
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
};

// DELETE /api/tournaments/:id - Delete tournament
const deleteTournament = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if tournament exists
        const tournamentCheck = await db.query(
            'SELECT * FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Validate access? (Already done by requireAdmin middleware)

        // Manual cascade delete to be safe
        await db.query('BEGIN');

        try {
            // Delete frames
            await db.query(`
                DELETE FROM tournament_frames 
                WHERE match_id IN (SELECT id FROM tournament_matches WHERE tournament_id = $1)
            `, [id]);

            // Delete matches
            await db.query('DELETE FROM tournament_matches WHERE tournament_id = $1', [id]);

            // Delete standings
            await db.query('DELETE FROM tournament_standings WHERE tournament_id = $1', [id]);

            // Delete participants
            await db.query('DELETE FROM tournament_participants WHERE tournament_id = $1', [id]);

            // Delete tournament
            await db.query('DELETE FROM tournaments WHERE id = $1', [id]);

            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Tournament deleted successfully'
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({ error: 'Failed to delete tournament' });
    }
};

// POST /api/tournaments/:id/reset - Reset tournament to draft
const resetTournament = async (req, res) => {
    try {
        const { id } = req.params;

        const tournamentCheck = await db.query(
            'SELECT status FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        await db.query('BEGIN');

        try {
            // Delete frames
            await db.query(`
                DELETE FROM tournament_frames 
                WHERE match_id IN (SELECT id FROM tournament_matches WHERE tournament_id = $1)
            `, [id]);

            // Delete matches
            await db.query('DELETE FROM tournament_matches WHERE tournament_id = $1', [id]);

            // Delete standings
            await db.query('DELETE FROM tournament_standings WHERE tournament_id = $1', [id]);

            // Reset status to draft
            await db.query("UPDATE tournaments SET status = 'draft', start_date = NULL WHERE id = $1", [id]);

            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Tournament reset successfully'
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error resetting tournament:', error);
        res.status(500).json({ error: 'Failed to reset tournament' });
    }
};

// POST /api/tournaments/:id/participants - Add participants
const addParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const { player_ids } = req.body;

        if (!player_ids || !Array.isArray(player_ids) || player_ids.length === 0) {
            return res.status(400).json({ error: 'player_ids array is required' });
        }

        // Check tournament status
        const tournamentCheck = await db.query(
            'SELECT status, league_id FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournamentCheck.rows[0].status !== 'draft') {
            return res.status(400).json({
                error: 'Can only add participants to tournaments in draft status'
            });
        }

        const league_id = tournamentCheck.rows[0].league_id;

        // Verify all players belong to teams in the tournament's league
        const playersCheck = await db.query(`
            SELECT DISTINCT p.id
            FROM players p
            JOIN team_players tp ON p.id = tp.player_id
            JOIN teams t ON tp.team_id = t.id
            JOIN divisions d ON t.division_id = d.id
            JOIN seasons s ON d.season_id = s.id
            WHERE p.id = ANY($1) AND s.league_id = $2
        `, [player_ids, league_id]);

        if (playersCheck.rows.length !== player_ids.length) {
            return res.status(400).json({
                error: 'Some players do not belong to teams in this tournament\'s league'
            });
        }

        // Add participants
        const participants = [];
        for (const player_id of player_ids) {
            try {
                const result = await db.query(`
                    INSERT INTO tournament_participants (tournament_id, player_id)
                    VALUES ($1, $2)
                    RETURNING *
                `, [id, player_id]);
                participants.push(result.rows[0]);
            } catch (error) {
                // Skip if already exists (unique constraint)
                if (error.code !== '23505') {
                    throw error;
                }
            }
        }

        res.status(201).json({
            success: true,
            participants
        });
    } catch (error) {
        console.error('Error adding participants:', error);
        res.status(500).json({ error: 'Failed to add participants' });
    }
};

// DELETE /api/tournaments/:id/participants/:participantId - Remove participant
const removeParticipant = async (req, res) => {
    try {
        const { id, participantId } = req.params;

        // Check tournament status
        const tournamentCheck = await db.query(
            'SELECT status FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournamentCheck.rows[0].status !== 'draft') {
            return res.status(400).json({
                error: 'Can only remove participants from tournaments in draft status'
            });
        }

        await db.query(
            'DELETE FROM tournament_participants WHERE id = $1 AND tournament_id = $2',
            [participantId, id]
        );

        res.json({
            success: true,
            message: 'Participant removed successfully'
        });
    } catch (error) {
        console.error('Error removing participant:', error);
        res.status(500).json({ error: 'Failed to remove participant' });
    }
};

// POST /api/tournaments/:id/participants/shuffle - Shuffle seeds
const shuffleSeeds = async (req, res) => {
    try {
        const { id } = req.params;

        // Get all participants
        const participantsResult = await db.query(
            'SELECT id FROM tournament_participants WHERE tournament_id = $1',
            [id]
        );

        const participants = participantsResult.rows;

        // Shuffle and assign new seeds
        const shuffled = participants.sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffled.length; i++) {
            await db.query(
                'UPDATE tournament_participants SET seed = $1 WHERE id = $2',
                [i + 1, shuffled[i].id]
            );
        }

        res.json({
            success: true,
            message: 'Seeds shuffled successfully'
        });
    } catch (error) {
        console.error('Error shuffling seeds:', error);
        res.status(500).json({ error: 'Failed to shuffle seeds' });
    }
};

// POST /api/tournaments/:id/start - Start tournament and generate bracket
const generateBracket = async (req, res) => {
    try {
        const { id } = req.params;

        // Get tournament details
        const tournamentResult = await db.query(
            'SELECT * FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const tournament = tournamentResult.rows[0];

        if (tournament.status !== 'draft') {
            return res.status(400).json({
                error: 'Tournament has already been started'
            });
        }

        // Get participants
        const participantsResult = await db.query(
            'SELECT * FROM tournament_participants WHERE tournament_id = $1 ORDER BY seed NULLS LAST, id',
            [id]
        );

        const participants = participantsResult.rows;

        if (participants.length < 2) {
            return res.status(400).json({
                error: 'Need at least 2 participants to start tournament'
            });
        }

        // Generate matches based on format
        if (tournament.format === 'single-elimination') {
            await generateSingleEliminationBracket(id, participants);
        } else if (tournament.format === 'round-robin') {
            await generateRoundRobinFixtures(id, participants);
        }

        // Update tournament status
        await db.query(
            'UPDATE tournaments SET status = $1 WHERE id = $2',
            ['in-progress', id]
        );

        res.json({
            success: true,
            message: 'Tournament started and bracket generated successfully'
        });
    } catch (error) {
        console.error('Error generating bracket:', error);
        res.status(500).json({ error: 'Failed to generate bracket' });
    }
};

// Helper: Generate single elimination bracket
// Helper: Generate single elimination bracket
async function generateSingleEliminationBracket(tournamentId, participants) {
    const participantCount = participants.length;
    // Calculate total rounds needed (power of 2)
    const rounds = Math.ceil(Math.log2(participantCount));
    const bracketSize = Math.pow(2, rounds);

    // 1. Generate standard seeding indices for Round 1
    // e.g. for 8: [0, 7, 3, 4, 1, 6, 2, 5] (indices into 0-based sorted seeds)
    const seedIndices = getSeedingOrder(bracketSize);

    // 2. Generate matches Bottom-Up (Finals -> Semis -> ... -> Round 1)
    // This allows us to easily link matches to their 'next_match_id'
    let nextRoundMatchIds = []; // Stores IDs of the matches in the round "above" (next round)

    for (let r = rounds; r >= 1; r--) {
        const matchesInRound = Math.pow(2, rounds - r); // 1, 2, 4, 8...
        const currentRoundMatchIds = [];

        for (let m = 0; m < matchesInRound; m++) {
            const matchNumber = m + 1;

            // Determine next match ID (if not final)
            // Loops through matches 0..N. Match 0 and 1 go to NextMatch 0. Match 2 and 3 go to NextMatch 1.
            const nextMatchId = (r < rounds) ? nextRoundMatchIds[Math.floor(m / 2)] : null;

            // Prepare match data
            let p1Id = null;
            let p2Id = null;
            let status = 'pending';
            let winnerId = null;

            // If this is Round 1, assign participants based on seeding
            if (r === 1) {
                // Get seed indices for this match
                // Match 0 uses seedIndices[0] and seedIndices[1]
                // Match 1 uses seedIndices[2] and seedIndices[3]
                const idx1 = seedIndices[m * 2];
                const idx2 = seedIndices[m * 2 + 1];

                const p1 = participants[idx1]; // Might be undefined if idx >= participantCount (though seeding usually handles Byes as "high seed")
                // Wait, seedIndices goes up to bracketSize-1. 
                // If participants.length < bracketSize, any index >= length is a Bye.

                // Logic:
                // p1 is from the top half of seeds usually? No, standard seeding mixes.
                // If idx < participantCount, it's a player. Else it's a Bye.

                if (idx1 < participantCount) p1Id = participants[idx1].id;
                if (idx2 < participantCount) p2Id = participants[idx2].id;

                // Handle Byes immediately
                if (!p1Id && !p2Id) {
                    status = 'bye'; // Should not happen in standard filled bracket
                } else if (p1Id && !p2Id) {
                    status = 'completed'; // Auto-win
                    winnerId = p1Id;
                } else if (!p1Id && p2Id) {
                    status = 'completed';
                    winnerId = p2Id;
                }
            }

            // Insert Match
            const result = await db.query(`
                INSERT INTO tournament_matches (
                    tournament_id, round, match_number,
                    participant1_id, participant2_id,
                    winner_id, status, next_match_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [
                tournamentId,
                r,
                matchNumber,
                p1Id,
                p2Id,
                winnerId,
                status,
                nextMatchId
            ]);

            currentRoundMatchIds.push(result.rows[0].id);

            // If we have an auto-winner (Bye) in Round 1, we must propagate them to the next match
            if (winnerId && nextMatchId) {
                await advanceWinnerToNextMatchDirectly(nextMatchId, winnerId);
            }
        }

        // Update nextRoundMatchIds for the iteration (moving down to earlier round)
        nextRoundMatchIds = currentRoundMatchIds;
    }
}

// Helper: seeding order
function getSeedingOrder(size) {
    if (size === 2) return [0, 1];

    const half = getSeedingOrder(size / 2);
    const result = [];

    // For each pair in the half-size bracket, generate the new pair
    // Rule: Pair sum is size - 1 (for 0-based index)
    // Eg for size 4 (0,1,2,3): 1 vs 4, 2 vs 3. 
    // 0-based: 0 vs 3, 1 vs 2.
    // Logic: Sequence preserves high seed position.
    // [0, 1] -> [0, 3, 1, 2]

    for (let i = 0; i < half.length; i++) {
        result.push(half[i]);
        result.push(size - 1 - half[i]);
    }

    return result;
}

// Helper: Advance winner (used during generation for byes)
async function advanceWinnerToNextMatchDirectly(nextMatchId, winnerId) {
    // Determine which slot to fill
    const matchRes = await db.query('SELECT participant1_id, participant2_id FROM tournament_matches WHERE id = $1', [nextMatchId]);
    if (matchRes.rows.length === 0) return;

    const match = matchRes.rows[0];
    if (!match.participant1_id) {
        await db.query('UPDATE tournament_matches SET participant1_id = $1 WHERE id = $2', [winnerId, nextMatchId]);
    } else {
        await db.query('UPDATE tournament_matches SET participant2_id = $1 WHERE id = $2', [winnerId, nextMatchId]);
    }
}

// Helper: Generate round robin fixtures
async function generateRoundRobinFixtures(tournamentId, participants) {
    const n = participants.length;

    // Circle Method algorithm
    const ids = participants.map(p => p.id);
    // Add dummy if odd number of participants
    if (ids.length % 2 !== 0) {
        ids.push(null); // Null represents a Bye
    }

    const count = ids.length;
    const rounds = count - 1;
    const half = count / 2;
    const workingIds = [...ids];
    let matchNumber = 1;
    let round = 1;

    for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < half; i++) {
            const p1 = workingIds[i];
            const p2 = workingIds[count - 1 - i];

            // Only insert real matches (skip byes)
            if (p1 && p2) {
                await db.query(`
                    INSERT INTO tournament_matches (
                        tournament_id, round, match_number,
                        participant1_id, participant2_id, status
                    )
                    VALUES ($1, $2, $3, $4, $5, 'pending')
                `, [
                    tournamentId,
                    round,
                    matchNumber++,
                    p1,
                    p2
                ]);
            }
        }

        // Rotate: Keep first element fixed, rotate the rest clockwise
        // [0, 1, 2, 3] -> pop 3 -> [0, 3, 1, 2]
        const last = workingIds.pop();
        workingIds.splice(1, 0, last);

        round++;
    }

    // Initialize standings
    for (const participant of participants) {
        await db.query(`
            INSERT INTO tournament_standings (tournament_id, participant_id)
            VALUES ($1, $2)
        `, [tournamentId, participant.id]);
    }
}

module.exports = {
    getTournaments,
    getTournamentById,
    createTournament,
    updateTournament,
    deleteTournament,
    addParticipants,
    removeParticipant,
    shuffleSeeds,
    generateBracket,
    resetTournament
};
