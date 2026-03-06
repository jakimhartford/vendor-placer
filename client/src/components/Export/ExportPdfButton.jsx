import React, { useState } from 'react';
import { exportHtml } from '../../utils/exportHtml.js';

export default function ExportPdfButton({ mapRef, spots, vendors, assignments, deadZones, pricingConfig }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      const mapContainer = mapRef?.current?.querySelector?.('.leaflet-container') || mapRef?.current;
      await exportHtml({ mapContainer, spots, vendors, assignments, deadZones, pricingConfig });
    } catch (err) {
      console.error('Export error:', err);
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
      {generating ? 'Generating...' : 'Export Map'}
    </button>
  );
}
