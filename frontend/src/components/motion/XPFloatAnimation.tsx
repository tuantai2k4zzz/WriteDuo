'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface XPFloatAnimationProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
}

export const XPFloatAnimation: React.FC<XPFloatAnimationProps> = ({
  amount,
  show,
  onComplete,
}) => {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.7 }}
          animate={{ opacity: 1, y: -45, scale: 1.15 }}
          exit={{ opacity: 0, y: -70, scale: 0.9 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="pointer-events-none absolute z-50 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3.5 py-1 text-xs font-mono font-black text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>+{amount} XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
