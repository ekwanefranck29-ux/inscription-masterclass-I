/**
 * Google Apps Script — Backend Neo Consulting
 *
 * Ce script :
 * - crée automatiquement un Google Sheets dans ton Google Drive ;
 * - crée l’onglet "Inscriptions" ;
 * - range les colonnes dans le bon ordre ;
 * - ajoute chaque inscription par ordre d’arrivée ;
 * - évite les problèmes CORS fréquents avec GitHub Pages.
 */

const SPREADSHEET_NAME = "Inscriptions Masterclass IA - Neo Consulting";
const SHEET_NAME = "Inscriptions";

const HEADERS = [
  "N°",
  "Date d’inscription",
  "Nom complet",
  "WhatsApp",
  "Email",
  "Profil",
  "Mode de paiement",
  "Numéro de paiement",
  "ID de transaction",
  "Source",
  "Statut"
];

function doPost(e) {
  try {
    const data = parseRequestData(e);
    validateData(data);

    const sheet = getOrCreateSheet();
    ensureHeaders(sheet);

    const registrationNumber = getNextRegistrationNumber(sheet);
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

    const row = [
      registrationNumber,
      createdAt,
      clean(data.fullName),
      clean(data.whatsapp),
      clean(data.email || ""),
      clean(data.profile),
      clean(data.paymentMethod),
      clean(data.paymentNumber),
      clean(data.transactionId),
      clean(data.source || "Neo Consulting - Masterclass IA"),
      "En attente de vérification"
    ];

    sheet.appendRow(row);
    formatSheet(sheet);

    return jsonResponse({
      success: true,
      message: "Inscription enregistrée avec succès.",
      registrationNumber: registrationNumber,
      spreadsheetUrl: sheet.getParent().getUrl()
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message
    });
  }
}

function doGet() {
  const sheet = getOrCreateSheet();
  ensureHeaders(sheet);
  formatSheet(sheet);

  return jsonResponse({
    success: true,
    message: "Google Sheets créé et prêt.",
    spreadsheetUrl: sheet.getParent().getUrl()
  });
}

function parseRequestData(e) {
  if (!e) {
    throw new Error("Aucune requête reçue.");
  }

  // Cas 1 : JSON envoyé en text/plain
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      // On continue vers e.parameter si le contenu n'est pas du JSON.
    }
  }

  // Cas 2 : FormData / x-www-form-urlencoded
  if (e.parameter && Object.keys(e.parameter).length > 0) {
    return e.parameter;
  }

  throw new Error("Données du formulaire introuvables.");
}

function validateData(data) {
  const requiredFields = [
    "fullName",
    "whatsapp",
    "profile",
    "paymentMethod",
    "paymentNumber",
    "transactionId"
  ];

  requiredFields.forEach(function(field) {
    if (!data[field] || String(data[field]).trim() === "") {
      throw new Error("Champ obligatoire manquant : " + field);
    }
  });
}

function getOrCreateSheet() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty("SPREADSHEET_ID");
  let spreadsheet = null;

  if (spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      properties.deleteProperty("SPREADSHEET_ID");
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    properties.setProperty("SPREADSHEET_ID", spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const defaultSheets = ["Sheet1", "Feuille 1"];
  defaultSheets.forEach(function(defaultName) {
    const defaultSheet = spreadsheet.getSheetByName(defaultName);
    if (defaultSheet && defaultSheet.getName() !== SHEET_NAME && spreadsheet.getSheets().length > 1) {
      spreadsheet.deleteSheet(defaultSheet);
    }
  });

  return sheet;
}

function ensureHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];

  const needsUpdate = HEADERS.some(function(header, index) {
    return currentHeaders[index] !== header;
  });

  if (needsUpdate) {
    headerRange.setValues([HEADERS]);
  }
}

function getNextRegistrationNumber(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return 1;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const numbers = values
    .map(function(value) { return Number(value); })
    .filter(function(value) { return !isNaN(value); });

  if (numbers.length === 0) {
    return 1;
  }

  return Math.max.apply(null, numbers) + 1;
}

function formatSheet(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const lastColumn = HEADERS.length;

  sheet.setFrozenRows(1);

  sheet.getRange(1, 1, 1, lastColumn)
    .setFontWeight("bold")
    .setBackground("#0B1020")
    .setFontColor("#FFFFFF");

  sheet.getRange(1, 1, lastRow, lastColumn)
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle");

  const existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }

  sheet.getRange(1, 1, lastRow, lastColumn).createFilter();
  sheet.autoResizeColumns(1, lastColumn);
  sheet.getRange("B:B").setNumberFormat("dd/mm/yyyy hh:mm:ss");
}

function clean(value) {
  return String(value || "").trim();
}

function jsonResponse(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
