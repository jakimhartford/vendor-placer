import { useState, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function LocationSearch() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.flyTo([lat, lng], 18, { duration: 1.5 });
    setResults([]);
    setQuery(result.display_name.split(',').slice(0, 2).join(','));
  };

  // Stop click propagation so map doesn't receive clicks
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onDoubleClick={stopPropagation}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        width: 280,
      }}
    >
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 4 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: 13,
            border: '1px solid #475569',
            borderRadius: 6,
            background: '#1e293b',
            color: '#e2e8f0',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            border: 'none',
            borderRadius: 6,
            background: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {searching ? '...' : 'Go'}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{
          marginTop: 4,
          background: '#1e293b',
          border: '1px solid #475569',
          borderRadius: 6,
          maxHeight: 200,
          overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <div
              key={r.place_id || i}
              onClick={() => handleSelect(r)}
              style={{
                padding: '8px 10px',
                fontSize: 12,
                color: '#e2e8f0',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #334155' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
