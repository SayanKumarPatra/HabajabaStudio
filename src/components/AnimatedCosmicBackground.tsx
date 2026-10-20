import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
  isBokeh: boolean;
}

export const AnimatedCosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Palette of vibrant, eye-catching studio embers & harmonic aurora colors
    const colors = [
      '237, 16, 37',   // Studio Crimson Red
      '255, 45, 75',   // Vivid Ruby
      '244, 63, 94',   // Rose
      '251, 113, 133', // Soft Coral Pink
      '245, 158, 11',  // Warm Amber Gold
      '255, 255, 255', // Pure Starlight White
    ];

    // Create floating stage embers and soft bokeh orbs
    const count = Math.min(Math.floor((width * height) / 22000), 55);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const isBokeh = Math.random() < 0.22; // ~22% are larger, soft-focus bokeh orbs
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: isBokeh ? Math.random() * 22 + 12 : Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * (isBokeh ? 0.2 : 0.45) + 0.1),
        speedX: (Math.random() - 0.5) * (isBokeh ? 0.15 : 0.3),
        alpha: Math.random() * (isBokeh ? 0.18 : 0.5) + 0.1,
        maxAlpha: isBokeh ? Math.random() * 0.22 + 0.12 : Math.random() * 0.45 + 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: Math.random() * 0.025 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        isBokeh,
      });
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Audio-visualizer harmonic waves parameters
    let time = 0;

    const render = () => {
      if (isVisible && ctx) {
        ctx.clearRect(0, 0, width, height);

        time += 0.016;

        // ====================================================================
        // 1. Dynamic Flowing Harmonic Soundwaves (Live Studio Audio Visualizer)
        // Multi-layered undulating waveforms passing through the background
        // ====================================================================
        const waves = [
          {
            baseY: height * 0.38,
            amplitude: 45,
            frequency: 0.0035,
            speed: 1.2,
            phase: 0,
            fill: 'rgba(237, 16, 37, 0.07)',
            stroke: 'rgba(237, 16, 37, 0.35)',
            lineWidth: 2,
          },
          {
            baseY: height * 0.55,
            amplitude: 60,
            frequency: 0.0028,
            speed: -0.9,
            phase: Math.PI * 0.5,
            fill: 'rgba(255, 45, 75, 0.05)',
            stroke: 'rgba(255, 75, 95, 0.28)',
            lineWidth: 2.2,
          },
          {
            baseY: height * 0.72,
            amplitude: 50,
            frequency: 0.0042,
            speed: 1.4,
            phase: Math.PI * 1.2,
            fill: 'rgba(180, 10, 30, 0.06)',
            stroke: 'rgba(244, 63, 94, 0.25)',
            lineWidth: 1.8,
          },
        ];

        waves.forEach((w) => {
          ctx.beginPath();
          ctx.moveTo(0, height);

          // Draw the wave across screen width with smooth step interpolation
          const step = 20;
          for (let x = 0; x <= width + step; x += step) {
            const wave1 = Math.sin(x * w.frequency + time * w.speed + w.phase);
            const wave2 = Math.cos(x * (w.frequency * 0.6) - time * (w.speed * 0.5));
            const y = w.baseY + (wave1 * 0.7 + wave2 * 0.3) * w.amplitude;

            if (x === 0) {
              ctx.lineTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          // Subtle gradient fill under the wave
          const waveGrad = ctx.createLinearGradient(0, w.baseY - w.amplitude, 0, height);
          waveGrad.addColorStop(0, w.fill);
          waveGrad.addColorStop(1, 'rgba(4, 4, 6, 0)');
          ctx.fillStyle = waveGrad;
          ctx.fill();

          // Luminous crest line for eye-catching visual feedback
          ctx.beginPath();
          for (let x = 0; x <= width + step; x += step) {
            const wave1 = Math.sin(x * w.frequency + time * w.speed + w.phase);
            const wave2 = Math.cos(x * (w.frequency * 0.6) - time * (w.speed * 0.5));
            const y = w.baseY + (wave1 * 0.7 + wave2 * 0.3) * w.amplitude;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = w.stroke;
          ctx.lineWidth = w.lineWidth;
          ctx.shadowColor = w.stroke;
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // ====================================================================
        // 2. Floating Radiant Musical Embers & Deep Bokeh Orbs
        // ====================================================================
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Movement
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(time + p.pulsePhase) * (p.isBokeh ? 0.35 : 0.25);

          // Wrap around edges seamlessly
          if (p.y < -50) {
            p.y = height + 50;
            p.x = Math.random() * width;
          }
          if (p.x < -50) p.x = width + 50;
          if (p.x > width + 50) p.x = -50;

          // Gentle breathing pulsation
          p.pulsePhase += p.pulseSpeed;
          const currentAlpha = Math.abs(Math.sin(p.pulsePhase)) * p.maxAlpha + (p.isBokeh ? 0.05 : 0.1);

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

          if (p.isBokeh) {
            // Soft large blurred orb
            const radialGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            radialGrad.addColorStop(0, `rgba(${p.color}, ${currentAlpha})`);
            radialGrad.addColorStop(0.6, `rgba(${p.color}, ${currentAlpha * 0.4})`);
            radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = radialGrad;
            ctx.fill();
          } else {
            // Sharp glowing ember with radiant halo
            ctx.fillStyle = `rgba(${p.color}, ${currentAlpha})`;
            ctx.shadowColor = `rgba(${p.color}, 0.9)`;
            ctx.shadowBlur = p.radius * 7;
            ctx.fill();
          }

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="red-aurora-layer fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* 1. Deep Celestial Base Gradient with vibrant ruby underglow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#180306] via-[#0a0204] to-[#040406]" />

      {/* 2. Primary Flowing Crimson Plasma Ribbon (Top-Right Aurora Wave) */}
      <div className="aurora-curtain-vivid-1" />

      {/* 3. Secondary Radiant Rose/Ruby Aurora Ribbon (Left-Center Wave) */}
      <div className="aurora-curtain-vivid-2" />

      {/* 4. Ambient Deep Crimson Stage Light (Lower Underglow) */}
      <div className="aurora-curtain-vivid-3" />

      {/* 5. Glowing Central Sonic Pulse Beam */}
      <div className="aurora-beam-vivid" />

      {/* 6. Dynamic Audio Waveform & Floating Starlight Embers Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
      />

      {/* 7. Subtle Vignette for maximum text readability and contrast */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/65 pointer-events-none" />
    </div>
  );
};
