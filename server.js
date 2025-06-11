const express = require("express");
const session = require("express-session");
const fs = require('fs');
const path = require('path');
const pg = require("pg");
require('dotenv').config();

const pool = new pg.Pool({
  port: process.env.PG_PORT,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
});
module.exports = pool;

/* 
 * Méthode pour créer la base de données et la table 'users' si elle n'existe pas déjà.
 * La méthode lit le fichier SQL 'create.database.sql' et exécute la requête pour créer la table.
 */
async function createDatabase() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'create.database.sql'), 'utf8');
    await pool.query(sql);
    console.log("Database créee et table 'users' créée avec succès !");
  } catch (err) {
    console.error("Erreur createDatabase() :", err.message);
  }
}
createDatabase();

const app = express();
app.set('view engine', 'ejs')
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: "notreProjetEstExcellent",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.json()); 

/* Homepage */
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.sendFile(path.join(__dirname, "views", "index.html"));
  }

  res.render("home", { user: req.session.user });
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("login");
});

app.get("/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("signup");
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send(`Error logging out : ${err.message}`);
    }
    
    res.redirect("/login");
  });
});

app.post("/login", async (req, res) => {
  let { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      return res.render("login", { error: "User not found. Please sign up." });
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return res.render("login", { error: "Incorrect password. Try again." });
    }
    
    console.log("User successfully loged in with id: ", result.rows[0].id);
    req.session.user = user;

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error signing up : ${error.message}`);
  }
});

app.post("/signup", async (req, res) => {
  let { username, password } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, password]
    );
    
    console.log(`User successfully signed up with id: ${result.rows[0].id}`);
    res.redirect("login");
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error signing up : ${error.message}`);
  }
});



app.use("/", require("./routes/home.js"));
app.use("/", require("./routes/invite-page.js"));
app.use("/", require("./routes/ics.js"));

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Listening on " + port);
});

module.exports = app;