// src/components/SkeletonLoader.jsx
import React from 'react';

export function SkeletonLine({ width = '100%', height = 16, style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 6, ...style }} />;
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonLine width="60%" height={20} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? '90%' : '75%'} />
      ))}
    </div>
  );
}

export default function SkeletonLoader({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
