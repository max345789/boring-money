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

  document.addEventListener('click', (event) => {
    if (header.dataset.open !== 'true') {
      return;
    }

    if (!header.contains(event.target)) {
      closeNav();
    }
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
  setupNewsletterForms();
});
