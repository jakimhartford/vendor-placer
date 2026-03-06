import React, { useEffect, useState, useCallback, useRef } from 'react';
import useVendors from './hooks/useVendors.js';
import useSpots from './hooks/useSpots.js';
import usePlacements from './hooks/usePlacements.js';
import useProjects from './hooks/useProjects.js';
import useDeadZones from './hooks/useDeadZones.js';
import useUndoRedo from './hooks/useUndoRedo.js';
import MapView from './components/Map/MapView.jsx';
import CsvUploader from './components/Vendors/CsvUploader.jsx';
import VendorTable from './components/Vendors/VendorTable.jsx';
import PlacementControls from './components/Placement/PlacementControls.jsx';
import PlacementStats from './components/Placement/PlacementStats.jsx';
import ProjectBar from './components/Projects/ProjectBar.jsx';
import SpotTable from './components/Spots/SpotTable.jsx';
import PricingConfig from './components/Revenue/PricingConfig.jsx';
import RevenueSummary from './components/Revenue/RevenueSummary.jsx';
import useAmenities from './hooks/useAmenities.js';
import useMapZones from './hooks/useMapZones.js';
import useLogistics from './hooks/useLogistics.js';
import { ELEMENT_CATALOG } from './components/Placement/elementCatalog.js';
import LogisticsPanel from './components/Logistics/LogisticsPanel.jsx';
import ExportPdfButton from './components/Export/ExportPdfButton.jsx';
import WalkthroughTutorial, { STORAGE_KEY as TUTORIAL_KEY } from './components/Tutorial/WalkthroughTutorial.jsx';
import { saveSpots as apiSaveSpots } from './api/index.js';
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
    updateVendor,
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
    updateSpotsBatch,
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
    versions,
    activeVersionId,
    saveVersion,
    loadVersionData,
  } = useProjects();

  const {
    deadZones,
    loadDeadZones,
    addDeadZone,
    removeDeadZone,
    clearAll: clearDeadZones,
    setDeadZones,
    updateDeadZone,
  } = useDeadZones();

  const {
    amenities,
    loadAmenities,
    addAmenity,
    removeAmenity,
    clearAll: clearAmenities,
    setAmenities,
  } = useAmenities();

  const {
    mapZones,
    loadMapZones,
    addMapZone,
    updateMapZone,
    removeMapZone,
    clearAll: clearMapZones,
    setMapZones,
  } = useMapZones();

  const {
    accessPoints,
    timeWindows,
    loadLogistics,
    addAccessPoint,
    removeAccessPoint,
    addTimeWindow,
    removeTimeWindow,
    setAccessPoints,
    setTimeWindows,
  } = useLogistics();

  // Street path state (must be before captureSnapshot which references paths)
  const [paths, setPaths] = useState([]);
  const [pathLabelIdx, setPathLabelIdx] = useState(0);

  const {
    pushState,
    undo: undoState,
    redo: redoState,
    markUndone,
    markRedone,
    canUndo,
    canRedo,
  } = useUndoRedo();

  const captureSnapshot = useCallback(() => ({
    spots: spots ? JSON.parse(JSON.stringify(spots)) : null,
    assignments: placements.assignments ? { ...placements.assignments } : {},
    deadZones: deadZones ? JSON.parse(JSON.stringify(deadZones)) : [],
    paths: JSON.parse(JSON.stringify(paths)),
    mapZones: mapZones ? JSON.parse(JSON.stringify(mapZones)) : [],
  }), [spots, placements.assignments, deadZones, paths, mapZones]);

  const restoreSnapshot = useCallback((snapshot) => {
    if (snapshot.spots) {
      setSpotsLocal(snapshot.spots);
      apiSaveSpots(snapshot.spots).catch(() => {});
    }
    if (snapshot.assignments) updateAssignments(snapshot.assignments);
    if (snapshot.deadZones) setDeadZones(snapshot.deadZones);
    if (snapshot.mapZones) setMapZones(snapshot.mapZones);
    if (snapshot.paths) {
      setPaths(snapshot.paths);
      setPathLabelIdx(snapshot.paths.length);
    }
  }, [setSpotsLocal, updateAssignments, setDeadZones, setMapZones]);

  const handleUndo = useCallback(() => {
    const current = captureSnapshot();
    const prev = undoState();
    if (prev) {
      markUndone(current);
      restoreSnapshot(prev);
    }
  }, [captureSnapshot, undoState, markUndone, restoreSnapshot]);

  const handleRedo = useCallback(() => {
    const current = captureSnapshot();
    const next = redoState();
    if (next) {
      markRedone(current);
      restoreSnapshot(next);
    }
  }, [captureSnapshot, redoState, markRedone, restoreSnapshot]);

  const mapRef = useRef(null);

  // Project settings
  const [projectSettings, setProjectSettings] = useState({
    noSameAdjacentCategories: ['art', 'craft', 'jewelry', 'clothing'],
  });

  // Pricing config
  const [pricingConfig, setPricingConfig] = useState(null);

  const [streetDrawMode, setStreetDrawMode] = useState(false);
  const [streetParams, setStreetParams] = useState({ spotSizeFt: 12, spacingFt: 4 });

  // Spot place mode (click to place individual spots)
  const [spotPlaceMode, setSpotPlaceMode] = useState(false);

  // Element palette state (replaces individual mode states)
  const [activeElement, setActiveElement] = useState(null);
  const [amenitiesVisible, setAmenitiesVisible] = useState(true);
  const [mapZonesVisible, setMapZonesVisible] = useState(true);

  // Derive legacy booleans from activeElement so MapView/placers/drawers need zero changes
  const activeElementDef = activeElement ? ELEMENT_CATALOG.find((e) => e.id === activeElement) : null;
  const deadZoneDrawMode = activeElement === 'dead_zone';
  const amenityPlaceMode = !!activeElementDef?.amenityType;
  const amenityType = activeElementDef?.amenityType || 'power';
  const accessPointPlaceMode = activeElement === 'access_point';
  const mapZoneDrawMode = !!activeElementDef?.zoneType;
  const mapZoneType = activeElementDef?.zoneType || 'barricade';

  // Move vendor state
  const [movingVendor, setMovingVendor] = useState(null);

  // Multi-select state
  const [selectedSpotIds, setSelectedSpotIds] = useState(new Set());

  // Tutorial state
  const [tutorialActive, setTutorialActive] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY)
  );
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  useEffect(() => {
    loadVendors();
    loadSpots();
    loadProjects();
    loadDeadZones();
    loadAmenities();
    loadMapZones();
    loadLogistics();
  }, [loadVendors, loadSpots, loadProjects, loadDeadZones, loadAmenities, loadMapZones, loadLogistics]);

  // Project handlers
  const handleLoadProject = useCallback(async (id) => {
    const data = await loadProject(id);
    if (data) {
      await loadVendors();
      await loadSpots();
      await loadDeadZones();
      await loadAmenities();
      await loadMapZones();
      await loadLogistics();
      setPaths(data.paths || []);
      setPathLabelIdx(data.paths?.length || 0);
      if (data.settings) {
        setProjectSettings(data.settings);
        setPricingConfig(data.settings.pricingConfig || null);
      }
      if (data.placements) {
        const raw = data.placements.assignments || {};
        updateAssignments(Array.isArray(raw) ? Object.fromEntries(raw.map((a) => [a.spotId, a.vendorId])) : raw);
      }
    }
  }, [loadProject, loadVendors, loadSpots, loadDeadZones, loadAmenities, loadMapZones, loadLogistics, updateAssignments]);

  const handleSaveNewProject = useCallback(async (name) => {
    const settings = { ...projectSettings, pricingConfig };
    await saveNewProject({ name, paths, settings });
  }, [saveNewProject, paths, projectSettings, pricingConfig]);

  const handleSaveProject = useCallback(async (id) => {
    const settings = { ...projectSettings, pricingConfig };
    await saveProject(id, { paths, settings });
  }, [saveProject, paths, projectSettings, pricingConfig]);

  const handleDeleteProject = useCallback(async (id) => {
    await removeProject(id);
  }, [removeProject]);

  const handleSaveVersion = useCallback(async (name) => {
    await saveVersion(name);
  }, [saveVersion]);

  const handleLoadVersion = useCallback(async (versionId) => {
    const data = await loadVersionData(versionId);
    if (data) {
      await loadVendors();
      await loadSpots();
      await loadDeadZones();
      setPaths(data.paths || []);
      setPathLabelIdx(data.paths?.length || 0);
      if (data.settings) {
        setProjectSettings(data.settings);
        setPricingConfig(data.settings.pricingConfig || null);
      }
      if (data.placements) {
        const raw = data.placements.assignments || {};
        updateAssignments(Array.isArray(raw) ? Object.fromEntries(raw.map((a) => [a.spotId, a.vendorId])) : raw);
      }
    }
  }, [loadVersionData, loadVendors, loadSpots, loadDeadZones, updateAssignments]);

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
      setSpotPlaceMode(false);
      setActiveElement(null);
    }
  };

  const handlePathDrawn = useCallback(
    async (coords) => {
      pushState(captureSnapshot());
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
    pushState(captureSnapshot());
    await addSingleSpot({ lat, lng });
  }, [addSingleSpot, pushState, captureSnapshot]);

  const handleToggleSpotPlace = () => {
    if (spotPlaceMode) {
      setSpotPlaceMode(false);
    } else {
      setStreetDrawMode(false);
      setActiveElement(null);
      setSpotPlaceMode(true);
    }
  };

  // Element palette selection handler
  const handleSelectElement = useCallback((elementId) => {
    if (elementId) {
      setStreetDrawMode(false);
      setSpotPlaceMode(false);
    }
    setActiveElement(elementId);
  }, []);

  const handleAddDeadZone = useCallback(async (polygon) => {
    pushState(captureSnapshot());
    const result = await addDeadZone(polygon);
    if (result?.spotsGeoJSON) {
      setSpotsLocal(result.spotsGeoJSON);
    }
  }, [addDeadZone, setSpotsLocal, pushState, captureSnapshot]);

  const handleDeadZoneDrawDone = useCallback(() => {
    setActiveElement(null);
  }, []);

  const handleUpdateDeadZone = useCallback(async (id, data) => {
    pushState(captureSnapshot());
    const result = await updateDeadZone(id, data);
    if (result?.spotsGeoJSON) {
      setSpotsLocal(result.spotsGeoJSON);
    }
  }, [updateDeadZone, setSpotsLocal, pushState, captureSnapshot]);

  const handleAddMapZone = useCallback(async (zoneData) => {
    pushState(captureSnapshot());
    await addMapZone(zoneData);
  }, [addMapZone, pushState, captureSnapshot]);

  const handleUpdateMapZone = useCallback(async (id, data) => {
    pushState(captureSnapshot());
    await updateMapZone(id, data);
  }, [updateMapZone, pushState, captureSnapshot]);

  const handleMapZoneDrawDone = useCallback(() => {
    setActiveElement(null);
  }, []);

  const handleClearGrid = async () => {
    pushState(captureSnapshot());
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
    pushState(captureSnapshot());
    const current = { ...(placements.assignments || {}) };
    for (const [spotId, vid] of Object.entries(current)) {
      if (vid === vendorId) {
        delete current[spotId];
        break;
      }
    }
    current[newSpotId] = vendorId;
    updateAssignments(current);
  }, [placements, updateAssignments, pushState, captureSnapshot]);

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
    pushState(captureSnapshot());
    await updateSpot(id, props);
    setEditingSpotId(null);
  }, [updateSpot, pushState, captureSnapshot]);

  const handleSpotDelete = useCallback(async (id) => {
    pushState(captureSnapshot());
    await deleteSpot(id);
    setEditingSpotId(null);
  }, [deleteSpot, pushState, captureSnapshot]);

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
    pushState(captureSnapshot());
    await deleteSpotsBatch([...selectedSpotIds]);
    setSelectedSpotIds(new Set());
  }, [selectedSpotIds, deleteSpotsBatch, pushState, captureSnapshot]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMovingVendor(null);
        setSelectedSpotIds(new Set());
        setActiveElement(null);
      }
      // Undo: Cmd/Ctrl+Z (without Shift)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

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
            versions={versions}
            activeVersionId={activeVersionId}
            onLoadVersion={handleLoadVersion}
            onSaveVersion={handleSaveVersion}
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
            onRunPlacement={(settings) => { pushState(captureSnapshot()); runPlacement(settings); }}
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
            selectedSpotIds={selectedSpotIds}
            onDeleteSelected={handleDeleteSelected}
            projectSettings={projectSettings}
            onSettingsChange={setProjectSettings}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            activeElement={activeElement}
            onSelectElement={handleSelectElement}
            amenitiesVisible={amenitiesVisible}
            onToggleAmenitiesVisible={() => setAmenitiesVisible((v) => !v)}
            amenityCount={amenities.length}
            onClearAmenities={clearAmenities}
            accessPointCount={accessPoints.length}
            mapZonesVisible={mapZonesVisible}
            onToggleMapZonesVisible={() => setMapZonesVisible((v) => !v)}
            mapZoneCount={mapZones.length}
            onClearMapZones={clearMapZones}
            deadZoneCount={deadZones?.length || 0}
            onClearDeadZones={clearDeadZones}
          />
        </div>

        <div className="sidebar-section">
          <h3>Results & Export</h3>
          <PlacementStats placements={placements} vendors={vendors} />
          <ExportPdfButton
            mapRef={mapRef}
            spots={spots}
            vendors={vendors}
            assignments={placements.assignments}
            pricingConfig={pricingConfig}
          />
        </div>

        <div className="sidebar-section" data-tour="pricing-revenue">
          <h3>Pricing & Revenue</h3>
          <PricingConfig config={pricingConfig} onChange={setPricingConfig} />
          <RevenueSummary
            spots={spots}
            vendors={vendors}
            assignments={placements.assignments}
            pricingConfig={pricingConfig}
          />
        </div>

        <div className="sidebar-section" data-tour="logistics">
          <h3>Logistics</h3>
          <LogisticsPanel
            accessPoints={accessPoints}
            timeWindows={timeWindows}
            onAddTimeWindow={addTimeWindow}
            onDeleteTimeWindow={removeTimeWindow}
          />
        </div>

        <div className="sidebar-section">
          <h3>Spots</h3>
          <SpotTable
            spots={spots}
            vendors={vendors}
            assignments={placements.assignments}
            onEditSpot={handleEditSpotById}
            pricingConfig={pricingConfig}
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
            currentProjectId={currentProjectId}
            onUpdateVendor={updateVendor}
          />
        </div>
      </aside>

      <main className="map-area">
        <MapView
          mapContainerRef={mapRef}
          spots={spots}
          vendors={vendors}
          assignments={placements.assignments}
          selectedSpotId={editingSpotId || selectedSpotId}
          paths={paths}
          onPathDrawn={handlePathDrawn}
          streetDrawMode={streetDrawMode}
          spotPlaceMode={spotPlaceMode}
          onSpotPlaced={handleSpotPlaced}
          onSpotClick={handleSpotClick}
          editingSpot={editingSpot}
          onSpotSave={handleSpotSave}
          onSpotDelete={handleSpotDelete}
          onSpotEditClose={handleSpotEditClose}
          movingVendor={movingVendor}
          selectedSpotIds={selectedSpotIds}
          deadZones={deadZones}
          deadZoneDrawMode={deadZoneDrawMode}
          onAddDeadZone={handleAddDeadZone}
          onRemoveDeadZone={removeDeadZone}
          onDeadZoneDrawDone={handleDeadZoneDrawDone}
          onStartMove={handleStartMove}
          onUpdateDeadZone={handleUpdateDeadZone}
          currentProjectId={currentProjectId}
          pricingConfig={pricingConfig}
          amenities={amenities}
          amenityPlaceMode={amenityPlaceMode}
          amenityType={amenityType}
          onPlaceAmenity={async (data) => { await addAmenity(data); }}
          onDeleteAmenity={removeAmenity}
          amenitiesVisible={amenitiesVisible}
          accessPoints={accessPoints}
          accessPointPlaceMode={accessPointPlaceMode}
          onPlaceAccessPoint={async (data) => { await addAccessPoint(data); setActiveElement(null); }}
          onDeleteAccessPoint={removeAccessPoint}
          mapZones={mapZones}
          mapZoneDrawMode={mapZoneDrawMode}
          mapZoneType={mapZoneType}
          onAddMapZone={handleAddMapZone}
          onDeleteMapZone={removeMapZone}
          onUpdateMapZone={handleUpdateMapZone}
          onMapZoneDrawDone={handleMapZoneDrawDone}
          mapZonesVisible={mapZonesVisible}
        />
      </main>

      <WalkthroughTutorial
        active={tutorialActive}
        onComplete={() => setTutorialActive(false)}
      />
    </div>
  );
}
