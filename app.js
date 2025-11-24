// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const ussdRoutes = require('./routes/ussd');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// USSD routes
app.use('/ussd', ussdRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mlimi Advisor API is running!',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌱 Mlimi Advisor Server started!`);
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}`);
    console.log(`📞 USSD endpoint: http://localhost:${PORT}/ussd`);
});

module.exports = app;