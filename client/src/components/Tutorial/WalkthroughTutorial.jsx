import React, { useState, useEffect, useCallback } from 'react';

const STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to Vendor Placer!',
    body: "Let's walk through the basics of placing vendors at your event.",
    position: 'center',
  },
  {
    id: 'upload-vendors',
    target: '[data-tour="upload-vendors"]',
    title: 'Upload Vendors',
    body: 'Start by loading your vendor data. Upload a CSV file, paste data directly, or try a demo dataset.',
    position: 'right',
  },
  {
    id: 'vendor-table',
    target: '[data-tour="vendors"]',
    title: 'Manage Vendors',
    body: 'View all your vendors, edit their details, set tiers and categories. Use the status column to manage approvals from the vendor portal.',
    position: 'right',
  },
  {
    id: 'draw-street',
    target: '[data-tour="draw-street"]',
    title: 'Draw Streets',
    body: 'Click "Draw Street" then click on the map to draw a line where vendor booths will go. Double-click to finish.',
    position: 'right',
  },
  {
    id: 'place-spot',
    target: '[data-tour="place-spot"]',
    title: 'Place Individual Spots',
    body: 'Or click "Place Spot" to add single vendor spots by clicking on the map.',
    position: 'right',
  },
  {
    id: 'edit-spots',
    target: '[data-tour="map-area"]',
    title: 'Edit Spots',
    body: 'Click any spot on the map to edit its properties — set it as premium, restrict categories or tiers, and more.',
    position: 'left',
  },
  {
    id: 'dead-zones',
    target: '[data-tour="dead-zones"]',
    title: 'Dead Zones & Amenities',
    body: 'Expand "Zones & Amenities" to draw dead zones (areas where no spots can go), place amenities like power or water, and mark access points for logistics.',
    position: 'right',
  },
  {
    id: 'map-zones',
    target: '[data-tour="map-zones"]',
    title: 'Map Zones',
    body: 'Draw barricades, fencing, and other zone overlays. These are visual elements that help communicate the layout to your team.',
    position: 'right',
  },
  {
    id: 'location-search',
    target: '[data-tour="location-search"]',
    title: 'Location Search',
    body: 'Use the search bar to find and fly to any location on the map.',
    position: 'bottom',
  },
  {
    id: 'run-placement',
    target: '[data-tour="run-placement"]',
    title: 'Run Placement',
    body: 'Once you have vendors and spots, click "Run Placement" to automatically assign vendors to spots based on tier, restrictions, and adjacency rules.',
    position: 'right',
  },
  {
    id: 'results-export',
    target: '[data-tour="export-pdf"]',
    title: 'Results & Export',
    body: 'After placement, view stats on how vendors were assigned. Export your layout as a PDF to share with your team.',
    position: 'right',
  },
  {
    id: 'pricing-revenue',
    target: '[data-tour="pricing-revenue"]',
    title: 'Pricing & Revenue',
    body: 'Set booth pricing by tier and category, then see a revenue summary based on your current placement.',
    position: 'right',
  },
  {
    id: 'logistics',
    target: '[data-tour="logistics"]',
    title: 'Logistics',
    body: 'Manage load-in/load-out time windows and see how access points connect to vendor spots for smooth event setup.',
    position: 'right',
  },
  {
    id: 'vendor-portal',
    target: '[data-tour="vendor-portal"]',
    title: 'Vendor Portal',
    body: 'Enable self-service registration for vendors. They can apply, pick preferred spots, and track their status via a unique invite link.',
    position: 'right',
  },
  {
    id: 'project-bar',
    target: '[data-tour="project-bar"]',
    title: 'Save & Projects',
    body: 'Save your layout as a project, create versions, and switch to check-in view on event day. Load existing projects anytime.',
    position: 'right',
  },
  {
    id: 'done',
    target: null,
    title: "You're all set!",
    body: 'You can restart this tutorial anytime from the "?" button, or visit the Help Center for detailed documentation.',
    position: 'center',
  },
];

const STORAGE_KEY = 'vendorPlacer_tutorialComplete';

function getTargetRect(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export default function WalkthroughTutorial({ active, onComplete }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const currentStep = STEPS[step];

  // Update target rect on step change and on resize
  const updateRect = useCallback(() => {
    if (!active) return;
    const rect = getTargetRect(currentStep?.target);
    setTargetRect(rect);
  }, [active, currentStep]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  // Re-measure after a short delay (for dynamic elements)
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(updateRect, 300);
    return () => clearTimeout(t);
  }, [step, active, updateRect]);

  if (!active) return null;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setStep(0);
    onComplete();
  };

  const isCentered = currentStep.position === 'center' || !targetRect;
  const padding = 8;

  // Compute tooltip position
  let tooltipStyle = {};
  if (isCentered) {
    tooltipStyle = {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', maxWidth: 400,
    };
  } else {
    const r = targetRect;
    const pos = currentStep.position;
    if (pos === 'right') {
      tooltipStyle = {
        position: 'fixed', top: r.top + r.height / 2, left: r.right + 16,
        transform: 'translateY(-50%)', maxWidth: 300,
      };
    } else if (pos === 'left') {
      tooltipStyle = {
        position: 'fixed', top: r.top + r.height / 2, right: window.innerWidth - r.left + 16,
        transform: 'translateY(-50%)', maxWidth: 300,
      };
    } else if (pos === 'bottom') {
      tooltipStyle = {
        position: 'fixed', top: r.bottom + 16, left: r.left + r.width / 2,
        transform: 'translateX(-50%)', maxWidth: 300,
      };
    } else {
      tooltipStyle = {
        position: 'fixed', bottom: window.innerHeight - r.top + 16, left: r.left + r.width / 2,
        transform: 'translateX(-50%)', maxWidth: 300,
      };
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      {/* Dark overlay with cutout */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="6"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight border */}
      {targetRect && (
        <div style={{
          position: 'fixed',
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          border: '2px solid #3b82f6',
          borderRadius: 6,
          pointerEvents: 'none',
          boxShadow: '0 0 0 4px rgba(59,130,246,0.3)',
        }} />
      )}

      {/* Tooltip */}
      <div style={{
        ...tooltipStyle,
        background: '#1e293b',
        color: '#e2e8f0',
        borderRadius: 8,
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid #334155',
        zIndex: 10001,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{currentStep.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14, color: '#cbd5e1' }}>{currentStep.body}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {step + 1} / {STEPS.length}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={finish}
              style={{
                padding: '5px 12px', fontSize: 12, border: '1px solid #475569',
                borderRadius: 4, background: 'transparent', color: '#94a3b8', cursor: 'pointer',
              }}
            >
              Skip
            </button>
            {step > 0 && (
              <button
                onClick={handleBack}
                style={{
                  padding: '5px 12px', fontSize: 12, border: '1px solid #475569',
                  borderRadius: 4, background: 'transparent', color: '#e2e8f0', cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                padding: '5px 14px', fontSize: 12, border: 'none',
                borderRadius: 4, background: '#3b82f6', color: '#fff',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              {step === STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { STORAGE_KEY };
