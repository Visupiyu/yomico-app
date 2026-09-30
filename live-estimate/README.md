# ROB Live Estimate

Road Over Bridge cost calculator. Type quantity and rate, and all totals update instantly.

## Run it (first time)

1. Install **Node.js LTS** (version 22 or newer) from https://nodejs.org
2. Open this folder in VS Code (**File → Open Folder…**).
3. Open the terminal: **Terminal → New Terminal**.
4. Run:

   ```
   npm install
   npm run dev
   ```

The page opens in your browser. When you save a change in any `.tsx` file, the page updates by itself.

## Next times

Just run `npm run dev`.

## Files

- `home.tsx` – the home (welcome) page.
- `estimate.tsx` – the estimate calculator (items, rates, totals). Sample items and rates are in `sample()`.
- `styles.css` – colours and layout.
- `main.tsx`, `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json` – setup files, no need to touch.
- `offline.html` – the older single-file version; double-click to open without Node.js.

## Other commands

- `npm run build` – makes a ready-to-host website in the `dist` folder.
- `npm run preview` – opens that built website to check it.
