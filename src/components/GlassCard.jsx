// src/components/GlassCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function GlassCard({ children, className = '', glow = null, animate = false, style = {}, onClick }) {
  const glowClass = glow ? `glow-${glow}` : '';
  const Comp = animate ? motion.div : 'div';
  const motionProps = animate ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } } : {};

  return (
    <Comp
      {...motionProps}
      className={clsx('glass', glowClass, className)}
      style={{ padding: 24, ...style }}
      onClick={onClick}
    >
      {children}
    </Comp>
  );
}
