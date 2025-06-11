const express = require('express');
const router = express.Router();
const pool = require('../server.js');
const fs = require('fs');
const ical = require('node-ical');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })

function isICSFile(filename) {
    return path.extname(filename).toLowerCase() === '.ics';
}

router.post('/ics', upload.single('ics'), (req, res) => {   
  console.log("ICS route");
  console.log(req.file);
  const file = req.file;

  if (!file) {
    return;
  }

  if (!isICSFile(file.originalname)) {
    console.error('Error: File extension is not .ics');
    return;
  }
  console.log('File uploaded successfully:', file.originalname);

  res.redirect(`/ics/${file.originalname}`);
});

router.get('/ics/:filename', (req, res) => {
  const filename = req.params.filename;
  const data = fs.readFileSync(path.join(__dirname, '../uploads', filename), 'utf8');
  const events = ical.parseICS(data);
  let dtstart = [];
  let dtend = [];

  for (const key in events) {
    if (events[key].type === 'VEVENT') {
      dtstart.push(events[key].start.toISOString().substring(0, 19)+'Z');
      dtend.push(events[key].end.toISOString().substring(0, 19)+'Z');
    }
  }

  res.json({
    dtstart: dtstart,
    dtend: dtend,
  });
});

module.exports = router;