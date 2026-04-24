# Create EC2 instance for wealth-management (PowerShell)
# Requires: AWS CLI configured
# For private repo: $env:GITHUB_TOKEN = "ghp_xxx"; .\create-ec2.ps1

param(
    [string]$KeyName = "wealth-deploy",
    [string]$InstanceType = "t3.medium",
    [string]$Region = "us-east-1",
    [string]$GitHubToken = $env:GITHUB_TOKEN
)

$AmiId = "ami-0c7217cdde317cfec"  # Ubuntu 22.04 us-east-1

Write-Host "==> Creating key pair: $KeyName"
$keyResult = aws ec2 create-key-pair --key-name $KeyName --query 'KeyMaterial' --output text 2>$null
if ($keyResult) {
    $keyResult | Out-File -FilePath "$KeyName.pem" -Encoding ascii
    (Get-Item "$KeyName.pem").Attributes = "ReadOnly"
    Write-Host "Saved to $KeyName.pem"
}

Write-Host "==> Creating security group: wealth-sg"
aws ec2 create-security-group --group-name wealth-sg --description "Wealth Management" 2>$null
aws ec2 authorize-security-group-ingress --group-name wealth-sg --protocol tcp --port 22 --cidr 0.0.0.0/0 2>$null
aws ec2 authorize-security-group-ingress --group-name wealth-sg --protocol tcp --port 80 --cidr 0.0.0.0/0 2>$null
aws ec2 authorize-security-group-ingress --group-name wealth-sg --protocol tcp --port 443 --cidr 0.0.0.0/0 2>$null

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UserDataPath = Join-Path $ScriptDir "ec2-userdata.sh"
$UserDataContent = Get-Content $UserDataPath -Raw
$CloneUrl = if ($GitHubToken) { "https://harirnair:${GitHubToken}@github.com/vvrues00/wealth-management.git" } else { "https://github.com/vvrues00/wealth-management.git" }
$UserDataContent = $UserDataContent -replace 'REPLACE_CLONE_URL', $CloneUrl
$UserDataFile = Join-Path $env:TEMP "wealth-userdata-$(Get-Random).sh"
$UserDataContent | Out-File -FilePath $UserDataFile -Encoding utf8

Write-Host "==> Launching instance..."
$SubnetId = (aws ec2 describe-subnets --filters "Name=default-for-az,Values=true" --query 'Subnets[0].SubnetId' --output text 2>$null)
if (-not $SubnetId -or $SubnetId -eq 'None') { $SubnetId = (aws ec2 describe-subnets --query 'Subnets[0].SubnetId' --output text) }
$SgId = (aws ec2 describe-security-groups --group-names wealth-sg --query 'SecurityGroups[0].GroupId' --output text 2>$null)
$InstanceId = aws ec2 run-instances `
  --image-id $AmiId `
  --instance-type $InstanceType `
  --key-name $KeyName `
  --security-group-ids $SgId `
  --subnet-id $SubnetId `
  --associate-public-ip-address `
  --user-data "file://$UserDataFile" `
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=wealth-management}]" `
  --query 'Instances[0].InstanceId' --output text

Write-Host "Instance ID: $InstanceId"
Write-Host "Waiting for public IP..."
Start-Sleep -Seconds 15
$PublicIp = aws ec2 describe-instances --instance-ids $InstanceId --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Host ""
Write-Host "=== Next steps ==="
Write-Host "1. Add DNS A record: wealth.agenticorc.com -> $PublicIp"
Write-Host "2. SSH: ssh -i $KeyName.pem ubuntu@$PublicIp"
Write-Host "3. Run setup: cd /home/ubuntu/wealth-management && ./deploy/setup-server.sh"
Write-Host "4. Add GitHub Secrets: gh secret set EC2_HOST -b $PublicIp; gh secret set EC2_SSH_KEY < $KeyName.pem"
Remove-Item $UserDataFile -ErrorAction SilentlyContinue
