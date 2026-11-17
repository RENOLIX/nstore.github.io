import { useId } from 'react';

/* Décors dessinés pour le site. Chaque décor existe en deux formats :
   un pour PC (paysage) et un pour téléphone (portrait). */

function StadiumSvg({ w, h, deep, glow, className }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const u = (n) => `url(#${id}${n})`;
  const hz = h * 0.64;            // ligne de touche
  const roof = h * 0.3;           // bas du toit sur les côtés
  const dip = h * 0.2;            // creux du toit au centre
  const lamps = [[w * 0.1, h * 0.13], [w * 0.5, h * 0.07], [w * 0.9, h * 0.13]];
  const stripes = [];
  for (let i = -7; i < 7; i++) {
    if (i % 2) continue;
    const tw = w / 10, bw = w / 3.4;
    stripes.push(`${w / 2 + i * tw},${hz} ${w / 2 + (i + 1) * tw},${hz} ${w / 2 + (i + 1) * bw},${h} ${w / 2 + i * bw},${h}`);
  }
  const ph = h - hz;
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05060a" /><stop offset=".7" stopColor={deep} /><stop offset="1" stopColor="#05060a" />
        </linearGradient>
        <radialGradient id={id + 'glow'}><stop offset="0" stopColor={glow} stopOpacity=".55" /><stop offset="1" stopColor={glow} stopOpacity="0" /></radialGradient>
        <radialGradient id={id + 'lamp'}><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".25" stopColor="#fff" stopOpacity=".25" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id={id + 'beam'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".3" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id={id + 'fade'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".7" /></linearGradient>
        <linearGradient id={id + 'pitch'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14553a" /><stop offset="1" stopColor="#051a11" /></linearGradient>
        <radialGradient id={id + 'vig'} cx=".5" cy=".5" r=".75"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".7" /></radialGradient>
        <pattern id={id + 'crowd'} width="16" height="11" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#fff" opacity=".13" /><circle cx="11" cy="2.5" r="1.5" fill={glow} opacity=".4" />
          <circle cx="7" cy="8" r="1.7" fill="#fff" opacity=".07" /><circle cx="14.500" cy="8.500" r="1.400" fill={glow} opacity=".2" />
        </pattern>
        <filter id={id + 'blur'} x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation={w / 70} /></filter>
        <filter id={id + 'grain'}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0" />
        </filter>
      </defs>

      <rect width={w} height={h} fill={u('sky')} />
      <ellipse cx={w * 0.66} cy={h * 0.5} rx={w * 0.55} ry={h * 0.6} fill={u('glow')} />

      {/* tribunes et foule */}
      <path d={`M0 ${roof} Q${w / 2} ${dip} ${w} ${roof} L${w} ${hz} L0 ${hz}Z`} fill="#0a0c12" />
      <path d={`M0 ${roof} Q${w / 2} ${dip} ${w} ${roof} L${w} ${hz} L0 ${hz}Z`} fill={u('crowd')} />
      <path d={`M0 ${roof + (hz - roof) * 0.45} Q${w / 2} ${dip + (hz - dip) * 0.42} ${w} ${roof + (hz - roof) * 0.45}`} fill="none" stroke="#05060a" strokeWidth={h * 0.012} />
      <rect y={dip} width={w} height={hz - dip} fill={u('fade')} />
      {/* toit */}
      <path d={`M0 ${roof - h * 0.07} Q${w / 2} ${dip - h * 0.09} ${w} ${roof - h * 0.07} L${w} ${roof} Q${w / 2} ${dip} 0 ${roof}Z`} fill="#040508" />
      <path d={`M0 ${roof} Q${w / 2} ${dip} ${w} ${roof}`} fill="none" stroke={glow} strokeOpacity=".55" strokeWidth="3" />

      {/* projecteurs */}
      {lamps.map(([x, y], k) => (
        <g key={k}>
          <polygon className="beam" style={{ animationDelay: `${k * -2.3}s` }} filter={u('blur')} fill={u('beam')}
            points={`${x - w * 0.012},${y} ${x + w * 0.012},${y} ${x + w * 0.2},${h} ${x - w * 0.2},${h}`} />
          <circle cx={x} cy={y} r={h * 0.2} fill={u('lamp')} />
          {[0, 1].map((r) => [-2, -1, 0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={x + c * w * 0.011 - w * 0.004} y={y + r * h * 0.016 - h * 0.012} width={w * 0.008} height={h * 0.01} rx="2" fill="#fff" />
          )))}
        </g>
      ))}

      {/* panneaux lumineux */}
      <rect y={hz - h * 0.03} width={w} height={h * 0.03} fill="#06070b" />
      <rect y={hz - h * 0.022} width={w} height={h * 0.014} fill={glow} opacity=".55" />

      {/* pelouse */}
      <rect y={hz} width={w} height={ph} fill={u('pitch')} />
      {stripes.map((p) => <polygon key={p} points={p} fill="#fff" opacity=".04" />)}
      <g fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth={Math.max(2.5, w / 520)}>
        <line x1="0" y1={hz + ph * 0.07} x2={w} y2={hz + ph * 0.07} />
        <line x1={w / 2} y1={hz + ph * 0.07} x2={w / 2} y2={h} />
        <ellipse cx={w / 2} cy={hz + ph * 0.66} rx={w * 0.19} ry={ph * 0.36} />
      </g>
      <rect y={hz} width={w} height={ph} fill={u('fade')} />

      <rect width={w} height={h} fill={u('vig')} />
      <rect width={w} height={h} filter={u('grain')} />
    </svg>
  );
}

export function Stadium({ deep = '#101426', glow = '#3fae78' }) {
  return (
    <div className="scene" aria-hidden="true">
      <StadiumSvg className="scene--pc" w={1920} h={860} deep={deep} glow={glow} />
      <StadiumSvg className="scene--tel" w={900} h={1300} deep={deep} glow={glow} />
    </div>
  );
}

/* Tracé de terrain vu du dessus, sur aplat de couleur */
function PitchSvg({ w, h, color, className }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = Math.max(w, h);
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={id + 'l'} cx=".25" cy=".1" r="1"><stop offset="0" stopColor="#fff" stopOpacity=".2" /><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".45" /></radialGradient>
        <filter id={id + 'g'}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .08 0" />
        </filter>
      </defs>
      <rect width={w} height={h} fill={color} />
      <g transform={`translate(${w / 2} ${h / 2}) rotate(-14) scale(${s / 600}) translate(-300 -330)`} fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="2.500">
        {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x="20" y={-200 + k * 220} width="560" height="110" fill="#fff" fillOpacity=".03" stroke="none" />)}
        <rect x="20" y="-200" width="560" height="1100" />
        <line x1="20" y1="350" x2="580" y2="350" />
        <circle cx="300" cy="350" r="92" />
        <circle cx="300" cy="350" r="4" fill="#fff" fillOpacity=".3" />
        <rect x="140" y="-200" width="320" height="170" />
        <rect x="140" y="730" width="320" height="170" />
        <path d="M232 730a70 70 0 0 1 136 0" />
        <path d="M232 -30a70 70 0 0 0 136 0" />
      </g>
      <rect width={w} height={h} fill={`url(#${id}l)`} />
      <rect width={w} height={h} filter={`url(#${id}g)`} />
    </svg>
  );
}

export function Pitch({ color = '#14213d' }) {
  return (
    <div className="scene" aria-hidden="true">
      <PitchSvg className="scene--pc" w={1200} h={900} color={color} />
      <PitchSvg className="scene--tel" w={800} h={1000} color={color} />
    </div>
  );
}
