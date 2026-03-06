import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useVendors from './hooks/useVendors.js';
import useSpots from './hooks/useSpots.js';
import usePlacements from './hooks/usePlacements.js';
import useLayouts from './hooks/useLayouts.js';
import useDeadZones from './hooks/useDeadZones.js';
import useUndoRedo from './hooks/useUndoRedo.js';
import MapView from './components/Map/MapView.jsx';
import CsvUploader from './components/Vendors/CsvUploader.jsx';
import VendorTable from './components/Vendors/VendorTable.jsx';
import CollapsibleSection from './components/Vendors/CollapsibleSection.jsx';
import PlacementControls from './components/Placement/PlacementControls.jsx';
import PlacementStats from './components/Placement/PlacementStats.jsx';
import SpotTable from './components/Spots/SpotTable.jsx';
import PricingConfig from './components/Revenue/PricingConfig.jsx';
import RevenueSummary from './components/Revenue/RevenueSummary.jsx';
import useAmenities from './hooks/useAmenities.js';
import useMapZones from './hooks/useMapZones.js';
import useLogistics from './hooks/useLogistics.js';
import { ELEMENT_CATALOG } from './components/Placement/elementCatalog.js';
import LogisticsPanel from './components/Logistics/LogisticsPanel.jsx';
import ExportPdfButton from './components/Export/ExportPdfButton.jsx';
import VendorPortalConfig from './components/Vendors/VendorPortalConfig.jsx';
import WalkthroughTutorial, { STORAGE_KEY as TUTORIAL_KEY } from './components/Tutorial/WalkthroughTutorial.jsx';
import { saveSpots as apiSaveSpots, fetchEvent } from './api/index.js';
import { useAuth } from './contexts/AuthContext.jsx';

export default function App() {
  const { eventId, layoutId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [eventData, setEventData] = useState(null);

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
    layouts,
    currentLayoutId,
    loading: layoutsLoading,
    loadLayouts,
    loadLayout,
    saveNewLayout,
    saveLayout,
    duplicate: duplicateLayout,
    removeLayout,
    setCurrentLayoutId,
  } = useLayouts(eventId);

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

  // Street path state
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

  // Project settings (from event)
  const [projectSettings, setProjectSettings] = useState({
    noSameAdjacentCategories: ['art', 'craft', 'jewelry', 'clothing'],
  });

  // Pricing config
  const [pricingConfig, setPricingConfig] = useState(null);

  // Vendor portal config
  const [portalConfig, setPortalConfig] = useState(null);

  const [streetDrawMode, setStreetDrawMode] = useState(false);
  const [streetParams, setStreetParams] = useState({ spotSizeFt: 12, spacingFt: 4 });
  const [spotPlaceMode, setSpotPlaceMode] = useState(false);
  const [activeElement, setActiveElement] = useState(null);
  const [amenitiesVisible, setAmenitiesVisible] = useState(true);
  const [mapZonesVisible, setMapZonesVisible] = useState(true);

  const activeElementDef = activeElement ? ELEMENT_CATALOG.find((e) => e.id === activeElement) : null;
  const deadZoneDrawMode = activeElement === 'dead_zone';
  const amenityPlaceMode = !!activeElementDef?.amenityType;
  const amenityType = activeElementDef?.amenityType || 'power';
  const accessPointPlaceMode = activeElement === 'access_point';
  const mapZoneDrawMode = !!activeElementDef?.zoneType;
  const mapZoneType = activeElementDef?.zoneType || 'barricade';

  const [movingVendor, setMovingVendor] = useState(null);
  const [selectedSpotIds, setSelectedSpotIds] = useState(new Set());

  const [tutorialActive, setTutorialActive] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY)
  );
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Load event + layout on mount
  useEffect(() => {
    if (!eventId) return;

    const init = async () => {
      try {
        const ev = await fetchEvent(eventId);
        setEventData(ev);
        if (ev.settings) {
          setProjectSettings(ev.settings);
          setPricingConfig(ev.settings.pricingConfig || null);
        }
        if (ev.vendorPortal) {
          setPortalConfig(ev.vendorPortal);
        }
      } catch {
        // event load failed
      }

      if (layoutId) {
        const data = await loadLayout(layoutId, eventId);
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
          if (data.vendorPortal) {
            setPortalConfig(data.vendorPortal);
          }
          if (data.placements) {
            const raw = data.placements.assignments || {};
            updateAssignments(Array.isArray(raw) ? Object.fromEntries(raw.map((a) => [a.spotId, a.vendorId])) : raw);
          }
        }
      } else {
        // No layout selected, load session data
        loadVendors();
        loadSpots();
        loadDeadZones();
        loadAmenities();
        loadMapZones();
        loadLogistics();
      }

      loadLayouts(eventId);
    };
    init();
  }, [eventId, layoutId]);

  // Layout handlers
  const handleLoadLayout = useCallback(async (lid) => {
    navigate(`/events/${eventId}/layouts/${lid}`);
  }, [eventId, navigate]);

  const handleSaveNewLayout = useCallback(async (name) => {
    const result = await saveNewLayout({ name, paths }, eventId);
    if (result) {
      navigate(`/events/${eventId}/layouts/${result.id}`);
    }
  }, [saveNewLayout, paths, eventId, navigate]);

  const handleSaveLayout = useCallback(async (lid) => {
    const settings = { ...projectSettings, pricingConfig };
    await saveLayout(lid, { paths, settings }, eventId);
  }, [saveLayout, paths, projectSettings, pricingConfig, eventId]);

  const handleDeleteLayout = useCallback(async (lid) => {
    await removeLayout(lid, eventId);
    if (lid === layoutId) {
      navigate(`/events/${eventId}`);
    }
  }, [removeLayout, eventId, layoutId, navigate]);

  const handleDuplicateLayout = useCallback(async (lid) => {
    const result = await duplicateLayout(lid, eventId);
    if (result) {
      navigate(`/events/${eventId}/layouts/${result.id}`);
    }
  }, [duplicateLayout, eventId, navigate]);

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

    if (movingVendor && spotId) {
      const assignedVendorId = (placements.assignments || {})[spotId];
      if (!assignedVendorId && !feature.properties?.deadZone) {
        handleReassign(movingVendor.vendorId, spotId);
        setMovingVendor(null);
      }
      return;
    }

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
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const loading = vendorsLoading || spotsLoading || placementsLoading || layoutsLoading;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0, fontSize: 16 }}>
              <span
                style={{ color: '#3b82f6', cursor: 'pointer' }}
                onClick={() => navigate('/events')}
                title="All Events"
              >
                Events
              </span>
              {' / '}
              <span
                style={{ color: '#3b82f6', cursor: 'pointer' }}
                onClick={() => navigate(`/events/${eventId}`)}
                title="Event Dashboard"
              >
                {eventData?.name || 'Event'}
              </span>
            </h1>
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
              <span
                onClick={() => navigate('/help')}
                title="Help Center"
                style={{
                  fontSize: 11, color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                Help
              </span>
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

          {/* Layout selector bar */}
          <div style={{ marginTop: 8, marginBottom: 4 }} data-tour="project-bar">
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
              <select
                value={layoutId || ''}
                onChange={(e) => { if (e.target.value) handleLoadLayout(e.target.value); }}
                disabled={loading}
                style={{
                  flex: 1, padding: '5px 8px', fontSize: 12,
                  background: '#16213e', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4,
                }}
              >
                <option value="">-- Select Layout --</option>
                {layouts.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>

              {layoutId && (
                <>
                  <button
                    className="btn btn-primary"
                    disabled={loading}
                    onClick={() => handleSaveLayout(layoutId)}
                    style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={loading}
                    onClick={() => handleDuplicateLayout(layoutId)}
                    style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
                    title="Duplicate layout"
                  >
                    Dup
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={loading}
                    onClick={() => { if (confirm('Delete this layout?')) handleDeleteLayout(layoutId); }}
                    style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
                  >
                    Del
                  </button>
                </>
              )}
            </div>

            {/* New layout button */}
            <NewLayoutButton
              loading={loading}
              onSave={handleSaveNewLayout}
            />
          </div>

          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            {user?.email || 'Event vendor placement tool'}
          </p>
        </div>

        <CollapsibleSection title="Upload Vendors">
          <CsvUploader onUpload={uploadCsv} loading={vendorsLoading} />
          {vendorsError && <p className="error-msg">{vendorsError}</p>}
        </CollapsibleSection>

        <CollapsibleSection title="Actions">
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
        </CollapsibleSection>

        <CollapsibleSection title="Results & Export">
          <PlacementStats placements={placements} vendors={vendors} />
          <ExportPdfButton
            mapRef={mapRef}
            spots={spots}
            vendors={vendors}
            assignments={placements.assignments}
            pricingConfig={pricingConfig}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Pricing & Revenue" dataTour="pricing-revenue">
          <PricingConfig config={pricingConfig} onChange={setPricingConfig} />
          <RevenueSummary
            spots={spots}
            vendors={vendors}
            assignments={placements.assignments}
            pricingConfig={pricingConfig}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Logistics" dataTour="logistics">
          <LogisticsPanel
            accessPoints={accessPoints}
            timeWindows={timeWindows}
            onAddTimeWindow={addTimeWindow}
            onDeleteTimeWindow={removeTimeWindow}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Spots" defaultOpen={false}>
          <SpotTable
            spots={spots}
            vendors={vendors}
            assignments={placements.assignments}
            onEditSpot={handleEditSpotById}
            pricingConfig={pricingConfig}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Vendor Portal" defaultOpen={false} dataTour="vendor-portal">
          <VendorPortalConfig
            eventId={eventId}
            vendors={vendors}
            portalConfig={portalConfig}
            onConfigChange={setPortalConfig}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Vendors" defaultOpen={false} dataTour="vendors">
          <VendorTable
            vendors={vendors}
            assignments={placements.assignments}
            spots={spots}
            onSelectVendor={handleSelectVendor}
            onReassign={handleReassign}
            currentEventId={eventId}
            onUpdateVendor={updateVendor}
            onVendorsRefresh={loadVendors}
          />
        </CollapsibleSection>
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
          currentProjectId={layoutId}
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

function NewLayoutButton({ loading, onSave }) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSave = () => {
    if (!newName.trim()) return;
    onSave(newName.trim());
    setNewName('');
    setShowNew(false);
  };

  if (showNew) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Layout name..."
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
          style={{
            flex: 1, padding: '4px 8px', fontSize: 12,
            background: '#16213e', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4,
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading || !newName.trim()}
          style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
        >
          Create
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowNew(false)}
          style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn btn-secondary"
      onClick={() => setShowNew(true)}
      disabled={loading}
      style={{ fontSize: 11, padding: '4px 10px' }}
    >
      New Layout
    </button>
  );
}
