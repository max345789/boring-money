const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

const { createApp } = require('../src/app');

async function createTestServer(options = {}) {
  const app = createApp({
    sqlitePath: ':memory:',
    logFormat: 'tiny',
    ...options
  });

  const server = app.listen(0);
  await once(server, 'listening');

  const address = server.address();

  return {
    app,
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

async function closeTestServer({ app, server }) {
  await new Promise((resolve) => {
    server.close(resolve);
  });
  await app.locals.shutdown();
}

test('home page renders successfully', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /BoringMoney — The Business of Boring/);
});

test('issue detail page renders by slug', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/issues/car-washes`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Car washes/);
  assert.match(html, /The Boring Score/);
});

test('subscriber API accepts valid submissions and deduplicates emails', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const firstResponse = await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      firstName: 'Dennis',
      email: 'dennis@example.com',
      source: 'test-suite',
      company: ''
    })
  });

  const firstBody = await firstResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(firstBody.subscriber.email, 'dennis@example.com');

  const duplicateResponse = await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      firstName: 'Dennis',
      email: 'DENNIS@example.com',
      source: 'test-suite',
      company: ''
    })
  });

  const duplicateBody = await duplicateResponse.json();

  assert.equal(duplicateResponse.status, 200);
  assert.match(duplicateBody.message, /Already subscribed/);
});

test('subscriber API rejects invalid payloads', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      firstName: 'Bad',
      email: 'not-an-email',
      source: 'test-suite',
      company: ''
    })
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /valid email/i);
});

test('advertise page renders from the custom HTML route', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/advertise.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Advertise with/);
  assert.match(html, /Get in Touch/);
});

test('local Matter.js asset is served from the app', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/vendor/matter.min.js`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /Matter/);
});

test('inquiry API accepts valid advertiser leads', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      name: 'Operator Media',
      email: 'ads@example.com',
      company: 'Quiet Capital',
      message: 'We want to sponsor the newsletter for four weeks.',
      source: 'advertise-page',
      website: ''
    })
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.match(body.message, /Inquiry received/i);
  assert.equal(body.inquiry.email, 'ads@example.com');
});

test('admin dashboard requires auth and serves CSV export when enabled', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    admin: {
      username: 'admin',
      password: 'secret'
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const unauthorized = await fetch(`${baseUrl}/admin`);
  assert.equal(unauthorized.status, 401);

  await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      email: 'admin-test@example.com',
      source: 'admin-test',
      company: ''
    })
  });

  const authHeader = `Basic ${Buffer.from('admin:secret').toString('base64')}`;
  const dashboard = await fetch(`${baseUrl}/admin`, {
    headers: { Authorization: authHeader }
  });
  const csv = await fetch(`${baseUrl}/admin/subscribers.csv`, {
    headers: { Authorization: authHeader }
  });

  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /BoringMoney Admin/);
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), /admin-test@example.com/);
});

test('notifier is called for new subscribers and inquiries', async (t) => {
  const calls = [];
  const { app, server, baseUrl } = await createTestServer({
    notifier: {
      enabled: true,
      async notifyNewSubscriber(subscriber) {
        calls.push({ type: 'subscriber', email: subscriber.email });
      },
      async notifyNewInquiry(inquiry) {
        calls.push({ type: 'inquiry', email: inquiry.email });
      }
    }
  });

  t.after(() => closeTestServer({ app, server }));

  await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      email: 'notify-subscriber@example.com',
      source: 'test-suite',
      company: ''
    })
  });

  await fetch(`${baseUrl}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      name: 'Notify Test',
      email: 'notify-inquiry@example.com',
      company: 'Quiet Capital',
      message: 'Please contact us about sponsorship availability.',
      source: 'test-suite',
      website: ''
    })
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(calls, [
    { type: 'subscriber', email: 'notify-subscriber@example.com' },
    { type: 'inquiry', email: 'notify-inquiry@example.com' }
  ]);
});

test('global rate limiter applies to all endpoints', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    globalRateLimit: {
      windowMs: 60 * 1000,
      limit: 2
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const first = await fetch(`${baseUrl}/api/health`, {
    headers: { Accept: 'application/json' }
  });
  const second = await fetch(`${baseUrl}/api/health`, {
    headers: { Accept: 'application/json' }
  });
  const third = await fetch(`${baseUrl}/api/health`, {
    headers: { Accept: 'application/json' }
  });

  const body = await third.json();

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(third.status, 429);
  assert.match(body.error, /too many requests/i);
});

test('turnstile-protected subscriber API requires and validates token', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    turnstile: {
      siteKey: 'site-key',
      secretKey: 'secret-key'
    },
    turnstileVerifier: async ({ token }) => {
      if (!token) {
        return { ok: false, error: 'missing-token' };
      }

      if (token === 'valid-token') {
        return { ok: true };
      }

      return { ok: false, error: 'verification-failed' };
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const missingTokenResponse = await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      email: 'turnstile@example.com',
      source: 'test-suite',
      company: ''
    })
  });
  assert.equal(missingTokenResponse.status, 400);
  assert.match((await missingTokenResponse.json()).error, /security check/i);

  const invalidTokenResponse = await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      email: 'turnstile@example.com',
      source: 'test-suite',
      company: '',
      turnstileToken: 'bad-token'
    })
  });
  assert.equal(invalidTokenResponse.status, 400);
  assert.match((await invalidTokenResponse.json()).error, /security check failed/i);

  const validTokenResponse = await fetch(`${baseUrl}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      email: 'turnstile@example.com',
      source: 'test-suite',
      company: '',
      turnstileToken: 'valid-token'
    })
  });
  assert.equal(validTokenResponse.status, 201);
});

test('turnstile verification outage returns 503 for inquiry API', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    turnstile: {
      siteKey: 'site-key',
      secretKey: 'secret-key'
    },
    turnstileVerifier: async () => ({
      ok: false,
      error: 'verification-unavailable'
    })
  });

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      name: 'Turnstile Outage',
      email: 'outage@example.com',
      company: 'Quiet Capital',
      message: 'Security verification should fail closed in this test.',
      source: 'test-suite',
      website: '',
      turnstileToken: 'any-token'
    })
  });

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/i);
});

test('runtime config endpoint exposes turnstile site key when enabled', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    turnstile: {
      siteKey: 'site-key-public',
      secretKey: 'secret-key'
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/api/runtime-config`, {
    headers: { Accept: 'application/json' }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.turnstileSiteKey, 'site-key-public');
});

test('app supports async database adapters for Supabase/Postgres', async (t) => {
  const database = {
    async ping() {},
    async upsertSubscriber(payload) {
      return {
        isNew: true,
        subscriber: {
          id: 1,
          firstName: payload.firstName || null,
          email: payload.email,
          source: payload.source,
          status: 'active',
          createdAt: '2026-04-08T00:00:00.000Z',
          updatedAt: '2026-04-08T00:00:00.000Z'
        }
      };
    },
    async countSubscribers() {
      return 1;
    },
    async listSubscribers() {
      return [];
    },
    async createInquiry(payload) {
      return {
        id: 1,
        name: payload.name,
        email: payload.email,
        company: payload.company || null,
        message: payload.message,
        source: payload.source,
        status: 'new',
        createdAt: '2026-04-08T00:00:00.000Z'
      };
    },
    async countInquiries() {
      return 0;
    },
    async listInquiries() {
      return [];
    },
    async exportSubscribers() {
      return [];
    },
    async exportInquiries() {
      return [];
    },
    async close() {}
  };

  const { app, server, baseUrl } = await createTestServer({ database });

  t.after(() => closeTestServer({ app, server }));

  const ready = await fetch(`${baseUrl}/ready`);
  const health = await fetch(`${baseUrl}/api/health`, {
    headers: { Accept: 'application/json' }
  });

  assert.equal(ready.status, 200);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).subscribers, 1);
});
