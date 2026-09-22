const CONFIG = {
  // Lascia vuoto se lo script e collegato direttamente al file Google Sheets.
  spreadsheetId: '',
  sheetName: 'Allenamenti'
};

const EXERCISE_SHEET_NAME = 'Esercizi';
const EXERCISE_HEADERS = ['Gruppo muscolare', 'Esercizio'];
const MAX_NAME_LENGTH = 80;

// Catalogo iniziale usato solo quando il foglio Esercizi viene creato da zero.
const DEFAULT_CATALOG = [
  ['Spalle', ['Military press', 'Alzate laterali', 'Alzate frontali', 'Reverse fly']],
  ['Petto', ['Panca piana', 'Panca inclinata', 'Chest press', 'Croci']],
  ['Gambe', ['Squat', 'Leg press', 'Affondi', 'Leg extension', 'Leg curl']],
  ['Braccia', ['Curl con bilanciere', 'Curl con manubri', 'Pushdown', 'French press']],
  ['Addome', ['Crunch', 'Plank', 'Leg raise', 'Ab wheel']],
  ['Dorso', ['Stacco da terra', 'Lat machine', 'Rematore', 'Pulley']]
];

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

// Azioni della seconda schermata: modificano il catalogo e restituiscono sempre
// il catalogo aggiornato, cosi la prima schermata puo ricostruire i suoi menu.
const CATALOG_ACTIONS = {
  saveGroup: saveGroup,
  renameGroup: renameGroup,
  deleteGroup: deleteGroup,
  saveExercise: saveExercise,
  renameExercise: renameExercise,
  deleteExercise: deleteExercise
};

function doGet(event) {
  try {
    const action = event && event.parameter ? String(event.parameter.action || '') : '';

    if (action === 'listExercises') {
      return jsonResponse({ result: 'success', catalog: getCatalog() });
    }

    if (action && action !== 'ping') {
      throw new Error('Azione non riconosciuta: ' + action);
    }

    return jsonResponse({
      result: 'success',
      message: 'Endpoint Google Sheets attivo',
      spreadsheet: getSpreadsheet().getName()
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

    const action = String(payload.action || '').trim();

    if (action) {
      if (!Object.prototype.hasOwnProperty.call(CATALOG_ACTIONS, action)) {
        throw new Error('Azione non riconosciuta: ' + action);
      }
      const handler = CATALOG_ACTIONS[action];
      const message = withLock(function() {
        return handler(payload);
      });
      return jsonResponse({ result: 'success', message: message, catalog: getCatalog() });
    }

    const row = buildRow(payload);
    withLock(function() {
      const sheet = getSheet();
      ensureHeaders(sheet);
      sheet.appendRow(row);
    });

    return jsonResponse({ result: 'success', message: 'Serie salvata' });
  } catch (error) {
    console.error(error);
    return errorResponse(error);
  }
}

/* ---------------------------------------------------------------- catalogo */

function getCatalog() {
  const rows = readExerciseRows(getExerciseSheet());
  const order = [];
  const byGroup = Object.create(null);

  rows.forEach(function(row) {
    if (!row.group) return;
    if (!byGroup[row.group]) {
      byGroup[row.group] = [];
      order.push(row.group);
    }
    if (row.exercise && byGroup[row.group].indexOf(row.exercise) === -1) {
      byGroup[row.group].push(row.exercise);
    }
  });

  return {
    groups: order.map(function(name) {
      return { name: name, exercises: byGroup[name] };
    })
  };
}

function saveGroup(payload) {
  const group = normalizeName(payload.gruppoMuscolare, 'Il nome del gruppo');
  const sheet = getExerciseSheet();

  if (readExerciseRows(sheet).some(function(row) { return sameName(row.group, group); })) {
    throw new Error('Questo gruppo esiste gia');
  }

  // Una riga con esercizio vuoto tiene in vita un gruppo ancora senza esercizi.
  sheet.appendRow([group, '']);
  return 'Gruppo aggiunto';
}

function renameGroup(payload) {
  const group = normalizeName(payload.gruppoMuscolare, 'Il gruppo');
  const newGroup = normalizeName(payload.nuovoGruppo, 'Il nuovo nome del gruppo');
  const sheet = getExerciseSheet();
  const rows = readExerciseRows(sheet);
  const groupRows = rows.filter(function(row) { return row.group === group; });

  if (!groupRows.length) throw new Error('Gruppo non trovato');

  const duplicate = rows.some(function(row) {
    return row.group !== group && sameName(row.group, newGroup);
  });
  if (duplicate) throw new Error('Esiste gia un gruppo con questo nome');

  groupRows.forEach(function(row) {
    sheet.getRange(row.rowNumber, 1).setValue(newGroup);
  });
  return 'Gruppo aggiornato';
}

function deleteGroup(payload) {
  const group = normalizeName(payload.gruppoMuscolare, 'Il gruppo');
  const sheet = getExerciseSheet();
  const groupRows = readExerciseRows(sheet).filter(function(row) { return row.group === group; });

  if (!groupRows.length) throw new Error('Gruppo non trovato');

  groupRows
    .sort(function(a, b) { return b.rowNumber - a.rowNumber; })
    .forEach(function(row) { sheet.deleteRow(row.rowNumber); });
  return 'Gruppo rimosso';
}

function saveExercise(payload) {
  const group = normalizeName(payload.gruppoMuscolare, 'Il gruppo');
  const exercise = normalizeName(payload.esercizio, "Il nome dell'esercizio");
  const sheet = getExerciseSheet();
  const groupRows = readExerciseRows(sheet).filter(function(row) { return row.group === group; });

  if (!groupRows.length) throw new Error('Gruppo non trovato');
  if (groupRows.some(function(row) { return sameName(row.exercise, exercise); })) {
    throw new Error('Questo esercizio esiste gia nel gruppo selezionato');
  }

  const placeholder = groupRows.filter(function(row) { return !row.exercise; })[0];
  if (placeholder) sheet.getRange(placeholder.rowNumber, 2).setValue(exercise);
  else sheet.appendRow([group, exercise]);

  return 'Esercizio aggiunto';
}

function renameExercise(payload) {
  const group = normalizeName(payload.gruppoMuscolare, 'Il gruppo');
  const oldExercise = normalizeName(payload.esercizio, "L'esercizio");
  const newExercise = normalizeName(payload.nuovoEsercizio, 'Il nuovo nome');
  const sheet = getExerciseSheet();
  const groupRows = readExerciseRows(sheet).filter(function(row) { return row.group === group; });
  const target = groupRows.filter(function(row) { return row.exercise === oldExercise; })[0];

  if (!target) throw new Error('Esercizio non trovato');

  const duplicate = groupRows.some(function(row) {
    return row.rowNumber !== target.rowNumber && sameName(row.exercise, newExercise);
  });
  if (duplicate) throw new Error('Esiste gia un esercizio con questo nome nel gruppo selezionato');

  sheet.getRange(target.rowNumber, 2).setValue(newExercise);
  return 'Esercizio aggiornato';
}

function deleteExercise(payload) {
  const group = normalizeName(payload.gruppoMuscolare, 'Il gruppo');
  const exercise = normalizeName(payload.esercizio, "L'esercizio");
  const sheet = getExerciseSheet();
  const groupRows = readExerciseRows(sheet).filter(function(row) { return row.group === group; });
  const target = groupRows.filter(function(row) { return row.exercise === exercise; })[0];

  if (!target) throw new Error('Esercizio non trovato');

  const others = groupRows.filter(function(row) {
    return row.rowNumber !== target.rowNumber;
  });

  // L'ultima riga del gruppo diventa un segnaposto: il gruppo resta nei menu.
  if (others.length) sheet.deleteRow(target.rowNumber);
  else sheet.getRange(target.rowNumber, 2).setValue('');

  return 'Esercizio rimosso';
}

function readExerciseRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet
    .getRange(2, 1, lastRow - 1, EXERCISE_HEADERS.length)
    .getValues()
    .map(function(row, index) {
      return {
        rowNumber: index + 2,
        group: cleanCell(row[0]),
        exercise: cleanCell(row[1])
      };
    });
}

function cleanCell(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeName(value, label) {
  const name = cleanCell(value);
  if (!name) throw new Error(label + ' e obbligatorio');
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(label + ' non puo superare ' + MAX_NAME_LENGTH + ' caratteri');
  }
  return name;
}

function sameName(a, b) {
  return cleanCell(a).toLowerCase() === cleanCell(b).toLowerCase();
}

/* ------------------------------------------------------------------ fogli */

function getSpreadsheet() {
  const spreadsheet = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Collega questo progetto Apps Script a un file Google Sheets oppure imposta spreadsheetId');
  }

  return spreadsheet;
}

function getExerciseSheet() {
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(EXERCISE_SHEET_NAME)
    || spreadsheet.insertSheet(EXERCISE_SHEET_NAME);
  ensureExerciseHeaders(sheet);
  return sheet;
}

function ensureExerciseHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, EXERCISE_HEADERS.length).setValues([EXERCISE_HEADERS]);
    sheet.setFrozenRows(1);
    seedCatalog(sheet);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, EXERCISE_HEADERS.length).getValues()[0];
  const hasHeaders = EXERCISE_HEADERS.every(function(header, index) {
    return cleanCell(currentHeaders[index]) === header;
  });

  if (!hasHeaders) {
    throw new Error('La prima riga del foglio "' + EXERCISE_SHEET_NAME + '" deve contenere: ' + EXERCISE_HEADERS.join(', '));
  }
}

function seedCatalog(sheet) {
  const rows = [];
  DEFAULT_CATALOG.forEach(function(entry) {
    entry[1].forEach(function(exercise) {
      rows.push([entry[0], exercise]);
    });
  });
  sheet.getRange(2, 1, rows.length, EXERCISE_HEADERS.length).setValues(rows);
}

function getSheet() {
  const spreadsheet = getSpreadsheet();
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
    return cleanCell(currentHeaders[index]) === header;
  });

  if (!hasHeaders) {
    throw new Error('La prima riga del foglio "' + CONFIG.sheetName + '" deve contenere: ' + HEADERS.join(', '));
  }
}

/* ------------------------------------------------------------------- serie */

function buildRow(payload) {
  const requiredFields = ['data', 'gruppoMuscolare', 'esercizio', 'ripetizioni', 'set'];

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
    cleanCell(payload.gruppoMuscolare),
    cleanCell(payload.esercizio),
    repetitions,
    sets,
    weight,
    Boolean(payload.mono),
    cleanCell(payload.commento)
  ];
}

/* ------------------------------------------------------------------ utility */

function withLock(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
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
