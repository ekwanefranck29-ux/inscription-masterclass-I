/**
 * Google Apps Script — Backend du formulaire d’inscription
 *
 * Rôle :
 * 1. Crée automatiquement un Google Sheets s’il n’existe pas encore.
 * 2. Crée l’onglet "Inscriptions".
 * 3. Ajoute les colonnes dans le bon ordre.
 * 4. Enregistre chaque inscription par ordre d’arrivée.
 * 5. Ajoute un numéro d’ordre automatique.
 *
 * Déploiement :
 * - Extensions > Apps Script
 * - Coller ce code
 * - Déployer > Nouveau déploiement > Application Web
 * - Exécuter en tant que : Moi
 * - Qui a accès : Tout le monde
 * - Copier l’URL /exec dans Config.js
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
    const data = JSON.parse(e.postData.contents || "{}");

    validateData(data);

    const sheet = getOrCreateSheet();
    ensureHeaders(sheet);

    const lastRow = sheet.getLastRow();
    const registrationNumber = Math.max(1, lastRow);

    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

    const row = [
      registrationNumber,
      createdAt,
      data.fullName,
      data.whatsapp,
      data.email || "",
      data.profile,
      data.paymentMethod,
      data.paymentNumber,
      data.transactionId,
      data.source || "Neo Consulting - Masterclass IA",
      "En attente de vérification"
    ];

    sheet.appendRow(row);
    sortSheetByRegistrationNumber(sheet);
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
    message: "Google Sheets Neo Consulting prêt.",
    spreadsheetUrl: sheet.getParent().getUrl()
  });
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
  let spreadsheet;

  if (spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      spreadsheet = null;
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

  const defaultSheet = spreadsheet.getSheetByName("Sheet1") || spreadsheet.getSheetByName("Feuille 1");
  if (defaultSheet && defaultSheet.getName() !== SHEET_NAME && spreadsheet.getSheets().length > 1) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  return sheet;
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const isHeaderMissing = currentHeaders.join("").trim() === "";

  if (isHeaderMissing) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const needsUpdate = HEADERS.some(function(header, index) {
    return currentHeaders[index] !== header;
  });

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function sortSheetByRegistrationNumber(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow <= 2) {
    return;
  }

  const range = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  range.sort({ column: 1, ascending: true });
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

  sheet.getRange(1, 1, lastRow, lastColumn).createFilter();

  sheet.autoResizeColumns(1, lastColumn);

  sheet.getRange("B:B").setNumberFormat("dd/mm/yyyy hh:mm:ss");
}

function jsonResponse(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
