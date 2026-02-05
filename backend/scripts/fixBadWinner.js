const db = require('../src/config/database');

async function fixWinner() {
    try {
        console.log('Fixing incorrect winners for completed matches...');

        // Find matches where the winner is wrong based on score
        const matchesRes = await db.query(`
            SELECT m.id, m.home_score, m.away_score, m.winner_team_id, m.home_team_id, m.away_team_id,
                   ht.name as home_name, at.name as away_name
            FROM matches m
            JOIN teams ht ON m.home_team_id = ht.id
            JOIN teams at ON m.away_team_id = at.id
            WHERE m.status = 'completed'
        `);

        for (const m of matchesRes.rows) {
            const h = parseInt(m.home_score);
            const a = parseInt(m.away_score);

            let correctWinnerId = null;
            if (h > a) correctWinnerId = m.home_team_id;
            else if (a > h) correctWinnerId = m.away_team_id;

            if (m.winner_team_id !== correctWinnerId) {
                console.log(`Found Mismatch Match ${m.id}: Score ${h}-${a}. Current Winner: ${m.winner_team_id}, Correct: ${correctWinnerId}`);

                // Update matches table
                await db.query(
                    "UPDATE matches SET winner_team_id = $1 WHERE id = $2",
                    [correctWinnerId, m.id]
                );

                // Update match_results table
                await db.query(
                    "UPDATE match_results SET winner_team_id = $1 WHERE match_id = $2",
                    [correctWinnerId, m.id]
                );

                console.log(`FIXED Match ${m.id}`);
            }
        }

        console.log('Winner fix scan complete.');

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        process.exit(0);
    }
}

fixWinner();
