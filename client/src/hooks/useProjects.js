import { useState, useCallback } from 'react';
import {
  fetchProjects as apiFetchProjects,
  fetchProject as apiFetchProject,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  fetchVersions as apiFetchVersions,
  createVersion as apiCreateVersion,
  loadVersion as apiLoadVersion,
} from '../api/index.js';

export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);

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
      setVersions(data.versions || []);
      setActiveVersionId(data.activeVersionId || null);
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

  const loadVersions = useCallback(async (projectId) => {
    try {
      const data = await apiFetchVersions(projectId || currentProjectId);
      setVersions(data.versions || []);
      setActiveVersionId(data.activeVersionId || null);
    } catch {
      setVersions([]);
    }
  }, [currentProjectId]);

  const saveVersion = useCallback(async (name) => {
    if (!currentProjectId) return;
    setLoading(true);
    try {
      const ver = await apiCreateVersion(currentProjectId, name);
      setVersions((prev) => [...prev, ver]);
      setActiveVersionId(ver._id);
      return ver;
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  const loadVersionData = useCallback(async (versionId) => {
    if (!currentProjectId) return;
    setLoading(true);
    try {
      const data = await apiLoadVersion(currentProjectId, versionId);
      setActiveVersionId(data.activeVersionId || versionId);
      return data;
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

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
    versions,
    activeVersionId,
    loadVersions,
    saveVersion,
    loadVersionData,
  };
}
