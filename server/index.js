const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const allowedMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon'
];

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Use png/jpg/webp/gif/svg/ico'));
    }
  }
});

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
    const { countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view, viewer_username } = req.body;
    
    // If viewer_username is provided, update the existing record instead of inserting
    if (viewer_username !== undefined) {
      const updateResult = await pool.query(
        `UPDATE app_state 
         SET selected_team_id = COALESCE($1, selected_team_id),
             viewer_username = $2
         WHERE id = (SELECT id FROM app_state ORDER BY updated_at DESC LIMIT 1) 
         RETURNING *`,
        [selected_team_id, viewer_username]
      );
      
      if (updateResult.rows.length > 0) {
        // Broadcast username update via WebSocket
        broadcastToClients({ 
          type: 'viewer_username_updated', 
          data: { viewer_username, selected_team_id } 
        });
        console.log('✅ Viewer username updated:', viewer_username);
        return res.json(updateResult.rows[0]);
      }
    }
    
    const result = await pool.query(
      `INSERT INTO app_state (countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view, viewer_username)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [countdown_end, is_torch_lit, is_torch_auto_lit, selected_team_id, current_view, viewer_username]
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

// Update event info (supports camelCase + snake_case payloads)
app.put('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title, game, description, image, short_name, shortName, details,
      game_logo, gameLogo, banner,
      start_date, startDate, format,
      entry_fee, entryFee,
      countdown_end, countdownEnd,
      global_seed, globalSeed,
      mode_wins, modeWins,
      mode_losses, modeLosses,
      match_history_synced, matchHistorySynced,
      status_registration, statusRegistration,
      status_confirmation, statusConfirmation,
      status_seeding, statusSeeding,
      rules, rulesText,
      available_slots, availableSlots,
      confirmed_slots, confirmedSlots,
      bracket_type, status
    } = req.body;

    const normalized = {
      short_name: shortName ?? short_name,
      game_logo: gameLogo ?? game_logo,
      banner,
      start_date: startDate ?? start_date,
      format,
      entry_fee: entryFee ?? entry_fee,
      countdown_end: countdownEnd ?? countdown_end,
      global_seed: globalSeed ?? global_seed,
      mode_wins: modeWins ?? mode_wins,
      mode_losses: modeLosses ?? mode_losses,
      match_history_synced: matchHistorySynced ?? match_history_synced,
      status_registration: statusRegistration ?? status_registration,
      status_confirmation: statusConfirmation ?? status_confirmation,
      status_seeding: statusSeeding ?? status_seeding,
      rules: rulesText ?? rules,
      available_slots: availableSlots ?? available_slots,
      confirmed_slots: confirmedSlots ?? confirmed_slots,
      bracket_type,
      status,
    };

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); values.push(title); }
    if (game !== undefined) { updates.push(`game = $${paramIndex++}`); values.push(game); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (image !== undefined) { updates.push(`image = $${paramIndex++}`); values.push(image); }
    if (normalized.short_name !== undefined) { updates.push(`short_name = $${paramIndex++}`); values.push(normalized.short_name); }
    if (details !== undefined) { updates.push(`details = $${paramIndex++}`); values.push(JSON.stringify(details)); }
    if (normalized.game_logo !== undefined) { updates.push(`game_logo = $${paramIndex++}`); values.push(normalized.game_logo); }
    if (normalized.banner !== undefined) { updates.push(`banner = $${paramIndex++}`); values.push(normalized.banner); }
    if (normalized.start_date !== undefined) { updates.push(`start_date = $${paramIndex++}`); values.push(normalized.start_date); }
    if (normalized.format !== undefined) { updates.push(`format = $${paramIndex++}`); values.push(normalized.format); }
    if (normalized.entry_fee !== undefined) { updates.push(`entry_fee = $${paramIndex++}`); values.push(normalized.entry_fee); }
    if (normalized.countdown_end !== undefined) { updates.push(`countdown_end = $${paramIndex++}`); values.push(normalized.countdown_end); }
    if (normalized.global_seed !== undefined) { updates.push(`global_seed = $${paramIndex++}`); values.push(normalized.global_seed); }
    if (normalized.mode_wins !== undefined) { updates.push(`mode_wins = $${paramIndex++}`); values.push(normalized.mode_wins); }
    if (normalized.mode_losses !== undefined) { updates.push(`mode_losses = $${paramIndex++}`); values.push(normalized.mode_losses); }
    if (normalized.match_history_synced !== undefined) { updates.push(`match_history_synced = $${paramIndex++}`); values.push(normalized.match_history_synced); }
    if (normalized.status_registration !== undefined) { updates.push(`status_registration = $${paramIndex++}`); values.push(normalized.status_registration); }
    if (normalized.status_confirmation !== undefined) { updates.push(`status_confirmation = $${paramIndex++}`); values.push(normalized.status_confirmation); }
    if (normalized.status_seeding !== undefined) { updates.push(`status_seeding = $${paramIndex++}`); values.push(normalized.status_seeding); }
    if (normalized.rules !== undefined) { updates.push(`rules = $${paramIndex++}`); values.push(normalized.rules); }
    if (normalized.available_slots !== undefined) { updates.push(`available_slots = $${paramIndex++}`); values.push(normalized.available_slots); }
    if (normalized.confirmed_slots !== undefined) { updates.push(`confirmed_slots = $${paramIndex++}`); values.push(normalized.confirmed_slots); }
    if (normalized.bracket_type !== undefined) { updates.push(`bracket_type = $${paramIndex++}`); values.push(normalized.bracket_type); }
    if (normalized.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(normalized.status); }

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
    const { status, stream_url, score_a, score_b, winner_id, team_a_logo, team_b_logo } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (stream_url !== undefined) { updates.push(`stream_url = $${paramIndex++}`); values.push(stream_url); }
    if (score_a !== undefined) { updates.push(`score_a = $${paramIndex++}`); values.push(score_a); }
    if (score_b !== undefined) { updates.push(`score_b = $${paramIndex++}`); values.push(score_b); }
    if (winner_id !== undefined) { updates.push(`winner_id = $${paramIndex++}`); values.push(winner_id); }
    if (team_a_logo !== undefined) { updates.push(`team_a_logo = $${paramIndex++}`); values.push(team_a_logo); }
    if (team_b_logo !== undefined) { updates.push(`team_b_logo = $${paramIndex++}`); values.push(team_b_logo); }
    
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

// Initialize database - just verify connection
async function initializeDatabase() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection verified');
  } catch (err) {
    console.error('Database connection failed:', err.message);
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

// ===== FILE UPLOAD =====
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

app.post('/api/teams/:teamId/logo', upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
  await pool.query('UPDATE teams SET logo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [fileUrl, req.params.teamId]);
  res.json({ success: true, url: fileUrl });
});

app.post('/api/events/:eventId/image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
  await pool.query('UPDATE events SET image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [fileUrl, req.params.eventId]);
  res.json({ success: true, url: fileUrl });
});

// ===== CRUD TEAMS =====
app.post('/api/teams', async (req, res) => {
  const { id, name, logo, seed, description, color } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  const result = await pool.query(
    'INSERT INTO teams (id, name, logo, seed, description, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [id, name, logo || '??', seed || 1, description || '', color || '#7c3aed']
  );
  res.status(201).json(result.rows[0]);
});

app.delete('/api/teams/:teamId', async (req, res) => {
  await pool.query('DELETE FROM team_breakdown WHERE team_id = $1', [req.params.teamId]);
  const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING *', [req.params.teamId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
  res.json({ success: true, team: result.rows[0] });
});

// ===== CRUD EVENTS =====
app.post('/api/events', async (req, res) => {
  const {
    id, title, game, short_name, shortName, image, description, bracket_type, status,
    game_logo, gameLogo, banner, start_date, startDate, format, entry_fee, entryFee,
    countdown_end, countdownEnd, global_seed, globalSeed, mode_wins, modeWins,
    mode_losses, modeLosses, match_history_synced, matchHistorySynced,
    status_registration, statusRegistration, status_confirmation, statusConfirmation, status_seeding, statusSeeding,
    rules, rulesText, available_slots, availableSlots, confirmed_slots, confirmedSlots
  } = req.body;

  if (!id || !title) return res.status(400).json({ error: 'id and title required' });

  const normalized = {
    short_name: shortName ?? short_name,
    game_logo: gameLogo ?? game_logo,
    banner,
    start_date: startDate ?? start_date,
    format,
    entry_fee: entryFee ?? entry_fee,
    countdown_end: countdownEnd ?? countdown_end,
    global_seed: globalSeed ?? global_seed,
    mode_wins: modeWins ?? mode_wins,
    mode_losses: modeLosses ?? mode_losses,
    match_history_synced: matchHistorySynced ?? match_history_synced,
    status_registration: statusRegistration ?? status_registration,
    status_confirmation: statusConfirmation ?? status_confirmation,
    status_seeding: statusSeeding ?? status_seeding,
    rules: rulesText ?? rules,
    available_slots: availableSlots ?? available_slots,
    confirmed_slots: confirmedSlots ?? confirmed_slots,
  };

  const result = await pool.query(
    `INSERT INTO events (
      id, title, game, short_name, image, description, bracket_type, status,
      game_logo, banner, start_date, format, entry_fee, countdown_end, global_seed,
      mode_wins, mode_losses, match_history_synced, status_registration, status_confirmation, status_seeding,
      rules, available_slots, confirmed_slots
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21,
      $22, $23, $24
    ) RETURNING *`,
    [
      id, title, game || '', normalized.short_name || '', image || '', description || '', bracket_type || 'single', status || 'pending',
      normalized.game_logo || null, normalized.banner || null, normalized.start_date || null, normalized.format || null,
      normalized.entry_fee ?? null, normalized.countdown_end || null, normalized.global_seed ?? null,
      normalized.mode_wins ?? 0, normalized.mode_losses ?? 0, normalized.match_history_synced ?? false,
      normalized.status_registration || null, normalized.status_confirmation || null, normalized.status_seeding || null,
      normalized.rules || null, normalized.available_slots ?? null, normalized.confirmed_slots ?? null
    ]
  );
  res.status(201).json(result.rows[0]);
});

app.delete('/api/events/:eventId', async (req, res) => {
  await pool.query('DELETE FROM matches WHERE event_id = $1', [req.params.eventId]);
  await pool.query('DELETE FROM bracket_matches WHERE event_id = $1', [req.params.eventId]);
  const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.eventId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true, event: result.rows[0] });
});

// ===== LIVE STREAMS ENDPOINTS (Live Arena Customization) =====

// Get all live streams
app.get('/api/live-streams', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, title, description, embed_url, thumbnail_url, thumbnail_mode,
        game_category, tournament_id, status, placement, starts_at, ended_at,
        team1_name, team1_logo, team1_score, team2_name, team2_logo, team2_score,
        created_at, updated_at
      FROM live_streams
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching live streams:', err);
    res.status(500).json({ error: 'Failed to fetch live streams' });
  }
});

// Get live streams by placement (hero, recommended, previous)
// Supports both legacy single placement and new multi-placement (comma-separated)
app.get('/api/live-streams/placement/:placement', async (req, res) => {
  try {
    const { placement } = req.params;
    const result = await pool.query(`
      SELECT * FROM live_streams
      WHERE placement LIKE $1
      ORDER BY created_at DESC
    `, [`%${placement}%`]);
    
    // Parse placement to array
    const streams = result.rows.map(stream => ({
      ...stream,
      placement: stream.placement ? stream.placement.split(',').map(p => p.trim()) : ['recommended']
    }));
    
    res.json(streams);
  } catch (err) {
    console.error('Error fetching live streams by placement:', err);
    res.status(500).json({ error: 'Failed to fetch live streams' });
  }
});

// Create new live stream
app.post('/api/live-streams', async (req, res) => {
  try {
    const { 
      title, description, embed_url, thumbnail_url, thumbnail_mode,
      game_category, tournament_id, status, placement, starts_at
    } = req.body;
    
    if (!title || !embed_url) {
      return res.status(400).json({ error: 'title and embed_url are required' });
    }
    
    // Convert placement array to comma-separated string
    const placementStr = Array.isArray(placement) ? placement.join(',') : (placement || 'recommended');
    
    const result = await pool.query(`
      INSERT INTO live_streams 
        (id, title, description, embed_url, thumbnail_url, thumbnail_mode, 
         game_category, tournament_id, status, placement, starts_at, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      RETURNING *
    `, [title, description, embed_url, thumbnail_url, thumbnail_mode || 'upload', 
        game_category, tournament_id, status || 'scheduled', placementStr, starts_at]);
    
    // Parse placement back to array for response and broadcast
    const streamData = {
      ...result.rows[0],
      placement: result.rows[0].placement ? result.rows[0].placement.split(',').map(p => p.trim()) : ['recommended']
    };
    
    // Broadcast WebSocket event
    broadcastToClients({ type: 'live_stream_created', data: streamData });
    
    res.status(201).json(streamData);
  } catch (err) {
    console.error('Error creating live stream:', err);
    res.status(500).json({ error: 'Failed to create live stream' });
  }
});

// Update live stream
app.put('/api/live-streams/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { 
      title, description, embed_url, thumbnail_url, thumbnail_mode,
      game_category, tournament_id, status, placement, starts_at, ended_at
    } = req.body;
    
    // Convert placement array to comma-separated string if provided
    const placementStr = placement !== undefined 
      ? (Array.isArray(placement) ? placement.join(',') : placement)
      : undefined;
    
    const result = await pool.query(`
      UPDATE live_streams
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        embed_url = COALESCE($3, embed_url),
        thumbnail_url = COALESCE($4, thumbnail_url),
        thumbnail_mode = COALESCE($5, thumbnail_mode),
        game_category = COALESCE($6, game_category),
        tournament_id = COALESCE($7, tournament_id),
        status = COALESCE($8, status),
        placement = COALESCE($9, placement),
        starts_at = COALESCE($10, starts_at),
        ended_at = COALESCE($11, ended_at),
        updated_at = now()
      WHERE id = $12::uuid
      RETURNING *
    `, [title, description, embed_url, thumbnail_url, thumbnail_mode,
        game_category, tournament_id, status, placementStr, starts_at, ended_at, streamId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Live stream not found' });
    }
    
    // Parse placement back to array for response and broadcast
    const streamData = {
      ...result.rows[0],
      placement: result.rows[0].placement ? result.rows[0].placement.split(',').map(p => p.trim()) : ['recommended']
    };
    
    // Broadcast WebSocket event
    broadcastToClients({ type: 'live_stream_updated', data: streamData });
    
    res.json(streamData);
  } catch (err) {
    console.error('Error updating live stream:', err);
    res.status(500).json({ error: 'Failed to update live stream' });
  }
});

// Update stream status and auto-move to previous if ended
app.put('/api/live-streams/:streamId/status', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { status } = req.body;
    
    if (!['scheduled', 'live', 'ended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Auto-move to 'previous' placement if status is 'ended'
    const placement = status === 'ended' ? 'previous' : undefined;
    
    const result = await pool.query(`
      UPDATE live_streams
      SET 
        status = $1,
        ${placement ? 'placement = $2,' : ''}
        ended_at = ${status === 'ended' ? 'now()' : 'ended_at'},
        updated_at = now()
      WHERE id = $${placement ? '3' : '2'}::uuid
      RETURNING *
    `, placement ? [status, placement, streamId] : [status, streamId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Live stream not found' });
    }
    
    // Broadcast WebSocket event
    broadcastToClients({ type: 'live_stream_status_changed', data: result.rows[0] });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating stream status:', err);
    res.status(500).json({ error: 'Failed to update stream status' });
  }
});

// Delete live stream
app.delete('/api/live-streams/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const result = await pool.query(
      'DELETE FROM live_streams WHERE id = $1::uuid RETURNING *',
      [streamId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Live stream not found' });
    }
    
    // Broadcast WebSocket event
    broadcastToClients({ type: 'live_stream_deleted', data: { id: streamId } });
    
    res.json({ success: true, stream: result.rows[0] });
  } catch (err) {
    console.error('Error deleting live stream:', err);
    res.status(500).json({ error: 'Failed to delete live stream' });
  }
});

// Helper function to broadcast to all WebSocket clients
function broadcastToClients(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// ===== SYNC ENDPOINT =====
app.get('/api/sync', async (req, res) => {
  try {
    const [teams, events, matches, brackets, appState, challenges] = await Promise.all([
      pool.query('SELECT * FROM teams ORDER BY seed'),
      pool.query('SELECT * FROM events ORDER BY created_at DESC'),
      pool.query('SELECT * FROM matches ORDER BY event_id, round'),
      pool.query('SELECT * FROM bracket_matches ORDER BY event_id, round'),
      pool.query('SELECT * FROM app_state ORDER BY updated_at DESC LIMIT 1'),
      pool.query('SELECT * FROM challenges ORDER BY created_at')
    ]);
    
    const teamBreakdowns = await pool.query('SELECT * FROM team_breakdown ORDER BY team_id');
    const breakdownByTeam = {};
    teamBreakdowns.rows.forEach(b => {
      if (!breakdownByTeam[b.team_id]) breakdownByTeam[b.team_id] = [];
      breakdownByTeam[b.team_id].push({ source: b.source, points: b.points });
    });
    
    const teamsWithBreakdown = teams.rows.map(t => ({ ...t, breakdown: breakdownByTeam[t.id] || [] }));
    
    const matchesByEvent = {};
    matches.rows.forEach(m => {
      if (!matchesByEvent[m.event_id]) matchesByEvent[m.event_id] = [];
      matchesByEvent[m.event_id].push({
        id: m.id,
        teamA: m.team_a,
        teamB: m.team_b,
        scoreA: m.score_a,
        scoreB: m.score_b,
        status: m.status,
        startTime: m.start_time,
        streamUrl: m.stream_url,
        round: m.round,
        winnerId: m.winner_id,
        teamALogo: m.team_a_logo,
        teamBLogo: m.team_b_logo,
      });
    });
    
    const bracketsByEvent = {};
    brackets.rows.forEach(b => {
      if (!bracketsByEvent[b.event_id]) bracketsByEvent[b.event_id] = [];
      bracketsByEvent[b.event_id].push({
        id: b.id, round: b.round, nextMatchId: b.next_match_id, status: b.status,
        p1: { id: b.p1_id, score: b.p1_score, isWinner: b.p1_is_winner },
        p2: { id: b.p2_id, score: b.p2_score, isWinner: b.p2_is_winner }
      });
    });
    
    const eventsWithData = events.rows.map(e => {
      const rulesText = e.rules || '';
      const rulesArray = rulesText
        ? rulesText.split(/\r?\n|,/).map(r => r.trim()).filter(Boolean)
        : [];
      const entryFeeNumber = e.entry_fee !== null && e.entry_fee !== undefined ? Number(e.entry_fee) : null;
      return {
        id: e.id,
        title: e.title,
        game: e.game,
        shortName: e.short_name,
        image: e.image,
        description: e.description,
        bracketType: e.bracket_type,
        status: e.status,
        gameLogo: e.game_logo,
        banner: e.banner,
        startDate: e.start_date,
        format: e.format,
        entryFee: entryFeeNumber,
        countdownEnd: e.countdown_end,
        globalSeed: e.global_seed,
        modeWins: e.mode_wins,
        modeLosses: e.mode_losses,
        matchHistorySynced: e.match_history_synced,
        statusRegistration: e.status_registration,
        statusConfirmation: e.status_confirmation,
        statusSeeding: e.status_seeding,
        rulesText,
        availableSlots: e.available_slots,
        confirmedSlots: e.confirmed_slots,
        matches: matchesByEvent[e.id] || [],
        bracket: bracketsByEvent[e.id] || [],
        details: {
          status: e.status_registration || 'Open',
          prizePool: '? 100,000',
          entryFee: entryFeeNumber !== null ? `${entryFeeNumber}` : 'FREE',
          format: e.format || '5v5',
          brief: e.description,
          rules: rulesArray,
          schedule: { day: '00', hour: '00', min: '00', sec: '00' }
        },
        teamRecord: { wins: e.mode_wins || 0, losses: e.mode_losses || 0, note: '' },
        organizer: { name: 'Admin', email: 'admin@iteverse.com' }
      };
    });
    
    res.json({
      teams: teamsWithBreakdown, events: eventsWithData,
      appState: appState.rows[0] || null,
      challenges: challenges.rows.map(c => ({ id: c.id, title: c.title, description: c.description, question: c.question, answer: c.answer, points: c.points, gameType: c.game_type, gameConfig: c.game_config })),
      streams: [], timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error syncing:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Initialize WebSocket server for real-time updates
const wss = new WebSocket.Server({ server: httpServer, path: '/api/ws' });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('? WebSocket client connected. Total clients:', clients.size + 1);
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('?? WebSocket message received:', data.type);

      // Broadcast message to all connected clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('? WebSocket client disconnected. Total clients:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`?? Server running on http://localhost:${PORT}`);
  console.log(`?? WebSocket available at ws://localhost:${PORT}/api/ws`);
  
  // Initialize database tables on startup
  await initializeDatabase();
});

// Keep server alive
httpServer.keepAliveTimeout = 120000;
httpServer.headersTimeout = 120000;

// Prevent server from exiting
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Keep the process running
setInterval(() => {}, 1000);



