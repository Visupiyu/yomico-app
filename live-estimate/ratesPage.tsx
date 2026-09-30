import { useRef, useState } from "react";
import { download } from "./estimate";
import {
  BUILT_IN, allRates, loadImported, mergeImported, rateItemsFromCsv, ratesToCsv, saveImported, searchRates,
  type RateItem,
} from "./rates";

const MAX_SHOWN = 300;

// Page to see all rate list items and import more from a CSV file.
export default function RatesPage() {
  const [imported, setImported] = useState<RateItem[]>(() => loadImported());
  const [list, setList] = useState<RateItem[]>(() => allRates());
  const [query, setQuery] = useState("");
  const [src, setSrc] = useState("");
  const [importSrc, setImportSrc] = useState("USSOR 2021");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const sources = [...new Set(list.map((r) => r.src))].sort();
  const results = searchRates(list, query, src);

  const store = (items: RateItem[]) => {
    if (!saveImported(items)) {
      setMessage("Could not save: the list is too big for this browser's storage.");
      return false;
    }
    setImported(items);
    setList(allRates());
    return true;
  };

  const importFile = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const { items, error } = rateItemsFromCsv(String(r.result), importSrc.trim() || "Imported");
      if (error) setMessage(error);
      else if (!items.length) setMessage("No items found in this file.");
      else if (store(mergeImported(imported, items))) setMessage(`Imported ${items.length} items from ${f.name}.`);
      if (fileInput.current) fileInput.current.value = "";
    };
    r.readAsText(f);
  };

  const clearImported = () => {
    if (confirm(`Remove all ${imported.length} imported items? Built-in items stay.`)) {
      store([]);
      setMessage("Imported items removed.");
    }
  };

  const template = ratesToCsv([
    { src: "USSOR 2021", code: "22092", desc: "Bored cast-in-situ RCC pile, M-35, 1200 mm dia", unit: "Rmt", rate: 13176.35 },
    { src: "DSR 2023", code: "16.57.1", desc: "Bituminous concrete 40/50 mm, VG-30 @ 5.5%", unit: "Cum", rate: 12126.2 },
  ]);

  return (
    <div className="wrap">
      <header>
        <a className="back" href="#/">← Home</a>
        <h1>Rate list</h1>
        <p>
          USSOR and DSR items you can pick in the estimate. {BUILT_IN.length} items are built in (from the LC 300
          estimate). Import the full schedules from a CSV file to add all items.
        </p>
      </header>

      <div className="card">
        <h2>Import items from CSV</h2>
        <p className="muted">
          The file needs columns <strong>Code</strong>, <strong>Description</strong>, <strong>Unit</strong> and{" "}
          <strong>Rate</strong>. A <strong>Source</strong> column is optional. In Excel use{" "}
          <em>File → Save As → CSV UTF-8</em>. Items with the same source and code are updated.
        </p>
        <div className="grid">
          <div>
            <label htmlFor="imp-src">Source name (if the file has no Source column)</label>
            <input id="imp-src" list="src-names" value={importSrc} onChange={(e) => setImportSrc(e.target.value)} />
            <datalist id="src-names">
              <option value="USSOR 2021" />
              <option value="DSR 2023" />
            </datalist>
          </div>
        </div>
        <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
          <button className="primary" onClick={() => fileInput.current?.click()}>Import CSV file</button>
          <button onClick={() => download("rate-list-template.csv", template, "text/csv;charset=utf-8")}>Download template</button>
          <button onClick={() => download("rate-list.csv", ratesToCsv(list), "text/csv;charset=utf-8")}>Download full list</button>
          {imported.length > 0 && <button onClick={clearImported}>Remove imported ({imported.length})</button>}
          <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={(e) => importFile(e.target.files?.[0])} />
        </div>
        {message && <p className="notice">{message}</p>}
      </div>

      <div className="card">
        <h2>All items ({list.length})</h2>
        <div className="picker-filters">
          <input placeholder="Search by code or words" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Source">
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="rate-table">
            <thead>
              <tr><th>Source</th><th>Code</th><th>Description</th><th>Unit</th><th className="r">Rate (₹)</th></tr>
            </thead>
            <tbody>
              {results.slice(0, MAX_SHOWN).map((r) => (
                <tr key={r.src + "|" + r.code}>
                  <td className="muted nowrap">{r.src}</td>
                  <td className="nowrap">{r.code}</td>
                  <td>{r.desc}</td>
                  <td>{r.unit}</td>
                  <td className="r amount">{r.rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.length > MAX_SHOWN && (
          <p className="muted">Showing first {MAX_SHOWN} of {results.length}. Type more words to narrow the list.</p>
        )}
        <p className="note">
          DSR rates are base rates. Enter the price multiplying factor as LAR % in the estimate (for example 0.68 → −32).
        </p>
      </div>
    </div>
  );
}
