const db = require('./src/config/database');

async function createFrameScoringTables() {
    try {
        console.log('Creating frame scoring tables...\n');

        // Create frame_results table
        console.log('Creating frame_results table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS frame_results (
                id SERIAL PRIMARY KEY,
                match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
                frame_number INTEGER NOT NULL CHECK (frame_number BETWEEN 1 AND 25),
                home_player_id INTEGER NOT NULL REFERENCES players(id),
                away_player_id INTEGER NOT NULL REFERENCES players(id),
                winner_player_id INTEGER REFERENCES players(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(match_id, frame_number)
            )
        `);
        console.log('✅ frame_results table created');

        // Create match_lineups table
        console.log('Creating match_lineups table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS match_lineups (
                id SERIAL PRIMARY KEY,
                match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
                team_id INTEGER NOT NULL REFERENCES teams(id),
                player_id INTEGER NOT NULL REFERENCES players(id),
                is_reserve BOOLEAN DEFAULT false,
                lineup_position INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(match_id, team_id, player_id)
            )
        `);
        console.log('✅ match_lineups table created');

        // Create indexes
        console.log('Creating indexes...');
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_frame_results_match 
            ON frame_results(match_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_frame_results_players 
            ON frame_results(home_player_id, away_player_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_frame_results_winner 
            ON frame_results(winner_player_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_match_lineups_match 
            ON match_lineups(match_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_match_lineups_player 
            ON match_lineups(player_id)
        `);
        console.log('✅ Indexes created');

        console.log('\n✅ All tables and indexes created successfully!');

        // Verify tables exist
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('frame_results', 'match_lineups')
            ORDER BY table_name
        `);

        console.log('\nCreated tables:');
        tables.rows.forEach(t => console.log(`- ${t.table_name}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createFrameScoringTables();
