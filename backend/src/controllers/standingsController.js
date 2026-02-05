const db = require('../config/database');

// Get standings for a division
const getStandings = async (req, res) => {
  try {
    const { divisionId } = req.params;

    // Complex SQL query to calculate all standings statistics
    const query = `
      WITH match_stats AS (
        SELECT 
            t.id as team_id,
            t.name as team_name,
            COUNT(DISTINCT m.id) as played,
            SUM(CASE 
              WHEN mr.winner_team_id = t.id THEN 1 
              ELSE 0 
            END) as wins,
            0 as ties,
            SUM(CASE 
              WHEN mr.winner_team_id IS NOT NULL AND mr.winner_team_id != t.id THEN 1 
              ELSE 0 
            END) as losses,
            SUM(CASE 
              WHEN m.home_team_id = t.id THEN mr.home_score
              WHEN m.away_team_id = t.id THEN mr.away_score
              ELSE 0
            END) as frames_won,
            SUM(CASE 
              WHEN m.home_team_id = t.id THEN mr.away_score
              WHEN m.away_team_id = t.id THEN mr.home_score
              ELSE 0
            END) as frames_lost,
            SUM(CASE 
              WHEN mr.winner_team_id = t.id THEN 1 
              ELSE 0 
            END) as rounds_won
        FROM teams t
        LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
          AND m.division_id = $1 AND m.status = 'completed'
        LEFT JOIN match_results mr ON mr.match_id = m.id AND mr.is_approved = true
        WHERE t.division_id = $1
        GROUP BY t.id, t.name
      )
      SELECT 
        ROW_NUMBER() OVER (
          ORDER BY 
            (wins * 3) DESC,
            (frames_won - frames_lost) DESC,
            frames_won DESC
        ) as pos,
        team_name as name,
        played,
        wins as win,
        0 as tie,
        losses as lose,
        frames_won as ws,
        frames_lost as ls,
        (frames_won - frames_lost) as sd,
        rounds_won as ro,
        0 as lags,
        0 as bonus,
        CASE 
          WHEN played > 0 THEN ROUND(frames_won::numeric / played::numeric, 3)
          ELSE 0
        END as avg,
        (wins * 3) as pts
      FROM match_stats
      ORDER BY pts DESC, sd DESC, ws DESC;
    `;

    const result = await db.query(query, [divisionId]);

    res.json({
      division_id: divisionId,
      standings: result.rows,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get standings error:', error);
    res.status(500).json({ error: 'Failed to get standings' });
  }
};

// Get standings for all divisions in a season
const getSeasonStandings = async (req, res) => {
  try {
    const { seasonId } = req.params;

    // Get all divisions in the season
    const divisionsResult = await db.query(
      'SELECT id, name FROM divisions WHERE season_id = $1',
      [seasonId]
    );

    const standings = {};

    for (const division of divisionsResult.rows) {
      const query = `
        WITH match_stats AS (
          SELECT 
            t.id as team_id,
            t.name as team_name,
            COUNT(DISTINCT m.id) as played,
            SUM(CASE 
              WHEN mr.winner_team_id = t.id THEN 1 
              ELSE 0 
            END) as wins,
            SUM(CASE 
              WHEN mr.home_score = mr.away_score THEN 1 
              ELSE 0 
            END) as ties,
            SUM(CASE 
              WHEN mr.winner_team_id IS NOT NULL AND mr.winner_team_id != t.id THEN 1 
              ELSE 0 
            END) as losses,
            SUM(CASE 
              WHEN m.home_team_id = t.id THEN mr.home_score
              WHEN m.away_team_id = t.id THEN mr.away_score
              ELSE 0
            END) as frames_won,
            SUM(CASE 
              WHEN m.home_team_id = t.id THEN mr.away_score
              WHEN m.away_team_id = t.id THEN mr.home_score
              ELSE 0
            END) as frames_lost,
            SUM(CASE 
              WHEN m.home_team_id = t.id THEN mr.home_lags_won
              WHEN m.away_team_id = t.id THEN mr.away_lags_won
              ELSE 0
            END) as lags_won,
            SUM(CASE 
              WHEN mr.winner_team_id = t.id THEN 1 
              ELSE 0 
            END) as rounds_won
          FROM teams t
          LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
            AND m.division_id = $1 AND m.status = 'completed'
          LEFT JOIN match_results mr ON mr.match_id = m.id AND mr.is_approved = true
          WHERE t.division_id = $1
          GROUP BY t.id, t.name
        )
        SELECT 
          ROW_NUMBER() OVER (
            ORDER BY 
              (wins * 3 + ties) DESC,
              (frames_won - frames_lost) DESC,
              frames_won DESC
          ) as pos,
          team_name as name,
          played,
          wins as win,
          ties as tie,
          losses as lose,
          frames_won as ws,
          frames_lost as ls,
          (frames_won - frames_lost) as sd,
          rounds_won as ro,
          lags_won as lags,
          0 as bonus,
          CASE 
            WHEN played > 0 THEN ROUND(frames_won::numeric / played::numeric, 3)
            ELSE 0
          END as avg,
          (wins * 3 + ties) as pts
        FROM match_stats
        ORDER BY pts DESC, sd DESC, ws DESC;
      `;

      const result = await db.query(query, [division.id]);
      standings[division.name] = result.rows;
    }

    res.json({
      season_id: seasonId,
      standings,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get season standings error:', error);
    res.status(500).json({ error: 'Failed to get season standings' });
  }
};

module.exports = {
  getStandings,
  getSeasonStandings,
};
