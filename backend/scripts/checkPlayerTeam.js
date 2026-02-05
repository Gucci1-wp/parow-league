const db = require('../src/config/database');

async function checkPlayer() {
    try {
        console.log('Checking player info...');

        const res = await db.query(`
            SELECT p.id, p.first_name, p.last_name, t.name as team_name, tp.is_active, p.is_active as player_active
            FROM players p 
            JOIN team_players tp ON p.id = tp.player_id 
            JOIN teams t ON tp.team_id = t.id 
            WHERE p.first_name ILIKE '%Lincoln%' OR p.last_name ILIKE '%Jordaan%'
        `);

        console.log('Found players:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkPlayer();
