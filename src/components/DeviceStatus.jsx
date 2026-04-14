// src/components/DeviceStatus.jsx
import React from 'react';
import useQuizStore from '../store/useQuizStore';

const OFFLINE_THRESHOLD = 15000; // 15 seconds

export default function DeviceStatus() {
  const { devices } = useQuizStore();
  const entries = Object.entries(devices);

  if (entries.length === 0) {
    return (
      <div className="glass" style={{ padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 13 }}>No ESP32 devices registered yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(([id, d]) => {
        const online = d.online && (Date.now() - d.lastSeen) < OFFLINE_THRESHOLD;
        return (
          <div key={id} className="glass" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📟</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#f8fafc', fontFamily: 'monospace' }}>{id}</span>
            </div>
            <span className={`badge badge-${online ? 'green' : 'red'}`}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: online ? '#10b981' : '#ef4444', display: 'inline-block' }} />
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
