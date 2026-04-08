function formatCounterValue(value, prefix, suffix) {
  if (value >= 100000) {
    return `${prefix}${Math.round(value / 1000)}k${suffix}`;
  }

  return `${prefix}${new Intl.NumberFormat('en-US').format(value)}${suffix}`;
}

function setupRevealObserver() {
  const revealables = document.querySelectorAll('.reveal-on-scroll');

  if (!revealables.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealables.forEach((element) => observer.observe(element));
}

function setupCounters() {
  const counters = document.querySelectorAll('[data-counter-value]');

  if (!counters.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const element = entry.target;
        const target = Number.parseInt(element.dataset.counterValue || '0', 10);
        const prefix = element.dataset.prefix || '';
        const suffix = element.dataset.suffix || '';
        const duration = 900;
        const startedAt = performance.now();

        function tick(now) {
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          element.textContent = formatCounterValue(current, prefix, suffix);

          if (progress < 1) {
            window.requestAnimationFrame(tick);
          }
        }

        window.requestAnimationFrame(tick);
        observer.unobserve(element);
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function setupNavigation() {
  const header = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');

  if (!header || !toggle || !panel) {
    return;
  }

  function closeNav() {
    header.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const nextState = header.dataset.open === 'true' ? 'false' : 'true';
    header.dataset.open = nextState;
    toggle.setAttribute('aria-expanded', nextState);
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNav();
    }
  });
}

function applyFormStatus(form, tone, message) {
  const status = form.querySelector('.form-status');

  if (!status) {
    return;
  }

  status.hidden = false;
  status.textContent = message;
  status.className = `form-status form-status--${tone}`;
}

function setupNewsletterForms() {
  const forms = document.querySelectorAll('.js-newsletter-form');

  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const button = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      if (button) {
        button.disabled = true;
      }

      applyFormStatus(form, 'info', 'Submitting...');

      try {
        const response = await fetch('/api/subscribers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Could not complete subscription.');
        }

        applyFormStatus(form, 'success', data.message || 'Subscription confirmed.');
        form.reset();
      } catch (error) {
        applyFormStatus(form, 'error', error.message);
      } finally {
        if (button) {
          button.disabled = false;
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupRevealObserver();
  setupCounters();
  setupNewsletterForms();
});
