const SHEET_NAME = 'Transactions'

const ALLOWED_TENDERS = new Set([
  'Cash/ET',
  'TD Debit',
  'TD Credit',
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

function doGet(e) {
  try {
    const sheet = getTransactionsSheet()
    const values = sheet.getDataRange().getValues()
    const year = getOptionalYear(e)
    const month = getOptionalMonth(e)
    const filteredRows = filterRows(values, year, month)

    return jsonResponse({
      success: true,
      allTransactions: filteredRows,
      summary: summarizeByCategory(filteredRows),
      grandTotal: calculateGrandTotal(filteredRows),
    })
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message,
      allTransactions: [],
      summary: [],
      grandTotal: 0,
    })
  }
}

function doPost(e) {
  try {
    const sheet = getTransactionsSheet()
    const data = parsePostData(e)
    const transaction = validateTransaction(data)

    sheet.appendRow([
      transaction.date,
      transaction.description,
      transaction.amount,
      transaction.tender,
      transaction.category,
      'No',
    ])

    return jsonResponse({
      success: true,
      message: 'Data saved successfully!',
    })
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message,
    })
  }
}

function getTransactionsSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
  if (!sheet) {
    throw new Error(`Missing sheet: ${SHEET_NAME}`)
  }
  return sheet
}

function parsePostData(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body')
  }

  try {
    return JSON.parse(e.postData.contents)
  } catch (error) {
    throw new Error('Invalid JSON payload')
  }
}

function validateTransaction(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid payload')
  }

  const date = parseDate(data.date)
  const description = String(data.description || '').trim().toUpperCase()
  const amount = Number(data.amount)
  const tender = String(data.tender || '').trim()
  const category = String(data.category || '').trim()

  if (!description || description.length > 200) {
    throw new Error('Description is required and must be 200 characters or less')
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }
  if (!ALLOWED_TENDERS.has(tender)) {
    throw new Error('Invalid payment method')
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    throw new Error('Invalid category')
  }

  return { date, description, amount, tender, category }
}

function parseDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    throw new Error('Date must use YYYY-MM-DD format')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('Invalid date')
  }

  return date
}

function getOptionalYear(e) {
  const year = e && e.parameter ? e.parameter.year : ''
  if (!year) return ''
  if (!/^\d{4}$/.test(String(year))) {
    throw new Error('Invalid year filter')
  }
  return String(year)
}

function getOptionalMonth(e) {
  const month = e && e.parameter ? e.parameter.month : ''
  if (!month) return ''

  const monthNumber = Number(month)
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new Error('Invalid month filter')
  }

  return String(monthNumber).padStart(2, '0')
}

function filterRows(values, year, month) {
  if (!values.length) {
    return []
  }

  const rows = [values[0]]
  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    const rowDate = row[0] instanceof Date ? row[0] : new Date(row[0])

    if (!row[0] || Number.isNaN(rowDate.getTime())) {
      continue
    }
    if (year && rowDate.getFullYear().toString() !== year) {
      continue
    }
    if (month && String(rowDate.getMonth() + 1).padStart(2, '0') !== month) {
      continue
    }

    rows.push(row)
  }
  return rows
}

function summarizeByCategory(rows) {
  const categories = {}
  const grandTotal = calculateGrandTotal(rows)

  for (let i = 1; i < rows.length; i++) {
    const category = rows[i][4]
    const amount = Number(rows[i][2])

    if (!category || !Number.isFinite(amount)) {
      continue
    }

    categories[category] = (categories[category] || 0) + amount
  }

  return Object.keys(categories)
    .map((category) => {
      const amount = categories[category]
      const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0

      return {
        category,
        amount,
        percentage: `${Math.round(percentage * 10) / 10}%`,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function calculateGrandTotal(rows) {
  let total = 0

  for (let i = 1; i < rows.length; i++) {
    const amount = Number(rows[i][2])
    if (Number.isFinite(amount)) {
      total += amount
    }
  }

  return total
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  )
}
