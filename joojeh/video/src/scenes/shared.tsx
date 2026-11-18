import React from "react";
import { Song, Svg, useSong } from "../kit";

/**
 * Shared Baba Kabab pieces (from the Koobideh reel): characters, props, places, camera, timing helpers.
 * Story rule: "keep turning, or it falls" (set up in the chorus, nearly fails in verse 3, pays off in the final chorus).
 * Toon look drawn with plain strokes (INK) instead of the toon filter: the filter renders very slowly on Windows.
 * Everything is a pure function of song time T.
 */

export const INK = "#3a1d12";
export const W = 1080;
export const H = 1920;
export const C = {
  apron: "#fdfaf2", skin: "#f6c9a0", cheek: "#ef8a7a", moustache: "#8a8a92", hat: "#ffffff",
  meatRaw: "#d9767a", meatDone: "#8a4320", onion: "#f1e4f2", onionLine: "#b98bc0", leaf: "#6fb04a",
  saffron: "#ffb627", rice: "#fffaf0", tomato: "#e5432f", lime: "#a6d64a", steel: "#c9ccd6",
  coal: "#3b2a26", ember: "#ff6a1a", wood: "#a4643a", tile: "#fbe9cf", tile2: "#f4d7b0",
};
export const SW = 7; // outline width

// ── time helpers ─────────────────────────────────────────────────────────────────────────────────────────────────
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const easeOut = (k: number) => 1 - Math.pow(1 - clamp(k), 3);
/** 0 → 1 over d seconds from t, with a small overshoot */
export const pop = (T: number, t: number, d = 0.35) => {
  const k = clamp((T - t) / d);
  return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) + (easeOut(k) - 1);
};
export const wordT = (song: Song, id: string, i = 0) => {
  const l = song.lines.find((x) => x.id === id);
  if (!l) return 1e9;
  return (l.words[Math.min(i, l.words.length - 1)] || { t: l.start }).t;
};
/** index of the word whose text contains `w` (first match), for key-word timing */
export const keyT = (song: Song, id: string, w: string) => {
  const l = song.lines.find((x) => x.id === id);
  if (!l) return 1e9;
  const i = l.words.findIndex((x) => x.w.toLowerCase().includes(w.toLowerCase()));
  return i < 0 ? l.start : l.words[i].t;
};
export const singing = (song: Song, T: number) => song.lines.some((l) => T >= l.start && T <= l.end);

/** which drawn moment we are in: the section id, its local progress */
export function sectionAt(song: Song, T: number) {
  const s = song.sections.find((x) => T >= x.start && T < x.end) || song.sections[song.sections.length - 1];
  return { id: s.id, k: (T - s.start) / (s.end - s.start), start: s.start, end: s.end };
}

// ── characters and props ─────────────────────────────────────────────────────────────────────────────────────────
export type Pose = "idle" | "wave" | "shh" | "knead" | "turn" | "cheer" | "point";

/** Baba Kabab: one round mass, small features low and close, tall hat. Origin at his feet, s = 1 is ~520 px tall */
export const Baba: React.FC<{ T: number; x: number; y: number; s?: number; pose?: Pose; talk?: boolean; face?: 1 | -1 }> = ({
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
export const Skewer: React.FC<{ x: number; y: number; len?: number; cooked?: number; ridges?: number; roll?: number; meat?: number; sag?: number }> = ({
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

export const Onion: React.FC<{ T: number; x: number; y: number; s?: number; cry?: number; happy?: boolean }> = ({ T, x, y, s = 1, cry = 0, happy = false }) => (
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

export const Shaker: React.FC<{ x: number; y: number; color: string; label: string; jump?: number }> = ({ x, y, color, label, jump = 0 }) => (
  <g transform={`translate(${x},${y - jump * 80}) rotate(${jump * -12})`}>
    <rect x={-60} y={-170} width={120} height={170} rx={30} fill={color} stroke={INK} strokeWidth={SW} />
    <rect x={-50} y={-210} width={100} height={50} rx={18} fill={C.steel} stroke={INK} strokeWidth={SW} />
    {[-22, 0, 22].map((d) => <circle key={d} cx={d} cy={-188} r={5} fill={INK} />)}
    <text x={0} y={-70} textAnchor="middle" fontSize={40} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">{label}</text>
  </g>
);

export const Bowl: React.FC<{ T: number; x: number; y: number; knead?: number; lid?: number }> = ({ T, x, y, knead = 0, lid = 0 }) => (
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

export const Grill: React.FC<{ T: number; x: number; y: number; heat?: number; flare?: number }> = ({ T, x, y, heat = 1, flare = 0 }) => (
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

export const RicePlate: React.FC<{ T: number; x: number; y: number; s?: number; butter?: number }> = ({ T, x, y, s = 1, butter = 0 }) => (
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

export const Tomato: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={70} fill={C.tomato} stroke={INK} strokeWidth={SW} />
    <ellipse cx={-25} cy={-25} rx={18} ry={10} fill="#fff" opacity={0.5} />
    {[[20, 10], [-30, 25], [35, -30]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={16} ry={10} fill="#5a1a10" opacity={0.7} />)}
    <path d="M-25,-62 l25,-22 l25,22" fill={C.leaf} stroke={INK} strokeWidth={5} />
  </g>
);

export const Steam: React.FC<{ T: number; x: number; y: number; n?: number }> = ({ T, x, y, n = 3 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const k = (T * 0.5 + i / n) % 1;
      return <path key={i} d={`M${x + (i - 1) * 60},${y - k * 220} q25,-35 0,-70 q-25,-35 0,-70`} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.6 * (1 - k)} />;
    })}
  </g>
);

/** Big pop word: pops once on its time, then holds still */
export const Word: React.FC<{ T: number; t: number; text: string; x: number; y: number; size?: number; color?: string; until?: number; rot?: number }> = ({
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
export const Kitchen: React.FC<{ T: number; night?: number }> = ({ T, night = 0 }) => (
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

export const Yard: React.FC<{ T: number; dusk?: number; lights?: number }> = ({ T, dusk = 1, lights = 1 }) => (
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

export const Garden: React.FC<{ T: number }> = ({ T }) => (
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
export function camera(song: Song, T: number, secId: string, focus: [number, number]) {
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
  const ty = 870 - fy * zoom; // inside Instagram's 4:5 feed crop (y 285-1635) // subject above the template captions (y 1082+)
  return `translate(${tx},${ty}) scale(${zoom})`;
}

