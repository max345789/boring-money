const { createApp } = require('./app');
const { config } = require('./config');
const { createMonitoring } = require('./monitoring');

const monitoring = createMonitoring(config.sentry);

const app = createApp({
  databaseUrl: config.databaseUrl,
  sqlitePath: config.sqlitePath,
  logFormat: config.isProduction ? 'combined' : 'dev',
  trustProxy: config.trustProxy,
  admin: config.admin,
  email: config.email,
  turnstile: config.turnstile,
  razorpay: config.razorpay,
  monitoring
});

const server = app.listen(config.port, () => {
  console.log(`BoringMoney listening on http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(async () => {
    try {
      await app.locals.shutdown();
      await monitoring.flush();
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error:', error);
      monitoring.captureException(error, {
        tags: { phase: 'shutdown' }
      });
      await monitoring.flush();
      process.exit(1);
    }
  });
}

process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  monitoring.captureException(error, {
    tags: { phase: 'uncaughtException' }
  });
  await monitoring.flush();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  console.error('Unhandled rejection:', error);
  monitoring.captureException(error, {
    tags: { phase: 'unhandledRejection' }
  });
  await monitoring.flush();
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
