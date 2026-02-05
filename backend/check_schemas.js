const db = require('./src/config/database');

async function checkSchemas() {
    const tables = ['venues', 'leagues', 'seasons', 'divisions', 'teams'];
    const results = {};

    for (const table of tables) {
        try {
            const res = await db.query(
                "SELECT column_name FROM information_schema.columns WHERE table_name = $1",
                [table]
            );
            results[table] = res.rows.map(r => r.column_name);
        } catch (err) {
            console.error(`Error checking ${table}:`, err.message);
        }
    }

    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
}

checkSchemas();
