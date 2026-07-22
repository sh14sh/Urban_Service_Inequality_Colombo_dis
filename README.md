# Urban Service Inequality Web-Based Mapping System — Colombo District

An interactive, planning-oriented Web GIS built with **HTML, CSS, JavaScript
and Leaflet.js**. It visualizes GN Division accessibility/priority indices,
five categories of urban service points, and a Google Forms–backed
community feedback system — all client-side, no server framework required.

## File structure

```
webgis/
├── index.html              Page structure (header, sidebars, map, feedback form)
├── style.css               All styling / design tokens
├── config.js                ⭐ Paste your Google Form + Apps Script URLs here
├── script.js                Application logic (map, layers, search, feedback)
├── Code.gs                  Google Apps Script — publishes Sheet as JSON API
├── APPS_SCRIPT_SETUP.md      Step-by-step Apps Script deployment guide
├── generate_data.py         Script used to generate the sample GeoJSON (optional, not needed at runtime)
└── data/
    ├── gn_divisions.geojson   GN Division polygons + population/accessibility/priority
    ├── hospitals.geojson
    ├── schools.geojson
    ├── banks.geojson
    ├── parks.geojson
    └── busstops.geojson
```

## ⚠️ About the sample data

Real GN Division boundary shapefiles and complete facility inventories for
Colombo District weren't available in this environment, so `data/*.geojson`
contains **illustrative sample data**: simplified square "GN Division" cells
centered on real localities (Kollupitiya, Dehiwala, Moratuwa, Maharagama,
Kaduwela, etc.) with synthetic population/accessibility/priority figures,
and randomly-placed service points. This is enough to demonstrate every
feature of the system end to end.

**For a real submission**, replace the files in `data/` with:
- Official GN Division boundaries (e.g. from the Survey Department of Sri
  Lanka, the Department of Census & Statistics, or a digitized boundary set)
  — keep the same property names (`gn_name`, `population`,
  `accessibility_index`, `priority_index`) or update `script.js` to match.
- Actual facility locations (hospitals, schools, banks, parks, bus stops)
  from OpenStreetMap (via Overpass Turbo), the Ministry of Health/Education,
  or your own field survey — same GeoJSON `Point` structure with a `name`
  and `category` property.

## Where to paste your own IDs

| What | File | Where |
|---|---|---|
| Google Form submission URL | `config.js` | `GOOGLE_FORM_ACTION_URL` |
| Google Form entry IDs | `config.js` | `GOOGLE_FORM_ENTRIES` |
| Google Apps Script Web App URL | `config.js` | `APPS_SCRIPT_API_URL` (see `APPS_SCRIPT_SETUP.md`) |

The Form URL and entry IDs you supplied are already filled in. Note that
**Service Type** and **Issue Category** were given the same entry ID
(`entry.1615350334`) in the brief — if that wasn't intentional, open your
live Form, inspect the Issue Category `<select>`/`<input>`, and update that
one line in `config.js`.

## Running locally

Because the app loads GeoJSON files with `fetch()`, opening `index.html`
directly from disk (`file://…`) will be blocked by the browser's CORS
policy. Serve the folder instead, e.g.:

```bash
cd webgis
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works (VS Code "Live Server" extension, `npx serve`, etc.).

## Deploying on GitHub Pages

1. Create a new GitHub repository and push everything in this folder to it
   (keep `data/` in place — GitHub Pages serves static files including
   `.geojson` with no extra config).
2. In the repository, go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and folder `/ (root)`.
4. Click **Save**. GitHub will publish the site at:
   `https://<your-username>.github.io/<repo-name>/`
5. Open that URL — it should load exactly like the local version, and the
   Google Form / Apps Script integration works the same way since both are
   plain HTTPS endpoints.

## Feature checklist

- GN Division choropleth with 5-class Accessibility Index and 3-class
  Priority Index, switchable via the header buttons.
- Five toggleable service point layers (Hospitals, Schools, Banks, Parks,
  Bus Stops) with live counts, marker clustering, and popups.
- Dynamic legend, dashboard statistics, and a GN Division profile panel
  that updates on map click.
- GN Division search with zoom, boundary highlight and popup.
- Community Feedback Dashboard: map-based location picker, submission to
  Google Forms, a live card list backed by an Apps Script JSON API,
  bidirectional card ⟷ marker highlighting, manual refresh + 30s
  auto-refresh.
