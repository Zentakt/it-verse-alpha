const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ite_verse'
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// ===== APP STATE ENDPOINTS =====

// Get current app state
app.get('/api/app-state', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM app_state ORDER BY updated_at DESC LIMIT 1');
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      // Return default state if none exists
      res.json({
        countdown_end: new Date(Date.now() + 1000 * 15).toISOString(),
        is_torch_lit: false,
        is_torch_auto_lit: false,
        selected_team_id: null,
        current_view: 'games'
      });
    }
  } catch (err) {
    console.error('Error fetching app state:', err);
    res.status(500).json({ error: 'Failed to fetch app state' });
  }
});

// Update app state
app.post('/api/app-state', async (req, res) => {
  try {
    const { countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view } = req.body;
    const result = await pool.query(
      `INSERT INTO app_state (countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating app state:', err);
    res.status(500).json({ error: 'Failed to update app state' });
  }
});

// ===== COUNTDOWN ENDPOINT =====

// Update countdown (admin only)
app.post('/api/countdown', async (req, res) => {
  try {
    const { countdown_end } = req.body;
    if (!countdown_end) {
      return res.status(400).json({ error: 'countdown_end is required' });
    }
    const result = await pool.query(
      `UPDATE app_state SET countdown_end = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM app_state ORDER BY updated_at DESC LIMIT 1) RETURNING *`,
      [countdown_end]
    );
    if (result.rows.length === 0) {
      const newState = await pool.query(
        `INSERT INTO app_state (countdown_end) VALUES ($1) RETURNING *`,
        [countdown_end]
      );
      return res.json(newState.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating countdown:', err);
    res.status(500).json({ error: 'Failed to update countdown' });
  }
});

// ===== TORCH ENDPOINT =====

// Light the torch
app.post('/api/torch/light', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE app_state SET is_torch_lit = true, is_torch_auto_lit = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM app_state ORDER BY updated_at DESC LIMIT 1) RETURNING *`
    );
    if (result.rows.length === 0) {
      const newState = await pool.query(
        `INSERT INTO app_state (is_torch_lit, is_torch_auto_lit) VALUES (true, true) RETURNING *`
      );
      return res.json(newState.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error lighting torch:', err);
    res.status(500).json({ error: 'Failed to light torch' });
  }
});

// ===== EVENTS ENDPOINTS =====

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ===== TEAMS ENDPOINTS =====

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team breakdown
app.get('/api/teams/:teamId/breakdown', async (req, res) => {
  try {
    const { teamId } = req.params;
    const result = await pool.query(
      'SELECT * FROM team_breakdown WHERE team_id = $1 ORDER BY created_at DESC',
      [teamId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching team breakdown:', err);
    res.status(500).json({ error: 'Failed to fetch team breakdown' });
  }
});

// Update team points
app.post('/api/teams/:teamId/add-points', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { points, source } = req.body;
    const result = await pool.query(
      'INSERT INTO team_breakdown (team_id, source, points) VALUES ($1, $2, $3) RETURNING *',
      [teamId, source, points]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding points:', err);
    res.status(500).json({ error: 'Failed to add points' });
  }
});

// Update team info
app.put('/api/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, color, description, logo } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name); }
    if (color !== undefined) { updates.push(`color = $${paramIndex++}`); values.push(color); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (logo !== undefined) { updates.push(`logo = $${paramIndex++}`); values.push(logo); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(teamId);
    const result = await pool.query(
      `UPDATE teams SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    console.log(`Team ${teamId} updated successfully:`, result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// ===== EVENTS UPDATE ENDPOINTS =====

// Update event info
app.put('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, game, description, image, short_name, details } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (title) { updates.push(`title = $${paramIndex++}`); values.push(title); }
    if (game) { updates.push(`game = $${paramIndex++}`); values.push(game); }
    if (description) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (image) { updates.push(`image = $${paramIndex++}`); values.push(image); }
    if (short_name) { updates.push(`short_name = $${paramIndex++}`); values.push(short_name); }
    if (details) { updates.push(`details = $${paramIndex++}`); values.push(JSON.stringify(details)); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(eventId);
    const result = await pool.query(
      `UPDATE events SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Update match status/stream
app.put('/api/events/:eventId/matches/:matchId', async (req, res) => {
  try {
    const { eventId, matchId } = req.params;
    const { status, stream_url, score_a, score_b, winner_id } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (status) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (stream_url !== undefined) { updates.push(`stream_url = $${paramIndex++}`); values.push(stream_url); }
    if (score_a !== undefined) { updates.push(`score_a = $${paramIndex++}`); values.push(score_a); }
    if (score_b !== undefined) { updates.push(`score_b = $${paramIndex++}`); values.push(score_b); }
    if (winner_id) { updates.push(`winner_id = $${paramIndex++}`); values.push(winner_id); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(eventId, matchId);
    const result = await pool.query(
      `UPDATE matches SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE event_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`,
      values
    );
    res.json(result.rows[0] || { message: 'Match updated' });
  } catch (err) {
    console.error('Error updating match:', err);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// ===== CHALLENGES ENDPOINTS =====

// Get all challenges
app.get('/api/challenges', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM challenges ORDER BY created_at');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching challenges:', err);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Update all challenges (bulk update)
app.put('/api/challenges', async (req, res) => {
  try {
    const { challenges } = req.body;
    
    // Use a transaction for bulk update
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const challenge of challenges) {
        await client.query(
          `INSERT INTO challenges (id, title, description, question, answer, points, game_type, game_config)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             question = EXCLUDED.question,
             answer = EXCLUDED.answer,
             points = EXCLUDED.points,
             game_type = EXCLUDED.game_type,
             game_config = EXCLUDED.game_config,
             updated_at = CURRENT_TIMESTAMP`,
          [
            challenge.id,
            challenge.title,
            challenge.description,
            challenge.question,
            challenge.answer,
            challenge.points,
            challenge.gameType,
            challenge.gameConfig ? JSON.stringify(challenge.gameConfig) : null
          ]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Challenges updated successfully', count: challenges.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating challenges:', err);
    res.status(500).json({ error: 'Failed to update challenges' });
  }
});

// ===== DATABASE INITIALIZATION =====

// Initialize streams table if it doesn't exist
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streams (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) NOT NULL,
        match_id VARCHAR(50) NOT NULL,
        type VARCHAR(50) DEFAULT 'custom',
        url TEXT NOT NULL,
        platform VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT streams_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id),
        CONSTRAINT streams_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_streams_event_id ON streams(event_id);
      CREATE INDEX IF NOT EXISTS idx_streams_match_id ON streams(match_id);
      CREATE INDEX IF NOT EXISTS idx_streams_event_match ON streams(event_id, match_id);
    `);
    console.log('Streams table initialized');
  } catch (err) {
    console.error('Error initializing streams table:', err.message);
  }
}

// ===== STREAMS ENDPOINTS =====

// Get all streams
app.get('/api/streams', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM streams ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching streams:', err);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get streams for specific event and match
app.get('/api/streams/:eventId/:matchId', async (req, res) => {
  try {
    const { eventId, matchId } = req.params;
    const result = await pool.query(
      'SELECT * FROM streams WHERE event_id = $1 AND match_id = $2 ORDER BY created_at DESC',
      [eventId, matchId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching streams:', err);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Create a new stream
app.post('/api/streams', async (req, res) => {
  try {
    const { event_id, match_id, type, url, platform, is_active } = req.body;
    
    if (!event_id || !match_id || !url) {
      return res.status(400).json({ error: 'event_id, match_id, and url are required' });
    }

    const result = await pool.query(
      `INSERT INTO streams (event_id, match_id, type, url, platform, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event_id, match_id, type || 'custom', url, platform || null, is_active !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating stream:', err);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Update stream (toggle active status)
app.patch('/api/streams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, type, url, platform } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(is_active); }
    if (type) { updates.push(`type = $${paramIndex++}`); values.push(type); }
    if (url) { updates.push(`url = $${paramIndex++}`); values.push(url); }
    if (platform) { updates.push(`platform = $${paramIndex++}`); values.push(platform); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE streams SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating stream:', err);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Delete a stream
app.delete('/api/streams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM streams WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json({ message: 'Stream deleted successfully', stream: result.rows[0] });
  } catch (err) {
    console.error('Error deleting stream:', err);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Initialize database tables on startup
  await initializeDatabase();
});

// Prevent server from exiting
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
