const path = require('node:path');
const { z } = require('zod');

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseTrustProxy(value, fallback = false) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const normalized = String(value).toLowerCase();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  if (['true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SQLITE_PATH: z.string().optional(),
  TRUST_PROXY: z.string().optional(),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  NOTIFY_EMAIL: z.string().email().optional(),
  FROM_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${formatted}`);
}

const env = parsed.data;

const config = {
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT || 3000,
  sqlitePath: env.SQLITE_PATH || path.join(process.cwd(), 'data', 'boring-money.db'),
  trustProxy: parseTrustProxy(env.TRUST_PROXY, env.NODE_ENV === 'production' ? 1 : false),
  admin:
    env.ADMIN_USERNAME && env.ADMIN_PASSWORD
      ? {
          username: env.ADMIN_USERNAME,
          password: env.ADMIN_PASSWORD
        }
      : null,
  email:
    env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.SMTP_USER &&
    env.SMTP_PASS &&
    env.NOTIFY_EMAIL &&
    env.FROM_EMAIL
      ? {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: parseBoolean(env.SMTP_SECURE, env.SMTP_PORT === 465),
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
          notifyEmail: env.NOTIFY_EMAIL,
          fromEmail: env.FROM_EMAIL
        }
      : null
};

module.exports = { config };
