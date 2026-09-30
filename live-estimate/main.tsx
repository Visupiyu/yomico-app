import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "./home";
import EstimatePage from "./estimate";
import RatesPage from "./ratesPage";
import "./styles.css";

// Simple page switch: "#/" = home, "#/estimate" = estimate, "#/rates" = rate list.
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
  const page = hash === "#/estimate" ? "estimate" : hash === "#/rates" ? "rates" : "home";

  return (
    <>
      <nav className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href="#/">ROB Estimate</a>
          <div className="nav-links">
            <a href="#/" className={page === "home" ? "active" : ""}>Home</a>
            <a href="#/estimate" className={page === "estimate" ? "active" : ""}>Estimate</a>
            <a href="#/rates" className={page === "rates" ? "active" : ""}>Rate list</a>
          </div>
        </div>
      </nav>
      {page === "estimate" ? <EstimatePage /> : page === "rates" ? <RatesPage /> : <Home />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
