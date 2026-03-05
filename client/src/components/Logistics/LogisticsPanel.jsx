import React, { useState } from 'react';

export default function LogisticsPanel({ accessPoints, timeWindows, onAddTimeWindow, onDeleteTimeWindow }) {
  const [expanded, setExpanded] = useState(false);
  const [area, setArea] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleAddTW = () => {
    if (!area.trim() || !start || !end) return;
    onAddTimeWindow({ area: area.trim(), start, end });
    setArea('');
    setStart('');
    setEnd('');
  };

  const inputStyle = {
    padding: '3px 6px', fontSize: 11, background: '#0f172a', color: '#e2e8f0',
    border: '1px solid #334155', borderRadius: 4, boxSizing: 'border-box',
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
          fontSize: 11, padding: 0, fontWeight: 600,
        }}
      >
        {expanded ? '\u25BE' : '\u25B8'} Logistics ({accessPoints.length} access pts, {timeWindows.length} windows)
      </button>
      {expanded && (
        <div style={{ marginTop: 8 }}>
          {accessPoints.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Access Points</div>
              {accessPoints.map((ap) => (
                <div key={ap.id} style={{ fontSize: 11, color: '#e2e8f0', marginBottom: 2 }}>
                  {ap.label} ({ap.lat.toFixed(5)}, {ap.lng.toFixed(5)})
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Time Windows</div>
          {timeWindows.map((tw) => (
            <div key={tw.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11,
            }}>
              <span style={{ color: '#e2e8f0' }}>{tw.area}: {tw.start} - {tw.end}</span>
              <button
                onClick={() => onDeleteTimeWindow(tw.id)}
                style={{
                  background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                  fontSize: 10, padding: 0,
                }}
              >
                x
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Area (e.g. A, B)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={{ ...inputStyle, width: 80 }}
            />
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{ ...inputStyle, width: 90 }}
            />
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{ ...inputStyle, width: 90 }}
            />
            <button
              onClick={handleAddTW}
              disabled={!area.trim() || !start || !end}
              style={{
                padding: '3px 8px', fontSize: 10, background: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
