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
