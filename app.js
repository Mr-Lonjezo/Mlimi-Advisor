// app.js - PRODUCTION VERSION
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ussdRoutes = require('./routes/ussd');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - IMPORTANT: Africa's Talking sends form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Changed to true for Africa's Talking

// Routes
app.use('/ussd', ussdRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mlimi Advisor API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test USSD endpoint with GET (for debugging)
app.get('/ussd', (req, res) => {
    res.json({ 
        message: 'USSD endpoint is active. Use POST method for USSD requests.',
        example: 'Send POST request with {phoneNumber, sessionId, text}'
    });
});

// Error handling
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        availableEndpoints: ['GET /', 'POST /ussd']
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 Mlimi Advisor Server started on port ${PORT}!`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;