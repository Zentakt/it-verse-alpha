# VPS DEPLOYMENT COMMANDS
# Run these commands on your Hostinger VPS to complete the deployment

# 1. Pull latest changes
cd /var/www/app
git pull

# 2. Update nginx configuration
sudo cp nginx_https.conf /etc/nginx/sites-available/ite-verse
sudo nginx -t
sudo systemctl reload nginx

# 3. Create and set permissions for uploads directory
mkdir -p /var/www/app/server/uploads
chmod 755 /var/www/app/server/uploads
chown -R root:root /var/www/app/server/uploads

# 4. Install backend dependencies
cd /var/www/app/server
npm install

# 5. Restart backend service
sudo systemctl restart it-verse-backend
sudo systemctl status it-verse-backend

# 6. Build and deploy frontend
cd /var/www/app
npm install
npm run build
sudo rm -rf /var/www/app-frontend/*
sudo cp -r dist/* /var/www/app-frontend/

# 7. Verify deployment
echo "Testing endpoints..."
curl -I https://itverse.site/api/health
echo ""
echo "Checking uploads directory..."
ls -la /var/www/app/server/uploads/

# 8. View logs (optional)
sudo journalctl -u it-verse-backend -n 50 --no-pager

echo ""
echo "Deployment complete! Check https://itverse.site"
