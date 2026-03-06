import { useState, useCallback } from 'react';
import {
  fetchLayouts as apiFetchLayouts,
  fetchLayout as apiFetchLayout,
  createLayout as apiCreateLayout,
  updateLayout as apiUpdateLayout,
  duplicateLayout as apiDuplicateLayout,
  deleteLayout as apiDeleteLayout,
} from '../api/index.js';

export default function useLayouts(eventId) {
  const [layouts, setLayouts] = useState([]);
  const [currentLayoutId, setCurrentLayoutId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadLayouts = useCallback(async (eid) => {
    const id = eid || eventId;
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiFetchLayouts(id);
      setLayouts(data);
    } catch {
      setLayouts([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadLayout = useCallback(async (layoutId, eid) => {
    const id = eid || eventId;
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiFetchLayout(id, layoutId);
      setCurrentLayoutId(layoutId);
      return data;
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const saveNewLayout = useCallback(async (payload, eid) => {
    const id = eid || eventId;
    if (!id) return;
    setLoading(true);
    try {
      const result = await apiCreateLayout(id, payload);
      setCurrentLayoutId(result.id);
      await loadLayouts(id);
      return result;
    } finally {
      setLoading(false);
    }
  }, [eventId, loadLayouts]);

  const saveLayout = useCallback(async (layoutId, payload, eid) => {
    const id = eid || eventId;
    if (!id) return;
    setLoading(true);
    try {
      const result = await apiUpdateLayout(id, layoutId, payload);
      await loadLayouts(id);
      return result;
    } finally {
      setLoading(false);
    }
  }, [eventId, loadLayouts]);

  const duplicate = useCallback(async (layoutId, eid) => {
    const id = eid || eventId;
    if (!id) return;
    setLoading(true);
    try {
      const result = await apiDuplicateLayout(id, layoutId);
      await loadLayouts(id);
      return result;
    } finally {
      setLoading(false);
    }
  }, [eventId, loadLayouts]);

  const removeLayout = useCallback(async (layoutId, eid) => {
    const id = eid || eventId;
    if (!id) return;
    setLoading(true);
    try {
      await apiDeleteLayout(id, layoutId);
      if (currentLayoutId === layoutId) setCurrentLayoutId(null);
      await loadLayouts(id);
    } finally {
      setLoading(false);
    }
  }, [eventId, currentLayoutId, loadLayouts]);

  return {
    layouts,
    currentLayoutId,
    loading,
    loadLayouts,
    loadLayout,
    saveNewLayout,
    saveLayout,
    duplicate,
    removeLayout,
    setCurrentLayoutId,
  };
}
