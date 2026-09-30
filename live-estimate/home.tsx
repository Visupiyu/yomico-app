import { STORAGE_KEY, calc, crore, inr, load, num, sample } from "./estimate";

const steps = [
  ["1", "Enter project details", "Name of work, LC number, section / km, division and estimate number."],
  ["2", "Pick items", "Search the USSOR / DSR rate list, tick the items you need, then type quantity and LAR %."],
  ["3", "Check the abstract", "Railway and State share, contingency, charges, S&T / electrical and CRRM, all live."],
  ["4", "Download or print", "Export to Excel (CSV), save the estimate file, or print as PDF."],
];

const covered = [
  ["Railway portion (SE-01)", "Schedules B1 to B6: USSOR, DSR and NS items with LAR %."],
  ["Approach portion", "State Govt. estimate schedules and other provisions."],
  ["Cost sharing", "Railway share as % of 2-lane cost, rest as State share."],
  ["Contingency", "Contingency % on the total civil cost."],
  ["Charges", "Departmental, environmental and sports charges, all editable."],
  ["Other sub-estimates", "Signal, Telecom, RCIL, Electrical and TRD with their own share %."],
  ["CRRM", "Credit for released material, deducted from the Railway share."],
  ["Abstract of cost", "Railway share, State share and total, row by row."],
  ["Rate list", "Built-in USSOR 2021 and DSR 2023 items; import full schedules from CSV."],
];

export default function Home() {
  const saved = load();
  const c = saved ? calc(saved) : null;

  const startNew = () => {
    if (saved && !confirm("Start a new estimate? Your current saved estimate will be replaced with the LC 300 example.")) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample()));
    } catch {
      /* storage not available */
    }
    location.hash = "#/estimate";
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Indian Railway · Road Over Bridge</p>
          <h1>ROB cost estimate, live as you type</h1>
          <p className="lead">
            Prepare a detailed estimate for a Road Over Bridge in place of a railway level crossing, in the usual
            railway format: schedules with LAR %, contingency, departmental charges, S&amp;T and electrical
            sub-estimates, CRRM, and the Railway and State share.
          </p>
          <div className="hero-actions">
            {saved ? (
              <>
                <a className="btn primary" href="#/estimate">Continue my estimate</a>
                <button className="btn ghost" onClick={startNew}>Start new estimate</button>
              </>
            ) : (
              <button className="btn primary" onClick={startNew}>Start estimate</button>
            )}
          </div>
        </div>
      </section>

      <div className="wrap">
        {saved && c && (
          <div className="card snapshot">
            <h2>Your saved estimate</h2>
            <p className="muted">
              {saved.project.name || "Untitled work"}
              {saved.project.lcNo ? " · LC No. " + saved.project.lcNo : ""}
            </p>
            <div className="stats">
              <div className="stat">
                <span className="stat-label">Net cost of ROB</span>
                <span className="stat-value">{crore(c.net[2])}</span>
                <span className="muted">{inr(c.net[2])}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Railway share</span>
                <span className="stat-value">{crore(c.net[0])}</span>
                <span className="muted">{c.net[2] ? ((c.net[0] / c.net[2]) * 100).toFixed(1) + "% of total" : "–"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">State share</span>
                <span className="stat-value">{crore(c.net[1])}</span>
                <span className="muted">{c.net[2] ? ((c.net[1] / c.net[2]) * 100).toFixed(1) + "% of total" : "–"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Civil cost (before charges)</span>
                <span className="stat-value">{crore(c.civil[2])}</span>
                <span className="muted">{saved.portions.length} portions · Railway pays {num(saved.rlySharePct)}% of 2-lane cost</span>
              </div>
            </div>
          </div>
        )}

        <h2 className="block-title">How it works</h2>
        <div className="steps">
          {steps.map(([n, title, text]) => (
            <div className="card step" key={n}>
              <span className="step-no">{n}</span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </div>

        <h2 className="block-title">What the estimate covers</h2>
        <div className="covered">
          {covered.map(([title, text]) => (
            <div className="card cover-item" key={title}>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </div>

        <p className="note footer-note">
          This is an independent estimating tool, not an official Indian Railways website. Sample rates are rough
          examples only. Replace them with your current SOR / DSR / market rates before use. Your data stays in your
          own browser.
        </p>
      </div>
    </div>
  );
}
