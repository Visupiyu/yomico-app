import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "./home";
import EstimatePage from "./estimate";
import "./styles.css";

// Simple page switch: "#/" = home, "#/estimate" = estimate.
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const onEstimate = hash === "#/estimate";

  return (
    <>
      <nav className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href="#/">ROB Estimate</a>
          <div className="nav-links">
            <a href="#/" className={onEstimate ? "" : "active"}>Home</a>
            <a href="#/estimate" className={onEstimate ? "active" : ""}>Estimate</a>
          </div>
        </div>
      </nav>
      {onEstimate ? <EstimatePage /> : <Home />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
