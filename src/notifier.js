const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createNotifier(config) {
  if (!config) {
    return {
      enabled: false,
      async notifyNewSubscriber() {},
      async notifyNewInquiry() {}
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  async function sendMail({ subject, text, html }) {
    await transporter.sendMail({
      from: config.fromEmail,
      to: config.notifyEmail,
      subject,
      text,
      html
    });
  }

  return {
    enabled: true,
    async notifyNewSubscriber(subscriber) {
      const subject = `New BoringMoney subscriber: ${subscriber.email}`;
      const text = [
        'A new subscriber joined BoringMoney.',
        '',
        `Email: ${subscriber.email}`,
        `First name: ${subscriber.firstName || '-'}`,
        `Source: ${subscriber.source}`,
        `Status: ${subscriber.status}`,
        `Created at: ${subscriber.createdAt}`
      ].join('\n');

      const html = `
        <h2>New subscriber</h2>
        <p><strong>Email:</strong> ${escapeHtml(subscriber.email)}</p>
        <p><strong>First name:</strong> ${escapeHtml(subscriber.firstName || '-')}</p>
        <p><strong>Source:</strong> ${escapeHtml(subscriber.source)}</p>
        <p><strong>Status:</strong> ${escapeHtml(subscriber.status)}</p>
        <p><strong>Created at:</strong> ${escapeHtml(subscriber.createdAt)}</p>
      `;

      await sendMail({ subject, text, html });
    },
    async notifyNewInquiry(inquiry) {
      const subject = `New BoringMoney inquiry from ${inquiry.company || inquiry.name}`;
      const text = [
        'A new advertiser inquiry was submitted.',
        '',
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Company: ${inquiry.company || '-'}`,
        `Source: ${inquiry.source}`,
        `Status: ${inquiry.status}`,
        `Created at: ${inquiry.createdAt}`,
        '',
        inquiry.message
      ].join('\n');

      const html = `
        <h2>New inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(inquiry.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(inquiry.company || '-')}</p>
        <p><strong>Source:</strong> ${escapeHtml(inquiry.source)}</p>
        <p><strong>Status:</strong> ${escapeHtml(inquiry.status)}</p>
        <p><strong>Created at:</strong> ${escapeHtml(inquiry.createdAt)}</p>
        <p><strong>Message:</strong></p>
        <pre>${escapeHtml(inquiry.message)}</pre>
      `;

      await sendMail({ subject, text, html });
    }
  };
}

module.exports = { createNotifier };
