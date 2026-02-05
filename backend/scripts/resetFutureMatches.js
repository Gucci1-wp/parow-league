const db = require('../src/config/database');

async function resetFutureMatches() {
    try {
        console.log('Resetting all matches from Feb 8, 2026 onwards to SCHEDULED...');

        const CUTOFF_DATE = '2026-02-08';

        // 1. Identify matches affected
        const matchesRes = await db.query(
            "SELECT id, match_date, status FROM matches WHERE match_date >= $1 AND status = 'completed'",
            [CUTOFF_DATE]
        );

        const matchIds = matchesRes.rows.map(m => m.id);

        if (matchIds.length === 0) {
            console.log('No future completed matches found. Stats should be clean.');
            process.exit(0);
        }

        console.log(`Found ${matchIds.length} matches to reset (IDs: ${matchIds.join(', ')}).`);

        await db.query('BEGIN');

        // 2. Delete frame results
        const framesRes = await db.query(
            "DELETE FROM frame_results WHERE match_id = ANY($1)",
            [matchIds]
        );
        console.log(`Deleted ${framesRes.rowCount} frame results.`);

        // 3. Delete match_results
        const resultsRes = await db.query(
            "DELETE FROM match_results WHERE match_id = ANY($1)",
            [matchIds]
        );
        console.log(`Deleted ${resultsRes.rowCount} match_results entries.`);

        // 4. Delete match_lineups
        const lineupRes = await db.query(
            "DELETE FROM match_lineups WHERE match_id = ANY($1)",
            [matchIds]
        );
        console.log(`Deleted ${lineupRes.rowCount} match_lineups entries.`);

        // 5. Reset matches to scheduled
        const updateRes = await db.query(`
            UPDATE matches 
            SET status = 'scheduled',
                home_score = 0,
                away_score = 0,
                winner_team_id = NULL
            WHERE id = ANY($1)
        `, [matchIds]);
        console.log(`Reset ${updateRes.rowCount} matches to 'scheduled' status.`);

        await db.query('COMMIT');

        console.log('Future matches reset successfully. Stats should now be empty for Dragons 1 (unless they have current games).');

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Reset failed:', error);
    } finally {
        process.exit(0);
    }
}

resetFutureMatches();
