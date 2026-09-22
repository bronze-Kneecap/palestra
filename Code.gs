/**
 * Backend minimo per l'app Allenamento.
 *
 * Fa due cose sole:
 *   1. riceve una serie dalla prima schermata e la scrive in fondo al foglio;
 *   2. parcheggia e restituisce la configurazione dei menu, cosi l'app ritrova
 *      le stesse tendine su qualunque dispositivo.
 *
 * Non conosce i gruppi muscolari ne gli esercizi: arrivano come testo e come
 * testo vengono scritti, senza controlli. Anche la configurazione e testo
 * opaco, mai interpretato qui: il filtro vive nell'applicazione (index.html),
 * dove e piu comodo modificarlo.
 */

const CONFIG = {
  // Lascia vuoto se lo script e collegato direttamente al file Google Sheets.
  spreadsheetId: '',
  sheetName: 'Allenamenti'
};

const CONFIG_SHEET_NAME = 'Configurazione';
const CONFIG_MAX_CARATTERI = 45000; // una cella di Sheets ne regge 50.000

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

function doGet(event) {
  try {
    const azione = event && event.parameter ? String(event.parameter.action || '') : '';

    if (azione === 'leggiConfig') {
      return jsonResponse({ result: 'success', config: leggiConfigurazione() });
    }

    return jsonResponse({
      result: 'success',
      message: 'Endpoint Google Sheets attivo',
      foglio: getSpreadsheet().getName()
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

    if (payload.action === 'scriviConfig') {
      const lockConfig = LockService.getScriptLock();
      lockConfig.waitLock(20000);
      try {
        scriviConfigurazione(payload.config);
      } finally {
        lockConfig.releaseLock();
      }
      return jsonResponse({ result: 'success', message: 'Configurazione salvata' });
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

/**
 * Configurazione dei menu: un testo qualunque, scritto e riletto identico.
 * Qui dentro non viene mai analizzato, quindi aggiungere o togliere campi
 * nell'app non richiede di ritoccare questo file.
 */
function leggiConfigurazione() {
  const valore = getConfigSheet().getRange(2, 1).getValue();
  return valore === null || valore === undefined ? '' : String(valore);
}

function scriviConfigurazione(testo) {
  const contenuto = testo === null || testo === undefined ? '' : String(testo);
  if (contenuto.length > CONFIG_MAX_CARATTERI) {
    throw new Error('Configurazione troppo lunga per una cella del foglio');
  }
  getConfigSheet().getRange(2, 1).setValue(contenuto);
}

function getConfigSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG_SHEET_NAME);
    sheet.getRange(1, 1).setValue('Menu dell\'app: aggiornato in automatico, non modificare a mano');
  }

  return sheet;
}

function getSpreadsheet() {
  const spreadsheet = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Collega questo progetto Apps Script a un file Google Sheets oppure imposta spreadsheetId');
  }

  return spreadsheet;
}

function getSheet() {
  const spreadsheet = getSpreadsheet();
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
