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
import SpotTable from './components/Spots/SpotTable.jsx';
import WalkthroughTutorial, { STORAGE_KEY as TUTORIAL_KEY } from './components/Tutorial/WalkthroughTutorial.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

export default function App() {
  const { user, logout } = useAuth();
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
    updateSpot,
    deleteSpot,
    deleteSpotsBatch,
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
  const [streetParams, setStreetParams] = useState({ spotSizeFt: 12, spacingFt: 4 });

  // Spot place mode (click to place individual spots)
  const [spotPlaceMode, setSpotPlaceMode] = useState(false);

  // Dead zone modes
  const [deadZonePlaceMode, setDeadZonePlaceMode] = useState(false);
  const [deadZoneDrawMode, setDeadZoneDrawMode] = useState(false);

  // Move vendor state
  const [movingVendor, setMovingVendor] = useState(null);

  // Multi-select state
  const [selectedSpotIds, setSelectedSpotIds] = useState(new Set());

  const [pathLabelIdx, setPathLabelIdx] = useState(0);

  // Tutorial state
  const [tutorialActive, setTutorialActive] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY)
  );
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
        spacingFt: streetParams.spacingFt || 4,
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
    await addSingleSpot({ lat, lng, deadZone: deadZonePlaceMode || undefined });
  }, [addSingleSpot, deadZonePlaceMode]);

  const handleToggleSpotPlace = () => {
    if (spotPlaceMode) {
      setSpotPlaceMode(false);
    } else {
      setStreetDrawMode(false);
      setDeadZonePlaceMode(false);
      setDeadZoneDrawMode(false);
      setSpotPlaceMode(true);
    }
  };

  const handleToggleDeadZonePlace = () => {
    if (deadZonePlaceMode) {
      setDeadZonePlaceMode(false);
      setSpotPlaceMode(false);
    } else {
      setStreetDrawMode(false);
      setSpotPlaceMode(false);
      setDeadZoneDrawMode(false);
      setDeadZonePlaceMode(true);
      // Reuse SpotPlacer — active when deadZonePlaceMode is true
    }
  };

  const handleToggleDeadZoneDraw = () => {
    if (deadZoneDrawMode) {
      setDeadZoneDrawMode(false);
    } else {
      setStreetDrawMode(false);
      setSpotPlaceMode(false);
      setDeadZonePlaceMode(false);
      setDeadZoneDrawMode(true);
    }
  };

  const handleMarkDeadZones = useCallback(async (ids) => {
    for (const id of ids) {
      await updateSpot(id, { deadZone: true });
    }
  }, [updateSpot]);

  const handleDeadZoneDrawDone = useCallback(() => {
    setDeadZoneDrawMode(false);
  }, []);

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

  // Spot editing state
  const [editingSpotId, setEditingSpotId] = useState(null);

  const editingSpot = editingSpotId
    ? spots?.features?.find((f) => f.properties?.id === editingSpotId) || null
    : null;

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

  const handleSpotClick = useCallback((feature, event) => {
    const spotId = feature.properties?.id;

    // If moving a vendor, complete the move
    if (movingVendor && spotId) {
      const assignedVendorId = (placements.assignments || {})[spotId];
      if (!assignedVendorId && !feature.properties?.deadZone) {
        handleReassign(movingVendor.vendorId, spotId);
        setMovingVendor(null);
      }
      return;
    }

    // Shift+click for multi-select
    if (event?.shiftKey && spotId) {
      setSelectedSpotIds((prev) => {
        const next = new Set(prev);
        if (next.has(spotId)) next.delete(spotId);
        else next.add(spotId);
        return next;
      });
      return;
    }

    setEditingSpotId(spotId || null);
  }, [movingVendor, placements, handleReassign]);

  const handleSpotSave = useCallback(async (id, props) => {
    await updateSpot(id, props);
    setEditingSpotId(null);
  }, [updateSpot]);

  const handleSpotDelete = useCallback(async (id) => {
    await deleteSpot(id);
    setEditingSpotId(null);
  }, [deleteSpot]);

  const handleSpotEditClose = useCallback(() => {
    setEditingSpotId(null);
  }, []);

  // Externally set editing spot (e.g. from SpotTable)
  const handleEditSpotById = useCallback((id) => {
    setEditingSpotId(id);
  }, []);

  const handleStartMove = useCallback((spotId) => {
    const vendorId = (placements.assignments || {})[spotId];
    if (!vendorId) return;
    setMovingVendor({ vendorId, sourceSpotId: spotId });
    setEditingSpotId(null);
  }, [placements]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedSpotIds.size === 0) return;
    await deleteSpotsBatch([...selectedSpotIds]);
    setSelectedSpotIds(new Set());
  }, [selectedSpotIds, deleteSpotsBatch]);

  // Escape key: cancel move mode and multi-select
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMovingVendor(null);
        setSelectedSpotIds(new Set());
        setDeadZonePlaceMode(false);
        setDeadZoneDrawMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loading = vendorsLoading || spotsLoading || placementsLoading || projectsLoading;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0 }}>Vendor Placer</h1>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => { localStorage.removeItem(TUTORIAL_KEY); setTutorialActive(true); }}
                title="Show tutorial"
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: '1px solid #475569',
                  background: '#1e293b', color: '#94a3b8', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ?
              </button>
              <button
                onClick={logout}
                title="Logout"
                style={{
                  padding: '4px 10px', borderRadius: 4, border: '1px solid #475569',
                  background: '#1e293b', color: '#94a3b8', fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            {user?.email || 'Event vendor placement tool'}
          </p>
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
            deadZonePlaceMode={deadZonePlaceMode}
            onToggleDeadZonePlace={handleToggleDeadZonePlace}
            deadZoneDrawMode={deadZoneDrawMode}
            onToggleDeadZoneDraw={handleToggleDeadZoneDraw}
            selectedSpotIds={selectedSpotIds}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>

        <div className="sidebar-section">
          <h3>Placement Results</h3>
          <PlacementStats placements={placements} vendors={vendors} />
        </div>

        <div className="sidebar-section">
          <h3>Spots</h3>
          <SpotTable
            spots={spots}
            vendors={vendors}
            assignments={placements.assignments}
            onEditSpot={handleEditSpotById}
          />
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
          selectedSpotId={editingSpotId || selectedSpotId}
          paths={paths}
          onPathDrawn={handlePathDrawn}
          streetDrawMode={streetDrawMode}
          spotPlaceMode={spotPlaceMode || deadZonePlaceMode}
          onSpotPlaced={handleSpotPlaced}
          onSpotClick={handleSpotClick}
          editingSpot={editingSpot}
          onSpotSave={handleSpotSave}
          onSpotDelete={handleSpotDelete}
          onSpotEditClose={handleSpotEditClose}
          movingVendor={movingVendor}
          selectedSpotIds={selectedSpotIds}
          deadZoneDrawMode={deadZoneDrawMode}
          onMarkDeadZones={handleMarkDeadZones}
          onDeadZoneDrawDone={handleDeadZoneDrawDone}
          onStartMove={handleStartMove}
        />
      </main>

      <WalkthroughTutorial
        active={tutorialActive}
        onComplete={() => setTutorialActive(false)}
      />
    </div>
  );
}
