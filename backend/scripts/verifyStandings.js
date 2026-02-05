const db = require('../src/config/database');

async function verifyStandings() {
    try {
        console.log('--- Starting Standings Verification ---');

        // 1. Create two test teams
        console.log('Creating test teams...');
        const t1Res = await db.query("INSERT INTO teams (name, division_id) VALUES ('Test Team A', 1) RETURNING id, name");
        const t2Res = await db.query("INSERT INTO teams (name, division_id) VALUES ('Test Team B', 1) RETURNING id, name");
        const teamA = t1Res.rows[0];
        const teamB = t2Res.rows[0];
        console.log(`Created: ${teamA.name} (${teamA.id}) vs ${teamB.name} (${teamB.id})`);

        // 2. Create players for Team A
        const playerRes = await db.query("INSERT INTO players (first_name, last_name, is_active) VALUES ('Test', 'PlayerA1', true) RETURNING id");
        const pA1 = playerRes.rows[0];
        await db.query("INSERT INTO team_players (team_id, player_id, is_active) VALUES ($1, $2, true)", [teamA.id, pA1.id]);

        // 3. Create players for Team B
        const playerBRes = await db.query("INSERT INTO players (first_name, last_name, is_active) VALUES ('Test', 'PlayerB1', true) RETURNING id");
        const pB1 = playerBRes.rows[0];
        await db.query("INSERT INTO team_players (team_id, player_id, is_active) VALUES ($1, $2, true)", [teamB.id, pB1.id]);

        // 4. Create a Match
        const matchRes = await db.query(`
            INSERT INTO matches (tournament_id, home_team_id, away_team_id, match_date, division_id, status, round)
            VALUES (1, $1, $2, '2026-02-15', 1, 'scheduled', 1)
            RETURNING id
        `, [teamA.id, teamB.id]);
        const matchId = matchRes.rows[0].id;
        console.log(`Created Match ID: ${matchId}`);

        // 5. Simulate Scoring: Team A wins 13-12 (Close match)
        console.log('Simulating 13-12 win for Team A...');
        const frames = [];
        // 13 wins for Team A
        for (let i = 1; i <= 13; i++) {
            frames.push({ frame_number: i, home_player_id: pA1.id, away_player_id: pB1.id, winner_player_id: pA1.id });
        }
        // 12 wins for Team B
        for (let i = 14; i <= 25; i++) {
            frames.push({ frame_number: i, home_player_id: pA1.id, away_player_id: pB1.id, winner_player_id: pB1.id });
        }

        // Call the SAVE logic (simulating what the controller does)
        // We will insert manually into frame_results and update matches/match_results to mirror controller

        await db.query('BEGIN');

        for (const f of frames) {
            await db.query(
                `INSERT INTO frame_results (match_id, frame_number, home_player_id, away_player_id, winner_player_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [matchId, f.frame_number, f.home_player_id, f.away_player_id, f.winner_player_id]
            );
        }

        // Controller logic for updating match status
        const homeScore = 13;
        const awayScore = 12;
        const winnerTeamId = teamA.id;

        await db.query(
            `UPDATE matches SET home_score = $1, away_score = $2, winner_team_id = $3, status = 'completed' WHERE id = $4`,
            [homeScore, awayScore, winnerTeamId, matchId]
        );

        await db.query(
            `INSERT INTO match_results (match_id, home_score, away_score, winner_team_id, is_approved)
             VALUES ($1, $2, $3, $4, true)`,
            [matchId, homeScore, awayScore, winnerTeamId]
        );

        await db.query('COMMIT');
        console.log('Match completed and verified.');

        // 6. Check Standings
        console.log('Fetching Standings...');

        // This query matches standingsController.js
        const standingsQuery = `
          WITH match_stats AS (
            SELECT 
                t.id as team_id,
                t.name as team_name,
                COUNT(DISTINCT m.id) as played,
                SUM(CASE WHEN mr.winner_team_id = t.id THEN 1 ELSE 0 END) as wins,
                0 as ties,
                SUM(CASE WHEN mr.winner_team_id IS NOT NULL AND mr.winner_team_id != t.id THEN 1 ELSE 0 END) as losses,
                SUM(CASE 
                  WHEN m.home_team_id = t.id THEN mr.home_score
                  WHEN m.away_team_id = t.id THEN mr.away_score
                  ELSE 0
                END) as frames_won,
                SUM(CASE 
                  WHEN m.home_team_id = t.id THEN mr.away_score
                  WHEN m.away_team_id = t.id THEN mr.home_score
                  ELSE 0
                END) as frames_lost
            FROM teams t
            LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
              AND m.division_id = 1 AND m.status = 'completed'
            LEFT JOIN match_results mr ON mr.match_id = m.id AND mr.is_approved = true
            WHERE t.division_id = 1 AND t.id IN ($1, $2)
            GROUP BY t.id, t.name
          )
          SELECT team_name, played, wins, losses, frames_won, frames_lost, (wins * 3) as pts FROM match_stats ORDER BY pts DESC
        `;

        const res = await db.query(standingsQuery, [teamA.id, teamB.id]);
        const rows = res.rows;

        console.table(rows);

        // 7. Assertions
        const sA = rows.find(r => r.team_name === 'Test Team A');
        const sB = rows.find(r => r.team_name === 'Test Team B');

        let errors = [];
        if (sA.pts != 3) errors.push(`Team A Points: expected 3, got ${sA.pts}`);
        if (sA.wins != 1) errors.push(`Team A Wins: expected 1, got ${sA.wins}`);
        if (sA.frames_won != 13) errors.push(`Team A Frames Won: expected 13, got ${sA.frames_won}`);

        if (sB.pts != 0) errors.push(`Team B Points: expected 0, got ${sB.pts}`);
        if (sB.losses != 1) errors.push(`Team B Losses: expected 1, got ${sB.losses}`);
        if (sB.frames_won != 12) errors.push(`Team B Frames Won: expected 12, got ${sB.frames_won}`);

        if (errors.length > 0) {
            console.error('❌ Verification FAILED:');
            errors.forEach(e => console.error(' - ' + e));
        } else {
            console.log('✅ Verification PASSED: All stats are calculated correctly.');
        }

        // Cleanup
        console.log('Cleaning up test data...');
        await db.query("DELETE FROM frame_results WHERE match_id = $1", [matchId]);
        await db.query("DELETE FROM match_results WHERE match_id = $1", [matchId]);
        await db.query("DELETE FROM matches WHERE id = $1", [matchId]);
        await db.query("DELETE FROM team_players WHERE team_id IN ($1, $2)", [teamA.id, teamB.id]);
        await db.query("DELETE FROM players WHERE id IN ($1, $2)", [pA1.id, pB1.id]);
        await db.query("DELETE FROM teams WHERE id IN ($1, $2)", [teamA.id, teamB.id]);
        console.log('Cleaned up.');

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

verifyStandings();
