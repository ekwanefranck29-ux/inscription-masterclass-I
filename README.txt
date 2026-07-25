# Neo Consulting — Site complet avec Google Sheets + mail automatique

## Nouveautés intégrées

Cette version contient :

- Page de présentation : `index.html`
- Page d’inscription : `inscription.html`
- Choix du pass :
  - Pass Débutant — 15 000 FCFA
  - Pass Expert — 20 000 FCFA
- Paiement :
  - Orange Money : 6 57 16 36 12
  - MTN MoMo : 6 80 06 34 91
- ID de transaction obligatoire
- Enregistrement automatique dans Google Sheets
- Création automatique du fichier Google Sheets
- Mail automatique de confirmation si l’email est renseigné
- Design du mail inspiré du flyer
- Page de test : `test-google-sheets.html`

## Informations utilisées dans le mail

- Titre : Utilise l’IA avant qu’elle ne te remplace
- Date : Samedi 29 Août 2026
- Heure : 9h à 13h
- Lieu : Ma case EDEN MEDIAS, Bastos — Yaoundé
- Pass Débutant : 15 000 FCFA
- Pass Expert : 20 000 FCFA
- Contact : +237 657 163 612

## Colonnes Google Sheets

1. N°
2. Date d’inscription
3. Nom complet
4. WhatsApp
5. Email
6. Profil
7. Type de pass
8. Montant
9. Mode de paiement
10. Numéro de paiement
11. ID de transaction
12. Source
13. Statut
14. Email envoyé

## Installation obligatoire

### 1. Mettre à jour Google Apps Script

Dans Google Apps Script :

1. Ouvre ton projet.
2. Remplace tout l’ancien code par le contenu de `GoogleAppsScript-Code.gs`.
3. Clique sur Enregistrer.

### 2. Redéployer

Très important : il faut redéployer une nouvelle version.

Va dans :

Déployer > Gérer les déploiements > Modifier > Nouvelle version > Déployer

Paramètres :

- Exécuter en tant que : Moi
- Qui a accès : Tout le monde

Copie l’URL qui se termine par `/exec`.

### 3. Coller l’URL dans Config.js

Dans `Config.js`, remplace :

const GOOGLE_APPS_SCRIPT_URL = "";

par :

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/TON_ID/exec";

### 4. Tester

1. Ouvre `test-google-sheets.html` pour vérifier que le Google Sheets se crée.
2. Ouvre `inscription.html`.
3. Fais une inscription test avec une vraie adresse email.
4. Vérifie :
   - le Google Sheets ;
   - la boîte email utilisée pour le test ;
   - éventuellement les spams/promotions.

## Important

Le mail est envoyé uniquement si le champ email est renseigné.

Avec GitHub Pages, le site envoie les données en `no-cors`. Cela permet l’envoi vers Apps Script, mais le navigateur ne peut pas toujours lire la réponse exacte du serveur.
