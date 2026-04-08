function createMonitoring(config) {
  if (!config?.dsn) {
    return {
      enabled: false,
      captureException() {},
      async flush() {}
    };
  }

  const Sentry = require('@sentry/node');

  Sentry.init({
    dsn: config.dsn,
    tracesSampleRate: config.tracesSampleRate ?? 0
  });

  return {
    enabled: true,
    captureException(error, context = {}) {
      Sentry.withScope((scope) => {
        if (context.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, String(value));
          });
        }

        if (context.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        Sentry.captureException(error);
      });
    },
    async flush(timeout = 2000) {
      await Sentry.flush(timeout);
    }
  };
}

module.exports = {
  createMonitoring
};
