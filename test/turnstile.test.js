const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyTurnstileToken } = require('../src/turnstile');

test('turnstile verifier returns missing-token when token is absent', async () => {
  const result = await verifyTurnstileToken({
    secretKey: 'secret',
    token: ''
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'missing-token');
});

test('turnstile verifier maps abort timeout to verification-timeout', async () => {
  const result = await verifyTurnstileToken({
    secretKey: 'secret',
    token: 'token',
    timeoutMs: 10,
    fetchImpl(url, options) {
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('request aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'verification-timeout');
});

test('turnstile verifier returns ok on successful verification', async () => {
  const result = await verifyTurnstileToken({
    secretKey: 'secret',
    token: 'token',
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return { success: true };
      }
    })
  });

  assert.deepEqual(result, { ok: true });
});
