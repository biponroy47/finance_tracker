Simple little Finance Tracker web app built in 3 hours, no database.

Uses a Google Spreadsheet + Script for backend.

90% "vibe coded".

## Local setup

The app includes the current production Google Apps Script `/exec` URL so the
Netlify deployment works as a static site. For local testing against a different
Apps Script deployment, copy `config.example.js` to `config.js` and set
`SCRIPT_URL`; `config.js` is ignored and overrides the production URL.

![](https://github.com/biponroy47/finance_tracker/blob/main/eg1.jpg)
![](https://github.com/biponroy47/finance_tracker/blob/main/eg2.jpg)
