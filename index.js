const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./database");
const searchRoutes = require("./routes/search");
const i18n = require("i18n-express");
const i18nUtils = require("./locales");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser()); // Middleware to handle cookies

// Configuration de i18n
app.use(
  i18n({
    translationsPath: path.join(__dirname, "locales"),
    siteLangs: ["en", "fr"],
    textsVarName: "i18n",
    defaultLang: "en", // langue par défaut
    cookieLangName: "language", // cookie pour stocker la langue
  })
);

// Middleware pour définir des variables globales pour les vues
app.use((req, res, next) => {
  // Fonctions i18n pour les templates
  res.locals.t = (key, replacements = {}) => i18nUtils.t(key, replacements);
  res.locals.getCurrentLanguage = i18nUtils.getCurrentLanguage;
  res.locals.getAvailableLanguages = i18nUtils.getAvailableLanguages;
  next();
});

// Configuration du moteur de template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/api", searchRoutes);

// Route pour changer de langue
app.get("/language/:lang", (req, res) => {
  const lang = req.params.lang;
  if (i18nUtils.setLanguage(lang)) {
    res.cookie("language", lang, { maxAge: 365 * 24 * 60 * 60 * 1000 }); // Cookie valide 1 an
  }
  // Rediriger vers la page précédente ou la page d'accueil
  res.redirect(req.headers.referer || "/");
});

// Route principale
app.get("/", (req, res) => {
  // Initialiser la langue depuis le cookie
  const lang = req.cookies.language || "en";
  i18nUtils.setLanguage(lang);

  res.render("index");
});

// Initialiser la base de données et démarrer le serveur
db.initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "Erreur lors de l'initialisation de la base de données:",
      err
    );
  });
