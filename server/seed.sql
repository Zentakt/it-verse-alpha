BEGIN;

-- Clear existing data and reset sequences
TRUNCATE app_state, team_breakdown, teams, events, matches, bracket_matches, challenges RESTART IDENTITY CASCADE;

-- Global App State
INSERT INTO app_state (countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view)
VALUES ('2025-12-31T16:00:00Z', false, false, NULL, 'games');

-- Teams (temporary emojis as logos)
INSERT INTO teams (id, name, logo, seed, description, color) VALUES
('t1','Metamorphic Python','🐍',1,'Script Masters','#eab308'),
('t2','Exuberant Ajax','⚡',2,'System Operators','#06b6d4'),
('t3','Java The Explorer','☕',3,'Backend Giants','#00f0b5'),
('t4','Magnificent Ruby','💎',4,'Code Gemstones','#ef4444');

-- Team Breakdown (initial points)
INSERT INTO team_breakdown (team_id, source, points) VALUES
('t1','Mobile Legends (3rd)',100),
('t1','Chess (Runner-up)',150),
('t1','Quiz Bee (Win)',200),
('t2','Valorant (3rd)',100),
('t2','QR Hunt',500),
('t3','Mobile Legends (Win)',300),
('t3','Chess (Win)',200),
('t4','Valorant (Win)',300),
('t4','Call of Duty (Win)',250);

-- Events
INSERT INTO events (id,title,game,short_name,image,description,bracket_type,status) VALUES
('mlbb','Exuberant Invitational','Mobile Legends: Bang Bang','MLBB','', 'Premier proving ground for mobile operatives.','single','open'),
('val','Protocol Alpha','Valorant','VAL','', 'Tac-shooter showdown.','single','open'),
('tekken','Iron Fist Clash','Tekken 8','TEKKEN','', 'The ultimate fighting game tournament.','single','open'),
('chess','Grandmaster Arena','Chess','CHESS','', 'Classic strategy face-off.','single','open');

-- Matches
INSERT INTO matches (id,event_id,team_a,team_b,score_a,score_b,status,start_time,round,winner_id) VALUES
('m1','mlbb','t1','t3',1,2,'completed','2025-10-25T10:00:00Z',1,'t3'),
('m2','val','t2','t4',13,10,'completed','2025-10-26T12:00:00Z',1,'t2');

-- Bracket Matches (Single Elimination examples)
INSERT INTO bracket_matches (id,event_id,round,p1_id,p1_score,p1_is_winner,p2_id,p2_score,p2_is_winner,next_match_id,status) VALUES
('mlbb_r1_m1','mlbb',0,'t1',1,false,'t3',2,true,'mlbb_r2_m1','finished'),
('mlbb_r2_m1','mlbb',1,'t3',NULL,NULL,'tbd',NULL,NULL,NULL,'scheduled'),
('val_r1_m1','val',0,'t2',13,true,'t4',10,false,'val_r2_m1','finished'),
('val_r2_m1','val',1,'t2',NULL,NULL,'tbd',NULL,NULL,NULL,'scheduled');

-- Challenges
INSERT INTO challenges (id,title,description,question,answer,points,game_type,game_config) VALUES
('c1','Neural Sync','Establish neural handshake protocol.','Follow the pattern.','ignore',150,'sequence',NULL),
('c2','Memory Fragment','Reconstruct corrupted data blocks.','Match the pairs.','ignore',200,'memory',NULL),
('c3','Firewall Breach','Decrypt the security key.','ENTER PASSKEY: 42','42',100,'cipher',NULL),
('c4','System Aptitude','Prove your knowledge.','Answer 5 Questions correctly.','ignore',300,'quiz',
 '{
    "questions":[
      {"q":"What is the primary function of a React Key?","options":["Identify DOM elements","Enhance Security","Sort Arrays","Manage State","Debug Code"],"correct":0},
      {"q":"Which hook is used for side effects?","options":["useState","useContext","useEffect","useReducer","useCallback"],"correct":2},
      {"q":"What does CSS z-index control?","options":["Opacity","Zoom Level","Stacking Order","Animation Speed","Grid Layout"],"correct":2},
      {"q":"Which status code indicates Not Found?","options":["200","500","301","403","404"],"correct":4},
      {"q":"In binary, what is 101?","options":["3","5","7","2","6"],"correct":1}
    ]
  }'::jsonb);

COMMIT;
