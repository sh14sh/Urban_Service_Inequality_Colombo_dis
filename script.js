/* =====================================================================
   Urban Service Inequality Web-Based Mapping System — Colombo District
   Main application logic (Leaflet + vanilla JS)
   ===================================================================== */

(() => {
  "use strict";

  // -------------------------------------------------------------
  // MAP SETUP
  // -------------------------------------------------------------
const map = L.map('map', {
  zoomControl: false,
  minZoom: 9
}).setView([6.9271, 79.9612], 11); // fallback view; refit once data loads

L.control.zoom({ position: 'bottomright' }).addTo(map);

const osmBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);
  // -------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------
 const DATA_FILES = {
  gn:        'data/GND_layer_n.geojson',
  Hospitals: 'data/Hospitals.geojson',
  Schools:   'data/Schools.geojson',
  Banks:     'data/Banks.geojson',
  Parks:     'data/Parks.geojson',
  BusStops:  'data/Bus_stops.geojson'
};

// Field names on the gn polygon layer (edit here if your schema differs)
const FIELD = {
  name:        'ADM4_EN',
  population:  'Colombo_GN_Population_Population',
  accessibility: 'AI',
  priority:    'priority_i'
};

// Colors per service layer + a text glyph used inside the marker
const SERVICE_STYLE = {
  Hospitals: { color: '#d7304a', glyph: '+',  label: 'Hospital' },
  Schools:   { color: '#2f6fed', glyph: 'S',  label: 'School' },
  Banks:     { color: '#c99a2e', glyph: '$',  label: 'Bank' },
  Parks:     { color: '#2f9e6b', glyph: '\u2698', label: 'Park' },
  BusStops:  { color: '#8452d5', glyph: '\u2261', label: 'Bus Stop' }
};

// Accessibility Index — 5 class scheme (low -> high = worse -> better)
const ACCESSIBILITY_CLASSES = [
  { label: 'Very Poor', color: '#d7304a' },
  { label: 'Poor',       color: '#f2884f' },
  { label: 'Moderate',   color: '#f5cc5b' },
  { label: 'Good',       color: '#8dc06a' },
  { label: 'Excellent',  color: '#1c8a5c' }
];

// Priority Index — 3 class scheme (low -> high = low -> high priority)
const PRIORITY_CLASSES = [
  { label: 'Low Priority',    color: '#2f9e6b' },
  { label: 'Medium Priority', color: '#ef9d3d' },
  { label: 'High Priority',   color: '#e0433f' }
];

  // -------------------------------------------------------------
  // COLOR SCALES
  // -------------------------------------------------------------
  function accessibilityColor(v) {
    if (v < 20) return "#D7263D";   // Very Poor
    if (v < 40) return "#E8703D";   // Poor
    if (v < 60) return "#E8C93D";   // Moderate
    if (v < 80) return "#8FC96A";   // Good
    return "#3FA796";               // Excellent
  }
  function accessibilityLabel(v) {
    if (v < 20) return "Very Poor";
    if (v < 40) return "Poor";
    if (v < 60) return "Moderate";
    if (v < 80) return "Good";
    return "Excellent";
  }
  function priorityColor(v) {
    if (v < 33) return "#3FA796";   // Low priority
    if (v < 66) return "#E8A33D";   // Medium priority
    return "#D7263D";               // High priority
  }
  function priorityLabel(v) {
    if (v < 33) return "Low Priority";
    if (v < 66) return "Medium Priority";
    return "High Priority";
  }

  function themeColor(props) {
    return currentTheme === "accessibility"
      ? accessibilityColor(props.accessibility_index)
      : priorityColor(props.priority_index);
  }

  // -------------------------------------------------------------
  // GN DIVISION LAYER
  // -------------------------------------------------------------
 function styleForCurrentTheme(feature) {
  const props = feature.properties || {};
  const value = currentTheme === 'accessibility'
    ? props[FIELD.accessibility]
    : props[FIELD.priority];

  const info = currentTheme === 'accessibility'
    ? getAccessibilityStyle(value)
    : getPriorityStyle(value);

  return {
    fillColor: info.color,
    color: '#ffffff',
    weight: 1,
    fillOpacity: 0.78,
    opacity: 1
  };
}

function buildGnPopupHtml(props) {
  const accInfo = getAccessibilityStyle(props[FIELD.accessibility]);
  const priInfo = getPriorityStyle(props[FIELD.priority]);
  return `
    <div class="popup-title">${props[FIELD.name] ?? 'Unnamed GN Division'}</div>
    <div class="popup-row"><span class="k">Population</span><span class="v">${fmtNumber(props[FIELD.population], 0)}</span></div>
    <div class="popup-row"><span class="k">Accessibility Index</span><span class="v">${fmtNumber(props[FIELD.accessibility])}</span></div>
    <div class="popup-row"><span class="k">Priority Index</span><span class="v">${fmtNumber(props[FIELD.priority])}</span></div>
    <span class="info-badge" style="background:${accInfo.color}">${accInfo.label}</span>
    <span class="info-badge" style="background:${priInfo.color}">${priInfo.label}</span>
  `;
}

function updateInfoPanel(props) {
  const accInfo = getAccessibilityStyle(props[FIELD.accessibility]);
  const priInfo = getPriorityStyle(props[FIELD.priority]);
  document.getElementById('infoBody').innerHTML = `
    <div class="info-row"><span class="k">GN Name</span><span class="v">${props[FIELD.name] ?? 'N/A'}</span></div>
    <div class="info-row"><span class="k">Population</span><span class="v">${fmtNumber(props[FIELD.population], 0)}</span></div>
    <div class="info-row"><span class="k">Accessibility Index</span><span class="v">${fmtNumber(props[FIELD.accessibility])}</span></div>
    <div class="info-row"><span class="k">Priority Index</span><span class="v">${fmtNumber(props[FIELD.priority])}</span></div>
    <span class="info-badge" style="background:${accInfo.color}">${accInfo.label}</span>
    <span class="info-badge" style="background:${priInfo.color}">${priInfo.label}</span>
  `;
}

function onEachGnFeature(feature, layer) {
  layer.bindPopup(buildGnPopupHtml(feature.properties || {}));

  layer.on({
    mouseover: (e) => {
      const l = e.target;
      l.setStyle({ weight: 3, color: '#10233f', fillOpacity: 0.9 });
      l.bringToFront();
      updateInfoPanel(feature.properties || {});
    },
    mouseout: (e) => {
      if (selectedLayer !== e.target) {
        gnLayer.resetStyle(e.target);
      }
    },
    click: (e) => {
      if (selectedLayer) gnLayer.resetStyle(selectedLayer);
      selectedLayer = e.target;
      selectedLayer.setStyle({ weight: 3, color: '#10233f', fillOpacity: 0.9 });
      map.fitBounds(e.target.getBounds(), { maxZoom: 15 });
      updateInfoPanel(feature.properties || {});
    }
  });
}

function loadGnLayer(geojson) {
  allGnFeatures = geojson.features || [];

  // Compute classification breaks once, from the full dataset
  const accValues = allGnFeatures.map(f => f.properties?.[FIELD.accessibility]);
  const priValues = allGnFeatures.map(f => f.properties?.[FIELD.priority]);
  accBreaks = computeQuantileBreaks(accValues, ACCESSIBILITY_CLASSES.length);
  priBreaks = computeQuantileBreaks(priValues, PRIORITY_CLASSES.length);

  gnLayer = L.geoJSON(geojson, {
    style: styleForCurrentTheme,
    onEachFeature: onEachGnFeature
  }).addTo(map);

  // Average accessibility index for the dashboard
  const validAcc = accValues.filter(v => typeof v === 'number' && !isNaN(v));
  const avgAcc = validAcc.length ? validAcc.reduce((a, b) => a + b, 0) / validAcc.length : NaN;
  document.getElementById('statAvgAccessibility').textContent = fmtNumber(avgAcc);

  renderLegend();
  map.fitBounds(gnLayer.getBounds(), { padding: [20, 20] });
}

  // -------------------------------------------------------------
  // LEGEND
  // -------------------------------------------------------------
  function renderLegend() {
  const title = document.getElementById('legendTitle');
  const body = document.getElementById('legendBody');
  body.innerHTML = '';

  const classes = currentTheme === 'accessibility' ? ACCESSIBILITY_CLASSES : PRIORITY_CLASSES;
  title.textContent = currentTheme === 'accessibility'
    ? 'Legend — Accessibility Index'
    : 'Legend — Priority Areas';

  classes.forEach(c => {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `<span class="legend-swatch" style="background:${c.color}"></span><span>${c.label}</span>`;
    body.appendChild(row);
  });

  const note = document.createElement('div');
  note.className = 'legend-note';
  note.textContent = currentTheme === 'accessibility'
    ? 'Classes derived from quantiles of accessibility_index across all GN Divisions.'
    : 'Classes derived from quantiles of priority_index across all GN Divisions.';
  body.appendChild(note);
}


  // -------------------------------------------------------------
  // SERVICE POINT LAYERS
  // -------------------------------------------------------------
  function makeServiceIcon(layerKey) {
  const s = SERVICE_STYLE[layerKey];
  return L.divIcon({
    className: 'service-marker',
    html: `<div style="
        background:${s.color};
        width:22px;height:22px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:12px;font-weight:700;
        border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);
      ">${s.glyph}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
}

function buildServicePopupHtml(layerKey, props) {
  const s = SERVICE_STYLE[layerKey];
  const name = props.name || props.NAME || props.Name || s.label;
  let rows = '';
  Object.entries(props || {}).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') return;
    rows += `<div class="popup-row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  });
  return `
    <div class="popup-title">${name}</div>
    ${rows || '<p style="color:#647089;font-size:12px;margin:0;">No additional attributes.</p>'}
    <span class="info-badge" style="background:${s.color}">${s.label}</span>
  `;
}

function loadServiceLayer(layerKey, geojson) {
  const group = L.layerGroup();

  const features = geojson.features || [];
  features.forEach(feature => {
    if (!feature.geometry) return;
    const coordsHandler = (latlng) => L.marker(latlng, { icon: makeServiceIcon(layerKey) });
    const layer = L.geoJSON(feature, { pointToLayer: (f, latlng) => coordsHandler(latlng) });
    layer.eachLayer(l => {
      l.bindPopup(buildServicePopupHtml(layerKey, feature.properties || {}));
      group.addLayer(l);
    });
  });

  serviceLayers[layerKey] = group;
  serviceCounts[layerKey] = features.length;
  group.addTo(map);

  // Update sidebar counters + dashboard stats
  const countEl = document.getElementById(`count-${layerKey}`);
  if (countEl) countEl.textContent = features.length;
  const statEl = document.getElementById(`stat${layerKey}`);
  if (statEl) statEl.textContent = features.length;
}

// Checkbox toggling for each service layer
document.querySelectorAll('#serviceLayerList input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const key = cb.dataset.layer;
    const layer = serviceLayers[key];
    if (!layer) return;
    if (cb.checked) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  });
});

/* -------------------------------------------------------------------------
   8. SEARCH (GN Division by name)
   ------------------------------------------------------------------------- */
const searchInput = document.getElementById('gnSearchInput');
const suggestionsBox = document.getElementById('searchSuggestions');

function renderSuggestions(matches) {
  suggestionsBox.innerHTML = '';
  if (matches.length === 0) {
    suggestionsBox.innerHTML = '<div class="no-results">No matching GN Division</div>';
    suggestionsBox.hidden = false;
    return;
  }
  matches.slice(0, 8).forEach(feature => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = feature.properties[FIELD.name];
    btn.addEventListener('click', () => selectSearchResult(feature));
    suggestionsBox.appendChild(btn);
  });
  suggestionsBox.hidden = false;
}

function selectSearchResult(feature) {
  suggestionsBox.hidden = true;
  searchInput.value = feature.properties[FIELD.name];

  if (!gnLayer) return;
  gnLayer.eachLayer(layer => {
    if (layer.feature === feature) {
      if (selectedLayer) gnLayer.resetStyle(selectedLayer);
      selectedLayer = layer;
      layer.setStyle({ weight: 3, color: '#10233f', fillOpacity: 0.9 });
      map.fitBounds(layer.getBounds(), { maxZoom: 15 });
      layer.openPopup();
      updateInfoPanel(feature.properties || {});
    }
  });
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length === 0) {
    suggestionsBox.hidden = true;
    return;
  }
  const matches = allGnFeatures.filter(f =>
    (f.properties?.[FIELD.name] || '').toLowerCase().includes(q)
  );
  renderSuggestions(matches);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) suggestionsBox.hidden = true;
});


  // -------------------------------------------------------------
  // DASHBOARD STATISTICS
  // -------------------------------------------------------------
  function renderStats() {
    const grid = document.getElementById("statsGrid");
    const counts = Object.fromEntries(
      Object.keys(SERVICE_META).map(k => [k, serviceLayers[k]?.count ?? 0])
    );

    let avgAccess = "—";
    if (gnByName.size) {
      let sum = 0, n = 0;
      gnByName.forEach(layer => { sum += layer.feature.properties.accessibility_index; n++; });
      avgAccess = (sum / n).toFixed(1);
    }

    const cards = [
      ["Total Hospitals", counts.hospitals],
      ["Total Schools", counts.schools],
      ["Total Banks", counts.banks],
      ["Total Parks", counts.parks],
      ["Total Bus Stops", counts.busstops],
      ["Avg. Accessibility Index", avgAccess],
    ];

    grid.innerHTML = cards.map(([label, value], i) => `
      <div class="stat-card ${i === cards.length - 1 ? 'wide' : ''}">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    `).join("");
  }

  // -------------------------------------------------------------
  // THEME SWITCHER
  // -------------------------------------------------------------
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      currentTheme = btn.dataset.theme;
      repaintGnLayer();
      renderLegend();
    });
  });

  // -------------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------------
  function doSearch() {
    const val = document.getElementById("gnSearchInput").value.trim();
    if (!val) return;
    // exact match first, then case-insensitive partial match
    let layer = gnByName.get(val);
    if (!layer) {
      const match = [...gnByName.keys()].find(
        name => name.toLowerCase() === val.toLowerCase() || name.toLowerCase().includes(val.toLowerCase())
      );
      if (match) layer = gnByName.get(match);
    }
    if (!layer) {
      alert("GN Division not found. Try selecting a suggestion from the list.");
      return;
    }
    map.fitBounds(layer.getBounds(), { maxZoom: 14 });
    highlightLayer(layer);
    updateGnInfoPanel(layer.feature.properties);
    layer.openPopup();
  }
  document.getElementById("gnSearchBtn").addEventListener("click", doSearch);
  document.getElementById("gnSearchInput").addEventListener("keydown", e => {
    if (e.key === "Enter") doSearch();
  });

  // -------------------------------------------------------------
  // MOBILE SIDEBAR TOGGLES
  // -------------------------------------------------------------
  const leftSidebar = document.getElementById("sidebarLeft");
  const rightSidebar = document.getElementById("sidebarRight");
  document.getElementById("mobileLeftToggle").addEventListener("click", () => {
    rightSidebar.classList.remove("open");
    leftSidebar.classList.toggle("open");
  });
  document.getElementById("mobileRightToggle").addEventListener("click", () => {
    leftSidebar.classList.remove("open");
    rightSidebar.classList.toggle("open");
  });

  // -------------------------------------------------------------
  // COMMUNITY FEEDBACK — LOCATION PICKER
  // -------------------------------------------------------------
  const pickBtn = document.getElementById("pickLocationBtn");
  const pickBanner = document.getElementById("pickLocationBanner");
  const cancelPickBtn = document.getElementById("cancelPickBtn");
  const locationInput = document.getElementById("fLocation");

  function enterPickMode() {
    pickModeActive = true;
    pickBanner.classList.remove("hidden");
    map.getContainer().style.cursor = "crosshair";
  }
  function exitPickMode() {
    pickModeActive = false;
    pickBanner.classList.add("hidden");
    map.getContainer().style.cursor = "";
  }
  pickBtn.addEventListener("click", enterPickMode);
  cancelPickBtn.addEventListener("click", exitPickMode);

  map.on("click", e => {
    if (!pickModeActive) return;
    const { lat, lng } = e.latlng;
    locationInput.value = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    exitPickMode();
    L.circleMarker(e.latlng, {
      radius: 6, color: "#E8A33D", weight: 2, fillColor: "#E8A33D", fillOpacity: 0.9,
    }).addTo(map).bindPopup("Selected feedback location").openPopup();
  });

  // -------------------------------------------------------------
  // COMMUNITY FEEDBACK — SUBMIT TO GOOGLE FORM
  // -------------------------------------------------------------
  const form = document.getElementById("feedbackForm");
  const formMsg = document.getElementById("formMsg");
  const submitBtn = document.getElementById("submitFeedbackBtn");

  form.addEventListener("submit", e => {
    e.preventDefault();

    const gn = document.getElementById("fGn").value.trim();
    const service = document.getElementById("fService").value;
    const issue = document.getElementById("fIssue").value;
    const description = document.getElementById("fDesc").value.trim();
    const location = locationInput.value.trim();

    if (!location) {
      showFormMsg("Please select a location on the map before submitting.", "error");
      return;
    }

    const entries = CONFIG.GOOGLE_FORM_ENTRIES;
    const params = new URLSearchParams();
    params.append(entries.gnDivision, gn);
    params.append(entries.serviceType, service);
    params.append(entries.issueCategory, issue);
    params.append(entries.description, description);
    params.append(entries.location, location);

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    // Google Forms does not support CORS, so the request is sent in
    // "no-cors" mode. The browser cannot read the response, but the
    // submission itself still reaches the Form / Sheet.
    fetch(CONFIG.GOOGLE_FORM_ACTION_URL, {
      method: "POST",
      mode: "no-cors",
      body: params,
    })
      .then(() => {
        showFormMsg("Feedback submitted successfully.", "success");
        addOptimisticCard({ gn, service, issue, description, location });
        form.reset();
        locationInput.value = "";
        // Give Google Sheets a moment to receive the row, then reconcile
        // the optimistic entry with the real data from Apps Script.
        setTimeout(fetchFeedback, 4000);
      })
      .catch(() => {
        showFormMsg("Could not reach the Google Form. Check your connection and try again.", "error");
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Feedback";
      });
  });

  function showFormMsg(text, type) {
    formMsg.textContent = text;
    formMsg.className = `form-msg ${type}`;
  }

  // -------------------------------------------------------------
  // COMMUNITY FEEDBACK — RECENT LIST + MAP MARKERS
  // -------------------------------------------------------------
  const cardsContainer = document.getElementById("feedbackCards");
  const feedbackMarkerGroup = L.layerGroup().addTo(map);

  function addOptimisticCard(entry) {
    const id = `local-${Date.now()}`;
    const item = {
      id,
      gn: entry.gn,
      service: entry.service,
      issue: entry.issue,
      description: entry.description,
      location: entry.location,
      timestamp: new Date().toISOString(),
      _optimistic: true,
    };
    feedbackData.unshift(item);
    renderFeedback();
  }

  function feedbackIcon(service) {
    const color = FEEDBACK_SERVICE_COLOR[service] || "#3FA796";
    return L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #0A1420;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 16],
    });
  }

  function formatTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString("en-GB", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  function renderFeedback() {
    // sort newest first
    feedbackData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (!feedbackData.length) {
      cardsContainer.innerHTML = `<div class="fc-empty">No feedback submitted yet. Be the first to report an issue.</div>`;
    } else {
      cardsContainer.innerHTML = feedbackData.map(item => `
        <div class="feedback-card" data-id="${item.id}">
          <div class="fc-row">📍 <b>GN Division:</b>&nbsp;${escapeHtml(item.gn)}</div>
          <div class="fc-row">🔧 <b>Service:</b>&nbsp;${escapeHtml(item.service)}</div>
          <div class="fc-row">⚠ <b>Issue Category:</b>&nbsp;${escapeHtml(item.issue)}</div>
          <div class="fc-row fc-desc">📝 “${escapeHtml(item.description)}”</div>
          <div class="fc-row">📌 <b>Location:</b>&nbsp;${escapeHtml(item.location)}</div>
          <div class="fc-time">🕒 ${formatTime(item.timestamp)}</div>
        </div>
      `).join("");
    }

    // (re)build markers
    feedbackMarkerGroup.clearLayers();
    feedbackMarkersById.clear();
    feedbackData.forEach(item => {
      const coords = parseLocation(item.location);
      if (!coords) return;
      const marker = L.marker(coords, { icon: feedbackIcon(item.service) });
      marker.bindPopup(`
        <div class="popup-title">${escapeHtml(item.service)} Feedback</div>
        <div class="popup-row"><span>GN Division</span><b>${escapeHtml(item.gn)}</b></div>
        <div class="popup-row"><span>Issue</span><b>${escapeHtml(item.issue)}</b></div>
        <div class="popup-row"><span>Description</span><b>${escapeHtml(item.description)}</b></div>
        <div class="popup-row"><span>Submitted</span><b>${formatTime(item.timestamp)}</b></div>
      `);
      marker.on("click", () => highlightCard(item.id));
      feedbackMarkerGroup.addLayer(marker);
      feedbackMarkersById.set(item.id, marker);
    });

    wireCardClicks();
  }

  function parseLocation(loc) {
    if (!loc) return null;
    const parts = loc.split(",").map(s => parseFloat(s.trim()));
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return parts;
  }

  function wireCardClicks() {
    cardsContainer.querySelectorAll(".feedback-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const marker = feedbackMarkersById.get(id);
        if (!marker) return;
        map.setView(marker.getLatLng(), 15, { animate: true });
        marker.openPopup();
        highlightCard(id);
      });
    });
  }

  function highlightCard(id) {
    cardsContainer.querySelectorAll(".feedback-card").forEach(c => c.classList.remove("highlight"));
    const card = cardsContainer.querySelector(`.feedback-card[data-id="${id}"]`);
    if (card) {
      card.classList.add("highlight");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[s]));
  }

  // -------------------------------------------------------------
  // FETCH LIVE FEEDBACK FROM APPS SCRIPT
  // -------------------------------------------------------------
  const refreshBtn = document.getElementById("refreshFeedbackBtn");

  function fetchFeedback() {
    if (!CONFIG.APPS_SCRIPT_API_URL || CONFIG.APPS_SCRIPT_API_URL.startsWith("PASTE_")) {
      // No live backend configured yet — keep whatever is in memory
      // (e.g. optimistic local submissions) and let the user know once.
      return;
    }
    refreshBtn.classList.add("spinning");
    fetch(CONFIG.APPS_SCRIPT_API_URL)
      .then(r => r.json())
      .then(rows => {
        // Expecting an array of objects with keys matching the Sheet's
        // columns — see APPS_SCRIPT_SETUP.md for the exact shape.
        const remote = rows.map((r, i) => ({
          id: r.id || `remote-${r.timestamp || i}`,
          gn: r.gnDivision ?? r["GN Division"] ?? "",
          service: r.serviceType ?? r["Service Type"] ?? "",
          issue: r.issueCategory ?? r["Issue Category"] ?? "",
          description: r.description ?? r["Describe the Issue"] ?? "",
          location: r.location ?? r["Location"] ?? "",
          timestamp: r.timestamp ?? r["Timestamp"] ?? new Date().toISOString(),
        }));
        // drop optimistic local entries once real data arrives
        feedbackData = remote;
        renderFeedback();
      })
      .catch(() => {
        showFormMsg("Could not load live feedback from the Apps Script API.", "error");
      })
      .finally(() => refreshBtn.classList.remove("spinning"));
  }

  refreshBtn.addEventListener("click", fetchFeedback);

  // -------------------------------------------------------------
  // BOOTSTRAP
  // -------------------------------------------------------------
  Promise.all([loadGnDivisions(), loadAllServiceLayers()]).then(() => {
    wireLayerToggles();
    renderStats();
    renderFeedback();
    fetchFeedback();
    if (CONFIG.AUTO_REFRESH_MS) {
      setInterval(fetchFeedback, CONFIG.AUTO_REFRESH_MS);
    }
  });

})();
