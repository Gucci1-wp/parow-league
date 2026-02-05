-- Truncate tables in correct order (cascade will handle dependencies)
TRUNCATE TABLE match_results, matches, team_players, player_stats, player_statistics, players, teams, divisions, seasons, leagues, venues CASCADE;
TRUNCATE TABLE notifications, messages, financial_transactions, league_news CASCADE;

-- Delete non-admin users
DELETE FROM users WHERE role != 'admin';

-- Insert admin user if not exists (password: admin123)
INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, is_active, failed_login_attempts, email_verified, two_factor_enabled) 
SELECT 1, 'admin', 'admin@parowleague.com', '$2b$10$rQJ5YVZxGxXqKH.vJ5pZYOxJ5YVZxGxXqKH.vJ5pZYOxJ5YVZxGxXq', 'admin', 'Admin', 'User', true, 0, true, false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Reset users sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insert default venue
INSERT INTO venues (id, name, address, city, province, country, table_count, is_active) VALUES
(1, 'Nicks Pool Lounge Parow', 'Parow', 'Cape Town', 'Western Cape', 'South Africa', 8, true);

-- Reset venues sequence
SELECT setval('venues_id_seq', (SELECT MAX(id) FROM venues));

-- Insert league
INSERT INTO leagues (id, name, venue_id, points_per_win, points_per_tie, points_per_loss, race_to_default) VALUES
(1, 'Parow Social League', 1, 3, 1, 0, 13);

-- Reset leagues sequence
SELECT setval('leagues_id_seq', (SELECT MAX(id) FROM leagues));

-- Insert season
INSERT INTO seasons (id, league_id, name, start_date, end_date, is_active) VALUES
(1, 1, 'Summer 2025', '2025-01-01', '2025-06-30', true);

-- Reset seasons sequence
SELECT setval('seasons_id_seq', (SELECT MAX(id) FROM seasons));

-- Insert division
INSERT INTO divisions (id, season_id, name) VALUES
(1, 1, 'Group A');

-- Reset divisions sequence
SELECT setval('divisions_id_seq', (SELECT MAX(id) FROM divisions));

-- Insert 25 teams
INSERT INTO teams (division_id, name, is_active) VALUES
(1, 'DRAGONS 1', true),
(1, 'DRAGONS 2', true),
(1, 'DRAGONS 3', true),
(1, 'DRAGONS 4', true),
(1, 'DRAGONS 5', true),
(1, 'DRAGONS 6', true),
(1, 'RAVENS 1', true),
(1, 'RAVENS 2', true),
(1, 'TIERE 1', true),
(1, 'TIERE 2', true),
(1, 'MANCHESTER 1', true),
(1, 'MANCHESTER 2', true),
(1, 'TITANS 1', true),
(1, 'TITANS 2', true),
(1, 'MAX PC 1', true),
(1, 'MAX PC 2', true),
(1, 'SEXY SHOTS 1', true),
(1, 'SEXY SHOTS 2', true),
(1, 'SEXY SHOTS 3', true),
(1, 'CLUB 9', true),
(1, 'DE MOST', true),
(1, 'OUTLAW 1', true),
(1, 'FUSION', true),
(1, 'OUTOFNOWHERE', true),
(1, 'BYE', true);

-- Reset teams sequence
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));

SELECT 'Database restored with 25 teams successfully!' as message;
