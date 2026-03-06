import React from 'react';
import { exportHtml } from '../../utils/exportHtml.js';

export default function ExportPdfButton({ spots, vendors, assignments, deadZones, pricingConfig }) {
  const handleExport = () => {
    exportHtml({ spots, vendors, assignments, deadZones, pricingConfig });
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleExport}
      data-tour="export-pdf"
      style={{ fontSize: 11, padding: '6px 10px' }}
    >
      Export Map
    </button>
  );
}
