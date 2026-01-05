BEGIN;

INSERT INTO teams (id, name, logo, seed, description, color) VALUES
  ('t1', 'Metamorphic Python', '', 1, 'Script Masters', '#eab308'),
  ('t2', 'Exuberant Ajax', '', 2, 'System Operators', '#06b6d4'),
  ('t3', 'Java The Explorer', '', 3, 'Backend Giants', '#00f0b5'),
  ('t4', 'Magnificent Ruby', '', 4, 'Code Gemstones', '#ef4444');

INSERT INTO team_breakdown (team_id, source, points) VALUES
  ('t1', 'Mobile Legends (3rd)', 100),
  ('t1', 'Chess (Runner-up)', 150),
  ('t1', 'Quiz Bee (Win)', 200),
  ('t2', 'Valorant (3rd)', 100),
  ('t2', 'Coding Challenge (Win)', 300),
  ('t2', 'QR Hunt', 500),
  ('t3', 'Mobile Legends (Win)', 300),
  ('t3', 'Chess (Win)', 200),
  ('t4', 'Valorant (Win)', 300),
  ('t4', 'Call of Duty (Win)', 250);

INSERT INTO app_state (countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view) VALUES
  ('2026-01-15 00:00:00', FALSE, FALSE, NULL, 'games');

INSERT INTO events (id, title, game, short_name, description, bracket_type) VALUES
  ('mlbb', 'Exuberant Invitational', 'Mobile Legends: Bang Bang', 'MLBB', 'The premier proving ground for mobile operatives.', 'single'),
  ('val', 'Protocol Alpha', 'Valorant', 'VALORANT', 'Tactical engagement protocol.', 'single'),
  ('tekken', 'Iron Fist Clash', 'Tekken 8', 'TEKKEN', 'The ultimate fighting game tournament.', 'single'),
  ('chess', 'Grandmaster Arena', 'Chess', 'CHESS', 'Classic strategy face-off.', 'single');

INSERT INTO matches (id, event_id, team_a, team_b, score_a, score_b, status, round, winner_id) VALUES
  ('mlbb_r1_m1', 'mlbb', 't1', 't3', 1, 2, 'completed', 0, 't3'),
  ('mlbb_r1_m2', 'mlbb', 't2', 't4', 2, 1, 'completed', 0, 't2'),
  ('mlbb_r2_m1', 'mlbb', 't3', 't2', NULL, NULL, 'scheduled', 1, NULL),
  ('val_r1_m1', 'val', 't2', 't4', 13, 10, 'completed', 0, 't2'),
  ('val_r1_m2', 'val', 't1', 't3', 12, 8, 'completed', 0, 't1'),
  ('val_r2_m1', 'val', 't2', 't1', NULL, NULL, 'scheduled', 1, NULL);

INSERT INTO bracket_matches (id, event_id, round, p1_team_id, p1_score, p2_team_id, p2_score, next_match_id, status) VALUES
  ('mlbb_bracket_r1_m1', 'mlbb', 0, 't1', 1, 't3', 2, 'mlbb_bracket_r2_m1', 'finished'),
  ('mlbb_bracket_r1_m2', 'mlbb', 0, 't2', 2, 't4', 0, 'mlbb_bracket_r2_m1', 'finished'),
  ('mlbb_bracket_r2_m1', 'mlbb', 1, 't3', NULL, 't2', NULL, NULL, 'scheduled'),
  ('val_bracket_r1_m1', 'val', 0, 't2', 13, 't4', 10, 'val_bracket_r2_m1', 'finished'),
  ('val_bracket_r1_m2', 'val', 0, 't1', 12, 't3', 8, 'val_bracket_r2_m1', 'finished'),
  ('val_bracket_r2_m1', 'val', 1, 't2', NULL, 't1', NULL, NULL, 'scheduled');

INSERT INTO challenges (id, title, description, question, answer, points, game_type) VALUES
  ('c1', 'Neural Sync', 'Establish neural handshake protocol.', 'Follow the pattern.', 'ignore', 150, 'sequence'),
  ('c2', 'Memory Fragment', 'Reconstruct corrupted data blocks.', 'Match the pairs.', 'ignore', 200, 'memory'),
  ('c3', 'Firewall Breach', 'Decrypt the security key.', 'ENTER PASSKEY: 42', '42', 100, 'cipher'),
  ('c4', 'System Aptitude', 'Prove your knowledge of the core systems.', 'Answer 5 Questions correctly.', 'ignore', 300, 'quiz');

COMMIT;