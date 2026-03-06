import { CATEGORY_COLORS, CATEGORY_SHORT, EMPTY_COLOR, DEAD_ZONE_COLOR } from './tierColors.js';
import { calculateSpotPrice, calculateRevenueSummary } from './pricing.js';

/**
 * Build an SVG string of the map with spots, dead zones, and labels.
 */
function buildMapSvg(spots, vendors, assignments, deadZones) {
  const features = spots?.features || [];
  if (features.length === 0 && (!deadZones || deadZones.length === 0)) {
    return '<p>No spots to display</p>';
  }

  // Gather all lat/lng points to compute bounds
  const allPoints = [];
  features.forEach((f) => {
    (f.geometry?.coordinates?.[0] || []).forEach(([lng, lat]) => allPoints.push([lat, lng]));
  });
  (deadZones || []).forEach((dz) => {
    (dz.polygon || []).forEach(([lat, lng]) => allPoints.push([lat, lng]));
  });

  if (allPoints.length === 0) return '<p>No geometry data</p>';

  const minLat = Math.min(...allPoints.map((p) => p[0]));
  const maxLat = Math.max(...allPoints.map((p) => p[0]));
  const minLng = Math.min(...allPoints.map((p) => p[1]));
  const maxLng = Math.max(...allPoints.map((p) => p[1]));

  const padding = 0.0002;
  const bMinLat = minLat - padding;
  const bMaxLat = maxLat + padding;
  const bMinLng = minLng - padding;
  const bMaxLng = maxLng + padding;

  const svgW = 900;
  const svgH = 700;

  // lat/lng to SVG pixel (flip Y since lat increases upward)
  const toX = (lng) => ((lng - bMinLng) / (bMaxLng - bMinLng)) * svgW;
  const toY = (lat) => svgH - ((lat - bMinLat) / (bMaxLat - bMinLat)) * svgH;

  const vendorMap = {};
  (vendors || []).forEach((v) => { vendorMap[v.id || v._id] = v; });

  let svgContent = '';

  // Draw dead zones first (behind spots)
  (deadZones || []).forEach((dz) => {
    const points = (dz.polygon || []).map(([lat, lng]) => `${toX(lng)},${toY(lat)}`).join(' ');
    svgContent += `<polygon points="${points}" fill="${DEAD_ZONE_COLOR}" fill-opacity="0.35" stroke="${DEAD_ZONE_COLOR}" stroke-width="2" stroke-dasharray="6,3" />`;
    // Label
    const cx = (dz.polygon || []).reduce((s, p) => s + toX(p[1]), 0) / (dz.polygon?.length || 1);
    const cy = (dz.polygon || []).reduce((s, p) => s + toY(p[0]), 0) / (dz.polygon?.length || 1);
    svgContent += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="11" font-weight="bold">DEAD ZONE</text>`;
  });

  // Draw spots
  features.forEach((f) => {
    const coords = f.geometry?.coordinates?.[0] || [];
    if (coords.length === 0) return;

    const spotId = f.properties?.id;
    const vendorId = assignments?.[spotId];
    const vendor = vendorId ? vendorMap[vendorId] : null;
    const isEmpty = !vendor;

    let fillColor = EMPTY_COLOR;
    let fillOpacity = isEmpty ? 0.15 : 0.6;
    let strokeColor = isEmpty ? '#64748b' : '#fff';
    let strokeDash = isEmpty ? '4,2' : 'none';

    if (vendor?.category && CATEGORY_COLORS[vendor.category]) {
      fillColor = CATEGORY_COLORS[vendor.category];
    }

    const points = coords.map(([lng, lat]) => `${toX(lng)},${toY(lat)}`).join(' ');
    svgContent += `<polygon points="${points}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="${strokeDash}" />`;

    // Label
    const cx = coords.reduce((s, c) => s + toX(c[0]), 0) / coords.length;
    const cy = coords.reduce((s, c) => s + toY(c[1]), 0) / coords.length;

    if (vendor) {
      const short = CATEGORY_SHORT[vendor.category] || vendor.category?.slice(0, 3)?.toUpperCase() || '?';
      svgContent += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="9" font-weight="bold">${short}</text>`;
    } else {
      const label = f.properties?.label || '';
      svgContent += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="7">${label}</text>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="background:#1e293b;border-radius:8px;">${svgContent}</svg>`;
}

/**
 * Build the category legend HTML
 */
function buildLegend(vendors, assignments) {
  const usedCategories = new Set();
  Object.values(assignments || {}).forEach((vendorId) => {
    const v = (vendors || []).find((v) => v.id === vendorId || v._id === vendorId);
    if (v?.category) usedCategories.add(v.category);
  });

  let html = '<div style="display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:8px;">';
  for (const cat of usedCategories) {
    const color = CATEGORY_COLORS[cat] || '#6b7280';
    const short = CATEGORY_SHORT[cat] || cat.slice(0, 3).toUpperCase();
    html += `<div style="display:flex;align-items:center;gap:4px;font-size:12px;">
      <span style="display:inline-block;width:14px;height:14px;background:${color};border-radius:3px;"></span>
      <strong>${short}</strong> ${cat}
    </div>`;
  }
  // Dead zone legend
  html += `<div style="display:flex;align-items:center;gap:4px;font-size:12px;">
    <span style="display:inline-block;width:14px;height:14px;background:${DEAD_ZONE_COLOR};border-radius:3px;opacity:0.5;border:1px dashed ${DEAD_ZONE_COLOR};"></span>
    Dead Zone
  </div>`;
  // Empty spot legend
  html += `<div style="display:flex;align-items:center;gap:4px;font-size:12px;">
    <span style="display:inline-block;width:14px;height:14px;background:${EMPTY_COLOR};border-radius:3px;opacity:0.3;border:1px dashed #64748b;"></span>
    Vacant
  </div>`;
  html += '</div>';
  return html;
}

export function exportHtml({ spots, vendors, assignments, deadZones, pricingConfig }) {
  const vendorMap = {};
  (vendors || []).forEach((v) => { vendorMap[v.id || v._id] = v; });

  const mapSvg = buildMapSvg(spots, vendors, assignments, deadZones);
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
      <td><span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:2px;margin-right:4px;"></span>${vendor.category || ''}</td>
      <td>${vendor.tier || ''}</td>
      ${priceCell}
    </tr>`;
  }

  // Unplaced vendors
  const placedIds = new Set(Object.values(assignments || {}));
  const unplaced = (vendors || []).filter((v) => !placedIds.has(v.id) && !placedIds.has(v._id));

  let unplacedHtml = '';
  if (unplaced.length > 0) {
    unplacedHtml = `<h2>Unplaced Vendors (${unplaced.length})</h2><ul style="columns:2;font-size:13px;">`;
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
      <p style="font-size:18px;font-weight:bold;">Total: $${summary.total.toLocaleString()}</p>
      <div style="display:flex;gap:40px;">
        <div><h3>By Tier</h3><ul>${Object.entries(summary.byTier).map(([t, a]) => `<li>${t}: $${a.toLocaleString()}</li>`).join('')}</ul></div>
        <div><h3>By Category</h3><ul>${Object.entries(summary.byCategory).map(([c, a]) => `<li>${c}: $${a.toLocaleString()}</li>`).join('')}</ul></div>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vendor Placement Map</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1e293b; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h3 { font-size: 13px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    .map-container { text-align: center; margin: 12px 0; }
    .print-btn { position: fixed; top: 12px; right: 12px; padding: 8px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .print-btn:hover { background: #2563eb; }
    @media print {
      .print-btn { display: none; }
      body { padding: 12px; }
    }
    @page { size: landscape; margin: 0.5in; }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  <h1>Vendor Placement Map</h1>
  <p style="color:#64748b;font-size:13px;">${assignEntries.length} assigned spots &middot; ${unplaced.length} unplaced &middot; ${(deadZones || []).length} dead zones</p>

  <div class="map-container">${mapSvg}</div>

  <h2>Legend</h2>
  ${legend}

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
