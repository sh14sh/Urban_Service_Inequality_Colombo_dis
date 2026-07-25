/* =====================================================================
   CONFIGURATION — paste your own IDs/URLs here.
   This file is intentionally separate from script.js so you never have
   to touch the application logic when connecting your own Google Form
   and Google Sheet.

   CHANGED: the right sidebar no longer embeds the feedback form inline.
   Instead, a "Click for Feedback" button opens your real Google Form in
   a new tab (GOOGLE_FORM_VIEW_URL below) — so people fill it out using
   Google's own UI, where the dropdown choices always match exactly
   (this also sidesteps the earlier silent-validation-failure issue,
   since there's no risk of the site's dropdown text not matching the
   Form's real choices). The Sheet + Apps Script (APPS_SCRIPT_API_URL)
   still reads those submissions back so "Recent Submitted Feedback"
   shows them permanently for every visitor, auto-refreshing every
   AUTO_REFRESH_MS.
   ===================================================================== */

const CONFIG = {

  // 1) Google Form's public "view" URL — this is what the "Click for
  //    Feedback" button opens in a new tab. Get this from your Form's
  //    "Send" button → link icon → copy link (it ends in /viewform).
  GOOGLE_FORM_VIEW_URL:
    "https://docs.google.com/forms/d/e/1FAIpQLSdhZqHQnwJ_VTmfngSdNurf_MrFFtjjBOGGgv1d6SAezps2fw/viewform",

  // 2) (Optional / unused now that submissions go through the Form's
  //    own page) Kept only for reference — the formResponse submission
  //    URL and entry IDs, in case you ever rebuild an inline form.
  GOOGLE_FORM_ACTION_URL:
    "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdhZqHQnwJ_VTmfngSdNurf_MrFFtjjBOGGgv1d6SAezps2fw/formResponse",
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
  //    Google Sheet that collects your Form responses). The map uses
  //    this to read back submitted feedback as JSON (doGet in Code.gs)
  //    for the "Recent Submitted Feedback" list. (Code.gs also includes
  //    a doPost handler you can use if you ever want to submit directly
  //    to the Sheet again without going through the Form.)
  //    See APPS_SCRIPT_SETUP.md for step-by-step deployment instructions.
  //    Paste the URL Google gives you after deployment below, e.g.:
  //    "https://script.google.com/macros/s/AKfycb.../exec"
  APPS_SCRIPT_API_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",

  // How often (ms) to auto-refresh the Recent Feedback list.
  AUTO_REFRESH_MS: 30000,
};
