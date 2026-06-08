#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

set -e

PROJECT="trackcenter"
BASE="/home/$PROJECT"
REPO="$BASE/public_html"

echo "▶ Enter repo"
cd "$REPO"

echo "▶ Pull latest code"
git pull origin main || git pull origin dev || git pull origin master

echo "▶ Install dependencies"
npm ci

echo "▶ Building app"
npm run build

echo "▶ Restart PM2"
pm2 reload "$REPO/ecosystem.config.js" --env production || \
pm2 start "$REPO/ecosystem.config.js"

echo "✅ Deploy finished successfully"