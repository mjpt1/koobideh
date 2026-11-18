import React from "react";
import { Song, Svg, useSong } from "../kit";
import {
  Baba, C, Garden, Grill, INK, Kitchen, Onion, Pose, RicePlate, SW, Shaker, Steam, Tomato, W, H, Word, Yard,
  camera, clamp, easeOut, keyT, pop, sectionAt, singing, wordT,
} from "./shared";

/**
 * Joojeh Kebab — the second Baba Kabab reel (9:16, toon). Same chef, same style as the Koobideh reel.
 * Story rule: "saffron is gold": the chicken turns golden only after the saffron water touches it
 * (set up in the pre-chorus, paid off on the grill and at the feast).
 */

const J = {
  raw: "#f3c2b4", gold: "#f2a428", done: "#c8741e", yogurt: "#fbf6ea", lemon: "#ffe14d", oil: "#c9d64a",
  fridge: "#dfe9f2", saffronWater: "#ff9f1c", butter: "#ffe27a",
};

const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const m = (u: number, v: number) => Math.round(u + (v - u) * clamp(k)).toString(16).padStart(2, "0");
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
};
/** raw → golden (saffron) → grilled */
const chickenColor = (gold: number, cooked: number) => mix(mix(J.raw, J.gold, gold), J.done, cooked * 0.7);

/** One chicken cube with rounded corners and a char mark once cooked */
const Cube: React.FC<{ x: number; y: number; s?: number; gold?: number; cooked?: number; rot?: number }> = ({ x, y, s = 1, gold = 0, cooked = 0, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-42} y={-42} width={84} height={84} rx={20} fill={chickenColor(gold, cooked)} stroke={INK} strokeWidth={SW} />
    <path d="M-26,-22 q26,-10 52,0" fill="none" stroke="#fff" strokeWidth={6} opacity={0.4} strokeLinecap="round" />
    {cooked > 0.3 && <path d="M-30,10 l60,-20 M-30,30 l60,-20" stroke="#5a2a10" strokeWidth={7} opacity={clamp((cooked - 0.3) * 2)} strokeLinecap="round" />}
  </g>
);

/** A skewer of chicken cubes with gaps between them; `n` cubes slid on so far (fractional slides the last one in) */
const ChickenSkewer: React.FC<{ x: number; y: number; n?: number; gold?: number; cooked?: number; roll?: number }> = ({
  x, y, n = 6, gold = 1, cooked = 0, roll = 0,
}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-60} y={-8} width={680} height={16} rx={6} fill={C.steel} stroke={INK} strokeWidth={5} />
    <rect x={-110} y={-22} width={60} height={44} rx={12} fill={C.wood} stroke={INK} strokeWidth={5} />
    {Array.from({ length: Math.ceil(n) }, (_, i) => {
      const k = i < Math.floor(n) ? 1 : n - Math.floor(n);
      return <Cube key={i} x={40 + i * 100 + (1 - k) * 300} y={0} s={0.8} gold={gold} cooked={cooked} rot={Math.sin(roll + i) * 6} />;
    })}
  </g>
);

const Lemon: React.FC<{ x: number; y: number; s?: number; half?: boolean }> = ({ x, y, s = 1, half = false }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {half ? (
      <g>
        <circle r={60} fill={J.lemon} stroke={INK} strokeWidth={SW} />
        <circle r={44} fill="#fff6b0" />
        {Array.from({ length: 8 }, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos(i * 0.785) * 42} y2={Math.sin(i * 0.785) * 42} stroke={J.lemon} strokeWidth={6} />)}
      </g>
    ) : (
      <g>
        <ellipse rx={70} ry={52} fill={J.lemon} stroke={INK} strokeWidth={SW} />
        <ellipse cx={-22} cy={-18} rx={18} ry={9} fill="#fff" opacity={0.6} />
      </g>
    )}
  </g>
);

const Bottle: React.FC<{ x: number; y: number; tilt?: number }> = ({ x, y, tilt = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${tilt})`}>
    <path d="M-45,0 v-170 q0,-30 25,-40 v-50 h40 v50 q25,10 25,40 v170 z" fill={J.oil} stroke={INK} strokeWidth={SW} />
    <rect x={-20} y={-280} width={40} height={24} rx={6} fill={C.wood} stroke={INK} strokeWidth={5} />
    <rect x={-35} y={-120} width={70} height={60} rx={10} fill="#fff" stroke={INK} strokeWidth={4} />
  </g>
);

/** A wide bowl holding chicken cubes in white yogurt marinade, which turns gold as `gold` rises */
const MarinadeBowl: React.FC<{ T: number; x: number; y: number; cubes?: number; gold?: number; stir?: number; lid?: number }> = ({
  T, x, y, cubes = 8, gold = 0, stir = 0, lid = 0,
}) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={-120} rx={300} ry={70} fill={mix(J.yogurt, J.gold, gold * 0.8)} stroke={INK} strokeWidth={SW} />
    {Array.from({ length: Math.round(cubes) }, (_, i) => {
      const a = i * 0.8 + stir * T * 3;
      return <Cube key={i} x={Math.cos(a) * 180} y={-125 + Math.sin(a) * 28} s={0.55} gold={gold} rot={i * 20 + stir * T * 50} />;
    })}
    <path d="M-320,-130 Q-300,120 0,130 Q300,120 320,-130 Z" fill="#e87b5a" stroke={INK} strokeWidth={SW} />
    <path d="M-250,-40 Q0,40 250,-40" fill="none" stroke="#fff" strokeWidth={10} opacity={0.5} />
    {lid > 0 && (
      <g transform={`translate(0,${-260 + 140 * easeOut(lid)})`} opacity={clamp(lid * 3)}>
        <path d="M-330,0 Q0,-60 330,0 v20 h-660 z" fill="#bfe3f7" stroke={INK} strokeWidth={SW} opacity={0.9} />
      </g>
    )}
  </g>
);

/** Mortar with saffron threads; `crush` 0–1 grinds them, `pour` 0–1 fills the cup with gold water */
const Saffron: React.FC<{ T: number; x: number; y: number; crush?: number; pour?: number }> = ({ T, x, y, crush = 0, pour = 0 }) => (
  <g transform={`translate(${x},${y})`}>
    {/* mortar */}
    <path d="M-170,-120 Q-160,30 -60,40 h120 Q160,30 170,-120 Z" fill="#9aa3b5" stroke={INK} strokeWidth={SW} />
    <ellipse cx={0} cy={-120} rx={170} ry={36} fill="#6f7789" stroke={INK} strokeWidth={SW} />
    {Array.from({ length: 12 }, (_, i) => (
      <path key={i} d={`M${-110 + i * 20},${-120 + (i % 3) * 6} q8,-14 ${16 - crush * 12},-${18 - crush * 14}`} stroke="#d7261e" strokeWidth={6} fill="none" strokeLinecap="round" />
    ))}
    {/* pestle */}
    <g transform={`translate(${40},${-200 + (crush > 0 && crush < 1 ? Math.abs(Math.sin(T * 12)) * -60 : 0)}) rotate(20)`}>
      <rect x={-28} y={-200} width={56} height={240} rx={28} fill="#c7cdd8" stroke={INK} strokeWidth={SW} />
    </g>
    {/* glass of saffron water */}
    <g transform="translate(330,40)">
      <path d="M-80,-220 L-65,0 H65 L80,-220 Z" fill="#e8f6ff" stroke={INK} strokeWidth={SW} opacity={0.9} />
      <path d={`M${-80 + 15 * (1 - pour)},${-220 * pour} L-65,0 H65 L${80 - 15 * (1 - pour)},${-220 * pour} Z`} fill={J.saffronWater} opacity={0.9} />
      {pour > 0 && pour < 1 && <Steam T={T} x={0} y={-240} n={2} />}
    </g>
  </g>
);

const Fridge: React.FC<{ x: number; y: number; open?: number }> = ({ x, y, open = 0 }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-200} y={-760} width={400} height={760} rx={40} fill={J.fridge} stroke={INK} strokeWidth={SW} />
    <line x1={-200} y1={-470} x2={200} y2={-470} stroke={INK} strokeWidth={SW} />
    <rect x={150} y={-700} width={20} height={150} rx={10} fill="#9aa3b5" stroke={INK} strokeWidth={4} />
    <rect x={150} y={-420} width={20} height={200} rx={10} fill="#9aa3b5" stroke={INK} strokeWidth={4} />
    {open > 0 && <rect x={-180} y={-450} width={360} height={430} fill="#bfe3f7" opacity={0.6 * open} />}
  </g>
);

const Thermometer: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <g transform={`translate(${x},${y}) rotate(-20)`}>
    <rect x={-14} y={-260} width={28} height={220} rx={14} fill="#e8eef2" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-260} r={70} fill="#fff" stroke={INK} strokeWidth={SW} />
    <text x={0} y={-245} textAnchor="middle" fontSize={50} fontWeight={900} fontFamily="Arial Black, Arial" fill={k >= 1 ? "#2e9e48" : INK}>
      {Math.round(20 + 54 * clamp(k))}°
    </text>
  </g>
);

const NoSign: React.FC<{ x: number; y: number; s?: number; children: React.ReactNode; k: number }> = ({ x, y, s = 1, children, k }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {children}
    {k > 0 && (
      <g opacity={clamp(k * 4)}>
        <circle r={130} fill="none" stroke="#e5302a" strokeWidth={22} />
        <line x1={-92} y1={-92} x2={92} y2={92} stroke="#e5302a" strokeWidth={22} />
      </g>
    )}
  </g>
);
const Burger = () => (
  <g>
    <path d="M-100,-10 Q-100,-90 0,-90 Q100,-90 100,-10 Z" fill="#e3a14a" stroke={INK} strokeWidth={SW} />
    <rect x={-105} y={-12} width={210} height={30} rx={10} fill="#6b3a1e" stroke={INK} strokeWidth={SW} />
    <rect x={-100} y={20} width={200} height={34} rx={14} fill="#e3a14a" stroke={INK} strokeWidth={SW} />
  </g>
);
const Fries = () => (
  <g>
    {[-40, -15, 10, 35].map((fx, i) => <rect key={i} x={fx} y={-110 + (i % 2) * 15} width={20} height={90} fill="#ffd34d" stroke={INK} strokeWidth={4} />)}
    <path d="M-70,-40 h140 l-15,100 h-110 z" fill="#e5302a" stroke={INK} strokeWidth={SW} />
  </g>
);

/** chant lines drawn as big type, one syllable per beat-ish step */
const Chant: React.FC<{ T: number; song: Song; ids: string[] }> = ({ T, song, ids }) => (
  <g>
    {ids.flatMap((id) => {
      const l = song.lines.find((x) => x.id === id);
      if (!l) return [];
      const ws = ["JOO", "JEH!", "JOO", "JEH!"];
      const t0 = l.words[0].t;
      const step = Math.max(0.16, (l.end - t0) / 4);
      return ws.map((w, j) => (
        <Word key={id + j} T={T} t={t0 + j * step} until={l.end + 0.4} text={w} x={j % 2 ? 640 : 400} y={400 + Math.floor(j / 2) * 150}
          size={150} rot={j % 2 ? 5 : -5} color={j % 2 ? "#ff6b4a" : "#ffd34d"} />
      ));
    })}
  </g>
);

const Family: React.FC<{ T: number; y: number; t: number; dance?: boolean }> = ({ T, y, t, dance = false }) => (
  <g>
    {[120, 300, 780, 960].map((fx, i) => (
      <g key={i} transform={`translate(${fx},${y - 150 * pop(T, t + i * 0.15) - (dance ? Math.abs(Math.sin(T * 5.6 + i)) * 40 : 0)})`}>
        <circle cx={0} cy={-60} r={55} fill={C.skin} stroke={INK} strokeWidth={SW} />
        <rect x={-50} y={-10} width={100} height={90} rx={36} fill={["#5aa6c9", "#e5432f", "#7ee08a", "#b78ae0"][i]} stroke={INK} strokeWidth={SW} />
        <path d="M-14,-48 q14,14 28,0" fill="none" stroke={INK} strokeWidth={5} />
        <circle cx={-18} cy={-70} r={6} fill={INK} /><circle cx={18} cy={-70} r={6} fill={INK} />
      </g>
    ))}
  </g>
);

const Frame: React.FC<{ T: number }> = ({ T }) => {
  const { song } = useSong();
  const sec = sectionAt(song, T);
  const talk = singing(song, T);
  const lt = (id: string, w?: string, i = 0) => (w ? keyT(song, id, w) : wordT(song, id, i));
  const beat = (T - song.grid.phi) / song.grid.beat;
  const pulse = Math.pow(1 - (beat - Math.floor(beat)), 3);
  // saffron rule: chicken is gold from "saffron water" in the pre-chorus on
  const goldAt = lt("pc-02", "saffron");
  let world: React.ReactNode = null;
  let overlay: React.ReactNode = null;
  let focus: [number, number] = [540, 1050];

  switch (sec.id) {
    case "in": {
      const forget = lt("in-02", "burgers"), fries = lt("in-02", "fries"), para = lt("in-03", "paradise"), saff = lt("in-04", "saffron"), title = lt("in-05", "joojeh");
      const pose: Pose = T < forget ? "wave" : T < para ? "point" : T < title ? "shh" : "cheer";
      world = (
        <g>
          <Kitchen T={T} night={0.8} />
          <Baba T={T} x={720} y={1300} s={0.9} pose={pose} talk={talk} face={-1} />
          {T > forget - 0.4 && T < para && <NoSign x={260} y={1000} s={pop(T, forget - 0.4)} k={(T - forget) * 3}><Burger /></NoSign>}
          {T > fries - 0.3 && T < para && <NoSign x={260} y={1220} s={0.9 * pop(T, fries - 0.3)} k={(T - fries) * 3}><Fries /></NoSign>}
          {T > saff && <g transform={`translate(260,1200) scale(${0.7 * pop(T, saff)})`}><Saffron T={T} x={0} y={0} /></g>}
        </g>
      );
      overlay = (
        <g>
          <Word T={T} t={lt("in-01")} until={forget - 0.1} text="HEY!" x={540} y={410} size={190} />
          <Word T={T} t={para} until={saff - 0.1} text="CHICKEN PARADISE" x={540} y={410} size={90} color="#fff" />
          <Word T={T} t={saff} until={title - 0.1} text="SAFFRON + SKEWERS" x={540} y={410} size={86} color={C.saffron} />
          <Word T={T} t={title} until={sec.end - 0.1} text="JOOJEH KEBAB!" x={540} y={410} size={100} />
        </g>
      );
      break;
    }
    case "v": {
      const sq = lt("v-01", "squares"), on = lt("v-03", "onions"), yog = lt("v-04", "yogurt"), lem = lt("v-05", "lemon"), oil = lt("v-06", "oil"), salt = lt("v-07", "salt"), tur = lt("v-08", "turmeric");
      const cubes = T < sq ? 0 : Math.min(6, (T - sq) * 6);
      world = (
        <g>
          <Kitchen T={T} />
          <Baba T={T} x={760} y={1280} s={0.8} pose={T < on ? "knead" : "point"} talk={talk} face={-1} />
          {/* cutting board with cubes */}
          <rect x={90} y={1150} width={480} height={90} rx={24} fill={C.wood} stroke={INK} strokeWidth={SW} />
          {Array.from({ length: Math.ceil(cubes) }, (_, i) => (
            <Cube key={i} x={160 + (i % 3) * 120} y={1100 - Math.floor(i / 3) * 90} s={0.9 * pop(T, sq + i / 6)} />
          ))}
          {T > on && T < yog + 0.3 && <Onion T={T} x={330} y={860} s={0.9 * pop(T, on)} cry={1} />}
          {T > yog && T < salt && (
            <g transform={`translate(330,${930}) scale(${pop(T, yog)})`}>
              <path d="M-100,-80 h200 l-20,150 h-160 z" fill={J.yogurt} stroke={INK} strokeWidth={SW} />
              <text x={0} y={10} textAnchor="middle" fontSize={44} fontWeight={900} fontFamily="Arial Black, Arial" fill="#5aa6c9">MAST</text>
            </g>
          )}
          {T > lem && T < salt && <Lemon x={160} y={1040 - 40 * pop(T, lem)} half s={0.8} />}
          {T > oil && T < salt && <Bottle x={520} y={1150} tilt={T > oil + 0.3 && T < oil + 1.5 ? -35 : 0} />}
          {T > salt && (
            <g>
              <Shaker x={170} y={1150} color="#fff" label="SALT" jump={pulse * 0.3 + (1 - clamp((T - salt) * 3))} />
              <Shaker x={330} y={1150} color="#444" label="" jump={pulse * 0.3} />
              {T > tur && <Shaker x={490} y={1150} color={C.saffron} label="" jump={pulse * 0.3 + (1 - clamp((T - tur) * 3))} />}
              {T > tur && T < tur + 1.2 && <circle cx={490} cy={880} r={60 + (T - tur) * 120} fill={C.saffron} opacity={0.6 * (1 - (T - tur) / 1.2)} />}
            </g>
          )}
        </g>
      );
      overlay = (
        <g>
          <Word T={T} t={sq} until={on - 0.1} text="2 LB CHICKEN" x={540} y={410} size={110} color="#fff" />
          <Word T={T} t={on} until={yog - 0.1} text="2 ONIONS" x={540} y={410} size={120} />
          <Word T={T} t={yog} until={lem - 0.1} text="+ YOGURT" x={540} y={410} size={120} color="#fff" />
          <Word T={T} t={lem} until={oil - 0.1} text="LEMON!" x={540} y={410} size={140} color={J.lemon} />
          <Word T={T} t={oil} until={salt - 0.1} text="OLIVE OIL" x={540} y={410} size={120} color={J.oil} />
          <Word T={T} t={salt} until={tur - 0.1} text="SALT + PEPPER" x={540} y={410} size={100} color="#fff" />
          <Word T={T} t={tur} until={sec.end - 0.1} text="TURMERIC" x={540} y={410} size={120} color={C.saffron} />
        </g>
      );
      break;
    }
    case "pc": {
      const key = lt("pc-01", "key"), crush = lt("pc-03", "crush"), hot = lt("pc-03", "hot"), magic = lt("pc-04", "magic");
      world = (
        <g>
          <Kitchen T={T} night={0.3} />
          <Baba T={T} x={760} y={1250} s={0.7} pose={T < key ? "shh" : T < crush ? "point" : "knead"} talk={talk} face={-1} />
          <g transform="translate(330,1180) scale(0.9)">
            <Saffron T={T} x={0} y={0} crush={clamp((T - crush) / 1.5)} pour={clamp((T - hot) / 1.2)} />
          </g>
          {T > magic && Array.from({ length: 12 }, (_, i) => {
            const a = i * 0.52 + T;
            const r = 120 + ((T - magic) * 260) % 260;
            return <circle key={i} cx={630 + Math.cos(a) * r} cy={1050 + Math.sin(a) * r * 0.6} r={9} fill="#ffe27a" opacity={1 - clamp((T - magic) / 3)} />;
          })}
        </g>
      );
      overlay = (
        <g>
          <Word T={T} t={lt("pc-01", "wait")} until={key - 0.05} text="WAIT…" x={540} y={410} size={150} color="#fff" />
          <Word T={T} t={key} until={goldAt - 0.1} text="THE KEY:" x={540} y={410} size={130} />
          <Word T={T} t={goldAt} until={crush - 0.1} text="SAFFRON WATER" x={540} y={410} size={100} color={C.saffron} />
          <Word T={T} t={crush} until={magic - 0.1} text="CRUSH + HOT WATER" x={540} y={410} size={80} color="#fff" />
          <Word T={T} t={magic} until={sec.end} text="MAGIC!" x={540} y={410} size={170} color={J.butter} />
        </g>
      );
      break;
    }
    case "ch":
    case "fin": {
      const fin = sec.id === "fin";
      const mar = lt("ch-06", "marinate"), fire = lt(fin ? "fin-03" : "ch-07", fin ? "charcoal" : "fire"), friends = lt("fin-06", "friends");
      const onGrill = fin || T > fire;
      world = (
        <g>
          <Yard T={T} dusk={fin ? 1 : 0.3} lights={fin ? 1 : 0.5} />
          {fin && T > friends && <Family T={T} y={1200} t={friends} dance />}
          <Grill T={T} x={540} y={1380} heat={onGrill ? 1 : 0.4} />
          {onGrill
            ? [0, 1, 2].map((i) => <ChickenSkewer key={i} x={230} y={1350 - i * 100} n={6} gold={1} cooked={fin ? 1 : clamp((T - fire) / 4)} roll={T * 4 + i} />)
            : <MarinadeBowl T={T} x={540} y={1300} gold={clamp((T - lt("ch-02", "golden")) / 1.5)} stir={T > mar ? 1 : 0.3} />}
          <Baba T={T} x={fin ? 540 : 760} y={fin ? 1180 : 1240} s={0.65} pose={fin ? "cheer" : onGrill ? "turn" : "point"} talk={talk} face={fin ? 1 : -1} />
          {onGrill && <Steam T={T} x={540} y={1260} />}
          {fin && Array.from({ length: 40 }, (_, i) => {
            const y = ((T * (120 + (i % 5) * 30) + i * 97) % 1900) - 50;
            return <rect key={i} x={(i * 263) % W} y={y} width={18} height={28} fill={[C.saffron, "#e5432f", "#7ee08a", "#fff"][i % 4]} transform={`rotate(${T * 90 + i * 40} ${(i * 263) % W} ${y})`} />;
          })}
        </g>
      );
      focus = [540, 1150];
      overlay = (
        <g>
          <Chant T={T} song={song} ids={fin ? ["fin-01", "fin-05"] : ["ch-01", "ch-05"]} />
          {!fin && <Word T={T} t={lt("ch-02", "golden")} until={lt("ch-04") + 2} text="GOLDEN CHICKEN" x={540} y={410} size={88} color={C.saffron} />}
          {!fin && <Word T={T} t={mar} until={fire - 0.1} text="MARINATE…" x={540} y={410} size={120} color="#fff" />}
          {!fin && <Word T={T} t={fire} until={sec.end} text="ON THE FIRE!" x={540} y={410} size={120} color="#ff8a2a" />}
          {fin && <Word T={T} t={lt("fin-02", "hooray")} until={lt("fin-03") + 2} text="HIP HOORAY!" x={540} y={410} size={130} color="#fff" />}
          {fin && <Word T={T} t={friends} until={sec.end} text="BRING YOUR FRIENDS!" x={540} y={410} size={85} color="#fff" />}
        </g>
      );
      break;
    }
    case "vb": {
      const cover = lt("vb-03", "cover"), four = lt("vb-04", "four"), rest = lt("vb-05", "rest"), shake = lt("vb-07", "shake");
      const inFridge = T > cover + 0.8 && T < shake;
      world = (
        <g>
          <Kitchen T={T} night={T > cover && T < shake ? 0.6 : 0} />
          {T > cover && <Fridge x={760} y={1260} open={inFridge ? 0 : 1} />}
          {!inFridge && <MarinadeBowl T={T} x={T < cover ? 540 : 340} y={1280} gold={1} stir={T < cover ? 1 : 0} lid={clamp((T - cover) / 0.6)} />}
          <Baba T={T} x={T < cover ? 820 : 320} y={1260} s={0.65} pose={T < cover ? "knead" : inFridge ? "shh" : "turn"} talk={talk} face={T < cover ? -1 : 1} />
          {inFridge && T > rest && <text x={760} y={700} textAnchor="middle" fontSize={90} fontWeight={900} fontFamily="Arial Black, Arial" fill="#5aa6c9" opacity={0.5 + 0.5 * Math.sin(T * 3)}>z z z</text>}
          {T > shake && [0, 1, 2].map((i) => {
            const k = ((T - shake) * 1.5 + i * 0.3) % 1;
            return <ellipse key={i} cx={300 + i * 80} cy={1180 + k * 120} rx={14} ry={20} fill={J.yogurt} stroke={INK} strokeWidth={3} opacity={1 - k} />;
          })}
        </g>
      );
      overlay = (
        <g>
          <Word T={T} t={lt("vb-01", "coat")} until={cover - 0.1} text="COAT EACH PIECE" x={540} y={410} size={90} color="#fff" />
          <Word T={T} t={cover} until={four - 0.1} text="CHILL ALL NIGHT" x={540} y={410} size={100} color="#bfe3f7" />
          <Word T={T} t={four} until={rest - 0.1} text="4 HOURS MIN" x={540} y={410} size={130} />
          <Word T={T} t={rest} until={shake - 0.1} text="DON'T RUSH IT" x={540} y={410} size={110} color="#fff" />
          <Word T={T} t={shake} until={sec.end} text="SHAKE OFF THE SAUCE" x={540} y={410} size={76} color="#fff" />
        </g>
      );
      break;
    }
    case "vbb": {
      const slide = lt("vbb-01", "slide"), space = lt("vbb-02", "space"), coal = lt("vbb-05", "charcoal"), place = lt("vbb-06", "place"), edges = lt("vbb-08", "golden"),
        brush = lt("vbb-09", "brush"), fully = lt("vbb-11", "fully"), deg = lt("vbb-12", "seventy");
      const onGrill = T > place;
      world = (
        <g>
          {onGrill || T > coal ? <rect width={W} height={H + 800} fill="#1b1220" /> : <Kitchen T={T} />}
          {T > coal && Array.from({ length: 24 }, (_, i) => {
            const k = (T * 0.4 + i / 24) % 1;
            return <circle key={i} cx={(i * 173) % W + Math.sin(T * 2 + i) * 20} cy={1500 - k * 1300} r={4 + (i % 3) * 2} fill="#ff9a3a" opacity={1 - k} />;
          })}
          {T > coal && <Grill T={T} x={540} y={1380} heat={clamp((T - coal) / 2)} />}
          {!onGrill && <ChickenSkewer x={230} y={1180} n={T < slide ? 0 : Math.min(6, (T - slide) * 2)} gold={1} />}
          {onGrill && [0, 1, 2].map((i) => (
            <ChickenSkewer key={i} x={230} y={1350 - i * 100} n={6} gold={1} cooked={clamp((T - place) / (deg - place))} roll={T * 5 + i} />
          ))}
          {T > brush && T < fully && <g transform={`translate(${300 + ((T - brush) * 300) % 500},${1180}) rotate(-30)`}>
            <rect x={-12} y={-180} width={24} height={150} rx={10} fill={C.wood} stroke={INK} strokeWidth={5} />
            <path d="M-26,-40 h52 l-6,60 h-40 z" fill={J.butter} stroke={INK} strokeWidth={5} />
          </g>}
          <Baba T={T} x={760} y={1250} s={0.6} pose={onGrill ? "turn" : "knead"} talk={talk} face={-1} />
          {T > fully && <Thermometer x={300} y={1200} k={clamp((T - fully) / (deg - fully + 0.4))} />}
        </g>
      );
      focus = [540, 1150];
      overlay = (
        <g>
          <Word T={T} t={slide} until={space - 0.1} text="SLIDE THEM THROUGH" x={540} y={410} size={80} color="#fff" />
          <Word T={T} t={space} until={coal - 0.1} text="LEAVE A GAP" x={540} y={410} size={120} />
          <Word T={T} t={coal} until={place - 0.1} text="LOW FLAMES" x={540} y={410} size={120} color="#ff6a1a" />
          <Word T={T} t={edges} until={brush - 0.1} text="GOLDEN EDGES" x={540} y={410} size={110} color={C.saffron} />
          <Word T={T} t={brush} until={fully - 0.1} text="LEMON BUTTER" x={540} y={410} size={110} color={J.butter} />
          <Word T={T} t={deg} until={sec.end} text="74°C!" x={540} y={410} size={190} color="#7ee08a" />
        </g>
      );
      break;
    }
    case "br": {
      const tom = lt("br-01", "tomatoes"), herb = lt("br-02", "herbs"), rice = lt("br-03", "saffron"), sum = lt("br-05", "sumac"), eat = lt("br-06", "eat"), world_ = lt("br-07", "world"), bird = lt("br-08", "golden");
      world = (
        <g>
          <Garden T={T} />
          {T < eat + 0.6 && <g opacity={1 - clamp((T - eat) / 0.6)}><Baba T={T} x={760} y={1160} s={0.55} pose={T < rice ? "wave" : "point"} talk={talk} face={-1} /></g>}
          {T > rice && <RicePlate T={T} x={540} y={1350} s={pop(T, rice)} butter={clamp((T - rice - 0.8) / 2)} />}
          {T > rice && <ChickenSkewer x={260} y={1430} n={5} gold={1} cooked={1} />}
          {T > rice && <Steam T={T} x={540} y={1080} />}
          {T > tom && <Tomato x={170} y={1310} s={pop(T, tom)} />}
          {T > tom && <Tomato x={910} y={1310} s={pop(T, tom + 0.2)} />}
          {T > herb && [0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={130 + i * 205} cy={1560} rx={70 * pop(T, herb + i * 0.08)} ry={34} fill={C.leaf} stroke={INK} strokeWidth={5} />
          ))}
          {T > sum && T < eat && Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={440 + (i * 53) % 200} cy={950 + ((T - sum) * 350 + i * 40) % 260} r={8} fill="#8e1b2e" />
          ))}
          {T > sum && <Lemon x={860} y={1560} half s={pop(T, sum + 0.8)} />}
          {T > eat && <Family T={T} y={1150} t={eat} />}
        </g>
      );
      focus = [540, 1250];
      overlay = (
        <g>
          <Word T={T} t={tom} until={rice - 0.1} text="GRILLED TOMATOES" x={540} y={410} size={86} color="#fff" />
          <Word T={T} t={rice} until={sum - 0.1} text="SAFFRON RICE" x={540} y={410} size={110} color={C.saffron} />
          <Word T={T} t={sum} until={eat - 0.1} text="SUMAC + LEMON" x={540} y={410} size={100} color="#fff" />
          <Word T={T} t={eat} until={world_ - 0.1} text="EAT IT HOT!" x={540} y={410} size={130} />
          <Word T={T} t={bird} until={sec.end} text="THE GOLDEN BIRD" x={540} y={410} size={96} color={C.saffron} />
        </g>
      );
      break;
    }
    default: {
      // ou + outro: the joke ("never serve raw chicken") then the title card
      const gold = lt("ou-02", "gold"), raw = lt("ou-03", "raw"), title = lt("ou-04", "joojeh"), magic = lt("ou-05", "magic");
      const rawShown = T > raw && T < title;
      world = (
        <g>
          <Garden T={T} />
          <RicePlate T={T} x={540} y={1560} s={0.9} butter={1} />
          <ChickenSkewer x={260} y={1640} n={5} gold={1} cooked={1} />
          <Baba T={T} x={540} y={1360} s={0.6} pose={rawShown ? "shh" : T > title ? "cheer" : "point"} talk={talk} />
          {rawShown && (
            <NoSign x={830} y={1000} s={0.9 * pop(T, raw)} k={(T - raw - 0.4) * 3}>
              <Cube x={0} y={0} s={1.4} gold={0} />
            </NoSign>
          )}
        </g>
      );
      focus = [540, 1250];
      overlay = (
        <g>
          <Word T={T} t={gold} until={raw - 0.1} text="SAFFRON = GOLD" x={540} y={410} size={88} color={C.saffron} />
          <Word T={T} t={raw} until={title - 0.1} text="NO RAW CHICKEN!" x={540} y={410} size={100} color="#ff6b4a" />
          <Word T={T} t={title} until={1e9} text="JOOJEH" x={540} y={400} size={150} />
          <Word T={T} t={title + 0.4} until={1e9} text="KEBAB" x={540} y={550} size={150} color="#fff" />
          <Word T={T} t={magic} until={1e9} text="PERSIAN MAGIC " x={540} y={680} size={70} color={J.butter} rot={0} />
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


/** The reel cover: drawn on the first frame only (T < 0.034; still at 0.02), so the reel also opens on it. Title and hero inside the 3:4 grid crop (y 240-1680) */
const Cover: React.FC<{ T: number }> = ({ T }) => (
  <Svg w={W} h={H}>
    <Yard T={T} dusk={1} lights={1} />
    <circle cx={540} cy={1000} r={520} fill="#ffd34d" opacity={0.25} />
    <Grill T={T} x={540} y={1430} heat={1} />
    {[0, 1, 2].map((i) => <ChickenSkewer key={i} x={230} y={1400 - i * 100} n={6} gold={1} cooked={0.9} roll={i * 2} />)}
    <Steam T={T} x={540} y={1170} />
    <Baba T={0.4} x={540} y={1180} s={0.82} pose="cheer" />
    <g>
      <text x={540} y={430} textAnchor="middle" fontSize={190} fontWeight={900} fontFamily="Arial Black, Arial" fill="#ffd34d" stroke={INK} strokeWidth={22} paintOrder="stroke" strokeLinejoin="round" transform="rotate(-4 540 430)">JOOJEH</text>
      <text x={540} y={600} textAnchor="middle" fontSize={170} fontWeight={900} fontFamily="Arial Black, Arial" fill="#fff" stroke={INK} strokeWidth={20} paintOrder="stroke" strokeLinejoin="round" transform="rotate(-4 540 600)">KEBAB</text>
      <g transform="translate(540,1610) rotate(-3)">
        <rect x={-400} y={-62} width={800} height={110} rx={55} fill="#e5432f" stroke={INK} strokeWidth={8} />
        <text x={0} y={18} textAnchor="middle" fontSize={48} fontWeight={900} fontFamily="Arial Black, Arial" fill="#fff">THE GOLDEN CHICKEN SONG</text>
      </g>
    </g>
  </Svg>
);

export const JoojehTall: React.FC<{ T: number }> = ({ T }) => (T < 0.034 ? <Cover T={T} /> : <Frame T={T} />);

/** 16:9 frame: the tall picture centred on the stage (the reel is the deliverable) */
export const Joojeh: React.FC<{ T: number }> = ({ T }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", background: "#1b1220" }}>
    <div style={{ width: 607, height: 1080, position: "relative" }}>
      <div style={{ transform: "scale(0.5625)", transformOrigin: "0 0", width: W, height: H, position: "absolute" }}>
        <Frame T={T} />
      </div>
    </div>
  </div>
);

export function linesDrawnByScene(song: Song): Set<string> {
  return new Set(["ch-01", "ch-05", "fin-01", "fin-05"].filter((id) => song.lines.some((l) => l.id === id)));
}
