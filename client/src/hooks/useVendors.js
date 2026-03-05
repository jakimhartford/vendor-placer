import { useState, useCallback } from 'react';
import { fetchVendors, uploadVendors, clearVendors, updateVendor as apiUpdateVendor } from '../api/index.js';

export default function useVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendors();
      if (Array.isArray(data)) setVendors(data);
      else if (data && Array.isArray(data.vendors)) setVendors(data.vendors);
      else setVendors([]);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadCsv = useCallback(
    async (csvString) => {
      setLoading(true);
      setError(null);
      try {
        await uploadVendors(csvString);
        await loadVendors();
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadVendors]
  );

  const clearAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await clearVendors();
      setVendors([]);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVendor = useCallback(async (id, updates) => {
    try {
      const updated = await apiUpdateVendor(id, updates);
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
      return updated;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  return { vendors, loading, error, loadVendors, uploadCsv, clearAll, updateVendor, setVendors };
}
