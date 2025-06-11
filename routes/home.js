const express = require('express');
const router = express.Router();
const pool = require('../server.js');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('./send-invite.js');

/* Générer un UID pour l'évenement */
function generateRandomUID() {
  const uid = `${uuidv4()}$`;
  return uid;
}

/* Récupérer le format ISO String du temps actuelle de la machine */
function getDTSTAMP() {
  return new Date().toISOString();
}

/* Méthode pour transformer une Date et Time en format ISO String */
function getDT(date, time) {
  return new Date(`${date}T${time}`).toISOString();
}

function isEmail(string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(string);
}


/* Ajouter un évenement
*  Cette méthode ajoute un évenement dans la table events_pending de la base de données 
*/
router.post("/addEvent", async (req, res) => {
  const uid = generateRandomUID();
  const dtstamp = getDTSTAMP();
  let dtstart = "";
  let dtend = "";
  const dates = [].concat(req.body.date);
  const times = [].concat(req.body.time);
  const summary = req.body.summary;
  const description = req.body.description;
  const location = req.body.location;
  const attendees = [].concat(req.body.name);
  const userId = req.session.user.id;

  try {
    const sql = `
    INSERT INTO events_pending (uid, dtstamp, dtstart, dtend, summary, description, location, status, organizer) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;

    dates.forEach((date, index) => {
      if (dtstart !== "") { dtstart += "|"; }
      if (dtend !== "") { dtend += "|"; }
      dtstart += getDT(date, times[2 * index]);
      dtend += getDT(date, times[2 * index + 1]);
    });

    const resINSERT1 = await pool.query(sql, [uid, dtstamp, dtstart, dtend, summary, description, location, "TENTATIVE", userId]);

    const insertAttendeeSql = `
    INSERT INTO attendees_pending (event_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (event_id, user_id) DO NOTHING`;

    const verifyUserExistsSql = `
    SELECT id, email FROM users WHERE username = $1 OR email = $1`;
    attendees.forEach(async (attendee) => {
      const eventId = resINSERT1.rows[0].id; // Get the inserted event ID
      const verifyUserExistsResult = await pool.query(verifyUserExistsSql, [attendee]);
      if (verifyUserExistsResult.rows.length === 0) {
        //Si l'utilisateur n'existe pas, on va vérifier si c'est un email
        if (isEmail(attendee)) {
          //On ajoute l'email dans la table users
          const insertUserSql = `INSERT INTO users (email) VALUES ($1) RETURNING id`;
          const resultInsertUser = await pool.query(insertUserSql, [attendee]);
          await pool.query(insertAttendeeSql, [eventId, resultInsertUser.rows[0].id]);
          sendEmail(attendee, resINSERT1.rows[0].id); // Send email to the new user
        }
        //Sinon, on ne fait rien
        else {
          console.log(`User ${attendee} does not exist and is not an email`);
        }
        return;
      }
      const attendeeId = verifyUserExistsResult.rows[0].id; 
      if (attendeeId != userId){
        await pool.query(insertAttendeeSql, [eventId, attendeeId]);
        sendEmail(verifyUserExistsResult.rows[0].email, resINSERT1.rows[0].id); 
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  res.redirect("/");
});


/* Récupérer les evenements */
router.get("/events", async (req, res) => {
  try {
    const sql = `
    SELECT DISTINCT uid, dtstamp, dtstart, dtend,summary, description, location, status, organizer 
    FROM events e JOIN attendees a ON a.event_id = e.id WHERE a.user_id = $1 OR e.organizer = $1 ORDER BY dtstamp DESC;
    `;
    const result = await pool.query(sql, [req.session.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* Récupérer les evenements pending */
router.get("/pending-events", async (req, res) => {
  try {
    const sql = `
    SELECT DISTINCT e.id, uid, dtstamp, e.dtstart, e.dtend,summary, description, location, status, organizer 
    FROM events_pending e JOIN attendees_pending a ON a.event_id = e.id WHERE a.user_id = $1 OR e.organizer = $1 ORDER BY dtstamp DESC;
    `;
    const result = await pool.query(sql, [req.session.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* Récupérer l'user_id de l'utilisateur */
router.get("/user-id", (req, res) => {
  if (req.session.user) {
    return res.json({ id: req.session.user.id });
  }
  res.status(401).json({ error: "Not logged in" });
});


/* 
 * Cette méthode est appélée lorsque l'utilisateur accepte l'évenement en choisisant un créneau
 * Elle va mettre à jour la table attendees_pending en ajoutant les dates de début et de fin  
 */
router.post("/accept-event", async (req, res) => {
  const { eventId, userId, dtstart_dtend } = req.body;

  try {
    const sql = `UPDATE attendees_pending SET dtstart = $1, dtend = $2 WHERE event_id = $3 AND user_id = $4;`;
    await pool.query(sql, [dtstart_dtend.split("|")[0], dtstart_dtend.split("|")[1], eventId, userId]);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }

  res.json({ status: "success", eventId: eventId, userId: userId, dtstart_dtend: dtstart_dtend });
});

/* Confirmer l'évenements
*  Cette méthode est appélée lorsque l'organisateur de l'évenement confirme l'évenement.
*  Elle va chercher l'évenement dans la table events_pending et le déplace dans la table events et
*  elle va aussi déplacer les participants de la table attendees_pending vers la table attendees.
*/

router.post("/confirm-event", async (req, res) => {
  const { eventId } = req.body;


  try {
    const getEvent = `SELECT * FROM events_pending WHERE id = $1;`;
    const resultGetEvent = await pool.query(getEvent, [eventId]);

    const countAttendees =
      `
    SELECT dtstart, dtend, 
    COUNT(*) as count 
    FROM attendees_pending 
    WHERE event_id = $1 AND dtstart IS NOT NULL AND dtend IS NOT NULL  
    GROUP BY dtstart, dtend 
    ORDER BY count 
    DESC LIMIT 1;`;
    const resultCountAttendees = await pool.query(countAttendees, [eventId]);

    if (resultCountAttendees.rows.length === 0) {
      console.log("No attendees found for the event.");
      return res.json({ status: "error", message: "No attendees found for the event." });
    }


    const insertHigestCount = `
      INSERT INTO events (uid, dtstamp, dtstart, dtend, summary, description, location, status, organizer) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;
    const resultInsertHigestCount = await pool.query(insertHigestCount,
      [resultGetEvent.rows[0].uid,
      resultGetEvent.rows[0].dtstamp,
      resultCountAttendees.rows[0].dtstart,
      resultCountAttendees.rows[0].dtend, resultGetEvent.rows[0].summary,
      resultGetEvent.rows[0].description, resultGetEvent.rows[0].location,
        "CONFIRMED",
      resultGetEvent.rows[0].organizer]);

    const getAttendeesPending = `SELECT user_id FROM attendees_pending WHERE event_id = $1;`;
    const resultGetAttendeesPending = await pool.query(getAttendeesPending, [eventId]);

    resultGetAttendeesPending.rows.forEach(async (attendee) => {
      const insertAttendees = `
      INSERT INTO attendees (event_id, user_id)
      VALUES ($1, $2);`;
      await pool.query(insertAttendees, [resultInsertHigestCount.rows[0].id, attendee.user_id]);
    });

    const deleteEvent = `DELETE FROM attendees_pending WHERE event_id = $1;`;
    await pool.query(deleteEvent, [eventId]);

  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  return res.redirect("/");
});


module.exports = router;