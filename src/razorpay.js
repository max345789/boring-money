const crypto = require('node:crypto');

function createAuthorizationHeader(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

function createRazorpayGateway(config) {
  if (!config?.keyId || !config?.keySecret) {
    return {
      enabled: false,
      keyId: null,
      async createOrder() {
        throw new Error('Razorpay is not configured.');
      },
      verifyPaymentSignature() {
        return false;
      }
    };
  }

  return {
    enabled: true,
    keyId: config.keyId,
    async createOrder({ amount, currency, receipt, notes }) {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: createAuthorizationHeader(config.keyId, config.keySecret),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt,
          notes
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.error?.description ||
          data?.error?.reason ||
          'Could not create a Razorpay order.';
        throw new Error(message);
      }

      return data;
    },
    verifyPaymentSignature({ orderId, paymentId, signature }) {
      const payload = `${orderId}|${paymentId}`;
      const expected = crypto
        .createHmac('sha256', config.keySecret)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expected, 'utf8');
      const signatureBuffer = Buffer.from(String(signature || ''), 'utf8');

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }
  };
}

module.exports = { createRazorpayGateway };
