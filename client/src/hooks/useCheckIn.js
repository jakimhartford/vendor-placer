import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchCheckInData, updateCheckIn as apiUpdateCheckIn } from '../api/index.js';

export default function useCheckIn(projectId) {
  const [project, setProject] = useState(null);
  const [checkIns, setCheckIns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await fetchCheckInData(projectId);
      setProject(data.project);
      setCheckIns(data.checkIns || {});
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateCheckIn = useCallback(async (vendorId, data) => {
    if (!projectId) return;
    try {
      const result = await apiUpdateCheckIn(projectId, vendorId, data);
      setCheckIns(result.checkIns || {});
    } catch (err) {
      console.error('updateCheckIn error:', err);
    }
  }, [projectId]);

  // Auto-refresh every 30s
  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  return { project, checkIns, loading, error, reload: load, updateCheckIn };
}
