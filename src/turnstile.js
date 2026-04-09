const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstileToken({
  secretKey,
  token,
  remoteIp,
  timeoutMs = 5000,
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString(),
      signal: controller.signal
    });
    payload = await response.json();
  } catch (error) {
    const isTimeout =
      error &&
      (error.name === 'AbortError' || error.code === 'ABORT_ERR');

    return {
      ok: false,
      error: isTimeout ? 'verification-timeout' : 'verification-unavailable',
      reason: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timeout);
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
