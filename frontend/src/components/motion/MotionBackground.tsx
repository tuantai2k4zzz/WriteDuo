'use client';

import React from 'react';

export const MotionBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      {/* Subtle Dynamic Ambient Lighting Orbs */}
      <div
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 dark:opacity-20 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(59,130,246,0.2) 60%, transparent 80%)',
        }}
      />
      <div
        className="absolute top-[40%] -right-[15%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[450px] rounded-full blur-[140px] opacity-15 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
