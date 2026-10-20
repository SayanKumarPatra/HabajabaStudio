import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface TouchRipple {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export const TouchAnimationOverlay: React.FC = () => {
  const [ripples, setRipples] = useState<TouchRipple[]>([]);

  useEffect(() => {
    let rippleId = 0;

    const createRipple = (clientX: number, clientY: number) => {
      const id = ++rippleId;
      const size = Math.floor(Math.random() * 20) + 70; // 70px - 90px ripple radius

      // Vibrant music studio colors for touch ripple
      const rippleColors = [
        'rgba(237, 16, 37, 0.75)',   // Neon Crimson Red
        'rgba(244, 63, 94, 0.75)',   // Hot Rose
        'rgba(255, 75, 95, 0.8)',    // Vivid Coral
        'rgba(251, 113, 133, 0.85)', // Radiant Pink
      ];
      const color = rippleColors[Math.floor(Math.random() * rippleColors.length)];

      const newRipple: TouchRipple = {
        id,
        x: clientX,
        y: clientY,
        size,
        color,
      };

      setRipples((prev) => [...prev.slice(-12), newRipple]); // Keep max 12 concurrent ripples

      // Trigger crisp mobile haptic tap
      triggerHaptic('light');

      // Remove after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 550);
    };

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        createRipple(touch.clientX, touch.clientY);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only fire for mouse/pen click if not touch (touch is already handled by touchstart)
      if (e.pointerType === 'mouse') {
        createRipple(e.clientX, e.clientY);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="touch-ripple-effect absolute rounded-full pointer-events-none"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            transform: 'translate(-50%, -50%)',
            borderColor: ripple.color,
          }}
        >
          {/* Inner sparkling neon energy core */}
          <span
            className="absolute inset-0 m-auto rounded-full w-2.5 h-2.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-ping"
            style={{ animationDuration: '350ms' }}
          />
          {/* Concentric aura pulse ring */}
          <span
            className="absolute inset-1 rounded-full border border-red-400/60"
          />
        </span>
      ))}
    </div>
  );
};
