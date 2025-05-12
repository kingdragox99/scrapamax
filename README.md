# Scrapamax

Scrapamax est une application web qui permet de rechercher un mot ou un pseudo sur plusieurs moteurs de recherche simultanément et d'afficher les résultats dans une interface unifiée.

## Fonctionnalités

- Recherche avancée sur Google, Bing, DuckDuckGo, Yandex et Ecosia
- Technique anti-détection avec navigation headless
- Stockage des résultats dans une base de données SQLite
- Interface utilisateur moderne et réactive
- Filtrage des résultats par moteur de recherche
- Historique des recherches avec possibilité de revoir les résultats précédents

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Chromium/Chrome (installé automatiquement avec Puppeteer)

## Installation

1. Clonez ce dépôt:

```
git clone https://github.com/votre-utilisateur/scrapamax.git
cd scrapamax
```

2. Installez les dépendances:

```
npm install
```

3. Démarrez l'application:

```
npm start
```

L'application sera accessible à l'adresse http://localhost:3000

## Développement

Pour exécuter l'application en mode développement (avec rechargement automatique):

```
npm run dev
```

## Structure du projet

- `index.js` - Point d'entrée de l'application
- `database.js` - Gestion de la base de données SQLite
- `routes/` - Définition des routes API
- `services/` - Services pour interroger les moteurs de recherche
- `public/` - Fichiers statiques (CSS, JavaScript)
- `views/` - Templates EJS pour le rendu des pages

## Détails techniques

Cette application utilise plusieurs techniques avancées pour récupérer les résultats des moteurs de recherche:

- **Puppeteer** - Navigation automatisée avec un navigateur headless
- **Puppeteer-extra et Stealth plugin** - Évite la détection des navigateurs automatisés
- **User-Agent aléatoire** - Change l'en-tête User-Agent à chaque requête
- **Délais et pauses aléatoires** - Simule un comportement humain
- **Interactions avec les pages** - Gestion des popups, scrolling et autres actions
- **Contournement des bannières de cookies** - Accepte automatiquement les cookies

Ces techniques permettent de récupérer les résultats même sur les moteurs qui bloquent normalement le scraping traditionnel.

## Limitations et considérations

- Les sites peuvent modifier leurs structures HTML, ce qui peut casser les sélecteurs CSS utilisés pour l'extraction
- L'extraction des résultats peut être lente (5-15 secondes par moteur) car elle simule un navigateur complet
- Certains moteurs peuvent toujours détecter et bloquer l'accès malgré les techniques anti-détection
- L'utilisation intensive peut entraîner des restrictions temporaires de votre IP

## Licence

Ce projet est sous licence MIT.

---

_Note: Cette application est conçue à des fins éducatives. Veuillez respecter les conditions d'utilisation des moteurs de recherche et utiliser cette application de manière responsable et éthique._
