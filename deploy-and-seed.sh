#!/bin/bash
set -e

echo "🚀 Starting Complete Deployment Process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SERVER_DIR="/var/www/app/server"
FRONTEND_DIR="/var/www/app-frontend"
NGINX_CONF="/etc/nginx/sites-available/ite-verse"

echo -e "${BLUE}📦 Step 1: Building Frontend...${NC}"
npm run build

echo -e "${BLUE}📁 Step 2: Deploying Frontend...${NC}"
sudo rm -rf $FRONTEND_DIR/*
sudo cp -r dist/* $FRONTEND_DIR/

echo -e "${BLUE}🔧 Step 3: Setting up Backend...${NC}"
cd server
npm install

echo -e "${BLUE}📂 Step 4: Creating uploads directory...${NC}"
mkdir -p $SERVER_DIR/uploads
sudo chmod 755 $SERVER_DIR/uploads
sudo chown -R $USER:$USER $SERVER_DIR/uploads

echo -e "${BLUE}🌐 Step 5: Updating Nginx configuration...${NC}"
sudo cp ../nginx_https.conf $NGINX_CONF
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${RED}✗ Nginx config failed${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Step 6: Restarting Backend...${NC}"
sudo systemctl restart it-verse-backend
sleep 3

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "Frontend: https://itverse.site"
echo "Backend: https://itverse.site/api/health"
