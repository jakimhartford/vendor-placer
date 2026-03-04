import React, { useState, useMemo } from 'react';
import { TIER_COLORS, EMPTY_COLOR } from '../../utils/tierColors.js';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'tier', label: 'Tier' },
];

export default function VendorTable({ vendors }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState(1); // 1 = asc, -1 = desc

  const sorted = useMemo(() => {
    if (!vendors?.length) return [];
    return [...vendors].sort((a, b) => {
      const aVal = (a[sortKey] || '').toString().toLowerCase();
      const bVal = (b[sortKey] || '').toString().toLowerCase();
      if (aVal < bVal) return -1 * sortDir;
      if (aVal > bVal) return 1 * sortDir;
      return 0;
    });
  }, [vendors, sortKey, sortDir]);

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
      <p className="count-label">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</p>
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
            {sorted.map((v, idx) => (
              <tr key={v.id || v._id || idx}>
                <td title={v.name}>{v.name}</td>
                <td>{v.category}</td>
                <td>
                  <span
                    className="tier-badge"
                    style={{
                      background:
                        TIER_COLORS[v.tier?.toLowerCase()] || EMPTY_COLOR,
                    }}
                  >
                    {v.tier || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
