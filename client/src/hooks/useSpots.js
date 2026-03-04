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
      await apiSaveSpots(geojson);
      setSpots(geojson);
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
        const data = await apiGenerateGrid(params);
        // Response includes spotsGeoJSON directly
        if (data.spotsGeoJSON && data.spotsGeoJSON.type === 'FeatureCollection') {
          setSpots(data.spotsGeoJSON);
        } else {
          await loadSpots();
        }
      } catch (err) {
        console.error('generateGrid error:', err);
      } finally {
        setLoading(false);
      }
    },
    [loadSpots]
  );

  return { spots, loading, loadSpots, saveSpots, generateGrid };
}
