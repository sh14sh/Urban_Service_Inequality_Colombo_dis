/**
 * Urban Service Community Feedback Mapping — Apps Script Web API
 *
 * Reads every response row from the Google Sheet linked to your Form and
 * publishes it as JSON so the web map can fetch it with JavaScript.
 *
 * SETUP:
 * 1. Open the Google SHEET linked to your Form (Form → Responses tab →
 *    green Sheets icon).
 * 2. Extensions → Apps Script.
 * 3. Delete any starter code and paste this file's contents in.
 * 4. If your responses tab isn't named "Form Responses 1", change the
 *    sheet name below to match.
 * 5. Deploy → New deployment → select type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 6. Click Deploy, authorize the script when prompted, then copy the
 *    URL that ends in /exec.
 * 7. Paste that URL into APPS_SCRIPT_CONFIG.url in script.js.
 */

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses 1');
  const values = sheet.getDataRange().getValues();

  const headers = values.shift(); // first row = question titles
  const rows = values.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] instanceof Date ? row[i].toISOString() : row[i];
    });
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
