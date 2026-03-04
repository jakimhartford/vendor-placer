import React, { useState, useRef, useEffect } from 'react';
import { fetchSampleList, fetchSampleCsv } from '../../api/index.js';

export default function CsvUploader({ onUpload, loading }) {
  const [samples, setSamples] = useState([]);
  const [status, setStatus] = useState(null);
  const [pasteValue, setPasteValue] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    fetchSampleList().then(setSamples).catch(() => {});
  }, []);

  const handleSample = async (filename) => {
    setStatus(null);
    try {
      const csvText = await fetchSampleCsv(filename);
      await onUpload(csvText);
      setStatus({ type: 'success', msg: `Loaded ${filename}` });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || err.message });
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        await onUpload(evt.target.result);
        setStatus({ type: 'success', msg: `Uploaded ${file.name}` });
      } catch (err) {
        setStatus({ type: 'error', msg: err.response?.data?.error || err.message });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePaste = async () => {
    if (!pasteValue.trim()) return;
    setStatus(null);
    try {
      await onUpload(pasteValue);
      setStatus({ type: 'success', msg: 'CSV uploaded successfully.' });
      setPasteValue('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || err.message });
    }
  };

  return (
    <div>
      {samples.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
            Demo datasets
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {samples.map((s) => (
              <button
                key={s.filename}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '4px 10px', fontSize: 11, marginBottom: 0 }}
                disabled={loading}
                onClick={() => handleSample(s.filename)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="file-input-wrapper">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={loading}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <textarea
          rows={2}
          placeholder="Or paste CSV data..."
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          disabled={loading}
        />
        <button
          className="btn btn-secondary"
          onClick={handlePaste}
          disabled={loading || !pasteValue.trim()}
        >
          {loading ? 'Uploading...' : 'Upload Pasted CSV'}
        </button>
      </div>

      {status && (
        <p className={status.type === 'error' ? 'error-msg' : 'success-msg'}>
          {status.msg}
        </p>
      )}
    </div>
  );
}
