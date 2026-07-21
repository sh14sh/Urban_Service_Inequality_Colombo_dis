/* =========================================================================
   Urban Service Community Feedback Mapping
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. CONFIG
   ------------------------------------------------------------------------- */

// Your Google Form submission endpoint + entry IDs, exactly as provided.
//
// NOTE: "serviceType" and "issueCategory" both point to entry.1615350334.
// Two different Form questions cannot share one entry ID — whichever value
// is appended second in the POST body will overwrite the first in your
// Sheet. Please open your Form's "Get pre-filled link" and re-check the
// entry ID for the Issue Category question; update it below once confirmed.
const GOOGLE_FORM_CONFIG = {
  formActionUrl: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSdhZqHQnwJ_VTmfngSdNurf_MrFFtjjBOGGgv1d6SAezps2fw/formResponse',
  entries: {
    gnDivision:    'entry.323032994',
    serviceType:   'entry.1615350334',
    issueCategory: 'entry.1615350334', // TODO: verify — likely needs its own ID
    description:   'entry.283401894',
    location:      'entry.1312166089'
  }
};

// TODO: paste your published Google Apps Script Web App URL here (ends in /exec)
const APPS_SCRIPT_CONFIG = {
  url: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  refreshIntervalMs: 30000
};

const SERVICE_STYLE = {
  'Hospital':  { color: '#d7304a', glyph: 'H' },
  'School':    { color: '#2f6fed', glyph: 'S' },
  'Bank':      { color: '#e0b400', glyph: 'B' },
  'Park':      { color: '#2f9e6b', glyph: 'P' },
  'Bus Stop':  { color: '#8452d5', glyph: 'BS' }
};

const MAP_CENTER = [6.8649, 79.8997]; // Colombo District, Sri Lanka
const MAP_ZOOM = 12;

/* -------------------------------------------------------------------------
   2. MAP SETUP
   ------------------------------------------------------------------------- */
const map = L.map('map', { zoomControl: true }).setView(MAP_CENTER, MAP_ZOOM);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const feedbackMarkersLayer = L.layerGroup().addTo(map);

function setMapStatus(message, autoHide = true) {
  const el = document.getElementById('mapStatus');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  if (autoHide) {
    clearTimeout(setMapStatus._t);
    setMapStatus._t = setTimeout(() => el.classList.add('hidden'), 3200);
  }
}

/* -------------------------------------------------------------------------
   3. "SELECT LOCATION" WORKFLOW
   ------------------------------------------------------------------------- */
let isSelectingLocation = false;
let selectedLatLng = null;
let selectionMarker = null;

const selectLocationBtn = document.getElementById('fbSelectLocationBtn');
const locationInput = document.getElementById('fbLocation');
const mapEl = document.getElementById('map');

selectLocationBtn.addEventListener('click', () => {
  isSelectingLocation = true;
  selectLocationBtn.classList.add('selecting');
  selectLocationBtn.textContent = '📍 Click on the map…';
  mapEl.classList.add('selecting-location');
  setMapStatus('Click anywhere on the map to set the location.', false);
});

map.on('click', (e) => {
  if (!isSelectingLocation) return;

  selectedLatLng = e.latlng;
  locationInput.value = `${e.latlng.lat.toFixed(5)},${e.latlng.lng.toFixed(5)}`;

  if (selectionMarker) {
    selectionMarker.setLatLng(e.latlng);
  } else {
    selectionMarker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#d7304a;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(map);
  }

  isSelectingLocation = false;
  selectLocationBtn.classList.remove('selecting');
  selectLocationBtn.classList.add('pinned');
  selectLocationBtn.textContent = '📍 Location Selected';
  mapEl.classList.remove('selecting-location');
  setMapStatus('Location set ✓', true);
});

function resetLocationSelection() {
  selectedLatLng = null;
  locationInput.value = '';
  selectLocationBtn.classList.remove('pinned', 'selecting');
  selectLocationBtn.textContent = '📍 Select Location';
  if (selectionMarker) {
    map.removeLayer(selectionMarker);
    selectionMarker = null;
  }
}

/* -------------------------------------------------------------------------
   4. SUBMIT TO GOOGLE FORM
   ------------------------------------------------------------------------- */

// Submits via a hidden iframe so the page never navigates away. Because the
// response is cross-origin, the browser can't read back a success/failure
// status (a known limitation of the no-backend Google Forms approach) — the
// data still reaches your Sheet as long as the URL + entry IDs are correct.
function submitToGoogleForm(payload) {
  let iframe = document.getElementById('hiddenFormFrame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.name = 'hiddenFormFrame';
    iframe.id = 'hiddenFormFrame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }

  const form = document.createElement('form');
  form.action = GOOGLE_FORM_CONFIG.formActionUrl;
  form.method = 'POST';
  form.target = 'hiddenFormFrame';

  const fields = {
    [GOOGLE_FORM_CONFIG.entries.gnDivision]: payload.gnDivision,
    [GOOGLE_FORM_CONFIG.entries.serviceType]: payload.serviceType,
    [GOOGLE_FORM_CONFIG.entries.issueCategory]: payload.issueCategory,
    [GOOGLE_FORM_CONFIG.entries.description]: payload.description,
    [GOOGLE_FORM_CONFIG.entries.location]: payload.location
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/* -------------------------------------------------------------------------
   5. SUBMIT BUTTON HANDLER
   ------------------------------------------------------------------------- */
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
const successMsg = document.getElementById('fbSuccessMsg');
const errorMsg = document.getElementById('fbErrorMsg');

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
  successMsg.classList.add('hidden');
}
function showSuccess() {
  successMsg.classList.remove('hidden');
  errorMsg.classList.add('hidden');
  setTimeout(() => successMsg.classList.add('hidden'), 4000);
}

submitFeedbackBtn.addEventListener('click', () => {
  const gnInput = document.getElementById('fbGnDivision');
  const serviceSelect = document.getElementById('fbServiceType');
  const categorySelect = document.getElementById('fbIssueCategory');
  const descriptionInput = document.getElementById('fbDescription');

  const gnDivision = gnInput.value.trim();
  const description = descriptionInput.value.trim();

  // Validate all fields
  if (!gnDivision) { gnInput.focus(); showError('Please enter a GN Division.'); return; }
  if (!description) { descriptionInput.focus(); showError('Please describe the issue.'); return; }
  if (!selectedLatLng) { showError('Please select a location on the map.'); return; }

  submitToGoogleForm({
    gnDivision,
    serviceType: serviceSelect.value,
    issueCategory: categorySelect.value,
    description,
    location: locationInput.value
  });

  // Reset the form
  gnInput.value = '';
  descriptionInput.value = '';
  serviceSelect.selectedIndex = 0;
  categorySelect.selectedIndex = 0;
  resetLocationSelection();

  showSuccess();

  // Google Forms/Sheets needs a moment to write the row before we re-poll.
  setTimeout(() => fetchLiveFeedback(), 4000);
});

/* -------------------------------------------------------------------------
   6. LIVE DATA — fetch from the published Apps Script Web App
   ------------------------------------------------------------------------- */
let FEEDBACK_ITEMS = [];      // normalized items, newest first
let markersById = {};         // { itemId: L.marker }
let activeItemId = null;
let autoRefreshTimer = null;
let isFetching = false;

// Tries several likely header spellings so this works whether your Apps
// Script echoes back the exact Form question titles or a cleaned-up key.
const FIELD_ALIASES = {
  gnDivision:    ['GN Division', 'gnDivision'],
  serviceType:   ['Service Type', 'serviceType'],
  issueCategory: ['Issue Category', 'issueCategory'],
  description:   ['Describe the Issue', 'Description', 'description'],
  location:      ['Location', 'location'],
  timestamp:     ['Timestamp', 'timestamp', 'Date']
};

function pick(row, aliasKey) {
  for (const key of FIELD_ALIASES[aliasKey] || []) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return '';
}

function parseRow(row, index) {
  const rawLocation = String(pick(row, 'location') || '');
  const [latStr, lngStr] = rawLocation.split(',').map(s => (s || '').trim());
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  const rawTimestamp = pick(row, 'timestamp');
  const parsedDate = rawTimestamp ? new Date(rawTimestamp) : null;
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

  return {
    id: `fb-${index}-${rawTimestamp || ''}`,
    gnDivision: String(pick(row, 'gnDivision') || 'Unspecified'),
    service: String(pick(row, 'serviceType') || 'Hospital'),
    issueCategory: String(pick(row, 'issueCategory') || 'Other'),
    description: String(pick(row, 'description') || ''),
    lat: isNaN(lat) ? null : lat,
    lng: isNaN(lng) ? null : lng,
    locationLabel: rawLocation || 'Not specified',
    date: validDate,
    dateLabel: validDate
      ? validDate.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'Unknown time'
  };
}

async function fetchLiveFeedback() {
  if (APPS_SCRIPT_CONFIG.url.includes('YOUR_DEPLOYMENT_ID')) {
    renderListStatus('Live feed not connected yet — paste your Apps Script Web App URL into APPS_SCRIPT_CONFIG.url in script.js.', true);
    return;
  }
  if (isFetching) return;
  isFetching = true;

  const refreshBtn = document.getElementById('refreshFeedbackBtn');
  if (refreshBtn) refreshBtn.classList.add('is-spinning');

  try {
    const res = await fetch(APPS_SCRIPT_CONFIG.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.reports || data.data || []);

    FEEDBACK_ITEMS = rows
      .map((row, i) => parseRow(row, i))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    const stamp = document.getElementById('lastUpdated');
    if (stamp) stamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

    rebuildMarkers();
    renderCards(FEEDBACK_ITEMS);
  } catch (err) {
    console.error('Live feedback fetch failed:', err);
    renderListStatus('Could not load submitted feedback. Check the Apps Script URL and that it is deployed for "Anyone" access.', true);
  } finally {
    isFetching = false;
    if (refreshBtn) setTimeout(() => refreshBtn.classList.remove('is-spinning'), 400);
  }
}

/* -------------------------------------------------------------------------
   7. DASHBOARD CARDS
   ------------------------------------------------------------------------- */
function renderListStatus(message, isError = false) {
  const list = document.getElementById('feedbackList');
  if (!list) return;
  list.innerHTML = `<p class="empty-note${isError ? ' is-error' : ''}">${message}</p>`;
}

function buildCardHtml(item) {
  const style = SERVICE_STYLE[item.service] || { color: '#647089', glyph: '?' };
  const isActive = item.id === activeItemId;

  return `
    <div class="feedback-card${isActive ? ' is-active' : ''}" data-item-id="${item.id}" style="border-left-color:${style.color}">
      <div class="feedback-card-icon" style="background:${style.color}">${style.glyph}</div>
      <div class="feedback-card-body">
        <div class="fc-gn-row">
          <span class="fc-field-icon">📍</span>
          <span class="fc-gn" style="color:${style.color}">${item.gnDivision}</span>
        </div>
        <div class="fc-field">
          <span class="fc-field-icon">🔧</span>
          <span class="fc-field-label">Service:</span>
          <span class="fc-field-value">${item.service}</span>
        </div>
        <div class="fc-field">
          <span class="fc-field-icon">⚠</span>
          <span class="fc-field-label">Issue:</span>
          <span class="fc-field-value">${item.issueCategory}</span>
        </div>
        <div class="fc-desc-row">
          <span class="fc-field-icon">📝</span>
          <span>&ldquo;${item.description || 'No description provided.'}&rdquo;</span>
        </div>
        <div class="fc-field">
          <span class="fc-field-icon">📌</span>
          <span class="fc-field-label">Location:</span>
          <span class="fc-field-value">${item.locationLabel}</span>
        </div>
        <div class="fc-time-row">
          <span class="fc-field-icon">🕒</span>
          <span>${item.dateLabel}</span>
        </div>
      </div>
    </div>
  `;
}

function renderCards(items) {
  const list = document.getElementById('feedbackList');
  if (!list) return;

  if (items.length === 0) {
    renderListStatus('No feedback submitted yet. Submitted issues will appear here automatically.');
    return;
  }

  list.innerHTML = items.map(buildCardHtml).join('');

  list.querySelectorAll('.feedback-card').forEach(card => {
    card.addEventListener('click', () => {
      selectItem(card.dataset.itemId, { panTo: true, scrollCard: false });
    });
  });
}

/* -------------------------------------------------------------------------
   8. MAP MARKERS
   ------------------------------------------------------------------------- */
function makePinIcon(serviceKey, active = false) {
  const style = SERVICE_STYLE[serviceKey] || { color: '#647089', glyph: '?' };
  const svg = `
    <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${style.color}" stroke="#fff" stroke-width="2"/>
      <circle cx="13" cy="13" r="7.5" fill="#fff" opacity="0.92"/>
      <text x="13" y="17" text-anchor="middle" font-size="9.5" font-weight="700" font-family="Inter, sans-serif" fill="${style.color}">${style.glyph}</text>
    </svg>`;
  return L.divIcon({
    className: `feedback-marker-pin${active ? ' is-active' : ''}`,
    html: svg,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30]
  });
}

function buildPopupHtml(item) {
  const style = SERVICE_STYLE[item.service] || { color: '#647089' };
  return `
    <div class="popup-title">${item.gnDivision}</div>
    <div class="popup-row"><span class="k">Service</span><span class="v">${item.service}</span></div>
    <div class="popup-row"><span class="k">Issue</span><span class="v">${item.issueCategory}</span></div>
    <div class="popup-row"><span class="k">Coordinates</span><span class="v">${item.locationLabel}</span></div>
    <div class="popup-row"><span class="k">Submitted</span><span class="v">${item.dateLabel}</span></div>
    <p style="margin:8px 0 0;font-size:12.5px;color:#647089;">${item.description || ''}</p>
  `;
}

function rebuildMarkers() {
  feedbackMarkersLayer.clearLayers();
  markersById = {};

  FEEDBACK_ITEMS.forEach(item => {
    if (item.lat === null || item.lng === null) return;

    const marker = L.marker([item.lat, item.lng], {
      icon: makePinIcon(item.service, item.id === activeItemId)
    });
    marker.bindPopup(buildPopupHtml(item));
    marker.on('click', () => {
      selectItem(item.id, { panTo: false, scrollCard: true });
      marker.openPopup();
    });

    markersById[item.id] = marker;
    feedbackMarkersLayer.addLayer(marker);
  });
}

/* -------------------------------------------------------------------------
   9. DASHBOARD <-> MAP SYNC
   ------------------------------------------------------------------------- */
function selectItem(itemId, { panTo = false, scrollCard = false } = {}) {
  activeItemId = itemId;
  const item = FEEDBACK_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  document.querySelectorAll('.feedback-card').forEach(card => {
    card.classList.toggle('is-active', card.dataset.itemId === itemId);
  });

  Object.entries(markersById).forEach(([id, marker]) => {
    marker.setIcon(makePinIcon(
      FEEDBACK_ITEMS.find(i => i.id === id)?.service,
      id === itemId
    ));
  });

  const marker = markersById[itemId];
  if (marker) {
    if (panTo && item.lat !== null && item.lng !== null) {
      map.flyTo([item.lat, item.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
    marker.openPopup();
  }

  if (scrollCard) {
    const cardEl = document.querySelector(`.feedback-card[data-item-id="${itemId}"]`);
    if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* -------------------------------------------------------------------------
   10. REFRESH CONTROLS
   ------------------------------------------------------------------------- */
const refreshFeedbackBtn = document.getElementById('refreshFeedbackBtn');
refreshFeedbackBtn.addEventListener('click', () => fetchLiveFeedback());

const autoRefreshToggle = document.getElementById('autoRefreshToggle');
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => fetchLiveFeedback(), APPS_SCRIPT_CONFIG.refreshIntervalMs);
}
function stopAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = null;
}
autoRefreshToggle.addEventListener('change', () => {
  if (autoRefreshToggle.checked) startAutoRefresh();
  else stopAutoRefresh();
});

/* -------------------------------------------------------------------------
   11. INIT
   ------------------------------------------------------------------------- */
fetchLiveFeedback();
startAutoRefresh();
