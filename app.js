// app.js - COMPLETE PRODUCTION VERSION
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ussdRoutes = require('./routes/ussd');
const webRoutes = require('./routes/web');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/ussd', ussdRoutes);
app.use('/web', webRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mlimi Advisor API v2.1 is running!',
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        features: [
            'Weather Forecasts (All 28 districts)',
            'Pest & Disease Advice',
            'Market Prices',
            'Planting Calendar',
            'AI Symptoms Wizard',
            'Web Price Submission'
        ],
        endpoints: {
            ussd: { main: 'POST /ussd', test: 'GET /ussd' },
            web: {
                price_form: 'GET /web/submit-form',
                submit_price: 'POST /web/submit-price',
                recent_prices: 'GET /web/recent-prices'
            },
            api: { health: 'GET /', version: 'GET /version', docs: 'GET /docs' }
        }
    });
});

// Version endpoint
app.get('/version', (req, res) => {
    res.json({
        name: 'Mlimi Advisor',
        version: '2.1.0',
        description: 'AI-powered USSD Agricultural System for Malawi',
        author: 'Consider Lonjezo',
        features: [
            'AI-powered crop diagnosis',
            'Real-time weather forecasts',
            'Community price submissions',
            'Interactive planting calendar',
            'Multi-page USSD navigation'
        ]
    });
});

// Documentation
app.get('/docs', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Mlimi Advisor API</title>
        <style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:20px;}
        h1{color:#2E7D32;}.endpoint{background:#f5f5f5;padding:15px;margin:10px 0;border-radius:5px;}
        .method{padding:5px 10px;border-radius:3px;color:white;display:inline-block;}
        .get{background:#4CAF50;}.post{background:#2196F3;}code{background:#eee;padding:2px 5px;}
        </style></head>
        <body>
            <h1>🌾 Mlimi Advisor API v2.1</h1>
            <p><strong>AI-powered agricultural platform for Malawi</strong></p>
            
            <h2>USSD Endpoints</h2>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/ussd</code>
                <p>Handle USSD requests from Africa's Talking</p>
            </div>
            
            <h2>Web Interface</h2>
            <div class="endpoint">
                <span class="method get">GET</span> <code>/web/submit-form</code>
                <p>Web form for farmers to submit market prices</p>
                <p><a href="/web/submit-form">Access form</a></p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span> <code>/</code>
                <p>Health check and API information</p>
            </div>
            
            <h2>Features</h2>
            <ul>
                <li>🤖 AI-powered crop diagnosis</li>
                <li>🌤️ Real weather for 28 districts</li>
                <li>💰 Community price submissions</li>
                <li>📅 Planting calendar</li>
                <li>📱 USSD for basic phones</li>
                <li>🌐 Web interface for data</li>
            </ul>
            
            <footer><p>Mlimi Advisor &copy; ${new Date().getFullYear()}</p></footer>
        </body>
        </html>
    `);
});

// Test USSD endpoint
app.get('/ussd', (req, res) => {
    res.json({ 
        message: 'USSD endpoint active. Use POST for Africa\'s Talking.',
        example: {phoneNumber: '+265991234567', sessionId: 'test', text: ''}
    });
});

// Catch-all handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /', 'GET /version', 'GET /docs',
            'GET /ussd', 'POST /ussd',
            'GET /web/submit-form', 'POST /web/submit-price', 'GET /web/recent-prices'
        ]
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('❌ Server Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 Mlimi Advisor v2.1 started on port ${PORT}!`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI Services: ${process.env.GROQ_API_KEY ? 'Active' : 'Rule-based'}`);
    console.log(`📱 USSD: http://localhost:${PORT}/ussd`);
    console.log(`🌐 Web: http://localhost:${PORT}/web/submit-form`);
    console.log(`🚀 Server ready!`);
});

module.exports = app;