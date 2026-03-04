import React, { useState } from 'react';

export default function ProjectBar({
  projects,
  currentProjectId,
  loading,
  onLoad,
  onSaveNew,
  onSave,
  onDelete,
}) {
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

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

  return (
    <div style={{ marginBottom: 8 }}>
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
          </>
        )}
      </div>

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
