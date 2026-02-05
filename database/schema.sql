-- Pool League Management System - Database Schema
-- PostgreSQL 18
-- Author: Pool League Management System
-- Date: 2026-02-03

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS calendar_subscriptions CASCADE;
DROP TABLE IF EXISTS tournament_registrations CASCADE;
DROP TABLE IF EXISTS venue_ratings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS player_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS match_photos CASCADE;
DROP TABLE IF EXISTS league_news CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS player_transfers CASCADE;
DROP TABLE IF EXISTS match_disputes CASCADE;
DROP TABLE IF EXISTS player_availability CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS tournament_matches CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS team_players CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS divisions CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users table (authentication and authorization)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'player', -- 'admin', 'captain', 'player'
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues table
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    phone VARCHAR(20),
    email VARCHAR(255),
    table_count INTEGER,
    hours_of_operation TEXT,
    website VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leagues table
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    logo_url VARCHAR(255),
    rules_document TEXT,
    points_per_win INTEGER DEFAULT 3,
    points_per_tie INTEGER DEFAULT 1,
    points_per_loss INTEGER DEFAULT 0,
    race_to_default INTEGER DEFAULT 13,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seasons table
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE,
    is_active BOOLEAN DEFAULT false,
    playoff_format VARCHAR(50), -- 'single_elimination', 'double_elimination', 'round_robin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, name)
);

-- Divisions table
CREATE TABLE divisions (
    id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    skill_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'professional'
    max_teams INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(season_id, name)
);

-- Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    division_id INTEGER NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    captain_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    logo_url VARCHAR(255),
    home_venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    registration_fee_paid BOOLEAN DEFAULT false,
    registration_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(division_id, name)
);

-- Players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    sa_id_number VARCHAR(13), -- South African ID number
    phone VARCHAR(20),
    email VARCHAR(255),
    date_of_birth DATE,
    handicap INTEGER DEFAULT 0, -- Handicap value (0-10)
    elo_rating INTEGER DEFAULT 1500, -- ELO skill rating
    profile_photo_url VARCHAR(255),
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team-Player relationship (roster)
CREATE TABLE team_players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    is_substitute BOOLEAN DEFAULT false,
    jersey_number INTEGER,
    joined_date DATE DEFAULT CURRENT_DATE,
    left_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, player_id, joined_date)
);

-- ============================================================
-- MATCH MANAGEMENT TABLES
-- ============================================================

-- Matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    division_id INTEGER NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE, -- NULL for BYE
    match_date DATE NOT NULL,
    match_time TIME,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'postponed', 'forfeited', 'cancelled'
    race_to INTEGER DEFAULT 13,
    is_playoff BOOLEAN DEFAULT false,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match results table
CREATE TABLE match_results (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    winner_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    is_forfeit BOOLEAN DEFAULT false,
    forfeit_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    home_lags_won INTEGER DEFAULT 0, -- First frame wins
    away_lags_won INTEGER DEFAULT 0,
    home_break_and_runs INTEGER DEFAULT 0,
    away_break_and_runs INTEGER DEFAULT 0,
    home_8ball_on_break INTEGER DEFAULT 0,
    away_8ball_on_break INTEGER DEFAULT 0,
    submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    home_captain_confirmed BOOLEAN DEFAULT false,
    away_captain_confirmed BOOLEAN DEFAULT false,
    home_captain_confirmed_at TIMESTAMP,
    away_captain_confirmed_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    is_approved BOOLEAN DEFAULT false,
    edit_requested BOOLEAN DEFAULT false,
    edit_reason TEXT,
    UNIQUE(match_id)
);

-- Match disputes table
CREATE TABLE match_disputes (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    filed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dispute_type VARCHAR(50), -- 'score_error', 'conduct', 'rules_violation', 'other'
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'rejected'
    resolution TEXT,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TOURNAMENT TABLES
-- ============================================================

-- Tournaments table
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50) NOT NULL, -- 'single_elimination', 'double_elimination', 'round_robin', 'swiss'
    game_format VARCHAR(20) DEFAULT '8ball', -- '8ball', '9ball', '10ball', 'scotch_doubles'
    status VARCHAR(20) DEFAULT 'registration', -- 'registration', 'in_progress', 'completed', 'cancelled'
    registration_deadline TIMESTAMP,
    start_date DATE,
    end_date DATE,
    max_participants INTEGER,
    entry_fee DECIMAL(10, 2) DEFAULT 0.00,
    prize_pool DECIMAL(10, 2) DEFAULT 0.00,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament matches table (bracket matches)
CREATE TABLE tournament_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    bracket_type VARCHAR(20) DEFAULT 'winner', -- 'winner', 'loser' (for double elimination)
    team1_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    team2_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    winner_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    score1 INTEGER,
    score2 INTEGER,
    next_match_id INTEGER REFERENCES tournament_matches(id) ON DELETE SET NULL,
    loser_next_match_id INTEGER REFERENCES tournament_matches(id) ON DELETE SET NULL,
    is_bye BOOLEAN DEFAULT false,
    match_date DATE,
    match_time TIME,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament registrations table
CREATE TABLE tournament_registrations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    registered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    seed_number INTEGER,
    is_waitlisted BOOLEAN DEFAULT false,
    UNIQUE(tournament_id, team_id)
);

-- ============================================================
-- STATISTICS TABLES
-- ============================================================

-- Player statistics table
CREATE TABLE player_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    matches_played INTEGER DEFAULT 0,
    frames_won INTEGER DEFAULT 0,
    frames_lost INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0, -- Positive for wins, negative for losses
    longest_win_streak INTEGER DEFAULT 0,
    avg_points DECIMAL(5, 2) DEFAULT 0.00,
    break_and_runs INTEGER DEFAULT 0,
    eight_ball_on_break INTEGER DEFAULT 0,
    lags_won INTEGER DEFAULT 0,
    defensive_shots INTEGER DEFAULT 0,
    clutch_wins INTEGER DEFAULT 0, -- Wins in close matches
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, season_id)
);

-- ============================================================
-- PLAYER MANAGEMENT TABLES
-- ============================================================

-- Player availability table
CREATE TABLE player_availability (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, match_date)
);

-- Player transfers table
CREATE TABLE player_transfers (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    from_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    to_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- FINANCIAL TABLES
-- ============================================================

-- Financial transactions table
CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL, -- 'team_registration', 'player_dues', 'tournament_entry', 'prize_payout', 'refund'
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'cash', 'card', 'eft', 'paypal', 'stripe'
    transaction_reference VARCHAR(255),
    receipt_url VARCHAR(255),
    notes TEXT,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- COMMUNICATION TABLES
-- ============================================================

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'match_reminder', 'score_update', 'schedule_change', 'announcement', 'message'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_via_email BOOLEAN DEFAULT false,
    sent_via_sms BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (team messaging)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_announcement BOOLEAN DEFAULT false, -- League-wide announcements
    parent_message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League news/blog table
CREATE TABLE league_news (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    featured_image_url VARCHAR(255),
    category VARCHAR(50), -- 'news', 'highlight', 'announcement', 'story'
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match photos table
CREATE TABLE match_photos (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    photo_url VARCHAR(255) NOT NULL,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ACHIEVEMENTS & GAMIFICATION TABLES
-- ============================================================

-- Achievements table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    badge_icon_url VARCHAR(255),
    criteria TEXT, -- JSON or text describing how to earn
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player achievements table
CREATE TABLE player_achievements (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, achievement_id)
);

-- ============================================================
-- ADMINISTRATION TABLES
-- ============================================================

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venue ratings table
CREATE TABLE venue_ratings (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(venue_id, user_id)
);

-- ============================================================
-- API & INTEGRATION TABLES
-- ============================================================

-- API keys table
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar subscriptions table
CREATE TABLE calendar_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    subscription_token VARCHAR(255) NOT NULL UNIQUE,
    calendar_type VARCHAR(20) DEFAULT 'ical', -- 'ical', 'google'
    is_active BOOLEAN DEFAULT true,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs table
CREATE TABLE webhook_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- 'match_completed', 'score_updated', 'tournament_started'
    payload JSONB NOT NULL,
    webhook_url VARCHAR(255) NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    attempt_count INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Matches indexes
CREATE INDEX idx_matches_division_id ON matches(division_id);
CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_match_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);

-- Teams indexes
CREATE INDEX idx_teams_division_id ON teams(division_id);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);

-- Players indexes
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_elo_rating ON players(elo_rating);

-- Team players indexes
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Tournament matches indexes
CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_round ON tournament_matches(round);

-- Player stats indexes
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_player_stats_season_id ON player_stats(season_id);

-- Financial transactions indexes
CREATE INDEX idx_financial_transactions_team_id ON financial_transactions(team_id);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert default venue (Nicks Pool Lounge Parow)
INSERT INTO venues (name, address, city, province, country, phone, table_count, is_active)
VALUES ('Nicks Pool Lounge Parow', 'Parow', 'Cape Town', 'Western Cape', 'South Africa', '', 10, true);

-- Insert default achievements
INSERT INTO achievements (name, description, badge_icon_url, criteria, points) VALUES
('First Win', 'Win your first match', '/badges/first_win.png', 'Win 1 match', 10),
('Century Club', 'Win 100 frames', '/badges/century.png', 'Win 100 frames', 100),
('Perfect Season', 'Win all matches in a season', '/badges/perfect_season.png', 'Win all matches in a season', 500),
('Break & Run Master', 'Achieve 10 break and runs', '/badges/break_run.png', 'Complete 10 break and runs', 200),
('8-Ball Specialist', 'Sink 8-ball on break 5 times', '/badges/8ball_break.png', 'Sink 8-ball on break 5 times', 150),
('Comeback King', 'Win after being down by 5+ frames', '/badges/comeback.png', 'Win a match after being down by 5+ frames', 100),
('Hot Streak', 'Win 10 matches in a row', '/badges/hot_streak.png', 'Win 10 consecutive matches', 250),
('Team Player', 'Play 50 matches for your team', '/badges/team_player.png', 'Play 50 matches', 75);

COMMENT ON DATABASE pool_league IS 'Pool/Billiard League Management System Database';
