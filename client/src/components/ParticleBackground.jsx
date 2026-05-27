// src/components/ParticleBackground.jsx
import React, { useRef, useEffect } from "react";

/**
 * ParticleBackground — subtle, cozy holographic orb + particles
 * Usage: place <ParticleBackground intensity={0.6} /> inside your chat wrapper
 */
export default function ParticleBackground({ orbColor = [110, 86, 255], intensity = 0.6 }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = canvas.clientWidth);
    let h = (canvas.height = canvas.clientHeight);

    const onResize = () => {
      w = canvas.width = canvas.clientWidth;
      h = canvas.height = canvas.clientHeight;
    };
    window.addEventListener("resize", onResize);

    const particles = [];
    const COUNT = Math.max(30, Math.floor((w * h) / 120000));
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 0.6 + Math.random() * 1.8,
        hueShift: Math.random() * 60 - 30,
      });
    }

    const orb = { x: w * 0.86, y: h * 0.14, r: Math.min(w, h) * 0.12 };

    let t = 0;
    let rafId = 0;

    function draw() {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);

      // soft overlay
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "rgba(255,255,255,0.01)");
      bgGrad.addColorStop(1, "rgba(240,248,255,0.01)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // particles
      for (let p of particles) {
        p.x += p.vx * (1 + Math.sin(t + p.r) * 0.2);
        p.y += p.vy * (1 + Math.cos(t + p.r) * 0.2);

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const dist = Math.hypot(p.x - orb.x, p.y - orb.y);
        const influence = Math.max(0, (orb.r * 1.6 - dist) / (orb.r * 1.6));

        const hue = 210 + p.hueShift;
        const alpha = 0.12 * (0.5 + influence * 0.8) * intensity;
        ctx.fillStyle = `hsla(${hue}, 95%, 64%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + influence * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }

      // connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 10000) {
            const alpha = (1 - d2 / 10000) * 0.06 * intensity;
            ctx.strokeStyle = `rgba(140,120,255,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // orb glow
      const [rC, gC, bC] = orbColor;
      const orbGrad = ctx.createRadialGradient(orb.x, orb.y, orb.r * 0.08, orb.x, orb.y, orb.r * 1.6);
      orbGrad.addColorStop(0, `rgba(${rC},${gC},${bC},${0.95 * intensity})`);
      orbGrad.addColorStop(0.35, `rgba(${rC},${gC},${bC},${0.22 * intensity})`);
      orbGrad.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * (1 + Math.sin(t) * 0.02 + intensity * 0.06), 0, Math.PI * 2);
      ctx.fill();

      // subtle orbit ring
      ctx.strokeStyle = `rgba(140,120,255,${0.09 * intensity})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * (1.12 + Math.sin(t * 1.2) * 0.02), 0, Math.PI * 2);
      ctx.stroke();

      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [orbColor, intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.95,
      }}
      aria-hidden="true"
    />
  );
}
