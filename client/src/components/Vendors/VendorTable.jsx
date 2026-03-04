import React, { useState, useMemo } from 'react';
import { TIER_COLORS, EMPTY_COLOR } from '../../utils/tierColors.js';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Cat' },
  { key: 'tier', label: 'Tier' },
  { key: 'spot', label: 'Spot' },
];

export default function VendorTable({ vendors, assignments, spots, onSelectVendor }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState(1);
  const [search, setSearch] = useState('');

  // Build vendorId -> spotLabel map
  const vendorSpotMap = useMemo(() => {
    const map = {};
    if (assignments && spots?.features) {
      const spotMap = {};
      spots.features.forEach((f) => {
        if (f.properties?.id) spotMap[f.properties.id] = f.properties.label || f.properties.id;
      });
      // assignments is {spotId: vendorId}
      Object.entries(assignments).forEach(([spotId, vendorId]) => {
        map[vendorId] = spotMap[spotId] || spotId;
      });
    }
    return map;
  }, [assignments, spots]);

  const filtered = useMemo(() => {
    if (!vendors?.length) return [];
    let list = vendors;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.tier?.toLowerCase().includes(q) ||
          (vendorSpotMap[v.id] || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'spot') {
        aVal = (vendorSpotMap[a.id] || '').toLowerCase();
        bVal = (vendorSpotMap[b.id] || '').toLowerCase();
      } else {
        aVal = (a[sortKey] || '').toString().toLowerCase();
        bVal = (b[sortKey] || '').toString().toLowerCase();
      }
      if (aVal < bVal) return -1 * sortDir;
      if (aVal > bVal) return 1 * sortDir;
      return 0;
    });
  }, [vendors, sortKey, sortDir, search, vendorSpotMap]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => d * -1);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  if (!vendors?.length) {
    return <p style={{ color: '#64748b', fontSize: 12 }}>No vendors loaded.</p>;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search vendors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 10px',
          background: '#16213e',
          border: '1px solid #334155',
          borderRadius: 6,
          color: '#e2e8f0',
          fontSize: 12,
          marginBottom: 8,
        }}
      />
      <p className="count-label">
        {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
      </p>
      <div className="vendor-table-wrapper">
        <table className="vendor-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)}>
                  {col.label}
                  {sortKey === col.key ? (sortDir === 1 ? ' \u25B2' : ' \u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, idx) => {
              const spotLabel = vendorSpotMap[v.id] || '';
              return (
                <tr
                  key={v.id || v._id || idx}
                  onClick={() => onSelectVendor?.(v.id)}
                  style={{ cursor: onSelectVendor ? 'pointer' : 'default' }}
                >
                  <td title={v.name}>{v.name}</td>
                  <td>{v.category}</td>
                  <td>
                    <span
                      className="tier-badge"
                      style={{
                        background: TIER_COLORS[v.tier?.toLowerCase()] || EMPTY_COLOR,
                      }}
                    >
                      {v.tier || '—'}
                    </span>
                  </td>
                  <td style={{ color: spotLabel ? '#34d399' : '#475569', fontSize: 11 }}>
                    {spotLabel || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
