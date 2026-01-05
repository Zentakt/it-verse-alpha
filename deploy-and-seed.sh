#!/bin/bash

# Pull latest changes
cd /var/www/app
sudo -u appuser git pull origin main

# Run seed script
cd /var/www/app/server
sudo -u appuser bash -lc "node seed-db.js"

# Restart backend
sudo systemctl restart it-verse-backend

echo "✅ Deployment complete!"
