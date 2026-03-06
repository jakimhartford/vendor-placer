import html2canvas from 'html2canvas';
import { CATEGORY_COLORS, CATEGORY_SHORT, DEAD_ZONE_COLOR } from './tierColors.js';
import { calculateSpotPrice, calculateRevenueSummary } from './pricing.js';

/**
 * Capture the Leaflet map container as a base64 PNG.
 */
async function captureMap(mapContainer) {
  if (!mapContainer) return null;
  try {
    const canvas = await html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: 2,
      onclone: (clonedDoc) => {
        // Fix leaflet transform for html2canvas
        const container = clonedDoc.querySelector('.leaflet-container');
        if (container) {
          const pane = container.querySelector('.leaflet-map-pane');
          if (pane) {
            const t = pane.style.transform;
            const m = t.match(/translate3d\(([^,]+),\s*([^,]+)/);
            if (m) {
              pane.style.transform = 'none';
              pane.style.left = m[1];
              pane.style.top = m[2];
            }
          }
        }
      },
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Build category legend HTML.
 */
function buildLegend(vendors, assignments) {
  const usedCategories = new Set();
  Object.values(assignments || {}).forEach((vendorId) => {
    const v = (vendors || []).find((v) => v.id === vendorId || v._id === vendorId);
    if (v?.category) usedCategories.add(v.category);
  });

  let html = '<div style="display:flex;flex-wrap:wrap;gap:6px 18px;margin:8px 0 4px;">';
  for (const cat of usedCategories) {
    const color = CATEGORY_COLORS[cat] || '#6b7280';
    const short = CATEGORY_SHORT[cat] || cat.slice(0, 3).toUpperCase();
    html += `<div style="display:flex;align-items:center;gap:5px;font-size:12px;">
      <span style="display:inline-block;width:16px;height:16px;background:${color};border-radius:3px;opacity:0.75;border:1px solid #cbd5e1;"></span>
      <strong>${short}</strong> ${cat}
    </div>`;
  }
  html += `<div style="display:flex;align-items:center;gap:5px;font-size:12px;">
    <span style="display:inline-block;width:16px;height:16px;background:${DEAD_ZONE_COLOR};border-radius:3px;opacity:0.3;border:2px dashed ${DEAD_ZONE_COLOR};"></span>
    Dead Zone
  </div>`;
  html += `<div style="display:flex;align-items:center;gap:5px;font-size:12px;">
    <span style="display:inline-block;width:16px;height:16px;background:#e2e8f0;border-radius:3px;border:1px dashed #94a3b8;"></span>
    Vacant
  </div>`;
  html += '</div>';
  return html;
}

export async function exportHtml({ mapContainer, spots, vendors, assignments, deadZones, pricingConfig }) {
  const vendorMap = {};
  (vendors || []).forEach((v) => { vendorMap[v.id || v._id] = v; });

  // Capture the actual map with tiles as an image
  const mapImage = await captureMap(mapContainer);

  const legend = buildLegend(vendors, assignments);

  // Vendor assignment table
  const spotLabelMap = {};
  (spots?.features || []).forEach((f) => {
    if (f.properties?.id) spotLabelMap[f.properties.id] = f.properties;
  });

  let tableRows = '';
  const assignEntries = Object.entries(assignments || {});
  for (const [spotId, vendorId] of assignEntries) {
    const spotProps = spotLabelMap[spotId] || {};
    const vendor = vendorMap[vendorId];
    if (!vendor) continue;

    const color = CATEGORY_COLORS[vendor.category] || '#6b7280';
    let priceCell = '';
    if (pricingConfig) {
      const price = calculateSpotPrice(spotProps, vendor, pricingConfig);
      priceCell = `<td>$${price}</td>`;
    }
    tableRows += `<tr>
      <td>${spotProps.label || spotId.slice(0, 8)}</td>
      <td>${vendor.name || ''}</td>
      <td><span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:2px;margin-right:4px;vertical-align:middle;"></span>${vendor.category || ''}</td>
      <td>${vendor.tier || ''}</td>
      ${priceCell}
    </tr>`;
  }

  // Unplaced vendors
  const placedIds = new Set(Object.values(assignments || {}));
  const unplaced = (vendors || []).filter((v) => !placedIds.has(v.id) && !placedIds.has(v._id));

  let unplacedHtml = '';
  if (unplaced.length > 0) {
    unplacedHtml = `<h2>Unplaced Vendors (${unplaced.length})</h2><ul style="columns:2;font-size:12px;">`;
    for (const v of unplaced) {
      unplacedHtml += `<li>${v.name} (${v.category || 'N/A'})</li>`;
    }
    unplacedHtml += '</ul>';
  }

  // Revenue summary
  let revenueHtml = '';
  if (pricingConfig) {
    const summary = calculateRevenueSummary(spots, vendors, assignments, pricingConfig);
    revenueHtml = `<h2>Revenue Summary</h2>
      <p style="font-size:16px;font-weight:bold;">Total: $${summary.total.toLocaleString()}</p>
      <div style="display:flex;gap:40px;">
        <div><h3>By Tier</h3><ul>${Object.entries(summary.byTier).map(([t, a]) => `<li>${t}: $${a.toLocaleString()}</li>`).join('')}</ul></div>
        <div><h3>By Category</h3><ul>${Object.entries(summary.byCategory).map(([c, a]) => `<li>${c}: $${a.toLocaleString()}</li>`).join('')}</ul></div>
      </div>`;
  }

  const mapHtml = mapImage
    ? `<div class="map-wrap"><img src="${mapImage}" style="width:100%;height:auto;border:1px solid #e2e8f0;border-radius:4px;" /></div>`
    : '<p style="color:#94a3b8;text-align:center;padding:40px;">Map capture unavailable</p>';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vendor Placement Map</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px 28px; color: #1e293b; background: #fff; }
    h1 { font-size: 20px; margin-bottom: 2px; }
    h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
    h3 { font-size: 12px; margin-bottom: 4px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 1px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
    th, td { text-align: left; padding: 3px 6px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
    tr:nth-child(even) { background: #fafbfc; }
    .map-wrap { margin: 10px 0; }
    .stats { color: #64748b; font-size: 12px; margin-bottom: 6px; }
    .print-btn { position: fixed; top: 12px; right: 12px; padding: 8px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; z-index: 100; }
    .print-btn:hover { background: #2563eb; }
    @media print {
      .print-btn { display: none; }
      body { padding: 8px; }
      .page-break { page-break-before: always; }
    }
    @page { size: landscape; margin: 0.4in; }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  <h1>Vendor Placement Map</h1>
  <p class="stats">${assignEntries.length} assigned &middot; ${unplaced.length} unplaced &middot; ${(deadZones || []).length} dead zones</p>

  ${legend}
  ${mapHtml}

  <div class="page-break"></div>
  <h2>Vendor Assignments</h2>
  <table>
    <thead><tr><th>Spot</th><th>Vendor</th><th>Category</th><th>Tier</th>${pricingConfig ? '<th>Price</th>' : ''}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>

  ${unplacedHtml}
  ${revenueHtml}
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
