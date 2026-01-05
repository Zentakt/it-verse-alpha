-- Reset database to clean state with 4 teams only

BEGIN;

-- Clear all data
TRUNCATE TABLE challenges, bracket_matches, matches, events, team_breakdown, teams, app_state RESTART IDENTITY CASCADE;

-- Insert 4 teams
INSERT INTO teams (id, name, logo, seed, description, color) VALUES
('t1', 'Metamorphic Python', '🐍', 1, 'Script Masters', '#eab308'),
('t2', 'Exuberant Ajax', '⚡', 2, 'System Operators', '#06b6d4'),
('t3', 'Java The Explorer', '☕', 3, 'Backend Giants', '#00f0b5'),
('t4', 'Magnificent Ruby', '💎', 4, 'Code Gemstones', '#ef4444');

-- Insert app state
INSERT INTO app_state (countdown_end, is_torch_lit) VALUES
('2026-01-01 00:00:00+08', false);

-- Insert 2 events (MLBB and Valorant)
INSERT INTO events (id, title, game, short_name, image, description, bracket_type) VALUES
('mlbb', 'Exuberant Invitational', 'Mobile Legends: Bang Bang', 'MLBB', 
 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80', 
 'The premier proving ground for mobile operatives.', 'single'),
('val', 'Protocol Alpha', 'Valorant', 'VALORANT', 
 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1600&q=80', 
 'Elite tactical warfare championship.', 'single');

-- Insert 4 challenges
INSERT INTO challenges (id, title, description, question, answer, points, game_type) VALUES
('c1', 'Neural Sync', 'Establish neural handshake protocol.', 'Follow the pattern.', 'ignore', 150, 'sequence'),
('c2', 'Memory Fragment', 'Reconstruct corrupted data blocks.', 'Match the pairs.', 'ignore', 200, 'memory'),
('c3', 'Firewall Breach', 'Decrypt the security key.', 'ENTER PASSKEY: 42', '42', 100, 'cipher'),
('c4', 'System Aptitude', 'Prove your knowledge of the core systems.', 'Answer correctly.', 'ignore', 300, 'quiz');

COMMIT;
