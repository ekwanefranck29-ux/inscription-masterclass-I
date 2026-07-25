# Site d’inscription premium IA + Google Sheets automatique

## Fichiers

- `index.html` : page principale
- `Inscription.html` : copie de compatibilité
- `Style.css` : design moderne premium
- `Script.js` : validation + envoi vers Google Sheets
- `Config.js` : URL de ton Google Apps Script
- `GoogleAppsScript-Code.gs` : code à coller dans Google Apps Script
- `README.txt` : instructions

## Ce qui a été ajouté

- Création automatique d’un Google Sheets
- Création automatique de l’onglet `Inscriptions`
- Colonnes classées dans l’ordre :
  1. N°
  2. Date d’inscription
  3. Nom complet
  4. WhatsApp
  5. Email
  6. Profil
  7. Mode de paiement
  8. Numéro de paiement
  9. ID de transaction
  10. Statut
- Numéro d’ordre automatique
- Classement par ordre d’arrivée
- ID de transaction obligatoire
- Statut par défaut : `En attente de vérification`

## Installation Google Sheets

1. Va sur https://script.google.com
2. Clique sur `Nouveau projet`
3. Supprime le code existant
4. Colle tout le contenu du fichier `GoogleAppsScript-Code.gs`
5. Clique sur Enregistrer
6. Clique sur `Déployer` > `Nouveau déploiement`
7. Type : `Application Web`
8. Exécuter en tant que : `Moi`
9. Qui a accès : `Tout le monde`
10. Clique sur `Déployer`
11. Autorise les permissions demandées
12. Copie l’URL qui finit par `/exec`
13. Ouvre `Config.js`
14. Colle l’URL entre les guillemets :

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/TON_ID/exec";

15. Enregistre
16. Ouvre `index.html` et teste une inscription

## Important

Le Google Sheets sera créé automatiquement dans le Google Drive du compte qui déploie le script.
