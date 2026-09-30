import { useEffect, useRef, useState } from "react";

// ---------- Types ----------
type Num = string | number;
export type Item = { ref: string; desc: string; unit: string; qty: Num; rate: Num; adj: Num };
export type Schedule = { name: string; items: Item[] };
export type Portion = { name: string; twoLane: Num; schedules: Schedule[] };
export type Charge = { name: string; pct: Num };
export type SubEstimate = { name: string; amount: Num; rlyPct: Num };
export type Credit = { name: string; amount: Num };
export type Project = {
  name: string;
  lcNo: string;
  section: string;
  division: string;
  estimateNo: string;
  preparedBy: string;
  date: string;
};
export type Estimate = {
  project: Project;
  portions: Portion[];
  rlySharePct: Num; // Railway pays this % of the 2-lane cost
  contingencyPct: Num;
  charges: Charge[]; // added on the cost after contingency
  subEstimates: SubEstimate[];
  crrm: Credit[]; // released material credit, deducted from Railway share
};

export const STORAGE_KEY = "rob-live-estimate-v2";

// ---------- Sample: LC No. 300 four-lane ROB (Vadodara division) ----------
export function sample(): Estimate {
  const it = (ref: string, desc: string, unit: string, qty: number, rate: number, adj = 0): Item => ({
    ref, desc, unit, qty, rate, adj,
  });
  const ls = (ref: string, desc: string, amount: number) => it(ref, desc, "LS", 1, amount);
  return {
    project: {
      name: "Elimination of LC No. 300 by providing four lane Road Over Bridge (ROB)",
      lcNo: "300",
      section: "Vadodara–Geratpur, Km 482/6-8",
      division: "Vadodara",
      estimateNo: "",
      preparedBy: "",
      date: new Date().toISOString().slice(0, 10),
    },
    portions: [
      {
        name: "Railway Portion (SE-01)",
        twoLane: "",
        schedules: [
          { name: "Sch. B1 – WR USSOR-2021", items: [
            ls("B1", "Total of Sch. B1 (general + structural steel items, after LAR)", 119264407.9),
          ]},
          { name: "Sch. B2 – DSR-2023 (price factor 0.68)", items: [
            it("10.2", "Structural steel work riveted, bolted or welded", "kg", 8369.47, 133.7, -32),
            it("16.37.1", "Bitumen mastic wearing course 25 mm thick", "sqm", 1429.5, 854.15, -32),
            it("16.48.1", "Road surface marking, normal paint (white)", "sqm", 25, 288.9, -32),
            it("16.50", "Glow studs 100x20 mm", "no", 64, 206.3, -32),
            it("16.57.1", "Bituminous concrete 40/50 mm compacted", "cum", 85, 12126.2, -32),
            it("16.59.2", "Cautionary / warning sign boards 900 mm", "no", 2, 5559.75, -32),
          ]},
          { name: "Sch. B3 – Cement, reinforcement & shuttering", items: [
            it("025072", "Ordinary Portland Cement 53 grade", "MT", 1550, 9275.03, -25.16),
            it("025082", "TMT bars Fe-500D or more", "kg", 659000, 116.39, -30.32),
            it("025031", "Shuttering for bridge sub-structures", "sqm", 1170, 746.3, -28.32),
          ]},
          { name: "Sch. B4 – NS items (crash barrier repair)", items: [
            ls("B4", "Total of Sch. B4 NS items", 252988.66),
          ]},
          { name: "Sch. B5 – NS items for approach", items: [
            ls("B5", "Total of Sch. B5 NS items", 9558163.83),
          ]},
          { name: "Sch. B6 – NS items (CHUM testing of piles, shear studs)", items: [
            ls("B6", "Total of Sch. B6 NS items", 5421820),
          ]},
        ],
      },
      {
        name: "Approach Portion (as per State Govt. estimate)",
        twoLane: 333115219.46,
        schedules: [
          { name: "Bridge sub-estimate (WR USSOR 2021 / DSR-2023)", items: [
            ls("E", "Schedule E", 6320556.9),
            ls("F", "Schedule F (USSOR items)", 189090570.48),
            ls("G", "Schedule G (USSOR items)", 370030767.57),
            ls("H", "Schedule H (DSR + NS items)", 51844543.96),
          ]},
          { name: "Other provisions", items: [
            ls("", "Consultancy & survey charges", 1972000),
            ls("", "Utility shifting charges", 3500000),
            ls("", "Lighting cost", 14000000),
            ls("", "Provision for inauguration cost", 5000000),
          ]},
        ],
      },
    ],
    rlySharePct: 50,
    contingencyPct: 1,
    charges: [
      { name: "Departmental charges", pct: 5.29 },
      { name: "Environmental charges", pct: 0.5 },
      { name: "Sports charges", pct: 0.1 },
    ],
    subEstimates: [
      { name: "Signal sub-estimate", amount: 8411577, rlyPct: 50 },
      { name: "Telecom sub-estimate", amount: 2615411, rlyPct: 50 },
      { name: "RCIL", amount: 1306951, rlyPct: 50 },
      { name: "Electrical / TRD sub-estimate", amount: 2789827, rlyPct: 50 },
      { name: "Electrical (Power) sub-estimate", amount: 5053, rlyPct: 50 },
    ],
    crrm: [
      { name: "CRRM – Civil", amount: 592578 },
      { name: "CRRM – TRD", amount: 120000 },
    ],
  };
}

export function load(): Estimate | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Estimate) : null;
    return data && Array.isArray(data.portions) ? data : null;
  } catch {
    return null;
  }
}

// ---------- Helpers ----------
export const num = (v: unknown) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isFinite(n) ? n : 0;
};
const isBlank = (v: unknown) => String(v ?? "").trim() === "";
export const inr = (n: number) => (Math.round(n) < 0 ? "− ₹ " : "₹ ") + Math.abs(Math.round(n)).toLocaleString("en-IN");
export const crore = (n: number) =>
  "₹ " + (n / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Cr";

// Amount = Qty × Rate, then LAR / price-factor adjustment (e.g. -28.32%).
export const itemAmount = (it: Item) => num(it.qty) * num(it.rate) * (1 + num(it.adj) / 100);
export const scheduleTotal = (s: Schedule) => s.items.reduce((t, it) => t + itemAmount(it), 0);
export const portionTotal = (p: Portion) => p.schedules.reduce((t, s) => t + scheduleTotal(s), 0);

// Three columns in every abstract row: Railway share, State share, Total.
export type Triple = [number, number, number];
export type Row = { label: string; v: Triple; strong?: boolean };
const add = (a: Triple, b: Triple): Triple => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Triple, f: number): Triple => [a[0] * f, a[1] * f, a[2] * f];

export function calc(e: Estimate) {
  const rows: Row[] = [];
  const rlyPct = num(e.rlySharePct) / 100;

  // 1. Civil cost of each portion, split by 2-lane cost sharing.
  let civil: Triple = [0, 0, 0];
  const portions = e.portions.map((p) => {
    const total = portionTotal(p);
    const twoLane = isBlank(p.twoLane) ? total / 2 : num(p.twoLane);
    const rly = twoLane * rlyPct;
    const v: Triple = [rly, total - rly, total];
    rows.push({ label: p.name, v });
    civil = add(civil, v);
    return { total, twoLane, rly };
  });
  rows.push({ label: "Total cost of ROB (civil)", v: civil, strong: true });

  // 2. Contingency, then charges on the cost after contingency.
  const cont = scale(civil, num(e.contingencyPct) / 100);
  rows.push({ label: `Add ${num(e.contingencyPct)}% contingency`, v: cont });
  const afterCont = add(civil, cont);
  rows.push({ label: "Total cost after contingency", v: afterCont, strong: true });
  let netCivil = afterCont;
  e.charges.forEach((c) => {
    const v = scale(afterCont, num(c.pct) / 100);
    rows.push({ label: `Add ${num(c.pct)}% ${c.name.toLowerCase()}`, v });
    netCivil = add(netCivil, v);
  });
  rows.push({ label: "Net total of civil portion", v: netCivil, strong: true });

  // 3. Other department sub-estimates.
  let gross = netCivil;
  e.subEstimates.forEach((s) => {
    const amt = num(s.amount);
    const rly = (amt * num(s.rlyPct)) / 100;
    const v: Triple = [rly, amt - rly, amt];
    rows.push({ label: s.name, v });
    gross = add(gross, v);
  });
  rows.push({ label: "Gross total of ROB", v: gross, strong: true });

  // 4. CRRM credit comes off the Railway share only.
  const crrm = e.crrm.reduce((t, c) => t + num(c.amount), 0);
  e.crrm.forEach((c) => rows.push({ label: `Less ${c.name}`, v: [-num(c.amount), 0, -num(c.amount)] }));
  const net: Triple = [gross[0] - crrm, gross[1], gross[2] - crrm];
  rows.push({ label: "Net cost of ROB", v: net, strong: true });

  return { rows, portions, civil, net };
}

function download(name: string, text: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

// ---------- Page ----------
export default function EstimatePage() {
  const [est, setEst] = useState<Estimate>(() => load() ?? sample());
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(est));
    } catch {
      /* storage not available, keep working without saving */
    }
  }, [est]);

  const c = calc(est);
  const fileBase =
    ("ROB-LC-" + (est.project.lcNo || "estimate")).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");

  // ----- update helpers -----
  const patch = (fn: (e: Estimate) => Partial<Estimate>) => setEst((e) => ({ ...e, ...fn(e) }));
  const setProject = (key: keyof Project, value: string) =>
    patch((e) => ({ project: { ...e.project, [key]: value } }));
  const setPortion = (pi: number, fn: (p: Portion) => Portion) =>
    patch((e) => ({ portions: e.portions.map((p, i) => (i === pi ? fn(p) : p)) }));
  const setSchedule = (pi: number, si: number, fn: (s: Schedule) => Schedule) =>
    setPortion(pi, (p) => ({ ...p, schedules: p.schedules.map((s, i) => (i === si ? fn(s) : s)) }));
  const setItem = (pi: number, si: number, ii: number, key: keyof Item, value: string) =>
    setSchedule(pi, si, (s) => ({ ...s, items: s.items.map((it, i) => (i === ii ? { ...it, [key]: value } : it)) }));
  function setListRow<K extends "charges" | "subEstimates" | "crrm">(list: K, idx: number, key: string, value: string) {
    patch((e) => ({ [list]: (e[list] as object[]).map((r, i) => (i === idx ? { ...r, [key]: value } : r)) }));
  }
  function addListRow<K extends "charges" | "subEstimates" | "crrm">(list: K, row: Estimate[K][number]) {
    patch((e) => ({ [list]: [...(e[list] as object[]), row] }));
  }
  function delListRow<K extends "charges" | "subEstimates" | "crrm">(list: K, idx: number) {
    patch((e) => ({ [list]: (e[list] as object[]).filter((_, i) => i !== idx) }));
  }

  const newItem = (): Item => ({ ref: "", desc: "", unit: "", qty: 0, rate: 0, adj: 0 });

  const reset = () => {
    if (confirm("This will remove your changes and load the LC 300 example again. Continue?")) setEst(sample());
  };

  // ----- export / import -----
  const exportCsv = () => {
    const cell = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const p = est.project;
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const out: unknown[][] = [
      ["Name of work", p.name],
      ["LC No.", p.lcNo, "Section / Km", p.section],
      ["Division", p.division, "Estimate No.", p.estimateNo],
      ["Prepared by", p.preparedBy, "Date", p.date],
      [],
      ["Portion", "Schedule", "Item No.", "Description", "Unit", "Qty", "Rate (Rs)", "LAR / factor %", "Amount (Rs)"],
    ];
    est.portions.forEach((po) => {
      po.schedules.forEach((s) => {
        s.items.forEach((it) =>
          out.push([po.name, s.name, it.ref, it.desc, it.unit, num(it.qty), num(it.rate), num(it.adj), r2(itemAmount(it))])
        );
        out.push([po.name, s.name + " – total", "", "", "", "", "", "", r2(scheduleTotal(s))]);
      });
      out.push([po.name + " – TOTAL", "", "", "", "", "", "", "", r2(portionTotal(po))]);
    });
    out.push([], ["ABSTRACT OF COST", "", "Railway share (Rs)", "State share (Rs)", "Total (Rs)"]);
    c.rows.forEach((r) => out.push([r.label, "", r2(r.v[0]), r2(r.v[1]), r2(r.v[2])]));
    const csv = "﻿" + out.map((r) => r.map(cell).join(",")).join("\r\n");
    download(fileBase + ".csv", csv, "text/csv;charset=utf-8");
  };

  const saveFile = () => download(fileBase + ".json", JSON.stringify(est, null, 2), "application/json");

  const openFile = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result)) as Estimate;
        if (!Array.isArray(data.portions) || !data.project || !Array.isArray(data.charges)) throw new Error("bad file");
        setEst(data);
      } catch {
        alert("This file is not a valid estimate file.");
      }
      if (fileInput.current) fileInput.current.value = "";
    };
    r.readAsText(f);
  };

  const projectFields: [keyof Project, string][] = [
    ["lcNo", "LC No."],
    ["section", "Section / Km"],
    ["division", "Division"],
    ["estimateNo", "Estimate No."],
    ["preparedBy", "Prepared by"],
  ];

  return (
    <div className="wrap">
      <header>
        <a className="back" href="#/">← Home</a>
        <h1>ROB Detailed Estimate</h1>
        <p>Type quantity, rate and LAR %. The abstract with Railway and State share updates instantly. Saved in this browser automatically.</p>
      </header>

      <div className="sticky-total">
        <span>Net cost of ROB</span>
        <span>
          {crore(c.net[2])} · Railway {crore(c.net[0])} · State {crore(c.net[1])}
        </span>
      </div>

      <div className="toolbar">
        <button onClick={exportCsv}>Download Excel (CSV)</button>
        <button onClick={saveFile}>Save estimate file</button>
        <button onClick={() => fileInput.current?.click()}>Open estimate file</button>
        <button onClick={() => window.print()}>Print / PDF</button>
        <button onClick={reset}>Reset to LC 300 example</button>
        <input ref={fileInput} type="file" accept=".json" hidden onChange={(e) => openFile(e.target.files?.[0])} />
      </div>

      <div className="card">
        <h2>Project details</h2>
        <div className="grid">
          <div className="span-all">
            <label htmlFor="p-name">Name of work</label>
            <input id="p-name" value={est.project.name} onChange={(e) => setProject("name", e.target.value)} />
          </div>
          {projectFields.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={"p-" + key}>{label}</label>
              <input id={"p-" + key} value={est.project[key]} onChange={(e) => setProject(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label htmlFor="p-date">Date</label>
            <input id="p-date" type="date" value={est.project.date} onChange={(e) => setProject("date", e.target.value)} />
          </div>
        </div>
      </div>

      {est.portions.map((po, pi) => (
        <div className="portion" key={pi}>
          <div className="portion-head">
            <input
              className="portion-name"
              aria-label="Portion name"
              value={po.name}
              onChange={(e) => setPortion(pi, (p) => ({ ...p, name: e.target.value }))}
            />
            <span className="portion-total">{inr(c.portions[pi].total)}</span>
          </div>

          {po.schedules.map((s, si) => (
            <div className="card" key={si}>
              <div className="section-head">
                <input
                  className="sec-name"
                  aria-label="Schedule name"
                  value={s.name}
                  onChange={(e) => setSchedule(pi, si, (x) => ({ ...x, name: e.target.value }))}
                />
                <span className="section-total">{inr(scheduleTotal(s))}</span>
              </div>
              <div className="table-scroll">
                <table className="items">
                  <colgroup>
                    <col className="c-ref" /><col /><col className="c-unit" /><col className="c-qty" />
                    <col className="c-rate" /><col className="c-adj" /><col className="c-amt" /><col className="c-del" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Item No.</th><th>Description</th><th>Unit</th><th className="r">Qty</th>
                      <th className="r">Rate (₹)</th><th className="r" title="LAR or price factor, e.g. -28.32">LAR %</th>
                      <th className="r">Amount (₹)</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.items.map((it, ii) => (
                      <tr key={ii}>
                        <td><input value={it.ref} onChange={(e) => setItem(pi, si, ii, "ref", e.target.value)} /></td>
                        <td><input value={it.desc} onChange={(e) => setItem(pi, si, ii, "desc", e.target.value)} /></td>
                        <td><input value={it.unit} onChange={(e) => setItem(pi, si, ii, "unit", e.target.value)} /></td>
                        <td>
                          <input className="num" inputMode="decimal" value={it.qty}
                            onChange={(e) => setItem(pi, si, ii, "qty", e.target.value)} />
                        </td>
                        <td>
                          <input className="num" inputMode="decimal" value={it.rate}
                            onChange={(e) => setItem(pi, si, ii, "rate", e.target.value)} />
                        </td>
                        <td>
                          <input className="num" inputMode="decimal" value={it.adj}
                            onChange={(e) => setItem(pi, si, ii, "adj", e.target.value)} />
                        </td>
                        <td className="r amount">{inr(itemAmount(it))}</td>
                        <td>
                          <button className="del" title="Delete item"
                            onClick={() => setSchedule(pi, si, (x) => ({ ...x, items: x.items.filter((_, i) => i !== ii) }))}>
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="link" onClick={() => setSchedule(pi, si, (x) => ({ ...x, items: [...x.items, newItem()] }))}>
                + Add item
              </button>
              <button
                className="link"
                style={{ color: "var(--danger)", marginLeft: 16 }}
                onClick={() => {
                  if (confirm(`Delete "${s.name}" and all its items?`))
                    setPortion(pi, (p) => ({ ...p, schedules: p.schedules.filter((_, i) => i !== si) }));
                }}
              >
                Delete schedule
              </button>
            </div>
          ))}

          <div className="portion-foot">
            <button
              className="link"
              onClick={() =>
                setPortion(pi, (p) => ({ ...p, schedules: [...p.schedules, { name: "New schedule", items: [newItem()] }] }))
              }
            >
              + Add schedule
            </button>
            <div className="two-lane">
              <label htmlFor={"tl-" + pi}>2-lane cost for cost sharing (₹)</label>
              <input
                id={"tl-" + pi}
                className="num"
                inputMode="decimal"
                placeholder={"Auto: half = " + Math.round(c.portions[pi].total / 2).toLocaleString("en-IN")}
                value={po.twoLane}
                onChange={(e) => setPortion(pi, (p) => ({ ...p, twoLane: e.target.value }))}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="card">
        <h2>Cost sharing and charges</h2>
        <div className="grid">
          <div>
            <label htmlFor="rly-pct">Railway share (% of 2-lane cost)</label>
            <input id="rly-pct" className="num" inputMode="decimal" value={est.rlySharePct}
              onChange={(e) => patch(() => ({ rlySharePct: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="cont-pct">Contingency (%)</label>
            <input id="cont-pct" className="num" inputMode="decimal" value={est.contingencyPct}
              onChange={(e) => patch(() => ({ contingencyPct: e.target.value }))} />
          </div>
        </div>
        <h3 className="sub-title">Charges on cost after contingency</h3>
        <table className="mini">
          <tbody>
            {est.charges.map((ch, i) => (
              <tr key={i}>
                <td><input aria-label="Charge name" value={ch.name} onChange={(e) => setListRow("charges", i, "name", e.target.value)} /></td>
                <td className="w-pct">
                  <input className="num" inputMode="decimal" aria-label={ch.name + " %"} value={ch.pct}
                    onChange={(e) => setListRow("charges", i, "pct", e.target.value)} />
                </td>
                <td className="w-unit">%</td>
                <td className="w-del"><button className="del" title="Delete" onClick={() => delListRow("charges", i)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="link" onClick={() => addListRow("charges", { name: "New charge", pct: 0 })}>+ Add charge</button>
      </div>

      <div className="card">
        <h2>Other department sub-estimates</h2>
        <table className="mini">
          <thead>
            <tr><th>Sub-estimate</th><th className="r">Amount (₹)</th><th className="r">Railway %</th><th></th></tr>
          </thead>
          <tbody>
            {est.subEstimates.map((s, i) => (
              <tr key={i}>
                <td><input aria-label="Sub-estimate name" value={s.name} onChange={(e) => setListRow("subEstimates", i, "name", e.target.value)} /></td>
                <td className="w-amt">
                  <input className="num" inputMode="decimal" aria-label={s.name + " amount"} value={s.amount}
                    onChange={(e) => setListRow("subEstimates", i, "amount", e.target.value)} />
                </td>
                <td className="w-pct">
                  <input className="num" inputMode="decimal" aria-label={s.name + " railway %"} value={s.rlyPct}
                    onChange={(e) => setListRow("subEstimates", i, "rlyPct", e.target.value)} />
                </td>
                <td className="w-del"><button className="del" title="Delete" onClick={() => delListRow("subEstimates", i)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="link" onClick={() => addListRow("subEstimates", { name: "New sub-estimate", amount: 0, rlyPct: 50 })}>
          + Add sub-estimate
        </button>

        <h3 className="sub-title">CRRM (credit for released material, deducted from Railway share)</h3>
        <table className="mini">
          <tbody>
            {est.crrm.map((r, i) => (
              <tr key={i}>
                <td><input aria-label="CRRM name" value={r.name} onChange={(e) => setListRow("crrm", i, "name", e.target.value)} /></td>
                <td className="w-amt">
                  <input className="num" inputMode="decimal" aria-label={r.name + " amount"} value={r.amount}
                    onChange={(e) => setListRow("crrm", i, "amount", e.target.value)} />
                </td>
                <td className="w-del"><button className="del" title="Delete" onClick={() => delListRow("crrm", i)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="link" onClick={() => addListRow("crrm", { name: "CRRM – ", amount: 0 })}>+ Add CRRM</button>
      </div>

      <div className="card summary">
        <h2>Abstract of cost</h2>
        <div className="table-scroll">
          <table className="abstract">
            <thead>
              <tr><th>Sr.</th><th>Description</th><th className="r">Railway share</th><th className="r">State share</th><th className="r">Total</th></tr>
            </thead>
            <tbody>
              {c.rows.map((r, i) => (
                <tr key={i} className={r.strong ? "strong" : ""}>
                  <td>{i + 1}</td>
                  <td>{r.label}</td>
                  <td className="r amount">{inr(r.v[0])}</td>
                  <td className="r amount">{inr(r.v[1])}</td>
                  <td className="r amount">{inr(r.v[2])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grand">
          <div>
            <div className="small">Net cost of ROB</div>
            <div className="big">{inr(c.net[2])}</div>
            <div className="small">{crore(c.net[2])}</div>
          </div>
          <div className="grand-split">
            <div><span className="small">Railway share</span><strong>{crore(c.net[0])}</strong></div>
            <div><span className="small">State share</span><strong>{crore(c.net[1])}</strong></div>
          </div>
        </div>
        <p className="note">
          Railway share = {num(est.rlySharePct)}% of the 2-lane cost of each portion; the rest is State share. Contingency
          and charges are split in the same ratio. CRRM is deducted from the Railway share only.
        </p>
      </div>
    </div>
  );
}
