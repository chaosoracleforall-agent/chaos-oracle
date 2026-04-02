module.exports = {
  apps: [{
    name: 'chaos-agent',
    cwd: './packages/agent',
    script: 'npx',
    args: 'ts-node index.ts',
    autorestart: true,
    max_restarts: 10,
    restart_delay: 10000,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
