# Security Notes

## Apps Script URL

Do not commit the real Google Apps Script deployment URL. Keep it in a local
`config.js` file copied from `config.example.js`.

If the real URL was ever committed or published:

1. Open the Apps Script project.
2. Create a new web app deployment.
3. Update local `config.js` with the new `/exec` URL.
4. Disable or delete the old deployment.

## Apps Script Validation

Client-side validation is for user experience only. The Apps Script handler must
validate every write before appending to the spreadsheet.

Minimum checks for `doPost(e)`:

- Parse `e.postData.contents` as JSON.
- Require `date`, `description`, `amount`, `tender`, and `category`.
- Reject invalid dates.
- Reject non-numeric or non-positive amounts.
- Check `tender` and `category` against allowlists.
- Limit description length.
- Return JSON or plain-text errors without writing invalid rows.

Example validation shape:

```js
const ALLOWED_TENDERS = new Set([
  'Cash/ET',
  'TD Debit',
  'TD Credit',
  'RBC Debit',
  'RBC Credit',
  'Amex Credit',
  'Neo Credit',
  'Capital One Credit',
])

const ALLOWED_CATEGORIES = new Set([
  'Food',
  'Groceries',
  'Transportation',
  'Shopping',
  'Beer',
  'Bars',
  'Subscriptions',
  'Entertainment',
  'Rent',
  'Fees',
  'Other',
])

function validateTransaction(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid payload')

  const amount = Number(data.amount)
  const description = String(data.description || '').trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error('Invalid date')
  if (!description || description.length > 200) {
    throw new Error('Invalid description')
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount')
  }
  if (!ALLOWED_TENDERS.has(data.tender)) throw new Error('Invalid tender')
  if (!ALLOWED_CATEGORIES.has(data.category)) {
    throw new Error('Invalid category')
  }
}
```

## Access Control

For a public static frontend, anyone who can use the app can see the endpoint.
If writes need to be private, restrict the Apps Script web app to your Google
account or add a server-side secret/token check in Apps Script. A token embedded
in the frontend only blocks accidental use; it is not strong authentication.
