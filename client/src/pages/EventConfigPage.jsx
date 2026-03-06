import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEvent, updateEvent } from '../api/index.js';

const SECTION_HELP = {
  eventInfo: 'Describe your event — dates, location, theme, highlights, and what makes it special.',
  generalInfo: 'Awards, fees, application requirements, media categories, and other key details for applicants.',
  boothInfo: 'Booth sizes, pricing, tent requirements, setup/teardown times, and electricity details.',
  rulesRegulations: 'Buy/sell policies, participation requirements, prohibited items, sales tax info.',
  refundPolicy: 'Cancellation deadlines, partial refunds, non-refundable deposits, and transfer policies.',
  juryDetails: 'Jury process, scoring criteria, number of jurors, how applications are reviewed.',
};

const labelStyle = { fontSize: 13, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155',
  borderRadius: 8, boxSizing: 'border-box', fontFamily: 'inherit',
};

export default function EventConfigPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [infoSections, setInfoSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [keyDates, setKeyDates] = useState([]);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetchEvent(eventId)
      .then((ev) => {
        setName(ev.name);
        setStartDate(ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 10) : '');
        setEndDate(ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 10) : '');
        setLocation(ev.location || '');
        setCategories(ev.categories || []);
        setKeyDates((ev.keyDates || []).map((kd) => ({
          ...kd,
          date: kd.date ? new Date(kd.date).toISOString().slice(0, 10) : '',
        })));
        setFees(ev.fees || []);
        setInfoSections(ev.infoSections || []);
        if (ev.infoSections?.length) setActiveSection(ev.infoSections[0].key);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSectionChange = (key, value) => {
    setInfoSections((prev) => prev.map((s) => s.key === key ? { ...s, content: value } : s));
    setSaved(false);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateEvent(eventId, {
        name: name.trim() || 'Untitled Event',
        startDate: startDate || null,
        endDate: endDate || null,
        location,
        categories,
        keyDates: keyDates.filter((kd) => kd.label && kd.date).map((kd) => ({
          label: kd.label,
          date: kd.date || null,
          description: kd.description || '',
        })),
        fees: fees.filter((f) => f.label && f.amount).map((f) => ({
          label: f.label,
          amount: parseFloat(f.amount) || 0,
          description: f.description || '',
          appliesTo: f.appliesTo || 'all',
        })),
        infoSections,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // save error
    } finally {
      setSaving(false);
    }
  }, [eventId, name, startDate, endDate, location, categories, keyDates, fees, infoSections]);

  // Keyboard shortcut: Cmd+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8' }}>
        Loading...
      </div>
    );
  }

  const currentSection = infoSections.find((s) => s.key === activeSection);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid #1e293b', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: '#0f172a', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            style={{
              background: 'none', border: 'none', color: '#3b82f6',
              cursor: 'pointer', fontSize: 14, padding: 0,
            }}
          >
            &larr; Back to Dashboard
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
            Event Configuration
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 24px', fontSize: 14, fontWeight: 600,
            background: saved ? '#22c55e' : '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Event basics */}
        <div style={{
          background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
          padding: 24, marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Event Details</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Event Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false); }}
              style={inputStyle}
              placeholder="e.g., Daytona Beach Arts Fest 2026"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setSaved(false); }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setSaved(false); }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input
                value={location}
                onChange={(e) => { setLocation(e.target.value); setSaved(false); }}
                style={inputStyle}
                placeholder="e.g., Riverfront Esplanade, Daytona Beach, FL"
              />
            </div>
          </div>
        </div>

        {/* Media categories */}
        <div style={{
          background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
          padding: 24, marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Media Categories</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Categories vendors can choose from when applying. These appear as a dropdown on the vendor portal.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {categories.map((cat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', background: '#16213e', borderRadius: 6,
                border: '1px solid #334155',
              }}>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>{cat}</span>
                <button
                  onClick={() => { setCategories((prev) => prev.filter((_, j) => j !== i)); setSaved(false); }}
                  style={{
                    background: 'none', border: 'none', color: '#64748b',
                    cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
                  }}
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCategory.trim()) {
                  setCategories((prev) => [...prev, newCategory.trim()]);
                  setNewCategory('');
                  setSaved(false);
                }
              }}
              placeholder="Add a category..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => {
                if (newCategory.trim()) {
                  setCategories((prev) => [...prev, newCategory.trim()]);
                  setNewCategory('');
                  setSaved(false);
                }
              }}
              disabled={!newCategory.trim()}
              style={{
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                background: '#3b82f6', color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer', flexShrink: 0,
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Key dates */}
        <div style={{
          background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
          padding: 24, marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Key Dates</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Important dates shown to vendors on the portal. Future alert support coming soon.
          </p>

          {keyDates.map((kd, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 2fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                value={kd.label}
                onChange={(e) => { setKeyDates((prev) => prev.map((d, j) => j === i ? { ...d, label: e.target.value } : d)); setSaved(false); }}
                placeholder="Label (e.g., Application Deadline)"
                style={inputStyle}
              />
              <input
                type="date"
                value={kd.date}
                onChange={(e) => { setKeyDates((prev) => prev.map((d, j) => j === i ? { ...d, date: e.target.value } : d)); setSaved(false); }}
                style={inputStyle}
              />
              <input
                value={kd.description || ''}
                onChange={(e) => { setKeyDates((prev) => prev.map((d, j) => j === i ? { ...d, description: e.target.value } : d)); setSaved(false); }}
                placeholder="Description (optional)"
                style={inputStyle}
              />
              <button
                onClick={() => { setKeyDates((prev) => prev.filter((_, j) => j !== i)); setSaved(false); }}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1,
                }}
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}

          <button
            onClick={() => { setKeyDates((prev) => [...prev, { label: '', date: '', description: '' }]); setSaved(false); }}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              background: '#334155', color: '#e2e8f0', border: 'none',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            + Add Date
          </button>
        </div>

        {/* Application / Event Fees */}
        <div style={{
          background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
          padding: 24, marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Application & Event Fees</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Non-booth fees (jury fees, late fees, etc.). Booth pricing is configured separately in Pricing Config.
          </p>

          {fees.map((fee, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 2fr 120px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                value={fee.label}
                onChange={(e) => { setFees((prev) => prev.map((f, j) => j === i ? { ...f, label: e.target.value } : f)); setSaved(false); }}
                placeholder="Fee name"
                style={inputStyle}
              />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 14 }}>$</span>
                <input
                  type="number"
                  value={fee.amount || ''}
                  onChange={(e) => { setFees((prev) => prev.map((f, j) => j === i ? { ...f, amount: e.target.value } : f)); setSaved(false); }}
                  placeholder="0"
                  style={{ ...inputStyle, paddingLeft: 24 }}
                />
              </div>
              <input
                value={fee.description || ''}
                onChange={(e) => { setFees((prev) => prev.map((f, j) => j === i ? { ...f, description: e.target.value } : f)); setSaved(false); }}
                placeholder="Description (optional)"
                style={inputStyle}
              />
              <select
                value={fee.appliesTo || 'all'}
                onChange={(e) => { setFees((prev) => prev.map((f, j) => j === i ? { ...f, appliesTo: e.target.value } : f)); setSaved(false); }}
                style={inputStyle}
              >
                <option value="all">All vendors</option>
                <option value="competitive">Competitive</option>
                <option value="noncompetitive">Non-competitive</option>
              </select>
              <button
                onClick={() => { setFees((prev) => prev.filter((_, j) => j !== i)); setSaved(false); }}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1,
                }}
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}

          <button
            onClick={() => { setFees((prev) => [...prev, { label: '', amount: '', description: '', appliesTo: 'all' }]); setSaved(false); }}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              background: '#334155', color: '#e2e8f0', border: 'none',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            + Add Fee
          </button>
        </div>

        {/* Info sections — sidebar nav + editor */}
        <div style={{
          background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
          overflow: 'hidden',
        }}>
          <h2 style={{ margin: 0, padding: '20px 24px 0', fontSize: 18 }}>
            Event Information Sections
          </h2>
          <p style={{ margin: '4px 24px 16px', fontSize: 13, color: '#64748b' }}>
            These sections are displayed to vendors on the portal. Click a section to edit its content.
          </p>

          <div style={{ display: 'flex', minHeight: 500 }}>
            {/* Section nav */}
            <div style={{
              width: 220, flexShrink: 0, borderRight: '1px solid #334155',
              background: '#16213e',
            }}>
              {infoSections.map((section) => {
                const isActive = section.key === activeSection;
                const hasContent = section.content && section.content.trim().length > 0;
                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    style={{
                      width: '100%', padding: '12px 16px', border: 'none',
                      background: isActive ? '#1e293b' : 'transparent',
                      color: isActive ? '#e2e8f0' : '#94a3b8',
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer', textAlign: 'left',
                      borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: hasContent ? '#22c55e' : '#334155',
                    }} />
                    {section.title}
                  </button>
                );
              })}
            </div>

            {/* Editor */}
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
              {currentSection ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{currentSection.title}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                      {SECTION_HELP[currentSection.key] || ''}
                    </p>
                  </div>
                  <textarea
                    value={currentSection.content}
                    onChange={(e) => handleSectionChange(currentSection.key, e.target.value)}
                    style={{
                      ...inputStyle,
                      flex: 1, minHeight: 400, resize: 'vertical',
                      lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    }}
                    placeholder={`Enter ${currentSection.title.toLowerCase()} here...\n\nThis content will be shown to vendors on the portal.`}
                  />
                  <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>
                    {currentSection.content.length} characters
                    {' \u00B7 '}
                    Cmd/Ctrl+S to save
                  </div>
                </>
              ) : (
                <div style={{ color: '#64748b', fontSize: 14 }}>
                  Select a section from the left to start editing.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
