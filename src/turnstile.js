const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstileToken({
  secretKey,
  token,
  remoteIp,
  fetchImpl = fetch
}) {
  if (!secretKey) {
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'missing-token' };
  }

  const body = new URLSearchParams({
    secret: secretKey,
    response: token
  });

  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  let response;
  let payload;

  try {
    response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
    payload = await response.json();
  } catch (error) {
    return {
      ok: false,
      error: 'verification-unavailable',
      reason: error instanceof Error ? error.message : String(error)
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: 'verification-unavailable',
      reason: `turnstile-status-${response.status}`
    };
  }

  if (!payload.success) {
    return {
      ok: false,
      error: 'verification-failed',
      codes: payload['error-codes'] || []
    };
  }

  return { ok: true };
}

module.exports = {
  verifyTurnstileToken
};
