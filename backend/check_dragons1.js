const db = require('./src/config/database');

async function checkDragons1() {
    try {
        console.log('Checking DRAGONS 1 match results...\n');

        const result = await db.query(`
            SELECT 
                m.match_date,
                ht.name as home_team,
                m.home_score,
                m.away_score,
                at.name as away_team,
                m.winner_team_id,
                t1.id as dragons_id
            FROM matches m
            JOIN teams ht ON m.home_team_id = ht.id
            JOIN teams at ON m.away_team_id = at.id
            CROSS JOIN (SELECT id FROM teams WHERE name = 'DRAGONS 1') t1
            WHERE (ht.name = 'DRAGONS 1' OR at.name = 'DRAGONS 1')
              AND m.status = 'completed'
            ORDER BY m.match_date
        `);

        console.log(`Found ${result.rows.length} completed matches for DRAGONS 1:\n`);

        let totalWins = 0;
        let totalFramesWon = 0;
        let totalFramesLost = 0;

        result.rows.forEach((match, index) => {
            const isDragonsHome = match.home_team === 'DRAGONS 1';
            const dragonsScore = isDragonsHome ? match.home_score : match.away_score;
            const oppScore = isDragonsHome ? match.away_score : match.home_score;
            const opponent = isDragonsHome ? match.away_team : match.home_team;
            const won = dragonsScore > oppScore;

            totalFramesWon += dragonsScore;
            totalFramesLost += oppScore;
            if (won) totalWins++;

            const total = dragonsScore + oppScore;
            const status = total === 25 ? '✓' : `✗ (${total})`;

            console.log(`${index + 1}. ${match.match_date.toISOString().split('T')[0]}`);
            console.log(`   DRAGONS 1 ${dragonsScore}-${oppScore} ${opponent} ${won ? '(WIN)' : '(LOSS)'}`);
            console.log(`   Total frames: ${status}\n`);
        });

        const points = totalWins * 3;
        const frameDiff = totalFramesWon - totalFramesLost;

        console.log('='.repeat(50));
        console.log('CALCULATED TOTALS:');
        console.log(`Matches Played: ${result.rows.length}`);
        console.log(`Wins: ${totalWins}`);
        console.log(`Frames Won: ${totalFramesWon}`);
        console.log(`Frames Lost: ${totalFramesLost}`);
        console.log(`Frame Difference: ${frameDiff > 0 ? '+' : ''}${frameDiff}`);
        console.log(`Points: ${points}`);
        console.log('='.repeat(50));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDragons1();
