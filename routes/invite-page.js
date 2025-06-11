const express = require('express');
const router = express.Router();
const pool = require('../server.js');

/* 
 * Page d'invitation
 * Cette page est affichée lorsque l'utilisateur clique sur le lien d'invitation dans l'email
 */
router.get('/invite-page', async (req, res) => {
  const getEventName = `SELECT summary FROM events_pending WHERE id = $1`
  const resultGetEventName = await pool.query(getEventName, [req.query.id]);
  const eventName = resultGetEventName.rows[0].summary;
  res.render('invite-page', { user: req.session.user, email: req.query.e, eventId: req.query.id, eventNames : eventName});
});

/*
 * Récupérer les dates de début et de fin d'un événement 
 */
router.get('/startDates:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const getDTSQL = `SELECT dtstart, dtend FROM events_pending WHERE id = $1`;
    const result = await pool.query(getDTSQL, [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
	
})

/* 
 * Accepter l'invitation et mettre à jour la table attendees_pending
 */
router.post('/invite-page/accept', async (req, res) => {
  const {email, eventId, options} = req.body;
  const startDate = options.split("|")[0];
  const endDate = options.split("|")[1];

  try{
    const acceptEvent = `
    UPDATE attendees_pending SET dtstart = $1, dtend = $2 WHERE event_id = $3 AND user_id = (SELECT id FROM users WHERE email = $4);
    `;
    await pool.query(acceptEvent, [startDate, endDate, eventId, email]);
  }catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  res.redirect('/');

});

module.exports = router;