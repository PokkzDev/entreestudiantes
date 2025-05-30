module.exports = {
  apps: [{
    name: 'entreestudiantes',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Hostinger specific optimizations
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Ensure the app starts properly
    wait_ready: true,
    ready_timeout: 30000
  }]
}; 