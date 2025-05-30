module.exports = {
  apps: [
    {
      name: 'brickrecipes-ai',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/brick-recipes',
      instances: 'max', // 使用所有 CPU 核心
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/deploy/logs/brickrecipes-error.log',
      out_file: '/home/deploy/logs/brickrecipes-out.log',
      log_file: '/home/deploy/logs/brickrecipes-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      // 自动重启配置
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      // 进程管理
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
      // 健康检查
      health_check_grace_period: 3000
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['brickrecipes.ai'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/brick-recipes.git', // 请替换为您的实际仓库地址
      path: '/home/deploy/brick-recipes',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
}; 