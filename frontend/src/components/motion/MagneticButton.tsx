'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { motion, useSpring } from 'framer-motion';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  pullStrength?: number; // Max offset in pixels (default: 5px)
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  pullStrength = 5,
  onClick,
  disabled,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [canMagnetic, setCanMagnetic] = useState(false);

  const springConfig = { damping: 20, stiffness: 300 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCanMagnetic(isFinePointer && !isReduced);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!canMagnetic || disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    x.set(Math.max(-pullStrength, Math.min(pullStrength, deltaX * pullStrength)));
    y.set(Math.max(-pullStrength, Math.min(pullStrength, deltaY * pullStrength)));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      style={{
        x: canMagnetic ? x : 0,
        y: canMagnetic ? y : 0,
      }}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};
