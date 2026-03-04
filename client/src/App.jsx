import React, { useEffect, useState, useCallback } from 'react';
import useVendors from './hooks/useVendors.js';
import useSpots from './hooks/useSpots.js';
import usePlacements from './hooks/usePlacements.js';
import useProjects from './hooks/useProjects.js';
import MapView from './components/Map/MapView.jsx';
import CsvUploader from './components/Vendors/CsvUploader.jsx';
import VendorTable from './components/Vendors/VendorTable.jsx';
import PlacementControls from './components/Placement/PlacementControls.jsx';
import PlacementStats from './components/Placement/PlacementStats.jsx';
import ProjectBar from './components/Projects/ProjectBar.jsx';

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
    addSingleSpot,
    setSpots: setSpotsLocal,
  } = useSpots();

  const {
    placements,
    loading: placementsLoading,
    runPlacement,
    clearPlacements,
    updateAssignments,
  } = usePlacements();

  const {
    projects,
    currentProjectId,
    loading: projectsLoading,
    loadProjects,
    loadProject,
    saveNewProject,
    saveProject,
    removeProject,
  } = useProjects();

  // Street path state
  const [paths, setPaths] = useState([]);
  const [streetDrawMode, setStreetDrawMode] = useState(false);
  const [streetParams, setStreetParams] = useState({ spotSizeFt: 12 });

  // Spot place mode (click to place individual spots)
  const [spotPlaceMode, setSpotPlaceMode] = useState(false);

  const [pathLabelIdx, setPathLabelIdx] = useState(0);
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  useEffect(() => {
    loadVendors();
    loadSpots();
    loadProjects();
  }, [loadVendors, loadSpots, loadProjects]);

  // Project handlers
  const handleLoadProject = useCallback(async (id) => {
    const data = await loadProject(id);
    if (data) {
      // Refresh all in-memory state from server (which was restored by the GET)
      await loadVendors();
      await loadSpots();
      // Restore client-only state
      setPaths(data.paths || []);
      setPathLabelIdx(data.paths?.length || 0);
      if (data.placements) {
        const raw = data.placements.assignments || {};
        updateAssignments(Array.isArray(raw) ? Object.fromEntries(raw.map((a) => [a.spotId, a.vendorId])) : raw);
      }
    }
  }, [loadProject, loadVendors, loadSpots, updateAssignments]);

  const handleSaveNewProject = useCallback(async (name) => {
    await saveNewProject({ name, paths });
  }, [saveNewProject, paths]);

  const handleSaveProject = useCallback(async (id) => {
    await saveProject(id, { paths });
  }, [saveProject, paths]);

  const handleDeleteProject = useCallback(async (id) => {
    await removeProject(id);
  }, [removeProject]);

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

  const handleSpotPlaced = useCallback(async ({ lat, lng }) => {
    await addSingleSpot({ lat, lng });
  }, [addSingleSpot]);

  const handleToggleSpotPlace = () => {
    if (spotPlaceMode) {
      setSpotPlaceMode(false);
    } else {
      setStreetDrawMode(false);
      setSpotPlaceMode(true);
    }
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

  const loading = vendorsLoading || spotsLoading || placementsLoading || projectsLoading;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Vendor Placer</h1>
          <p>Event vendor placement tool</p>
          <ProjectBar
            projects={projects}
            currentProjectId={currentProjectId}
            loading={projectsLoading}
            onLoad={handleLoadProject}
            onSaveNew={handleSaveNewProject}
            onSave={handleSaveProject}
            onDelete={handleDeleteProject}
          />
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
            spotPlaceMode={spotPlaceMode}
            onToggleSpotPlace={handleToggleSpotPlace}
            vendors={vendors}
            placements={placements}
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
          spotPlaceMode={spotPlaceMode}
          onSpotPlaced={handleSpotPlaced}
        />
      </main>
    </div>
  );
}
