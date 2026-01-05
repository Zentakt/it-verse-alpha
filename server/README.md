# ITE Verse Backend API & PostgreSQL Setup

This guide will help you set up the backend API and PostgreSQL database for ITE Verse.

## Prerequisites

- PostgreSQL (version 12 or higher)
- Node.js (version 14 or higher)
- npm

## Setup Instructions

### 1. Create PostgreSQL Database

Open PostgreSQL and run:

```sql
CREATE DATABASE ite_verse;
```

Then connect to the database and run the schema:

```bash
psql -U postgres -d ite_verse -f schema.sql
```

Or copy and paste the contents of `schema.sql` into your PostgreSQL client.

### 2. Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ite_verse
PORT=5000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

The server will run on http://localhost:5000

### 5. Seed Realistic Data (Optional but Recommended)

Populate legit starter data for teams, events, matches, brackets, challenges, and countdown state:

```bash
# From the server directory
psql -U postgres -d ite_verse -f seed.sql
```

If `psql` is not in PATH on Windows, use the full path (adjust version if needed):

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -d ite_verse -f "C:\Users\lenovo\Downloads\ite-verse\server\seed.sql"
```

## API Endpoints

### App State
- GET /api/app-state - Get current app state
- POST /api/app-state - Update app state

### Countdown
- POST /api/countdown - Update countdown timer

### Torch
- POST /api/torch/light - Light the torch

### Teams
- GET /api/teams - Get all teams
- GET /api/teams/:teamId/breakdown - Get team breakdown
- POST /api/teams/:teamId/add-points - Add points to team

### Events
- GET /api/events - Get all events

## Troubleshooting

**Connection refused?**
- Ensure PostgreSQL is running
- Check DB_HOST and DB_PORT in .env

**Database doesn't exist?**
- Run: `createdb -U postgres ite_verse`

**Cannot find module?**
- Run: `npm install`