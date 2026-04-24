#!/bin/bash
# First-time server setup - run once after EC2 launch
# Uses Caddy + sslip.io for HTTPS (no domain or certbot needed)

set -e

APP_DIR=/home/ubuntu/wealth-management

echo "==> Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv nodejs npm git wkhtmltopdf software-properties-common curl ca-certificates

echo "==> Installing Python 3.13 (StockStory needs numpy 2.4+)..."
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y python3.13 python3.13-venv python3.13-dev

echo "==> Setting up Node (ensure v18+)..."
if ! command -v n 2>/dev/null; then
    sudo npm install -g n
fi
sudo n 20 2>/dev/null || true

echo "==> Creating Python venvs..."
cd "$APP_DIR"
rm -rf venv-mcp venv-wealth 2>/dev/null || true

# Shared venv for Perplexity + StockStory (Python 3.13)
python3.13 -m venv venv-mcp
./venv-mcp/bin/pip install --upgrade pip
./venv-mcp/bin/pip install -r Backend/perplexitymcp/requirements.txt
./venv-mcp/bin/pip install -r Backend/stockStoryServer/backend/requirements.txt

# Separate venv for WealthAdvisory
python3 -m venv venv-wealth
./venv-wealth/bin/pip install --upgrade pip
./venv-wealth/bin/pip install -r Backend/WealthAdvisoryBackend/requirements.txt

echo "==> Installing frontend deps and building..."
cd Frontend
npm ci
npm run build
cd ..

echo "==> Setting up .env files (copy from templates if exists)..."
# Ensure .env exists - user must add API keys manually
for f in Backend/perplexitymcp/.env Backend/stockStoryServer/backend/.env Backend/WealthAdvisoryBackend/.env; do
    if [ ! -f "$f" ]; then
        echo "WARNING: $f not found. Create it with required API keys."
    fi
done

echo "==> Installing systemd services..."
sudo cp deploy/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable wealth-perplexity wealth-stockstory wealth-backend

echo "==> Copying frontend to /var/www..."
sudo mkdir -p /var/www/wealth-frontend
sudo cp -r "$APP_DIR/Frontend/dist"/* /var/www/wealth-frontend/
sudo chown -R www-data:www-data /var/www/wealth-frontend

echo "==> Installing Caddy..."
sudo apt-get install -y debian-keyring debian-archive-keyring
sudo curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
sudo curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy

echo "==> Configuring Caddy (sslip.io HTTPS)..."
PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -sf ifconfig.me 2>/dev/null || echo "13.218.33.51")
SSLIP_HOST=$(echo "$PUBLIC_IP" | tr '.' '-').sslip.io
sed "s/{{SSLIP_HOST}}/$SSLIP_HOST/" "$APP_DIR/deploy/Caddyfile" | sudo tee /etc/caddy/Caddyfile > /dev/null
sudo systemctl enable caddy
sudo systemctl restart caddy
echo "Site will be available at https://$SSLIP_HOST"

echo "==> Starting services..."
sudo systemctl start wealth-perplexity wealth-stockstory wealth-backend

echo ""
echo "=== Setup complete! ==="
echo "Site: https://$SSLIP_HOST (sslip.io - no domain required)"
echo "Add API keys to: Backend/*/.env and Backend/WealthAdvisoryBackend/.env"
echo "Then run: sudo systemctl restart wealth-perplexity wealth-stockstory wealth-backend"
