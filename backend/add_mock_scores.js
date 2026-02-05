const db = require('./src/config/database');

async function addMockScores() {
    try {
        console.log('Starting to add mock scores...\n');

        // Get some matches to add scores to
        const matchesResult = await db.query(`
            SELECT m.id, m.home_team_id, m.away_team_id, 
                   ht.name as home_team, at.name as away_team
            FROM matches m
            JOIN teams ht ON m.home_team_id = ht.id
            JOIN teams at ON m.away_team_id = at.id
            WHERE m.status = 'scheduled'
            ORDER BY m.match_date
            LIMIT 15
        `);

        if (matchesResult.rows.length === 0) {
            console.log('No scheduled matches found!');
            process.exit(0);
        }

        console.log(`Found ${matchesResult.rows.length} matches to score\n`);

        // Mock score scenarios (all totaling 25 frames)
        const mockScores = [
            { home: 13, away: 12 }, // Close win - 25 total
            { home: 14, away: 11 }, // Comfortable win - 25 total
            { home: 15, away: 10 }, // Solid win - 25 total
            { home: 16, away: 9 },  // Strong win - 25 total
            { home: 12, away: 13 }, // Close loss - 25 total
            { home: 11, away: 14 }, // Comfortable loss - 25 total
            { home: 10, away: 15 }, // Solid loss - 25 total
            { home: 17, away: 8 },  // Dominant win - 25 total
            { home: 18, away: 7 },  // Very dominant - 25 total
            { home: 9, away: 16 },  // Strong loss - 25 total
            { home: 13, away: 12 }, // Another close win - 25 total
            { home: 12, away: 13 }, // Another close loss - 25 total
            { home: 14, away: 11 }, // Comfortable win - 25 total
            { home: 10, away: 15 }, // Solid loss - 25 total
            { home: 16, away: 9 },  // Strong win - 25 total
        ];

        let successCount = 0;

        for (let i = 0; i < matchesResult.rows.length; i++) {
            const match = matchesResult.rows[i];
            const scores = mockScores[i];

            // Determine winner
            const winner_team_id = scores.home > scores.away
                ? match.home_team_id
                : match.away_team_id;

            try {
                // Check if result already exists
                const existingResult = await db.query(
                    'SELECT id FROM match_results WHERE match_id = $1',
                    [match.id]
                );

                if (existingResult.rows.length > 0) {
                    // Update existing result
                    await db.query(`
                        UPDATE match_results 
                        SET home_score = $1, away_score = $2, winner_team_id = $3
                        WHERE match_id = $4
                    `, [scores.home, scores.away, winner_team_id, match.id]);
                } else {
                    // Insert new result
                    await db.query(`
                        INSERT INTO match_results 
                        (match_id, home_score, away_score, winner_team_id, is_approved, submitted_by)
                        VALUES ($1, $2, $3, $4, true, 1)
                    `, [match.id, scores.home, scores.away, winner_team_id]);
                }

                // Update match status
                await db.query(`
                    UPDATE matches 
                    SET status = 'completed', home_score = $1, away_score = $2, winner_team_id = $3
                    WHERE id = $4
                `, [scores.home, scores.away, winner_team_id, match.id]);

                console.log(`✅ Match ${i + 1}: ${match.home_team} ${scores.home}-${scores.away} ${match.away_team}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Error scoring match ${match.id}:`, error.message);
            }
        }

        console.log(`\n✅ Successfully added scores to ${successCount} matches!`);
        console.log('\nYou can now check the Standings page to see the calculated rankings.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addMockScores();
