#!/bin/bash
# Create EC2 instance for wealth-management deployment
# Requires: AWS CLI configured, jq (optional)

set -e

KEY_NAME="${1:-wealth-deploy}"
SG_NAME="wealth-sg"
INSTANCE_TYPE="${2:-t3.medium}"
REGION="${AWS_REGION:-us-east-1}"

# Ubuntu 22.04 LTS AMI (us-east-1)
AMI_ID="ami-0c7217cdde317cfec"
[[ "$REGION" != "us-east-1" ]] && echo "Update AMI_ID for region $REGION" && exit 1

echo "==> Creating key pair: $KEY_NAME"
aws ec2 create-key-pair --key-name "$KEY_NAME" --query 'KeyMaterial' --output text > "${KEY_NAME}.pem"
chmod 600 "${KEY_NAME}.pem"
echo "Saved to ${KEY_NAME}.pem"

echo "==> Creating security group: $SG_NAME"
aws ec2 create-security-group --group-name "$SG_NAME" --description "Wealth Management" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-name "$SG_NAME" --protocol tcp --port 22 --cidr 0.0.0.0/0 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-name "$SG_NAME" --protocol tcp --port 80 --cidr 0.0.0.0/0 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-name "$SG_NAME" --protocol tcp --port 443 --cidr 0.0.0.0/0 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USERDATA="${SCRIPT_DIR}/ec2-userdata.sh"
[[ ! -f "$USERDATA" ]] && echo "ec2-userdata.sh not found" && exit 1

echo "==> Launching instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-groups "$SG_NAME" \
  --user-data "file://$USERDATA" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=wealth-management}]' \
  --query 'Instances[0].InstanceId' --output text)

echo "Instance ID: $INSTANCE_ID"
echo "Waiting for public IP..."
sleep 10
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text 2>/dev/null || echo "pending")
echo ""
echo "=== Next steps ==="
echo "1. Add DNS A record: wealth.agenticorc.com -> $PUBLIC_IP"
echo "2. SSH: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
echo "3. Run setup: cd /home/ubuntu/wealth-management && ./deploy/setup-server.sh"
echo "4. Add GitHub Secrets for CI: EC2_HOST=$PUBLIC_IP, EC2_SSH_KEY=<contents of ${KEY_NAME}.pem>"
