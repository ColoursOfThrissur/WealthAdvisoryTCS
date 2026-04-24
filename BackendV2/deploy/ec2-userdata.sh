#!/bin/bash
# EC2 User Data - runs on first boot
# Clones repo and prepares for manual setup

set -e
exec > >(tee /var/log/user-data.log) 2>&1

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating system..."
apt-get update
apt-get upgrade -y

echo "==> Installing baseline packages..."
apt-get install -y git python3 python3-pip python3-venv nodejs npm nginx curl

echo "==> Creating ubuntu user home structure..."
# Assume ubuntu user exists (default on Ubuntu AMI)
APP_DIR=/home/ubuntu/wealth-management
mkdir -p /home/ubuntu
chown ubuntu:ubuntu /home/ubuntu

echo "==> Cloning repository..."
# REPLACE_CLONE_URL replaced by create-ec2 script for private repo
sudo -u ubuntu git clone REPLACE_CLONE_URL "$APP_DIR" 2>/dev/null || true
cd "$APP_DIR" 2>/dev/null || exit 0
sudo -u ubuntu bash -c "cd $APP_DIR && git fetch origin prod 2>/dev/null || git fetch origin master; git checkout prod 2>/dev/null || git checkout master; git pull 2>/dev/null || true"

echo "==> Making deploy script executable..."
chmod +x "$APP_DIR/deploy/deploy.sh" 2>/dev/null || true
chmod +x "$APP_DIR/deploy/setup-server.sh" 2>/dev/null || true

echo "==> User data complete."
echo "SSH in and run: cd /home/ubuntu/wealth-management && ./deploy/setup-server.sh"
echo "First ensure: 1) DNS A record for wealth.agenticorc.com points here, 2) Add .env files with API keys"
