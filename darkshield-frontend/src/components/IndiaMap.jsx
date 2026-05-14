import { useMemo, useState } from 'react';

const INDIA_PATH = "M186,42 L198,38 L208,45 L216,42 L224,48 L230,42 L240,46 L248,52 L250,62 L258,68 L262,78 L268,82 L272,92 L268,102 L274,112 L278,122 L282,132 L278,142 L272,148 L276,158 L280,168 L278,180 L272,188 L264,192 L258,200 L248,206 L240,218 L232,228 L224,240 L218,252 L212,260 L208,272 L200,280 L194,290 L188,298 L184,308 L178,314 L174,308 L170,298 L162,290 L158,280 L152,268 L148,258 L142,248 L138,238 L134,228 L128,218 L124,210 L118,202 L114,192 L110,182 L108,172 L112,162 L108,152 L112,142 L118,132 L124,122 L128,112 L134,102 L140,92 L148,82 L154,72 L162,62 L170,54 L178,48 Z";

function latLonToSVG(lat, lon) {
  const LAT_MIN = 8, LAT_MAX = 37;
  const LON_MIN = 68, LON_MAX = 97;
  const SVG_X_MIN = 105, SVG_X_MAX = 285;
  const SVG_Y_MIN = 38,  SVG_Y_MAX = 318;
  const x = SVG_X_MIN + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (SVG_X_MAX - SVG_X_MIN);
  const y = SVG_Y_MAX - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (SVG_Y_MAX - SVG_Y_MIN);
  return { x, y };
}

const CITIES = [
  { name: 'Delhi',     lat: 28.61, lon: 77.21 },
  { name: 'Mumbai',    lat: 19.07, lon: 72.88 },
  { name: 'Bangalore', lat: 12.97, lon: 77.59 },
  { name: 'Chennai',   lat: 13.08, lon: 80.27 },
  { name: 'Kolkata',   lat: 22.57, lon: 88.36 },
  { name: 'Hyderabad', lat: 17.38, lon: 78.49 },
  { name: 'Pune',      lat: 18.52, lon: 73.85 },
  { name: 'Jaipur',    lat: 26.92, lon: 75.78 },
  { name: 'Ahmedabad', lat: 23.02, lon: 72.57 },
  { name: 'Lucknow',   lat: 26.85, lon: 80.95 },
  { name: 'Chandigarh',lat: 30.73, lon: 76.78 },
  { name: 'Bhopal',    lat: 23.26, lon: 77.40 },
];

export default function IndiaMap({ threats = [] }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, threat }

  const sevColor = (s) =>
    s === 'CRITICAL' ? '#ff003c' :
    s === 'HIGH'     ? '#ff6d00' :
    s === 'MEDIUM'   ? '#b14eff' :
    s === 'LOW'      ? '#00ff88' : '#00e5ff';

  const threatPoints = useMemo(() => {
    return threats
      .filter(t =>
        t.targetLatitude && t.targetLongitude &&
        t.targetLatitude >= 6  && t.targetLatitude <= 38 &&
        t.targetLongitude >= 67 && t.targetLongitude <= 98
      )
      .map(t => {
        const { x, y } = latLonToSVG(t.targetLatitude, t.targetLongitude);
        return { x, y, threat: t, severity: t.severity };
      });
  }, [threats]);

  const cityPoints = CITIES.map(c => ({ ...c, ...latLonToSVG(c.lat, c.lon) }));

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox="60 20 260 310" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,229,255,0.04)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="threat-zone-red" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff003c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff003c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="threat-zone-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6d00" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ff6d00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="threat-zone-purple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b14eff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#b14eff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="350" fill="url(#grid)" />
        <path d={INDIA_PATH} fill="rgba(0,229,255,0.03)" stroke="rgba(0,229,255,0.2)" strokeWidth="1.5" filter="url(#glow)" />
        <path d={INDIA_PATH} fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth="0.5" strokeDasharray="4,4" />

        {/* City reference dots */}
        {cityPoints.map(c => (
          <g key={`city-${c.name}`}>
            <circle cx={c.x} cy={c.y} r={1.8} fill="rgba(0,229,255,0.3)" />
            <text x={c.x + 4} y={c.y + 2.5} fill="rgba(0,229,255,0.25)" fontSize="5.5"
              fontFamily="'JetBrains Mono', monospace" letterSpacing="0.3">
              {c.name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Threat impact zones */}
        {threatPoints.map((p, i) => (
          <circle key={`zone-${i}`} cx={p.x} cy={p.y}
            r={p.severity === 'CRITICAL' ? 26 : p.severity === 'HIGH' ? 20 : 14}
            fill={
              p.severity === 'CRITICAL' ? 'url(#threat-zone-red)' :
              p.severity === 'HIGH'     ? 'url(#threat-zone-orange)' : 'url(#threat-zone-purple)'
            }>
            <animate attributeName="r"
              values={p.severity === 'CRITICAL' ? '18;28;18' : '12;20;12'}
              dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Threat markers with hover */}
        {threatPoints.map((p, i) => (
          <g key={`threat-${i}`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, threat: p.threat })}
            onMouseLeave={() => setTooltip(null)}>
            {/* Pulse ring */}
            <circle cx={p.x} cy={p.y} r="5" fill="none" stroke={sevColor(p.severity)} strokeWidth="0.8" opacity="0.7">
              <animate attributeName="r" values="5;16;5" dur={`${1.4 + i * 0.25}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur={`${1.4 + i * 0.25}s`} repeatCount="indefinite" />
            </circle>
            {/* Core dot — larger hit area */}
            <circle cx={p.x} cy={p.y} r="7" fill="transparent" />
            <circle cx={p.x} cy={p.y} r="4" fill={sevColor(p.severity)} filter="url(#glow-strong)" opacity="0.95">
              <animate attributeName="opacity" values="0.95;0.5;0.95" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Score label */}
            <text x={p.x} y={p.y - 9} fill={sevColor(p.severity)} fontSize="7" textAnchor="middle"
              fontFamily="'Orbitron', monospace" fontWeight="700" filter="url(#glow)">
              {p.threat.threatScore}
            </text>
          </g>
        ))}

        {/* Hover tooltip rendered IN SVG so it stays on top */}
        {tooltip && (() => {
          const t = tooltip.threat;
          const color = sevColor(t.severity);
          // Clamp tooltip so it doesn't go off the right edge
          const tx = tooltip.x + 12 > 290 ? tooltip.x - 110 : tooltip.x + 12;
          const ty = tooltip.y - 10;
          return (
            <g>
              {/* Backdrop */}
              <rect x={tx - 4} y={ty - 14} width="108" height="70" rx="6" ry="6"
                fill="rgba(4,6,11,0.95)" stroke={color} strokeWidth="0.8" strokeOpacity="0.6" />
              {/* Severity dot + label */}
              <circle cx={tx + 5} cy={ty} r="3" fill={color} />
              <text x={tx + 11} y={ty + 3.5} fill={color} fontSize="6.5"
                fontFamily="'Orbitron', monospace" fontWeight="700" letterSpacing="0.5">
                {t.severity}
              </text>
              <text x={tx + 55} y={ty + 3.5} fill={color} fontSize="7"
                fontFamily="'JetBrains Mono', monospace" fontWeight="700" textAnchor="end">
                {t.threatScore}/100
              </text>
              {/* Title — truncate at 18 chars */}
              <text x={tx + 2} y={ty + 15} fill="#e8edf5" fontSize="6"
                fontFamily="'Rajdhani', sans-serif" fontWeight="600">
                {t.title.length > 20 ? t.title.slice(0, 20) + '…' : t.title}
              </text>
              {/* Type */}
              <text x={tx + 2} y={ty + 26} fill="rgba(0,229,255,0.7)" fontSize="5.5"
                fontFamily="'JetBrains Mono', monospace">
                {t.type}
              </text>
              {/* Source */}
              <text x={tx + 2} y={ty + 36} fill="rgba(74,85,104,1)" fontSize="5.5"
                fontFamily="'JetBrains Mono', monospace">
                FROM: {(t.sourceCountry || t.sourceIp || '?').slice(0, 18)}
              </text>
              {/* Status */}
              <text x={tx + 2} y={ty + 46} fill="rgba(74,85,104,1)" fontSize="5.5"
                fontFamily="'JetBrains Mono', monospace">
                STATUS: {t.status}
              </text>
            </g>
          );
        })()}

        {threatPoints.length === 0 && (
          <text x="190" y="185" fill="rgba(0,229,255,0.12)" fontSize="8" textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace" letterSpacing="1">
            NO ACTIVE IMPACT ZONES
          </text>
        )}
      </svg>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 8, left: 12, display: 'flex', gap: 14,
        fontSize: '0.6rem', fontFamily: "'Orbitron', monospace", letterSpacing: 1
      }}>
        {[{ label: 'CRITICAL', color: '#ff003c' }, { label: 'HIGH', color: '#ff6d00' }, { label: 'MEDIUM', color: '#b14eff' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
            <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
        <span style={{ color: 'rgba(0,229,255,0.25)', marginLeft: 4 }}>
          {threatPoints.length} ZONE{threatPoints.length !== 1 ? 'S' : ''}
        </span>
      </div>
    </div>
  );
}
