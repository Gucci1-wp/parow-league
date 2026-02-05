-- Tournament and Match Management Schema
-- Add tables for matches, match frames, and player statistics

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER,
    match_date DATE NOT NULL,
    match_time TIME DEFAULT '14:00:00',
    venue_id INTEGER REFERENCES venues(id),
    home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    home_score INTEGER DEFAULT 0 CHECK (home_score >= 0 AND home_score <= 13),
    away_score INTEGER DEFAULT 0 CHECK (away_score >= 0 AND away_score <= 13),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    winner_team_id INTEGER REFERENCES teams(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_teams CHECK (home_team_id != away_team_id),
    CONSTRAINT valid_winner CHECK (
        (status = 'completed' AND winner_team_id IS NOT NULL AND (winner_team_id = home_team_id OR winner_team_id = away_team_id))
        OR (status != 'completed' AND winner_team_id IS NULL)
    ),
    CONSTRAINT valid_score CHECK (
        (status = 'completed' AND (home_score = 13 OR away_score = 13))
        OR (status != 'completed')
    )
);

-- Match frames table (for detailed frame-by-frame scoring)
CREATE TABLE IF NOT EXISTS match_frames (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL CHECK (frame_number >= 1 AND frame_number <= 25),
    home_player_id INTEGER REFERENCES players(id),
    away_player_id INTEGER REFERENCES players(id),
    winner_player_id INTEGER REFERENCES players(id),
    break_score INTEGER,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_frame_winner CHECK (winner_player_id = home_player_id OR winner_player_id = away_player_id),
    CONSTRAINT unique_frame_per_match UNIQUE (match_id, frame_number)
);

-- Player statistics table
CREATE TABLE IF NOT EXISTS player_statistics (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    frames_played INTEGER DEFAULT 0,
    frames_won INTEGER DEFAULT 0,
    frames_lost INTEGER DEFAULT 0,
    win_percentage DECIMAL(5,2) DEFAULT 0.00,
    average_break DECIMAL(5,2) DEFAULT 0.00,
    highest_break INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_win_streak INTEGER DEFAULT 0,
    longest_loss_streak INTEGER DEFAULT 0,
    ranking_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_player_season UNIQUE (player_id, season_id, tournament_id),
    CONSTRAINT valid_frames CHECK (frames_played = frames_won + frames_lost),
    CONSTRAINT valid_percentage CHECK (win_percentage >= 0 AND win_percentage <= 100)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_frames_match ON match_frames(match_id);
CREATE INDEX IF NOT EXISTS idx_match_frames_players ON match_frames(home_player_id, away_player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_statistics(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_statistics(season_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_ranking ON player_statistics(ranking_points DESC);

-- Function to update match updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for matches table
DROP TRIGGER IF EXISTS update_matches_timestamp ON matches;
CREATE TRIGGER update_matches_timestamp
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_match_timestamp();

-- Function to automatically update player statistics
CREATE OR REPLACE FUNCTION update_player_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if winner is set
    IF NEW.winner_player_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Update statistics for home player
    IF NEW.winner_player_id = NEW.home_player_id THEN
        UPDATE player_statistics
        SET frames_played = frames_played + 1,
            frames_won = frames_won + 1,
            win_percentage = ROUND((frames_won + 1.0) / (frames_played + 1.0) * 100, 2),
            current_streak = CASE WHEN current_streak >= 0 THEN current_streak + 1 ELSE 1 END,
            longest_win_streak = GREATEST(longest_win_streak, CASE WHEN current_streak >= 0 THEN current_streak + 1 ELSE 1 END),
            last_updated = CURRENT_TIMESTAMP
        WHERE player_id = NEW.home_player_id;
        
        UPDATE player_statistics
        SET frames_played = frames_played + 1,
            frames_lost = frames_lost + 1,
            win_percentage = ROUND(frames_won / (frames_played + 1.0) * 100, 2),
            current_streak = CASE WHEN current_streak <= 0 THEN current_streak - 1 ELSE -1 END,
            longest_loss_streak = GREATEST(longest_loss_streak, ABS(CASE WHEN current_streak <= 0 THEN current_streak - 1 ELSE -1 END)),
            last_updated = CURRENT_TIMESTAMP
        WHERE player_id = NEW.away_player_id;
    ELSE
        UPDATE player_statistics
        SET frames_played = frames_played + 1,
            frames_won = frames_won + 1,
            win_percentage = ROUND((frames_won + 1.0) / (frames_played + 1.0) * 100, 2),
            current_streak = CASE WHEN current_streak >= 0 THEN current_streak + 1 ELSE 1 END,
            longest_win_streak = GREATEST(longest_win_streak, CASE WHEN current_streak >= 0 THEN current_streak + 1 ELSE 1 END),
            last_updated = CURRENT_TIMESTAMP
        WHERE player_id = NEW.away_player_id;
        
        UPDATE player_statistics
        SET frames_played = frames_played + 1,
            frames_lost = frames_lost + 1,
            win_percentage = ROUND(frames_won / (frames_played + 1.0) * 100, 2),
            current_streak = CASE WHEN current_streak <= 0 THEN current_streak - 1 ELSE -1 END,
            longest_loss_streak = GREATEST(longest_loss_streak, ABS(CASE WHEN current_streak <= 0 THEN current_streak - 1 ELSE -1 END)),
            last_updated = CURRENT_TIMESTAMP
        WHERE player_id = NEW.home_player_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update player statistics when frame is completed
DROP TRIGGER IF EXISTS update_stats_on_frame ON match_frames;
CREATE TRIGGER update_stats_on_frame
    AFTER INSERT ON match_frames
    FOR EACH ROW
    EXECUTE FUNCTION update_player_statistics();

