const CONFIG = {
  // Lascia vuoto se lo script e collegato direttamente al file Google Sheets.
  spreadsheetId: '',
  sheetName: 'Allenamenti'
};

const EXERCISE_SHEET_NAME = 'Esercizi';

const DEFAULT_EXERCISES = {
  Spalle: ['Military press', 'Alzate laterali', 'Alzate frontali', 'Reverse fly'],
  Petto: ['Panca piana', 'Panca inclinata', 'Chest press', 'Croci'],
  Gambe: ['Squat', 'Leg press', 'Affondi', 'Leg extension', 'Leg curl'],
  Braccia: ['Curl con bilanciere', 'Curl con manubri', 'Pushdown', 'French press'],
  Addome: ['Crunch', 'Plank', 'Leg raise', 'Ab wheel'],
  Dorso: ['Stacco da terra', 'Lat machine', 'Rematore', 'Pulley']
};

const EXERCISE_HEADERS = ['Gruppo muscolare', 'Esercizio'];

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
  if (event && event.parameter && event.parameter.action === 'listExercises') {
    return jsonResponse({ result: 'success', exercises: getExercises() });
  }

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

    if (payload.action === 'saveExercise') {
      saveExercise(payload);
      return jsonResponse({ result: 'success', message: 'Esercizio aggiunto', exercises: getExercises() });
    }

    if (payload.action === 'deleteExercise') {
      deleteExercise(payload);
      return jsonResponse({ result: 'success', message: 'Esercizio rimosso', exercises: getExercises() });
    }

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

function getExerciseSheet() {
  const spreadsheet = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Collega questo progetto Apps Script a un file Google Sheets oppure imposta spreadsheetId');
  }

  const sheet = spreadsheet.getSheetByName(EXERCISE_SHEET_NAME) || spreadsheet.insertSheet(EXERCISE_SHEET_NAME);
  ensureExerciseHeaders(sheet);
  return sheet;
}

function ensureExerciseHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, EXERCISE_HEADERS.length).setValues([EXERCISE_HEADERS]);
    sheet.setFrozenRows(1);
    seedExercises(sheet);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, EXERCISE_HEADERS.length).getValues()[0];
  const hasHeaders = EXERCISE_HEADERS.every(function(header, index) {
    return currentHeaders[index] === header;
  });

  if (!hasHeaders) throw new Error('La prima riga del foglio Esercizi non contiene le intestazioni attese');
}

function seedExercises(sheet) {
  const rows = [];
  Object.keys(DEFAULT_EXERCISES).forEach(function(group) {
    DEFAULT_EXERCISES[group].forEach(function(exercise) {
      rows.push([group, exercise]);
    });
  });
  sheet.getRange(2, 1, rows.length, EXERCISE_HEADERS.length).setValues(rows);
}

function getExercises() {
  const sheet = getExerciseSheet();
  const rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, EXERCISE_HEADERS.length).getValues()
    : [];
  const exercises = {};

  rows.forEach(function(row) {
    const group = String(row[0] || '').trim();
    const exercise = String(row[1] || '').trim();
    if (group && exercise) {
      if (!exercises[group]) exercises[group] = [];
      exercises[group].push(exercise);
    }
  });
  return exercises;
}

function saveExercise(payload) {
  const group = String(payload.gruppoMuscolare || '').trim();
  const exercise = String(payload.esercizio || '').trim();
  if (!group || !exercise) throw new Error('Gruppo ed esercizio sono obbligatori');

  const sheet = getExerciseSheet();
  const rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, EXERCISE_HEADERS.length).getValues()
    : [];
  const exists = rows.some(function(row) {
    return String(row[0]).trim() === group && String(row[1]).trim().toLowerCase() === exercise.toLowerCase();
  });

  if (exists) throw new Error('Questo esercizio esiste gia per il gruppo selezionato');
  sheet.appendRow([group, exercise]);
}

function deleteExercise(payload) {
  const group = String(payload.gruppoMuscolare || '').trim();
  const exercise = String(payload.esercizio || '').trim();
  if (!group || !exercise) throw new Error('Gruppo ed esercizio sono obbligatori');

  const sheet = getExerciseSheet();
  const rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, EXERCISE_HEADERS.length).getValues()
    : [];
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (String(rows[index][0]).trim() === group && String(rows[index][1]).trim() === exercise) {
      sheet.deleteRow(index + 2);
      return;
    }
  }
  throw new Error('Esercizio non trovato');
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
