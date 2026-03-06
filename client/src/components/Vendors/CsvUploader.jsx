import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { fetchSampleList, fetchSampleCsv } from '../../api/index.js';
import ColumnMapper from './ColumnMapper.jsx';

// Standard headers that skip the mapping step
const STANDARD_HEADERS = ['name', 'category', 'tier'];

function hasStandardHeaders(headers) {
  const norm = headers.map((h) => h.trim().toLowerCase());
  return STANDARD_HEADERS.every((sh) => norm.includes(sh));
}

export default function CsvUploader({ onUpload, loading }) {
  const [samples, setSamples] = useState([]);
  const [status, setStatus] = useState(null);
  const [pasteValue, setPasteValue] = useState('');
  const fileRef = useRef(null);

  // Column mapping state
  const [mappingData, setMappingData] = useState(null); // { headers, rows }

  useEffect(() => {
    fetchSampleList()
      .then((data) => {
        if (Array.isArray(data)) setSamples(data);
      })
      .catch(() => {});
  }, []);

  const handleSample = async (filename) => {
    setStatus(null);
    setMappingData(null);
    try {
      const csvText = await fetchSampleCsv(filename);
      await onUpload(csvText);
      setStatus({ type: 'success', msg: `Loaded ${filename}` });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || err.message });
    }
  };

  const processData = async (headers, rows, fileName) => {
    if (hasStandardHeaders(headers)) {
      // Standard headers — skip mapping, send directly as CSV
      const csvString = Papa.unparse({ fields: headers, data: rows.map((r) => headers.map((h) => r[h] ?? '')) });
      try {
        await onUpload(csvString);
        setStatus({ type: 'success', msg: `Uploaded ${fileName}` });
      } catch (err) {
        setStatus({ type: 'error', msg: err.response?.data?.error || err.message });
      }
    } else {
      // Non-standard headers — show column mapper
      setMappingData({ headers, rows });
      setStatus(null);
    }
  };

  const parseCSV = (text, fileName) => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0 && result.data.length === 0) {
      setStatus({ type: 'error', msg: `CSV parse error: ${result.errors[0].message}` });
      return;
    }
    const headers = result.meta.fields || [];
    processData(headers, result.data, fileName);
  };

  const parseExcel = (buffer, fileName) => {
    try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (jsonData.length === 0) {
        setStatus({ type: 'error', msg: 'No data found in spreadsheet.' });
        return;
      }
      const headers = Object.keys(jsonData[0]);
      processData(headers, jsonData, fileName);
    } catch (err) {
      setStatus({ type: 'error', msg: `Excel parse error: ${err.message}` });
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    setMappingData(null);

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => parseExcel(evt.target.result, file.name);
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => parseCSV(evt.target.result, file.name);
      reader.readAsText(file);
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePaste = async () => {
    if (!pasteValue.trim()) return;
    setStatus(null);
    setMappingData(null);
    parseCSV(pasteValue, 'pasted data');
  };

  const handleMappedImport = async (csvString) => {
    setMappingData(null);
    try {
      await onUpload(csvString);
      setStatus({ type: 'success', msg: 'CSV uploaded successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || err.message });
    }
  };

  const handleMappingCancel = () => {
    setMappingData(null);
  };

  return (
    <div data-tour="upload-vendors">
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
          accept=".csv,.xlsx,.xls"
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

      {mappingData && (
        <ColumnMapper
          headers={mappingData.headers}
          rows={mappingData.rows}
          onImport={handleMappedImport}
          onCancel={handleMappingCancel}
        />
      )}

      {status && (
        <p className={status.type === 'error' ? 'error-msg' : 'success-msg'}>
          {status.msg}
        </p>
      )}
    </div>
  );
}
