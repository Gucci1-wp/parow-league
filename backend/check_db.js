const db = require('./src/config/database');

async function checkData() {
    try {
        const teams = await db.query('SELECT * FROM teams');
        console.log('--- TEAMS ---');
        console.log('Count:', teams.rowCount);
        console.log('Sample Statuses:', teams.rows.map(t => ({ id: t.id, name: t.name, is_active: t.is_active })));

        const divisions = await db.query('SELECT * FROM divisions');
        console.log('\n--- DIVISIONS ---');
        console.log('Count:', divisions.rowCount);
        console.log('Rows:', divisions.rows.map(d => ({ id: d.id, name: d.name })));

        const matches = await db.query('SELECT * FROM matches LIMIT 5');
        console.log('\n--- MATCHES (limit 5) ---');
        const totalMatches = await db.query('SELECT count(*) FROM matches');
        console.log('Count Total:', totalMatches.rows[0].count);
        console.log('Sample:', matches.rows);

        process.exit(0);
    } catch (err) {
        console.error('Database Error:', err);
        process.exit(1);
    }
}

checkData();
