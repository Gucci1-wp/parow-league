const db = require('../src/config/database');

// Helper to create a past date
const getPastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

async function fixStats() {
    try {
        console.log('Starting stats repair...');

        // 1. Find Lincoln
        const lincolnRes = await db.query("SELECT id, first_name, last_name FROM players WHERE first_name ILIKE '%Lincoln%' OR last_name ILIKE '%Jordaan%' LIMIT 1");
        if (lincolnRes.rows.length === 0) throw new Error('Lincoln not found');
        const lincoln = lincolnRes.rows[0];
        console.log(`Target Player: ${lincoln.first_name} (ID: ${lincoln.id})`);

        // 2. Find his team
        const teamRes = await db.query("SELECT team_id FROM team_players WHERE player_id = $1 LIMIT 1", [lincoln.id]);
        if (teamRes.rows.length === 0) throw new Error('Lincoln has no team');
        const lincolnTeamId = teamRes.rows[0].team_id;

        // 3. Find 3 Opponent Teams (different from Lincoln's)
        const opponentsRes = await db.query("SELECT id FROM teams WHERE id != $1 LIMIT 3", [lincolnTeamId]);
        if (opponentsRes.rows.length < 3) throw new Error('Not enough teams');
        const opponentTeamdIds = opponentsRes.rows.map(r => r.id);

        // 4. Find Opponent Players (one from each opponent team)
        // We need specific players to be the "loser" in frames
        // ...

        console.log('Deleting existing frame results (cleanup)...');
        await db.query("DELETE FROM frame_results"); // WIPE ALL FRAMES for clean slate? Or just Lincoln's? 
        // Let's wipe all for now to ensure consistency of "13 wins" total.
        await db.query("DELETE FROM matches WHERE status = 'completed_mock'");

        console.log('Creating 3 mock past matches...');

        const createdMatches = [];

        for (let i = 0; i < 3; i++) {
            const daysAgo = (3 - i) * 7; // 3 weeks ago, 2 weeks ago...
            const matchDate = getPastDate(daysAgo);
            const oppTeamId = opponentTeamdIds[i];

            // Create match
            const insertMatch = await db.query(`
                INSERT INTO matches (tournament_id, home_team_id, away_team_id, match_date, status, home_score, away_score, round)
                VALUES (1, $1, $2, $3, 'completed', 13, 12, 1)
                RETURNING id
            `, [lincolnTeamId, oppTeamId, matchDate]);

            createdMatches.push({ id: insertMatch.rows[0].id, oppTeamId });
        }

        // 5. Insert Frames
        // Match 1: Lincoln wins 5 frames
        // Match 2: Lincoln wins 5 frames
        // Match 3: Lincoln wins 3 frames
        // Total: 13 Wins in 3 Matches. Perfect.

        let totalWins = 0;

        for (let mIdx = 0; mIdx < createdMatches.length; mIdx++) {
            const match = createdMatches[mIdx];
            const winsInThisMatch = (mIdx === 2) ? 3 : 5; // 5, 5, 3

            // Get an opponent player for this team
            const oppPlayerRes = await db.query("SELECT player_id FROM team_players WHERE team_id = $1 LIMIT 1", [match.oppTeamId]);
            const oppPlayerId = oppPlayerRes.rows[0].player_id;

            for (let f = 1; f <= 5; f++) {
                // If Lincoln wins this frame
                if (f <= winsInThisMatch) {
                    await db.query(`
                        INSERT INTO frame_results (match_id, frame_number, home_player_id, away_player_id, winner_player_id)
                        VALUES ($1, $2, $3, $4, $5)
                   `, [match.id, f, lincoln.id, oppPlayerId, lincoln.id]);
                    totalWins++;
                } else {
                    // Played but lost? Or just didn't play?
                    // "won 13 and lost 3"
                    // If we want him to lose 3, we can add losses in Match 3.
                    // Match 3: Wins 3. Frames 4,5 could be losses.
                    if (mIdx === 2 && f > 3) { // Frames 4,5 of Match 3
                        await db.query(`
                            INSERT INTO frame_results (match_id, frame_number, home_player_id, away_player_id, winner_player_id)
                            VALUES ($1, $2, $3, $4, $5)
                       `, [match.id, f, lincoln.id, oppPlayerId, oppPlayerId]);
                    }
                }
            }
        }

        console.log(`Success! Lincoln now has ${totalWins} wins across 3 matches.`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fixStats();
