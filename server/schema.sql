-- Create tables for ITE Verse database

-- App State table for synchronized countdown and torch
CREATE TABLE IF NOT EXISTS app_state (
  id SERIAL PRIMARY KEY,
  countdown_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_torch_lit BOOLEAN DEFAULT FALSE,
  is_torch_auto_lit BOOLEAN DEFAULT FALSE,
  selected_team_id VARCHAR(50),
  current_view VARCHAR(50) DEFAULT 'games',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo VARCHAR(255),
  seed INTEGER,
  description TEXT,
  color VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team breakdown (points sources)
CREATE TABLE IF NOT EXISTS team_breakdown (
  id SERIAL PRIMARY KEY,
  team_id VARCHAR(50) NOT NULL REFERENCES teams(id),
  source VARCHAR(255),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  game VARCHAR(255),
  short_name VARCHAR(20),
  image TEXT,
  description TEXT,
  bracket_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(50) PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL REFERENCES events(id),
  team_a VARCHAR(50),
  team_b VARCHAR(50),
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled',
  start_time TIMESTAMP WITH TIME ZONE,
  stream_url TEXT,
  round INTEGER,
  winner_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bracket matches table
CREATE TABLE IF NOT EXISTS bracket_matches (
  id VARCHAR(50) PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL REFERENCES events(id),
  round INTEGER,
  p1_id VARCHAR(50),
  p1_score INTEGER,
  p1_is_winner BOOLEAN,
  p2_id VARCHAR(50),
  p2_score INTEGER,
  p2_is_winner BOOLEAN,
  next_match_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  question TEXT,
  answer TEXT,
  points INTEGER DEFAULT 0,
  game_type VARCHAR(50),
  game_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_app_state_updated ON app_state(updated_at);
CREATE INDEX idx_team_breakdown_team ON team_breakdown(team_id);
CREATE INDEX idx_matches_event ON matches(event_id);
CREATE INDEX idx_bracket_matches_event ON bracket_matches(event_id);
