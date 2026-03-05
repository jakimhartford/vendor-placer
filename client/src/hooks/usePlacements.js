import { useState, useCallback } from 'react';
import {
  runPlacement as apiRunPlacement,
  fetchPlacements,
} from '../api/index.js';

const EMPTY_PLACEMENTS = { assignments: {}, unplaced: [], conflicts: [] };

export default function usePlacements() {
  const [placements, setPlacements] = useState(EMPTY_PLACEMENTS);
  const [loading, setLoading] = useState(false);

  const runPlacement = useCallback(async (settings) => {
    setLoading(true);
    try {
      const data = await apiRunPlacement(settings);
      // Handle both array [{vendorId, spotId}] and object {spotId: vendorId} formats
      const raw = data.assignments || {};
      let assignmentsMap;
      if (Array.isArray(raw)) {
        assignmentsMap = {};
        raw.forEach((a) => { assignmentsMap[a.spotId] = a.vendorId; });
      } else {
        assignmentsMap = raw;
      }
      const result = {
        assignments: assignmentsMap,
        unplaced: data.unplaced || [],
        conflicts: data.conflicts || [],
      };
      setPlacements(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlacements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlacements();
      const raw = data.assignments || {};
      let map;
      if (Array.isArray(raw)) {
        map = {};
        raw.forEach((a) => { map[a.spotId] = a.vendorId; });
      } else {
        map = raw;
      }
      setPlacements({
        assignments: map,
        unplaced: data.unplaced || [],
        conflicts: data.conflicts || [],
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPlacements = useCallback(() => {
    setPlacements(EMPTY_PLACEMENTS);
  }, []);

  const updateAssignments = useCallback((newAssignments) => {
    setPlacements((prev) => ({ ...prev, assignments: newAssignments }));
  }, []);

  return { placements, loading, runPlacement, loadPlacements, clearPlacements, updateAssignments };
}
