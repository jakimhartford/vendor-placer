import { useState, useCallback } from 'react';
import {
  fetchDeadZones as apiFetch,
  createDeadZone as apiCreate,
  deleteDeadZone as apiDelete,
  clearDeadZones as apiClear,
  updateDeadZone as apiUpdate,
} from '../api/index.js';

export default function useDeadZones() {
  const [deadZones, setDeadZones] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDeadZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch();
      setDeadZones(Array.isArray(data) ? data : []);
    } catch {
      setDeadZones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addDeadZone = useCallback(async (polygon) => {
    setLoading(true);
    try {
      const data = await apiCreate(polygon);
      setDeadZones(data.deadZones || []);
      return data; // includes spotsGeoJSON with removed spots
    } catch (err) {
      console.error('addDeadZone error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeDeadZone = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiDelete(id);
      setDeadZones(data.deadZones || []);
    } catch (err) {
      console.error('removeDeadZone error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setLoading(true);
    try {
      await apiClear();
      setDeadZones([]);
    } catch (err) {
      console.error('clearDeadZones error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeadZone = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const result = await apiUpdate(id, data);
      setDeadZones(result.deadZones || []);
      return result;
    } catch (err) {
      console.error('updateDeadZone error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deadZones, loading, loadDeadZones, addDeadZone, removeDeadZone, clearAll, setDeadZones, updateDeadZone };
}
