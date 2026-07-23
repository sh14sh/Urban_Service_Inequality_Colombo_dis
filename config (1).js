/* =====================================================================
   CONFIGURATION — paste your own IDs/URLs here.
   This file is intentionally separate from script.js so you never have
   to touch the application logic when connecting your own Google Sheet.

   CHANGED: feedback submissions now go straight to APPS_SCRIPT_API_URL
   (via doPost in Code.gs), not to the Google Form below. This was
   changed because Google Forms' multiple-choice fields (Service Type,
   Issue Category) strictly validate submitted values against the
   Form's exact predefined choices — any mismatch silently drops the
   submission with no error, which is what was happening before. Writing
   straight to the Sheet through Apps Script avoids that validation
   entirely, so every submission reliably saves for every visitor.

   The only thing you MUST set below now is #3, APPS_SCRIPT_API_URL.
   GOOGLE_FORM_ACTION_URL / GOOGLE_FORM_ENTRIES are kept here in case you
   still want the standalone Google Form as an alternate way for people
   to submit (e.g. shared as a link outside the map), but the map itself
   no longer depends on them.
   ===================================================================== */

const CONFIG = {

  // 1) (Optional, no longer used by the map's submit button) Google Form
  //    "formResponse" submission URL — kept only if you still want the
  //    standalone Form as an alternate entry point.
  GOOGLE_FORM_ACTION_URL:
    "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdhZqHQnwJ_VTmfngSdNurf_MrFFtjjBOGGgv1d6SAezps2fw/formResponse",

  // 2) (Optional, no longer used by the map's submit button) Entry IDs
  //    for the standalone Google Form, if you keep using it separately.
  GOOGLE_FORM_ENTRIES: {
    gnDivision:  "entry.323032994",
    serviceType: "entry.1615350334",
    issueCategory: "entry.1615350334", // NOTE: same entry ID as Service Type
                                        // in the brief supplied — if this is
                                        // not intentional, update the Issue
                                        // Category entry ID from your form.
    description: "entry.283401894",
    location:    "entry.1312166089",
  },

  // 3) REQUIRED — Google Apps Script Web App URL (deployed from the
  //    Google Sheet you want feedback stored in). The map now uses this
  //    for BOTH reading the feedback list (doGet) AND submitting new
  //    feedback (doPost) — see Code.gs.
  //    See APPS_SCRIPT_SETUP.md for step-by-step deployment instructions.
  //    Paste the URL Google gives you after deployment below, e.g.:
  //    "https://script.google.com/macros/s/AKfycb.../exec"
  APPS_SCRIPT_API_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",

  // How often (ms) to auto-refresh the Recent Feedback list.
  AUTO_REFRESH_MS: 30000,
};
