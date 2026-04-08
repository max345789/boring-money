// Scroll reveal for home cards
const homeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), index * 80);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.what-card').forEach((element) => homeObserver.observe(element));

document.addEventListener('DOMContentLoaded', () => {
  // Simple Matter.js setup for the hero background.
  if (window.Matter) {
    const { Engine, Render, Runner, Bodies, Composite } = window.Matter;
    const heroSection = document.querySelector('.hero');
    const canvas = document.getElementById('physics-canvas');

    if (heroSection && canvas) {
      const width = heroSection.clientWidth;
      const height = heroSection.clientHeight;
      const engine = Engine.create({ gravity: { x: 0, y: 0.3 } });
      const render = Render.create({
        canvas,
        engine,
        options: { width, height, background: 'transparent', wireframes: false }
      });

      const palette = ['#c8c4bb', '#a38c4d', '#dcd8cd'];
      const shapes = [];

      for (let index = 0; index < 12; index += 1) {
        const radius = Math.random() * 14 + 6;
        const x = Math.random() * width;
        const y = Math.random() * -800 - 100;
        const sides = Math.floor(Math.random() * 3) + 3;

        shapes.push(
          Bodies.polygon(x, y, sides, radius, {
            restitution: 0.4,
            friction: 0.3,
            frictionAir: 0.02,
            render: {
              fillStyle: palette[Math.floor(Math.random() * palette.length)],
              opacity: 0.12
            }
          })
        );
      }

      const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, {
        isStatic: true,
        render: { visible: false }
      });
      const wallLeft = Bodies.rectangle(-50, height / 2, 100, height * 2, {
        isStatic: true,
        render: { visible: false }
      });
      const wallRight = Bodies.rectangle(width + 50, height / 2, 100, height * 2, {
        isStatic: true,
        render: { visible: false }
      });

      Composite.add(engine.world, [...shapes, ground, wallLeft, wallRight]);
      Render.run(render);
      Runner.run(Runner.create(), engine);
    }
  }

  const nav = document.querySelector('nav');
  if (nav) {
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Menu');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(hamburger);

    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.innerHTML = `
      <a href="index.html">Home</a>
      <a href="issues.html">Issues</a>
      <a href="about.html">About</a>
      <a href="playbooks.html">Playbooks</a>
      <a href="community.html">Community</a>
      <a href="advertise.html">Advertise</a>
      <a href="subscribe.html" class="mob-cta">Subscribe — Free</a>
    `;
    document.body.appendChild(overlay);

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
    });

    overlay.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
});

// Existing content protection behavior preserved.
document.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('copy', (event) => event.preventDefault());
document.addEventListener('cut', (event) => event.preventDefault());
document.addEventListener('dragstart', (event) => event.preventDefault());
document.addEventListener('keydown', (event) => {
  if (event.key === 'F12') {
    event.preventDefault();
    return false;
  }

  if (event.ctrlKey && event.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(event.key)) {
    event.preventDefault();
    return false;
  }

  if (event.ctrlKey && ['u', 'U', 's', 'S'].includes(event.key)) {
    event.preventDefault();
    return false;
  }

  if (event.metaKey && event.altKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(event.key)) {
    event.preventDefault();
    return false;
  }

  if (event.metaKey && ['u', 'U', 's', 'S'].includes(event.key)) {
    event.preventDefault();
    return false;
  }

  return true;
});
