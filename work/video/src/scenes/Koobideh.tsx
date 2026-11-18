import React from "react";
import { Song, Svg, useSong } from "../kit";

/**
 * Persian Koobideh — a 9:16 toon reel. Baba Kabab cooks koobideh from raw lamb to the family feast.
 * Story rule: "keep turning, or it falls" (set up in the chorus, nearly fails in verse 3, pays off in the final chorus).
 * Toon look drawn with plain strokes (INK) instead of the toon filter: the filter renders very slowly on Windows.
 * Everything is a pure function of song time T.
 */

const INK = "#3a1d12";
const W = 1080;
const H = 1920;
const C = {
  apron: "#fdfaf2", skin: "#f6c9a0", cheek: "#ef8a7a", moustache: "#8a8a92", hat: "#ffffff",
  meatRaw: "#d9767a", meatDone: "#8a4320", onion: "#f1e4f2", onionLine: "#b98bc0", leaf: "#6fb04a",
  saffron: "#ffb627", rice: "#fffaf0", tomato: "#e5432f", lime: "#a6d64a", steel: "#c9ccd6",
  coal: "#3b2a26", ember: "#ff6a1a", wood: "#a4643a", tile: "#fbe9cf", tile2: "#f4d7b0",
};
const SW = 7; // outline width

// ── time helpers ─────────────────────────────────────────────────────────────────────────────────────────────────
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (k: number) => 1 - Math.pow(1 - clamp(k), 3);
/** 0 → 1 over d seconds from t, with a small overshoot */
const pop = (T: number, t: number, d = 0.35) => {
  const k = clamp((T - t) / d);
  return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) + (easeOut(k) - 1);
};
const wordT = (song: Song, id: string, i = 0) => {
  const l = song.lines.find((x) => x.id === id);
  if (!l) return 1e9;
  return (l.words[Math.min(i, l.words.length - 1)] || { t: l.start }).t;
};
/** index of the word whose text contains `w` (first match), for key-word timing */
const keyT = (song: Song, id: string, w: string) => {
  const l = song.lines.find((x) => x.id === id);
  if (!l) return 1e9;
  const i = l.words.findIndex((x) => x.w.toLowerCase().includes(w.toLowerCase()));
  return i < 0 ? l.start : l.words[i].t;
};
const singing = (song: Song, T: number) => song.lines.some((l) => T >= l.start && T <= l.end);

/** which drawn moment we are in: the section id, its local progress */
function sectionAt(song: Song, T: number) {
  const s = song.sections.find((x) => T >= x.start && T < x.end) || song.sections[song.sections.length - 1];
  return { id: s.id, k: (T - s.start) / (s.end - s.start), start: s.start, end: s.end };
}

// ── characters and props ─────────────────────────────────────────────────────────────────────────────────────────
type Pose = "idle" | "wave" | "shh" | "knead" | "turn" | "cheer" | "point";

/** Baba Kabab: one round mass, small features low and close, tall hat. Origin at his feet, s = 1 is ~520 px tall */
const Baba: React.FC<{ T: number; x: number; y: number; s?: number; pose?: Pose; talk?: boolean; face?: 1 | -1 }> = ({
  T, x, y, s = 1, pose = "idle", talk = false, face = 1,
}) => {
  const bob = Math.sin(T * Math.PI * 2 * (108 / 60) / 2) * 6;
  const mouth = talk ? 10 + 8 * Math.abs(Math.sin(T * 14)) : 4;
  const sh = { l: [-150, -250], r: [150, -250] };
  const hand = (side: "l" | "r"): [number, number] => {
    const sg = side === "l" ? -1 : 1;
    const t = T * 6;
    switch (pose) {
      case "wave": return side === "r" ? [230 + Math.sin(t * 1.6) * 40, -470] : [-190, -150];
      case "shh": return side === "r" ? [20, -385] : [-190, -150];
      case "knead": return [sg * 90 + Math.sin(t + (sg > 0 ? 0 : 3)) * 25, -40 + Math.abs(Math.sin(t + (sg > 0 ? 0 : 3))) * -50];
      case "turn": return [sg * 170 + Math.cos(t * 1.3) * 25 * sg, -130 + Math.sin(t * 1.3) * 25];
      case "cheer": return [sg * 220, -520 + Math.sin(t) * 15];
      case "point": return side === "r" ? [270, -330] : [-190, -150];
      default: return [sg * 200, -140];
    }
  };
  const arm = (side: "l" | "r") => {
    const [ax, ay] = sh[side];
    const [hx, hy] = hand(side);
    const ex = (ax + hx) / 2 + (side === "l" ? -30 : 30);
    const ey = (ay + hy) / 2 + 30;
    const d = `M${ax},${ay} Q${ex},${ey} ${hx},${hy}`;
    return (
      <g key={side}>
        <path d={d} fill="none" stroke={INK} strokeWidth={56 + SW * 2} strokeLinecap="round" />
        <path d={d} fill="none" stroke={C.apron} strokeWidth={56} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={32} fill={C.skin} stroke={INK} strokeWidth={SW} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s * face},${s})`}>
      <ellipse cx={0} cy={6} rx={170} ry={26} fill="#000" opacity={0.18} />
      {/* legs */}
      <rect x={-90} y={-60} width={60} height={64} rx={20} fill="#4a3a5a" stroke={INK} strokeWidth={SW} />
      <rect x={30} y={-60} width={60} height={64} rx={20} fill="#4a3a5a" stroke={INK} strokeWidth={SW} />
      {/* one round body+head mass */}
      <ellipse cx={0} cy={-250} rx={200} ry={215} fill={C.skin} stroke={INK} strokeWidth={SW} />
      {/* apron over the lower body */}
      <path d="M-185,-200 Q0,-150 185,-200 Q190,-60 0,-38 Q-190,-60 -185,-200 Z" fill={C.apron} stroke={INK} strokeWidth={SW} />
      <path d="M-60,-140 h120 v60 h-120 z" fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />
      {/* face, low and close */}
      <ellipse cx={-52} cy={-300} rx={12} ry={15} fill={INK} />
      <ellipse cx={52} cy={-300} rx={12} ry={15} fill={INK} />
      <circle cx={-48} cy={-305} r={4} fill="#fff" />
      <circle cx={56} cy={-305} r={4} fill="#fff" />
      <ellipse cx={-100} cy={-262} rx={26} ry={16} fill={C.cheek} opacity={0.7} />
      <ellipse cx={100} cy={-262} rx={26} ry={16} fill={C.cheek} opacity={0.7} />
      <ellipse cx={0} cy={-268} rx={22} ry={18} fill="#f0a985" stroke={INK} strokeWidth={4} />
      <ellipse cx={0} cy={-222 + mouth / 2} rx={22} ry={mouth} fill="#7a2a22" stroke={INK} strokeWidth={4} />
      {/* moustache */}
      <path d="M0,-248 Q-40,-270 -95,-240 Q-60,-226 -30,-238 Q-10,-232 0,-244 Q10,-232 30,-238 Q60,-226 95,-240 Q40,-270 0,-248 Z"
        fill={C.moustache} stroke={INK} strokeWidth={5} />
      {/* hat */}
      <path d="M-120,-440 Q-170,-560 -80,-580 Q-60,-660 20,-640 Q100,-670 120,-580 Q190,-560 120,-440 Z" fill={C.hat} stroke={INK} strokeWidth={SW} />
      <rect x={-125} y={-455} width={250} height={40} rx={14} fill={C.hat} stroke={INK} strokeWidth={SW} />
      {arm("l")}
      {arm("r")}
    </g>
  );
};

/** A flat metal skewer with koobideh on it; `cooked` 0–1, `ridges` 0–1 how many thumb grooves are pressed, `roll` turns it */
const Skewer: React.FC<{ x: number; y: number; len?: number; cooked?: number; ridges?: number; roll?: number; meat?: number; sag?: number }> = ({
  x, y, len = 560, cooked = 0, ridges = 1, roll = 0, meat = 1, sag = 0,
}) => {
  const mix = (a: string, b: string, k: number) => {
    const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
    const m = (u: number, v: number) => Math.round(u + (v - u) * k).toString(16).padStart(2, "0");
    return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
  };
  const col = mix(C.meatRaw, C.meatDone, clamp(cooked));
  const n = Math.round(9 * clamp(ridges));
  const hgt = 70 * (0.85 + 0.15 * Math.cos(roll));
  const ml = len * meat;
  return (
    <g transform={`translate(${x},${y}) rotate(${sag})`}>
      <rect x={-60} y={-8} width={len + 120} height={16} rx={6} fill={C.steel} stroke={INK} strokeWidth={5} />
      <rect x={-110} y={-22} width={60} height={44} rx={12} fill={C.wood} stroke={INK} strokeWidth={5} />
      {meat > 0 && (
        <g>
          <rect x={0} y={-hgt / 2} width={ml} height={hgt} rx={hgt / 2} fill={col} stroke={INK} strokeWidth={SW} />
          {Array.from({ length: n }, (_, i) => {
            const gx = (ml * (i + 1)) / 10 + Math.sin(roll) * 6;
            return <path key={i} d={`M${gx},${-hgt / 2 + 8} q-10,${hgt / 2 - 8} 0,${hgt - 16}`} fill="none" stroke={mix(col, "#2a1208", 0.45)} strokeWidth={8} strokeLinecap="round" />;
          })}
          <ellipse cx={ml * 0.3} cy={-hgt * 0.25} rx={ml * 0.18} ry={7} fill="#fff" opacity={0.35} />
        </g>
      )}
    </g>
  );
};

const Onion: React.FC<{ T: number; x: number; y: number; s?: number; cry?: number; happy?: boolean }> = ({ T, x, y, s = 1, cry = 0, happy = false }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M0,-120 C90,-110 110,20 0,60 C-110,20 -90,-110 0,-120 Z" fill={C.onion} stroke={INK} strokeWidth={SW} />
    <path d="M0,-115 C40,-80 45,10 0,55 M0,-115 C-40,-80 -45,10 0,55" fill="none" stroke={C.onionLine} strokeWidth={5} />
    <path d="M0,-118 q-10,-40 -30,-60 M0,-118 q10,-45 25,-62" fill="none" stroke={C.leaf} strokeWidth={10} strokeLinecap="round" />
    <ellipse cx={-26} cy={-30} rx={7} ry={happy ? 4 : 9} fill={INK} />
    <ellipse cx={26} cy={-30} rx={7} ry={happy ? 4 : 9} fill={INK} />
    <path d={happy ? "M-18,0 q18,18 36,0" : "M-16,8 q16,-12 32,0"} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    {cry > 0 && [-26, 26].map((ex, i) => {
      const k = (T * 1.6 + i * 0.5) % 1;
      return <ellipse key={i} cx={ex + (i ? 6 : -6)} cy={-18 + k * 90} rx={8} ry={12} fill="#7fd0ff" stroke={INK} strokeWidth={3} opacity={cry * (1 - k)} />;
    })}
  </g>
);

const Shaker: React.FC<{ x: number; y: number; color: string; label: string; jump?: number }> = ({ x, y, color, label, jump = 0 }) => (
  <g transform={`translate(${x},${y - jump * 80}) rotate(${jump * -12})`}>
    <rect x={-60} y={-170} width={120} height={170} rx={30} fill={color} stroke={INK} strokeWidth={SW} />
    <rect x={-50} y={-210} width={100} height={50} rx={18} fill={C.steel} stroke={INK} strokeWidth={SW} />
    {[-22, 0, 22].map((d) => <circle key={d} cx={d} cy={-188} r={5} fill={INK} />)}
    <text x={0} y={-70} textAnchor="middle" fontSize={40} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">{label}</text>
  </g>
);

const Bowl: React.FC<{ T: number; x: number; y: number; knead?: number; lid?: number }> = ({ T, x, y, knead = 0, lid = 0 }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={-120} rx={300} ry={70} fill={C.meatRaw} stroke={INK} strokeWidth={SW} />
    {knead > 0 && Array.from({ length: 6 }, (_, i) => {
      const a = T * 3 + i;
      return <ellipse key={i} cx={Math.cos(a) * 170} cy={-120 + Math.sin(a) * 30} rx={40} ry={16} fill="#c25a60" />;
    })}
    <path d="M-320,-130 Q-300,120 0,130 Q300,120 320,-130 Z" fill="#5aa6c9" stroke={INK} strokeWidth={SW} />
    <path d="M-250,-40 Q0,40 250,-40" fill="none" stroke="#fff" strokeWidth={10} opacity={0.5} />
    {lid > 0 && (
      <g transform={`translate(0,${-260 + 140 * easeOut(lid)})`} opacity={clamp(lid * 3)}>
        <path d="M-330,0 Q0,-160 330,0 Z" fill="#e8eef2" stroke={INK} strokeWidth={SW} />
        <circle cx={0} cy={-90} r={26} fill="#e8eef2" stroke={INK} strokeWidth={SW} />
      </g>
    )}
  </g>
);

const Grill: React.FC<{ T: number; x: number; y: number; heat?: number; flare?: number }> = ({ T, x, y, heat = 1, flare = 0 }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-470} y={0} width={940} height={180} rx={20} fill="#5b5f6b" stroke={INK} strokeWidth={SW} />
    <rect x={-430} y={190} width={30} height={260} fill="#5b5f6b" stroke={INK} strokeWidth={SW} />
    <rect x={400} y={190} width={30} height={260} fill="#5b5f6b" stroke={INK} strokeWidth={SW} />
    {Array.from({ length: 16 }, (_, i) => {
      const g = 0.4 + 0.6 * heat * (0.6 + 0.4 * Math.sin(T * 5 + i * 1.7));
      const r = Math.round(60 + 195 * g), gg = Math.round(30 + 90 * g * g);
      return <ellipse key={i} cx={-410 + (i % 8) * 117} cy={i < 8 ? 40 : 80} rx={52} ry={30} fill={`rgb(${r},${gg},20)`} stroke={INK} strokeWidth={4} />;
    })}
    {flare > 0 && [-250, 0, 250].map((fx, i) => {
      const h = 150 * flare * (0.8 + 0.2 * Math.sin(T * 12 + i));
      return <path key={i} d={`M${fx - 50},20 Q${fx - 30},${-h * 0.6} ${fx},${-h} Q${fx + 30},${-h * 0.6} ${fx + 50},20 Z`} fill="#ffb02e" stroke={INK} strokeWidth={5} />;
    })}
  </g>
);

const RicePlate: React.FC<{ T: number; x: number; y: number; s?: number; butter?: number }> = ({ T, x, y, s = 1, butter = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={330} ry={90} fill="#fff" stroke={INK} strokeWidth={SW} />
    <ellipse cx={0} cy={-6} rx={280} ry={66} fill="#dfe8f0" />
    <path d="M-200,-10 Q-180,-230 0,-240 Q180,-230 200,-10 Z" fill={C.rice} stroke={INK} strokeWidth={SW} />
    <path d="M-120,-150 Q0,-250 120,-150 Q60,-190 0,-196 Q-60,-190 -120,-150 Z" fill={C.saffron} stroke={INK} strokeWidth={4} />
    {butter > 0 && (
      <g transform={`translate(0,${-240 + 20 * butter})`}>
        <rect x={-36} y={-30} width={72} height={34 - 14 * butter} rx={8} fill="#ffe27a" stroke={INK} strokeWidth={5} />
        <path d={`M-40,4 q20,${30 * butter} 40,0 q20,${36 * butter} 40,0`} fill="#ffe27a" opacity={0.85} />
      </g>
    )}
    {[[-90, -120], [40, -170], [110, -90], [-30, -60]].map(([a, b], i) => <circle key={i} cx={a} cy={b + Math.sin(T * 2 + i) * 2} r={5} fill="#e9d8a6" />)}
  </g>
);

const Tomato: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={70} fill={C.tomato} stroke={INK} strokeWidth={SW} />
    <ellipse cx={-25} cy={-25} rx={18} ry={10} fill="#fff" opacity={0.5} />
    {[[20, 10], [-30, 25], [35, -30]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={16} ry={10} fill="#5a1a10" opacity={0.7} />)}
    <path d="M-25,-62 l25,-22 l25,22" fill={C.leaf} stroke={INK} strokeWidth={5} />
  </g>
);

const Steam: React.FC<{ T: number; x: number; y: number; n?: number }> = ({ T, x, y, n = 3 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const k = (T * 0.5 + i / n) % 1;
      return <path key={i} d={`M${x + (i - 1) * 60},${y - k * 220} q25,-35 0,-70 q-25,-35 0,-70`} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.6 * (1 - k)} />;
    })}
  </g>
);

/** Big pop word: pops once on its time, then holds still */
const Word: React.FC<{ T: number; t: number; text: string; x: number; y: number; size?: number; color?: string; until?: number; rot?: number }> = ({
  T, t, text, x, y, size = 140, color = "#ffd34d", until = 1e9, rot = -4,
}) => {
  if (T < t || T > until) return null;
  const p = pop(T, t, 0.3);
  const fade = clamp((until - T) / 0.2);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${p})`} opacity={fade}>
      <text textAnchor="middle" dominantBaseline="middle" fontSize={size} fontWeight={900} fontFamily="Arial Black, Arial"
        fill={color} stroke={INK} strokeWidth={size * 0.11} paintOrder="stroke" strokeLinejoin="round">{text}</text>
    </g>
  );
};

// ── backgrounds ──────────────────────────────────────────────────────────────────────────────────────────────────
const Kitchen: React.FC<{ T: number; night?: number }> = ({ T, night = 0 }) => (
  <g>
    <rect width={W} height={H} fill={C.tile} />
    {Array.from({ length: 12 }, (_, r) => Array.from({ length: 7 }, (_, c) => (
      (r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 160} y={r * 110} width={160} height={110} fill={C.tile2} /> : null
    )))}
    {/* window */}
    <rect x={620} y={180} width={340} height={300} rx={20} fill={night > 0.5 ? "#1d2350" : "#9fd8ff"} stroke={INK} strokeWidth={SW} />
    {night > 0.5 && <circle cx={850} cy={270} r={40} fill="#fff6c7" stroke={INK} strokeWidth={4} opacity={clamp((night - 0.5) * 3)} />}
    <path d="M790,180 v300 M620,330 h340" stroke={INK} strokeWidth={SW} />
    {/* hanging pans */}
    {[150, 310].map((px, i) => (
      <g key={i} transform={`rotate(${Math.sin(T * 1.5 + i) * 3} ${px} 160)`}>
        <line x1={px} y1={120} x2={px} y2={200} stroke={INK} strokeWidth={6} />
        <circle cx={px} cy={260} r={62} fill="#c47a3a" stroke={INK} strokeWidth={SW} />
      </g>
    ))}
    {/* counter */}
    <rect x={-20} y={1240} width={W + 40} height={1400} fill="#c98a55" stroke={INK} strokeWidth={SW} />
    <rect x={-20} y={1240} width={W + 40} height={50} fill="#e3a873" stroke={INK} strokeWidth={SW} />
    {night > 0 && <rect width={W} height={H} fill="#0d1440" opacity={night * 0.35} />}
  </g>
);

const Yard: React.FC<{ T: number; dusk?: number; lights?: number }> = ({ T, dusk = 1, lights = 1 }) => (
  <g>
    <defs>
      <linearGradient id="yard-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={dusk > 0.5 ? "#2b2f6b" : "#ffb36b"} />
        <stop offset="1" stopColor={dusk > 0.5 ? "#ff8a5c" : "#ffe3a3"} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#yard-sky)" />
    {/* Tehran-ish skyline: domes and a tower */}
    <g fill="#3a2a4a" opacity={0.55}>
      <rect x={0} y={900} width={W} height={300} />
      <path d="M140,900 Q220,760 300,900 Z M620,900 Q720,720 820,900 Z" />
      <rect x={450} y={640} width={50} height={260} />
      <path d="M430,650 h90 l-45,-60 z" />
    </g>
    {/* string lights */}
    <path d="M-20,260 Q540,420 1100,260" fill="none" stroke={INK} strokeWidth={5} />
    {Array.from({ length: 11 }, (_, i) => {
      const x = i * 108;
      const y = 260 + Math.sin((x / 1080) * Math.PI) * 120 + 18;
      const on = lights * (0.6 + 0.4 * Math.sin(T * 4 + i));
      return <circle key={i} cx={x} cy={y} r={16} fill={["#ffd34d", "#ff6b6b", "#7ee08a"][i % 3]} stroke={INK} strokeWidth={4} opacity={0.4 + 0.6 * on} />;
    })}
    <rect x={0} y={1180} width={W} height={1500} fill="#6b8f3e" />
    <rect x={0} y={1180} width={W} height={30} fill="#7fa64a" />
  </g>
);

const Garden: React.FC<{ T: number }> = ({ T }) => (
  <g>
    <rect width={W} height={H} fill="#ffd98a" />
    <circle cx={540} cy={560} r={260} fill="#ffeab3" opacity={0.8} />
    {Array.from({ length: 10 }, (_, i) => (
      <circle key={i} cx={(i * 137) % W} cy={300 + ((i * 211) % 500)} r={8 + (i % 3) * 4} fill="#fff" opacity={0.3 + 0.3 * Math.sin(T * 2 + i)} />
    ))}
    {/* tablecloth */}
    <rect x={-20} y={1150} width={W + 40} height={1500} fill="#c2362f" stroke={INK} strokeWidth={SW} />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 130 - 20} y={1150} width={60} height={1500} fill="#a92a24" opacity={0.6} />)}
  </g>
);

// ── shots: one world per section, cut on its lines ────────────────────────────────────────────────────────────────
/** a camera zoom/offset that changes on each line start (a cut), alternating wide/close, with a slow drift */
function camera(song: Song, T: number, secId: string, focus: [number, number]) {
  const lines = song.lines.filter((l) => l.section === secId);
  let idx = 0;
  lines.forEach((l, i) => { if (T >= l.start - 0.1) idx = i; });
  const pattern = [1, 1.25, 1.08, 1.35, 1.0, 1.18, 1.3, 1.12];
  const z = pattern[idx % pattern.length];
  const shotStart = lines[idx] ? lines[idx].start - 0.1 : 0;
  const drift = 1 + clamp((T - shotStart) / 6) * 0.05;
  const zoom = z * drift;
  const [fx, fy] = focus;
  const tx = W / 2 - fx * zoom + (idx % 2 ? 20 : -20);
  const ty = 790 - fy * zoom; // subject above the template captions (y 1082+)
  return `translate(${tx},${ty}) scale(${zoom})`;
}

const Frame: React.FC<{ T: number }> = ({ T }) => {
  const { song } = useSong();
  const sec = sectionAt(song, T);
  const talk = singing(song, T);
  const lt = (id: string, w?: string, i = 0) => (w ? keyT(song, id, w) : wordT(song, id, i));
  const beat = (T - 0.325) / 0.5554;
  const pulse = Math.pow(1 - (beat - Math.floor(beat)), 3);
  let world: React.ReactNode = null;
  let overlay: React.ReactNode = null;
  let focus: [number, number] = [540, 900];

  switch (sec.id) {
    case "in": {
      const pose: Pose = T < lt("in-02") ? "wave" : T < lt("in-03") ? "shh" : T < lt("in-04") ? "point" : "cheer";
      const fire = lt("in-04", "fire");
      world = (
        <g>
          <Kitchen T={T} night={0.8} />
          <Baba T={T} x={540} y={1300} s={1.0} pose={pose} talk={talk} />
          {T > lt("in-04", "skewers") && [0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${200 + i * 30},${1500 + i * 70}) scale(${pop(T, lt("in-04", "skewers") + i * 0.12)})`}>
              <Skewer x={0} y={0} len={420} meat={0} />
            </g>
          ))}
          {T > fire && <Grill T={T} x={540} y={1700} heat={1} flare={clamp((T - fire) * 2) * (1 - clamp((T - fire - 3) / 2))} />}
        </g>
      );
      focus = [540, 950];
      overlay = (
        <g>
          <Word T={T} t={lt("in-01")} until={lt("in-02") - 0.1} text="HEY!" x={540} y={300} size={190} />
          <Word T={T} t={lt("in-02", "secret")} until={lt("in-03") - 0.1} text="THE SECRET…" x={540} y={300} size={120} color="#fff" />
          <Word T={T} t={lt("in-03", "Koobideh")} until={lt("in-04") - 0.1} text="KOOBIDEH!" x={540} y={300} size={160} />
          <Word T={T} t={fire} until={sec.end - 0.2} text="FIRE IT UP!" x={540} y={300} size={140} color="#ff8a2a" />
        </g>
      );
      break;
    }
    case "v": {
      const lamb = lt("v-01", "lamb"), onion = lt("v-02", "onion"), sq = lt("v-03", "squeeze"), salt = lt("v-05", "salt"), tur = lt("v-06", "turmeric");
      world = (
        <g>
          <Kitchen T={T} />
          <Baba T={T} x={780} y={1290} s={0.85} pose={T > sq && T < sq + 2 ? "knead" : "point"} talk={talk} face={-1} />
          {T > lamb && (
            <g transform={`translate(330,${1270 - 300 * (1 - pop(T, lamb, 0.4))})`}>
              <rect x={-170} y={-150} width={340} height={150} rx={50} fill={C.meatRaw} stroke={INK} strokeWidth={SW} />
              {[-90, 0, 90].map((d) => <ellipse key={d} cx={d} cy={-90} rx={26} ry={14} fill="#f6c7c9" />)}
            </g>
          )}
          {T > onion && T < salt && (
            <Onion T={T} x={330} y={1020} s={1.2 * pop(T, onion)} cry={T > sq ? 0 : 1} happy={T > sq} />
          )}
          {T > sq && T < sq + 1.5 && [0, 1, 2, 3].map((i) => (
            <circle key={i} cx={330 + (i - 1.5) * 50} cy={1100 + ((T - sq) * 400 + i * 30) % 160} r={12} fill="#cdeeff" stroke={INK} strokeWidth={3} />
          ))}
          {T > salt && (
            <g>
              <Shaker x={200} y={1240} color="#fff" label="SALT" jump={pulse * 0.3 + (1 - clamp((T - salt) * 3)) } />
              <Shaker x={380} y={1240} color="#444" label="" jump={pulse * 0.3} />
              {T > tur && <Shaker x={560} y={1240} color={C.saffron} label="" jump={pulse * 0.3 + (1 - clamp((T - tur) * 3))} />}
              {T > tur && T < tur + 1.2 && <circle cx={560} cy={980} r={60 + (T - tur) * 120} fill={C.saffron} opacity={0.6 * (1 - (T - tur) / 1.2)} />}
            </g>
          )}
        </g>
      );
      focus = [520, 1050];
      overlay = (
        <g>
          <Word T={T} t={lamb} until={onion - 0.1} text="2 LB LAMB" x={540} y={300} size={120} />
          <Word T={T} t={onion} until={sq - 0.1} text="3 ONIONS" x={540} y={300} size={110} color="#fff" />
          <Word T={T} t={sq} until={salt - 0.1} text="SQUEEZE!" x={540} y={300} size={140} color="#7fd0ff" />
          <Word T={T} t={salt} until={tur - 0.1} text="SALT + PEPPER" x={540} y={300} size={100} color="#fff" />
          <Word T={T} t={tur} until={sec.end - 0.2} text="TURMERIC" x={540} y={300} size={120} color={C.saffron} />
        </g>
      );
      break;
    }
    case "pc": {
      const lid = lt("pc-04", "cover");
      const knead = T < lid ? 1 : 0;
      world = (
        <g>
          <Kitchen T={T} night={clamp((T - lid) / 2)} />
          <Bowl T={T} x={540} y={1400} knead={knead} lid={clamp((T - lid) / 0.5)} />
          <Baba T={T} x={540} y={1260} s={0.75} pose={knead ? "knead" : "shh"} talk={talk} />
        </g>
      );
      focus = [540, 1150];
      overlay = (
        <g>
          <Word T={T} t={lt("pc-01", "mix")} until={lt("pc-01", "mash") - 0.05} text="MIX IT!" x={540} y={300} size={150} />
          <Word T={T} t={lt("pc-01", "mash")} until={lt("pc-02") - 0.1} text="MASH IT!" x={540} y={300} size={150} color="#ff8a8a" />
          <Word T={T} t={lt("pc-03", "ten")} until={lid - 0.1} text="10 MIN" x={540} y={300} size={150} color="#fff" />
          <Word T={T} t={lt("pc-04", "overnight")} until={sec.end} text="ZZZ… OVERNIGHT" x={540} y={300} size={90} color="#cfe0ff" />
        </g>
      );
      break;
    }
    case "ch":
    case "fin": {
      const fin = sec.id === "fin";
      const turn = lt(fin ? "fin-06" : "ch-06", fin ? "family" : "turn");
      const nSk = fin ? 4 : 3;
      world = (
        <g>
          <Yard T={T} dusk={fin ? 1 : 0.3} lights={fin ? 1 : 0.5} />
          {fin && [140, 300, 780, 940].map((fx, i) => (
            <g key={i} transform={`translate(${fx},${1230 - Math.abs(Math.sin(T * 5.6 + i)) * 40})`}>
              <circle cx={0} cy={-120} r={55} fill={C.skin} stroke={INK} strokeWidth={SW} />
              <rect x={-50} y={-70} width={100} height={110} rx={40} fill={["#5aa6c9", "#e5432f", "#7ee08a", "#b78ae0"][i]} stroke={INK} strokeWidth={SW} />
              <path d="M-14,-108 q14,14 28,0" fill="none" stroke={INK} strokeWidth={5} />
              <circle cx={-18} cy={-130} r={6} fill={INK} /><circle cx={18} cy={-130} r={6} fill={INK} />
            </g>
          ))}
          <Grill T={T} x={540} y={1380} heat={1} />
          {Array.from({ length: nSk }, (_, i) => (
            <Skewer key={i} x={250} y={1340 - i * 60} len={560} cooked={0.35 + 0.15 * i + (fin ? 0.4 : 0)} roll={T * (T > turn ? 9 : 3) + i} />
          ))}
          <Baba T={T} x={fin ? 540 : 820} y={fin ? 1180 : 1240} s={fin ? 0.7 : 0.7} pose={fin ? "cheer" : "turn"} talk={talk} face={fin ? 1 : -1} />
          <Steam T={T} x={540} y={1280} />
          {fin && Array.from({ length: 40 }, (_, i) => {
            const y = ((T * (120 + (i % 5) * 30) + i * 97) % 1900) - 50;
            return <rect key={i} x={(i * 263) % W} y={y} width={18} height={28} fill={[C.saffron, "#e5432f", "#7ee08a", "#fff"][i % 4]} transform={`rotate(${T * 90 + i * 40} ${(i * 263) % W} ${y})`} />;
          })}
        </g>
      );
      focus = [540, 1250];
      // chant lines drawn as big type on each syllable
      const chant = (fin ? ["fin-01", "fin-05"] : ["ch-01", "ch-05"]).flatMap((id) => {
        const l = song.lines.find((x) => x.id === id);
        return l ? [l] : [];
      });
      overlay = (
        <g>
          {chant.map((l) => {
            const ws = ["KOO", "BI", "DEH!"];
            const t0 = l.words[0].t;
            const step = Math.max(0.18, (l.end - t0) / 6);
            return ws.map((w, j) => (
              <Word key={l.id + j} T={T} t={t0 + j * step} until={l.end + 0.4} text={w} x={380 + (j - 1) * 50} y={300 + j * 150} size={150} rot={j % 2 ? 4 : -5} color={j === 2 ? "#ff6b4a" : "#ffd34d"} />
            ));
          })}
          <Word T={T} t={turn} until={turn + 2} text={fin ? "HOORAY!" : "TURN IT FAST!"} x={540} y={300} size={100} color="#fff" />
          <g transform={`translate(540,880) scale(${1 + pulse * 0.04})`} opacity={0}>.</g>
        </g>
      );
      break;
    }
    case "vb": {
      const ball = lt("vb-01", "ball"), place = lt("vb-03", "place"), pinch = lt("vb-05", "pinch");
      const meat = T < place ? 0 : clamp((T - place) / 2.5);
      const ridges = T < pinch ? 0 : clamp((T - pinch) / 3.5);
      world = (
        <g>
          <Kitchen T={T} />
          <Baba T={T} x={540} y={1250} s={0.8} pose={T < place ? "knead" : "turn"} talk={talk} />
          {T > ball && T < place + 0.5 && <circle cx={540} cy={1180} r={90 * pop(T, ball) * (1 - clamp((T - place) * 2))} fill={C.meatRaw} stroke={INK} strokeWidth={SW} />}
          {T > place - 0.3 && <Skewer x={260} y={1380} len={560} meat={Math.max(0.05, meat)} ridges={ridges} />}
          {T > lt("vb-07", "seal") && <circle cx={260 + 560 * ((T * 0.5) % 1)} cy={1380} r={40} fill="#fff" opacity={0.35} />}
        </g>
      );
      focus = [540, 1250];
      overlay = (
        <g>
          <Word T={T} t={lt("vb-01", "wet")} until={place - 0.1} text="WET HANDS" x={540} y={300} size={100} color="#7fd0ff" />
          <Word T={T} t={place} until={pinch - 0.1} text="ON THE SKEWER" x={540} y={300} size={100} />
          <Word T={T} t={pinch} until={lt("vb-07") - 0.1} text="PINCH! PINCH!" x={540} y={300} size={120} color="#ff8a8a" />
          <Word T={T} t={lt("vb-07", "tight")} until={sec.end} text="HOLD TIGHT" x={540} y={300} size={110} color="#fff" />
        </g>
      );
      break;
    }
    case "vbb": {
      const side = lt("vbb-03", "side"), art = lt("vbb-06", "art"), sag0 = lt("vbb-05", "flip");
      // near fail: the last skewer sags while Baba looks away, caught on "secret"
      const catchT = lt("vbb-06", "secret");
      const sag = T > sag0 && T < catchT ? clamp((T - sag0) / (catchT - sag0)) * 22 : T >= catchT ? 22 * (1 - clamp((T - catchT) / 0.3)) : 0;
      world = (
        <g>
          <rect width={W} height={H + 800} fill="#1b1220" />
          {Array.from({ length: 30 }, (_, i) => {
            const k = (T * 0.4 + i / 30) % 1;
            return <circle key={i} cx={(i * 173) % W + Math.sin(T * 2 + i) * 20} cy={1500 - k * 1300} r={4 + (i % 3) * 2} fill="#ff9a3a" opacity={1 - k} />;
          })}
          <Grill T={T} x={540} y={1380} heat={clamp((T - sec.start) / 2)} flare={0} />
          {T > side && [0, 1, 2, 3].map((i) => (
            <g key={i} transform={`scale(${pop(T, side + i * 0.15)})`} style={{ transformOrigin: "540px 1300px" }}>
              <Skewer x={250} y={1340 - i * 55} len={560} cooked={clamp((T - side) / 14)} roll={T * 6 + i} sag={i === 3 ? sag : 0} />
            </g>
          ))}
          <Baba T={T} x={800} y={1320} s={0.6} pose={T > sag0 && T < catchT ? "wave" : "turn"} talk={talk} face={-1} />
        </g>
      );
      focus = [540, 1250];
      overlay = (
        <g>
          <Word T={T} t={lt("vbb-01", "red")} until={side - 0.1} text="GLOWING RED" x={540} y={300} size={120} color="#ff6a1a" />
          <Word T={T} t={side} until={sag0 - 0.1} text="SIDE BY SIDE" x={540} y={300} size={110} color="#fff" />
          <Word T={T} t={sag0 + 0.6} until={catchT - 0.05} text="UH-OH…" x={540} y={300} size={140} color="#ff8a8a" />
          <Word T={T} t={catchT} until={art + 1} text="SAVED!" x={540} y={300} size={160} />
          <Word T={T} t={lt("vbb-07", "golden")} until={sec.end} text="GOLDEN" x={540} y={300} size={150} color={C.saffron} />
        </g>
      );
      break;
    }
    case "br": {
      const tom = lt("br-01", "tomatoes"), herb = lt("br-02", "herbs"), rice = lt("br-03", "saffron"), bt = lt("br-04", "butter"), sum = lt("br-05", "sumac"), lime = lt("br-05", "lime"), gather = lt("br-06", "gather"), teh = lt("br-07", "tehran");
      world = (
        <g>
          <Garden T={T} />
          {T < gather + 0.6 && <g opacity={1 - clamp((T - gather) / 0.6)}><Baba T={T} x={840} y={1160} s={0.55} pose={T < rice ? "wave" : "point"} face={-1} talk={talk} /></g>}
          {T > teh && (
            <g opacity={clamp((T - teh) * 2)} fill="#c98a3a">
              <path d="M100,1150 Q200,900 300,1150 Z M700,1150 Q820,860 940,1150 Z" />
              <rect x={470} y={760} width={60} height={390} />
            </g>
          )}
          {T > rice && <RicePlate T={T} x={540} y={1350} s={pop(T, rice)} butter={clamp((T - bt) / 2)} />}
          {T > rice && <Steam T={T} x={540} y={1080} />}
          {T > tom && <Tomato x={190} y={1310} s={pop(T, tom)} />}
          {T > tom && <Tomato x={890} y={1310} s={pop(T, tom + 0.2)} />}
          {T > herb && [0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={130 + i * 205} cy={1560} rx={70 * pop(T, herb + i * 0.08)} ry={34} fill={C.leaf} stroke={INK} strokeWidth={5} />
          ))}
          {T > sum && T < gather && Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={440 + (i * 53) % 200} cy={950 + ((T - sum) * 350 + i * 40) % 260} r={8} fill="#8e1b2e" />
          ))}
          {T > lime && <circle cx={840} cy={1560} r={60 * pop(T, lime)} fill={C.lime} stroke={INK} strokeWidth={SW} />}
          {T > gather && [120, 300, 780, 960].map((fx, i) => (
            <g key={i} transform={`translate(${fx},${1150 - 150 * pop(T, gather + i * 0.15)})`}>
              <circle cx={0} cy={-60} r={55} fill={C.skin} stroke={INK} strokeWidth={SW} />
              <rect x={-50} y={-10} width={100} height={90} rx={36} fill={["#5aa6c9", "#e5432f", "#7ee08a", "#b78ae0"][i]} stroke={INK} strokeWidth={SW} />
              <path d="M-14,-48 q14,14 28,0" fill="none" stroke={INK} strokeWidth={5} />
              <circle cx={-18} cy={-70} r={6} fill={INK} /><circle cx={18} cy={-70} r={6} fill={INK} />
            </g>
          ))}
        </g>
      );
      focus = [540, 1250];
      overlay = (
        <g>
          <Word T={T} t={rice} until={bt - 0.1} text="SAFFRON RICE" x={540} y={300} size={110} color={C.saffron} />
          <Word T={T} t={bt} until={sum - 0.1} text="BUTTER!" x={540} y={300} size={150} color="#ffe27a" />
          <Word T={T} t={gather} until={teh - 0.1} text="DINNER TIME!" x={540} y={300} size={120} color="#fff" />
          <Word T={T} t={teh} until={sec.end} text="TEHRAN TO THE WORLD" x={540} y={300} size={80} color="#fff" />
        </g>
      );
      break;
    }
    default: {
      // sp + outro: Baba at the table winks, then the title card
      const fun = lt("sp-04", "fun");
      world = (
        <g>
          <Garden T={T} />
          <RicePlate T={T} x={540} y={1560} s={0.9} butter={1} />
          <Skewer x={300} y={1630} len={480} cooked={1} roll={T} />
          <Baba T={T} x={540} y={1330} s={0.75} pose={T > fun ? "cheer" : "point"} talk={talk} />
        </g>
      );
      focus = [540, 1250];
      overlay = (
        <g>
          <Word T={T} t={lt("sp-02", "squeeze")} until={lt("sp-03") - 0.1} text="SQUEEZE · KNEAD" x={540} y={300} size={90} color="#fff" />
          <Word T={T} t={lt("sp-03", "turning")} until={fun - 0.1} text="KEEP TURNING!" x={540} y={300} size={110} />
          <Word T={T} t={fun} until={1e9} text="PERSIAN" x={540} y={250} size={120} color="#fff" />
          <Word T={T} t={fun + 0.4} until={1e9} text="KOOBIDEH" x={540} y={390} size={160} />
        </g>
      );
    }
  }

  return (
    <Svg w={W} h={H}>
      <g transform={camera(song, T, sec.id, focus)}>{world}</g>
      {overlay}
    </Svg>
  );
};

/** 9:16 frame: the reel */
export const KoobidehTall: React.FC<{ T: number }> = ({ T }) => <Frame T={T} />;

/** 16:9 frame: the same tall picture centred on the stage (the reel is the deliverable) */
export const Koobideh: React.FC<{ T: number }> = ({ T }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", background: "#1b1220" }}>
    <div style={{ width: 607, height: 1080, position: "relative" }}>
      <div style={{ transform: "scale(0.5625)", transformOrigin: "0 0", width: W, height: H, position: "absolute" }}>
        <Frame T={T} />
      </div>
    </div>
  </div>
);

/** The chant lines are drawn as big type; the template captions every other line */
export function linesDrawnByScene(song: Song): Set<string> {
  return new Set(["ch-01", "ch-05", "fin-01", "fin-05"].filter((id) => song.lines.some((l) => l.id === id)));
}
