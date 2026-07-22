/* =====================================================================
   CONFIGURATION — paste your own IDs/URLs here.
   This file is intentionally separate from script.js so you never have
   to touch the application logic when connecting your own Google Form
   and Google Sheet.
   ===================================================================== */

const CONFIG = {

  // 1) Google Form "formResponse" submission URL.
  //    Get this from: open your Form -> "Get pre-filled link" (or view
  //    page source of the live form) -> the <form action="..."> URL,
  //    which always ends in /formResponse.
  GOOGLE_FORM_ACTION_URL:
    "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdhZqHQnwJ_VTmfngSdNurf_MrFFtjjBOGGgv1d6SAezps2fw/formResponse",

  // 2) Entry IDs for each field in the Google Form.
  //    Find these by opening the live form, right-click -> "Inspect",
  //    and locating the name="entry.XXXXXXXXX" attribute on each
  //    input/select/textarea.
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

  // 3) Google Apps Script Web App URL (deployed from the Google Sheet
  //    that collects the Form responses). This is what the dashboard
  //    calls to read back submitted feedback as JSON.
  //    See APPS_SCRIPT_SETUP.md for step-by-step deployment instructions.
  //    Paste the URL Google gives you after deployment below, e.g.:
  //    "https://script.google.com/macros/s/AKfycb.../exec"
  APPS_SCRIPT_API_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",

  // How often (ms) to auto-refresh the Recent Feedback list.
  AUTO_REFRESH_MS: 30000,
};
