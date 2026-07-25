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

// Identifiant du Google Sheets à utiliser en priorité (celui que tu veux garder).
// Trouvable dans l'URL : https://docs.google.com/spreadsheets/d/**CET_ID**/edit
const TARGET_SPREADSHEET_ID = "1tawu8PH0m3rq5f9tzOcWTxnEfYhLebcMZP7ZrYnuWTI";

// Identifiant du bon onglet dans ce fichier (le "gid" à la fin de l'URL, après #gid=).
const TARGET_SHEET_GID = 635582716;

const HEADERS = [
  "N°",
  "Date d’inscription",
  "Nom complet",
  "WhatsApp",
  "Email",
  "Profil",
  "Pass",
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
      clean(data.pass),
      clean(data.paymentMethod),
      clean(data.paymentNumber),
      clean(data.transactionId),
      clean(data.source || "Neo Consulting - Masterclass IA"),
      "En attente de vérification"
    ];

    sheet.appendRow(row);
    formatSheet(sheet);
    Logger.log("Ligne ajoutée. Sheets : " + sheet.getParent().getUrl());

    if (data.email && String(data.email).trim() !== "") {
      sendConfirmationEmail_(data, registrationNumber);
    }

    return jsonResponse({
      success: true,
      message: "Inscription enregistrée avec succès.",
      registrationNumber: registrationNumber,
      spreadsheetUrl: sheet.getParent().getUrl()
    });

  } catch (error) {
    Logger.log("Erreur doPost : " + error.message);
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
    "pass",
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
  let spreadsheet = null;

  // 1. Priorité absolue : le fichier désigné par l'utilisateur.
  if (TARGET_SPREADSHEET_ID) {
    try {
      spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
      properties.setProperty("SPREADSHEET_ID", TARGET_SPREADSHEET_ID);
    } catch (error) {
      Logger.log("Impossible d'ouvrir TARGET_SPREADSHEET_ID : " + error.message);
    }
  }

  // 2. Repli : le dernier fichier connu via les propriétés du script.
  if (!spreadsheet) {
    const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
    if (spreadsheetId) {
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      } catch (error) {
        properties.deleteProperty("SPREADSHEET_ID");
      }
    }
  }

  // 3. Dernier recours : en créer un nouveau.
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    properties.setProperty("SPREADSHEET_ID", spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  // Si l'onglet "Inscriptions" n'existe pas dans ce fichier, on utilise l'onglet
  // correspondant au gid fourni dans ton URL, pour ne pas créer un onglet vide en double.
  if (!sheet && TARGET_SHEET_GID !== null) {
    sheet = spreadsheet.getSheets().filter(function(s) {
      return s.getSheetId() === TARGET_SHEET_GID;
    })[0] || null;
  }

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

  // Nettoie toute colonne en trop laissée par une version précédente du script
  // (ex : anciens en-têtes "Statut" dupliqués au-delà de la dernière colonne utile).
  const maxColumns = sheet.getMaxColumns();
  if (maxColumns > HEADERS.length) {
    sheet.getRange(1, HEADERS.length + 1, sheet.getMaxRows(), maxColumns - HEADERS.length).clearContent();
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

/**
 * Envoie un email de confirmation formel au participant, avec date, lieu,
 * heure et pass choisi. N'interrompt jamais l'inscription en cas d'échec d'envoi.
 */
function sendConfirmationEmail_(data, registrationNumber) {
  try {
    const subject = "Confirmation de votre inscription — Masterclass IA Neo Consulting";

    const body =
      "Bonjour " + clean(data.fullName) + ",\n\n" +
      "Nous vous confirmons la bonne réception de votre inscription à la Masterclass « Utilise l’IA avant qu’elle te remplace », organisée par Neo Consulting.\n\n" +
      "Voici le récapitulatif de votre inscription (n° " + registrationNumber + ") :\n\n" +
      "— Date : samedi 29 août 2026\n" +
      "— Heure : de 9h à 13h\n" +
      "— Lieu : Ma Casse Eden Medias, Bastos, Yaoundé\n" +
      "   (entre le laboratoire Meka et la résidence du Nigeria, immeuble en face de la Caisse des dépôts et consignations)\n" +
      "— Pass choisi : " + clean(data.pass) + "\n" +
      "— Mode de paiement : " + clean(data.paymentMethod) + "\n" +
      "— ID de transaction transmis : " + clean(data.transactionId) + "\n\n" +
      "Votre paiement est en cours de vérification ; vous recevrez une confirmation définitive par WhatsApp dans les meilleurs délais.\n\n" +
      "Nous vous remercions pour votre confiance et sommes impatients de vous accueillir à cette session.\n\n" +
      "Bien cordialement,\n" +
      "L’équipe Neo Consulting";

    MailApp.sendEmail(clean(data.email), subject, body);
  } catch (error) {
    Logger.log("Erreur envoi email : " + error.message);
  }
}

function jsonResponse(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * DIAGNOSTIC — à exécuter manuellement si le Google Sheets semble introuvable.
 * Affiche dans les logs (icône ⏱️ Exécutions) l'URL exacte du classeur utilisé
 * par le script, et son nombre de lignes actuel.
 */
function getSheetUrl() {
  const sheet = getOrCreateSheet();
  ensureHeaders(sheet);
  Logger.log("URL du Google Sheets : " + sheet.getParent().getUrl());
  Logger.log("Nom du fichier : " + sheet.getParent().getName());
  Logger.log("Nombre de lignes (avec en-tête) : " + sheet.getLastRow());
  Logger.log("Compte Google exécutant le script : " + Session.getActiveUser().getEmail());
}

/**
 * FONCTION DE DIAGNOSTIC — à exécuter manuellement depuis l'éditeur Apps Script
 * (sélectionne "testSetup" dans le menu déroulant à côté du bouton ▶ Exécuter, puis clique dessus).
 *
 * Elle : crée/vérifie le Google Sheets, y ajoute une ligne de test, et t'envoie
 * un email de test à TOI-MÊME (l'adresse du compte Google connecté).
 *
 * La toute première exécution te demandera d'autoriser le script (accès à
 * Google Sheets et à l'envoi d'emails) — c'est normal, accepte les autorisations.
 * Regarde ensuite l'onglet "Exécutions" (icône horloge à gauche) si quelque
 * chose échoue : le message d'erreur exact y sera affiché.
 */
function testSetup() {
  const sheet = getOrCreateSheet();
  ensureHeaders(sheet);

  const testData = {
    fullName: "Test Diagnostic",
    whatsapp: "600000000",
    email: Session.getActiveUser().getEmail(),
    profile: "Autre",
    pass: "Débutant (15 000 FCFA)",
    paymentMethod: "Orange Money",
    paymentNumber: "657163612",
    transactionId: "TEST-0000"
  };

  const registrationNumber = getNextRegistrationNumber(sheet);

  sheet.appendRow([
    registrationNumber,
    new Date(),
    testData.fullName,
    testData.whatsapp,
    testData.email,
    testData.profile,
    testData.pass,
    testData.paymentMethod,
    testData.paymentNumber,
    testData.transactionId,
    "Test diagnostic",
    "Test"
  ]);
  formatSheet(sheet);

  sendConfirmationEmail_(testData, registrationNumber);

  Logger.log("Test terminé. Sheet : " + sheet.getParent().getUrl());
  Logger.log("Email envoyé à : " + testData.email);
}
