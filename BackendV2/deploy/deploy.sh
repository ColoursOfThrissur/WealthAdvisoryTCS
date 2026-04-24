#!/bin/bash
# Deploy script - runs on EC2 after git pull
# Usage: ./deploy/deploy.sh

set -e
cd /home/ubuntu/wealth-management

    # First-time setup if venvs don't exist
    if [ ! -d "venv-mcp" ] || [ ! -d "venv-wealth" ]; then
        echo "==> First deploy: running setup-server.sh..."
        bash deploy/setup-server.sh
        exit 0
    fi

echo "==> Pulling latest from prod..."
git fetch origin prod
git checkout prod
git pull origin prod

echo "==> Building frontend..."
cd Frontend
npm ci
npm run build
cd ..

echo "==> Deploying frontend to /var/www..."
sudo mkdir -p /var/www/wealth-frontend
sudo cp -r Frontend/dist/* /var/www/wealth-frontend/
sudo chown -R www-data:www-data /var/www/wealth-frontend

echo "==> Restarting backend services..."
sudo systemctl restart wealth-perplexity
sudo systemctl restart wealth-stockstory
sudo systemctl restart wealth-backend

echo "==> Updating Caddy config..."
PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -sf ifconfig.me 2>/dev/null)
SSLIP_HOST=$(echo "$PUBLIC_IP" | tr '.' '-').sslip.io
sed "s/{{SSLIP_HOST}}/$SSLIP_HOST/" deploy/Caddyfile | sudo tee /etc/caddy/Caddyfile > /dev/null
sudo caddy validate --config /etc/caddy/Caddyfile 2>/dev/null && sudo systemctl reload caddy 2>/dev/null || true

echo "==> Deploy complete!"
echo "Site: https://$SSLIP_HOST"
sudo systemctl status wealth-perplexity wealth-stockstory wealth-backend --no-pager
