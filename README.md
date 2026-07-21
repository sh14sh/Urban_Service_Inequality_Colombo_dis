# Urban Service Community Feedback Mapping

A standalone Leaflet + OpenStreetMap web app where citizens report urban
service problems (hospitals, schools, banks, parks, bus stops) by pinning a
location on the map, and planners see every report live as a marker plus a
scrollable feedback list — no database or backend server, just Google
Forms + Google Sheets + Google Apps Script.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure — map, feedback form, feedback dashboard |
| `style.css` | All styling |
| `script.js` | App logic (map, select-location, form submit, live fetch, sync) |
| `apps-script.gs` | Paste this into your Google Sheet's Apps Script editor |

## 1. ⚠️ Fix the duplicate entry ID first

Your spec listed the same entry ID (`entry.1615350334`) for both **Service
Type** and **Issue Category**. Two different Form questions can't share one
ID — whichever value is submitted second will silently overwrite the first
in your Sheet.

To find the correct ID:
1. Open your Form's 3-dot menu → **Get pre-filled link**.
2. Type a distinct placeholder into the Issue Category question only (e.g.
   `ISSUECATEGORYTEST`).
3. Click **Get link**, then look at the generated URL — find the
   `entry.NNNNNNNNN=ISSUECATEGORYTEST` pair.
4. In `script.js`, update:
   ```js
   issueCategory: 'entry.NNNNNNNNN',  // ← paste the correct ID here
   ```

Everything else (`formActionUrl`, `gnDivision`, `serviceType`,
`description`, `location`) is already filled in from what you gave me.

## 2. Publish the Google Apps Script JSON API

1. Open the Google **Sheet** linked to your Form (Form → Responses tab →
   green Sheets icon → *View responses in Sheets*).
2. **Extensions → Apps Script**.
3. Delete any starter code, paste in the contents of `apps-script.gs`.
4. If your responses tab isn't named `Form Responses 1`, edit that string
   in the script to match your actual tab name.
5. **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, authorize when prompted, and copy the URL ending in
   `/exec`.
7. In `script.js`, find `APPS_SCRIPT_CONFIG` and paste it in:
   ```js
   const APPS_SCRIPT_CONFIG = {
     url: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
     refreshIntervalMs: 30000
   };
   ```

## 3. Run it locally

Browsers block `fetch()` on files opened directly (`file://`), so serve the
folder over HTTP:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000**.

## 4. Deploy on GitHub Pages

1. Create a new GitHub repository (or use an existing one) and push these
   files (`index.html`, `style.css`, `script.js`) to the root of the `main`
   branch — `apps-script.gs` doesn't need to go here since it lives inside
   Google Sheets, not your site.
   ```bash
   git init
   git add index.html style.css script.js
   git commit -m "Community feedback mapping app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. On GitHub, go to your repo's **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, branch `main`,
   folder `/ (root)`, then **Save**.
4. After a minute, your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```

## How it works

- **Select Location**: click the button, then click anywhere on the map —
  the coordinates fill the Location field as `lat,lng` and a marker drops
  where you clicked.
- **Submit Feedback**: validates all fields, POSTs to your Google Form via
  a hidden iframe (no page reload), shows "Feedback submitted
  successfully.", then re-polls the live feed a few seconds later so your
  own submission appears once Sheets has written the row.
- **Recent Submitted Feedback**: reads live from your Sheet via the Apps
  Script URL, newest first, refreshing automatically every 30 seconds (or
  on demand via the ⟳ Refresh button / toggle off with **Auto**).
- **Dashboard ↔ map sync**: click a feedback card to fly the map to its
  location and open its popup; click a marker to highlight and scroll to
  its card.
- **Persistence**: nothing is stored in the browser — every submission
  lives permanently in your Google Sheet, so a page refresh always shows
  the full history.

## Notes

- Leaflet, OpenStreetMap tiles, and fonts load from CDNs, so an internet
  connection is required.
- No Firebase, no Supabase, no backend server — this app is fully static
  and can be hosted anywhere that serves plain files (GitHub Pages, Netlify,
  a simple web server, etc).
- Only the 5 fields you specified are submitted: GN Division, Service Type,
  Issue Category, Description, Location. No reporter name or email is
  collected.
