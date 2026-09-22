/**
 * Backend minimo per l'app Allenamento.
 *
 * Riceve una serie dalla prima schermata e la scrive in fondo al foglio.
 * Non conosce i gruppi muscolari ne gli esercizi: arrivano come testo e come
 * testo vengono scritti, senza controlli. L'elenco dei menu vive dentro
 * l'applicazione (index.html), dove e piu comodo modificarlo.
 */

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
  try {
    return jsonResponse({
      result: 'success',
      message: 'Endpoint Google Sheets attivo',
      foglio: getSheet().getParent().getName()
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      throw new Error('Richiesta senza dati');
    }

    let payload;
    try {
      payload = JSON.parse(event.postData.contents);
    } catch (parseError) {
      throw new Error('Dati della richiesta non validi');
    }

    const row = buildRow(payload);

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet();
      ensureHeaders(sheet);
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ result: 'success', message: 'Serie salvata' });
  } catch (error) {
    console.error(error);
    return errorResponse(error);
  }
}

/**
 * Costruisce la riga da scrivere. Gruppo muscolare ed esercizio non vengono
 * filtrati: passano cosi come li manda l'app. Ripetizioni, set e peso restano
 * numeri quando sono numeri, cosi il foglio puo fare somme e medie.
 */
function buildRow(payload) {
  return [
    text(payload.data),
    text(payload.gruppoMuscolare),
    text(payload.esercizio),
    numeroOppureTesto(payload.ripetizioni),
    numeroOppureTesto(payload.set),
    numeroOppureTesto(payload.peso),
    payload.mono === true || String(payload.mono).toLowerCase() === 'true',
    text(payload.commento)
  ];
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function numeroOppureTesto(value) {
  const raw = text(value);
  if (raw === '') return '';
  const numero = Number(raw.replace(',', '.'));
  return isNaN(numero) ? raw : numero;
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
  }
}

function jsonResponse(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(error) {
  return jsonResponse({
    result: 'error',
    message: (error && error.message) || 'Errore imprevisto'
  });
}
