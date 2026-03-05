import React, { useState } from 'react';
import { exportPdf } from '../../utils/exportPdf.js';

export default function ExportPdfButton({ mapRef, spots, vendors, assignments, pricingConfig }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      const mapContainer = mapRef?.current?.querySelector?.('.leaflet-container') || mapRef?.current;
      await exportPdf({ mapContainer, spots, vendors, assignments, pricingConfig });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleExport}
      disabled={generating}
      data-tour="export-pdf"
      style={{ fontSize: 11, padding: '6px 10px' }}
    >
      {generating ? 'Generating...' : 'Export PDF'}
    </button>
  );
}
