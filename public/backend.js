(function () {
  const statusMessages = {
    success: { tone: 'success', message: 'Subscription confirmed. Your first issue is on the way.' },
    exists: { tone: 'info', message: 'You are already subscribed. We updated your details.' },
    invalid: { tone: 'error', message: 'Please enter a valid email address and try again.' },
    'rate-limited': { tone: 'error', message: 'Too many attempts right now. Please wait a minute and try again.' },
    'inquiry-success': { tone: 'success', message: 'Inquiry received. We will get back to you shortly.' },
    'inquiry-invalid': { tone: 'error', message: 'Please complete the inquiry form and try again.' },
    'inquiry-rate-limited': { tone: 'error', message: 'Too many attempts right now. Please wait a minute and try again.' }
  };

  function getFeedbackNode(form) {
    let node = form.nextElementSibling;

    if (!node || !node.classList.contains('backend-feedback')) {
      node = document.createElement('p');
      node.className = 'backend-feedback';
      node.style.margin = '12px 0 0';
      node.style.fontFamily = "'DM Mono', monospace";
      node.style.fontSize = '11px';
      node.style.letterSpacing = '0.04em';
      node.style.textTransform = 'uppercase';
      form.insertAdjacentElement('afterend', node);
    }

    return node;
  }

  function showFeedback(form, tone, message) {
    const node = getFeedbackNode(form);
    const colors = {
      success: '#2f7b52',
      error: '#9f403d',
      info: '#6c5a2d'
    };

    node.textContent = message;
    node.style.color = colors[tone] || '#8a8a7c';
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
    } catch (error) {
      showFeedback(form, 'error', error.message);
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }

  function bindAsyncForms() {
    document.querySelectorAll('form.js-subscribe-form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitJson(form, '/api/subscribers');
      });
    });

    document.querySelectorAll('form.js-inquiry-form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitJson(form, '/api/inquiries');
      });
    });
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
