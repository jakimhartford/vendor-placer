import { useState, useCallback } from 'react';
import {
  runPlacement as apiRunPlacement,
  fetchPlacements,
} from '../api/index.js';

const EMPTY_PLACEMENTS = { assignments: {}, unplaced: [], conflicts: [] };

export default function usePlacements() {
  const [placements, setPlacements] = useState(EMPTY_PLACEMENTS);
  const [loading, setLoading] = useState(false);

  const runPlacement = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRunPlacement();
      // Convert assignments array [{vendorId, spotId}] to map {spotId: vendorId}
      const assignmentsArr = data.assignments || [];
      const assignmentsMap = {};
      if (Array.isArray(assignmentsArr)) {
        assignmentsArr.forEach((a) => { assignmentsMap[a.spotId] = a.vendorId; });
      }
      const result = {
        assignments: assignmentsMap,
        assignmentsArray: assignmentsArr,
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
      const arr = data.assignments || [];
      const map = {};
      if (Array.isArray(arr)) {
        arr.forEach((a) => { map[a.spotId] = a.vendorId; });
      }
      setPlacements({
        assignments: map,
        assignmentsArray: arr,
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

  return { placements, loading, runPlacement, loadPlacements, clearPlacements };
}
