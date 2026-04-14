// src/components/CircularTimer.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZE = 160;
const R = 60;
const CIRC = 2 * Math.PI * R;

export default function CircularTimer({ startTime, duration, onExpire, size = SIZE }) {
  const [remaining, setRemaining] = useState(duration);
  const scale = size / SIZE;

  useEffect(() => {
    if (!startTime) { setRemaining(duration); return; }

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      if (left <= 0 && onExpire) onExpire();
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [startTime, duration, onExpire]);

  const pct = duration > 0 ? remaining / duration : 0;
  const offset = CIRC * (1 - pct);

  // Color: green > yellow > red
  const color = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  const glowColor = pct > 0.5 ? 'rgba(16,185,129,0.6)' : pct > 0.25 ? 'rgba(245,158,11,0.6)' : 'rgba(239,68,68,0.6)';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        {/* Track */}
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        {/* Progress */}
        <motion.circle
          cx={SIZE/2} cy={SIZE/2} r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          filter={`drop-shadow(0 0 8px ${glowColor})`}
          animate={{ strokeDashoffset: offset, stroke: color }}
          transition={{ duration: 0.2 }}
        />
      </svg>
      {/* Number */}
      <AnimatePresence mode="wait">
        <motion.div
          key={Math.ceil(remaining)}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ textAlign: 'center', zIndex: 1 }}
        >
          <div style={{ fontSize: size * 0.3, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
            {Math.ceil(remaining)}
          </div>
          <div style={{ fontSize: size * 0.1, color: '#64748b', fontWeight: 500 }}>sec</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
