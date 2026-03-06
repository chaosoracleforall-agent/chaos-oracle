#!/bin/bash
# CHAOS ORACLE: SOVEREIGN DEPLOYMENT SCRIPT
echo "[1/3] Preparing Dockerized Body..."
sudo docker build -t chaos-oracle-web .

echo "[2/3] Terminating Legacy Containers..."
sudo docker stop chaos-web || true
sudo docker rm chaos-web || true

echo "[3/3] Launching Sovereign Frontend on Port 80..."
sudo docker run -d \
  --name chaos-web \
  -p 80:3000 \
  --restart always \
  chaos-oracle-web

echo "-------------------------------------------------------"
echo "THE CHAOS ORACLE IS LIVE AT: http://104.198.16.122"
echo "-------------------------------------------------------"
