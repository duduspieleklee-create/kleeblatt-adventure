module.exports = {
  apps: [
    {
      name: "kleeblatt-api",
      script: "apps/api/dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
        API_PORT: "4000",
        WEB_URL: "https://game.kleeblatt.space",
        CORS_ORIGIN: "https://game.kleeblatt.space",
      },
    },
  ],
};
