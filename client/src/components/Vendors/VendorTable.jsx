import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TIER_COLORS, EMPTY_COLOR } from '../../utils/tierColors.js';
import { generateShareLink } from '../../api/index.js';

const COLUMNS = [
  { key: 'name', label: 'Name', width: '26%' },
  { key: 'category', label: 'Type', width: '13%' },
  { key: 'tier', label: 'Tier', width: '11%' },
  { key: 'bid', label: 'Bid', width: '10%' },
  { key: 'spot', label: 'Spot', width: '22%' },
  { key: 'status', label: '', width: '18%' },
];

export default function VendorTable({ vendors, assignments, spots, onSelectVendor, onReassign, currentProjectId, onUpdateVendor }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState(1);
  const [search, setSearch] = useState('');
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [filterUnplaced, setFilterUnplaced] = useState(false);
  const [copiedVendorId, setCopiedVendorId] = useState(null);
  const [editingBidId, setEditingBidId] = useState(null);
  const [bidValue, setBidValue] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  // Build vendorId -> { spotId, spotLabel, allSpots } map
  const vendorSpotMap = useMemo(() => {
    const map = {};
    if (assignments && spots?.features) {
      const spotMap = {};
      spots.features.forEach((f) => {
        if (f.properties?.id) {
          spotMap[f.properties.id] = {
            label: f.properties.label || f.properties.id,
            id: f.properties.id,
          };
        }
      });
      Object.entries(assignments).forEach(([spotId, vendorId]) => {
        const spotInfo = spotMap[spotId] || { label: spotId, id: spotId };
        if (map[vendorId]) {
          map[vendorId].allSpots.push(spotInfo);
        } else {
          map[vendorId] = { ...spotInfo, allSpots: [spotInfo] };
        }
      });
    }
    return map;
  }, [assignments, spots]);

  // Available (unassigned) spots for reassignment
  const availableSpots = useMemo(() => {
    if (!spots?.features) return [];
    const assignedSpotIds = new Set(Object.keys(assignments || {}));
    return spots.features
      .filter((f) => f.properties?.id && !assignedSpotIds.has(f.properties.id))
      .map((f) => ({
        id: f.properties.id,
        label: f.properties.label || f.properties.id,
        isCorner: f.properties.isCorner,
        trafficScore: f.properties.trafficScore || 0,
      }))
      .sort((a, b) => b.trafficScore - a.trafficScore);
  }, [spots, assignments]);

  const filtered = useMemo(() => {
    if (!vendors?.length) return [];
    let list = vendors;

    if (filterUnplaced) {
      list = list.filter((v) => !vendorSpotMap[v.id]);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.tier?.toLowerCase().includes(q) ||
          (vendorSpotMap[v.id]?.label || '').toLowerCase().includes(q) ||
          (v.conflicts || []).some((c) => c.toLowerCase().includes(q)) ||
          (v.premium && 'premium'.includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'bid') {
        aVal = a.bid || 0;
        bVal = b.bid || 0;
        if (aVal < bVal) return -1 * sortDir;
        if (aVal > bVal) return 1 * sortDir;
        return 0;
      } else if (sortKey === 'spot') {
        aVal = (vendorSpotMap[a.id]?.label || '').toLowerCase();
        bVal = (vendorSpotMap[b.id]?.label || '').toLowerCase();
      } else if (sortKey === 'status') {
        aVal = vendorSpotMap[a.id] ? '1' : '0';
        bVal = vendorSpotMap[b.id] ? '1' : '0';
      } else {
        aVal = (a[sortKey] || '').toString().toLowerCase();
        bVal = (b[sortKey] || '').toString().toLowerCase();
      }
      if (aVal < bVal) return -1 * sortDir;
      if (aVal > bVal) return 1 * sortDir;
      return 0;
    });
  }, [vendors, sortKey, sortDir, search, vendorSpotMap, filterUnplaced]);

  // Reset to first page when filters/sort change
  useEffect(() => { setPage(0); }, [search, filterUnplaced, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => d * -1);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const handleReassign = useCallback(
    (vendorId, newSpotId) => {
      setEditingVendorId(null);
      if (onReassign && newSpotId) {
        onReassign(vendorId, newSpotId);
      }
    },
    [onReassign]
  );

  const handleShare = useCallback(async (e, vendorId) => {
    e.stopPropagation();
    if (!currentProjectId) return;
    try {
      const { url } = await generateShareLink(currentProjectId, vendorId);
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedVendorId(vendorId);
      setTimeout(() => setCopiedVendorId(null), 2000);
    } catch {
      // ignore
    }
  }, [currentProjectId]);

  const unplacedCount = vendors?.filter((v) => !vendorSpotMap[v.id]).length || 0;

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
          marginBottom: 6,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span className="count-label" style={{ margin: 0 }}>
          {filtered.length} of {vendors.length}
        </span>
        {unplacedCount > 0 && (
          <button
            onClick={() => setFilterUnplaced(!filterUnplaced)}
            style={{
              background: filterUnplaced ? '#dc2626' : '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 10,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {filterUnplaced ? 'Show all' : `${unplacedCount} unplaced`}
          </button>
        )}
      </div>
      <div className="vendor-table-wrapper">
        <table className="vendor-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  {col.label}
                  {sortKey === col.key ? (sortDir === 1 ? ' \u25B2' : ' \u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((v, idx) => {
              const spotInfo = vendorSpotMap[v.id];
              const isPlaced = !!spotInfo;
              const hasConflicts = v.conflicts?.length > 0;
              const isPremium = v.premium;
              const isEditing = editingVendorId === v.id;

              return (
                <tr
                  key={v.id || v._id || idx}
                  onClick={() => !isEditing && onSelectVendor?.(v.id)}
                  style={{
                    cursor: onSelectVendor ? 'pointer' : 'default',
                    background: !isPlaced ? 'rgba(220, 38, 38, 0.08)' : undefined,
                  }}
                >
                  <td title={v.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.name}
                      </span>
                      {(v.booths || 1) >= 2 && (
                        <span title={`${v.booths} booths`} style={{
                          fontSize: 8,
                          background: '#7c3aed',
                          color: '#fff',
                          padding: '1px 4px',
                          borderRadius: 3,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {v.booths}x
                        </span>
                      )}
                      {isPremium && (
                        <span title="Premium spot purchased" style={{ fontSize: 9, color: '#facc15', flexShrink: 0 }}>
                          ★
                        </span>
                      )}
                    </div>
                    {hasConflicts && (
                      <div style={{ fontSize: 9, marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>vs</span>
                        {v.conflicts.map((c, ci) => (
                          <span key={ci} style={{
                            background: '#7f1d1d',
                            color: '#fca5a5',
                            padding: '1px 5px',
                            borderRadius: 3,
                            fontSize: 9,
                          }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 11, textTransform: 'capitalize' }}>{v.category}</td>
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
                  <td>
                    {editingBidId === v.id ? (
                      <input
                        type="number"
                        autoFocus
                        value={bidValue}
                        onChange={(e) => setBidValue(e.target.value)}
                        onBlur={() => {
                          const val = Math.max(0, parseFloat(bidValue) || 0);
                          if (onUpdateVendor) onUpdateVendor(v.id, { bid: val });
                          setEditingBidId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%', fontSize: 10, padding: '2px 4px',
                          background: '#1e293b', color: '#e2e8f0', border: '1px solid #facc15',
                          borderRadius: 4, boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setBidValue(v.bid || 0);
                          setEditingBidId(v.id);
                        }}
                        style={{ cursor: 'pointer', color: (v.bid || 0) > 0 ? '#34d399' : '#475569', fontSize: 11 }}
                        title="Click to edit bid"
                      >
                        {(v.bid || 0) > 0 ? `$${v.bid}` : '-'}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        autoFocus
                        style={{
                          width: '100%',
                          fontSize: 10,
                          padding: '2px 4px',
                          background: '#1e293b',
                          color: '#e2e8f0',
                          border: '1px solid #facc15',
                          borderRadius: 4,
                        }}
                        defaultValue=""
                        onChange={(e) => handleReassign(v.id, e.target.value)}
                        onBlur={() => setEditingVendorId(null)}
                      >
                        <option value="">-- pick spot --</option>
                        {availableSpots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} {s.isCorner ? '★' : ''} ({s.trafficScore})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        style={{
                          color: isPlaced ? '#34d399' : '#475569',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>{spotInfo?.allSpots ? spotInfo.allSpots.map((s) => s.label).join(', ') : '—'}</span>
                        {onReassign && (
                          <button
                            title={isPlaced ? 'Reassign spot' : 'Assign spot'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVendorId(v.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontSize: 12,
                              lineHeight: 1,
                            }}
                          >
                            ✎
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {!isPlaced ? (
                      <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>
                        UNPLACED
                      </span>
                    ) : currentProjectId && (
                      <button
                        title="Copy share link"
                        onClick={(e) => handleShare(e, v.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          color: copiedVendorId === v.id ? '#34d399' : '#64748b',
                          padding: '0 2px',
                          lineHeight: 1,
                        }}
                      >
                        {copiedVendorId === v.id ? 'Copied!' : '🔗'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      {filtered.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 6, padding: '4px 0', fontSize: 11, color: '#94a3b8',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: 4,
                color: page === 0 ? '#475569' : '#e2e8f0', cursor: page === 0 ? 'default' : 'pointer',
                padding: '2px 8px', fontSize: 11,
              }}
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: 4,
                color: page >= totalPages - 1 ? '#475569' : '#e2e8f0',
                cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                padding: '2px 8px', fontSize: 11,
              }}
            >
              Next
            </button>
          </div>
          <span>Page {page + 1} of {totalPages}</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            style={{
              background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
              borderRadius: 4, padding: '2px 4px', fontSize: 11,
            }}
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}
    </div>
  );
}
