import { useState, useCallback } from 'react';
import {
  fetchProjects as apiFetchProjects,
  fetchProject as apiFetchProject,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
} from '../api/index.js';

export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchProjects();
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiFetchProject(id);
      setCurrentProjectId(id);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveNewProject = useCallback(async (payload) => {
    setLoading(true);
    try {
      const result = await apiCreateProject(payload);
      setCurrentProjectId(result.id);
      await loadProjects();
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const saveProject = useCallback(async (id, payload) => {
    setLoading(true);
    try {
      const result = await apiUpdateProject(id, payload);
      await loadProjects();
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const removeProject = useCallback(async (id) => {
    setLoading(true);
    try {
      await apiDeleteProject(id);
      if (currentProjectId === id) setCurrentProjectId(null);
      await loadProjects();
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, loadProjects]);

  return {
    projects,
    currentProjectId,
    loading,
    loadProjects,
    loadProject,
    saveNewProject,
    saveProject,
    removeProject,
    setCurrentProjectId,
  };
}
