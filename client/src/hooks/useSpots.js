import { useState, useCallback } from 'react';
import {
  fetchSpots,
  saveSpots as apiSaveSpots,
  generateGrid as apiGenerateGrid,
  generateFromPath as apiGenerateFromPath,
  clearSpots as apiClearSpots,
  addSingleSpot as apiAddSingleSpot,
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

  const generateFromPath = useCallback(
    async (params) => {
      setLoading(true);
      try {
        const data = await apiGenerateFromPath(params);
        if (data.spotsGeoJSON && data.spotsGeoJSON.type === 'FeatureCollection') {
          setSpots(data.spotsGeoJSON);
        } else {
          await loadSpots();
        }
      } catch (err) {
        console.error('generateFromPath error:', err);
      } finally {
        setLoading(false);
      }
    },
    [loadSpots]
  );

  const clearSpots = useCallback(async () => {
    setLoading(true);
    try {
      await apiClearSpots();
      setSpots(EMPTY_FC);
    } catch (err) {
      console.error('clearSpots error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSingleSpot = useCallback(async ({ lng, lat, label }) => {
    setLoading(true);
    try {
      const data = await apiAddSingleSpot({ lng, lat, label });
      if (data.spotsGeoJSON && data.spotsGeoJSON.type === 'FeatureCollection') {
        setSpots(data.spotsGeoJSON);
      } else {
        await loadSpots();
      }
    } catch (err) {
      console.error('addSingleSpot error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadSpots]);

  return { spots, loading, loadSpots, saveSpots, generateGrid, generateFromPath, clearSpots, addSingleSpot, setSpots };
}
