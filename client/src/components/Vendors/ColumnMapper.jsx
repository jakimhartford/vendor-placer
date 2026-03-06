import React, { useState, useMemo } from 'react';

const TARGET_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'category', label: 'Category', required: true },
  { key: 'tier', label: 'Tier', required: true },
  { key: 'exclusions', label: 'Exclusions', required: false },
  { key: 'conflicts', label: 'Conflicts', required: false },
  { key: 'premium', label: 'Premium', required: false },
  { key: 'booths', label: 'Booths', required: false },
  { key: 'bid', label: 'Bid', required: false },
];

// Aliases for fuzzy auto-matching
const ALIASES = {
  name: ['name', 'vendor name', 'vendor', 'company', 'business', 'business name', 'company name'],
  category: ['category', 'type', 'vendor type', 'cat', 'genre', 'kind'],
  tier: ['tier', 'level', 'priority', 'rank', 'grade'],
  exclusions: ['exclusions', 'exclusion', 'exclude', 'excluded', 'not near'],
  conflicts: ['conflicts', 'conflict', 'conflicting', 'incompatible'],
  premium: ['premium', 'is premium', 'vip', 'priority'],
  booths: ['booths', 'booth', 'booth count', 'num booths', 'spaces', 'stalls', 'spots'],
  bid: ['bid', 'bid amount', 'price', 'amount', 'offer', 'bid price'],
};

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
}

function autoMatch(sourceHeaders) {
  const mapping = {};
  const used = new Set();

  for (const field of TARGET_FIELDS) {
    const aliases = ALIASES[field.key] || [field.key];
    let bestMatch = null;

    for (const header of sourceHeaders) {
      if (used.has(header)) continue;
      const norm = normalize(header);
      // Exact alias match
      if (aliases.includes(norm)) {
        bestMatch = header;
        break;
      }
      // Partial match: alias contained in header or header contained in alias
      if (!bestMatch) {
        for (const alias of aliases) {
          if (norm.includes(alias) || alias.includes(norm)) {
            bestMatch = header;
            break;
          }
        }
      }
    }

    if (bestMatch) {
      mapping[field.key] = bestMatch;
      used.add(bestMatch);
    }
  }

  return mapping;
}

export default function ColumnMapper({ headers, rows, onImport, onCancel }) {
  const [mapping, setMapping] = useState(() => autoMatch(headers));

  const requiredMapped = TARGET_FIELDS
    .filter((f) => f.required)
    .every((f) => mapping[f.key]);

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  const mappedFields = TARGET_FIELDS.filter((f) => mapping[f.key]);

  const handleChange = (fieldKey, sourceCol) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (sourceCol === '') {
        delete next[fieldKey];
      } else {
        next[fieldKey] = sourceCol;
      }
      return next;
    });
  };

  const handleImport = () => {
    // Build CSV string with standard headers
    const targetHeaders = TARGET_FIELDS
      .filter((f) => mapping[f.key])
      .map((f) => f.key);

    const csvRows = [targetHeaders.join(',')];

    for (const row of rows) {
      const values = targetHeaders.map((key) => {
        const sourceCol = mapping[key];
        const val = row[sourceCol] ?? '';
        // Escape CSV values
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(','));
    }

    onImport(csvRows.join('\n'));
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: 12,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <h4 style={{ margin: 0, fontSize: 13, color: '#e2e8f0' }}>
            Map Columns
          </h4>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {rows.length} row{rows.length !== 1 ? 's' : ''} detected
          </span>
        </div>

        {/* Mapping grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', marginBottom: 12 }}>
          {TARGET_FIELDS.map((field) => (
            <React.Fragment key={field.key}>
              <label style={{
                fontSize: 11,
                color: field.required ? '#e2e8f0' : '#94a3b8',
                alignSelf: 'center',
              }}>
                {field.label}{field.required ? ' *' : ''}
              </label>
              <select
                value={mapping[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                style={{
                  fontSize: 11,
                  padding: '3px 6px',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  border: '1px solid #475569',
                  borderRadius: 4,
                }}
              >
                <option value="">-- skip --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </React.Fragment>
          ))}
        </div>

        {/* Preview table */}
        {mappedFields.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              Preview (first {previewRows.length} rows)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                fontSize: 10,
                borderCollapse: 'collapse',
                color: '#cbd5e1',
              }}>
                <thead>
                  <tr>
                    {mappedFields.map((f) => (
                      <th key={f.key} style={{
                        padding: '3px 6px',
                        borderBottom: '1px solid #334155',
                        textAlign: 'left',
                        color: '#94a3b8',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {mappedFields.map((f) => (
                        <td key={f.key} style={{
                          padding: '3px 6px',
                          borderBottom: '1px solid #1e293b',
                          whiteSpace: 'nowrap',
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {row[mapping[f.key]] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-primary"
            disabled={!requiredMapped}
            onClick={handleImport}
            title={!requiredMapped ? 'Map all required fields (*) to import' : 'Import mapped data'}
            style={{ flex: 1, fontSize: 12 }}
          >
            Import ({rows.length} rows)
          </button>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ flex: 0, fontSize: 12, width: 'auto', padding: '6px 14px' }}
          >
            Cancel
          </button>
        </div>

        {!requiredMapped && (
          <p style={{ fontSize: 10, color: '#f87171', margin: '6px 0 0' }}>
            Map all required fields (*) before importing.
          </p>
        )}
      </div>
    </div>
  );
}
