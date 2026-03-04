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
    generateFromPath,
    clearSpots,
  } = useSpots();

  const {
    placements,
    loading: placementsLoading,
    runPlacement,
    clearPlacements,
    updateAssignments,
  } = usePlacements();

  // Street path state
  const [paths, setPaths] = useState([]);
  const [streetDrawMode, setStreetDrawMode] = useState(false);
  const [streetParams, setStreetParams] = useState({ spotSizeFt: 12 });

  const [pathLabelIdx, setPathLabelIdx] = useState(0);
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  useEffect(() => {
    loadVendors();
    loadSpots();
  }, [loadVendors, loadSpots]);

  const handleClearVendors = async () => {
    await clearVendors();
    clearPlacements();
  };

  const handleToggleStreetDraw = (params) => {
    if (streetDrawMode) {
      setStreetDrawMode(false);
    } else {
      setStreetParams(params);
      setStreetDrawMode(true);
    }
  };

  const handlePathDrawn = useCallback(
    async (coords) => {
      setPaths((prev) => [...prev, coords]);
      setStreetDrawMode(false);

      const label = LABELS[pathLabelIdx % LABELS.length];
      setPathLabelIdx((prev) => prev + 1);

      await generateFromPath({
        path: coords,
        spotSizeFt: streetParams.spotSizeFt,
        spacingFt: 2,
        label,
      });
    },
    [streetParams, pathLabelIdx, generateFromPath]
  );

  const handleClearPaths = () => {
    setPaths([]);
    setPathLabelIdx(0);
  };

  const handleClearGrid = async () => {
    await clearSpots();
    setPaths([]);
    setPathLabelIdx(0);
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
            onRunPlacement={runPlacement}
            onClearVendors={handleClearVendors}
            onClearGrid={handleClearGrid}
            loading={loading}
            spotCount={spots?.features?.length || 0}
            filledCount={Object.keys(placements.assignments || {}).length}
            streetDrawMode={streetDrawMode}
            onToggleStreetDraw={handleToggleStreetDraw}
            onClearPaths={handleClearPaths}
            pathCount={paths.length}
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

      <main className="map-area">
        <MapView
          spots={spots}
          vendors={vendors}
          assignments={placements.assignments}
          selectedSpotId={selectedSpotId}
          paths={paths}
          onPathDrawn={handlePathDrawn}
          streetDrawMode={streetDrawMode}
        />
      </main>
    </div>
  );
}
