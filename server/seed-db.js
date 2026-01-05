const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ite_verse'
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data using DELETE instead of TRUNCATE to avoid ownership issues
    console.log('Clearing existing data...');
    await pool.query('DELETE FROM team_breakdown;');
    await pool.query('DELETE FROM bracket_matches;');
    await pool.query('DELETE FROM matches;');
    await pool.query('DELETE FROM challenges;');
    await pool.query('DELETE FROM events;');
    await pool.query('DELETE FROM teams;');
    await pool.query('DELETE FROM app_state;');
    
    // App State
    console.log('Inserting app state...');
    await pool.query(
      `INSERT INTO app_state (countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view)
       VALUES ($1, $2, $3, $4, $5)`,
      ['2025-12-31T16:00:00Z', false, false, null, 'games']
    );
    
    // Teams
    console.log('Inserting teams...');
    const teams = [
      ['t1', 'Metamorphic Python', '🐍', 1, 'Script Masters', '#eab308'],
      ['t2', 'Exuberant Ajax', '⚡', 2, 'System Operators', '#06b6d4'],
      ['t3', 'Java The Explorer', '☕', 3, 'Backend Giants', '#00f0b5'],
      ['t4', 'Magnificent Ruby', '💎', 4, 'Code Gemstones', '#ef4444']
    ];
    
    for (const team of teams) {
      await pool.query(
        'INSERT INTO teams (id, name, logo, seed, description, color) VALUES ($1, $2, $3, $4, $5, $6)',
        team
      );
    }
    
    // Team Breakdown
    console.log('Inserting team breakdowns...');
    const breakdowns = [
      ['t1', 'Mobile Legends (3rd)', 100],
      ['t1', 'Chess (Runner-up)', 150],
      ['t1', 'Quiz Bee (Win)', 200],
      ['t2', 'Valorant (3rd)', 100],
      ['t2', 'QR Hunt', 500],
      ['t3', 'Mobile Legends (Win)', 300],
      ['t3', 'Chess (Win)', 200],
      ['t4', 'Valorant (Win)', 300],
      ['t4', 'Call of Duty (Win)', 250]
    ];
    
    for (const breakdown of breakdowns) {
      await pool.query(
        'INSERT INTO team_breakdown (team_id, source, points) VALUES ($1, $2, $3)',
        breakdown
      );
    }
    
    // Events
    console.log('Inserting events...');
    const events = [
      ['mlbb', 'Exuberant Invitational', 'Mobile Legends: Bang Bang', 'MLBB', '', 'Premier proving ground for mobile operatives.', 'single', 'open'],
      ['val', 'Protocol Alpha', 'Valorant', 'VAL', '', 'Tac-shooter showdown.', 'single', 'open'],
      ['tekken', 'Iron Fist Clash', 'Tekken 8', 'TEKKEN', '', 'The ultimate fighting game tournament.', 'single', 'open'],
      ['chess', 'Grandmaster Arena', 'Chess', 'CHESS', '', 'Classic strategy face-off.', 'single', 'open']
    ];
    
    for (const event of events) {
      await pool.query(
        'INSERT INTO events (id, title, game, short_name, image, description, bracket_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        event
      );
    }
    
    // Matches
    console.log('Inserting matches...');
    const matches = [
      ['m1', 'mlbb', 't1', 't3', 1, 2, 'completed', '2025-10-25T10:00:00Z', 1, 't3'],
      ['m2', 'val', 't2', 't4', 13, 10, 'completed', '2025-10-26T12:00:00Z', 1, 't2']
    ];
    
    for (const match of matches) {
      await pool.query(
        'INSERT INTO matches (id, event_id, team_a, team_b, score_a, score_b, status, start_time, round, winner_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        match
      );
    }
    
    // Bracket Matches
    console.log('Inserting bracket matches...');
    const brackets = [
      ['mlbb_r1_m1', 'mlbb', 0, 't1', 1, false, 't3', 2, true, 'mlbb_r2_m1', 'finished'],
      ['mlbb_r2_m1', 'mlbb', 1, 't3', null, null, 'tbd', null, null, null, 'scheduled'],
      ['val_r1_m1', 'val', 0, 't2', 13, true, 't4', 10, false, 'val_r2_m1', 'finished'],
      ['val_r2_m1', 'val', 1, 't2', null, null, 'tbd', null, null, null, 'scheduled']
    ];
    
    for (const bracket of brackets) {
      await pool.query(
        `INSERT INTO bracket_matches (id, event_id, round, p1_id, p1_score, p1_is_winner, p2_id, p2_score, p2_is_winner, next_match_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        bracket
      );
    }
    
    // Challenges
    console.log('Inserting challenges...');
    const challenges = [
      ['c1', 'Neural Sync', 'Establish neural handshake protocol.', 'Follow the pattern.', 'ignore', 150, 'sequence', null],
      ['c2', 'Memory Fragment', 'Reconstruct corrupted data blocks.', 'Match the pairs.', 'ignore', 200, 'memory', null],
      ['c3', 'Firewall Breach', 'Decrypt the security key.', 'ENTER PASSKEY: 42', '42', 100, 'cipher', null],
      ['c4', 'System Aptitude', 'Prove your knowledge.', 'Answer 5 Questions correctly.', 'ignore', 300, 'quiz', JSON.stringify({"questions":[{"q":"What is the primary function of a React Key?","options":["Identify DOM elements","Enhance Security","Sort Arrays","Manage State","Debug Code"],"correct":0},{"q":"Which hook is used for side effects?","options":["useState","useContext","useEffect","useReducer","useCallback"],"correct":2},{"q":"What does CSS z-index control?","options":["Opacity","Zoom Level","Stacking Order","Animation Speed","Grid Layout"],"correct":2},{"q":"Which status code indicates Not Found?","options":["200","500","301","403","404"],"correct":4},{"q":"In binary, what is 101?","options":["3","5","7","2","6"],"correct":1}]})]
    ];
    
    for (const challenge of challenges) {
      await pool.query(
        `INSERT INTO challenges (id, title, description, question, answer, points, game_type, game_config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        challenge
      );
    }
    
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
