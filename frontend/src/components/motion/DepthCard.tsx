'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface DepthCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'blue';
  disableTilt?: boolean;
}

export const DepthCard: React.FC<DepthCardProps> = ({
  children,
  className = '',
  onClick,
  glowColor = 'cyan',
  disableTilt = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [canTilt, setCanTilt] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coordinate motion values normalized to [-1, 1]
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for rotation
  const springConfig = { damping: 25, stiffness: 260 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);

  // Light flare position percentage
  const lightX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const lightY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCanTilt(isFinePointer && !isReduced && !disableTilt);
  }, [disableTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const glowStyles = {
    cyan: 'hover:border-cyan-400/50 hover:shadow-[0_12px_36px_rgba(6,182,212,0.18)] dark:hover:shadow-[0_12px_36px_rgba(6,182,212,0.15)]',
    violet: 'hover:border-violet-400/50 hover:shadow-[0_12px_36px_rgba(139,92,246,0.18)] dark:hover:shadow-[0_12px_36px_rgba(139,92,246,0.15)]',
    amber: 'hover:border-amber-400/50 hover:shadow-[0_12px_36px_rgba(245,158,11,0.18)] dark:hover:shadow-[0_12px_36px_rgba(245,158,11,0.15)]',
    emerald: 'hover:border-emerald-400/50 hover:shadow-[0_12px_36px_rgba(16,185,129,0.18)] dark:hover:shadow-[0_12px_36px_rgba(16,185,129,0.15)]',
    blue: 'hover:border-blue-400/50 hover:shadow-[0_12px_36px_rgba(59,130,246,0.18)] dark:hover:shadow-[0_12px_36px_rgba(59,130,246,0.15)]',
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative transform-gpu"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          rotateX: canTilt ? rotateX : 0,
          rotateY: canTilt ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        whileTap={{ scale: 0.985 }}
        whileHover={!canTilt ? { y: -3 } : undefined}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className={`group relative overflow-hidden rounded-2xl transition-all duration-200 border border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-[#070d1a]/90 backdrop-blur-xl ${glowStyles[glowColor]} ${className}`}
      >
        {/* Dynamic Specular Light Flare (Follows Mouse Cursor on Desktop) */}
        {canTilt && isHovered && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 dark:opacity-40 transition-opacity duration-300"
            style={{
              background: `radial-gradient(400px circle at ${lightX.get()}% ${lightY.get()}%, rgba(255,255,255,0.45), transparent 60%)`,
            }}
          />
        )}

        {/* Content with 3D Depth Layer */}
        <div style={{ transform: canTilt ? 'translateZ(12px)' : 'none' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};
