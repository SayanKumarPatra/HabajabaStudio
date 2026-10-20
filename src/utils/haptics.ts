/**
 * Tactile Haptic Feedback Utility for Mobile Devices
 * Provides satisfying, cushioned touch sensations when tapping songs, buttons, and navigation.
 */

export function triggerHaptic(type: 'light' | 'selection' | 'medium' | 'success' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'selection':
        navigator.vibrate(6); // Ultra subtle tick
        break;
      case 'light':
        navigator.vibrate(10); // Crisp comfortable tap
        break;
      case 'medium':
        navigator.vibrate(18); // Solid action feel
        break;
      case 'success':
        navigator.vibrate([10, 30, 15]); // Delightful double tap
        break;
    }
  } catch {
    // Vibration blocked or unsupported
  }
}

/**
 * Initializes global touch response so mobile users experience a comfortable,
 * tactile feel on every button, card, and interactive element.
 */
export function initMobileTouchFeedback() {
  if (typeof window === 'undefined') return;

  let lastTouchTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Check if target or parent is interactive
    const interactive = target.closest(
      'button, a, [role="button"], .interactive-card, .song-row, .carousel-card, .album-card, .artist-card, input[type="range"], nav a'
    );

    if (interactive) {
      const now = Date.now();
      if (now - lastTouchTime > 60) {
        lastTouchTime = now;
        triggerHaptic('light');
      }

      // Add active tactile touch visual class
      interactive.classList.add('mobile-touch-active');

      const cleanup = () => {
        interactive.classList.remove('mobile-touch-active');
        interactive.removeEventListener('touchend', cleanup);
        interactive.removeEventListener('touchcancel', cleanup);
      };

      interactive.addEventListener('touchend', cleanup, { passive: true });
      interactive.addEventListener('touchcancel', cleanup, { passive: true });
    }
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
}
