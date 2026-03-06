import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    keywords: ['start', 'create', 'event', 'layout', 'upload', 'csv', 'vendor', 'begin'],
    content: [
      { heading: 'Create an Event', text: 'From the Events page, click "New Event" to create your event. Give it a name, date, and location. Each event acts as a container for your layouts and vendors.' },
      { heading: 'Create Layouts', text: 'Within an event, create one or more layouts. Each layout is a separate map design -- useful for exploring different booth arrangements or managing multiple areas of a venue.' },
      { heading: 'Upload Vendors', text: 'Add vendors by uploading a CSV file, pasting data directly, or trying the demo dataset. You can also add vendors manually one at a time from the Vendors section.' },
    ],
  },
  {
    id: 'map-layout',
    title: 'Map & Layout',
    keywords: ['map', 'street', 'draw', 'spot', 'dead zone', 'amenity', 'access point', 'edit', 'select', 'undo', 'redo', 'zone', 'barricade', 'fencing'],
    content: [
      { heading: 'Drawing Streets', text: 'Click "Draw Street" in the Actions panel, then click on the map to draw a path where vendor booths will be placed. Double-click to finish the path. Spots are automatically generated along the street based on the configured booth size and spacing.' },
      { heading: 'Placing Individual Spots', text: 'Click "Place Spot" then click anywhere on the map to add a single vendor spot. Useful for irregular layouts or adding spots in specific locations.' },
      { heading: 'Dead Zones', text: 'Dead zones are areas where no vendor spots can be placed. Select the dead zone tool from Map Elements, then click on the map to place corners of a polygon. The area inside the polygon becomes a no-placement zone, and any existing spots within it are removed.' },
      { heading: 'Map Zones', text: 'Map zones are visual overlays like barricades, fencing, and other infrastructure elements. Select a zone type from the Map Elements palette and draw it on the map. These are visual aids to help communicate the layout to your team and vendors.' },
      { heading: 'Amenities', text: 'Place amenities like power outlets, water hookups, and restrooms as point markers on the map. These help vendors understand available resources near their assigned spots.' },
      { heading: 'Access Points', text: 'Mark entry and exit points for logistics planning. Access points are used to calculate the nearest load-in/load-out location for each vendor spot.' },
      { heading: 'Editing Spots', text: 'Click any spot on the map to open its properties panel. You can set a spot as premium, assign a tier, restrict it to specific vendor categories, and add a custom label.' },
      { heading: 'Multi-Select', text: 'Hold Shift and click on spots to select multiple spots at once. With multiple spots selected, you can perform batch operations like deleting or updating properties.' },
      { heading: 'Undo / Redo', text: 'Press Cmd/Ctrl+Z to undo your last action, or Cmd/Ctrl+Shift+Z to redo. The undo history tracks spot changes, placements, dead zones, streets, and map zones.' },
    ],
  },
  {
    id: 'vendors',
    title: 'Vendors',
    keywords: ['vendor', 'csv', 'upload', 'category', 'tier', 'status', 'portal', 'booth', 'power', 'applied', 'approved', 'waitlisted', 'assigned', 'checked_in', 'canceled'],
    content: [
      { heading: 'Uploading Vendors', text: 'Upload a CSV or Excel file with your vendor data. The column mapping dialog lets you match your file columns to vendor fields like name, category, tier, and booth size.' },
      { heading: 'Vendor Properties', text: 'Each vendor has a name, category (e.g., food, art, jewelry), tier (e.g., gold, silver, bronze), booth size, and power requirements. These properties are used by the auto-placement algorithm.' },
      { heading: 'Vendor Statuses', text: 'Vendors can have the following statuses: applied (initial submission), approved (accepted to the event), waitlisted (on the waiting list), assigned (placed on the map), checked_in (arrived at the event), and canceled (no longer participating).' },
      { heading: 'Vendor Portal', text: 'Enable the vendor portal to let vendors self-register for your event via a unique invite link. See the Vendor Portal section below for more details.' },
    ],
  },
  {
    id: 'placement',
    title: 'Placement',
    keywords: ['placement', 'auto', 'algorithm', 'assign', 'drag', 'move', 'adjacency', 'restriction', 'tier', 'category'],
    content: [
      { heading: 'Auto-Placement', text: 'Click "Run Placement" to automatically assign vendors to spots. The algorithm considers tier matching, category restrictions on spots, and adjacency rules to create an optimal layout.' },
      { heading: 'Manual Placement', text: 'Drag vendors to spots or use the move tool. Click a spot to see its assigned vendor, then use "Move" to reassign the vendor to a different spot.' },
      { heading: 'Adjacency Rules', text: 'Configure adjacency rules to prevent vendors of the same category from being placed next to each other. This is useful for ensuring variety along a street (e.g., no two jewelry vendors side by side).' },
    ],
  },
  {
    id: 'vendor-portal',
    title: 'Vendor Portal',
    keywords: ['portal', 'invite', 'link', 'self-service', 'register', 'apply', 'signup', 'deadline', 'instructions'],
    content: [
      { heading: 'Enabling the Portal', text: 'Open the "Vendor Portal" section in the layout sidebar and toggle it on. This generates a unique invite link for your event.' },
      { heading: 'Sharing the Link', text: 'Copy the invite link and share it with vendors via email, social media, or your website. Vendors can access the portal without creating an account.' },
      { heading: 'Vendor Experience', text: 'Vendors who visit the portal can apply to your event, pick their preferred spots on the map, and track their application status in real time.' },
      { heading: 'Configuration', text: 'Customize the portal by setting the maximum number of spot choices a vendor can make, a signup deadline after which applications close, and custom instructions that appear on the portal page.' },
    ],
  },
  {
    id: 'event-info',
    title: 'Event Info Sections',
    keywords: ['event', 'info', 'information', 'booth', 'rules', 'regulations', 'refund', 'policy', 'jury', 'dashboard'],
    content: [
      { heading: 'Configuring Event Details', text: 'From the Event Dashboard, click the "Event Info" tab to configure the information vendors see on the portal.' },
      { heading: 'Available Sections', text: 'You can edit: Event Information (date, location, description), General Information (overview and FAQs), Booth Information (setup details and dimensions), Rules & Regulations (event policies), Refund Policy (cancellation terms), and Jury Details (if applicable, the jurying process).' },
      { heading: 'Visibility', text: 'All configured sections are displayed on the vendor portal, giving vendors the information they need before applying.' },
    ],
  },
  {
    id: 'pricing-revenue',
    title: 'Pricing & Revenue',
    keywords: ['pricing', 'revenue', 'price', 'tier', 'category', 'multiplier', 'premium', 'cost', 'money'],
    content: [
      { heading: 'Base Prices by Tier', text: 'Set a base booth price for each tier (e.g., Gold = $500, Silver = $300, Bronze = $150). Vendors are charged based on the tier of the spot they are assigned to.' },
      { heading: 'Category Multipliers', text: 'Apply pricing multipliers by vendor category. For example, food vendors might pay 1.5x the base price due to higher infrastructure needs.' },
      { heading: 'Premium Spot Pricing', text: 'Mark individual spots as premium to apply an additional price multiplier. Premium spots are typically high-traffic or corner locations.' },
      { heading: 'Revenue Summary', text: 'The revenue summary calculates total expected revenue based on the current placement, spot tiers, category multipliers, and premium designations.' },
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics',
    keywords: ['logistics', 'access', 'point', 'load', 'setup', 'schedule', 'time', 'window'],
    content: [
      { heading: 'Access Points', text: 'Place access points on the map to mark entry and exit locations for vendor load-in and load-out. Each vendor spot is automatically associated with its nearest access point.' },
      { heading: 'Time Windows', text: 'Define load-in and load-out time windows to schedule vendor setup. This helps prevent congestion at access points during setup and teardown.' },
      { heading: 'Vendor Assignments', text: 'When vendors are assigned to spots, they can see their nearest access point and assigned time window, making event day logistics smoother.' },
    ],
  },
  {
    id: 'export',
    title: 'Export & Sharing',
    keywords: ['export', 'pdf', 'share', 'link', 'print', 'check-in', 'checkin'],
    content: [
      { heading: 'Export as PDF', text: 'Export your current layout as a PDF document. The PDF includes the map with all spots, vendor assignments, and a legend. Great for printing and posting at the event.' },
      { heading: 'Share Links', text: 'Generate share links for individual vendor assignments. Each vendor gets a unique link showing their spot location, access point, and setup instructions.' },
      { heading: 'Check-In Mode', text: 'Switch to check-in mode on event day. This simplified view lets you mark vendors as checked in when they arrive, tracking attendance in real time.' },
    ],
  },
];

function CollapsibleCard({ title, content, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          color: '#e2e8f0',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <span>{title}</span>
        <span style={{
          fontSize: 12,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          color: '#64748b',
        }}>
          &#9654;
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 16px' }}>
          {content.map((item, i) => (
            <div key={i} style={{ marginBottom: i < content.length - 1 ? 14 : 0 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#93c5fd' }}>
                {item.heading}
              </h4>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#cbd5e1' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredSections = search.trim()
    ? SECTIONS.filter((s) => {
        const q = search.toLowerCase();
        if (s.title.toLowerCase().includes(q)) return true;
        if (s.keywords.some((k) => k.includes(q))) return true;
        return s.content.some(
          (c) => c.heading.toLowerCase().includes(q) || c.text.toLowerCase().includes(q)
        );
      })
    : SECTIONS;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0',
      padding: '0 0 60px',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '32px 24px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/events')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              border: '1px solid #334155',
              borderRadius: 6,
              background: '#1e293b',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            &larr; Back to Events
          </button>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>
          Help Center
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94a3b8' }}>
          Comprehensive documentation for the Vendor Placer app. Click a section to expand it.
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search documentation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            fontSize: 14,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#e2e8f0',
            marginBottom: 24,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Sections */}
        {filteredSections.length === 0 && (
          <p style={{ color: '#64748b', fontSize: 14 }}>
            No sections match your search. Try different keywords.
          </p>
        )}
        {filteredSections.map((section) => (
          <CollapsibleCard
            key={section.id}
            title={section.title}
            content={section.content}
            defaultOpen={filteredSections.length === 1}
          />
        ))}
      </div>
    </div>
  );
}
