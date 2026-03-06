import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchEvent, updateEvent,
  fetchLayouts, createLayout, duplicateLayout, deleteLayout,
} from '../api/index.js';

export default function EventDashboardPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewLayout, setShowNewLayout] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [eventName, setEventName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, lays] = await Promise.all([
        fetchEvent(eventId),
        fetchLayouts(eventId),
      ]);
      setEvent(ev);
      setEventName(ev.name);
      setLayouts(lays);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleCreateLayout = async () => {
    if (!newLayoutName.trim()) return;
    await createLayout(eventId, { name: newLayoutName.trim() });
    setNewLayoutName('');
    setShowNewLayout(false);
    const lays = await fetchLayouts(eventId);
    setLayouts(lays);
  };

  const handleDuplicate = async (e, layoutId) => {
    e.stopPropagation();
    await duplicateLayout(eventId, layoutId);
    const lays = await fetchLayouts(eventId);
    setLayouts(lays);
  };

  const handleDeleteLayout = async (e, layoutId) => {
    e.stopPropagation();
    if (!confirm('Delete this layout?')) return;
    await deleteLayout(eventId, layoutId);
    const lays = await fetchLayouts(eventId);
    setLayouts(lays);
  };

  const handleSaveName = async () => {
    if (eventName.trim() && eventName.trim() !== event?.name) {
      await updateEvent(eventId, { name: eventName.trim() });
      setEvent((prev) => ({ ...prev, name: eventName.trim() }));
    }
    setEditingName(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => navigate('/events')}
            style={{
              background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
              fontSize: 13, padding: 0,
            }}
          >
            &larr; All Events
          </button>
        </div>

        {/* Event header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  style={{
                    fontSize: 24, fontWeight: 700, padding: '4px 8px',
                    background: '#1e293b', color: '#e2e8f0', border: '1px solid #3b82f6',
                    borderRadius: 6,
                  }}
                />
                <button onClick={handleSaveName} style={{
                  padding: '4px 12px', background: '#3b82f6', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                }}>Save</button>
              </div>
            ) : (
              <h1
                style={{ margin: 0, fontSize: 28, cursor: 'pointer' }}
                onClick={() => setEditingName(true)}
                title="Click to rename"
              >
                {event?.name}
              </h1>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {event?.vendors?.length || 0} vendors
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {layouts.length} layouts
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/events/${eventId}/checkin`)}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600,
                background: '#10b981', color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer',
              }}
            >
              Check-In
            </button>
          </div>
        </div>

        {/* Create new layout */}
        {showNewLayout ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              type="text"
              value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)}
              placeholder="Layout name..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateLayout()}
              style={{
                flex: 1, padding: '10px 14px', fontSize: 14,
                background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
                borderRadius: 8,
              }}
            />
            <button
              onClick={handleCreateLayout}
              disabled={!newLayoutName.trim()}
              style={{
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowNewLayout(false)}
              style={{
                padding: '10px 16px', fontSize: 14,
                background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewLayout(true)}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
              cursor: 'pointer', marginBottom: 24,
            }}
          >
            + New Layout
          </button>
        )}

        {/* Layouts list */}
        {layouts.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', background: '#1e293b',
            borderRadius: 12, border: '1px solid #334155',
          }}>
            <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 0 8px' }}>No layouts yet</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Create a layout to start designing your event map.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {layouts.map((layout) => {
            const isActive = event?.activeLayoutId === layout.id;
            return (
              <div
                key={layout.id}
                onClick={() => navigate(`/events/${eventId}/layouts/${layout.id}`)}
                style={{
                  background: '#1e293b', borderRadius: 12, padding: '16px 20px',
                  border: isActive ? '1px solid #3b82f6' : '1px solid #334155',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#334155'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{layout.name}</h3>
                      {isActive && (
                        <span style={{
                          fontSize: 9, padding: '2px 6px', borderRadius: 4,
                          background: '#3b82f6', color: '#fff', fontWeight: 700,
                          textTransform: 'uppercase',
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      Updated {new Date(layout.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={(e) => handleDuplicate(e, layout.id)}
                      style={{
                        padding: '4px 10px', fontSize: 11, fontWeight: 600,
                        background: '#334155', color: '#e2e8f0', border: 'none',
                        borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => handleDeleteLayout(e, layout.id)}
                      style={{
                        padding: '4px 10px', fontSize: 11, fontWeight: 600,
                        background: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
                        borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
