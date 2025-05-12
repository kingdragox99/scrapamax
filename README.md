# Scrapamax

Scrapamax est une application web qui permet de rechercher un mot ou un pseudo sur plusieurs moteurs de recherche simultanément et d'afficher les résultats dans une interface unifiée.

## Fonctionnalités

- Recherche avancée sur Google, Bing, DuckDuckGo, Yandex, Ecosia, Brave et Baidu
- Technique anti-détection avec navigation headless
- Gestion intelligente des CAPTCHA avec détection automatique
- Support pour SmartCaptcha de Yandex
- Système de scoring des résultats (de 1.0 à 5.0) basé sur la présence dans différents moteurs
- Personnalisation des user agents en fonction de la région et de la langue
- Interface utilisateur moderne avec contraste amélioré
- Filtrage des résultats par moteur de recherche
- Historique des recherches avec possibilité de revoir les résultats précédents
- Support multilingue

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
- `scoring.js` - Module de scoring des résultats
- `routes/` - Définition des routes API
- `services/engines/` - Modules spécifiques à chaque moteur de recherche
- `public/` - Fichiers statiques (CSS, JavaScript)
- `views/` - Templates EJS pour le rendu des pages
- `locales/` - Fichiers de traduction pour l'internationalisation

## Détails techniques

Cette application utilise plusieurs techniques avancées pour récupérer les résultats des moteurs de recherche:

- **Puppeteer** - Navigation automatisée avec un navigateur headless
- **Puppeteer-extra et Stealth plugin** - Évite la détection des navigateurs automatisés
- **User-Agent personnalisés** - Adapte l'en-tête User-Agent selon la région et la langue
- **Détection de CAPTCHA** - Interaction avec l'utilisateur pour résoudre les CAPTCHA
- **Délais et pauses aléatoires** - Simule un comportement humain
- **Interactions avec les pages** - Gestion des popups, scrolling et autres actions
- **Contournement des bannières de cookies** - Accepte automatiquement les cookies
- **Normalisation d'URL** - Suppression des paramètres de tracking pour la déduplication des résultats
- **Scoring intelligent** - Évaluation des résultats basée sur leur présence dans différents moteurs

Ces techniques permettent de récupérer les résultats même sur les moteurs qui bloquent normalement le scraping traditionnel.

## Améliorations récentes

- Correction des erreurs lors du traitement des résultats de recherche
- Amélioration du contraste et de la lisibilité de l'interface
- Repositionnement de la notification CAPTCHA pour éviter le chevauchement
- Mise à jour des sélecteurs pour s'adapter aux changements dans les structures HTML des moteurs
- Optimisation du système de scoring des résultats
- Support étendu à Brave et Baidu

## Limitations et considérations

- Les sites peuvent modifier leurs structures HTML, ce qui peut casser les sélecteurs CSS utilisés pour l'extraction
- L'extraction des résultats peut être lente (5-15 secondes par moteur) car elle simule un navigateur complet
- Certains moteurs peuvent toujours détecter et bloquer l'accès malgré les techniques anti-détection
- L'utilisation intensive peut entraîner des restrictions temporaires de votre IP

## Licence

Ce projet est sous licence MIT.

---

_Note: Cette application est conçue à des fins éducatives. Veuillez respecter les conditions d'utilisation des moteurs de recherche et utiliser cette application de manière responsable et éthique xoxo._
