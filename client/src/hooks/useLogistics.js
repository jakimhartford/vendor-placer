import { useState, useCallback } from 'react';
import {
  fetchLogistics,
  createAccessPoint as apiCreateAP,
  deleteAccessPoint as apiDeleteAP,
  createTimeWindow as apiCreateTW,
  deleteTimeWindow as apiDeleteTW,
} from '../api/index.js';

export default function useLogistics() {
  const [accessPoints, setAccessPoints] = useState([]);
  const [timeWindows, setTimeWindows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogistics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogistics();
      setAccessPoints(data.accessPoints || []);
      setTimeWindows(data.timeWindows || []);
    } catch {
      setAccessPoints([]);
      setTimeWindows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccessPoint = useCallback(async (data) => {
    try {
      const ap = await apiCreateAP(data);
      setAccessPoints((prev) => [...prev, ap]);
      return ap;
    } catch (err) {
      console.error('addAccessPoint error:', err);
      return null;
    }
  }, []);

  const removeAccessPoint = useCallback(async (id) => {
    try {
      await apiDeleteAP(id);
      setAccessPoints((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('removeAccessPoint error:', err);
    }
  }, []);

  const addTimeWindow = useCallback(async (data) => {
    try {
      const tw = await apiCreateTW(data);
      setTimeWindows((prev) => [...prev, tw]);
      return tw;
    } catch (err) {
      console.error('addTimeWindow error:', err);
      return null;
    }
  }, []);

  const removeTimeWindow = useCallback(async (id) => {
    try {
      await apiDeleteTW(id);
      setTimeWindows((prev) => prev.filter((tw) => tw.id !== id));
    } catch (err) {
      console.error('removeTimeWindow error:', err);
    }
  }, []);

  return {
    accessPoints, timeWindows, loading,
    loadLogistics, addAccessPoint, removeAccessPoint, addTimeWindow, removeTimeWindow,
    setAccessPoints, setTimeWindows,
  };
}
