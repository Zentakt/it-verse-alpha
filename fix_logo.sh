#!/bin/bash
sudo -u postgres psql -d it-verse -c "ALTER TABLE teams ALTER COLUMN logo TYPE TEXT;"
sudo -u postgres psql -d it-verse -c "\d teams" 
sudo systemctl restart it-verse-backend