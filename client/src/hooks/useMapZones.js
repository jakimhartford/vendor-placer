import { useState, useCallback } from 'react';
import {
  fetchMapZones as apiFetch,
  createMapZone as apiCreate,
  updateMapZone as apiUpdate,
  deleteMapZone as apiDelete,
  clearMapZones as apiClear,
} from '../api/index.js';

export default function useMapZones() {
  const [mapZones, setMapZones] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMapZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch();
      setMapZones(Array.isArray(data) ? data : []);
    } catch {
      setMapZones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMapZone = useCallback(async (zone) => {
    setLoading(true);
    try {
      const data = await apiCreate(zone);
      setMapZones(data.mapZones || []);
      return data;
    } catch (err) {
      console.error('addMapZone error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMapZone = useCallback(async (id, updates) => {
    setLoading(true);
    try {
      const data = await apiUpdate(id, updates);
      setMapZones(data.mapZones || []);
      return data;
    } catch (err) {
      console.error('updateMapZone error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMapZone = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiDelete(id);
      setMapZones(data.mapZones || []);
    } catch (err) {
      console.error('removeMapZone error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setLoading(true);
    try {
      await apiClear();
      setMapZones([]);
    } catch (err) {
      console.error('clearMapZones error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { mapZones, loading, loadMapZones, addMapZone, updateMapZone, removeMapZone, clearAll, setMapZones };
}
