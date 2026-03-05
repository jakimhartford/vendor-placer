import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProjectBar({
  projects,
  currentProjectId,
  loading,
  onLoad,
  onSaveNew,
  onSave,
  onDelete,
  versions,
  activeVersionId,
  onLoadVersion,
  onSaveVersion,
}) {
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [showVersionInput, setShowVersionInput] = useState(false);
  const navigate = useNavigate();

  const handleSaveNew = () => {
    if (!newName.trim()) return;
    onSaveNew(newName.trim());
    setNewName('');
    setShowNew(false);
  };

  const handleLoad = (e) => {
    const id = e.target.value;
    if (id) onLoad(id);
  };

  const handleSaveVersion = () => {
    if (!versionName.trim()) return;
    onSaveVersion(versionName.trim());
    setVersionName('');
    setShowVersionInput(false);
  };

  const handleLoadVersion = (e) => {
    const vId = e.target.value;
    if (vId) onLoadVersion(vId);
  };

  return (
    <div style={{ marginBottom: 8 }} data-tour="project-bar">
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
        <select
          value={currentProjectId || ''}
          onChange={handleLoad}
          disabled={loading}
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: 12,
            background: '#16213e',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: 4,
          }}
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {currentProjectId && (
          <>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() => onSave(currentProjectId)}
              style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
            >
              Save
            </button>
            <button
              className="btn btn-danger"
              disabled={loading}
              onClick={() => {
                if (confirm('Delete this project?')) onDelete(currentProjectId);
              }}
              style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
            >
              Del
            </button>
            <button
              onClick={() => navigate(`/checkin/${currentProjectId}`)}
              style={{
                width: 'auto', padding: '4px 10px', fontSize: 11, borderRadius: 4,
                background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
              }}
              title="Check-In View"
            >
              Check-In
            </button>
          </>
        )}
      </div>

      {/* Version controls — only when a project is loaded */}
      {currentProjectId && versions?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
          <select
            value={activeVersionId || ''}
            onChange={handleLoadVersion}
            disabled={loading}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 11,
              background: '#0f172a',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: 4,
            }}
          >
            <option value="">-- Versions --</option>
            {versions.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name} ({new Date(v.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {currentProjectId && (
        showVersionInput ? (
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Version name..."
              onKeyDown={(e) => e.key === 'Enter' && handleSaveVersion()}
              autoFocus
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: 11,
                background: '#16213e',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: 4,
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveVersion}
              disabled={loading || !versionName.trim()}
              style={{ width: 'auto', padding: '4px 8px', fontSize: 10, marginBottom: 0 }}
            >
              Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowVersionInput(false)}
              style={{ width: 'auto', padding: '4px 8px', fontSize: 10, marginBottom: 0 }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={() => setShowVersionInput(true)}
            disabled={loading}
            style={{ fontSize: 10, padding: '3px 8px', marginBottom: 4 }}
          >
            Save Version
          </button>
        )
      )}

      {showNew ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name..."
            onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
            autoFocus
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: 12,
              background: '#16213e',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: 4,
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSaveNew}
            disabled={loading || !newName.trim()}
            style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
          >
            Create
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowNew(false)}
            style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="btn btn-secondary"
          onClick={() => setShowNew(true)}
          disabled={loading}
          style={{ fontSize: 11, padding: '4px 10px' }}
        >
          New Project
        </button>
      )}
    </div>
  );
}
