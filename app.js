require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const ussdRoutes = require('./routes/ussd');
const webRoutes = require('./routes/web');
const subscriptionRoutes = require('./routes/subscription'); // New

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/ussd', ussdRoutes);
app.use('/web', webRoutes);
app.use('/subscription', subscriptionRoutes); // New

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mlimi Advisor API v2.2 is running!',
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        features: [
            'Weather Forecasts (All 28 districts)',
            'Pest & Disease Advice',
            'Market Prices',
            'Planting Calendar',
            'AI Symptoms Wizard',
            'Global Subscriptions',
            'SMS Alerts & Digests'
        ],
        endpoints: {
            ussd: { main: 'POST /ussd', test: 'GET /ussd' },
            web: {
                price_form: 'GET /web/submit-form',
                submit_price: 'POST /web/submit-price',
                recent_prices: 'GET /web/recent-prices'
            },
            subscription: {
                status: 'GET /subscription/status/:phone',
                subscribe: 'POST /subscription/subscribe',
                unsubscribe: 'POST /subscription/unsubscribe'
            },
            api: { health: 'GET /', version: 'GET /version', docs: 'GET /docs' }
        }
    });
});

// Version endpoint
app.get('/version', (req, res) => {
    res.json({
        name: 'Mlimi Advisor',
        version: '2.2.0',
        description: 'AI-powered USSD Agricultural System for Malawi',
        author: 'Consider Lonjezo',
        features: [
            'AI-powered crop diagnosis',
            'Real-time weather forecasts',
            'Community price submissions',
            'Interactive planting calendar',
            'Global SMS subscriptions',
            'Smart alerts system'
        ]
    });
});

// Cron jobs for scheduled notifications
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily digest job at 8 AM...');
    
    try {
        // Get all active subscribers with digest enabled
        const { data: subscriptions, error } = await supabase
            .from('global_subscriptions')
            .select(`
                farmer_phone,
                notification_preferences(daily_digest_enabled, digest_time)
            `)
            .eq('is_active', true);
        
        if (!error && subscriptions) {
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;
            
            for (const sub of subscriptions) {
                if (sub.notification_preferences && 
                    sub.notification_preferences.daily_digest_enabled &&
                    sub.notification_preferences.digest_time === currentTime) {
                    
                    await SubscriptionService.sendDigest(sub.farmer_phone, 'daily');
                    console.log(`📧 Sent daily digest to ${sub.farmer_phone}`);
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }
    } catch (error) {
        console.error('Error in daily digest cron job:', error);
    }
});

// Weekly summary every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
    console.log('📊 Running weekly summary job...');
    // Implement weekly summary logic
});

// Weather check every 6 hours
cron.schedule('0 */6 * * *', async () => {
    console.log('🌤️ Checking weather for alerts...');
    // Implement weather alert checking logic
});

// Documentation (keep existing)
app.get('/docs', (req, res) => {
    // Keep your existing docs HTML
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Mlimi Advisor API v2.2</title>
        <style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:20px;}
        h1{color:#2E7D32;}.endpoint{background:#f5f5f5;padding:15px;margin:10px 0;border-radius:5px;}
        .method{padding:5px 10px;border-radius:3px;color:white;display:inline-block;}
        .get{background:#4CAF50;}.post{background:#2196F3;}code{background:#eee;padding:2px 5px;}
        </style></head>
        <body>
            <h1>🌾 Mlimi Advisor API v2.2</h1>
            <p><strong>Now with Global Subscriptions & SMS Alerts!</strong></p>
            
            <h2>🚀 New Features</h2>
            <ul>
                <li>📱 Subscribe once, get all alerts</li>
                <li>🌤️ Weather warnings via SMS</li>
                <li>💰 Price change notifications</li>
                <li>⚠️ Disease outbreak alerts</li>
                <li>🌱 Planting season reminders</li>
                <li>📧 Daily/Weekly digests</li>
            </ul>
            
            <h2>USSD Endpoints</h2>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/ussd</code>
                <p>Handle USSD requests from Africa's Talking</p>
            </div>
            
            <h2>Subscription API</h2>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/subscription/subscribe</code>
                <p>Subscribe to all Mlimi Advisor notifications</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span> <code>/subscription/status/:phone</code>
                <p>Check subscription status</p>
            </div>
            
            <footer><p>Mlimi Advisor v2.2 &copy; ${new Date().getFullYear()}</p></footer>
        </body>
        </html>
    `);
});

// Test USSD endpoint
app.get('/ussd', (req, res) => {
    res.json({ 
        message: 'USSD endpoint active. Use POST for Africa\'s Talking.',
        features: 'Now with subscription system!'
    });
});

// Catch-all handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /', 'GET /version', 'GET /docs',
            'GET /ussd', 'POST /ussd',
            'GET /subscription/status/:phone',
            'POST /subscription/subscribe',
            'POST /subscription/unsubscribe'
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
    console.log(`🌱 Mlimi Advisor v2.2 started on port ${PORT}!`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI Services: ${process.env.GROQ_API_KEY ? 'Active' : 'Rule-based'}`);
    console.log(`📱 USSD: http://localhost:${PORT}/ussd`);
    console.log(`🔔 Subscriptions: Active with SMS alerts`);
    console.log(`🕒 Cron jobs: Daily digests at 8 AM`);
    console.log(`🚀 Server ready!`);
});

module.exports = app;