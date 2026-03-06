import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents, createEvent, deleteEvent, duplicateEvent } from '../api/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function EventsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createEvent({ name: newName.trim() });
    setNewName('');
    setShowNew(false);
    await load();
  };

  const handleDuplicate = async (e, id, name) => {
    e.stopPropagation();
    const includeLayouts = confirm('Include layouts (map designs) from the original event?');
    const includeVendors = confirm('Include vendors from the original event?');
    await duplicateEvent(id, { includeVendors, includeLayouts });
    await load();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this event and all its layouts?')) return;
    await deleteEvent(id);
    await load();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>My Events</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{user?.email}</p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '6px 16px', borderRadius: 6, border: '1px solid #475569',
              background: '#1e293b', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>

        {/* Create new event */}
        {showNew ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Event name..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              style={{
                flex: 1, padding: '10px 14px', fontSize: 14,
                background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
                borderRadius: 8,
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              style={{
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowNew(false)}
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
            onClick={() => setShowNew(true)}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
              cursor: 'pointer', marginBottom: 24,
            }}
          >
            + New Event
          </button>
        )}

        {loading && <p style={{ color: '#64748b' }}>Loading...</p>}

        {!loading && events.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', background: '#1e293b',
            borderRadius: 12, border: '1px solid #334155',
          }}>
            <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 0 8px' }}>No events yet</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Create your first event to get started.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}`)}
              style={{
                background: '#1e293b', borderRadius: 12, padding: '16px 20px',
                border: '1px solid #334155', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{ev.name}</h2>
                  {(ev.startDate || ev.location) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      {ev.startDate && (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {new Date(ev.startDate).toLocaleDateString()}
                          {ev.endDate && ` \u2013 ${new Date(ev.endDate).toLocaleDateString()}`}
                        </span>
                      )}
                      {ev.location && (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{ev.location}</span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {ev.vendorCount || 0} vendors
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {ev.layoutCount || 0} layouts
                    </span>
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      Updated {new Date(ev.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={(e) => handleDuplicate(e, ev.id, ev.name)}
                    style={{
                      padding: '4px 12px', fontSize: 11, fontWeight: 600,
                      background: '#334155', color: '#e2e8f0', border: 'none',
                      borderRadius: 6, cursor: 'pointer',
                    }}
                    title="Duplicate event for next year"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, ev.id)}
                    style={{
                      padding: '4px 12px', fontSize: 11, fontWeight: 600,
                      background: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
                      borderRadius: 6, cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
