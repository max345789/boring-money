const { createApp } = require('./app');
const { config } = require('./config');

const app = createApp({
  databaseUrl: config.databaseUrl,
  sqlitePath: config.sqlitePath,
  logFormat: config.isProduction ? 'combined' : 'dev',
  trustProxy: config.trustProxy,
  admin: config.admin,
  email: config.email
});

const server = app.listen(config.port, () => {
  console.log(`BoringMoney listening on http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(async () => {
    try {
      await app.locals.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error:', error);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
