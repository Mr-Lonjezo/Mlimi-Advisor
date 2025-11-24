const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');

// Handle USSD requests
router.post('/', ussdController.handleUSSD);

module.exports = router;