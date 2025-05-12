const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./database");
const searchRoutes = require("./routes/search");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configuration du moteur de template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/api", searchRoutes);

// Route principale
app.get("/", (req, res) => {
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
