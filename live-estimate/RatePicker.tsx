import { useEffect, useMemo, useState } from "react";
import { allRates, searchRates, type RateItem } from "./rates";

const MAX_SHOWN = 200;

type Props = {
  scheduleName: string;
  onAdd: (picked: RateItem[], lar: string) => void;
  onClose: () => void;
};

// Pop-up to search the rate list and add ticked items to a schedule.
export default function RatePicker({ scheduleName, onAdd, onClose }: Props) {
  const list = useMemo(() => allRates(), []);
  const sources = useMemo(() => [...new Set(list.map((r) => r.src))].sort(), [list]);
  const [query, setQuery] = useState("");
  const [src, setSrc] = useState("");
  const [lar, setLar] = useState("0");
  const [picked, setPicked] = useState<Map<string, RateItem>>(new Map());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = searchRates(list, query, src);
  const key = (r: RateItem) => r.src + "|" + r.code;

  const toggle = (r: RateItem) =>
    setPicked((m) => {
      const next = new Map(m);
      if (next.has(key(r))) next.delete(key(r));
      else next.set(key(r), r);
      return next;
    });

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Pick items from rate list" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Pick items from rate list</h2>
            <p className="muted">Adding to: {scheduleName}</p>
          </div>
          <button className="del" title="Close" onClick={onClose}>×</button>
        </div>

        <div className="picker-filters">
          <input
            autoFocus
            placeholder="Search by code or words, e.g. 22092 or pile 1200"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Source">
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="picker-list">
          {results.slice(0, MAX_SHOWN).map((r) => (
            <label key={key(r)} className={"picker-row" + (picked.has(key(r)) ? " on" : "")}>
              <input type="checkbox" checked={picked.has(key(r))} onChange={() => toggle(r)} />
              <span className="pr-code">
                {r.code}
                <small>{r.src}</small>
              </span>
              <span className="pr-desc">{r.desc}</span>
              <span className="pr-rate">
                ₹ {r.rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <small>per {r.unit || "unit"}</small>
              </span>
            </label>
          ))}
          {results.length === 0 && <p className="muted pad">No items found. Try other words, or import more items on the Rate list page.</p>}
          {results.length > MAX_SHOWN && (
            <p className="muted pad">Showing first {MAX_SHOWN} of {results.length}. Type more words to narrow the list.</p>
          )}
        </div>

        <div className="modal-foot">
          <div className="lar-box">
            <label htmlFor="pick-lar">LAR / price factor % for these items</label>
            <input id="pick-lar" className="num" inputMode="decimal" value={lar} onChange={(e) => setLar(e.target.value)} />
          </div>
          <div className="foot-buttons">
            <button onClick={onClose}>Cancel</button>
            <button className="primary" disabled={picked.size === 0} onClick={() => onAdd([...picked.values()], lar)}>
              Add {picked.size || ""} item{picked.size === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
