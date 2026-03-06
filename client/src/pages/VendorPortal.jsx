import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchPortalInfo, applyToPortal, fetchVendorStatus, updateVendorProfile, cancelVendorApplication } from '../api/index.js';

const DEFAULT_CATEGORIES = ['food', 'art', 'craft', 'jewelry', 'clothing', 'services', 'other'];

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 14,
  border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box',
  marginBottom: 8, color: '#1e293b', background: '#fff',
};

const btnStyle = {
  padding: '10px 20px', fontSize: 14, fontWeight: 600,
  border: 'none', borderRadius: 6, cursor: 'pointer',
};

function SpotPicker({ spots, selected, maxChoices, onChange }) {
  if (!spots?.length) return null;

  const toggle = (spotId) => {
    if (selected.includes(spotId)) {
      onChange(selected.filter((s) => s !== spotId));
    } else if (selected.length < maxChoices) {
      onChange([...selected, spotId]);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>
        Preferred Spots (pick up to {maxChoices})
      </label>
      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8 }}>
        {spots.map((s) => {
          const isSelected = selected.includes(s.id);
          return (
            <div
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                padding: '6px 10px', marginBottom: 4, borderRadius: 4, cursor: 'pointer',
                background: isSelected ? '#dbeafe' : '#f8fafc',
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {s.valueScore != null && `Score: ${s.valueScore}`}
                {s.isCorner && ' | Corner'}
                {s.premium && ' | Premium'}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
        {selected.length} of {maxChoices} selected. These are preferences, not guarantees.
      </div>
    </div>
  );
}

function InfoSectionsDisplay({ sections }) {
  const [expanded, setExpanded] = useState({});
  const filled = (sections || []).filter((s) => s.content && s.content.trim());
  if (!filled.length) return null;

  return (
    <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {filled.map((section) => (
        <div key={section.key} style={{
          background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
            style={{
              width: '100%', padding: '12px 16px', background: 'none', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: '#1e293b',
            }}
          >
            <span>{section.title}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {expanded[section.key] ? '\u25B2' : '\u25BC'}
            </span>
          </button>
          {expanded[section.key] && (
            <div style={{
              padding: '0 16px 14px', fontSize: 14, color: '#334155',
              whiteSpace: 'pre-wrap', lineHeight: 1.6,
            }}>
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function VendorPortal() {
  const { inviteToken } = useParams();
  const [searchParams] = useSearchParams();
  const [portalInfo, setPortalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Returning vendor state — check URL token param first, then localStorage
  const [vendorData, setVendorData] = useState(null);
  const [vendorToken, setVendorToken] = useState(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      localStorage.setItem(`vt_${inviteToken}`, urlToken);
      return urlToken;
    }
    return localStorage.getItem(`vt_${inviteToken}`) || null;
  });

  // Form state
  const [form, setForm] = useState({
    name: '', category: 'food', email: '', phone: '',
    businessName: '', description: '', boothSize: 1,
    powerNeeds: '', setupRequirements: '', spotPreferences: [],
  });

  const [confirmCancel, setConfirmCancel] = useState(false);

  // Load portal info
  useEffect(() => {
    setLoading(true);
    fetchPortalInfo(inviteToken)
      .then((data) => { setPortalInfo(data); setError(null); })
      .catch((err) => setError(err.response?.data?.error || 'Portal not found'))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  // If returning vendor, load status
  useEffect(() => {
    if (!vendorToken) return;
    fetchVendorStatus(vendorToken)
      .then((data) => {
        setVendorData(data);
        // Pre-fill form from vendor data
        const v = data.vendor;
        setForm((f) => ({
          ...f,
          name: v.name || f.name, category: v.category || f.category,
          email: v.email || f.email, phone: v.phone || f.phone,
          businessName: v.businessName || f.businessName,
          description: v.description || f.description,
          boothSize: v.boothSize || f.boothSize,
          powerNeeds: v.powerNeeds || f.powerNeeds,
          setupRequirements: v.setupRequirements || f.setupRequirements,
          spotPreferences: v.spotPreferences || f.spotPreferences,
        }));
      })
      .catch(() => {
        // Token expired or invalid, clear it
        localStorage.removeItem(`vt_${inviteToken}`);
        setVendorToken(null);
      });
  }, [vendorToken, inviteToken]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await applyToPortal(inviteToken, form);
      localStorage.setItem(`vt_${inviteToken}`, result.vendorToken);
      setVendorToken(result.vendorToken);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  }, [inviteToken, form]);

  const handleUpdate = useCallback(async () => {
    if (!vendorToken) return;
    try {
      setLoading(true);
      await updateVendorProfile(vendorToken, form);
      const data = await fetchVendorStatus(vendorToken);
      setVendorData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  }, [vendorToken, form]);

  const handleCancel = useCallback(async () => {
    if (!vendorToken) return;
    try {
      setLoading(true);
      await cancelVendorApplication(vendorToken, 'Vendor canceled');
      const data = await fetchVendorStatus(vendorToken);
      setVendorData(data);
      setConfirmCancel(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  }, [vendorToken]);

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  if (loading && !portalInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  if (error && !portalInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#ef4444', fontSize: 16 }}>{error}</div>
      </div>
    );
  }

  const STATUS_COLORS = {
    applied: '#3b82f6', approved: '#22c55e', waitlisted: '#eab308',
    assigned: '#7c3aed', checked_in: '#059669', canceled: '#ef4444',
  };

  // ── RETURNING VENDOR VIEW ──
  if (vendorData && !submitted) {
    const v = vendorData.vendor;
    const setup = vendorData.setupInfo;
    const isCanceled = v.status === 'canceled';

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, marginBottom: 4, color: '#0f172a' }}>{vendorData.projectName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, color: '#fff',
              background: STATUS_COLORS[v.status] || '#64748b', textTransform: 'uppercase',
            }}>
              {v.status}
            </span>
            <span style={{ color: '#64748b', fontSize: 13 }}>Applied {new Date(v.appliedAt).toLocaleDateString()}</span>
          </div>

          {/* Setup info for assigned vendors */}
          {setup?.spotLabel && (
            <div style={{ background: '#ecfdf5', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #a7f3d0' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Your Assignment</div>
              <div style={{ fontSize: 14 }}>Spot: <strong>{setup.spotLabel}</strong></div>
              {setup.nearestAccessPoint && (
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  Nearest entrance: {setup.nearestAccessPoint.label} ({setup.nearestAccessPoint.distanceMeters}m)
                  {setup.nearestAccessPoint.vehicleAccess && ' — Vehicle access available'}
                </div>
              )}
              {setup.timeWindows?.length > 0 && (
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  Setup window: {setup.timeWindows.map((tw) => `${tw.start} - ${tw.end}`).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Edit form (if not canceled) */}
          {!isCanceled && (
            <>
              <h2 style={{ fontSize: 18, marginBottom: 12 }}>Your Profile</h2>
              <input value={form.name} onChange={updateField('name')} placeholder="Name" style={inputStyle} />
              <input value={form.email} onChange={updateField('email')} placeholder="Email" style={inputStyle} />
              <input value={form.phone} onChange={updateField('phone')} placeholder="Phone" style={inputStyle} />
              <input value={form.businessName} onChange={updateField('businessName')} placeholder="Business Name" style={inputStyle} />
              <textarea value={form.description} onChange={updateField('description')} placeholder="Description" rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} />

              {portalInfo?.mapReady && portalInfo.availableSpots?.length > 0 && (
                <SpotPicker
                  spots={portalInfo.availableSpots}
                  selected={form.spotPreferences}
                  maxChoices={portalInfo.maxSpotChoices || 3}
                  onChange={(prefs) => setForm((f) => ({ ...f, spotPreferences: prefs }))}
                />
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={handleUpdate} disabled={loading}
                  style={{ ...btnStyle, background: '#3b82f6', color: '#fff', flex: 1 }}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                {!confirmCancel ? (
                  <button onClick={() => setConfirmCancel(true)}
                    style={{ ...btnStyle, background: '#ef4444', color: '#fff' }}>
                    Cancel Application
                  </button>
                ) : (
                  <button onClick={handleCancel}
                    style={{ ...btnStyle, background: '#991b1b', color: '#fff' }}>
                    Confirm Cancel
                  </button>
                )}
              </div>
            </>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    );
  }

  // ── SUCCESS VIEW ──
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, color: '#22c55e', marginBottom: 8 }}>Application Submitted!</h1>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 20 }}>
            Your application for <strong>{portalInfo?.projectName}</strong> has been submitted.
            The organizer will review it. You can return to this page to check your status.
          </p>
          <button
            onClick={() => { setSubmitted(false); window.location.reload(); }}
            style={{ ...btnStyle, background: '#3b82f6', color: '#fff' }}
          >
            View Status
          </button>
        </div>
      </div>
    );
  }

  // ── APPLICATION FORM ──
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, marginBottom: 4, color: '#0f172a' }}>{portalInfo?.projectName}</h1>
        <p style={{ color: '#475569', fontSize: 14, marginBottom: 20 }}>Vendor Application</p>

        {portalInfo?.instructions && (
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: 16, marginBottom: 20, fontSize: 14, color: '#1e40af', border: '1px solid #bfdbfe' }}>
            {portalInfo.instructions}
          </div>
        )}

        <InfoSectionsDisplay sections={portalInfo?.infoSections} />

        {portalInfo?.fees?.length > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#1e293b' }}>Fees</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {portalInfo.fees.map((fee, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: '#1e293b', minWidth: 60 }}>${fee.amount}</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{fee.label}</span>
                  {fee.description && <span style={{ color: '#64748b' }}>— {fee.description}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {portalInfo?.keyDates?.length > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#1e293b' }}>Key Dates</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {portalInfo.keyDates.map((kd, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#3b82f6', minWidth: 100, flexShrink: 0 }}>
                    {new Date(kd.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>{kd.label}</span>
                  {kd.description && <span style={{ color: '#64748b' }}>— {kd.description}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {portalInfo?.signupDeadline && (
          <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
            Deadline: {new Date(portalInfo.signupDeadline).toLocaleDateString()}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Name *</label>
          <input required value={form.name} onChange={updateField('name')} style={inputStyle} />

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Category</label>
          <select value={form.category} onChange={updateField('category')} style={inputStyle}>
            {(portalInfo?.categories?.length ? portalInfo.categories : DEFAULT_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Email</label>
          <input type="email" value={form.email} onChange={updateField('email')} style={inputStyle} />

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Phone</label>
          <input value={form.phone} onChange={updateField('phone')} style={inputStyle} />

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Business Name</label>
          <input value={form.businessName} onChange={updateField('businessName')} style={inputStyle} />

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Description</label>
          <textarea value={form.description} onChange={updateField('description')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Booth Size (spots needed)</label>
          <input type="number" min={1} max={4} value={form.boothSize} onChange={(e) => setForm((f) => ({ ...f, boothSize: parseInt(e.target.value) || 1 }))} style={inputStyle} />

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Power Needs</label>
          <input value={form.powerNeeds} onChange={updateField('powerNeeds')} placeholder="e.g., 110V, 220V, none" style={inputStyle} />

          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#1e293b' }}>Setup Requirements</label>
          <textarea value={form.setupRequirements} onChange={updateField('setupRequirements')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Special requirements, dimensions, etc." />

          {portalInfo?.mapReady && portalInfo.availableSpots?.length > 0 && (
            <SpotPicker
              spots={portalInfo.availableSpots}
              selected={form.spotPreferences}
              maxChoices={portalInfo.maxSpotChoices || 3}
              onChange={(prefs) => setForm((f) => ({ ...f, spotPreferences: prefs }))}
            />
          )}

          {!portalInfo?.mapReady && (
            <div style={{ background: '#fefce8', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: '#854d0e', border: '1px solid #fde68a' }}>
              Map coming soon — spot preferences will be available once the event map is ready.
            </div>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ ...btnStyle, background: '#3b82f6', color: '#fff', width: '100%', marginTop: 8 }}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
