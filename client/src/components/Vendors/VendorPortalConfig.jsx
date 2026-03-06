import React, { useState, useCallback, useMemo } from 'react';
import { enableVendorPortal, disableVendorPortal, updatePortalConfig } from '../../api/index.js';

const inputStyle = {
  width: '100%', padding: '5px 8px', fontSize: 12,
  background: '#16213e', color: '#e2e8f0', border: '1px solid #334155',
  borderRadius: 4, boxSizing: 'border-box', marginBottom: 6,
};

export default function VendorPortalConfig({ eventId, vendors, portalConfig, onConfigChange }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [instructions, setInstructions] = useState(portalConfig?.instructions || '');
  const [maxSpotChoices, setMaxSpotChoices] = useState(portalConfig?.maxSpotChoices || 3);
  const [deadline, setDeadline] = useState(portalConfig?.signupDeadline ? new Date(portalConfig.signupDeadline).toISOString().slice(0, 10) : '');

  const isEnabled = portalConfig?.enabled;
  const inviteToken = portalConfig?.inviteToken;

  // Count vendors by status
  const statusCounts = useMemo(() => {
    const counts = { applied: 0, approved: 0, waitlisted: 0, assigned: 0, canceled: 0 };
    (vendors || []).forEach((v) => {
      const s = v.status || 'approved';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [vendors]);

  const handleToggle = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      if (isEnabled) {
        await disableVendorPortal(eventId);
        onConfigChange?.({ ...portalConfig, enabled: false });
      } else {
        const result = await enableVendorPortal(eventId, { maxSpotChoices, instructions, signupDeadline: deadline || null });
        onConfigChange?.({ ...portalConfig, enabled: true, inviteToken: result.inviteToken });
      }
    } catch (err) {
      console.error('Portal toggle error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, isEnabled, portalConfig, onConfigChange, maxSpotChoices, instructions, deadline]);

  const handleSaveConfig = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      await updatePortalConfig(eventId, {
        maxSpotChoices,
        instructions,
        signupDeadline: deadline || null,
      });
      onConfigChange?.({ ...portalConfig, maxSpotChoices, instructions, signupDeadline: deadline || null });
    } catch (err) {
      console.error('Config save error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, maxSpotChoices, instructions, deadline, portalConfig, onConfigChange]);

  const handleCopyLink = useCallback(async () => {
    if (!inviteToken) return;
    const url = `${window.location.origin}/vendor/${inviteToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteToken]);

  if (!eventId) {
    return <div style={{ fontSize: 12, color: '#64748b' }}>Create an event first to enable vendor portal.</div>;
  }

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Vendor Portal</span>
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: 'none', cursor: 'pointer',
            background: isEnabled ? '#ef4444' : '#22c55e',
            color: '#fff',
          }}
        >
          {loading ? '...' : isEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Invite link */}
      {isEnabled && inviteToken && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Invite Link</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              readOnly
              value={`${window.location.origin}/vendor/${inviteToken}`}
              style={{ ...inputStyle, flex: 1, marginBottom: 0, fontSize: 10 }}
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={handleCopyLink}
              style={{
                padding: '4px 10px', fontSize: 10, fontWeight: 600,
                background: copied ? '#22c55e' : '#3b82f6', color: '#fff',
                border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Config */}
      {isEnabled && (
        <>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>Max Spot Choices</label>
            <input
              type="number" min={1} max={10}
              value={maxSpotChoices}
              onChange={(e) => setMaxSpotChoices(parseInt(e.target.value) || 3)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>Signup Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Welcome message, rules, what to bring..."
            />
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={loading}
            style={{
              width: '100%', padding: '5px 0', fontSize: 11, fontWeight: 600,
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4,
              cursor: 'pointer', marginBottom: 8,
            }}
          >
            Save Portal Settings
          </button>

          {/* Status counts */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {Object.entries(statusCounts).filter(([, c]) => c > 0).map(([status, count]) => (
              <span key={status} style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                background: status === 'applied' ? '#3b82f6' : status === 'approved' ? '#22c55e' : status === 'waitlisted' ? '#eab308' : status === 'assigned' ? '#7c3aed' : '#ef4444',
                color: '#fff', fontWeight: 600,
              }}>
                {count} {status}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
