const db = require('./src/config/database');

// South African names
const southAfricanNames = {
    firstNames: [
        'Thabo', 'Sipho', 'Mandla', 'Bongani', 'Themba', 'Jabu', 'Lucky', 'Sello',
        'Pieter', 'Johan', 'Hendrik', 'Francois', 'Andre', 'Kobus', 'Riaan', 'Danie',
        'Zanele', 'Nomsa', 'Thandi', 'Lindiwe', 'Precious', 'Busisiwe', 'Nokuthula',
        'Anele', 'Lebogang', 'Thabiso', 'Kagiso', 'Tshepo', 'Mpho', 'Katlego',
        'Willem', 'Gerhard', 'Charl', 'Ruan', 'Jaco', 'Dewald', 'Schalk', 'Morne'
    ],
    lastNames: [
        'Nkosi', 'Dlamini', 'Khumalo', 'Mthembu', 'Zulu', 'Ndlovu', 'Mahlangu', 'Sithole',
        'Van der Merwe', 'Botha', 'Pretorius', 'Van Zyl', 'Fourie', 'Nel', 'Venter', 'Kruger',
        'Mokoena', 'Molefe', 'Radebe', 'Maseko', 'Naidoo', 'Pillay', 'Govender', 'Chetty',
        'Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'
    ]
};

function getRandomName() {
    const firstName = southAfricanNames.firstNames[Math.floor(Math.random() * southAfricanNames.firstNames.length)];
    const lastName = southAfricanNames.lastNames[Math.floor(Math.random() * southAfricanNames.lastNames.length)];
    return { firstName, lastName };
}

function generateSAID() {
    // Generate exactly 13 digits: YYMMDDSSSSRGC
    // YY = year, MM = month, DD = day, SSSS = sequence, R = race (removed), G = gender, C = checksum
    const year = String(Math.floor(Math.random() * 40) + 60).padStart(2, '0'); // 60-99
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const gender = String(Math.floor(Math.random() * 10)); // Single digit
    const citizenship = '0';
    const checksum = String(Math.floor(Math.random() * 10));

    return `${year}${month}${day}${sequence}${gender}${citizenship}${checksum}`; // Exactly 13 digits
}

async function addMockPlayers() {
    try {
        console.log('Adding mock players to teams...\n');

        // Get all teams (exclude BYE team)
        const teamsResult = await db.query(
            "SELECT id, name FROM teams WHERE is_active = true AND name != 'BYE' ORDER BY name"
        );
        const teams = teamsResult.rows;

        console.log(`Found ${teams.length} teams\n`);

        for (const team of teams) {
            console.log(`Adding players to ${team.name}...`);

            const playersToAdd = Math.floor(Math.random() * 5) + 6; // 6-10 players
            let addedCount = 0;

            for (let i = 0; i < playersToAdd; i++) {
                const { firstName, lastName } = getRandomName();
                const saId = generateSAID();
                const phone = `0${Math.floor(Math.random() * 900000000) + 100000000}`; // Random SA phone

                try {
                    // Insert player
                    const playerResult = await db.query(
                        `INSERT INTO players (first_name, last_name, sa_id_number, phone, is_active)
                         VALUES ($1, $2, $3, $4, true)
                         RETURNING id, first_name, last_name`,
                        [firstName, lastName, saId, phone]
                    );

                    const player = playerResult.rows[0];

                    // Assign to team
                    await db.query(
                        `INSERT INTO team_players (team_id, player_id, is_active)
                         VALUES ($1, $2, true)`,
                        [team.id, player.id]
                    );

                    console.log(`  ✅ Added ${player.first_name} ${player.last_name}`);
                    addedCount++;
                } catch (error) {
                    // Skip if duplicate SA ID
                    if (error.code === '23505') {
                        console.log(`  ⚠️  Skipped duplicate`);
                        i--; // Retry this iteration
                    } else {
                        console.error(`  ❌ Error adding player:`, error.message);
                    }
                }
            }

            console.log(`  Total: ${addedCount} players added to ${team.name}\n`);
        }

        console.log('✅ All mock players added successfully!');

        // Show summary
        const summary = await db.query(`
            SELECT t.name, COUNT(tp.player_id) as player_count
            FROM teams t
            LEFT JOIN team_players tp ON t.id = tp.team_id AND tp.is_active = true
            WHERE t.is_active = true AND t.name != 'BYE'
            GROUP BY t.id, t.name
            ORDER BY t.name
        `);

        console.log('\n📊 Team Roster Summary:');
        summary.rows.forEach(row => {
            console.log(`   ${row.name}: ${row.player_count} players`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addMockPlayers();
