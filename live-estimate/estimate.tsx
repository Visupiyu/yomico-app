import { useEffect, useRef, useState } from "react";

// ---------- Types ----------
export type Item = { desc: string; unit: string; qty: string | number; rate: string | number };
export type Section = { name: string; items: Item[] };
export type Addon = { name: string; pct: string | number };
export type Project = {
  name: string;
  location: string;
  length: string | number;
  width: string | number;
  preparedBy: string;
  date: string;
};
export type Estimate = { project: Project; sections: Section[]; addons: Addon[] };

export const STORAGE_KEY = "rob-live-estimate-v1";

// ---------- Sample data (rough example rates, replace with your SOR / DSR) ----------
export function sample(): Estimate {
  const s = (name: string, rows: [string, string, number, number][]): Section => ({
    name,
    items: rows.map(([desc, unit, qty, rate]) => ({ desc, unit, qty, rate })),
  });
  return {
    project: {
      name: "Road Over Bridge in lieu of LC No. ___",
      location: "",
      length: 650,
      width: 11,
      preparedBy: "",
      date: new Date().toISOString().slice(0, 10),
    },
    sections: [
      s("A. Foundation", [
        ["Excavation for foundation in all soils", "cum", 3200, 350],
        ["Bored cast-in-situ piles 1200 mm dia, M35", "m", 480, 18000],
        ["RCC pile cap, M35", "cum", 650, 9500],
        ["PCC levelling course, M15", "cum", 120, 6200],
      ]),
      s("B. Substructure", [
        ["RCC pier and pier cap, M40", "cum", 520, 11000],
        ["RCC abutment and dirt wall, M35", "cum", 380, 10000],
        ["Elastomeric / POT-PTFE bearings", "no", 48, 45000],
      ]),
      s("C. Superstructure", [
        ["PSC I-girders, M45", "cum", 900, 16500],
        ["HT strands for prestressing", "MT", 55, 135000],
        ["RCC deck slab, M40", "cum", 780, 11500],
        ["Crash barrier, M40", "m", 700, 6500],
        ["Wearing coat (mastic asphalt / BC)", "sqm", 5600, 900],
        ["Strip seal expansion joints", "m", 72, 28000],
      ]),
      s("D. Reinforcement steel", [["TMT bars Fe500D (all components)", "MT", 1450, 78000]]),
      s("E. Railway span", [
        ["Steel composite girder over railway track", "MT", 260, 110000],
        ["Railway block / supervision charges", "LS", 1, 3500000],
      ]),
      s("F. Approaches", [
        ["Embankment fill with approved soil", "cum", 18000, 450],
        ["RE wall panels with strips", "sqm", 4200, 6500],
        ["Road layers (GSB, WMM, DBM, BC)", "sqm", 7500, 2800],
        ["Drainage and spouts", "m", 900, 1800],
      ]),
      s("G. Miscellaneous", [
        ["Street lighting poles with fittings", "no", 40, 85000],
        ["Utility shifting", "LS", 1, 4500000],
        ["Traffic diversion and road safety", "LS", 1, 2500000],
        ["Road markings and signboards", "LS", 1, 800000],
      ]),
    ],
    addons: [
      { name: "Contingency", pct: 3 },
      { name: "Quality control & supervision", pct: 1 },
      { name: "GST", pct: 18 },
    ],
  };
}

export function load(): Estimate | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Estimate) : null;
  } catch {
    return null;
  }
}

// ---------- Helpers ----------
export const num = (v: unknown) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isFinite(n) ? n : 0;
};
export const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");
export const crore = (n: number) =>
  "₹ " + (n / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Cr";
const isTax = (a: Addon) => /gst|tax/i.test(a.name);
export const sectionTotal = (s: Section) => s.items.reduce((t, it) => t + num(it.qty) * num(it.rate), 0);

// Contingency and supervision are added on the base cost.
// GST is charged on (base + the other add-ons).
export function totals(e: Estimate) {
  const base = e.sections.reduce((t, s) => t + sectionTotal(s), 0);
  const nonTax = e.addons.map((a) => (isTax(a) ? 0 : (base * num(a.pct)) / 100));
  const taxable = base + nonTax.reduce((t, x) => t + x, 0);
  const addonAmts = e.addons.map((a, i) => (isTax(a) ? (taxable * num(a.pct)) / 100 : nonTax[i]));
  const grand = base + addonAmts.reduce((t, x) => t + x, 0);
  return { base, addonAmts, grand };
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

  const t = totals(est);
  const area = num(est.project.length) * num(est.project.width);
  const fileBase =
    est.project.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "rob-estimate";

  // ----- update helpers -----
  const setProject = (key: keyof Project, value: string) =>
    setEst((e) => ({ ...e, project: { ...e.project, [key]: value } }));

  const setSection = (si: number, fn: (s: Section) => Section) =>
    setEst((e) => ({ ...e, sections: e.sections.map((s, i) => (i === si ? fn(s) : s)) }));

  const setItem = (si: number, ii: number, key: keyof Item, value: string) =>
    setSection(si, (s) => ({
      ...s,
      items: s.items.map((it, i) => (i === ii ? { ...it, [key]: value } : it)),
    }));

  const setAddon = (ai: number, value: string) =>
    setEst((e) => ({ ...e, addons: e.addons.map((a, i) => (i === ai ? { ...a, pct: value } : a)) }));

  const addSection = () =>
    setEst((e) => ({
      ...e,
      sections: [
        ...e.sections,
        {
          name: String.fromCharCode(65 + e.sections.length) + ". New section",
          items: [{ desc: "", unit: "", qty: 0, rate: 0 }],
        },
      ],
    }));

  const deleteSection = (si: number) => {
    if (confirm(`Delete section "${est.sections[si].name}" and all its items?`))
      setEst((e) => ({ ...e, sections: e.sections.filter((_, i) => i !== si) }));
  };

  const reset = () => {
    if (confirm("This will remove your changes and load the sample estimate again. Continue?"))
      setEst(sample());
  };

  // ----- export / import -----
  const exportCsv = () => {
    const cell = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const p = est.project;
    const out: unknown[][] = [
      ["Project", p.name],
      ["Location", p.location],
      ["Length (m)", p.length, "Width (m)", p.width],
      ["Prepared by", p.preparedBy, "Date", p.date],
      [],
      ["Section", "#", "Item description", "Unit", "Quantity", "Rate (Rs)", "Amount (Rs)"],
    ];
    est.sections.forEach((s) => {
      s.items.forEach((it, i) =>
        out.push([s.name, i + 1, it.desc, it.unit, num(it.qty), num(it.rate), Math.round(num(it.qty) * num(it.rate))])
      );
      out.push([s.name + " total", "", "", "", "", "", Math.round(sectionTotal(s))]);
    });
    out.push([], ["Base cost of work", "", "", "", "", "", Math.round(t.base)]);
    est.addons.forEach((a, i) =>
      out.push([`${a.name} @ ${num(a.pct)}%`, "", "", "", "", "", Math.round(t.addonAmts[i])])
    );
    out.push(["GRAND TOTAL", "", "", "", "", "", Math.round(t.grand)]);
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
        if (!data.sections || !data.addons || !data.project) throw new Error("bad file");
        setEst(data);
      } catch {
        alert("This file is not a valid estimate file.");
      }
      if (fileInput.current) fileInput.current.value = "";
    };
    r.readAsText(f);
  };

  const projectFields: [keyof Project, string, boolean?][] = [
    ["name", "Project name"],
    ["location", "Location / LC No."],
    ["length", "Total length (m)", true],
    ["width", "Carriageway width (m)", true],
    ["preparedBy", "Prepared by"],
  ];

  return (
    <div className="wrap">
      <header>
        <a className="back" href="#/">← Home</a>
        <h1>Road Over Bridge (ROB) – Live Estimate</h1>
        <p>Type quantity and rate. Every total updates instantly. Your work is saved in this browser automatically.</p>
      </header>

      <div className="sticky-total">
        <span>Grand total (with taxes)</span>
        <span>
          {inr(t.grand)} ({crore(t.grand)})
        </span>
      </div>

      <div className="toolbar">
        <button className="primary" onClick={addSection}>+ Add section</button>
        <button onClick={exportCsv}>Download Excel (CSV)</button>
        <button onClick={saveFile}>Save estimate file</button>
        <button onClick={() => fileInput.current?.click()}>Open estimate file</button>
        <button onClick={() => window.print()}>Print / PDF</button>
        <button onClick={reset}>Reset to sample</button>
        <input ref={fileInput} type="file" accept=".json" hidden onChange={(e) => openFile(e.target.files?.[0])} />
      </div>

      <div className="card">
        <h2>Project details</h2>
        <div className="grid">
          {projectFields.map(([key, label, numeric]) => (
            <div key={key}>
              <label htmlFor={"p-" + key}>{label}</label>
              <input
                id={"p-" + key}
                className={numeric ? "num" : undefined}
                inputMode={numeric ? "decimal" : undefined}
                value={est.project[key]}
                onChange={(e) => setProject(key, e.target.value)}
              />
            </div>
          ))}
          <div>
            <label htmlFor="p-date">Date</label>
            <input id="p-date" type="date" value={est.project.date} onChange={(e) => setProject("date", e.target.value)} />
          </div>
        </div>
      </div>

      {est.sections.map((s, si) => (
        <div className="card" key={si}>
          <div className="section-head">
            <input
              className="sec-name"
              aria-label="Section name"
              value={s.name}
              onChange={(e) => setSection(si, (x) => ({ ...x, name: e.target.value }))}
            />
            <span className="section-total">{inr(sectionTotal(s))}</span>
          </div>
          <div className="table-scroll">
            <table>
              <colgroup>
                <col className="c-no" /><col /><col className="c-unit" /><col className="c-qty" />
                <col className="c-rate" /><col className="c-amt" /><col className="c-del" />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th><th>Item description</th><th>Unit</th><th className="r">Quantity</th>
                  <th className="r">Rate (₹)</th><th className="r">Amount (₹)</th><th></th>
                </tr>
              </thead>
              <tbody>
                {s.items.map((it, ii) => (
                  <tr key={ii}>
                    <td>{ii + 1}</td>
                    <td><input value={it.desc} onChange={(e) => setItem(si, ii, "desc", e.target.value)} /></td>
                    <td><input value={it.unit} onChange={(e) => setItem(si, ii, "unit", e.target.value)} /></td>
                    <td>
                      <input className="num" inputMode="decimal" value={it.qty}
                        onChange={(e) => setItem(si, ii, "qty", e.target.value)} />
                    </td>
                    <td>
                      <input className="num" inputMode="decimal" value={it.rate}
                        onChange={(e) => setItem(si, ii, "rate", e.target.value)} />
                    </td>
                    <td className="r amount">{inr(num(it.qty) * num(it.rate))}</td>
                    <td>
                      <button className="del" title="Delete row"
                        onClick={() => setSection(si, (x) => ({ ...x, items: x.items.filter((_, i) => i !== ii) }))}>
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="link"
            onClick={() => setSection(si, (x) => ({ ...x, items: [...x.items, { desc: "", unit: "", qty: 0, rate: 0 }] }))}>
            + Add item
          </button>{" "}
          <button className="link" style={{ color: "var(--danger)", marginLeft: 12 }} onClick={() => deleteSection(si)}>
            Delete section
          </button>
        </div>
      ))}

      <div className="card summary">
        <h2>Summary</h2>
        <table>
          <tbody>
            {est.sections.map((s, si) => {
              const st = sectionTotal(s);
              return (
                <tr key={si}>
                  <td>
                    {s.name} <span className="muted">({t.base ? ((st / t.base) * 100).toFixed(1) + "%" : "–"})</span>
                  </td>
                  <td></td>
                  <td className="r amount">{inr(st)}</td>
                </tr>
              );
            })}
            <tr>
              <td><strong>Base cost of work</strong></td>
              <td></td>
              <td className="r amount"><strong>{inr(t.base)}</strong></td>
            </tr>
            {est.addons.map((a, ai) => (
              <tr key={ai}>
                <td>
                  {a.name} {isTax(a) && <span className="muted">(on base + add-ons)</span>}
                </td>
                <td className="pct">
                  <input className="num" inputMode="decimal" aria-label={a.name + " percent"} value={a.pct}
                    onChange={(e) => setAddon(ai, e.target.value)} />
                </td>
                <td className="r amount">{inr(t.addonAmts[ai])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grand">
          <div>
            <div className="small">Grand total (with taxes)</div>
            <div className="big">{inr(t.grand)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="small">{crore(t.grand)}</div>
            <div className="small">Cost per sq.m of deck: {area ? inr(t.grand / area) : "–"}</div>
          </div>
        </div>
        <p className="note">
          Sample rates are rough examples only. Replace them with your SOR / DSR / market rates before using this estimate.
        </p>
      </div>
    </div>
  );
}
