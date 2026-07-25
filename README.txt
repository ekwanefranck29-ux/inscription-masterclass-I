# Corrections apportées — Neo Consulting

## 1. Confirmation du pass (Débutant / Expert)

Le formulaire d'inscription n'avait aucun emplacement pour choisir le pass
défini pour la Masterclass. Ajouté :
- Un bloc "Confirme ton pass" entre les informations du participant et le
  paiement, avec deux options : Pass Débutant (15 000 FCFA) et Pass Expert
  (20 000 FCFA).
- La colonne "Pass" a été ajoutée au Google Sheets (entre "Profil" et
  "Mode de paiement").
- Le champ est obligatoire, comme les autres.

## 2. Email de confirmation automatique

Aucun email n'était envoyé aux participants. Ajouté dans
GoogleAppsScript-Code.gs :
- Une fonction sendConfirmationEmail_() appelée automatiquement après chaque
  inscription si un email a été renseigné.
- L'email envoyé (via MailApp, natif à Apps Script, gratuit) contient :
  la date (29 août 2026), l'heure (9h-13h), le lieu complet (Ma Casse Eden
  Medias, Bastos, Yaoundé), le pass choisi, le mode de paiement, l'ID de
  transaction transmis, une formule de remerciement et une salutation.
- Un échec d'envoi d'email n'empêche jamais l'inscription d'être enregistrée.

## Étapes pour appliquer la correction

1. Remplace tout le code de ton projet Google Apps Script par le nouveau
   contenu de GoogleAppsScript-Code.gs.
2. Redéploie : Déployer > Gérer les déploiements > Modifier > Nouvelle
   version > Déployer.
3. Remplace inscription.html, Script.js et Style.css par leurs nouvelles
   versions sur ton hébergement (GitHub Pages ou autre).
4. Config.js et index.html n'ont pas changé.
5. Teste une inscription complète avec ta propre adresse email pour vérifier
   que : (a) la ligne apparaît bien dans le Google Sheets avec la colonne
   Pass remplie, et (b) l'email de confirmation arrive bien.

---

(Le reste de ce document, ci-dessous, est le README original du correctif
Google Sheets.)

# Correction Google Sheets — Neo Consulting

## Ce qui a été corrigé

Cette version corrige le problème où :
- les informations ne s’enregistraient pas ;
- le Google Sheets ne se créait pas ;
- GitHub Pages pouvait bloquer la lecture de la réponse Google Apps Script à cause du CORS.

## Fichiers importants

- `index.html` : page de présentation
- `inscription.html` : page d’inscription
- `Style.css` : design du site
- `Script.js` : envoi corrigé vers Google Sheets
- `Config.js` : URL du Google Apps Script
- `GoogleAppsScript-Code.gs` : backend corrigé
- `test-google-sheets.html` : page de test de création du Google Sheets

## Étapes obligatoires

### 1. Remplacer le code Google Apps Script

Va dans Google Apps Script et remplace tout l’ancien code par le contenu de :

`GoogleAppsScript-Code.gs`

Puis clique sur Enregistrer.

### 2. Redéployer le script

Très important : modifier le code ne suffit pas.

Va dans :

Déployer > Gérer les déploiements > Modifier > Nouvelle version > Déployer

Vérifie les paramètres :

- Type : Application Web
- Exécuter en tant que : Moi
- Qui a accès : Tout le monde

Copie l’URL qui se termine par `/exec`.

### 3. Coller l’URL dans Config.js

Dans `Config.js`, remplace :

const GOOGLE_APPS_SCRIPT_URL = "";

par :

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/TON_ID/exec";

### 4. Tester la création du fichier

Ouvre :

`test-google-sheets.html`

Clique sur :

Créer / tester le Google Sheets

Si tout est correct, le Google Sheets sera créé automatiquement dans ton Google Drive.

### 5. Tester le formulaire

Ouvre ensuite :

`inscription.html`

Remplis le formulaire avec un test et valide.

## Colonnes Google Sheets

Le fichier créé s’appellera :

`Inscriptions Masterclass IA - Neo Consulting`

Colonnes :

1. N°
2. Date d’inscription
3. Nom complet
4. WhatsApp
5. Email
6. Profil
7. Mode de paiement
8. Numéro de paiement
9. ID de transaction
10. Source
11. Statut

## Note importante

Avec GitHub Pages, le navigateur peut empêcher le site de lire la réponse de Google Apps Script.
C’est pour cela que cette version utilise `mode: "no-cors"`.
Les données sont envoyées, même si le site affiche un message général au lieu du numéro d’ordre exact.
