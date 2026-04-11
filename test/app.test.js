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
  assert.match(html, /Sprig &amp; Soil/);
  assert.match(html, /Start weekly delivery/i);
  assert.match(html, /Serving Pattambi, Valanchery, Pallipuram &amp; Pulamanthole/);
});

test('legacy how it works alias redirects to the canonical page URL', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/issues/car-washes`, {
    redirect: 'manual'
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/how-it-works');
});

test('canonical how it works route renders directly', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/how-it-works`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /From harvest tray to customer kitchen/);
  assert.match(html, /How it works/i);
});

test('checkout route renders directly', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/checkout`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Add your delivery details before payment/);
  assert.match(html, /Pay with Razorpay/);
  assert.doesNotMatch(html, /<script src="\/protect\.js" defer><\/script>/);
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin-allow-popups');
  assert.match(response.headers.get('content-security-policy') || '', /https:\/\/cdn\.razorpay\.com/);
  assert.match(
    response.headers.get('content-security-policy') || '',
    /https:\/\/lumberjack\.razorpay\.com/
  );
});

test('order complete route renders directly', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/order-complete`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Your microgreens are booked into the next harvest cycle/);
  assert.match(html, /Payment ID/);
  assert.doesNotMatch(html, /<script src="\/protect\.js" defer><\/script>/);
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

test('legacy contact alias redirects to the canonical contact page URL', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/advertise.html`, {
    redirect: 'manual'
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/contact');
});

test('location landing page renders with local SEO copy', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/microgreens-pattambi`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Fresh Microgreens Delivered Weekly in Pattambi/);
  assert.match(html, /Bharathapuzha/);
  assert.match(html, /Order from this area/);
});

test('blog index and crawl files render successfully', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const blogResponse = await fetch(`${baseUrl}/blog`);
  const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
  const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);

  assert.equal(blogResponse.status, 200);
  assert.match(await blogResponse.text(), /Sprig &amp; Soil blog/);
  assert.equal(robotsResponse.status, 200);
  assert.match(await robotsResponse.text(), /Sitemap: https:\/\/sprigandsoil.in\/sitemap.xml/);
  assert.equal(sitemapResponse.status, 200);
  assert.match(await sitemapResponse.text(), /https:\/\/sprigandsoil.in\/microgreens-pattambi/);
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

test('admin auth supports passwords that include a colon', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    admin: {
      username: 'admin',
      password: 'secret:with-colon'
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const authHeader = `Basic ${Buffer.from('admin:secret:with-colon').toString('base64')}`;
  const response = await fetch(`${baseUrl}/admin`, {
    headers: { Authorization: authHeader }
  });

  assert.equal(response.status, 200);
  assert.match(await response.text(), /BoringMoney Admin/);
});

test('csv export sanitizes formula-like subscriber fields', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    admin: {
      username: 'admin',
      password: 'secret'
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
      firstName: '=2+2',
      email: 'csv-safe@example.com',
      source: 'test-suite',
      company: ''
    })
  });

  const authHeader = `Basic ${Buffer.from('admin:secret').toString('base64')}`;
  const response = await fetch(`${baseUrl}/admin/subscribers.csv`, {
    headers: { Authorization: authHeader }
  });
  const csv = await response.text();

  assert.equal(response.status, 200);
  assert.match(csv, /"'=2\+2"/);
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

test('turnstile verification timeout returns 503 for inquiry API', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    turnstile: {
      siteKey: 'site-key',
      secretKey: 'secret-key'
    },
    turnstileVerifier: async () => ({
      ok: false,
      error: 'verification-timeout'
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
      name: 'Turnstile Timeout',
      email: 'timeout@example.com',
      company: 'Quiet Capital',
      message: 'Timeouts should return service unavailable to callers.',
      source: 'test-suite',
      website: '',
      turnstileToken: 'any-token'
    })
  });

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/i);
});

test('inquiry form redirects use clean routes for invalid and success states', async (t) => {
  const { app, server, baseUrl } = await createTestServer();

  t.after(() => closeTestServer({ app, server }));

  const invalidResponse = await fetch(`${baseUrl}/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'name=Op&email=op%40example.com&company=Co&message=short&website=',
    redirect: 'manual'
  });
  assert.equal(invalidResponse.status, 302);
  assert.equal(invalidResponse.headers.get('location'), '/contact?status=inquiry-invalid');

  const successResponse = await fetch(`${baseUrl}/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body:
      'name=Op&email=op%40example.com&company=Co&message=This%20is%20a%20valid%20inquiry%20message.&website=',
    redirect: 'manual'
  });
  assert.equal(successResponse.status, 302);
  assert.equal(successResponse.headers.get('location'), '/contact?status=inquiry-success');
});

test('inquiry rate limit redirect uses clean route', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    subscribeRateLimit: {
      windowMs: 60 * 1000,
      limit: 1
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const body =
    'name=Op&email=op%40example.com&company=Co&message=This%20is%20a%20valid%20inquiry%20message.&website=';

  await fetch(`${baseUrl}/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body,
    redirect: 'manual'
  });

  const limitedResponse = await fetch(`${baseUrl}/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body,
    redirect: 'manual'
  });

  assert.equal(limitedResponse.status, 302);
  assert.equal(limitedResponse.headers.get('location'), '/contact?status=inquiry-rate-limited');
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

test('runtime config endpoint exposes razorpay key id when enabled', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    razorpay: {
      keyId: 'rzp_test_public',
      keySecret: 'secret'
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/api/runtime-config`, {
    headers: { Accept: 'application/json' }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.razorpayKeyId, 'rzp_test_public');
});

test('razorpay order endpoint creates server-priced checkout orders', async (t) => {
  const createdOrders = [];
  const { app, server, baseUrl } = await createTestServer({
    razorpayGateway: {
      enabled: true,
      keyId: 'rzp_test_public',
      async createOrder(payload) {
        createdOrders.push(payload);
        return {
          id: 'order_test_123',
          amount: payload.amount,
          currency: payload.currency
        };
      },
      verifyPaymentSignature() {
        return false;
      }
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const response = await fetch(`${baseUrl}/api/payments/razorpay/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      plan: 'weekly',
      items: [
        { id: 'sunflower', quantity: 2 },
        { id: 'pea', quantity: 1 }
      ],
      customer: {
        name: 'Sarath C',
        phone: '9876543210',
        email: 'sarath@example.com',
        address: 'Near town centre, main road',
        place: 'Pattambi',
        pincode: '679303',
        landmark: 'Bus stand side'
      }
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.checkout.order_id, 'order_test_123');
  assert.equal(body.checkout.key, 'rzp_test_public');
  assert.equal(body.order.subtotalInPaise, 64700);
  assert.equal(body.order.discountInPaise, 6470);
  assert.equal(body.order.totalInPaise, 58230);
  assert.equal(createdOrders[0].amount, 58230);
  assert.equal(createdOrders[0].currency, 'INR');
  assert.equal(body.customer.place, 'Pattambi');
  assert.equal(body.checkout.prefill.contact, '9876543210');
});

test('razorpay verify endpoint rejects invalid signatures and accepts valid ones', async (t) => {
  const { app, server, baseUrl } = await createTestServer({
    razorpayGateway: {
      enabled: true,
      keyId: 'rzp_test_public',
      async createOrder() {
        throw new Error('Not used in this test.');
      },
      verifyPaymentSignature({ orderId, paymentId, signature }) {
        return (
          orderId === 'order_test_123' &&
          paymentId === 'pay_test_123' &&
          signature === 'sig_test_123'
        );
      }
    }
  });

  t.after(() => closeTestServer({ app, server }));

  const invalidResponse = await fetch(`${baseUrl}/api/payments/razorpay/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      razorpay_order_id: 'order_test_123',
      razorpay_payment_id: 'pay_test_123',
      razorpay_signature: 'bad_sig'
    })
  });

  assert.equal(invalidResponse.status, 400);
  assert.match((await invalidResponse.json()).error, /verification failed/i);

  const validResponse = await fetch(`${baseUrl}/api/payments/razorpay/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      razorpay_order_id: 'order_test_123',
      razorpay_payment_id: 'pay_test_123',
      razorpay_signature: 'sig_test_123'
    })
  });

  assert.equal(validResponse.status, 200);
  assert.match((await validResponse.json()).message, /verified successfully/i);
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
