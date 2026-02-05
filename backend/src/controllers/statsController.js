const db = require('../config/database');

const getPlayerStats = async (req, res) => {
    try {
        const { divisionId, seasonId } = req.query;

        // Base query for player statistics
        let queryText = `
            SELECT 
                p.id,
                p.first_name,
                p.last_name,
                t.name as team_name,
                COUNT(DISTINCT fr.match_id) as matches_played,
                COUNT(fr.id) as frames_played,
                SUM(CASE WHEN fr.winner_player_id = p.id THEN 1 ELSE 0 END) as frames_won,
                SUM(CASE WHEN fr.winner_player_id != p.id AND fr.winner_player_id IS NOT NULL THEN 1 ELSE 0 END) as frames_lost,
                (SUM(CASE WHEN fr.winner_player_id = p.id THEN 1 ELSE 0 END) - 
                 SUM(CASE WHEN fr.winner_player_id != p.id AND fr.winner_player_id IS NOT NULL THEN 1 ELSE 0 END)) as frame_difference,
                ROUND(
                    SUM(CASE WHEN fr.winner_player_id = p.id THEN 1 ELSE 0 END)::numeric / 
                    NULLIF(COUNT(fr.id), 0) * 100, 
                    2
                ) as win_percentage
            FROM players p
            LEFT JOIN team_players tp ON p.id = tp.player_id AND tp.is_active = true
            LEFT JOIN teams t ON tp.team_id = t.id
            LEFT JOIN frame_results fr ON (fr.home_player_id = p.id OR fr.away_player_id = p.id)
            WHERE p.is_active = true
        `;

        const queryParams = [];

        // Add filters if needed (e.g., division)
        if (divisionId) {
            queryText += ` AND t.division_id = $${queryParams.length + 1}`;
            queryParams.push(divisionId);
        }

        queryText += `
            GROUP BY p.id, p.first_name, p.last_name, t.name
            ORDER BY frames_won DESC, win_percentage DESC
        `;

        const result = await db.query(queryText, queryParams);

        let players = result.rows;

        // Calculate Win Streaks Programmatically (Complex SQL for gaps is hard/slow)
        // We need detailed frame history for players to calculate specific streaks
        // For efficiency, we can do a secondary fetch for frame history or just do it for top players?
        // Or better: Fetch raw frame data for ALL players and compute in memory if dataset is small (<1000 players).
        // Since dataset is likely small (< 500 players), we can try to computing it.

        // Let's compute streaks. We need 'matches' or 'frames' dates.
        // We'll fetch all completed frames ordered by date.
        const historyResult = await db.query(`
            SELECT 
                fr.winner_player_id, 
                fr.home_player_id, 
                fr.away_player_id, 
                m.match_date 
            FROM frame_results fr
            JOIN matches m ON fr.match_id = m.id
            WHERE fr.winner_player_id IS NOT NULL
            ORDER BY m.match_date DESC, fr.frame_number DESC
        `);

        const streaks = {}; // { playerId: currentStreak }

        // Process history to find CURRENT streak
        // Since it's ordered DESC (newest first), we just count consecutive wins until a non-win.
        const playerFrameHistory = {}; // { playerId: [{won: bool, date: ...}] }

        historyResult.rows.forEach(row => {
            const p1 = row.home_player_id;
            const p2 = row.away_player_id;
            const winner = row.winner_player_id;

            if (!playerFrameHistory[p1]) playerFrameHistory[p1] = [];
            if (!playerFrameHistory[p2]) playerFrameHistory[p2] = [];

            playerFrameHistory[p1].push({ won: p1 === winner, date: row.match_date });
            playerFrameHistory[p2].push({ won: p2 === winner, date: row.match_date });
        });

        // Calculate current streak for each player
        players = players.map(player => {
            const history = playerFrameHistory[player.id] || [];
            let currentStreak = 0;

            for (const frame of history) {
                if (frame.won) {
                    currentStreak++;
                } else {
                    break; // Streak broken
                }
            }

            return {
                ...player,
                current_streak: currentStreak,
                // Ensure numbers are numbers
                matches_played: Number(player.matches_played),
                frames_played: Number(player.frames_played),
                frames_won: Number(player.frames_won),
                frames_lost: Number(player.frames_lost),
                frame_difference: Number(player.frame_difference),
                win_percentage: Number(player.win_percentage) || 0
            };
        });

        res.json({ stats: players });

    } catch (error) {
        console.error('Get player stats error:', error);
        res.status(500).json({ error: 'Failed to fetch player statistics' });
    }
};

module.exports = {
    getPlayerStats
};
