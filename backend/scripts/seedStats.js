const db = require('../src/config/database');

async function seedStats() {
    try {
        console.log('Connecting to database...');

        // 1. Find Lincoln Jordaan
        const lincolnRes = await db.query("SELECT id, first_name, last_name FROM players WHERE first_name ILIKE '%Lincoln%' OR last_name ILIKE '%Jordaan%' LIMIT 1");

        if (lincolnRes.rows.length === 0) {
            console.error('Could not find Lincoln Jordaan');
            process.exit(1);
        }

        const lincoln = lincolnRes.rows[0];
        console.log(`Found Player: ${lincoln.first_name} ${lincoln.last_name} (ID: ${lincoln.id})`);

        // 2. Find opponent (First player that is not Lincoln)
        const opponentRes = await db.query("SELECT id, first_name, last_name FROM players WHERE id != $1 LIMIT 1", [lincoln.id]);
        const opponent = opponentRes.rows[0];
        console.log(`Found Opponent: ${opponent.first_name} ${opponent.last_name} (ID: ${opponent.id})`);

        // 3. Find a match to use (completed or scheduled)
        const matchRes = await db.query("SELECT id FROM matches LIMIT 1");
        if (matchRes.rows.length === 0) {
            console.error('No matches found');
            process.exit(1);
        }
        const matchId = matchRes.rows[0].id;
        console.log(`Using Match ID: ${matchId}`);

        // 4. Insert 15 frames
        // Lincoln wins 12, Opponent wins 3
        console.log('Inserting frame results...');

        // Use client for transaction if needed, or just queries. 
        // db.query is a helper but doesn't support transaction state across calls unless we get a client.
        // For simplicity, we just run inserts. They are UPSERTs so safe to rerun.

        for (let i = 1; i <= 15; i++) { // Use first 15 frames
            const winnerId = i <= 12 ? lincoln.id : opponent.id;

            // Upsert frame result
            await db.query(`
                INSERT INTO frame_results (match_id, frame_number, home_player_id, away_player_id, winner_player_id, updated_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                ON CONFLICT (match_id, frame_number) 
                DO UPDATE SET winner_player_id = EXCLUDED.winner_player_id
            `, [matchId, i, lincoln.id, opponent.id, winnerId]);
        }

        console.log('Successfully inserted 15 frame results!');
        console.log('Lincoln Jordaan should now have 12 wins and be at the top of the leaderboard.');

    } catch (error) {
        console.error('Error seeding stats:', error);
    } finally {
        // Force exit because pool might keep open
        process.exit(0);
    }
}

seedStats();
