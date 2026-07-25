/**
 * Google Apps Script — Backend Neo Consulting
 *
 * Fonctionnalités :
 * - crée automatiquement un Google Sheets ;
 * - crée l’onglet "Inscriptions" ;
 * - enregistre les inscriptions par ordre d’arrivée ;
 * - ajoute le type de pass et le montant ;
 * - envoie un mail de confirmation inspiré du flyer si l’email est renseigné.
 */

const SPREADSHEET_NAME = "Inscriptions Masterclass IA - Neo Consulting";
const SHEET_NAME = "Inscriptions";

const EVENT_TITLE = "Masterclass IA — Neo Consulting";
const EVENT_DATE = "Samedi 29 Août 2026";
const EVENT_TIME = "9h à 13h";
const EVENT_LOCATION = "Ma case EDEN MEDIAS, Bastos — Yaoundé";
const EVENT_CONTACT = "+237 657 163 612";

const HEADERS = [
  "N°",
  "Date d’inscription",
  "Nom complet",
  "WhatsApp",
  "Email",
  "Profil",
  "Type de pass",
  "Montant",
  "Mode de paiement",
  "Numéro de paiement",
  "ID de transaction",
  "Source",
  "Statut",
  "Email envoyé"
];

function doPost(e) {
  try {
    const data = parseRequestData(e);
    validateData(data);

    const sheet = getOrCreateSheet();
    ensureHeaders(sheet);

    const registrationNumber = getNextRegistrationNumber(sheet);
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

    let emailStatus = "Non renseigné";

    if (data.email && String(data.email).trim() !== "") {
      sendConfirmationEmail(data, registrationNumber);
      emailStatus = "Envoyé";
    }

    const row = [
      registrationNumber,
      createdAt,
      clean(data.fullName),
      clean(data.whatsapp),
      clean(data.email || ""),
      clean(data.profile),
      clean(data.passType),
      clean(data.passPrice),
      clean(data.paymentMethod),
      clean(data.paymentNumber),
      clean(data.transactionId),
      clean(data.source || "Neo Consulting - Masterclass IA"),
      "En attente de vérification",
      emailStatus
    ];

    sheet.appendRow(row);
    formatSheet(sheet);

    return jsonResponse({
      success: true,
      message: "Inscription enregistrée avec succès.",
      registrationNumber: registrationNumber,
      spreadsheetUrl: sheet.getParent().getUrl(),
      emailStatus: emailStatus
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

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {}
  }

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
    "passType",
    "passPrice",
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

function sendConfirmationEmail(data, registrationNumber) {
  const subject = "Confirmation d’inscription — Masterclass IA Neo Consulting";

  const htmlBody = buildConfirmationEmail(data, registrationNumber);

  MailApp.sendEmail({
    to: clean(data.email),
    subject: subject,
    htmlBody: htmlBody,
    name: "Neo Consulting"
  });
}

function buildConfirmationEmail(data, registrationNumber) {
  const fullName = escapeHtml(data.fullName);
  const whatsapp = escapeHtml(data.whatsapp);
  const email = escapeHtml(data.email || "");
  const profile = escapeHtml(data.profile);
  const passType = escapeHtml(data.passType);
  const passPrice = escapeHtml(data.passPrice);
  const paymentMethod = escapeHtml(data.paymentMethod);
  const transactionId = escapeHtml(data.transactionId);

  return `
  <div style="margin:0;padding:0;background:#2b2430;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <div style="max-width:680px;margin:0 auto;padding:28px 18px;">

      <div style="background:linear-gradient(135deg,#3a303f,#1f1a24);border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);">

        <div style="padding:34px 28px 24px;">
          <div style="display:inline-block;padding:8px 14px;border:2px solid #f2bd2f;border-radius:999px;color:#f2bd2f;font-weight:700;font-size:14px;margin-bottom:22px;">
            Fais partie de l’aventure !
          </div>

          <h1 style="margin:0;font-size:42px;line-height:1.05;color:#ffe8d6;font-weight:900;">
            Utilise l’IA<br>
            Avant qu’elle<br>
            Te remplace
          </h1>

          <p style="font-size:18px;line-height:1.6;color:#f5f0ea;margin-top:22px;">
            Bonjour <strong>${fullName}</strong>,
          </p>

          <p style="font-size:16px;line-height:1.7;color:#f5f0ea;">
            Ton inscription à la masterclass IA de <strong>Neo Consulting</strong> a bien été reçue.
            Cette formation te donnera les clés pour mieux utiliser l’IA dans tes publications, ton travail, tes idées et tes projets.
          </p>
        </div>

        <div style="margin:0 28px 24px;padding:24px;background:rgba(0,0,0,0.35);border-radius:22px;border:1px solid rgba(255,255,255,0.08);">
          <h2 style="margin:0 0 16px;color:#f2bd2f;font-size:28px;font-family:Georgia,serif;font-weight:400;">
            Au programme
          </h2>

          <p style="margin:8px 0;color:#ffffff;font-size:15px;"><strong>Module 1 :</strong> comprendre l’IA sans jargon</p>
          <p style="margin:8px 0;color:#ffffff;font-size:15px;"><strong>Module 2 :</strong> savoir communiquer avec l’IA</p>
          <p style="margin:8px 0;color:#ffffff;font-size:15px;"><strong>Module 3 :</strong> les cas d’usage qui changent le quotidien</p>
          <p style="margin:8px 0;color:#ffffff;font-size:15px;"><strong>Module 4 :</strong> construire son avantage avec l’IA</p>
        </div>

        <div style="padding:0 28px 24px;">
          <div style="display:grid;gap:14px;">

            <div style="padding:18px;background:#ffffff;border-radius:20px;color:#251d27;">
              <p style="margin:0;font-size:14px;color:#7a6f7f;">Date & heure</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:900;">
                ${EVENT_DATE} — de ${EVENT_TIME}
              </p>
            </div>

            <div style="padding:18px;background:#ffffff;border-radius:20px;color:#251d27;">
              <p style="margin:0;font-size:14px;color:#7a6f7f;">Lieu</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:900;">
                ${EVENT_LOCATION}
              </p>
            </div>

            <div style="padding:18px;background:#6e1014;border-radius:20px;color:#ffffff;">
              <p style="margin:0;font-size:14px;color:#ff9aa2;">Ton pass</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:900;">
                ${passType} : ${passPrice}
              </p>
            </div>

          </div>
        </div>

        <div style="margin:0 28px 24px;padding:20px;background:rgba(242,189,47,0.12);border:1px solid rgba(242,189,47,0.35);border-radius:22px;">
          <h3 style="margin:0 0 12px;color:#f2bd2f;font-size:20px;">
            Détails de ton inscription
          </h3>

          <p style="margin:7px 0;color:#ffffff;"><strong>N° d’ordre :</strong> ${registrationNumber}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>Nom :</strong> ${fullName}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>WhatsApp :</strong> ${whatsapp}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>Email :</strong> ${email}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>Profil :</strong> ${profile}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>Pass :</strong> ${passType} — ${passPrice}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>Mode de paiement :</strong> ${paymentMethod}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>ID de transaction :</strong> ${transactionId}</p>
          <p style="margin:7px 0;color:#ffffff;"><strong>Statut :</strong> En attente de vérification</p>
        </div>

        <div style="padding:0 28px 32px;">
          <p style="font-size:15px;line-height:1.7;color:#f5f0ea;">
            Ton inscription sera définitivement confirmée après vérification du paiement.
            Garde bien ton ID de transaction, il pourra être demandé à l’entrée.
          </p>

          <div style="margin-top:22px;padding:18px;background:#ffffff;border-radius:999px;text-align:center;color:#251d27;font-weight:900;">
            Pour plus d’informations : ${EVENT_CONTACT}
          </div>

          <p style="margin-top:24px;font-size:14px;line-height:1.6;color:#cfc4d6;text-align:center;">
            Neo Consulting<br>
            IA • Business • Digital
          </p>
        </div>

      </div>
    </div>
  </div>`;
}

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
