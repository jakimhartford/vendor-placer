import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchEvent, updateEvent,
  fetchLayouts, createLayout, duplicateLayout, deleteLayout,
} from '../api/index.js';

const SECTION_HELP = {
  eventInfo: 'Describe your event \u2014 dates, location, theme, highlights, and what makes it special.',
  generalInfo: 'Awards, fees, application requirements, media categories, and other key details for applicants.',
  boothInfo: 'Booth sizes, pricing, tent requirements, setup/teardown times, and electricity details.',
  rulesRegulations: 'Buy/sell policies, participation requirements, prohibited items, sales tax info.',
  refundPolicy: 'Cancellation deadlines, partial refunds, non-refundable deposits, and transfer policies.',
  juryDetails: 'Jury process, scoring criteria, number of jurors, how applications are reviewed.',
};

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
  const [activeTab, setActiveTab] = useState('layouts');
  const [infoSections, setInfoSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, lays] = await Promise.all([
        fetchEvent(eventId),
        fetchLayouts(eventId),
      ]);
      setEvent(ev);
      setEventName(ev.name);
      setStartDate(ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 10) : '');
      setEndDate(ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 10) : '');
      setLocation(ev.location || '');
      setInfoSections(ev.infoSections || []);
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

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSectionChange = (key, value) => {
    setInfoSections((prev) => prev.map((s) => s.key === key ? { ...s, content: value } : s));
  };

  const handleSectionBlur = async () => {
    try {
      await updateEvent(eventId, { infoSections });
    } catch {
      // silent save error
    }
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
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={() => updateEvent(eventId, { startDate: startDate || null, endDate: endDate || null })}
                style={{
                  padding: '3px 8px', fontSize: 12, background: '#16213e', color: '#e2e8f0',
                  border: '1px solid #334155', borderRadius: 4, width: 130,
                }}
                title="Start date"
              />
              <span style={{ fontSize: 12, color: '#475569' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={() => updateEvent(eventId, { startDate: startDate || null, endDate: endDate || null })}
                style={{
                  padding: '3px 8px', fontSize: 12, background: '#16213e', color: '#e2e8f0',
                  border: '1px solid #334155', borderRadius: 4, width: 130,
                }}
                title="End date"
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => updateEvent(eventId, { location })}
                placeholder="Location..."
                style={{
                  padding: '3px 8px', fontSize: 12, background: '#16213e', color: '#e2e8f0',
                  border: '1px solid #334155', borderRadius: 4, flex: 1, minWidth: 150,
                }}
                title="Event location"
              />
            </div>
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

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid #334155', width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('layouts')}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'layouts' ? '#3b82f6' : '#1e293b',
              color: activeTab === 'layouts' ? '#fff' : '#94a3b8',
            }}
          >
            Layouts
          </button>
          <button
            onClick={() => setActiveTab('eventInfo')}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === 'eventInfo' ? '#3b82f6' : '#1e293b',
              color: activeTab === 'eventInfo' ? '#fff' : '#94a3b8',
            }}
          >
            Event Info
          </button>
        </div>

        {/* Event Info Sections */}
        {activeTab === 'eventInfo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {infoSections.map((section) => (
              <div key={section.key} style={{
                background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden',
              }}>
                <button
                  onClick={() => toggleSection(section.key)}
                  style={{
                    width: '100%', padding: '14px 20px', background: 'none', border: 'none',
                    color: '#e2e8f0', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    textAlign: 'left',
                  }}
                >
                  <span>{section.title}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {expandedSections[section.key] ? '\u25B2' : '\u25BC'}
                  </span>
                </button>
                {expandedSections[section.key] && (
                  <div style={{ padding: '0 20px 16px' }}>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                      {SECTION_HELP[section.key] || ''}
                    </p>
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(section.key, e.target.value)}
                      onBlur={handleSectionBlur}
                      rows={6}
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: 14,
                        background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155',
                        borderRadius: 8, resize: 'vertical', boxSizing: 'border-box',
                        fontFamily: 'inherit', lineHeight: 1.5,
                      }}
                      placeholder={`Enter ${section.title.toLowerCase()} here...`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create new layout */}
        {activeTab === 'layouts' && showNewLayout ? (
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
        ) : activeTab === 'layouts' ? (
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
        ) : null}

        {/* Layouts list */}
        {activeTab === 'layouts' && (
        <>
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
        </>
        )}
      </div>
    </div>
  );
}
