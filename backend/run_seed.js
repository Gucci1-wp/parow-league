const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function runSeed() {
    try {
        const seedPath = path.join(__dirname, '..', 'database', 'seed_new.sql');
        const sql = fs.readFileSync(seedPath, 'utf8');

        // Split SQL by semicolon and filter out empty lines
        const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

        console.log(`Executing ${queries.length} queries...`);

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            try {
                // Check for specific commands that return messages
                if (query.toLowerCase().startsWith('select \'')) {
                    const res = await db.query(query);
                    console.log(`[Query ${i + 1}] Message:`, res.rows[0].message);
                } else {
                    await db.query(query);
                    // console.log(`[Query ${i+1}] Success`);
                }
            } catch (queryErr) {
                console.error(`❌ Error in Query ${i + 1}:`, query);
                console.error(queryErr.message);
                throw queryErr;
            }
        }

        console.log('✅ Seed script executed successfully!');

        const teams = await db.query('SELECT count(*) FROM teams');
        console.log(`Teams in database: ${teams.rows[0].count}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error running seed script');
        process.exit(1);
    }
}

runSeed();
