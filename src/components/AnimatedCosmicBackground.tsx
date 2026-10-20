import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  maxAlpha: number;
  hue: string;
  pulseSpeed: number;
  pulsePhase: number;
}

export const AnimatedCosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Palette of vibrant, eye-catching studio embers & aurora dust
    const hues = [
      '237, 16, 37',   // Studio Crimson Red
      '244, 63, 94',   // Rose
      '251, 113, 133', // Soft Coral Pink
      '255, 255, 255', // Pure Starlight White
      '245, 158, 11',  // Acoustic Warm Amber
    ];

    // Generate ~35 floating glowing particles
    const particleCount = Math.min(Math.floor((width * height) / 25000), 45);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * 0.45 + 0.15), // Gently drift upwards
        speedX: (Math.random() - 0.5) * 0.25,  // Slight horizontal sway
        alpha: Math.random() * 0.6 + 0.2,
        maxAlpha: Math.random() * 0.5 + 0.35,
        hue: hues[Math.floor(Math.random() * hues.length)],
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Animation Loop
    let time = 0;
    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        time += 0.02;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Update position
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(time + p.pulsePhase) * 0.2;

          // Wrap around edges
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Gentle alpha pulsation
          p.pulsePhase += p.pulseSpeed;
          const currentAlpha = Math.abs(Math.sin(p.pulsePhase)) * p.maxAlpha + 0.1;

          // Render glowing particle
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.hue}, ${currentAlpha})`;
          ctx.shadowColor = `rgba(${p.hue}, 0.8)`;
          ctx.shadowBlur = p.radius * 6;
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="red-aurora-layer fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* 1. Deep Celestial Base Gradient with vibrant ruby underglow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#160407] via-[#090305] to-[#040406]" />

      {/* 2. Primary Flowing Crimson Plasma Ribbon (Top-Right Aurora Wave) */}
      <div className="aurora-curtain-vivid-1" />

      {/* 3. Secondary Radiant Rose/Ruby Aurora Ribbon (Left-Center Wave) */}
      <div className="aurora-curtain-vivid-2" />

      {/* 4. Ambient Deep Crimson Stage Light (Lower Underglow) */}
      <div className="aurora-curtain-vivid-3" />

      {/* 5. Glowing Central Sonic Pulse Beam */}
      <div className="aurora-beam-vivid" />

      {/* 6. Dynamic Floating Starlight Embers & Stage Dust Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
      />

      {/* 7. Subtle Vignette for maximum text readability and contrast */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />
    </div>
  );
};
