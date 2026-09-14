const CONFIG = {
  // Lascia vuoto se lo script e collegato direttamente al file Google Sheets.
  spreadsheetId: '',
  sheetName: 'Allenamenti'
};

const HEADERS = [
  'Data',
  'Gruppo muscolare',
  'Esercizio',
  'Ripetizioni',
  'Set',
  'Peso (kg)',
  'Mono',
  'Commento'
];

function doGet() {
  return jsonResponse({
    result: 'success',
    message: 'Endpoint Google Sheets attivo'
  });
}

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      throw new Error('Richiesta senza dati');
    }

    const payload = JSON.parse(event.postData.contents);
    const row = buildRow(payload);
    const sheet = getSheet();

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      ensureHeaders(sheet);
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({
      result: 'success',
      message: 'Serie salvata'
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      result: 'error',
      message: error.message || 'Errore durante il salvataggio'
    });
  }
}

function buildRow(payload) {
  const requiredFields = [
    'data',
    'gruppoMuscolare',
    'esercizio',
    'ripetizioni',
    'set'
  ];

  requiredFields.forEach(function(field) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      throw new Error('Campo obbligatorio mancante: ' + field);
    }
  });

  const repetitions = Number(payload.ripetizioni);
  const sets = Number(payload.set);
  const weight = payload.peso === '' || payload.peso === null || payload.peso === undefined
    ? ''
    : Number(payload.peso);

  if (!Number.isInteger(repetitions) || repetitions < 1) {
    throw new Error('Le ripetizioni devono essere un numero intero positivo');
  }

  if (!Number.isInteger(sets) || sets < 1) {
    throw new Error('I set devono essere un numero intero positivo');
  }

  if (weight !== '' && (!Number.isFinite(weight) || weight < 0)) {
    throw new Error('Il peso deve essere un numero maggiore o uguale a zero');
  }

  return [
    String(payload.data),
    String(payload.gruppoMuscolare).trim(),
    String(payload.esercizio).trim(),
    repetitions,
    sets,
    weight,
    Boolean(payload.mono),
    String(payload.commento || '').trim()
  ];
}

function getSheet() {
  const spreadsheet = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Collega questo progetto Apps Script a un file Google Sheets oppure imposta spreadsheetId');
  }

  return spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.insertSheet(CONFIG.sheetName);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every(function(header, index) {
    return currentHeaders[index] === header;
  });

  if (!hasHeaders) {
    throw new Error('La prima riga del foglio non contiene le intestazioni attese');
  }
}

function jsonResponse(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
