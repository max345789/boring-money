// Content Protection
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (e.key === 'F12') { e.preventDefault(); return false; }
  if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.ctrlKey && ['u','U','s','S'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.metaKey && e.altKey && ['i','I','j','J','c','C'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.metaKey && ['u','U','s','S'].includes(e.key)) { e.preventDefault(); return false; }
});

// Mobile Hamburger Menu — injected dynamically
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  if (!nav) return;

  // Create hamburger button
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.setAttribute('aria-label', 'Menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(hamburger);

  // Create mobile overlay
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

  // Toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
  });

  // Close on link click
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
});
