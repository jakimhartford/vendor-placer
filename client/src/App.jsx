import React, { useEffect, useState, useCallback } from 'react';
import useVendors from './hooks/useVendors.js';
import useSpots from './hooks/useSpots.js';
import usePlacements from './hooks/usePlacements.js';
import MapView from './components/Map/MapView.jsx';
import CsvUploader from './components/Vendors/CsvUploader.jsx';
import VendorTable from './components/Vendors/VendorTable.jsx';
import PlacementControls from './components/Placement/PlacementControls.jsx';
import PlacementStats from './components/Placement/PlacementStats.jsx';

export default function App() {
  const {
    vendors,
    loading: vendorsLoading,
    error: vendorsError,
    loadVendors,
    uploadCsv,
    clearAll: clearVendors,
  } = useVendors();

  const {
    spots,
    loading: spotsLoading,
    loadSpots,
    generateGrid,
    clearSpots,
  } = useSpots();

  const {
    placements,
    loading: placementsLoading,
    runPlacement,
    clearPlacements,
    updateAssignments,
  } = usePlacements();

  // Load initial data
  useEffect(() => {
    loadVendors();
    loadSpots();
  }, [loadVendors, loadSpots]);

  const handleClearVendors = async () => {
    await clearVendors();
    clearPlacements();
  };

  const handleClearGrid = async () => {
    await clearSpots();
    clearPlacements();
  };

  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const selectedSpotId = selectedVendorId
    ? Object.entries(placements.assignments || {}).find(
        ([, vid]) => vid === selectedVendorId
      )?.[0] || null
    : null;

  const handleSelectVendor = useCallback((vendorId) => {
    setSelectedVendorId((prev) => (prev === vendorId ? null : vendorId));
  }, []);

  const handleReassign = useCallback((vendorId, newSpotId) => {
    const current = { ...(placements.assignments || {}) };
    for (const [spotId, vid] of Object.entries(current)) {
      if (vid === vendorId) {
        delete current[spotId];
        break;
      }
    }
    current[newSpotId] = vendorId;
    updateAssignments(current);
  }, [placements, updateAssignments]);

  const loading = vendorsLoading || spotsLoading || placementsLoading;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Vendor Placer</h1>
          <p>Event vendor placement tool</p>
        </div>

        <div className="sidebar-section">
          <h3>Upload Vendors</h3>
          <CsvUploader onUpload={uploadCsv} loading={vendorsLoading} />
          {vendorsError && <p className="error-msg">{vendorsError}</p>}
        </div>

        <div className="sidebar-section">
          <h3>Actions</h3>
          <PlacementControls
            onGenerateGrid={generateGrid}
            onRunPlacement={runPlacement}
            onClearVendors={handleClearVendors}
            onClearGrid={handleClearGrid}
            loading={loading}
            spotCount={spots?.features?.length || 0}
            filledCount={Object.keys(placements.assignments || {}).length}
          />
        </div>

        <div className="sidebar-section">
          <h3>Placement Results</h3>
          <PlacementStats placements={placements} vendors={vendors} />
        </div>

        <div className="sidebar-section">
          <h3>Vendors</h3>
          <VendorTable
            vendors={vendors}
            assignments={placements.assignments}
            spots={spots}
            onSelectVendor={handleSelectVendor}
            onReassign={handleReassign}
          />
        </div>
      </aside>

      {/* Map */}
      <main className="map-area">
        <MapView
          spots={spots}
          vendors={vendors}
          assignments={placements.assignments}
          selectedSpotId={selectedSpotId}
        />
      </main>
    </div>
  );
}
