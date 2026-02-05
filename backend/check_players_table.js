const db = require('./src/config/database');

async function checkPlayersTable() {
    try {
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'players'
            ORDER BY ordinal_position
        `);

        console.log('Players table columns:\n');
        result.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPlayersTable();
