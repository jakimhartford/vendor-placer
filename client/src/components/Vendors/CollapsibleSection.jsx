import React, { useState } from 'react';

export default function CollapsibleSection({ title, children, defaultOpen = true, dataTour }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="sidebar-section" data-tour={dataTour}>
      <h3
        onClick={() => setOpen((v) => !v)}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 10, lineHeight: 1, transition: 'transform 0.15s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        {title}
      </h3>
      {open && children}
    </div>
  );
}
