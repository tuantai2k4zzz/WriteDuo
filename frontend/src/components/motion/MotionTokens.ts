/**
 * LearnEN Next-Gen Learning OS 2026
 * Motion Design Tokens & 3D Physics System
 * Principles: Fast, Lightweight, GPU-accelerated (transform & opacity only), Reduced-Motion Friendly
 */

export const motionTokens = {
  // Durations (in seconds for Framer Motion)
  duration: {
    instant: 0.1,
    fast: 0.18,
    normal: 0.28,
    smooth: 0.38,
    relaxed: 0.55,
  },

  // Easing Curves
  easing: {
    easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
    smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    snappy: [0.4, 0, 0.2, 1] as [number, number, number, number],
    anticipate: [0.38, 0.04, 0.2, 1.25] as [number, number, number, number],
  },

  // Framer Motion Springs
  spring: {
    snappy: { type: 'spring' as const, stiffness: 420, damping: 28 },
    bouncy: { type: 'spring' as const, stiffness: 340, damping: 22 },
    gentle: { type: 'spring' as const, stiffness: 200, damping: 24 },
    tilt: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },

  // 3D Depth Presets
  depth: {
    flat: 'shadow-none',
    raised: 'shadow-sm hover:shadow-md transition-shadow',
    floating: 'shadow-lg hover:shadow-xl transition-all',
    hero: 'shadow-[0_20px_50px_rgba(6,182,212,0.15)] dark:shadow-[0_20px_50px_rgba(6,182,212,0.1)]',
  },

  // Magnetic Pull limit (pixels)
  magnetic: {
    maxOffset: 6, // 4-8px maximum pull
    threshold: 80, // Distance to start magnetic effect
  },

  // 3D Card Tilt Limits
  tilt: {
    maxRotateX: 8, // Degrees
    maxRotateY: 8, // Degrees
  },
};
