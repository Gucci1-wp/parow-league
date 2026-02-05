const db = require('../src/config/database');

async function cleanupStats() {
    try {
        console.log('Cleaning up data before league start (Feb 8 2026)...');

        // Define the cutoff date
        const LEAGUE_START_DATE = '2026-02-08';

        // 1. Find matches to delete
        const matchesToDeleteRes = await db.query(
            "SELECT id, match_date FROM matches WHERE match_date < $1",
            [LEAGUE_START_DATE]
        );

        const matchIds = matchesToDeleteRes.rows.map(m => m.id);

        if (matchIds.length === 0) {
            console.log('No matches found before start date.');
            process.exit(0);
        }

        console.log(`Found ${matchIds.length} matches to delete (IDs: ${matchIds.join(', ')}).`);

        // 2. Delete linked data
        await db.query('BEGIN');

        // Delete frame results
        const framesRes = await db.query(
            "DELETE FROM frame_results WHERE match_id = ANY($1) RETURNING id",
            [matchIds]
        );
        console.log(`Deleted ${framesRes.rowCount} frame results.`);

        // Delete match_lineups (if any)
        const lineupRes = await db.query(
            "DELETE FROM match_lineups WHERE match_id = ANY($1) RETURNING id",
            [matchIds]
        );
        console.log(`Deleted ${lineupRes.rowCount} lineup entries.`);

        // Delete match_results (final scores)
        const resultsRes = await db.query(
            "DELETE FROM match_results WHERE match_id = ANY($1) RETURNING id",
            [matchIds]
        );
        console.log(`Deleted ${resultsRes.rowCount} match results.`);

        // Delete matches
        const delMatchesRes = await db.query(
            "DELETE FROM matches WHERE id = ANY($1) RETURNING id",
            [matchIds]
        );
        console.log(`Deleted ${delMatchesRes.rowCount} matches.`);

        await db.query('COMMIT');

        console.log('Cleanup complete! Lincoln Jordaan and others should now have clean stats for the fresh season.');

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Cleanup failed:', error);
    } finally {
        process.exit(0);
    }
}

cleanupStats();
