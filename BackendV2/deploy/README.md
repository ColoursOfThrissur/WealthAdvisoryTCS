# Wealth Management – AWS EC2 Deployment

Deploy the wealth-management app to EC2 with HTTPS at **wealth.agenticorc.com**.

## Architecture

| Service | Port | Venv | Description |
|---------|------|------|-------------|
| Perplexity MCP | 8000 | venv-mcp | Web search MCP server |
| StockStory | 7000 | venv-mcp | Research / morning notes |
| WealthAdvisory | 8001 | venv-wealth | Main API + WebSocket |
| Frontend | - | - | Static files via nginx |
| nginx | 80, 443 | - | Reverse proxy + SSL |

## Prerequisites

- AWS CLI configured (`aws configure`)
- Domain **wealth.agenticorc.com** with DNS management
- GitHub repo access (contributor)
- If repo is **private**: create a Deploy Key or Personal Access Token for clone

## 1. Create EC2 Instance

```bash
# Create key pair (save .pem file securely)
aws ec2 create-key-pair --key-name wealth-deploy --query 'KeyMaterial' --output text > wealth-deploy.pem
chmod 600 wealth-deploy.pem

# Create security group
aws ec2 create-security-group --group-name wealth-sg --description "Wealth Management"
aws ec2 authorize-security-group-ingress --group-name wealth-sg --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name wealth-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name wealth-sg --protocol tcp --port 443 --cidr 0.0.0.0/0

# Launch instance (Ubuntu 22.04, t3.medium recommended)
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.medium \
  --key-name wealth-deploy \
  --security-groups wealth-sg \
  --user-data file://deploy/ec2-userdata.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=wealth-management}]'
```

## 2. Point DNS to EC2

Add an **A record** for `wealth.agenticorc.com` to the EC2 public IP:

```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=wealth-management" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

## 3. First-Time Setup on EC2

SSH in and run setup:

```bash
ssh -i wealth-deploy.pem ubuntu@<EC2_PUBLIC_IP>

cd /home/ubuntu/wealth-management
chmod +x deploy/*.sh
./deploy/setup-server.sh
```

## 4. Add .env Files

Create/update env files with API keys (do **not** commit these):

```bash
# Perplexity MCP
nano Backend/perplexitymcp/.env
# Add: PERPLEXITY_API_KEY=..., CONTROL_PLANE_URL=...

# StockStory
nano Backend/stockStoryServer/backend/.env
# Add: OPENAI_API_KEY=..., GOOGLE_API_KEY=..., etc.

# WealthAdvisory
nano Backend/WealthAdvisoryBackend/.env
# Add: GEMINI_API_KEY=..., OPENAI_API_KEY=..., etc.
```

Then restart:

```bash
sudo systemctl restart wealth-perplexity wealth-stockstory wealth-backend
```

## 5. GitHub Actions – Auto Deploy on prod Push

1. Create `prod` branch: `git checkout -b prod && git push -u origin prod`
2. Add GitHub Secrets:
   - `EC2_HOST` – EC2 public IP (e.g. `54.123.45.67`)
   - `EC2_SSH_KEY` – contents of `wealth-deploy.pem`
3. Push to `prod` to trigger deploy:
   ```bash
   git checkout prod
   git merge main   # or master
   git push origin prod
   ```

## Manual Deploy

SSH in and run:

```bash
cd /home/ubuntu/wealth-management
./deploy/deploy.sh
```

## SSL Renewal

Certbot is used for Let's Encrypt. Renewal is automatic via systemd timer. Check with:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

| Issue | Check |
|-------|-------|
| 502 Bad Gateway | `sudo systemctl status wealth-backend` – backend may be down |
| API CORS / connection errors | Ensure frontend uses same-origin (no custom VITE_API_BASE_URL in prod) |
| SSL not working | `sudo certbot certificates` – confirm cert exists |
| Services not starting | `journalctl -u wealth-backend -f` – inspect logs |
