-- Pool League Management System - Seed Data
-- Sample data for testing and initial setup
-- Date: 2026-02-03

-- ============================================================
-- SEED DATA
-- ============================================================

-- Create admin user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, is_active, email_verified)
VALUES 
('admin', 'admin@poolleague.com', '$2b$10$YourHashedPasswordHere', 'admin', 'System', 'Administrator', true, true),
('captain1', 'captain1@poolleague.com', '$2b$10$YourHashedPasswordHere', 'captain', 'John', 'Smith', true, true),
('captain2', 'captain2@poolleague.com', '$2b$10$YourHashedPasswordHere', 'captain', 'Jane', 'Doe', true, true);

-- Create league
INSERT INTO leagues (name, description, venue_id, points_per_win, points_per_tie, points_per_loss, race_to_default)
VALUES ('Parow Social League', 'Ultimate Centre - Summer League 2025', 1, 3, 1, 0, 13);

-- Create season
INSERT INTO seasons (league_id, name, description, start_date, end_date, is_active)
VALUES (1, 'Summer League 2025', 'Summer season starting December 2025', '2025-12-01', '2026-03-31', true);

-- Create division
INSERT INTO divisions (season_id, name, description, skill_level)
VALUES (1, 'Group A', 'Main division for Summer League 2025', 'intermediate');

-- Create teams (16 teams from the reference images)
INSERT INTO teams (division_id, name, captain_id, is_active, registration_fee_paid) VALUES
(1, 'MUSHROOM MEN', 2, true, true),
(1, 'UNDERDOGS', 2, true, true),
(1, 'MIDAY', 2, true, true),
(1, 'SUPER 8-1', 2, true, true),
(1, 'LEKKER JY', 2, true, true),
(1, 'VALLEY LIONS', 2, true, true),
(1, 'SUPER 8-2', 2, true, true),
(1, 'NICKS DRAGONS', 2, true, true),
(1, 'SHOWSTOPPERS', 2, true, true),
(1, 'RACK ATTACK (FORMERLY KNOWN AS CUELESS)', 2, true, true),
(1, 'C.M.P.A', 2, true, true),
(1, 'MERIDIAN', 2, true, true),
(1, 'EXPENDABLES', 2, true, true),
(1, 'GOLDEN Q 2', 2, true, true),
(1, 'ALL STARS', 2, true, true),
(1, 'GOLDEN Q 1', 2, true, true);

-- Create sample players
INSERT INTO players (user_id, first_name, last_name, phone, handicap, elo_rating, is_active) VALUES
(2, 'Michael', 'Johnson', '0821234567', 3, 1600, true),
(3, 'Sarah', 'Williams', '0827654321', 2, 1550, true),
(2, 'David', 'Brown', '0823456789', 4, 1650, true),
(3, 'Emma', 'Davis', '0829876543', 1, 1500, true),
(2, 'James', 'Wilson', '0825678901', 5, 1700, true),
(3, 'Olivia', 'Taylor', '0828765432', 2, 1520, true),
(2, 'Robert', 'Anderson', '0824567890', 3, 1580, true),
(3, 'Sophia', 'Thomas', '0826543210', 4, 1620, true);

-- Assign players to teams
INSERT INTO team_players (team_id, player_id, is_substitute, jersey_number) VALUES
(1, 1, false, 1),
(1, 2, false, 2),
(2, 3, false, 1),
(2, 4, false, 2),
(3, 5, false, 1),
(3, 6, false, 2),
(4, 7, false, 1),
(4, 8, false, 2);

-- Create sample matches for Round 1 (based on reference image)
-- All matches on Sunday, December 10, 2025 at 8:00 PM
INSERT INTO matches (division_id, round, home_team_id, away_team_id, match_date, match_time, venue_id, status, race_to) VALUES
(1, 1, 1, 10, '2025-12-10', '20:00:00', 1, 'completed', 13),  -- MUSHROOM MEN vs RACK ATTACK
(1, 1, 2, 12, '2025-12-10', '20:00:00', 1, 'completed', 13),  -- ALL STARS vs MERIDIAN
(1, 1, 4, 7, '2026-01-30', '20:00:00', 1, 'completed', 13),   -- SUPER 8-1 vs SUPER 8-2
(1, 1, 11, 3, '2026-01-30', '20:00:00', 1, 'completed', 13),  -- C.M.P.A vs MIDAY
(1, 1, 3, 9, '2025-12-10', '20:00:00', 1, 'completed', 13),   -- UNDERDOGS vs SHOWSTOPPERS
(1, 1, 14, 16, '2025-12-10', '20:00:00', 1, 'scheduled', 13), -- GOLDEN Q 2 vs GOLDEN Q 1
(1, 1, 5, 8, '2025-12-10', '20:00:00', 1, 'completed', 13),   -- LEKKER JY vs NICKS DRAGONS
(1, 1, 13, 6, '2025-12-10', '20:00:00', 1, 'completed', 13);  -- EXPENDABLES vs VALLEY LIONS

-- Create sample match results for Round 1 (based on reference standings)
INSERT INTO match_results (match_id, home_score, away_score, winner_team_id, home_lags_won, away_lags_won, home_captain_confirmed, away_captain_confirmed, is_approved) VALUES
(1, 19, 6, 1, 1, 0, true, true, true),   -- MUSHROOM MEN 19-6 RACK ATTACK
(2, 14, 11, 2, 1, 0, true, true, true),  -- ALL STARS 14-11 MERIDIAN
(3, 14, 11, 4, 1, 0, true, true, true),  -- SUPER 8-1 14-11 SUPER 8-2
(4, 0, 25, 3, 0, 1, true, true, true),   -- C.M.P.A 0-25 MIDAY (forfeit)
(5, 18, 7, 3, 1, 0, true, true, true),   -- UNDERDOGS 18-7 SHOWSTOPPERS
(7, 15, 10, 5, 1, 0, true, true, true),  -- LEKKER JY 15-10 NICKS DRAGONS
(8, 9, 16, 6, 0, 1, true, true, true);   -- EXPENDABLES 9-16 VALLEY LIONS

-- Create sample matches for Round 2
INSERT INTO matches (division_id, round, home_team_id, away_team_id, match_date, match_time, venue_id, status, race_to) VALUES
(1, 2, 1, 12, '2026-01-30', '20:00:00', 1, 'completed', 13),  -- MUSHROOM MEN vs MERIDIAN
(1, 2, 10, 7, '2025-12-17', '20:00:00', 1, 'completed', 13),  -- RACK ATTACK vs SUPER 8-2
(1, 2, 2, 3, '2025-12-17', '20:00:00', 1, 'completed', 13),   -- ALL STARS vs MIDAY
(1, 2, 4, 9, '2025-12-17', '20:00:00', 1, 'completed', 13),   -- SUPER 8-1 vs SHOWSTOPPERS
(1, 2, 11, 16, '2025-12-17', '20:00:00', 1, 'scheduled', 13), -- C.M.P.A vs GOLDEN Q 1
(1, 2, 3, 8, '2025-12-17', '20:00:00', 1, 'completed', 13),   -- UNDERDOGS vs NICKS DRAGONS
(1, 2, 14, 6, '2026-01-30', '20:00:00', 1, 'completed', 13),  -- GOLDEN Q 2 vs VALLEY LIONS
(1, 2, 5, 13, '2025-12-17', '20:00:00', 1, 'completed', 13);  -- LEKKER JY vs EXPENDABLES

-- Create sample match results for Round 2
INSERT INTO match_results (match_id, home_score, away_score, winner_team_id, home_lags_won, away_lags_won, home_captain_confirmed, away_captain_confirmed, is_approved) VALUES
(9, 18, 7, 1, 1, 0, true, true, true),   -- MUSHROOM MEN 18-7 MERIDIAN
(10, 10, 15, 7, 0, 1, true, true, true), -- RACK ATTACK 10-15 SUPER 8-2
(11, 8, 17, 3, 0, 1, true, true, true),  -- ALL STARS 8-17 MIDAY
(12, 16, 9, 4, 1, 0, true, true, true),  -- SUPER 8-1 16-9 SHOWSTOPPERS
(14, 15, 10, 3, 1, 0, true, true, true), -- UNDERDOGS 15-10 NICKS DRAGONS
(15, 11, 14, 6, 0, 1, true, true, true), -- GOLDEN Q 2 11-14 VALLEY LIONS
(16, 17, 8, 5, 1, 0, true, true, true);  -- LEKKER JY 17-8 EXPENDABLES

-- Initialize player stats for the season
INSERT INTO player_stats (player_id, season_id, matches_played, frames_won, frames_lost, win_streak, current_streak, longest_win_streak) VALUES
(1, 1, 5, 45, 20, 3, 3, 3),
(2, 1, 5, 38, 25, 2, 2, 2),
(3, 1, 4, 32, 28, 1, 1, 2),
(4, 1, 4, 28, 30, 0, -1, 1),
(5, 1, 3, 25, 18, 2, 2, 2),
(6, 1, 3, 22, 20, 1, 1, 1),
(7, 1, 2, 18, 15, 1, 1, 1),
(8, 1, 2, 15, 18, 0, -1, 1);

-- Create sample tournament
INSERT INTO tournaments (season_id, name, description, tournament_type, game_format, status, start_date, max_participants, entry_fee, prize_pool, venue_id, created_by) VALUES
(1, 'Summer Championship 2025', 'End of season championship tournament', 'single_elimination', '8ball', 'registration', '2026-03-15', 16, 100.00, 1600.00, 1, 1);

-- Create sample notifications
INSERT INTO notifications (user_id, notification_type, title, message, is_read) VALUES
(2, 'match_reminder', 'Match Reminder', 'Your match against RACK ATTACK is scheduled for Sunday at 8:00 PM', false),
(3, 'score_update', 'Score Updated', 'Match result has been submitted for MUSHROOM MEN vs RACK ATTACK', true);

-- Create sample financial transactions
INSERT INTO financial_transactions (transaction_type, team_id, amount, status, payment_method, processed_by) VALUES
('team_registration', 1, 500.00, 'completed', 'eft', 1),
('team_registration', 2, 500.00, 'completed', 'cash', 1),
('team_registration', 3, 500.00, 'completed', 'card', 1),
('team_registration', 4, 500.00, 'pending', NULL, NULL);

-- Create sample league news
INSERT INTO league_news (league_id, title, content, author_id, category, is_published, published_at) VALUES
(1, 'Welcome to Summer League 2025!', 'We are excited to announce the start of our Summer League 2025 season. All teams are registered and ready to compete!', 1, 'announcement', true, CURRENT_TIMESTAMP),
(1, 'MUSHROOM MEN Dominate Round 1', 'MUSHROOM MEN showed exceptional performance in Round 1 with a commanding 19-6 victory over RACK ATTACK.', 1, 'highlight', true, CURRENT_TIMESTAMP);

-- Note: Password hash shown is a placeholder. In production, use bcrypt to hash actual passwords.
-- Example: For password "password123", use bcrypt with 10 rounds to generate the hash.
