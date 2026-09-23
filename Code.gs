/**
 * Backend minimo per l'app Allenamento.
 *
 * Fa tre cose sole:
 *   1. riceve una serie dalla prima schermata e la scrive in fondo al foglio;
 *   2. rilegge il foglio e restituisce l'ultima serie di ogni esercizio, per
 *      la schermata Progressi e per i suggerimenti della prima schermata;
 *   3. parcheggia e restituisce la configurazione dei menu, cosi l'app ritrova
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

// Cresce quando cambia cio che il foglio sa salvare: l'app la legge nelle
// risposte e avvisa se lo script pubblicato e rimasto indietro.
const VERSIONE = 2;

const CONFIG_SHEET_NAME = 'Configurazione';
const CONFIG_MAX_CARATTERI = 45000; // una cella di Sheets ne regge 50.000

// Le colonne del foglio, nell'ordine in cui vengono create. La riga si scrive
// cercando ogni titolo nell'intestazione, non per posizione: cosi una colonna
// nuova si puo aggiungere senza toccare le righe gia scritte.
const COLONNE = [
  { titolo: 'Data',             valore: (p) => text(p.data) },
  { titolo: 'Gruppo muscolare', valore: (p) => text(p.gruppoMuscolare) },
  { titolo: 'Esercizio',        valore: (p) => text(p.esercizio) },
  { titolo: 'Sottocategoria',   valore: (p) => text(p.sottocategoria) },
  { titolo: 'Ripetizioni',      valore: (p) => numeroOppureTesto(p.ripetizioni) },
  { titolo: 'Set',              valore: (p) => numeroOppureTesto(p.set) },
  { titolo: 'Peso (kg)',        valore: (p) => numeroOppureTesto(p.peso) },
  { titolo: 'Mono',             valore: (p) => booleano(p.mono) },
  { titolo: 'Esplosiva',        valore: (p) => booleano(p.esplosiva) },
  { titolo: 'Commento',         valore: (p) => text(p.commento) }
];

function doGet(event) {
  try {
    const azione = event && event.parameter ? String(event.parameter.action || '') : '';

    if (azione === 'leggiConfig') {
      return jsonResponse({ result: 'success', config: leggiConfigurazione(), versione: VERSIONE });
    }

    if (azione === 'leggiStorico') {
      return jsonResponse({ result: 'success', storico: leggiStorico(), versione: VERSIONE });
    }

    return jsonResponse({
      result: 'success',
      message: 'Endpoint Google Sheets attivo',
      foglio: getSpreadsheet().getName(),
      versione: VERSIONE
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

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet();
      sheet.appendRow(buildRow(payload, ensureHeaders(sheet)));
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ result: 'success', message: 'Serie salvata', versione: VERSIONE });
  } catch (error) {
    console.error(error);
    return errorResponse(error);
  }
}

/**
 * Costruisce la riga da scrivere, mettendo ogni valore sotto la sua colonna.
 * Gruppo muscolare, esercizio e sottocategoria non vengono filtrati: passano
 * cosi come li manda l'app. Ripetizioni, set e peso restano numeri quando
 * sono numeri, cosi il foglio puo fare somme e medie.
 */
function buildRow(payload, posizioni) {
  const row = [];
  for (let i = 0; i < Math.max.apply(null, posizioni); i++) row.push('');
  COLONNE.forEach((colonna, i) => {
    row[posizioni[i] - 1] = colonna.valore(payload);
  });
  return row;
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function booleano(value) {
  return value === true || String(value).trim().toLowerCase() === 'true';
}

function numeroOppureTesto(value) {
  const raw = text(value);
  if (raw === '') return '';
  const numero = Number(raw.replace(',', '.'));
  return isNaN(numero) ? raw : numero;
}

/**
 * L'ultima serie di ogni gruppo + esercizio + sottocategoria, dalla piu
 * recente alla piu vecchia. "Ultima" e l'ultima riga scritta, cioe l'ordine in
 * cui l'app ha inviato le serie, anche se una ha una data precedente.
 *
 * Le serie esplosive sono una categoria a parte: hanno la loro "ultima" e non
 * prendono mai il posto di quella normale. Se l'ultima riga di un esercizio e
 * esplosiva, per le serie normali vale la precedente non esplosiva.
 *
 * riga e il numero della riga nel foglio: all'app serve per capire quale fra
 * due sottocategorie dello stesso esercizio e stata usata per ultima.
 */
function leggiStorico() {
  const sheet = getSheet();
  const ultima = sheet.getLastRow();
  if (ultima < 2) return [];

  const intestazioni = leggiIntestazioni(sheet);
  const posizione = {};
  COLONNE.forEach((colonna) => {
    posizione[colonna.titolo] = cercaColonna(intestazioni, colonna.titolo);
  });
  const cella = (riga, titolo) => (posizione[titolo] === -1 ? '' : riga[posizione[titolo]]);
  const fuso = getSpreadsheet().getSpreadsheetTimeZone();

  const valori = sheet.getRange(2, 1, ultima - 1, intestazioni.length).getValues();
  const viste = {};
  const storico = [];

  for (let i = valori.length - 1; i >= 0; i--) {
    const riga = valori[i];
    const gruppo = text(cella(riga, 'Gruppo muscolare'));
    const esercizio = text(cella(riga, 'Esercizio'));
    if (!gruppo || !esercizio) continue;

    const sottocategoria = text(cella(riga, 'Sottocategoria'));
    const esplosiva = booleano(cella(riga, 'Esplosiva'));
    const chiave = [gruppo, esercizio, sottocategoria, esplosiva].join('\u0000');
    if (viste[chiave]) continue;
    viste[chiave] = true;

    storico.push({
      gruppo: gruppo,
      esercizio: esercizio,
      sottocategoria: sottocategoria,
      data: dataTesto(cella(riga, 'Data'), fuso),
      ripetizioni: cella(riga, 'Ripetizioni'),
      set: cella(riga, 'Set'),
      peso: cella(riga, 'Peso (kg)'),
      mono: booleano(cella(riga, 'Mono')),
      esplosiva: esplosiva,
      riga: i + 2
    });
  }

  return storico;
}

// Sheets trasforma "2026-09-23" in una data: la si riporta al testo che
// l'app ha inviato.
function dataTesto(valore, fuso) {
  if (Object.prototype.toString.call(valore) === '[object Date]') {
    return Utilities.formatDate(valore, fuso, 'yyyy-MM-dd');
  }
  return text(valore);
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

/**
 * Garantisce che l'intestazione contenga tutte le COLONNE e restituisce, per
 * ognuna, il numero di colonna (da 1) in cui sta nel foglio.
 *
 * Un foglio creato da una versione precedente non ha le colonne aggiunte dopo:
 * ciascuna viene inserita subito a destra di quella che la precede
 * nell'elenco. Le righe gia scritte scorrono insieme e si ritrovano con la
 * cella nuova vuota, che e il valore giusto per il passato.
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, COLONNE.length).setValues([COLONNE.map((c) => c.titolo)]);
    sheet.setFrozenRows(1);
  }

  let intestazioni = leggiIntestazioni(sheet);

  COLONNE.forEach((colonna, i) => {
    if (cercaColonna(intestazioni, colonna.titolo) !== -1) return;

    let precedente = -1;
    for (let j = i - 1; j >= 0 && precedente === -1; j--) {
      precedente = cercaColonna(intestazioni, COLONNE[j].titolo);
    }

    if (precedente === -1) sheet.insertColumnBefore(1);
    else sheet.insertColumnAfter(precedente + 1);
    sheet.getRange(1, precedente + 2).setValue(colonna.titolo);
    intestazioni = leggiIntestazioni(sheet);
  });

  return COLONNE.map((colonna) => cercaColonna(intestazioni, colonna.titolo) + 1);
}

function leggiIntestazioni(sheet) {
  const larghezza = sheet.getLastColumn();
  if (larghezza === 0) return [];
  return sheet.getRange(1, 1, 1, larghezza).getValues()[0].map(text);
}

// Posizione (da 0) del titolo nell'intestazione, senza badare a maiuscole e
// spazi: un "peso (KG) " scritto a mano resta la stessa colonna.
function cercaColonna(intestazioni, titolo) {
  const cercato = titolo.toLowerCase();
  for (let i = 0; i < intestazioni.length; i++) {
    if (intestazioni[i].toLowerCase() === cercato) return i;
  }
  return -1;
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
