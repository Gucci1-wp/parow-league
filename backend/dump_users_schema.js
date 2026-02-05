const fs = require('fs');
const db = require('./src/config/database');

async function dump() {
    try {
        const res = await db.query(`
      SELECT column_name, is_nullable, column_default, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

        let output = '--- USERS SCHEMA ---\n';
        res.rows.forEach(r => {
            output += `${r.column_name}: Nullable=${r.is_nullable}, DataType=${r.data_type}, Default=${r.column_default}\n`;
        });

        fs.writeFileSync('users_schema_dump.txt', output);
        console.log('✅ Users schema dumped to users_schema_dump.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dump();
