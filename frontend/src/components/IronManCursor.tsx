'use client';

import React, { useEffect, useState, useRef } from 'react';

export const IronManCursor: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Only activate on devices with fine pointer and no reduced-motion preference
    if (
      typeof window === 'undefined' ||
      !window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = !!target.closest(
          'button, a, input, textarea, [role="button"], .interactive-token, select, label'
        );
        setIsHovering(isInteractive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    let animationFrameId: number;
    const updateCursor = () => {
      // Smooth lerp follow for outer ring
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.22;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(updateCursor);
    };

    animationFrameId = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!mounted || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Central Arc Core Laser Dot */}
      <div
        ref={dotRef}
        className={`absolute -left-1 -top-1 h-2 w-2 rounded-full transition-all duration-75 ease-out ${
          isHovering
            ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
            : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
        }`}
      />

      {/* Holographic HUD Reticle Ring with Crosshair Ticks */}
      <div
        ref={ringRef}
        className={`absolute -left-5 -top-5 flex items-center justify-center rounded-full transition-all duration-150 ease-out ${
          isClicking
            ? 'h-8 w-8 scale-90 border-2 border-rose-500 shadow-[0_0_20px_#f43f5e]'
            : isHovering
            ? 'h-14 w-14 -left-7 -top-7 border border-dashed border-amber-400/90 shadow-[0_0_20px_rgba(251,191,36,0.35)] rotate-45'
            : 'h-10 w-10 border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
        }`}
      >
        {/* Reticle 4 Crosshair Corner Ticks */}
        <div className="absolute top-0 h-1.5 w-0.5 bg-cyan-400/80" />
        <div className="absolute bottom-0 h-1.5 w-0.5 bg-cyan-400/80" />
        <div className="absolute left-0 h-0.5 w-1.5 bg-cyan-400/80" />
        <div className="absolute right-0 h-0.5 w-1.5 bg-cyan-400/80" />
      </div>
    </div>
  );
};
