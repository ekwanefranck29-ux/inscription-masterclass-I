# Site Neo Consulting — Masterclass IA

## Structure

Le site est maintenant divisé en deux pages :

- `index.html` : page de présentation de la formation
- `inscription.html` : page dédiée au formulaire, au paiement et à l’ID de transaction

## Identité

Identité principale du site : `Neo Consulting`.

## Google Sheets

Le script crée automatiquement un fichier nommé :

`Inscriptions Masterclass IA - Neo Consulting`

Les colonnes sont classées dans cet ordre :

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

## Déploiement GitHub Pages

1. Déploie d’abord `GoogleAppsScript-Code.gs` comme application Web.
2. Copie l’URL `/exec`.
3. Colle-la dans `Config.js`.
4. Envoie tous les fichiers décompressés sur GitHub.
5. Active GitHub Pages depuis `Settings > Pages`.
6. Le site ouvrira `index.html`, et le bouton d’inscription mènera vers `inscription.html`.
