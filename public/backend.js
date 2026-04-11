(function () {
  let runtimeConfigPromise = null;

  const statusMessages = {
    success: { tone: 'success', message: 'Subscription confirmed. We will keep you posted on weekly harvest availability.' },
    exists: { tone: 'info', message: 'You are already on the list. We updated your details.' },
    invalid: { tone: 'error', message: 'Please enter a valid email address and try again.' },
    'rate-limited': { tone: 'error', message: 'Too many attempts right now. Please wait a minute and try again.' },
    'inquiry-success': { tone: 'success', message: 'Inquiry received. We will get back to you shortly.' },
    'inquiry-invalid': { tone: 'error', message: 'Please complete the inquiry form and try again.' },
    'inquiry-rate-limited': { tone: 'error', message: 'Too many attempts right now. Please wait a minute and try again.' }
  };

  function loadRuntimeConfig() {
    if (!runtimeConfigPromise) {
      runtimeConfigPromise = fetch('/api/runtime-config', {
        headers: { Accept: 'application/json' }
      })
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({}));
    }

    return runtimeConfigPromise;
  }

  function loadTurnstileScript() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve();
        return;
      }

      const existing = document.querySelector('script[data-turnstile-loader="true"]');

      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Turnstile failed to load.')), {
          once: true
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstileLoader = 'true';
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Turnstile failed to load.')), {
        once: true
      });
      document.head.appendChild(script);
    });
  }

  function getFeedbackNode(form) {
    return form.querySelector('.form-status');
  }

  function showFeedback(form, tone, message) {
    const node = getFeedbackNode(form);

    if (!node) {
      return;
    }

    node.hidden = false;
    node.textContent = message;
    node.className = `form-status form-status--${tone}`;
  }

  async function submitJson(form, endpoint) {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const button = form.querySelector('button[type="submit"], button:not([type])');

    if (button) {
      button.disabled = true;
    }

    showFeedback(form, 'info', 'Submitting...');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Request failed.');
      }

      showFeedback(form, 'success', body.message || 'Done.');
      form.reset();

      if (window.turnstile && form.dataset.turnstileWidgetId) {
        window.turnstile.reset(form.dataset.turnstileWidgetId);
      }
    } catch (error) {
      showFeedback(form, 'error', error.message);
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }

  async function bindSecurityChecks(forms) {
    const runtimeConfig = await loadRuntimeConfig();
    const siteKey = runtimeConfig.turnstileSiteKey;

    if (!siteKey) {
      return;
    }

    await loadTurnstileScript();

    forms.forEach((form) => {
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'turnstileToken';
      form.appendChild(tokenInput);

      const widget = document.createElement('div');
      widget.style.marginTop = '10px';
      form.appendChild(widget);

      const widgetId = window.turnstile.render(widget, {
        sitekey: siteKey,
        callback(token) {
          tokenInput.value = token;
        },
        'expired-callback': function () {
          tokenInput.value = '';
        },
        'error-callback': function () {
          tokenInput.value = '';
        }
      });

      form.dataset.turnstileWidgetId = String(widgetId);
    });
  }

  function bindAsyncForms() {
    const subscribeForms = Array.from(document.querySelectorAll('form.js-subscribe-form'));
    const inquiryForms = Array.from(document.querySelectorAll('form.js-inquiry-form'));
    const forms = [...subscribeForms, ...inquiryForms];

    subscribeForms.forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitJson(form, '/api/subscribers');
      });
    });

    inquiryForms.forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitJson(form, '/api/inquiries');
      });
    });

    if (forms.length > 0) {
      bindSecurityChecks(forms).catch(() => {
        forms.forEach((form) => {
          showFeedback(
            form,
            'error',
            'Security checks failed to load. Please refresh and try again.'
          );
        });
      });
    }
  }

  function showRedirectStatus() {
    const status = new URLSearchParams(window.location.search).get('status');

    if (!status || !statusMessages[status]) {
      return;
    }

    const form =
      status.startsWith('inquiry-')
        ? document.querySelector('form.js-inquiry-form')
        : document.querySelector('form.js-subscribe-form');

    if (!form) {
      return;
    }

    const feedback = statusMessages[status];
    showFeedback(form, feedback.tone, feedback.message);

    const url = new URL(window.location.href);
    url.searchParams.delete('status');
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindAsyncForms();
    showRedirectStatus();
  });
})();
