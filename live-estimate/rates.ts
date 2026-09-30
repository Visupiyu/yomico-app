// Rate list (USSOR / DSR items) used by the "Pick from rate list" button.
// Built-in items come from the LC No. 300 ROB estimate. More items can be
// imported from a CSV file on the Rate list page.

export type RateItem = { src: string; code: string; desc: string; unit: string; rate: number };

const USSOR = "USSOR 2021";
const DSR = "DSR 2023";

const u = (code: string, desc: string, unit: string, rate: number): RateItem => ({ src: USSOR, code, desc, unit, rate });
const d = (code: string, desc: string, unit: string, rate: number): RateItem => ({ src: DSR, code, desc, unit, rate });

export const BUILT_IN: RateItem[] = [
  // ----- WR USSOR 2021 -----
  u("13042", "Portable fencing along running track (steel angles), with red luminous paint strips", "Rmt", 263.0),
  u("13051", "Barricading with bamboo / balli posts at 2 m, 3 horizontal members min. 50 mm dia", "Rmt", 444.77),
  u("21024", "Exploratory drilling of 150 mm dia boreholes, 30 to 40 m depth", "Metre", 4472.99),
  u("22011", "Earthwork in excavation for bridge foundations, all kinds of soils", "Cum", 213.47),
  u("22032", "PCC 1:2:4 with 20 mm graded stone aggregate in foundations of bridges", "Cum", 3979.69),
  u("22040", "Machine batched, mixed and vibrated design mix concrete in foundations", "Cum", 4115.74),
  u("22051", "Design mix concrete for abutment and pier", "Cum", 4242.71),
  u("22052", "Design mix concrete for wing wall, return wall and drain", "Cum", 4242.71),
  u("22053", "Design mix concrete for abutment cap, pier cap, pedestal, diaphragm wall etc.", "Cum", 4306.2),
  u("22054", "Design mix concrete for approach slab, dirt wall / ballast wall at formation level", "Cum", 4179.23),
  u("22060", "PCC 1:3:6 with 40 mm graded stone aggregate in foundations of bridges", "Cum", 4085.62),
  u("22092", "Bored cast-in-situ RCC pile, M-35 design mix, 1200 mm dia", "Rmt", 13176.35),
  u("22093", "Bored cast-in-situ RCC pile, M-35 design mix, 1000 mm dia", "Rmt", 10844.33),
  u("22100", "Permanent steel casing pipe for bored piles, all diameters", "MT", 118971.16),
  u("22123", "Initial load test of single pile, above 100 t up to 250 t capacity", "Each", 99870.93),
  u("22124", "Extra for every 50 t increase in pile load test capacity over 250 t", "Each", 5559.25),
  u("22127", "Routine load test of pile, above 100 t up to 250 t capacity", "Each", 49935.46),
  u("22131", "Lateral load test of single pile, up to 50 t", "Each", 27197.59),
  u("22140", "Pulse Echo Test (PET) for integrity testing of piles", "Each", 3389.44),
  u("25031", "Centering and shuttering for bridge sub-structures (pile cap, pier, abutment, wing wall, pier cap etc.)", "Sqm", 746.3),
  u("25032", "Centering and shuttering for bridge super-structures (slabs, I / T / box girders) up to 5 m above GL", "Sqm", 969.34),
  u("25072", "Supply of Ordinary Portland Cement 53 grade", "MT", 9275.03),
  u("25082", "TMT reinforcement bars Fe-500D or more, incl. cutting, bending, placing and binding", "kg", 116.39),
  u("31011", "Design mix concrete for cast-in-situ PSC girders / slabs, soffit up to 9 m above bed level", "Cum", 4306.2),
  u("31012", "Design mix concrete for cast-in-situ PSC girders / slabs, soffit 9 m to 12 m above bed level", "Cum", 4496.67),
  u("31070", "Designed staging for cast-in-situ PSC girders / slabs up to 10.5 m height", "Cum", 3200.83),
  u("31090", "Elastomeric bearing (IS:3400) for PSC / steel girders", "Cucm", 0.73),
  u("31101", "Strip seal expansion joint, 40 mm expansion", "Rmt", 7334.57),
  u("31111", "Load testing of bridge span, design load up to 100 MT", "Each", 90397.76),
  u("31112", "Extra for every 1 MT increase over 100 MT in span load test, up to 800 MT", "MT", 328.84),
  u("31192", "GI drainage spouts 100 mm dia with grating", "Rmt", 1453.38),
  u("41011", "Plate / semi-through / composite girder, steel E250 (supply, fabrication, erection)", "MT", 151241.75),
  u("41013", "Extra for using steel of grade E350", "MT", 5396.3),
  u("41020", "HSFG bolts with nuts and DTI washers", "kg", 354.38),
  u("41041", "Metalizing of new girder steel work during fabrication, with primer and aluminium paint", "Sqm", 734.3),
  u("41050", "GI pipe railing for footpath / anti-crash barrier", "kg", 113.03),
  u("41060", "Anti-skid MS angle nosing 65x65x8 mm with anchor bars", "kg", 114.24),
  u("41080", "Access ladders, inspection platforms etc. (supply, fabrication, fixing)", "MT", 110841.29),
  u("41121", "POT-cum-PTFE bearing, free end", "Each", 73042.26),
  u("41122", "POT bearing, fixed type", "Each", 78228.1),
  u("41123", "POT-cum-PTFE bearing, guided (L)", "Each", 78159.87),
  u("41124", "POT-cum-PTFE bearing, guided (T)", "Each", 81571.61),
  u("41261", "Painting steel work: zinc chromate primer + zinc chromate red oxide coat", "Sqm", 94.69),
  u("41264", "Painting steel work: two coats epoxy paint (RDSO M&C/PCN/123-11)", "Sqm", 214.05),
  u("52140", "Drainage / rain water pipe 100–110 mm dia with fittings", "Rmt", 401.92),
  u("52150", "Filter media of granular material (GW, GP, SW groups as per IS:1498)", "Cum", 4229.27),
  u("52240", "Earthwork in filling in embankment, guide bunds, around abutments", "Cum", 2536.29),
  u("183020", "Fabrication and fixing of check rails over PSC sleepers", "TRm", 1218.23),
  // ----- CPWD DSR 2023 (base rates, before price multiplying factor) -----
  d("4.6.1", "Precast cement concrete kerbs, edgings etc. 1:1½:3", "Cum", 8726.85),
  d("10.2", "Structural steel work riveted, bolted or welded in built-up sections, trusses and framed work", "kg", 133.7),
  d("14.89.1", "APP modified five-layer 2 mm thick waterproofing membrane", "Sqm", 498.35),
  d("16.30.1", "Prime coat, hot bitumen VG-10 on WBM @ 0.75 kg/sqm", "Sqm", 60.5),
  d("16.31.1.2", "Tack coat, rapid setting bitumen emulsion on bituminous surface @ 0.25 kg/sqm", "Sqm", 9.2),
  d("16.37.1", "Bitumen mastic wearing course, 25 mm thick", "Sqm", 854.15),
  d("16.37.2", "Bitumen mastic wearing course, 40 mm thick", "Sqm", 1365.5),
  d("16.48.1", "Road surface marking, normal paint two coats (white)", "Sqm", 288.9),
  d("16.50", "Glow studs (cat eye) 100x20 mm", "Nos", 206.3),
  d("16.54.1", "Dense Graded Bituminous Macadam 50–100 mm, bitumen VG-30 @ 5%", "Cum", 11129.55),
  d("16.57.1", "Bituminous concrete 40/50 mm, bitumen VG-30 @ 5.5%", "Cum", 12126.2),
  d("16.59.2", "Cautionary / warning sign board, triangular 900 mm, support 3650 mm", "Nos", 5559.75),
  d("16.78.1", "Granular sub-base, Grade-I (75 mm to 0.075 mm), CBR 30", "Cum", 2784.0),
  d("16.78.3", "Granular sub-base, Grade-III (26.5 mm to 0.075 mm), CBR 20", "Cum", 2808.55),
  d("16.79", "Wet mix macadam, graded stone aggregate 53 mm to 0.075 mm", "Cum", 2914.3),
];

const LIB_KEY = "rob-rate-list-v1";

export function loadImported(): RateItem[] {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveImported(items: RateItem[]): boolean {
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

const keyOf = (r: RateItem) => r.src.toLowerCase() + "|" + r.code.toLowerCase();

// Imported items replace built-in ones with the same source and code.
export function allRates(): RateItem[] {
  const map = new Map<string, RateItem>();
  BUILT_IN.forEach((r) => map.set(keyOf(r), r));
  loadImported().forEach((r) => map.set(keyOf(r), r));
  return [...map.values()];
}

export function mergeImported(existing: RateItem[], added: RateItem[]): RateItem[] {
  const map = new Map<string, RateItem>();
  existing.forEach((r) => map.set(keyOf(r), r));
  added.forEach((r) => map.set(keyOf(r), r));
  return [...map.values()];
}

export function searchRates(list: RateItem[], query: string, src: string): RateItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((r) => {
    if (src && r.src !== src) return false;
    const text = (r.code + " " + r.desc + " " + r.unit).toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

// ---------- CSV ----------
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

// Reads a CSV with columns like: Source, Code, Description, Unit, Rate.
// The Source column is optional; `defaultSrc` is used when it is missing.
export function rateItemsFromCsv(text: string, defaultSrc: string): { items: RateItem[]; error?: string } {
  const rows = parseCsv(text);
  const hi = rows.findIndex((r) => {
    const j = r.join(" ").toLowerCase();
    return j.includes("desc") && j.includes("rate");
  });
  if (hi < 0) return { items: [], error: "Could not find a header row with Description and Rate columns." };
  const h = rows[hi].map((c) => c.toLowerCase().trim());
  const find = (re: RegExp) => h.findIndex((c) => re.test(c));
  const ci = find(/code|item\s*no|item|ref/);
  const di = find(/desc/);
  const ui = find(/unit/);
  const ri = find(/rate/);
  const si = find(/source|sor|schedule/);
  if (ci < 0 || di < 0 || ri < 0) return { items: [], error: "Need at least Code, Description and Rate columns." };
  const items: RateItem[] = [];
  for (const r of rows.slice(hi + 1)) {
    const rate = parseFloat(String(r[ri] ?? "").replace(/[,₹\s]/g, ""));
    const code = (r[ci] ?? "").trim();
    const desc = (r[di] ?? "").trim();
    if (!code || !desc || !isFinite(rate)) continue;
    items.push({
      src: (si >= 0 && r[si]?.trim()) || defaultSrc,
      code,
      desc,
      unit: ui >= 0 ? (r[ui] ?? "").trim() : "",
      rate,
    });
  }
  return { items };
}

export function ratesToCsv(items: RateItem[]): string {
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const out = [["Source", "Code", "Description", "Unit", "Rate"], ...items.map((r) => [r.src, r.code, r.desc, r.unit, r.rate])];
  return "﻿" + out.map((r) => r.map(cell).join(",")).join("\r\n");
}
