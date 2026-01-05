#  QUICK REFERENCE - ITE VERSE DATABASE SETUP

## Files Created

\\\
ite-verse/
 server/                    # NEW: Backend Node.js server
    index.js              # Express API server
    schema.sql            # PostgreSQL table schemas
    package.json          # Node dependencies
    .env.example          # Environment template
    README.md             # Backend docs
    node_modules/         # Dependencies
 DATABASE_SETUP.md         # Complete setup guide
 DATABASE_INTEGRATION_COMPLETE.md
\\\

## Setup Checklist

- [ ] Install PostgreSQL from postgresql.org
- [ ] Create database: \CREATE DATABASE ite_verse;\
- [ ] Load schema: \psql -U postgres -d ite_verse -f server/schema.sql\
- [ ] Copy .env: \cd server && cp .env.example .env\
- [ ] Edit .env with your PostgreSQL password
- [ ] Install dependencies: \
pm install\ (in server folder)
- [ ] Start backend: \
pm start\ (port 5000)
- [ ] Start frontend: \
pm run dev\ (port 3001)
- [ ] Test: http://localhost:3001

## Command Quick Reference

### Start Backend
\\\ash
cd server
npm start          # Production
npm run dev        # Development with hot reload
\\\

### Setup Database
\\\ash
# Create database
psql -U postgres -c \"CREATE DATABASE ite_verse;\"

# Load schema
cd server
psql -U postgres -d ite_verse -f schema.sql

# Test connection
psql -U postgres -d ite_verse -c \"SELECT * FROM app_state LIMIT 1;\"
\\\

### Start Frontend
\\\ash
npm run dev
\\\

## API Endpoints

All endpoints start with: http://localhost:5000/api/

### State Management
- GET /app-state - Get current state
- POST /app-state - Update state
- POST /countdown - Set countdown timer
- POST /torch/light - Light the torch

### Teams
- GET /teams - All teams
- GET /teams/:id/breakdown - Team points
- POST /teams/:id/add-points - Add points

### Events
- GET /events - All events

## Database Tables

- **app_state** - Timer & torch (global sync)
- **teams** - Team info
- **team_breakdown** - Points per source
- **events** - Tournaments
- **matches** - Match results
- **bracket_matches** - Bracket data
- **challenges** - Quiz questions

## Deployment Checklist

For Hostinger Business Plan:
- [ ] Create PostgreSQL database in Hostinger
- [ ] Create Node.js app in Hostinger
- [ ] Upload server folder
- [ ] Create .env with Hostinger DB credentials
- [ ] Run schema.sql in Hostinger
- [ ] Update React API URL to Hostinger domain
- [ ] Test connection
- [ ] Deploy!

## Common Issues

**\"psql: command not found\"**
 PostgreSQL not installed or not in PATH

**\"database ite_verse does not exist\"**
 Run: \createdb -U postgres ite_verse\

**\"connection refused\"**
 PostgreSQL not running

**API not responding**
 Backend not running on port 5000
 Check .env configuration

## Documentation Files

1. **DATABASE_SETUP.md** - Detailed step-by-step guide
2. **DATABASE_INTEGRATION_COMPLETE.md** - Overview and benefits
3. **server/README.md** - Backend specific docs
4. **server/schema.sql** - Database structure

## Key Points

 Frontend and backend are separate
 API handles all state management
 Database syncs across all users
 Timer and torch are global (all users see same)
 Everything persists to PostgreSQL

## Next: Run the Setup!

See DATABASE_SETUP.md for complete instructions.
