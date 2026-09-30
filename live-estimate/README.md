# ROB Live Estimate

Detailed estimate for an Indian Railway Road Over Bridge (ROB), in the usual railway format.
Type quantity, rate and LAR %, and the abstract with Railway and State share updates instantly.

## Quick use (no install)

Double-click **ROB-Estimate.html**. It opens in your browser and works offline.

## Edit the code (needs Node.js)

1. Install **Node.js LTS** (version 22 or newer) from https://nodejs.org
2. Open this folder in VS Code (**File → Open Folder…**).
3. Open the terminal: **Terminal → New Terminal**.
4. Run:

   ```
   npm install
   npm run dev
   ```

The page opens in your browser. When you save a change in any `.tsx` file, the page updates by itself.
Next times, just run `npm run dev`.

## Rate list (USSOR / DSR items)

In each schedule click **+ Pick from rate list**, search by code or words, tick the items you need,
set the LAR % and click **Add**. Then type the quantity.

All 85 items of the LC 300 estimate are built in: USSOR 2021, DSR 2023, NS items and R&B SOR 2021-22 sign boards.
To add the full schedules, open the **Rate list** page and click **Import CSV file**.
The CSV needs columns Code, Description, Unit, Rate (Source is optional). In Excel use
File → Save As → CSV UTF-8. Imported items are saved in your browser.

## How the abstract is worked out

1. Each item: Qty × Rate, then LAR / price factor % (for example -28.32%, or -32% for a 0.68 factor).
2. Each portion (Railway portion, Approach portion) = total of its schedules.
3. Railway share = Railway % (default 50%) of the 2-lane cost of each portion. The rest is State share.
   If the 2-lane cost box is empty, half of the 4-lane cost is used.
4. Contingency % is added on the civil cost.
5. Departmental, environmental and sports charges are added on the cost after contingency.
6. Signal, Telecom, RCIL and Electrical sub-estimates are added with their own Railway %.
7. CRRM is deducted from the Railway share only.

The built-in example is the LC No. 300 four-lane ROB estimate. It gives a net cost of ₹ 91,64,22,987
(Railway ₹ 23,88,96,652, State ₹ 67,75,26,335), the same as the sanctioned abstract.

## Files

- `home.tsx` – the home (welcome) page.
- `estimate.tsx` – the estimate page and all the calculations. The LC 300 example is in `sample()`.
- `rates.ts` – built-in USSOR / DSR items and CSV import.
- `RatePicker.tsx` – the "Pick from rate list" pop-up.
- `ratesPage.tsx` – the Rate list page.
- `styles.css` – colours and layout.
- `main.tsx`, `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json` – setup files, no need to touch.

## Other commands

- `npm run build` – makes one ready-to-use file, `dist/index.html` (same as ROB-Estimate.html).
- `npm run preview` – opens that built file to check it.
