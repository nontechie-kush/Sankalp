const express = require('express');
const router = express.Router();
const path = require('path');

// Home / app shell — serves the single-page app
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// All screen routes fall through to the SPA shell
['rituals', 'bookings', 'profile', 'book/:ritualKey?'].forEach(route => {
  router.get('/' + route, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
});

module.exports = router;
