const db = require('./src/config/database');

async function checkTournamentsSchema() {
    try {
        const res = await db.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      ORDER BY ordinal_position
    `);
        console.log('--- TOURNAMENTS SCHEMA ---');
        res.rows.forEach(r => {
            console.log(`${r.column_name}: Nullable=${r.is_nullable}, Default=${r.column_default}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTournamentsSchema();
