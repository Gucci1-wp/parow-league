const db = require('../src/config/database');

async function checkDragonsMatches() {
    try {
        console.log('Checking matches for DRAGONS 1...');

        // 1. Get Team ID
        const teamRes = await db.query("SELECT id, name FROM teams WHERE name ILIKE '%Dragons 1%'");
        if (teamRes.rows.length === 0) {
            console.log('Team DRAGONS 1 not found.');
            return;
        }
        const team = teamRes.rows[0];
        console.log(`Team: ${team.name} (ID: ${team.id})`);

        // 2. Get Matches
        const matchesRes = await db.query(`
            SELECT 
                m.id, 
                m.match_date, 
                m.home_team_id, 
                m.away_team_id, 
                m.home_score, 
                m.away_score, 
                m.winner_team_id,
                ht.name as home_name,
                at.name as away_name
            FROM matches m
            JOIN teams ht ON m.home_team_id = ht.id
            JOIN teams at ON m.away_team_id = at.id
            WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
            AND m.status = 'completed'
            ORDER BY m.match_date
        `, [team.id]);

        console.log(`Found ${matchesRes.rows.length} completed matches:`);

        matchesRes.rows.forEach(m => {
            const isHome = m.home_team_id === team.id;
            const oppName = isHome ? m.away_name : m.home_name;
            const myScore = isHome ? m.home_score : m.away_score;
            const oppScore = isHome ? m.away_score : m.home_score;
            const isWinner = m.winner_team_id === team.id;

            console.log(` - ID: ${m.id} | Date: ${new Date(m.match_date).toISOString().split('T')[0]} | vs ${oppName} | Score: ${myScore}-${oppScore} | WinnerID: ${m.winner_team_id} | Result: ${isWinner ? 'WIN' : 'LOSS/TIE'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkDragonsMatches();
