'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseTransitionProps {
  children: ReactNode;
  questionKey: string | number;
  direction?: 'forward' | 'backward';
  className?: string;
}

export const ExerciseTransition: React.FC<ExerciseTransitionProps> = ({
  children,
  questionKey,
  direction = 'forward',
  className = '',
}) => {
  const xOffset = direction === 'forward' ? 24 : -24;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionKey}
        initial={{ opacity: 0, x: xOffset, filter: 'blur(4px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: -xOffset, filter: 'blur(4px)' }}
        transition={{
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`w-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
