# Setting Up Multi-App Feedback Logging (SG Nearby & SG Datavis)

This guide explains how to log feedback submissions from both **SG Nearby** and **SG Datavis** into a single Google Sheet (or separate sheets) with automatic email notifications.

---

## 1. Google Sheet Setup

1. Open [Google Sheets](https://sheets.new) logged in as `shiyunn.dream@gmail.com`.
2. Name the spreadsheet: **`Antigravity Apps Feedback Logs`** (or your preferred name).
3. In Row 1, set up the headers:
   - **A1**: `Timestamp`
   - **B1**: `App`
   - **C1**: `Type`
   - **D1**: `Email`
   - **E1**: `Message`

> **Note**:
> If your existing sheet only has 4 columns (`Timestamp`, `Type`, `Email`, `Message`), you can either:
> - Insert a new column at **Column B** and label it **`App`**, OR
> - Keep 4 columns — the Apps Script below is backwards-compatible and will automatically record the type as `[SG Nearby] Enhancement` or `[SG Datavis] Enhancement` without breaking.

---

## 2. Google Apps Script Code

1. In your Google Sheet, click **Extensions** → **Apps Script**.
2. Replace all existing code in the editor with the following script:

```javascript
function doPost(e) {
  try {
    // Parse incoming JSON payload from Next.js API
    var payload = JSON.parse(e.postData.contents);
    
    // Determine the source application (SG Nearby vs SG Datavis)
    var app = payload.app || payload.source;
    if (!app) {
      if (payload.type && payload.type.indexOf("[SG Nearby]") !== -1) {
        app = "SG Nearby";
      } else if ((payload.type && payload.type.indexOf("[SG Datavis]") !== -1) || (payload.type && payload.type.indexOf("[SG DataViz]") !== -1)) {
        app = "SG Datavis";
      } else {
        app = "SG Nearby";
      }
    }
    
    // Clean feedback type (Enhancement, Bug, Data Issue, Others)
    var cleanType = payload.rawType || payload.type.replace(/^\[.*?\]\s*/, "");
    var email = payload.email || "Anonymous";
    var message = payload.message || "";
    var timestamp = payload.timestamp || new Date().toISOString();
    
    // Select active sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastCol = Math.max(sheet.getLastColumn(), 5);
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
    
    // Check if an "App" or "Source" column exists in row 1
    var appColIndex = -1;
    for (var i = 0; i < headers.length; i++) {
      var h = (headers[i] || "").toString().toLowerCase().trim();
      if (h === "app" || h === "source" || h === "project" || h === "platform") {
        appColIndex = i;
        break;
      }
    }
    
    if (appColIndex !== -1) {
      // 5-column format: [Timestamp, App, Type, Email, Message]
      sheet.appendRow([
        timestamp,
        app,
        cleanType,
        email,
        message
      ]);
    } else {
      // 4-column backwards-compatible format: [Timestamp, Type, Email, Message]
      sheet.appendRow([
        timestamp,
        "[" + app + "] " + cleanType,
        email,
        message
      ]);
    }
    
    // Send email notification
    var emailSubject = "[" + app + "] New " + cleanType + " received!";
    var emailBody = "You have received new feedback for " + app + ":\n\n" +
                    "Application: " + app + "\n" +
                    "Type: " + cleanType + "\n" +
                    "From: " + email + "\n\n" +
                    "Message:\n" + message + "\n\n" +
                    "Logged at: " + timestamp;
                    
    MailApp.sendEmail("shiyunn.dream@gmail.com", emailSubject, emailBody);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "app": app }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 3. Deploying / Updating the Web App

1. Click the **Deploy** button (top right) → **Manage deployments** (or **New deployment** if first time).
2. If updating an existing deployment:
   - Click the **Pencil (Edit)** icon.
   - Set **Version** to **New version**.
   - Click **Deploy**.
3. If creating a new deployment:
   - Select type: **Web app**.
   - Description: `Multi-App Feedback Webhook (SG Nearby & SG Datavis)`.
   - Execute as: **Me (`shiyunn.dream@gmail.com`)**.
   - Who has access: **Anyone**.
   - Click **Deploy** and authorize permissions.
4. Copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`).

---

## 4. Setting the Environment Variable

Add the copied Web app URL into `.env.local` (and your production VM / Vercel settings) for both projects:

```env
GOOGLE_FEEDBACK_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
```

> **Tip**: Both SG Nearby and SG Datavis can share this single Webhook URL! The script will automatically tag each incoming entry with the correct application name in both the sheet and email notifications.
