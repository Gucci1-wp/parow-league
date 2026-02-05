const db = require('./src/config/database');
const matchController = require('./src/controllers/matchController');

async function triggerFixtureGeneration() {
    try {
        const teams = await db.query('SELECT id FROM teams WHERE division_id = 1');
        const teamIds = teams.rows.map(t => t.id);

        console.log(`Generating fixtures for ${teamIds.length} teams...`);

        const req = {
            body: {
                tournament_id: 1,
                team_ids: teamIds,
                start_date: '2025-01-05', // A Sunday in 2025
                rounds: 2
            }
        };

        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Status: ${code}`);
                    console.log('Response:', data.message);
                }
            })
        };

        await matchController.generateFixtures(req, res);

        const matchesCount = await db.query('SELECT count(*) FROM matches');
        console.log(`Matches in database: ${matchesCount.rows[0].count}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error generating fixtures:', err);
        process.exit(1);
    }
}

triggerFixtureGeneration();
