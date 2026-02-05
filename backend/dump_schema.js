const fs = require('fs');
const db = require('./src/config/database');

async function dump() {
    try {
        const res = await db.query(`
      SELECT table_name, column_name, is_nullable, column_default, data_type
      FROM information_schema.columns
      WHERE table_name IN ('tournaments', 'divisions', 'seasons')
      ORDER BY table_name, ordinal_position
    `);

        let output = '';
        res.rows.forEach(r => {
            output += `${r.table_name}.${r.column_name}: ${r.is_nullable}, ${r.data_type}, ${r.column_default}\n`;
        });

        fs.writeFileSync('full_schema_dump.txt', output);
        console.log('✅ Schema dumped to full_schema_dump.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dump();
