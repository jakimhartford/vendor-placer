import { useState, useCallback } from 'react';
import {
  fetchAmenities as apiFetch,
  createAmenity as apiCreate,
  deleteAmenity as apiDelete,
  clearAmenities as apiClear,
} from '../api/index.js';

export default function useAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAmenities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch();
      setAmenities(Array.isArray(data) ? data : []);
    } catch {
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAmenity = useCallback(async (data) => {
    try {
      const amenity = await apiCreate(data);
      setAmenities((prev) => [...prev, amenity]);
      return amenity;
    } catch (err) {
      console.error('addAmenity error:', err);
      return null;
    }
  }, []);

  const removeAmenity = useCallback(async (id) => {
    try {
      await apiDelete(id);
      setAmenities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('removeAmenity error:', err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await apiClear();
      setAmenities([]);
    } catch (err) {
      console.error('clearAmenities error:', err);
    }
  }, []);

  return { amenities, loading, loadAmenities, addAmenity, removeAmenity, clearAll, setAmenities };
}
