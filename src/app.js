const path = require('node:path');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const crypto = require('node:crypto');
const { z } = require('zod');

const { createDatabase } = require('./db');
const { buildMicrogreenOrder, productCatalog } = require('./microgreens');
const { createNotifier } = require('./notifier');
const { createRazorpayGateway } = require('./razorpay');
const { verifyTurnstileToken } = require('./turnstile');
const {
  site,
  findIssueBySlug,
  getPublishedIssues,
} = require('./content/site');

const subscriberSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(80, 'First name must be 80 characters or fewer.')
    .optional()
    .transform((value) => value || ''),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(160, 'Email must be 160 characters or fewer.')
    .transform((value) => value.toLowerCase()),
  source: z
    .string()
    .trim()
    .max(80, 'Source must be 80 characters or fewer.')
    .optional()
    .transform((value) => value || 'site'),
  company: z
    .string()
    .max(0)
    .optional()
    .or(z.literal(''))
    .transform(() => '')
});

const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(100, 'Name must be 100 characters or fewer.'),
  email: z
    .string()
    .trim()
    .email('Enter a valid work email address.')
    .max(160, 'Email must be 160 characters or fewer.')
    .transform((value) => value.toLowerCase()),
  company: z
    .string()
    .trim()
    .max(120, 'Company must be 120 characters or fewer.')
    .optional()
    .transform((value) => value || ''),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a bit more about the inquiry.')
    .max(4000, 'Message must be 4000 characters or fewer.'),
  source: z
    .string()
    .trim()
    .max(80, 'Source must be 80 characters or fewer.')
    .optional()
    .transform((value) => value || 'advertise'),
  website: z
    .string()
    .max(0)
    .optional()
    .or(z.literal(''))
    .transform(() => '')
});

const productIds = productCatalog.map((product) => product.id);

const razorpayOrderSchema = z.object({
  plan: z.enum(['weekly', 'once']),
  items: z
    .array(
      z.object({
        id: z.enum(productIds),
        quantity: z.coerce.number().int().min(1).max(20)
      })
    )
    .min(1, 'Add at least one tray before paying.')
});

const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().trim().min(1, 'Missing Razorpay order ID.'),
  razorpay_payment_id: z.string().trim().min(1, 'Missing Razorpay payment ID.'),
  razorpay_signature: z.string().trim().min(1, 'Missing Razorpay signature.')
});

function getSubscriptionFeedback(status) {
  switch (status) {
    case 'success':
      return {
        tone: 'success',
        message: 'Subscription confirmed. Your first issue is on the way.'
      };
    case 'exists':
      return {
        tone: 'info',
        message: 'You are already subscribed. We updated your profile details.'
      };
    case 'invalid':
      return {
        tone: 'error',
        message: 'Please enter a valid email address and try again.'
      };
    case 'rate-limited':
      return {
        tone: 'error',
        message: 'Too many attempts right now. Please wait a minute and try again.'
      };
    default:
      return null;
  }
}

function requestWantsJson(req) {
  return req.path.startsWith('/api/') || req.get('accept')?.includes('application/json');
}

function createRateLimitHandler({ redirectTo } = {}) {
  return (req, res) => {
    if (requestWantsJson(req)) {
      res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
      return;
    }

    if (redirectTo) {
      res.redirect(redirectTo);
      return;
    }

    res
      .status(429)
      .type('text/plain; charset=utf-8')
      .send('Too many requests. Please wait a minute and try again.');
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeCsvValue(value) {
  const text = String(value);
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

function toCsv(rows, columns) {
  const header = columns.map((column) => column.header).join(',');
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const value = row[column.key] ?? '';
        const escaped = sanitizeCsvValue(value).replaceAll('"', '""');
        return `"${escaped}"`;
      })
      .join(',')
  );

  return [header, ...lines].join('\n');
}

function createAdminGuard(adminConfig) {
  if (!adminConfig) {
    return (req, res) => {
      res.status(404).type('text/plain; charset=utf-8').send('Not found.');
    };
  }

  return (req, res, next) => {
    const authorization = req.get('authorization');

    if (!authorization || !authorization.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="BoringMoney Admin"');
      res.status(401).type('text/plain; charset=utf-8').send('Authentication required.');
      return;
    }

    const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');

    if (separator === -1) {
      res.set('WWW-Authenticate', 'Basic realm="BoringMoney Admin"');
      res.status(401).type('text/plain; charset=utf-8').send('Invalid credentials.');
      return;
    }

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);

    if (
      username !== adminConfig.username ||
      password !== adminConfig.password
    ) {
      res.set('WWW-Authenticate', 'Basic realm="BoringMoney Admin"');
      res.status(401).type('text/plain; charset=utf-8').send('Invalid credentials.');
      return;
    }

    next();
  };
}

function createApp(options = {}) {
  const app = express();
  const projectRoot = options.projectRoot || path.resolve(__dirname, '..');
  const sendFileOptions = { dotfiles: 'allow' };
  const turnstileConfig = options.turnstile || null;
  const turnstileVerifier = options.turnstileVerifier || verifyTurnstileToken;
  const monitoring = options.monitoring || null;
  const database =
    options.database ||
    createDatabase({
      connectionString: options.databaseUrl,
      sqlitePath: options.sqlitePath
    });
  const notifier = options.notifier || createNotifier(options.email || null);
  const razorpayGateway =
    options.razorpayGateway || createRazorpayGateway(options.razorpay || null);
  const adminGuard = createAdminGuard(options.admin || null);
  const globalRateLimit = {
    windowMs: options.globalRateLimit?.windowMs || 15 * 60 * 1000,
    limit: options.globalRateLimit?.limit || 300
  };
  const subscribeRateLimit = {
    windowMs: options.subscribeRateLimit?.windowMs || 60 * 1000,
    limit: options.subscribeRateLimit?.limit || 6
  };

  app.set('view engine', 'ejs');
  app.set('views', path.join(projectRoot, 'views'));
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy ?? 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            'https://challenges.cloudflare.com',
            'https://checkout.razorpay.com'
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: [
            "'self'",
            'https://challenges.cloudflare.com',
            'https://api.razorpay.com',
            'https://checkout.razorpay.com'
          ],
          frameSrc: [
            "'self'",
            'https://challenges.cloudflare.com',
            'https://api.razorpay.com',
            'https://checkout.razorpay.com'
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: null
        }
      }
    })
  );
  app.use(
    rateLimit({
      windowMs: globalRateLimit.windowMs,
      limit: globalRateLimit.limit,
      standardHeaders: true,
      legacyHeaders: false,
      handler: createRateLimitHandler()
    })
  );
  app.use(compression());
  app.use(morgan(options.logFormat || 'dev'));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(
    express.static(path.join(projectRoot, 'public'), {
      extensions: ['html'],
      dotfiles: 'allow'
    })
  );

  app.use((req, res, next) => {
    res.locals.site = site;
    res.locals.currentPath = req.path;
    res.locals.feedback = getSubscriptionFeedback(req.query.status);
    next();
  });

  const subscribeLimiter = rateLimit({
    windowMs: subscribeRateLimit.windowMs,
    limit: subscribeRateLimit.limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler({ redirectTo: '/subscribe?status=rate-limited' })
  });
  const inquiryLimiter = rateLimit({
    windowMs: subscribeRateLimit.windowMs,
    limit: subscribeRateLimit.limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler({ redirectTo: '/advertise?status=inquiry-rate-limited' })
  });
  const paymentLimiter = rateLimit({
    windowMs: subscribeRateLimit.windowMs,
    limit: subscribeRateLimit.limit * 2,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler()
  });

  async function verifyBotCheck(payload, remoteIp) {
    if (!turnstileConfig?.secretKey) {
      return { ok: true };
    }

    const token =
      payload?.turnstileToken ||
      payload?.['cf-turnstile-response'] ||
      '';
    const verification = await turnstileVerifier({
      secretKey: turnstileConfig.secretKey,
      token: String(token),
      remoteIp
    });

    if (verification.ok) {
      return { ok: true };
    }

    if (verification.error === 'missing-token') {
      return {
        ok: false,
        statusCode: 400,
        error: 'Please complete the security check and try again.'
      };
    }

    if (
      verification.error === 'verification-unavailable' ||
      verification.error === 'verification-timeout'
    ) {
      return {
        ok: false,
        statusCode: 503,
        error: 'Security verification is temporarily unavailable. Please try again shortly.'
      };
    }

    return {
      ok: false,
      statusCode: 400,
      error: 'Security check failed. Please refresh and try again.'
    };
  }

  function parseSubscriberInput(payload) {
    const parsed = subscriberSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0].message
      };
    }

    return {
      ok: true,
      data: parsed.data
    };
  }

  async function handleSubscription(payload, req) {
    const verification = await verifyBotCheck(payload, req.ip);
    if (!verification.ok) {
      return verification;
    }

    const parsed = parseSubscriberInput(payload);
    if (!parsed.ok) {
      return {
        ok: false,
        statusCode: 400,
        error: parsed.error
      };
    }

    if (parsed.data.company) {
      return {
        ok: true,
        statusCode: 202,
        isNew: false
      };
    }

    const result = await database.upsertSubscriber(parsed.data);
    return {
      ok: true,
      statusCode: result.isNew ? 201 : 200,
      isNew: result.isNew,
      subscriber: result.subscriber
    };
  }

  async function handleInquiry(payload, req) {
    const verification = await verifyBotCheck(payload, req.ip);
    if (!verification.ok) {
      return verification;
    }

    const parsed = inquirySchema.safeParse(payload);

    if (!parsed.success) {
      return {
        ok: false,
        statusCode: 400,
        error: parsed.error.issues[0].message
      };
    }

    if (parsed.data.website) {
      return {
        ok: true,
        statusCode: 202
      };
    }

    const inquiry = await database.createInquiry(parsed.data);

    return {
      ok: true,
      statusCode: 201,
      inquiry
    };
  }

  function sendProjectFile(fileName) {
    return (req, res) => {
      res.sendFile(path.join(projectRoot, fileName), sendFileOptions);
    };
  }

  function notifySafely(promise) {
    Promise.resolve(promise).catch((error) => {
      console.error('Notification error:', error);
    });
  }

  async function renderAdminPage() {
    const [subscribers, inquiries, subscriberCount, inquiryCount] = await Promise.all([
      database.listSubscribers(25),
      database.listInquiries(25),
      database.countSubscribers(),
      database.countInquiries()
    ]);

    const subscriberRows = subscribers
      .map(
        (subscriber) => `
          <tr>
            <td>${subscriber.id}</td>
            <td>${escapeHtml(subscriber.firstName || '-')}</td>
            <td>${escapeHtml(subscriber.email)}</td>
            <td>${escapeHtml(subscriber.source)}</td>
            <td>${escapeHtml(subscriber.status)}</td>
            <td>${escapeHtml(subscriber.createdAt)}</td>
          </tr>
        `
      )
      .join('');

    const inquiryRows = inquiries
      .map(
        (inquiry) => `
          <tr>
            <td>${inquiry.id}</td>
            <td>${escapeHtml(inquiry.name)}</td>
            <td>${escapeHtml(inquiry.email)}</td>
            <td>${escapeHtml(inquiry.company || '-')}</td>
            <td>${escapeHtml(inquiry.source)}</td>
            <td>${escapeHtml(inquiry.status)}</td>
            <td>${escapeHtml(inquiry.createdAt)}</td>
          </tr>
        `
      )
      .join('');

    return `<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>BoringMoney Admin</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 32px; background: #0d1117; color: #e6edf3; }
          h1, h2 { margin: 0 0 16px; }
          .meta { display: flex; gap: 16px; flex-wrap: wrap; margin: 0 0 24px; }
          .meta span, .meta a { padding: 10px 14px; border: 1px solid #30363d; border-radius: 10px; color: #e6edf3; text-decoration: none; }
          section { margin: 32px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { border-bottom: 1px solid #30363d; padding: 10px 8px; text-align: left; vertical-align: top; }
          th { color: #8b949e; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>BoringMoney Admin</h1>
        <div class="meta">
          <span>Subscribers: ${subscriberCount}</span>
          <span>Inquiries: ${inquiryCount}</span>
          <a href="/admin/subscribers.csv">Export subscribers CSV</a>
          <a href="/admin/inquiries.csv">Export inquiries CSV</a>
        </div>
        <section>
          <h2>Recent Subscribers</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>First Name</th><th>Email</th><th>Source</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>${subscriberRows || '<tr><td colspan="6">No subscribers yet.</td></tr>'}</tbody>
          </table>
        </section>
        <section>
          <h2>Recent Inquiries</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Company</th><th>Source</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>${inquiryRows || '<tr><td colspan="7">No inquiries yet.</td></tr>'}</tbody>
          </table>
        </section>
      </body>
      </html>`;
  }

  app.get(['/', '/index.html'], sendProjectFile('index.html'));
  app.get(['/about', '/about.html'], sendProjectFile('about.html'));
  app.get(['/issues', '/issues.html'], sendProjectFile('issues.html'));
  app.get(
    ['/issue-carwash.html', '/issue-carwash', '/issues/car-washes'],
    sendProjectFile('issue-carwash.html')
  );
  app.get(['/playbooks', '/playbooks.html'], sendProjectFile('playbooks.html'));
  app.get(['/community', '/community.html'], sendProjectFile('community.html'));
  app.get(['/subscribe', '/subscribe.html'], sendProjectFile('subscribe.html'));
  app.get(['/advertise', '/advertise.html'], sendProjectFile('advertise.html'));
  app.get(['/marketplace', '/marketplace.html'], sendProjectFile('marketplace.html'));
  app.get(['/boring-score', '/boring-score.html'], sendProjectFile('boring-score.html'));
  app.get('/shared.css', sendProjectFile('shared.css'));
  app.get('/protect.js', sendProjectFile('protect.js'));
  app.get('/vendor/matter.min.js', (req, res) => {
    res.sendFile(
      path.join(projectRoot, 'node_modules', 'matter-js', 'build', 'matter.min.js'),
      sendFileOptions
    );
  });

  app.get('/health', async (req, res) => {
    const [subscribers, inquiries] = await Promise.all([
      database.countSubscribers(),
      database.countInquiries()
    ]);

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      subscribers,
      inquiries
    });
  });

  app.get('/api/health', async (req, res) => {
    const [subscribers, inquiries] = await Promise.all([
      database.countSubscribers(),
      database.countInquiries()
    ]);

    res.json({
      status: 'ok',
      issues: getPublishedIssues().length,
      playbooks: site.playbooks.length,
      subscribers,
      inquiries
    });
  });

  app.get('/api/runtime-config', (req, res) => {
    res.json({
      turnstileSiteKey: turnstileConfig?.siteKey || null,
      razorpayKeyId: razorpayGateway.keyId || null
    });
  });

  app.get('/ready', async (req, res) => {
    await database.ping();

    res.json({
      status: 'ready',
      database: 'ok'
    });
  });

  app.get('/api/issues', (req, res) => {
    res.json({
      issues: site.issues
    });
  });

  app.get('/api/issues/:slug', (req, res) => {
    const issue = findIssueBySlug(req.params.slug);

    if (!issue) {
      res.status(404).json({ error: 'Issue not found.' });
      return;
    }

    res.json({ issue });
  });

  app.get('/api/playbooks', (req, res) => {
    res.json({
      playbooks: site.playbooks
    });
  });

  app.get('/admin', adminGuard, async (req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8').send(await renderAdminPage());
  });

  app.get('/admin/subscribers.csv', adminGuard, async (req, res) => {
    const csv = toCsv(await database.exportSubscribers(), [
      { key: 'id', header: 'id' },
      { key: 'firstName', header: 'first_name' },
      { key: 'email', header: 'email' },
      { key: 'source', header: 'source' },
      { key: 'status', header: 'status' },
      { key: 'createdAt', header: 'created_at' },
      { key: 'updatedAt', header: 'updated_at' }
    ]);

    res
      .set('Content-Type', 'text/csv; charset=utf-8')
      .set('Content-Disposition', 'attachment; filename="subscribers.csv"')
      .send(csv);
  });

  app.get('/admin/inquiries.csv', adminGuard, async (req, res) => {
    const csv = toCsv(await database.exportInquiries(), [
      { key: 'id', header: 'id' },
      { key: 'name', header: 'name' },
      { key: 'email', header: 'email' },
      { key: 'company', header: 'company' },
      { key: 'message', header: 'message' },
      { key: 'source', header: 'source' },
      { key: 'status', header: 'status' },
      { key: 'createdAt', header: 'created_at' }
    ]);

    res
      .set('Content-Type', 'text/csv; charset=utf-8')
      .set('Content-Disposition', 'attachment; filename="inquiries.csv"')
      .send(csv);
  });

  app.post('/api/subscribers', subscribeLimiter, async (req, res) => {
    const result = await handleSubscription(req.body, req);

    if (!result.ok) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }

    if (result.subscriber && result.isNew) {
      notifySafely(notifier.notifyNewSubscriber(result.subscriber));
    }

    res.status(result.statusCode).json({
      message: result.isNew
        ? 'Subscription confirmed.'
        : 'Already subscribed. Profile updated.',
      subscriber: result.subscriber || null
    });
  });

  app.post('/api/inquiries', inquiryLimiter, async (req, res) => {
    const result = await handleInquiry(req.body, req);

    if (!result.ok) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }

    if (result.inquiry) {
      notifySafely(notifier.notifyNewInquiry(result.inquiry));
    }

    res.status(result.statusCode).json({
      message: 'Inquiry received. We will get back to you shortly.',
      inquiry: result.inquiry || null
    });
  });

  app.post('/api/payments/razorpay/order', paymentLimiter, async (req, res) => {
    if (!razorpayGateway.enabled) {
      res.status(503).json({ error: 'Razorpay is not configured yet.' });
      return;
    }

    const parsed = razorpayOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const order = buildMicrogreenOrder(parsed.data.items, parsed.data.plan);

    if (order.selectedItems.length === 0 || order.totalInPaise <= 0) {
      res.status(400).json({ error: 'Add at least one tray before paying.' });
      return;
    }

    try {
      const razorpayOrder = await razorpayGateway.createOrder({
        amount: order.totalInPaise,
        currency: order.currency,
        receipt: `sprig-${crypto.randomBytes(6).toString('hex')}`,
        notes: {
          plan: parsed.data.plan,
          items: order.selectedItems
            .map((item) => `${item.name} x${item.quantity}`)
            .join(', ')
        }
      });

      res.status(201).json({
        keyId: razorpayGateway.keyId,
        checkout: {
          key: razorpayGateway.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Sprig & Soil',
          description:
            parsed.data.plan === 'weekly'
              ? 'Weekly microgreens harvest box'
              : 'Fresh microgreens harvest box',
          order_id: razorpayOrder.id,
          theme: {
            color: '#3b5d33'
          }
        },
        order: {
          plan: parsed.data.plan,
          items: order.selectedItems,
          subtotalInPaise: order.subtotalInPaise,
          discountInPaise: order.discountInPaise,
          shippingInPaise: order.shippingInPaise,
          totalInPaise: order.totalInPaise
        }
      });
    } catch (error) {
      res.status(502).json({
        error: error.message || 'Could not create a Razorpay order.'
      });
    }
  });

  app.post('/api/payments/razorpay/verify', paymentLimiter, (req, res) => {
    if (!razorpayGateway.enabled) {
      res.status(503).json({ error: 'Razorpay is not configured yet.' });
      return;
    }

    const parsed = razorpayVerifySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const isValid = razorpayGateway.verifyPaymentSignature({
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature
    });

    if (!isValid) {
      res.status(400).json({ error: 'Payment verification failed.' });
      return;
    }

    res.status(200).json({
      message: 'Payment verified successfully.',
      paymentId: parsed.data.razorpay_payment_id,
      orderId: parsed.data.razorpay_order_id
    });
  });

  app.post('/subscribe', subscribeLimiter, async (req, res) => {
    const result = await handleSubscription(req.body, req);

    if (!result.ok) {
      res.redirect('/subscribe?status=invalid');
      return;
    }

    if (result.subscriber && result.isNew) {
      notifySafely(notifier.notifyNewSubscriber(result.subscriber));
    }

    res.redirect(result.isNew ? '/subscribe?status=success' : '/subscribe?status=exists');
  });

  app.post('/inquiries', inquiryLimiter, async (req, res) => {
    const result = await handleInquiry(req.body, req);

    if (!result.ok) {
      res.redirect('/advertise?status=inquiry-invalid');
      return;
    }

    if (result.inquiry) {
      notifySafely(notifier.notifyNewInquiry(result.inquiry));
    }

    res.redirect('/advertise?status=inquiry-success');
  });

  app.use((req, res) => {
    res.status(404).render('404');
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (monitoring?.enabled) {
      monitoring.captureException(error, {
        tags: {
          path: req.path,
          method: req.method
        }
      });
    }

    console.error(error);

    if (requestWantsJson(req)) {
      res.status(500).json({ error: 'Internal server error.' });
      return;
    }

    res.status(500).render('500');
  });

  app.locals.database = database;
  app.locals.shutdown = () => {
    return Promise.resolve(database.close());
  };

  return app;
}

module.exports = { createApp };
