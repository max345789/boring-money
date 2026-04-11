(function () {
  const blockedShortcuts = new Set(['F12']);
  const devtoolsThreshold = 180;

  function isEditableTarget(target) {
    if (!target || !(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [data-allow-copy="true"]'
      )
    );
  }

  function preventIfLocked(event) {
    if (isEditableTarget(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function isBlockedShortcut(event) {
    const key = String(event.key || '');
    const lowerKey = key.toLowerCase();
    const modifier = event.ctrlKey || event.metaKey;
    const shiftModifier = event.ctrlKey || event.metaKey || event.shiftKey;

    if (blockedShortcuts.has(key)) {
      return true;
    }

    if (modifier && ['u', 's', 'p', 'a', 'c', 'x'].includes(lowerKey)) {
      return true;
    }

    if (shiftModifier && modifier && ['i', 'j', 'c'].includes(lowerKey)) {
      return true;
    }

    return false;
  }

  function updateDevtoolsState() {
    const widthGap = Math.abs(window.outerWidth - window.innerWidth);
    const heightGap = Math.abs(window.outerHeight - window.innerHeight);
    const isOpen = widthGap > devtoolsThreshold || heightGap > devtoolsThreshold;

    document.documentElement.classList.toggle('devtools-suspected', isOpen);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('ui-locked');

    document.querySelectorAll('img').forEach((image) => {
      image.setAttribute('draggable', 'false');
    });

    document.addEventListener('contextmenu', preventIfLocked, true);
    document.addEventListener('copy', preventIfLocked, true);
    document.addEventListener('cut', preventIfLocked, true);
    document.addEventListener('dragstart', preventIfLocked, true);
    document.addEventListener('selectstart', preventIfLocked, true);

    document.addEventListener(
      'keydown',
      (event) => {
        if (!isEditableTarget(event.target) && isBlockedShortcut(event)) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    window.addEventListener('resize', updateDevtoolsState, { passive: true });
    setInterval(updateDevtoolsState, 1500);
    updateDevtoolsState();
  });
})();
