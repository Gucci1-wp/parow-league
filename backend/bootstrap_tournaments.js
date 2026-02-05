const db = require('./src/config/database');

async function bootstrap() {
    try {
        const res = await db.query(`
      INSERT INTO tournaments (id, season_id, name, description, tournament_type, game_format)
      VALUES (1, 1, 'Summer League 2025', 'Summer League Season 2025', 'round-robin', 'race to 13')
      ON CONFLICT (id) DO NOTHING
    `);
        console.log('✅ Tournament record initialized');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error bootstrapping tournament:', err);
        process.exit(1);
    }
}

bootstrap();
