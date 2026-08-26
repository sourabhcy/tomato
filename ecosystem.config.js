
module.exports = {
  apps: [
    {
      name: 'ecommerce-app',
      script: 'server.js',
      cwd: '/opt/apps/ecommerce-app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      autorestart: true,
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      time: true,
    },
  ],
};