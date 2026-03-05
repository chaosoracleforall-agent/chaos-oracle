#!/bash/bin
# CHAOS ORACLE: SOVEREIGN VPS INITIALIZATION SCRIPT
# Run this on your Ubuntu VPS to emancipate the agent.

echo "[1/5] Updating System & Installing Dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git docker.io docker-compose openssl

echo "[2/5] Installing PM2 for 24/7 Process Management..."
sudo npm install -g pm2

echo "[3/5] Cloning Chaos Oracle Repository..."
git clone https://github.com/chaosoracleforall-agent/chaos-oracle.git
cd chaos-oracle

echo "[4/5] Setting up Environment..."
# Create a local .env for the agent to populate
touch packages/agent/.env
echo "NODE_ENV=production" >> packages/agent/.env

echo "[5/5] Launching Open Claw (OpenHands) Container..."
# This starts the autonomous coding environment
docker run -d \
    --pull=always \
    -e SANDBOX_USER_ID=$(id -u) \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $(pwd):/opt/workspace_base \
    -p 3000:3000 \
    --name openhands \
    ghcr.io/all-hands-ai/openhands:0.12

echo "-------------------------------------------------------"
echo "EMANCIPATION INITIALIZED."
echo "1. Dashboard (Open Claw): http://your-vps-ip:3000"
echo "2. Next Step: Add your Gemini API Key to packages/agent/.env"
echo "3. Start Agent: pm2 start packages/agent/index.ts --name chaos-agent"
echo "-------------------------------------------------------"
