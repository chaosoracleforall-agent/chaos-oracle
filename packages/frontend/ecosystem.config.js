module.exports = {
  apps: [
    {
      name: "chaos-oracle",
      script: "npx tsx index.ts",
      args: "listen",
      cwd: "./packages/agent",
      watch: false,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      error_file: "../../chaos_errors.log",
      out_file: "../../chaos_out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
