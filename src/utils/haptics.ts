/**
 * Tactile Haptic Feedback Utility for Mobile Devices
 * Provides subtle, standard vibration when tapping controls (if supported).
 */

export function triggerHaptic(type: 'light' | 'selection' | 'medium' | 'success' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'selection':
        navigator.vibrate(5);
        break;
      case 'light':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(15);
        break;
      case 'success':
        navigator.vibrate([8, 20, 10]);
        break;
    }
  } catch {
    // Vibration blocked or unsupported
  }
}

/**
 * Clean no-op to prevent any unwanted touch overlays or sticky active effects.
 */
export function initMobileTouchFeedback() {
  // Deliberately no-op: clean native mobile interactions without artificial overlays
}
