-- Tournament Management System Database Schema
-- Phase 1: Core Tables for Tournament, Participants, Matches, Frames, and Standings

-- Main tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL CHECK (game_type IN ('ultimate-pool', 'blackball', '8-ball', '9-ball', 'snooker')),
    format VARCHAR(50) NOT NULL CHECK (format IN ('round-robin', 'single-elimination', 'double-elimination')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in-progress', 'completed', 'cancelled')),
    start_date TIMESTAMP,
    description TEXT,
    public_url_slug VARCHAR(100) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    race_to INTEGER DEFAULT 13 CHECK (race_to > 0),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament participants (individual players)
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    seed INTEGER,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'withdrawn')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, player_id)
);

-- Tournament matches
CREATE TABLE IF NOT EXISTS tournament_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    participant1_id INTEGER REFERENCES tournament_participants(id) ON DELETE SET NULL,
    participant2_id INTEGER REFERENCES tournament_participants(id) ON DELETE SET NULL,
    winner_id INTEGER REFERENCES tournament_participants(id) ON DELETE SET NULL,
    participant1_frames INTEGER DEFAULT 0,
    participant2_frames INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'bye')),
    next_match_id INTEGER REFERENCES tournament_matches(id),
    bracket_position VARCHAR(50) CHECK (bracket_position IN ('winners', 'losers', NULL)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Frame-by-frame scoring for tournament matches
CREATE TABLE IF NOT EXISTS tournament_frames (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    winner_id INTEGER REFERENCES tournament_participants(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, frame_number)
);

-- Tournament standings (for round robin format)
CREATE TABLE IF NOT EXISTS tournament_standings (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    frames_won INTEGER DEFAULT 0,
    frames_lost INTEGER DEFAULT 0,
    frame_difference INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, participant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_league_id ON tournaments(league_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_public_url_slug ON tournaments(public_url_slug);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_player_id ON tournament_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_tournament_frames_match_id ON tournament_frames(match_id);
CREATE INDEX IF NOT EXISTS idx_tournament_standings_tournament_id ON tournament_standings(tournament_id);

-- Trigger to update tournament updated_at timestamp
CREATE OR REPLACE FUNCTION update_tournament_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tournament_update_timestamp
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_timestamp();

CREATE TRIGGER tournament_match_update_timestamp
    BEFORE UPDATE ON tournament_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_timestamp();

-- Trigger to update match frame counts when frames are added/updated
CREATE OR REPLACE FUNCTION update_tournament_match_frames()
RETURNS TRIGGER AS $$
BEGIN
    -- Update frame counts for the match
    UPDATE tournament_matches
    SET 
        participant1_frames = (
            SELECT COUNT(*) 
            FROM tournament_frames 
            WHERE match_id = NEW.match_id 
            AND winner_id = (SELECT participant1_id FROM tournament_matches WHERE id = NEW.match_id)
        ),
        participant2_frames = (
            SELECT COUNT(*) 
            FROM tournament_frames 
            WHERE match_id = NEW.match_id 
            AND winner_id = (SELECT participant2_id FROM tournament_matches WHERE id = NEW.match_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.match_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tournament_frame_update_match
    AFTER INSERT OR UPDATE ON tournament_frames
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_match_frames();

-- Function to generate unique URL slug
CREATE OR REPLACE FUNCTION generate_tournament_slug(tournament_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from tournament name
    base_slug := lower(regexp_replace(tournament_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    
    -- Add random suffix
    final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM tournaments WHERE public_url_slug = final_slug) LOOP
        final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
        counter := counter + 1;
        IF counter > 10 THEN
            RAISE EXCEPTION 'Could not generate unique slug';
        END IF;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE tournaments IS 'Main tournament table storing tournament metadata';
COMMENT ON TABLE tournament_participants IS 'Individual players participating in tournaments';
COMMENT ON TABLE tournament_matches IS 'Tournament matches with bracket progression';
COMMENT ON TABLE tournament_frames IS 'Frame-by-frame scoring for tournament matches';
COMMENT ON TABLE tournament_standings IS 'Calculated standings for round-robin tournaments';
