import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchVendorStatus, updateVendorProfile, cancelVendorApplication } from '../api/index.js';

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 14,
  border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box',
  marginBottom: 8,
};

const btnStyle = {
  padding: '10px 20px', fontSize: 14, fontWeight: 600,
  border: 'none', borderRadius: 6, cursor: 'pointer',
};

const STATUS_COLORS = {
  applied: '#3b82f6', approved: '#22c55e', waitlisted: '#eab308',
  assigned: '#7c3aed', checked_in: '#059669', canceled: '#ef4444',
};

export default function VendorStatus() {
  const { vendorToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchVendorStatus(vendorToken)
      .then((d) => {
        setData(d);
        setForm({
          name: d.vendor.name, email: d.vendor.email, phone: d.vendor.phone,
          businessName: d.vendor.businessName, description: d.vendor.description,
          powerNeeds: d.vendor.powerNeeds, setupRequirements: d.vendor.setupRequirements,
        });
      })
      .catch((err) => setError(err.response?.data?.error || 'Not found'))
      .finally(() => setLoading(false));
  }, [vendorToken]);

  const handleSave = useCallback(async () => {
    try {
      setLoading(true);
      await updateVendorProfile(vendorToken, form);
      const d = await fetchVendorStatus(vendorToken);
      setData(d);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [vendorToken, form]);

  const handleCancel = useCallback(async () => {
    try {
      setLoading(true);
      await cancelVendorApplication(vendorToken, 'Vendor canceled');
      const d = await fetchVendorStatus(vendorToken);
      setData(d);
      setConfirmCancel(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  }, [vendorToken]);

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#ef4444' }}>{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const v = data.vendor;
  const setup = data.setupInfo;
  const isCanceled = v.status === 'canceled';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>{data.projectName}</h1>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{v.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{
            padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, color: '#fff',
            background: STATUS_COLORS[v.status] || '#64748b', textTransform: 'uppercase',
          }}>
            {v.status}
          </span>
        </div>

        {/* Setup info */}
        {setup?.spotLabel && (
          <div style={{ background: '#ecfdf5', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #a7f3d0' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Your Assignment</div>
            <div>Spot: <strong>{setup.spotLabel}</strong></div>
            {setup.nearestAccessPoint && (
              <div style={{ marginTop: 4 }}>
                Nearest entrance: {setup.nearestAccessPoint.label} ({setup.nearestAccessPoint.distanceMeters}m)
                {setup.nearestAccessPoint.vehicleAccess && ' — Vehicle access'}
              </div>
            )}
            {setup.timeWindows?.length > 0 && (
              <div style={{ marginTop: 4 }}>
                Setup: {setup.timeWindows.map((tw) => `${tw.start} - ${tw.end}`).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Edit form */}
        {editing && !isCanceled ? (
          <div>
            <input value={form.name} onChange={updateField('name')} placeholder="Name" style={inputStyle} />
            <input value={form.email} onChange={updateField('email')} placeholder="Email" style={inputStyle} />
            <input value={form.phone} onChange={updateField('phone')} placeholder="Phone" style={inputStyle} />
            <input value={form.businessName} onChange={updateField('businessName')} placeholder="Business Name" style={inputStyle} />
            <textarea value={form.description} onChange={updateField('description')} placeholder="Description" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} style={{ ...btnStyle, background: '#3b82f6', color: '#fff', flex: 1 }}>
                Save
              </button>
              <button onClick={() => setEditing(false)} style={{ ...btnStyle, background: '#94a3b8', color: '#fff' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Category:</strong> {v.category}</div>
            {v.email && <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Email:</strong> {v.email}</div>}
            {v.phone && <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Phone:</strong> {v.phone}</div>}
            {v.businessName && <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Business:</strong> {v.businessName}</div>}
            {v.description && <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Description:</strong> {v.description}</div>}
            {v.boothSize > 1 && <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Booth size:</strong> {v.boothSize} spots</div>}
            {v.powerNeeds && <div style={{ fontSize: 14, marginBottom: 4 }}><strong>Power:</strong> {v.powerNeeds}</div>}
            {v.spotPreferences?.length > 0 && (
              <div style={{ fontSize: 14, marginBottom: 4 }}>
                <strong>Preferred spots:</strong> {v.spotPreferences.length} selected
              </div>
            )}
          </div>
        )}

        {!isCanceled && !editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(true)} style={{ ...btnStyle, background: '#3b82f6', color: '#fff', flex: 1 }}>
              Edit Profile
            </button>
            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} style={{ ...btnStyle, background: '#ef4444', color: '#fff' }}>
                Cancel
              </button>
            ) : (
              <button onClick={handleCancel} style={{ ...btnStyle, background: '#991b1b', color: '#fff' }}>
                Confirm Cancel
              </button>
            )}
          </div>
        )}

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}
