# COMPLETE DATABASE SETUP GUIDE FOR ITE VERSE

## Architecture Overview

Your ITE Verse application now has a complete client-server architecture:


  React Frontend (Port 3000/3001)                           
  - Displays UI                                              
  - Makes API calls to Backend                              
─
                          HTTP/REST API Calls
                         
─
  Node.js Backend (Port 5000)                               
  - Express.js Server                                        
  - Handles business logic                                   
  - Real-time state management                              
─
                          SQL Queries
                         

  PostgreSQL Database                                        
  - Stores all application data                             
  - Syncs state across all users                            
  - Persists timer and torch state                          
─

## STEP 1: Install PostgreSQL

Download and install PostgreSQL from: https://www.postgresql.org/download/

After installation:
- Open pgAdmin (PostgreSQL GUI) or use Command Line
- Default user: postgres
- Default password: (you set during installation)

## STEP 2: Create Database

Open pgAdmin or PowerShell and run:

\\\ash
psql -U postgres
CREATE DATABASE ite_verse;
\\\

## STEP 3: Load Database Schema

Navigate to the server folder and run:

\\\ash
cd server
psql -U postgres -d ite_verse -f schema.sql
\\\

This creates all necessary tables.

## STEP 4: Configure Backend

1. Navigate to server folder:
   \\\ash
   cd server
   \\\

2. Create .env file (copy from .env.example):
   \\\ash
   cp .env.example .env
   \\\

3. Edit .env with your database credentials:
   \\\
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ite_verse
   PORT=5000
   NODE_ENV=development
   \\\

## STEP 5: Install Dependencies

Backend:
\\\ash
cd server
npm install
\\\

Frontend:
\\\ash
cd .. (back to root)
npm install axios
\\\

## STEP 6: Start Servers

Backend (in server folder):
\\\ash
npm start
# or for development with hot reload:
npm run dev
\\\

Frontend (in root folder):
\\\ash
npm run dev
\\\

## STEP 7: Test the Connection

1. Navigate to http://localhost:3001 (frontend)
2. Open browser console (F12)
3. Check for any API connection errors

## Features Now Synchronized Across All Users

 **Countdown Timer** - All users see the same countdown
 **Torch State** - Torch lighting synchronized globally  
 **Team Scores** - Points persist in database
 **Event Status** - Match results visible to everyone
 **Data Persistence** - Everything saved to PostgreSQL

## Deployment to Hostinger

### What you need:
- PostgreSQL database (Hostinger provides this)
- Node.js hosting (Hostinger Business plan supports this)

### Steps:
1. Upload 'server' folder to Hostinger
2. Create .env file with Hostinger database credentials
3. Run schema.sql on Hostinger database
4. Set the backend URL in your frontend
5. Update React API calls to point to your Hostinger domain

### Example Frontend Configuration:
In your React app, change API URL from:
\\\
http://localhost:5000
\\\
To:
\\\
https://your-domain.hostinger.com/api
\\\

## Files Created

Backend:
- server/index.js - Main Express server
- server/schema.sql - Database schema
- server/.env.example - Environment template
- server/README.md - Backend documentation
- server/package.json - Dependencies

## Database Tables

All these tables are created by schema.sql:
- app_state - Timer and torch state
- teams - Team information
- team_breakdown - Points per team
- events - Tournament events
- matches - Match results
- bracket_matches - Tournament brackets
- challenges - Quiz/Challenge questions

## Next Steps

1. Complete the database setup above
2. Start both backend and frontend
3. Test the countdown timer saving to database
4. All users connecting will see the same state!

## Troubleshooting

Database connection error?
 Check DB_USER, DB_PASSWORD, DB_HOST in .env

Cannot connect to backend?
 Ensure backend is running on port 5000
 Check CORS settings if different domain

Countdown not saving?
 Check PostgreSQL is running
 Verify app_state table exists: \psql ite_verse -c \"SELECT * FROM app_state;\"\

