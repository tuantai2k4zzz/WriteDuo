'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useLearningStore } from '../lib/store';

export const IronManCursor: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorState, setCursorState] = useState<'idle' | 'hover' | 'correct' | 'incorrect'>('idle');
  const [isVisible, setIsVisible] = useState(false);

  const { isEvaluating } = useLearningStore();

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

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

    // Listen to telemetry events for contextual pulses (correct / incorrect)
    const handleTelemetry = (e: any) => {
      const type = e.detail?.type;
      if (type === 'answer_correct') {
        setCursorState('correct');
        setTimeout(() => setCursorState('idle'), 1200);
      } else if (type === 'answer_incorrect') {
        setCursorState('incorrect');
        setTimeout(() => setCursorState('idle'), 1200);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('vspeak:telemetry', handleTelemetry);
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

      if (bracketRef.current) {
        bracketRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(updateCursor);
    };

    animationFrameId = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('vspeak:telemetry', handleTelemetry);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!mounted || !isVisible) return null;

  const isThinking = isEvaluating;
  const isCorrect = cursorState === 'correct';
  const isIncorrect = cursorState === 'incorrect';

  // Dynamic colors
  const primaryColor = isCorrect
    ? '#10b981'
    : isIncorrect
    ? '#f43f5e'
    : isHovering
    ? '#f59e0b'
    : '#06b6d4';

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Central Core Laser Dot */}
      <div
        ref={dotRef}
        className="absolute -left-1 -top-1 h-2 w-2 rounded-full transition-all duration-100 ease-out"
        style={{
          background: primaryColor,
          boxShadow: `0 0 14px ${primaryColor}`,
        }}
      />

      {/* Holographic Reticle Ring */}
      <div
        ref={ringRef}
        className={`absolute -left-5 -top-5 flex items-center justify-center rounded-full transition-all duration-150 ease-out ${
          isThinking
            ? 'h-12 w-12 -left-6 -top-6 animate-spin border-2 border-dashed border-cyan-400'
            : isClicking
            ? 'h-8 w-8 scale-90 border-2'
            : isHovering
            ? 'h-14 w-14 -left-7 -top-7 border border-dashed rotate-45'
            : 'h-10 w-10 border'
        }`}
        style={{
          borderColor: primaryColor,
          boxShadow: `0 0 16px ${primaryColor}40`,
        }}
      >
        {/* Reticle 4 Crosshair Corner Ticks */}
        <div className="absolute top-0 h-1.5 w-0.5" style={{ background: primaryColor }} />
        <div className="absolute bottom-0 h-1.5 w-0.5" style={{ background: primaryColor }} />
        <div className="absolute left-0 h-0.5 w-1.5" style={{ background: primaryColor }} />
        <div className="absolute right-0 h-0.5 w-1.5" style={{ background: primaryColor }} />
      </div>

      {/* Interactive Cyber Brackets when Hovering */}
      {isHovering && !isThinking && (
        <div
          ref={bracketRef}
          className="absolute -left-9 -top-9 h-18 w-18 transition-all duration-75"
        >
          <div className="absolute top-0 left-0 h-2 w-2 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-0 right-0 h-2 w-2 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-amber-400" />
        </div>
      )}
    </div>
  );
};
