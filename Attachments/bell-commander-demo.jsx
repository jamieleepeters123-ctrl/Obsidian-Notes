import { useState, useEffect, useRef, useMemo } from "react";

/* ────────────────────────────────────────────────────────────
   BELL COMMANDER — Beyond Network Solutions
   "Schoolyard" design language: blazer green, bell brass,
   warm paper, rounded type, tactile buttons.
   Simulated: Crestron CP4 · Q-SYS Core 110f
   Demo clock: Tue 21 Jul 2026 (Term 3, Wk 1) from 10:57 am
   ──────────────────────────────────────────────────────────── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');

:root{
  --paper:#FBF8F1; --card:#FFFFFF; --edge:#E7DFCC; --fill:#F0EBDF; --fillEdge:#DCD4C0;
  --green:#1E4D3B; --greenDeep:#153A2C; --greenSoft:#E4EEE7;
  --brass:#F2B33D; --brassDeep:#C68F26; --brassPale:#FDF3DC; --brassEdge:#E3C77F;
  --ink:#22322A; --mut:#5B6B60; --dim:#9AA69D; --eyebrow:#B08A2E;
  --red:#C0392B; --redPale:#FCE8E6; --redEdge:#E8C4C0;
}
*{box-sizing:border-box; margin:0; padding:0;}
.bbc{
  min-height:100vh; background:var(--paper); color:var(--ink);
  font-family:'Nunito',-apple-system,sans-serif; font-size:14px; font-weight:600;
}
.tnum{font-variant-numeric:tabular-nums;}

/* ── header ── */
.hdr{
  position:sticky; top:0; z-index:50; display:flex; align-items:center; gap:12px;
  padding:14px 18px; flex-wrap:wrap; background:var(--green); color:var(--paper);
  box-shadow:0 2px 0 rgba(0,0,0,.12);
}
.bellmark{
  width:40px; height:40px; border-radius:50%; flex:none;
  background:var(--brass); color:var(--green);
  display:flex; align-items:center; justify-content:center; font-size:19px;
  box-shadow:0 2px 0 rgba(0,0,0,.2);
}
.brand h1{font-size:17px; font-weight:800; letter-spacing:-.01em;}
.brand p{font-size:11px; font-weight:700; opacity:.72; margin-top:0;}
.hdr-right{margin-left:auto; display:flex; align-items:center; gap:8px; flex-wrap:wrap;}
.chip{
  display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px;
  background:rgba(255,255,255,.13); font-size:11.5px; font-weight:700; white-space:nowrap;
}
.dot{width:7px; height:7px; border-radius:50%; flex:none;}
.dot.g{background:#7BC894;}
.dot.r{background:#F08A80;}
.clock{font-size:16px; font-weight:800; background:rgba(255,255,255,.13); padding:6px 14px; border-radius:999px;}

/* ── nav pills ── */
.navbar{display:flex; gap:8px; padding:14px 16px 4px; flex-wrap:wrap;}
.navbar button{
  appearance:none; border:none; cursor:pointer; font:inherit; font-size:13px; font-weight:800;
  padding:8px 17px; border-radius:999px; background:var(--fill); color:var(--mut);
  box-shadow:0 2px 0 var(--fillEdge); transition:transform .06s;
}
.navbar button:active{transform:translateY(1px); box-shadow:0 1px 0 var(--fillEdge);}
.navbar button.on{background:var(--green); color:var(--paper); box-shadow:0 2px 0 var(--greenDeep);}
.navbar button:focus-visible,.btn:focus-visible,.tgl:focus-visible{outline:3px solid var(--brass); outline-offset:2px;}

.wrap{max-width:1120px; margin:0 auto; padding:14px 16px 64px;}

/* ── EVAC banner ── */
.evac{
  display:flex; align-items:center; gap:14px; padding:15px 18px; margin-bottom:14px;
  border-radius:18px; background:var(--redPale); border:2px solid var(--redEdge);
  box-shadow:0 3px 0 var(--redEdge);
  animation:evacPulse 1.8s ease-in-out infinite;
}
@keyframes evacPulse{0%,100%{border-color:var(--redEdge)}50%{border-color:var(--red)}}
@media (prefers-reduced-motion:reduce){.evac{animation:none}.cursor-line{transition:none}}
.evac b{color:var(--red); font-size:14.5px; font-weight:800;}
.evac span{color:var(--mut); font-size:12.5px;}

/* ── cards ── */
.grid{display:grid; grid-template-columns:1fr 1fr; gap:14px;}
@media(max-width:820px){.grid{grid-template-columns:1fr;}}
.card{
  background:var(--card); border:2px solid var(--edge); border-radius:20px; padding:18px;
  box-shadow:0 3px 0 var(--edge);
}
.card.full{grid-column:1/-1;}
.eyebrow{font-size:11px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--eyebrow); margin-bottom:11px;}
.sub{color:var(--mut); font-size:12.5px; line-height:1.55; font-weight:600;}

/* ── next bell ── */
.nextbell{display:flex; align-items:center; gap:18px; flex-wrap:wrap;}
.ring{
  width:92px; height:92px; border-radius:50%; flex:none;
  display:flex; align-items:center; justify-content:center; font-size:33px;
  background:var(--brassPale); border:3px solid var(--brassEdge);
  box-shadow:0 3px 0 var(--brassEdge); transition:border-color .3s;
}
.ring.hot{border-color:var(--brass); box-shadow:0 3px 0 var(--brassDeep), 0 0 0 6px rgba(242,179,61,.22);}
.nb-count{font-size:38px; font-weight:900; letter-spacing:-.02em; line-height:1; color:var(--green);}
.nb-label{font-size:15px; font-weight:800; margin-top:5px;}
.nb-meta{font-size:12.5px; color:var(--mut); margin-top:1px;}

/* ── timeline (chalkboard tape) ── */
.tape-outer{overflow-x:auto; padding-bottom:4px;}
.tape{position:relative; min-width:640px; height:106px; margin-top:4px;
  background:var(--green); border-radius:16px; box-shadow:inset 0 2px 8px rgba(0,0,0,.25);}
.tape .hour{position:absolute; top:0; bottom:0; border-left:1px solid rgba(255,255,255,.12);}
.tape .hour span{position:absolute; top:8px; left:7px; font-size:10px; font-weight:800; color:rgba(255,255,255,.45);}
.tape .ev{position:absolute; top:32px; transform:translateX(-50%); text-align:center; width:76px;}
.tape .ev .pin{width:13px; height:13px; margin:0 auto; border-radius:50%; background:var(--brass);
  border:2.5px solid var(--green); box-shadow:0 0 0 2.5px rgba(242,179,61,.35);}
.tape .ev.done .pin{background:#5F7A6D; box-shadow:none;}
.tape .ev.skip .pin{background:transparent; border:2.5px dashed #F08A80; box-shadow:none;}
.tape .ev .t{font-size:10.5px; font-weight:800; margin-top:6px; color:#fff;}
.tape .ev .l{font-size:9.5px; font-weight:700; color:#BCCFC2; line-height:1.25; margin-top:1px;}
.tape .ev.done .t,.tape .ev.done .l{color:#7A9186;}
.cursor-line{position:absolute; top:8px; bottom:8px; width:3px; border-radius:3px; background:var(--brass); transition:left 1s linear;}
.cursor-line::after{content:'now'; position:absolute; top:-3px; left:7px; font-size:10px; font-weight:800; color:var(--brass);}
.silent-mark{position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-size:26px; font-weight:900; letter-spacing:.25em; color:rgba(255,255,255,.22); pointer-events:none;}

/* ── buttons ── */
.btn{
  appearance:none; border:none; cursor:pointer; font:inherit; font-size:13.5px; font-weight:800;
  padding:10px 19px; border-radius:999px; background:var(--fill); color:var(--ink);
  box-shadow:0 2.5px 0 var(--fillEdge); display:inline-flex; align-items:center; gap:7px;
  transition:transform .06s, box-shadow .06s;
}
.btn:active{transform:translateY(2px); box-shadow:0 .5px 0 var(--fillEdge);}
.btn.primary{background:var(--brass); color:#3A2C08; box-shadow:0 2.5px 0 var(--brassDeep);}
.btn.primary:active{box-shadow:0 .5px 0 var(--brassDeep);}
.btn.danger{background:var(--redPale); color:var(--red); box-shadow:0 2.5px 0 var(--redEdge);}
.btn.danger.on{background:var(--red); color:#fff; box-shadow:0 2.5px 0 #8E2A20;}
.btn.sm{padding:7px 14px; font-size:12.5px;}
.btn:disabled{opacity:.4; cursor:not-allowed;}
.btnrow{display:flex; gap:9px; flex-wrap:wrap; margin-top:16px; align-items:center;}

/* ── tables ── */
table{width:100%; border-collapse:collapse; font-size:13px;}
th{font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;
  color:var(--dim); text-align:left; padding:8px 10px; border-bottom:2px solid var(--edge);}
td{padding:11px 10px; border-bottom:1.5px solid #F0EBDF; vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.tbl-scroll{overflow-x:auto;}
.badge-ok{color:#2E7D51; font-size:12.5px; font-weight:800;}
.ctrltag{font-size:11px; font-weight:700; color:var(--mut); background:var(--fill); padding:3px 9px; border-radius:7px;}

/* ── toggle ── */
.tgl{width:48px; height:28px; border-radius:999px; border:none; background:var(--fill);
  box-shadow:inset 0 2px 3px rgba(0,0,0,.1); position:relative; cursor:pointer; flex:none; transition:background .2s;}
.tgl::after{content:''; position:absolute; top:2.5px; left:3px; width:23px; height:23px; border-radius:50%;
  background:#fff; box-shadow:0 2px 3px rgba(0,0,0,.22); transition:left .2s;}
.tgl.on{background:var(--green);}
.tgl.on::after{left:22px; background:var(--brass);}

/* ── forms ── */
.fld{margin-bottom:14px;}
.fld label{display:block; font-size:11.5px; font-weight:800; color:var(--mut); margin-bottom:6px; letter-spacing:.03em; text-transform:uppercase;}
.fld input,.fld select,.cellinput,.cellselect{
  width:100%; padding:10px 13px; border-radius:13px; border:2px solid var(--edge);
  background:#fff; color:var(--ink); font:inherit; font-size:13.5px; font-weight:700;
}
.fld input:focus,.fld select:focus,.cellinput:focus,.cellselect:focus{
  outline:none; border-color:var(--brass); box-shadow:0 0 0 3.5px rgba(242,179,61,.25);
}
.cellinput{padding:7px 11px; font-size:13px;}
.cellselect{padding:6px 10px; font-size:12.5px; width:auto;}
.f2{display:grid; grid-template-columns:1fr 1fr; gap:14px;}
@media(max-width:560px){.f2{grid-template-columns:1fr;}}

/* ── wizard steps ── */
.steps{display:flex; gap:8px; margin-bottom:16px; overflow-x:auto; padding:3px 2px;}
.step{
  flex:1; min-width:102px; padding:11px 10px; border-radius:16px; text-align:center; cursor:pointer;
  background:var(--card); border:2px solid var(--edge); box-shadow:0 2.5px 0 var(--edge);
  font-size:12.5px; font-weight:800; color:var(--mut);
}
.step .n{display:block; font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--dim); margin-bottom:3px;}
.step.on{border-color:var(--green); color:var(--green); box-shadow:0 2.5px 0 var(--green);}
.step.on .n{color:var(--eyebrow);}
.step.done .n{color:#2E7D51;}

/* ── log ── */
.logrow{display:flex; gap:12px; padding:10px 4px; border-bottom:1.5px solid #F0EBDF; font-size:13px; align-items:baseline;}
.logrow:last-child{border-bottom:none;}
.logrow .lt{color:var(--dim); font-size:11.5px; font-weight:800; flex:none; width:64px;}
.logrow .tag{font-size:10px; font-weight:900; letter-spacing:.06em; padding:3px 10px; border-radius:999px; flex:none;}
.tag.fire{background:var(--brassPale); color:var(--brassDeep);}
.tag.sys{background:var(--greenSoft); color:var(--green);}
.tag.evac{background:var(--redPale); color:var(--red);}
.tag.skip{background:var(--fill); color:var(--mut);}

/* ── toast ── */
.toast{position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:99;
  background:var(--green); color:var(--paper); padding:12px 24px; border-radius:999px;
  font-size:13.5px; font-weight:800; box-shadow:0 3px 0 var(--greenDeep), 0 10px 28px rgba(0,0,0,.22);}
.zgrp{display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:999px;
  background:var(--fill); font-size:12.5px; font-weight:800; margin:3px 5px 3px 0; box-shadow:0 2px 0 var(--fillEdge);}

/* ── year calendar ── */
.cal-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(225px,1fr)); gap:14px;}
.cal-month{background:var(--card); border:2px solid var(--edge); border-radius:18px; padding:14px; box-shadow:0 3px 0 var(--edge);}
.cal-month h3{font-size:13.5px; font-weight:900; margin-bottom:8px; color:var(--green);}
.cal-month h3 span{color:var(--brassDeep); font-size:10.5px; font-weight:800; float:right; background:var(--brassPale); padding:2px 9px; border-radius:999px;}
.cal-days{display:grid; grid-template-columns:repeat(7,1fr); gap:3px;}
.cal-wd{font-size:9px; font-weight:800; color:var(--dim); text-align:center; padding-bottom:3px;}
.cal-d{aspect-ratio:1; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:10.5px; font-weight:700; cursor:pointer; color:var(--mut); border:2px solid transparent;}
.cal-d.school{background:var(--brassPale); color:var(--brassDeep); font-weight:800;}
.cal-d.school:hover{background:var(--brassEdge);}
.cal-d.weekend{color:var(--dim); cursor:default;}
.cal-d.holiday{background:var(--fill);}
.cal-d.nobell{background:var(--redPale); color:var(--red); font-weight:800;}
.cal-d.today{background:var(--green); color:#fff !important; font-weight:900;}
.cal-d.sel{border-color:var(--brass); box-shadow:0 0 0 2.5px rgba(242,179,61,.35);}
.cal-legend{display:flex; gap:16px; flex-wrap:wrap; font-size:12.5px; color:var(--mut); font-weight:700;}
.lg{display:inline-flex; align-items:center; gap:6px;}
.lg i{width:13px; height:13px; border-radius:50%; display:inline-block; border:1.5px solid var(--edge);}
.cal-detail{display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;}
.cal-detail .datebig{font-size:17px; font-weight:900; color:var(--green);}
.cal-bells{flex:1; min-width:220px;}
.cal-bells .row{display:flex; gap:10px; padding:6px 0; border-bottom:1.5px solid #F0EBDF; font-size:13px; align-items:baseline;}
.cal-bells .row:last-child{border-bottom:none;}
.cal-bells .row .bt{color:var(--brassDeep); font-weight:900; width:52px; flex:none; font-size:12.5px;}
.cal-bells .row .bg{color:var(--dim); font-size:11.5px; margin-left:auto; font-weight:700;}
.statuschip{display:inline-block; padding:5px 14px; border-radius:999px; font-size:12px; font-weight:800; margin-top:8px;}
.statuschip.school{background:var(--brassPale); color:var(--brassDeep);}
.statuschip.holiday{background:var(--fill); color:var(--mut);}
.statuschip.nobell{background:var(--redPale); color:var(--red);}
.statuschip.weekend{background:var(--fill); color:var(--dim);}
`;

/* ── simulated site data ── */
const SITE = { school: "Campbelltown Public School", processor: "Crestron CP4", dsp: "Q-SYS Core 110f" };

const EVENTS_INIT = [
  { id: 1, t: "08:55", label: "Warning bell", sound: "Single chime", group: "All Call" },
  { id: 2, t: "09:00", label: "Classes begin", sound: "School bell", group: "All Call" },
  { id: 3, t: "11:00", label: "Recess", sound: "School bell", group: "All Call" },
  { id: 4, t: "11:20", label: "End of recess", sound: "Double chime", group: "Play + Class" },
  { id: 5, t: "13:10", label: "Lunch", sound: "School bell", group: "All Call" },
  { id: 6, t: "13:50", label: "End of lunch", sound: "Double chime", group: "Play + Class" },
  { id: 7, t: "15:00", label: "Dismissal", sound: "School bell", group: "All Call" },
];

const ZONES_INIT = [
  { id: 1, name: "Admin & Front Office", ctrl: "zone_admin_gain", online: true, muted: false },
  { id: 2, name: "Infants Block (K–2)", ctrl: "zone_infants_gain", online: true, muted: false },
  { id: 3, name: "Primary Block (3–6)", ctrl: "zone_primary_gain", online: true, muted: false },
  { id: 4, name: "COLA / Playground", ctrl: "zone_cola_gain", online: true, muted: false },
  { id: 5, name: "Hall", ctrl: "zone_hall_gain", online: true, muted: true },
  { id: 6, name: "Library", ctrl: "zone_library_gain", online: false, muted: false },
];

const IMPORT_RAW = [
  { raw: "9:15 am — Morning assembly", start: "09:15", end: "", label: "Morning assembly" },
  { raw: "11:15 -11:45 am — Recess", start: "11:15", end: "11:45", label: "Recess" },
  { raw: "1:15 - 1: 55 pm — Lunch", start: "13:15", end: "13:55", label: "Lunch" },
  { raw: "2:05 -2:10 pm — Eating time", start: "14:05", end: "14:10", label: "Eating time" },
  { raw: "3:15 pm — Dismissal", start: "15:15", end: "", label: "Dismissal" },
];

const t2m = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const DAY_START = 8.5 * 60, DAY_END = 15.5 * 60;
const pct = (mins) => Math.min(100, Math.max(0, ((mins - DAY_START) / (DAY_END - DAY_START)) * 100));
const fmtT = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
};

export default function BellCommander() {
  const [tab, setTab] = useState("dash");
  const [simSec, setSimSec] = useState(10 * 3600 + 57 * 60 + 30);
  const [events] = useState(EVENTS_INIT);
  const [zones, setZones] = useState(ZONES_INIT);
  const [evac, setEvac] = useState(false);
  const [skipIds, setSkipIds] = useState([]);
  const [firedIds, setFiredIds] = useState([1, 2]);
  const [log, setLog] = useState([
    { t: "08:55:00", tag: "fire", msg: "Warning bell → All Call (Single chime)" },
    { t: "09:00:00", tag: "fire", msg: "Classes begin → All Call (School bell)" },
    { t: "09:00:02", tag: "sys", msg: "Q-SYS Core 110f heartbeat OK · 4 ms" },
    { t: "10:12:41", tag: "sys", msg: "Config backup saved to CP4" },
  ]);
  const [toast, setToast] = useState(null);
  const audioCtx = useRef(null);

  const nowMin = simSec / 60;
  const nextEv = useMemo(
    () => events.find((e) => t2m(e.t) > nowMin && !firedIds.includes(e.id) && !skipIds.includes(e.id)),
    [events, nowMin, firedIds, skipIds]
  );
  const secsToNext = nextEv ? t2m(nextEv.t) * 60 - simSec : null;

  const addLog = (tag, msg) =>
    setLog((L) => [{ t: fmtT(simSec).replace(/ [ap]m/, ""), tag, msg }, ...L].slice(0, 60));

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const playBell = (base = 880, dbl = false) => {
    try {
      audioCtx.current = audioCtx.current || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      const strike = (freq, at) => {
        [[1, 0.3], [2.74, 0.14], [5.4, 0.07], [8.9, 0.025]].forEach(([r, g]) => {
          const o = ctx.createOscillator(), gn = ctx.createGain();
          o.frequency.value = freq * r;
          gn.gain.setValueAtTime(0.0001, at);
          gn.gain.exponentialRampToValueAtTime(g, at + 0.008);
          gn.gain.exponentialRampToValueAtTime(0.0001, at + 2.1);
          o.connect(gn).connect(ctx.destination);
          o.start(at); o.stop(at + 2.2);
        });
      };
      const now = ctx.currentTime;
      strike(base, now);
      if (dbl) strike(base * 1.12, now + 0.34);
    } catch (e) { /* audio unavailable */ }
  };

  useEffect(() => {
    const addLogAt = (sec, tag, msg) =>
      setLog((L) => [{ t: fmtT(sec).replace(/ [ap]m/, ""), tag, msg }, ...L].slice(0, 60));
    const iv = setInterval(() => {
      setSimSec((s) => {
        const ns = s + 1;
        events.forEach((e) => {
          if (t2m(e.t) * 60 === ns) {
            if (evac) { addLogAt(ns, "evac", `${e.label} held — emergency mode`); }
            else if (skipIds.includes(e.id)) { addLogAt(ns, "skip", `${e.label} skipped by staff`); }
            else {
              setFiredIds((f) => [...f, e.id]);
              addLogAt(ns, "fire", `${e.label} → ${e.group} (${e.sound})`);
              playBell(880, e.sound === "Double chime");
            }
          }
        });
        return ns;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [events, evac, skipIds]);

  const toggleEvac = () => {
    setEvac((v) => {
      addLog(v ? "sys" : "evac", v ? "Emergency mode cleared — bells resumed" : "EMERGENCY MODE — fire panel contact closed, all bells held");
      return !v;
    });
  };

  const skipNext = () => {
    if (!nextEv) return;
    setSkipIds((s) => [...s, nextEv.id]);
    addLog("skip", `Next bell (${nextEv.label} ${nextEv.t}) will be skipped`);
    showToast(`${nextEv.label} will be skipped`);
  };

  const manualFire = () => {
    if (evac) { showToast("Held — emergency mode is on"); return; }
    playBell(880);
    addLog("fire", "Bell rung by staff → All Call (School bell)");
    showToast("Bell rung everywhere");
  };

  const toggleMute = (id) => {
    setZones((Z) => Z.map((z) => {
      if (z.id !== id) return z;
      addLog("sys", `${z.name} ${z.muted ? "unmuted" : "muted"}`);
      return { ...z, muted: !z.muted };
    }));
  };

  return (
    <div className="bbc">
      <style>{CSS}</style>

      <header className="hdr">
        <div className="bellmark">🔔</div>
        <div className="brand">
          <h1>Bell Commander</h1>
          <p>{SITE.school}</p>
        </div>
        <div className="hdr-right">
          <span className="chip"><span className="dot g" />{SITE.dsp}</span>
          <span className="chip"><span className={`dot ${evac ? "r" : "g"}`} />{SITE.processor}</span>
          <span className="chip">Term 3 · Week 1</span>
          <span className="clock tnum">{fmtT(simSec)}</span>
        </div>
      </header>

      <div className="navbar">
        {[["dash", "Today"], ["cal", "Calendar"], ["zones", "Zones"], ["log", "Log"], ["setup", "Setup"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <main className="wrap">
        {evac && (
          <div className="evac">
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <b>Emergency mode — all bells are held</b>
              <div><span>Nothing will ring until the fire panel contact opens. Clears automatically.</span></div>
            </div>
            <button className="btn danger on" style={{ marginLeft: "auto" }} onClick={toggleEvac}>Clear (demo)</button>
          </div>
        )}

        {tab === "dash" && <Dashboard {...{ events, nowMin, nextEv, secsToNext, firedIds, skipIds, evac, skipNext, manualFire, toggleEvac }} />}
        {tab === "cal" && <CalendarYear events={events} />}
        {tab === "zones" && <Zones zones={zones} toggleMute={toggleMute} />}
        {tab === "log" && <AuditLog log={log} />}
        {tab === "setup" && <Wizard playBell={playBell} showToast={showToast} addLog={addLog} />}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ════ TODAY / DASHBOARD ════ */
function Dashboard({ events, nowMin, nextEv, secsToNext, firedIds, skipIds, evac, skipNext, manualFire, toggleEvac }) {
  const mm = secsToNext != null ? Math.floor(secsToNext / 60) : 0;
  const ss = secsToNext != null ? secsToNext % 60 : 0;
  const hot = secsToNext != null && secsToNext < 60;
  return (
    <div className="grid">
      <div className="card">
        <div className="eyebrow">Next bell</div>
        {nextEv ? (
          <div className="nextbell">
            <div className={`ring ${hot ? "hot" : ""}`}>🔔</div>
            <div>
              <div className="nb-count tnum">{mm > 0 ? `${mm} min ${String(ss).padStart(2, "0")}` : `${ss} sec`}</div>
              <div className="nb-label">{nextEv.label} · {nextEv.t}</div>
              <div className="nb-meta">{nextEv.sound} → {nextEv.group}</div>
            </div>
          </div>
        ) : (
          <div className="sub">That's all the bells for today.</div>
        )}
        <div className="btnrow">
          <button className="btn primary" onClick={manualFire}>Ring the bell</button>
          <button className="btn" onClick={skipNext} disabled={!nextEv}>Skip next</button>
          <button className={`btn danger ${evac ? "on" : ""}`} onClick={toggleEvac}>
            {evac ? "Emergency on" : "Emergency test"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">System</div>
        <table>
          <tbody>
            <tr><td className="sub">School</td><td style={{ fontWeight: 800 }}>Campbelltown Public School</td></tr>
            <tr><td className="sub">Controller</td><td>Crestron CP4 · <span className="ctrltag">192.168.20.5</span></td></tr>
            <tr><td className="sub">Sound system</td><td>Q-SYS · <span className="badge-ok">Connected</span></td></tr>
            <tr><td className="sub">Timetable</td><td>Normal Day · from the school website</td></tr>
            <tr><td className="sub">Calendar</td><td>Term 3, Eastern · Tue 21 Jul 2026</td></tr>
            <tr><td className="sub">Clock</td><td><span className="badge-ok">Synced</span> · Sydney time</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card full">
        <div className="eyebrow">Today's bells · Normal Day</div>
        <div className="tape-outer">
          <div className="tape">
            {[9, 10, 11, 12, 13, 14, 15].map((h) => (
              <div key={h} className="hour" style={{ left: pct(h * 60) + "%" }}>
                <span>{((h + 11) % 12) + 1} {h >= 12 ? "pm" : "am"}</span>
              </div>
            ))}
            {events.map((e) => {
              const m = t2m(e.t);
              const cls = skipIds.includes(e.id) ? "skip" : (firedIds.includes(e.id) || m < nowMin) ? "done" : "";
              return (
                <div key={e.id} className={`ev ${cls}`} style={{ left: pct(m) + "%" }}>
                  <div className="pin" />
                  <div className="t tnum">{e.t}</div>
                  <div className="l">{e.label}</div>
                </div>
              );
            })}
            <div className="cursor-line" style={{ left: pct(nowMin) + "%" }} />
            {evac && <div className="silent-mark">HELD</div>}
          </div>
        </div>
        <p className="sub" style={{ marginTop: 12 }}>
          The clock is live — the recess bell rings at 11:00. Faded markers have rung; dashed markers are skipped.
        </p>
      </div>
    </div>
  );
}

/* ════ ZONES ════ */
function Zones({ zones, toggleMute }) {
  return (
    <div className="grid">
      <div className="card full">
        <div className="eyebrow">Speaker zones</div>
        <div className="tbl-scroll">
          <table>
            <thead>
              <tr><th>Zone</th><th>Sound system link</th><th>Status</th><th>Mute</th></tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id}>
                  <td style={{ fontWeight: 800 }}>{z.name}</td>
                  <td><span className="ctrltag">{z.ctrl}</span></td>
                  <td>{z.online
                    ? <span className="badge-ok">● Working</span>
                    : <span style={{ color: "var(--red)", fontSize: 12.5, fontWeight: 800 }}>● Check this one</span>}
                  </td>
                  <td>
                    <button className={`tgl ${z.muted ? "on" : ""}`} aria-label={`Mute ${z.name}`} onClick={() => toggleMute(z.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card full">
        <div className="eyebrow">Bell groups</div>
        <p className="sub" style={{ marginBottom: 12 }}>Bells ring to groups of zones, so speaker changes never touch the timetable.</p>
        <div>
          {[
            ["All Call", "6 zones"], ["Play + Class", "4 zones"], ["Primary Block", "1 zone"],
            ["Infants", "1 zone"], ["Outdoor only", "1 zone"],
          ].map(([g, n]) => (
            <span key={g} className="zgrp"><span style={{ color: "var(--brassDeep)" }}>●</span> {g} <span style={{ color: "var(--dim)" }}>{n}</span></span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════ LOG ════ */
function AuditLog({ log }) {
  return (
    <div className="card">
      <div className="eyebrow">Log · every bell rung, skipped or held</div>
      {log.map((r, i) => (
        <div className="logrow" key={i}>
          <span className="lt tnum">{r.t}</span>
          <span className={`tag ${r.tag}`}>{({ fire: "RUNG", sys: "SYSTEM", evac: "HELD", skip: "SKIPPED" })[r.tag]}</span>
          <span>{r.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ════ YEAR CALENDAR ════ */
const TERMS_2026 = [
  { n: 1, s: "2026-02-02", e: "2026-04-02" },
  { n: 2, s: "2026-04-20", e: "2026-07-03" },
  { n: 3, s: "2026-07-20", e: "2026-09-25" },
  { n: 4, s: "2026-10-12", e: "2026-12-18" },
];
const NO_BELL_2026 = {
  "2026-02-02": "School development day",
  "2026-04-20": "School development day",
  "2026-06-08": "Public holiday — King's Birthday",
  "2026-07-20": "School development day",
  "2026-10-12": "School development day",
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function classify(y, m, d) {
  const key = iso(y, m, d);
  const dow = new Date(y, m, d).getDay();
  if (dow === 0 || dow === 6) return { type: "weekend", label: "Weekend — no bells" };
  if (NO_BELL_2026[key]) return { type: "nobell", label: NO_BELL_2026[key] };
  const term = TERMS_2026.find((t) => key >= t.s && key <= t.e);
  if (term) return { type: "school", label: `Term ${term.n} · Normal Day`, term: term.n };
  return { type: "holiday", label: "School holidays — no bells" };
}

function CalendarYear({ events }) {
  const YEAR = 2026;
  const [sel, setSel] = useState("2026-07-21");
  const [sy, sm, sd] = sel.split("-").map(Number);
  const selInfo = classify(sy, sm - 1, sd);
  const selDate = new Date(sy, sm - 1, sd);
  const selNice = selDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const schoolDays = useMemo(() => {
    let n = 0;
    for (let m = 0; m < 12; m++) {
      const dim = new Date(YEAR, m + 1, 0).getDate();
      for (let d = 1; d <= dim; d++) if (classify(YEAR, m, d).type === "school") n++;
    }
    return n;
  }, []);

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="eyebrow">Selected day</div>
        <div className="cal-detail">
          <div>
            <div className="datebig">{selNice}</div>
            <span className={`statuschip ${selInfo.type}`}>{selInfo.label}</span>
          </div>
          <div className="cal-bells">
            {selInfo.type === "school" ? (
              events.map((e) => (
                <div className="row" key={e.id}>
                  <span className="bt tnum">{e.t}</span>
                  <span>{e.label}</span>
                  <span className="bg">{e.sound} → {e.group}</span>
                </div>
              ))
            ) : (
              <p className="sub">No bells on this day. The system checks special dates, weekends and term dates before anything can ring.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="eyebrow">2026 · NSW Eastern division · {schoolDays} bell days</div>
        <div className="cal-legend">
          <span className="lg"><i style={{ background: "var(--brassPale)", borderColor: "var(--brassEdge)" }} /> School day</span>
          <span className="lg"><i style={{ background: "var(--fill)" }} /> Holidays</span>
          <span className="lg"><i style={{ background: "var(--redPale)", borderColor: "var(--redEdge)" }} /> No bells</span>
          <span className="lg"><i style={{ background: "var(--green)", borderColor: "var(--green)" }} /> Today</span>
        </div>
      </div>

      <div className="cal-grid">
        {MONTHS.map((name, m) => {
          const dim = new Date(YEAR, m + 1, 0).getDate();
          const offset = (new Date(YEAR, m, 1).getDay() + 6) % 7;
          const term = TERMS_2026.find((t) => {
            const first = iso(YEAR, m, 1), last = iso(YEAR, m, dim);
            return t.s <= last && t.e >= first;
          });
          return (
            <div className="cal-month" key={name}>
              <h3>{name}{term && <span>Term {term.n}</span>}</h3>
              <div className="cal-days">
                {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <div className="cal-wd" key={i}>{w}</div>)}
                {Array.from({ length: offset }).map((_, i) => <div key={"o" + i} />)}
                {Array.from({ length: dim }).map((_, i) => {
                  const d = i + 1;
                  const info = classify(YEAR, m, d);
                  const key = iso(YEAR, m, d);
                  const cls = [
                    "cal-d", info.type,
                    key === "2026-07-21" ? "today" : "",
                    key === sel ? "sel" : "",
                  ].join(" ");
                  return (
                    <div key={d} className={cls} onClick={() => setSel(key)}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSel(key)}
                      title={info.label}>
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="sub" style={{ marginTop: 14 }}>
        Term dates come from the NSW school calendar during setup. Development days are added per school. Tap any day to see what will ring.
      </p>
    </div>
  );
}

/* ════ SETUP WIZARD ════ */
const STEPS = ["Sound system", "Zones", "Bell sounds", "School", "Timetable"];

function Wizard({ playBell, showToast, addLog }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState([]);
  const [connState, setConnState] = useState("idle");
  const [dsp, setDsp] = useState("Q-SYS (QRC / TCP 1710)");
  const [fetched, setFetched] = useState(false);
  const [rows, setRows] = useState(
    IMPORT_RAW.map((r, i) => ({ ...r, id: i, ringStart: true, ringEnd: !!r.end, sound: "School bell" }))
  );

  const markDone = (i) => setDone((d) => (d.includes(i) ? d : [...d, i]));
  const next = () => { markDone(step); setStep((s) => Math.min(s + 1, 4)); };

  const testConn = () => {
    setConnState("testing");
    setTimeout(() => {
      setConnState("ok");
      addLog("sys", `Setup: ${dsp.split(" ")[0]} connection checked`);
    }, 900);
  };

  const activate = () => {
    markDone(4);
    addLog("sys", `Timetable "Normal Day" turned on — ${rows.filter(r => r.ringStart).length + rows.filter(r => r.ringEnd).length} bells`);
    showToast("Timetable is on — saved to the controller");
  };

  return (
    <div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`step ${i === step ? "on" : ""} ${done.includes(i) ? "done" : ""}`}
            onClick={() => setStep(i)}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setStep(i)}
          >
            <span className="n">{done.includes(i) ? "✓ Done" : `Step ${i + 1}`}</span>{s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card">
          <div className="eyebrow">Step 1 · Connect the sound system</div>
          <p className="sub" style={{ marginBottom: 16 }}>
            Every site runs the same program — this setup saves your school's profile to the controller.
          </p>
          <div className="f2">
            <div className="fld">
              <label>Sound system</label>
              <select value={dsp} onChange={(e) => { setDsp(e.target.value); setConnState("idle"); }}>
                <option>Q-SYS (QRC / TCP 1710)</option>
                <option>Biamp Tesira (TTP / TCP 23)</option>
                <option>Allen & Heath AHM (TCP 51325)</option>
                <option>Symetrix (TCP 48631)</option>
                <option>BNS Sound Node (HTTP)</option>
              </select>
            </div>
            <div className="fld"><label>IP address</label><input defaultValue="192.168.20.10" /></div>
            <div className="fld"><label>Port</label><input defaultValue="1710" /></div>
            <div className="fld"><label>Login (if needed)</label><input placeholder="user:pass" /></div>
          </div>
          <div className="btnrow">
            <button className="btn" onClick={testConn} disabled={connState === "testing"}>
              {connState === "testing" ? "Checking…" : "Check connection"}
            </button>
            {connState === "ok" && <span className="badge-ok">✓ Connected · Core 110f · 4 ms</span>}
            <button className="btn primary" style={{ marginLeft: "auto" }} onClick={next} disabled={connState !== "ok"}>Continue</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <div className="eyebrow">Step 2 · Name the zones</div>
          <p className="sub" style={{ marginBottom: 14 }}>Zones found on the sound system. Give each one a name the front office will recognise.</p>
          <div className="tbl-scroll">
            <table>
              <thead><tr><th>Use</th><th>System link</th><th>Zone name</th><th>Groups</th></tr></thead>
              <tbody>
                {ZONES_INIT.map((z) => (
                  <tr key={z.id}>
                    <td><input type="checkbox" defaultChecked={z.online} /></td>
                    <td><span className="ctrltag">{z.ctrl}</span></td>
                    <td><input className="cellinput" defaultValue={z.name} /></td>
                    <td className="sub" style={{ fontSize: 12 }}>All Call{z.id <= 4 ? " · Play + Class" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="btnrow"><button className="btn primary" style={{ marginLeft: "auto" }} onClick={next}>Continue</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="eyebrow">Step 3 · Bell sounds</div>
          <p className="sub" style={{ marginBottom: 14 }}>Sounds are stored on the sound system. Play each one to make sure it's right.</p>
          <div className="tbl-scroll">
            <table>
              <thead><tr><th>Sound</th><th>Stored as</th><th>Listen</th></tr></thead>
              <tbody>
                {[["School bell", "player_1.preset_1", 880, false], ["Single chime", "player_1.preset_2", 988, false], ["Double chime", "player_1.preset_3", 880, true], ["Evacuation tone", "fire system (EWIS)", null, false]].map(([n, p, f, d]) => (
                  <tr key={n}>
                    <td style={{ fontWeight: 800 }}>{n}</td>
                    <td><span className="ctrltag">{p}</span></td>
                    <td>{f
                      ? <button className="btn sm" onClick={() => playBell(f, d)}>▶ Play</button>
                      : <span className="sub" style={{ fontSize: 11.5 }}>Handled by the fire system</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="btnrow"><button className="btn primary" style={{ marginLeft: "auto" }} onClick={next}>Continue</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <div className="eyebrow">Step 4 · About the school</div>
          <div className="f2">
            <div className="fld"><label>School name</label><input defaultValue="Campbelltown Public School" /></div>
            <div className="fld"><label>Controller</label>
              <select defaultValue="CP4"><option>RMC4 — compact sites</option><option>CP4</option></select>
            </div>
            <div className="fld"><label>Timezone</label><input defaultValue="Australia/Sydney" /></div>
            <div className="fld"><label>NSW term dates</label>
              <select><option>Eastern division</option><option>Western division</option></select>
            </div>
            <div className="fld"><label>Fire panel input</label>
              <select><option>Digital input 1 (N/C)</option><option>Digital input 2</option><option>Versiport 1</option></select>
            </div>
            <div className="fld"><label>Announcements over bells</label>
              <select><option>Announcements lower the bells</option><option>Off</option></select>
            </div>
          </div>
          <div className="btnrow"><button className="btn primary" style={{ marginLeft: "auto" }} onClick={next}>Continue</button></div>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <div className="eyebrow">Step 5 · Load the timetable</div>
          <div className="fld">
            <label>School bell times page</label>
            <input defaultValue="https://campbellto-p.schools.nsw.gov.au/school-life/bell-times" />
          </div>
          {!fetched ? (
            <button className="btn" onClick={() => { setFetched(true); addLog("sys", "Timetable fetched — 5 rows ready to check"); }}>Read the page</button>
          ) : (
            <>
              <p className="sub" style={{ margin: "4px 0 14px" }}>
                Read straight from the school website — the original wording is shown so you can check it. Nothing rings until you turn it on.
              </p>
              <div className="tbl-scroll">
                <table>
                  <thead><tr><th>From the website</th><th>Bell</th><th>Ring at start</th><th>Ring at end</th><th>Sound</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td><span className="ctrltag" style={{ fontSize: 10.5 }}>{r.raw}</span></td>
                        <td>
                          <div style={{ fontWeight: 800 }}>{r.label}</div>
                          <div className="tnum" style={{ fontSize: 11.5, color: "var(--mut)", fontWeight: 700 }}>{r.start}{r.end && ` – ${r.end}`}</div>
                        </td>
                        <td><button className={`tgl ${r.ringStart ? "on" : ""}`} aria-label="Ring at start"
                          onClick={() => setRows(R => R.map(x => x.id === r.id ? { ...x, ringStart: !x.ringStart } : x))} /></td>
                        <td>{r.end
                          ? <button className={`tgl ${r.ringEnd ? "on" : ""}`} aria-label="Ring at end"
                            onClick={() => setRows(R => R.map(x => x.id === r.id ? { ...x, ringEnd: !x.ringEnd } : x))} />
                          : <span className="sub">—</span>}</td>
                        <td>
                          <select className="cellselect" value={r.sound}
                            onChange={(e) => setRows(R => R.map(x => x.id === r.id ? { ...x, sound: e.target.value } : x))}>
                            <option>School bell</option><option>Single chime</option><option>Double chime</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="btnrow">
                <span className="sub">
                  {rows.filter(r => r.ringStart).length + rows.filter(r => r.ringEnd).length} bells will be created
                </span>
                <button className="btn primary" style={{ marginLeft: "auto" }} onClick={activate}>Turn on "Normal Day"</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
