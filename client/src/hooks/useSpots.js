import { useState, useCallback } from 'react';
import {
  fetchSpots,
  saveSpots as apiSaveSpots,
  generateGrid as apiGenerateGrid,
} from '../api/index.js';

const EMPTY_FC = { type: 'FeatureCollection', features: [] };

export default function useSpots() {
  const [spots, setSpots] = useState(EMPTY_FC);
  const [loading, setLoading] = useState(false);

  const loadSpots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSpots();
      setSpots(
        data && data.type === 'FeatureCollection' ? data : EMPTY_FC
      );
    } catch {
      setSpots(EMPTY_FC);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSpots = useCallback(async (geojson) => {
    setLoading(true);
    try {
      const data = await apiSaveSpots(geojson);
      setSpots(
        data && data.type === 'FeatureCollection' ? data : geojson
      );
    } catch {
      // keep local state
    } finally {
      setLoading(false);
    }
  }, []);

  const generateGrid = useCallback(
    async (params) => {
      setLoading(true);
      try {
        await apiGenerateGrid(params);
        await loadSpots();
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [loadSpots]
  );

  return { spots, loading, loadSpots, saveSpots, generateGrid };
}
