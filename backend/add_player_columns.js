const db = require('./src/config/database');

async function addPlayerColumns() {
    try {
        console.log('Adding missing columns to players table...\n');

        // Add sa_id_number column
        await db.query(`
            ALTER TABLE players 
            ADD COLUMN IF NOT EXISTS sa_id_number VARCHAR(13) UNIQUE
        `);
        console.log('✅ Added sa_id_number column');

        // Add phone column
        await db.query(`
            ALTER TABLE players 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
        `);
        console.log('✅ Added phone column');

        // Add email column
        await db.query(`
            ALTER TABLE players 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255)
        `);
        console.log('✅ Added email column');

        console.log('\n✅ All columns added successfully!');

        // Verify the changes
        const result = await db.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'players'
            ORDER BY ordinal_position
        `);

        console.log('\nUpdated players table columns:');
        result.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addPlayerColumns();
