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

test('home page renders successfully', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /BoringMoney — The Business of Boring/);
});

test('issue detail page renders by slug', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

  const response = await fetch(`${baseUrl}/issues/car-washes`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Car washes/);
  assert.match(html, /The Boring Score/);
});

test('subscriber API accepts valid submissions and deduplicates emails', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

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

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

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

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

  const response = await fetch(`${baseUrl}/advertise.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Advertise with/);
  assert.match(html, /Get in Touch/);
});

test('local Matter.js asset is served from the app', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

  const response = await fetch(`${baseUrl}/vendor/matter.min.js`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /Matter/);
});

test('inquiry API accepts valid advertiser leads', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

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

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

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

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

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

  t.after(() => {
    server.close();
    app.locals.shutdown();
  });

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
