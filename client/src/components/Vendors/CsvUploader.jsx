import React, { useState, useRef } from 'react';

export default function CsvUploader({ onUpload, loading }) {
  const [pasteValue, setPasteValue] = useState('');
  const [status, setStatus] = useState(null); // { type: 'error'|'success', msg }
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        await onUpload(evt.target.result);
        setStatus({ type: 'success', msg: 'CSV uploaded successfully.' });
      } catch (err) {
        setStatus({
          type: 'error',
          msg: err.response?.data?.error || err.message,
        });
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
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
      setStatus({
        type: 'error',
        msg: err.response?.data?.error || err.message,
      });
    }
  };

  return (
    <div>
      <div className="file-input-wrapper">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={loading}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <textarea
          rows={3}
          placeholder="Or paste CSV data here..."
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
