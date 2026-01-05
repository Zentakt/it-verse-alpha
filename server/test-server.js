const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 5000;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

console.log('DB Config:', {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

pool.query('SELECT COUNT(*) FROM teams')
  .then(result => {
    console.log('DB Connected! Teams count:', result.rows[0].count);
  })
  .catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
