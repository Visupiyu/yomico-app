import { STORAGE_KEY, crore, inr, load, num, sample, sectionTotal, totals } from "./estimate";

const steps = [
  ["1", "Enter project details", "LC number, location, bridge length and carriageway width."],
  ["2", "Fill quantities and rates", "Type quantity and rate for each item. All totals update instantly."],
  ["3", "Download or print", "Export to Excel (CSV), save the estimate file, or print as PDF."],
];

const covered = [
  ["Foundation", "Excavation, bored piles, pile caps, PCC."],
  ["Substructure", "Piers, pier caps, abutments, bearings."],
  ["Superstructure", "PSC girders, prestressing, deck slab, crash barrier, expansion joints."],
  ["Reinforcement steel", "TMT bars for all components."],
  ["Railway span", "Steel composite girder over track, traffic block and supervision."],
  ["Approaches", "Embankment, RE wall, road layers, drainage."],
  ["Miscellaneous", "Lighting, utility shifting, traffic diversion, signage."],
  ["Taxes and add-ons", "Contingency, quality control and GST, all editable."],
];

export default function Home() {
  const saved = load();
  const t = saved ? totals(saved) : null;
  const area = saved ? num(saved.project.length) * num(saved.project.width) : 0;

  const startNew = () => {
    if (saved && !confirm("Start a new estimate? Your current saved estimate will be replaced with the sample.")) return;
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
            Prepare a quick cost estimate for a Road Over Bridge in place of a railway level crossing. Enter quantities
            and rates, and see the total in rupees and crore straight away.
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
        {saved && t && (
          <div className="card snapshot">
            <h2>Your saved estimate</h2>
            <p className="muted">{saved.project.name || "Untitled project"}{saved.project.location ? " · " + saved.project.location : ""}</p>
            <div className="stats">
              <div className="stat">
                <span className="stat-label">Grand total</span>
                <span className="stat-value">{crore(t.grand)}</span>
                <span className="muted">{inr(t.grand)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Base cost of work</span>
                <span className="stat-value">{crore(t.base)}</span>
                <span className="muted">before add-ons and GST</span>
              </div>
              <div className="stat">
                <span className="stat-label">Cost per sq.m of deck</span>
                <span className="stat-value">{area ? inr(t.grand / area) : "–"}</span>
                <span className="muted">{area ? `${num(saved.project.length)} m × ${num(saved.project.width)} m` : "add length and width"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Biggest section</span>
                <span className="stat-value small-value">
                  {saved.sections.length
                    ? saved.sections.reduce((a, b) => (sectionTotal(b) > sectionTotal(a) ? b : a)).name
                    : "–"}
                </span>
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
