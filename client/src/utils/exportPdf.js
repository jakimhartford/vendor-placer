import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { calculateSpotPrice, calculateRevenueSummary } from './pricing.js';

export async function exportPdf({ mapContainer, spots, vendors, assignments, pricingConfig }) {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Page 1: Map image
  if (mapContainer) {
    try {
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgW = pageW - 20;
      const imgH = (canvas.height / canvas.width) * imgW;
      pdf.addImage(imgData, 'PNG', 10, 10, imgW, Math.min(imgH, pageH - 20));
    } catch {
      pdf.setFontSize(14);
      pdf.text('Map capture failed', 10, 20);
    }
  }

  // Page 2: Vendor assignment table
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Vendor Assignments', 10, 15);

  const vendorMap = {};
  (vendors || []).forEach((v) => { vendorMap[v.id] = v; });

  const spotLabelMap = {};
  (spots?.features || []).forEach((f) => {
    if (f.properties?.id) {
      spotLabelMap[f.properties.id] = f.properties;
    }
  });

  // Table header
  const cols = ['Spot', 'Vendor', 'Category', 'Tier'];
  if (pricingConfig) cols.push('Price');
  const colX = [10, 45, 110, 155, 190];
  let y = 25;

  pdf.setFontSize(9);
  pdf.setFont(undefined, 'bold');
  cols.forEach((col, i) => pdf.text(col, colX[i], y));
  y += 6;
  pdf.setFont(undefined, 'normal');

  // Table rows
  const assignEntries = Object.entries(assignments || {});
  for (const [spotId, vendorId] of assignEntries) {
    if (y > pageH - 15) {
      pdf.addPage();
      y = 15;
      pdf.setFont(undefined, 'bold');
      cols.forEach((col, i) => pdf.text(col, colX[i], y));
      y += 6;
      pdf.setFont(undefined, 'normal');
    }
    const spotProps = spotLabelMap[spotId] || {};
    const vendor = vendorMap[vendorId];
    if (!vendor) continue;

    pdf.text(spotProps.label || spotId.slice(0, 8), colX[0], y);
    pdf.text(vendor.name || '', colX[1], y);
    pdf.text(vendor.category || '', colX[2], y);
    pdf.text(vendor.tier || '', colX[3], y);
    if (pricingConfig) {
      const price = calculateSpotPrice(spotProps, vendor, pricingConfig);
      pdf.text(`$${price}`, colX[4], y);
    }
    y += 5;
  }

  // Page 3: Legend + Revenue Summary
  if (pricingConfig) {
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Revenue Summary', 10, 15);

    const summary = calculateRevenueSummary(spots, vendors, assignments, pricingConfig);
    pdf.setFontSize(12);
    pdf.text(`Total Revenue: $${summary.total.toLocaleString()}`, 10, 28);

    let ry = 38;
    pdf.setFontSize(10);
    pdf.text('By Tier:', 10, ry);
    ry += 6;
    for (const [tier, amount] of Object.entries(summary.byTier)) {
      pdf.text(`  ${tier}: $${amount.toLocaleString()}`, 10, ry);
      ry += 5;
    }

    ry += 4;
    pdf.text('By Category:', 10, ry);
    ry += 6;
    for (const [cat, amount] of Object.entries(summary.byCategory)) {
      pdf.text(`  ${cat}: $${amount.toLocaleString()}`, 10, ry);
      ry += 5;
    }
  }

  // Legend page
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Legend', 10, 15);
  pdf.setFontSize(10);
  let ly = 25;
  const legendItems = [
    ['Green', 'Filled spot'],
    ['Yellow', 'Vacant spot'],
    ['Red', 'Dead zone'],
    ['Purple', 'Premium spot'],
    ['Blue', 'Corner spot'],
  ];
  for (const [color, desc] of legendItems) {
    pdf.text(`${color}: ${desc}`, 10, ly);
    ly += 6;
  }

  // Unplaced vendors
  const unplacedVendors = (vendors || []).filter(
    (v) => !Object.values(assignments || {}).includes(v.id)
  );
  if (unplacedVendors.length > 0) {
    ly += 6;
    pdf.setFontSize(12);
    pdf.text(`Unplaced Vendors (${unplacedVendors.length})`, 10, ly);
    ly += 6;
    pdf.setFontSize(9);
    for (const v of unplacedVendors) {
      if (ly > pageH - 10) { pdf.addPage(); ly = 15; }
      pdf.text(`${v.name} (${v.category}, ${v.tier})`, 10, ly);
      ly += 5;
    }
  }

  pdf.save('vendor-placement.pdf');
}
