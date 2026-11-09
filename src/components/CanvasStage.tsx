import React, { useRef, useEffect } from 'react';
import { Stroke, Particle, EffectMode, BackgroundMode } from '../types';
import { ProcessedHand } from '../utils/gestureDetection';

interface CanvasStageProps {
  strokes: Stroke[];
  activeStroke: Stroke | null;
  hands: ProcessedHand[];
  isFrozen: boolean;
  activeColor: string;
  effectMode: EffectMode;
  bgMode: BackgroundMode;
  showSkeleton: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

// Helper to draw brilliant twinkling 4-point cross stars
function drawMagicStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = Math.min(25, size * 1.5);

  ctx.beginPath();
  const outer = size;
  const inner = size * 0.2;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const px = Math.cos(angle) * outer;
    const py = Math.sin(angle) * outer;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);

    const midAngle = angle + Math.PI / 4;
    ctx.lineTo(Math.cos(midAngle) * inner, Math.sin(midAngle) * inner);
  }
  ctx.closePath();
  ctx.fill();

  // White gleaming center core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1, inner * 0.7), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  strokes,
  activeStroke,
  hands,
  isFrozen,
  activeColor,
  effectMode,
  bgMode,
  showSkeleton,
  videoRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Stable ref for continuous 60fps render loop
  const propsRef = useRef({
    strokes,
    activeStroke,
    hands,
    isFrozen,
    activeColor,
    effectMode,
    bgMode,
    showSkeleton,
    videoRef,
  });

  propsRef.current = {
    strokes,
    activeStroke,
    hands,
    isFrozen,
    activeColor,
    effectMode,
    bgMode,
    showSkeleton,
    videoRef,
  };

  // Safe particle spawner with fast decay so effects disappear immediately ("keyin yana yo'q bo'lib qolsin o'sha zahoti")
  const spawnMagicParticles = (
    x: number,
    y: number,
    count: number,
    color: string,
    mode: EffectMode,
    intensity: number
  ) => {
    const list = particlesRef.current;
    if (list.length > 150) {
      list.splice(0, count);
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.8 + Math.random() * 3.5) * (0.8 + intensity * 0.8);
      const isStar = Math.random() < 0.45;

      let pColor = color;
      if (mode === 'magic_stars' || mode === 'cosmic') {
        const magicHues = ['#ffd700', '#00f0ff', '#ff3df2', '#ffffff', '#a855f7'];
        pColor = magicHues[Math.floor(Math.random() * magicHues.length)];
      } else if (mode === 'fire') {
        pColor = Math.random() > 0.4 ? '#ff5500' : '#ffcc00';
      } else if (mode === 'frost') {
        pColor = Math.random() > 0.3 ? '#80e5ff' : '#ffffff';
      }

      list.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: mode === 'fire' ? -Math.abs(Math.sin(angle) * speed) - 1.5 : Math.sin(angle) * speed,
        // Fast decay: particles disappear in 0.4 - 0.7s so screen stays clean
        life: 1,
        decay: 0.035 + Math.random() * 0.03,
        size: isStar ? 5 + Math.random() * 9 * (0.8 + intensity * 0.6) : 2 + Math.random() * 3,
        color: pColor,
        type: isStar ? 'star' : 'dust',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Lightning generator between 2 points
    const drawLightning = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      c: CanvasRenderingContext2D
    ) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.hypot(dx, dy);
      if (distance > width * 0.85) return;

      const segments = Math.max(6, Math.floor(distance / 22));
      c.save();
      c.beginPath();
      c.moveTo(p1.x, p1.y);

      let currX = p1.x;
      let currY = p1.y;
      const stepX = dx / segments;
      const stepY = dy / segments;

      for (let i = 1; i < segments; i++) {
        const jitter = (Math.random() - 0.5) * Math.min(45, distance * 0.22);
        const perpX = -stepY / (Math.hypot(stepX, stepY) || 1);
        const perpY = stepX / (Math.hypot(stepX, stepY) || 1);
        currX += stepX + perpX * jitter;
        currY += stepY + perpY * jitter;
        c.lineTo(currX, currY);
      }
      c.lineTo(p2.x, p2.y);

      c.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      c.lineWidth = 4;
      c.shadowColor = '#00f0ff';
      c.shadowBlur = 14;
      c.stroke();

      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.6;
      c.shadowBlur = 4;
      c.stroke();
      c.restore();
    };

    const render = (time: number) => {
      const currentProps = propsRef.current;
      const {
        strokes: currentStrokes,
        activeStroke: currentActiveStroke,
        hands: currentHands,
        isFrozen: currentIsFrozen,
        activeColor: currentActiveColor,
        effectMode: currentEffect,
        bgMode: currentBgMode,
        showSkeleton: currentShowSkeleton,
        videoRef: currentVideoRef,
      } = currentProps;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Draw Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      const video = currentVideoRef?.current;
      if (currentBgMode === 'camera' && video && video.readyState >= 2 && video.videoWidth) {
        ctx.save();
        ctx.globalAlpha = 0.52;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const scale = Math.max(width / vw, height / vh);
        const ox = (width - vw * scale) / 2;
        const oy = (height - vh * scale) / 2;
        ctx.translate(ox + vw * scale, oy);
        ctx.scale(-scale, scale);
        ctx.drawImage(video, 0, 0, vw, vh);
        ctx.restore();

        // High-contrast clean dark tint
        ctx.fillStyle = 'rgba(3, 7, 18, 0.42)';
        ctx.fillRect(0, 0, width, height);
      } else if (currentBgMode === 'cyber') {
        // Delicate cyber ambient grid
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        const offset = (time / 70) % gridSize;
        ctx.beginPath();
        for (let x = offset; x < width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = offset; y < height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          50,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.03)');
        grad.addColorStop(1, 'rgba(3, 7, 18, 0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 2. Dual Hand Lightning (if 2 hands are present)
      if (currentHands && currentHands.length >= 2) {
        const h1 = currentHands[0]?.indexPoint;
        const h2 = currentHands[1]?.indexPoint;
        if (h1 && h2) {
          drawLightning(h1, h2, ctx);
        }
      }

      // 3. Proximity-Based Magical Hand Auras and Star Spawns ("qolni yaqin olib kelsa effektlar chiqsin")
      if (currentHands && currentHands.length > 0) {
        currentHands.forEach((hand) => {
          const prox = hand.proximity; // 0 = far, 1 = close

          // Only when hand is brought close (proximity > 0.25) do the magical effects activate!
          if (prox > 0.25) {
            const palm = hand.palmCenter;
            const t = time / 1000;
            const auraRadius = (hand.handSize * 0.5) * (0.8 + prox * 0.6);

            ctx.save();
            // Concentric pulsating magical aura portal around palm
            const g = ctx.createRadialGradient(palm.x, palm.y, 0, palm.x, palm.y, auraRadius * 1.8);
            g.addColorStop(0, `rgba(255, 255, 255, ${0.4 * prox})`);
            g.addColorStop(0.3, `rgba(0, 240, 255, ${0.28 * prox})`);
            g.addColorStop(0.7, `rgba(168, 85, 247, ${0.12 * prox})`);
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(palm.x, palm.y, auraRadius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Rotating magical rune rings
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.45 * prox})`;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10 * prox;
            ctx.beginPath();
            ctx.arc(palm.x, palm.y, auraRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Orbiting celestial star nodes around palm
            const starCount = 3 + Math.floor(prox * 3);
            for (let i = 0; i < starCount; i++) {
              const ang = t * 1.5 + (i * Math.PI * 2) / starCount;
              const sx = palm.x + Math.cos(ang) * (auraRadius * 1.15);
              const sy = palm.y + Math.sin(ang) * (auraRadius * 1.15);
              drawMagicStar(ctx, sx, sy, 6 * prox + 2, t * 2 + i, '#ffd700', 0.85 * prox);
            }
            ctx.restore();

            // When hand is close, spawn twinkling star particles from fingertips
            if (Math.random() < 0.7 * prox) {
              const tip = hand.indexPoint;
              spawnMagicParticles(tip.x, tip.y, 2, currentActiveColor, currentEffect, prox);
            }
          }
        });
      }

      // 4. Sleek Minimal Holographic Hand Skeleton (if enabled)
      if (currentShowSkeleton && currentHands) {
        currentHands.forEach((hand) => {
          if (!hand || !hand.screenPoints) return;
          const pts = hand.screenPoints;
          const prox = hand.proximity;

          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Thin cyan wireframe
          ctx.beginPath();
          for (const [i, j] of HAND_CONNECTIONS) {
            const pi = pts[i];
            const pj = pts[j];
            if (pi && pj && typeof pi.x === 'number' && typeof pj.x === 'number') {
              ctx.moveTo(pi.x, pi.y);
              ctx.lineTo(pj.x, pj.y);
            }
          }
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.18 + prox * 0.25})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Joint dots
          pts.forEach((p, idx) => {
            if (!p) return;
            const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
            ctx.beginPath();
            ctx.arc(p.x, p.y, isTip ? 3.5 : 1.8, 0, Math.PI * 2);
            ctx.fillStyle = isTip ? '#ffffff' : 'rgba(57, 255, 136, 0.8)';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = isTip ? 8 : 2;
            ctx.fill();
          });

          // Single Index Finger Drawing Cursor
          const idxPt = hand.indexPoint;
          if (idxPt) {
            ctx.beginPath();
            const pulseR = hand.isIndexPointing ? 9 + Math.sin(time / 80) * 2.5 : 5;
            ctx.arc(idxPt.x, idxPt.y, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = hand.isIndexPointing ? currentActiveColor : 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = hand.isIndexPointing ? 2.6 : 1.2;
            ctx.shadowColor = currentActiveColor;
            ctx.shadowBlur = hand.isIndexPointing ? 16 : 4;
            ctx.stroke();

            // Star tip on index finger when pointing
            if (hand.isIndexPointing) {
              drawMagicStar(ctx, idxPt.x, idxPt.y, 8, time / 300, currentActiveColor, 0.9);
            }
          }

          ctx.restore();
        });
      }

      // 5. Draw Air Drawing Strokes (Safe Filter against nulls)
      const safeStrokes = (currentStrokes || []).filter(
        (s): s is Stroke => !!s && Array.isArray(s.pts) && s.pts.length > 0
      );
      const allStrokes = [...safeStrokes];
      if (
        currentActiveStroke &&
        Array.isArray(currentActiveStroke.pts) &&
        currentActiveStroke.pts.length > 0
      ) {
        allStrokes.push(currentActiveStroke);
      }

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      allStrokes.forEach((st) => {
        if (!st || !Array.isArray(st.pts) || st.pts.length < 2) return;
        const pts = st.pts;

        const strokeColor = st.isRainbow
          ? `hsl(${(time / 15) % 360}, 100%, 65%)`
          : st.color || '#00f0ff';

        if (st.effect === 'fire') {
          ctx.shadowColor = '#ff6600';
          ctx.shadowBlur = 18;
        } else if (st.effect === 'frost') {
          ctx.shadowColor = '#00d0ff';
          ctx.shadowBlur = 14;
        } else {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = 14;
        }

        // Smooth continuous path
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

        // Outer glowing ribbon
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = (st.width || 4.5) * (currentIsFrozen ? 1.25 : 1);
        ctx.globalAlpha = currentIsFrozen ? 0.95 : 0.88;
        ctx.stroke();

        // White hot inner core
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.3, (st.width || 4.5) * 0.32);
        ctx.globalAlpha = 0.95;
        ctx.stroke();
      });
      ctx.restore();

      // 6. Draw Ephemeral Magical Particles (Stars & Stardust)
      // Fast fade out so nothing gets stuck on screen ("keyin yana yo'q bo'lib qolsin o'sha zahoti")
      const particles = particlesRef.current;
      ctx.save();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= p.decay;
        if (p.rotation !== undefined && p.vRot !== undefined) {
          p.rotation += p.vRot;
        }

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        if (p.type === 'star') {
          drawMagicStar(ctx, p.x, p.y, p.size * p.life, p.rotation || 0, p.color, p.life);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.85;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      }
      ctx.restore();

      // 7. Spawn stars trailing the active finger stroke
      if (
        currentActiveStroke &&
        Array.isArray(currentActiveStroke.pts) &&
        currentActiveStroke.pts.length > 0
      ) {
        const lastPt = currentActiveStroke.pts[currentActiveStroke.pts.length - 1];
        if (lastPt && Math.random() < 0.7) {
          spawnMagicParticles(lastPt.x, lastPt.y, 2, currentActiveColor, currentEffect, 0.8);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full block touch-none z-10"
    />
  );
};
