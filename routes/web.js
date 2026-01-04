// routes/web.js - Web Interface Routes
const express = require('express');
const router = express.Router();
const webInterfaceService = require('../services/webInterfaceService');

// Enable CORS for web forms
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Submit market price (POST)
router.post('/submit-price', async (req, res) => {
    try {
        const result = await webInterfaceService.submitMarketPrice(req.body);
        
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Web route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get recent submissions (GET) - API endpoint
router.get('/recent-prices', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const result = await webInterfaceService.getRecentSubmissions(limit);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Web route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get market statistics
router.get('/market-stats', async (req, res) => {
    try {
        const result = await webInterfaceService.getMarketStatistics();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Web route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Search prices
router.get('/search-prices', async (req, res) => {
    try {
        const { crop, market, region, quality, startDate, endDate } = req.query;
        const result = await webInterfaceService.searchPrices({
            crop, market, region, quality, startDate, endDate
        });
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Web route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// WEB PAGES
// ============================================

// Home page
router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mlimi Advisor - Malawi Crop Market Prices</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    color: #333;
                    line-height: 1.6;
                }
                
                .navbar {
                    background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
                    color: white;
                    padding: 1rem 2rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                
                .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-decoration: none;
                    color: white;
                }
                
                .nav-links {
                    display: flex;
                    gap: 2rem;
                    align-items: center;
                }
                
                .nav-links a {
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.3s;
                }
                
                .nav-links a:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .hero {
                    background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80');
                    background-size: cover;
                    background-position: center;
                    color: white;
                    text-align: center;
                    padding: 6rem 2rem;
                    margin-bottom: 3rem;
                }
                
                .hero-content {
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .hero h1 {
                    font-size: 3.5rem;
                    margin-bottom: 1rem;
                    background: linear-gradient(to right, #4CAF50, #8BC34A);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .hero p {
                    font-size: 1.2rem;
                    opacity: 0.9;
                    margin-bottom: 2rem;
                }
                
                .cta-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .btn {
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
                }
                
                .btn-secondary {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 2px solid rgba(255,255,255,0.2);
                }
                
                .btn-secondary:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .features {
                    max-width: 1200px;
                    margin: 0 auto 4rem;
                    padding: 0 2rem;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }
                
                .feature-card {
                    background: white;
                    border-radius: 15px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    transition: transform 0.3s;
                }
                
                .feature-card:hover {
                    transform: translateY(-5px);
                }
                
                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .feature-card h3 {
                    color: #2E7D32;
                    margin-bottom: 1rem;
                }
                
                .feature-card p {
                    color: #666;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }
                
                .section-title {
                    text-align: center;
                    margin: 4rem 0 2rem;
                    color: #2E7D32;
                    font-size: 2.5rem;
                }
                
                .footer {
                    background: #2E7D32;
                    color: white;
                    padding: 3rem 2rem;
                    margin-top: 4rem;
                    text-align: center;
                }
                
                .footer-links {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }
                
                .footer-links a {
                    color: white;
                    text-decoration: none;
                    opacity: 0.8;
                    transition: opacity 0.3s;
                }
                
                .footer-links a:hover {
                    opacity: 1;
                }
                
                @media (max-width: 768px) {
                    .hero h1 {
                        font-size: 2.5rem;
                    }
                    
                    .nav-container {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .nav-links {
                        gap: 1rem;
                    }
                    
                    .cta-buttons {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .btn {
                        width: 100%;
                        max-width: 300px;
                        justify-content: center;
                    }
                }
            </style>
        </head>
        <body>
            <nav class="navbar">
                <div class="nav-container">
                    <a href="/web" class="logo">
                        <span>🌾</span>
                        <span>Mlimi Advisor</span>
                    </a>
                    <div class="nav-links">
                        <a href="/web">Home</a>
                        <a href="/web/view-prices">View Prices</a>
                        <a href="/web/submit-form">Submit Price</a>
                        <a href="/web/market-trends">Market Trends</a>
                    </div>
                </div>
            </nav>
            
            <section class="hero">
                <div class="hero-content">
                    <h1>Malawi Crop Market Intelligence</h1>
                    <p>Real-time market prices, farming tips, and agricultural insights for Malawi farmers. Join our community of over 5,000 farmers sharing market information.</p>
                    <div class="cta-buttons">
                        <a href="/web/view-prices" class="btn btn-primary">📈 View Current Prices</a>
                        <a href="/web/submit-form" class="btn btn-secondary">📤 Share Your Price</a>
                    </div>
                </div>
            </section>
            
            <section class="features">
                <div class="feature-card">
                    <div class="feature-icon">💵</div>
                    <h3>Real-time Prices</h3>
                    <p>Access up-to-date market prices from across Malawi. Compare prices across different markets and regions.</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🤝</div>
                    <h3>Community Driven</h3>
                    <p>Prices submitted by farmers, for farmers. Every submission helps build a transparent market.</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>Market Insights</h3>
                    <p>Get insights on price trends, seasonal variations, and best times to sell your produce.</p>
                </div>
            </section>
            
            <h2 class="section-title">How It Works</h2>
            
            <div class="container">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 4rem;">
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">1️⃣</div>
                        <h3 style="color: #2E7D32; margin-bottom: 1rem;">Farmers Share Prices</h3>
                        <p>Farmers submit current market prices from their local markets.</p>
                    </div>
                    
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">2️⃣</div>
                        <h3 style="color: #2E7D32; margin-bottom: 1rem;">Community Verification</h3>
                        <p>Prices are verified by our community and agricultural experts.</p>
                    </div>
                    
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">3️⃣</div>
                        <h3 style="color: #2E7D32; margin-bottom: 1rem;">Everyone Benefits</h3>
                        <p>All farmers get access to transparent market information.</p>
                    </div>
                </div>
            </div>
            
            <footer class="footer">
                <div class="footer-links">
                    <a href="/web">Home</a>
                    <a href="/web/view-prices">Market Prices</a>
                    <a href="/web/submit-form">Submit Price</a>
                    <a href="/web/market-trends">Trends</a>
                    <a href="/web/about">About</a>
                    <a href="/web/contact">Contact</a>
                </div>
                <p>🌾 Mlimi Advisor - Empowering Malawi Farmers with Market Intelligence</p>
                <p style="opacity: 0.7; margin-top: 1rem;">© ${new Date().getFullYear()} | All prices in MWK</p>
            </footer>
            
            <script>
                // Simple animation for feature cards
                document.addEventListener('DOMContentLoaded', function() {
                    const cards = document.querySelectorAll('.feature-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 200);
                    });
                });
            </script>
        </body>
        </html>
    `);
});

// Web form page (HTML)
router.get('/submit-form', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Submit Market Price - Mlimi Advisor</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .navbar {
                    background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
                    color: white;
                    padding: 1rem 2rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    margin-bottom: 2rem;
                }
                
                .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    text-decoration: none;
                    color: white;
                }
                
                .nav-links {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                }
                
                .nav-links a {
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.3s;
                }
                
                .nav-links a:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                
                .header h1 {
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                
                .header p {
                    opacity: 0.9;
                    font-size: 14px;
                }
                
                .form-container {
                    padding: 30px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                label {
                    display: block;
                    margin-bottom: 8px;
                    color: #333;
                    font-weight: 500;
                    font-size: 14px;
                }
                
                input, select, textarea {
                    width: 100%;
                    padding: 12px 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 16px;
                    transition: all 0.3s;
                    font-family: inherit;
                }
                
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
                }
                
                .required::after {
                    content: " *";
                    color: #f44336;
                }
                
                .btn {
                    background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                    color: white;
                    border: none;
                    padding: 15px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3);
                }
                
                .btn:active {
                    transform: translateY(0);
                }
                
                .message {
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    display: none;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .success {
                    background: #e8f5e9;
                    color: #2E7D32;
                    border: 1px solid #c8e6c9;
                }
                
                .error {
                    background: #ffebee;
                    color: #c62828;
                    border: 1px solid #ffcdd2;
                }
                
                .info {
                    background: #e3f2fd;
                    color: #1565c0;
                    border: 1px solid #bbdefb;
                    margin-top: 20px;
                    font-size: 14px;
                    line-height: 1.5;
                    padding: 15px;
                    border-radius: 10px;
                }
                
                .crop-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .crop-option {
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }
                
                .crop-option:hover {
                    background: #e8f5e9;
                    border-color: #4CAF50;
                    transform: translateY(-2px);
                }
                
                .crop-option.selected {
                    background: #4CAF50;
                    color: white;
                    border-color: #2E7D32;
                }
                
                .currency-group {
                    display: flex;
                    gap: 10px;
                }
                
                .currency-group select {
                    width: 100px;
                }
                
                .currency-group input {
                    flex: 1;
                }
                
                .unit-group {
                    width: 120px;
                }
                
                .footer {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                    border-top: 1px solid #e0e0e0;
                    margin-top: 20px;
                }
                
                .back-link {
                    display: inline-block;
                    margin-top: 20px;
                    color: #4CAF50;
                    text-decoration: none;
                    font-weight: 500;
                }
                
                .back-link:hover {
                    text-decoration: underline;
                }
                
                @media (max-width: 600px) {
                    .container {
                        margin: 10px;
                    }
                    
                    .form-container {
                        padding: 20px;
                    }
                    
                    .crop-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .currency-group {
                        flex-direction: column;
                    }
                    
                    .currency-group select,
                    .currency-group input,
                    .unit-group {
                        width: 100%;
                    }
                    
                    .navbar {
                        padding: 1rem;
                    }
                    
                    .nav-container {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .nav-links {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                }
            </style>
        </head>
        <body>
            <nav class="navbar">
                <div class="nav-container">
                    <a href="/web" class="logo">
                        <span>🌾</span>
                        <span>Mlimi Advisor</span>
                    </a>
                    <div class="nav-links">
                        <a href="/web">Home</a>
                        <a href="/web/view-prices">View Prices</a>
                        <a href="/web/submit-form">Submit Price</a>
                    </div>
                </div>
            </nav>
            
            <div class="container">
                <div class="header">
                    <h1>🌾 Submit Market Price</h1>
                    <p>Help fellow farmers by sharing current market prices</p>
                </div>
                
                <div class="form-container">
                    <div id="message" class="message"></div>
                    
                    <form id="priceForm">
                        <div class="form-group">
                            <label class="required">Select Crop</label>
                            <div class="crop-grid" id="cropOptions">
                                <!-- Will be populated by JavaScript -->
                            </div>
                            <input type="hidden" id="cropName" name="cropName" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="required">Market Name</label>
                            <input type="text" id="marketName" name="marketName" 
                                   placeholder="e.g., Lilongwe Main Market" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="required">Market Region</label>
                            <select id="marketRegion" name="marketRegion" required>
                                <option value="">Select Region</option>
                                <option value="Central">Central Region</option>
                                <option value="Southern">Southern Region</option>
                                <option value="Northern">Northern Region</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="required">Price</label>
                            <div class="currency-group">
                                <select id="currency" name="currency">
                                    <option value="MWK">MWK</option>
                                    <option value="USD">USD</option>
                                </select>
                                <input type="number" id="price" name="price" 
                                       placeholder="e.g., 250" step="0.01" min="0" required>
                                <select id="unit" name="unit" class="unit-group">
                                    <option value="kg">per kg</option>
                                    <option value="bag">per 50kg bag</option>
                                    <option value="bundle">per bundle</option>
                                    <option value="piece">per piece</option>
                                    <option value="litre">per litre</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Crop Quality</label>
                            <select id="quality" name="quality">
                                <option value="Standard">Standard Quality</option>
                                <option value="Grade A">Grade A (Best)</option>
                                <option value="Grade B">Grade B (Good)</option>
                                <option value="Grade C">Grade C (Fair)</option>
                                <option value="Organic">Organic</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Your Name (Optional)</label>
                            <input type="text" id="farmerName" name="farmerName" 
                                   placeholder="e.g., Chikondi Banda">
                        </div>
                        
                        <div class="form-group">
                            <label>Phone Number (Optional)</label>
                            <input type="tel" id="farmerPhone" name="farmerPhone" 
                                   placeholder="e.g., +265 881 123 456">
                        </div>
                        
                        <div class="form-group">
                            <label>Additional Notes</label>
                            <textarea id="notes" name="notes" rows="3" 
                                      placeholder="Any additional information about the price, quality, or market conditions..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn">
                            <span>📤</span>
                            <span>Submit Price</span>
                        </button>
                    </form>
                    
                    <div class="info">
                        <strong>ℹ️ How this helps:</strong><br>
                        • Helps farmers get fair prices for their produce<br>
                        • Creates transparent market information for everyone<br>
                        • Builds community knowledge and trust<br>
                        • All submissions are verified by our community
                    </div>
                    
                    <a href="/web/view-prices" class="back-link">← Back to View Prices</a>
                </div>
                
                <div class="footer">
                    Mlimi Advisor &copy; ${new Date().getFullYear()} | 
                    <a href="/web/view-prices" style="color: #4CAF50;">View Recent Prices</a>
                </div>
            </div>
            
            <script>
                // Enhanced crop options
                const crops = [
                    { name: 'Maize', local: 'Chimanga', emoji: '🌽', color: '#FFD700' },
                    { name: 'Cassava', local: 'Chinangwazi', emoji: '🍠', color: '#8B4513' },
                    { name: 'Groundnuts', local: 'Mtedza', emoji: '🥜', color: '#D2691E' },
                    { name: 'Beans', local: 'Nyemba', emoji: '🫘', color: '#FF6347' },
                    { name: 'Rice', local: 'Mpunga', emoji: '🍚', color: '#FFF8DC' },
                    { name: 'Sweet Potatoes', local: 'Mbatata', emoji: '🍠', color: '#FFA500' },
                    { name: 'Soybeans', local: 'Soya', emoji: '🌱', color: '#90EE90' },
                    { name: 'Cotton', local: 'Thonje', emoji: '👕', color: '#F5F5F5' },
                    { name: 'Tobacco', local: 'Fodya', emoji: '🍂', color: '#8FBC8F' },
                    { name: 'Coffee', local: 'Khofi', emoji: '☕', color: '#6F4E37' },
                    { name: 'Tomatoes', local: 'Mafuta', emoji: '🍅', color: '#FF0000' },
                    { name: 'Onions', local: 'Anyesi', emoji: '🧅', color: '#FFA07A' }
                ];
                
                // Populate crop options
                const cropGrid = document.getElementById('cropOptions');
                crops.forEach(crop => {
                    const div = document.createElement('div');
                    div.className = 'crop-option';
                    div.innerHTML = \`
                        <div style="font-size: 32px;">\${crop.emoji}</div>
                        <div style="font-weight: 600; margin-top: 5px;">\${crop.name}</div>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">\${crop.local}</div>
                    \`;
                    div.addEventListener('click', () => {
                        // Remove selected class from all
                        document.querySelectorAll('.crop-option').forEach(el => {
                            el.classList.remove('selected');
                        });
                        // Add to clicked
                        div.classList.add('selected');
                        // Set hidden input
                        document.getElementById('cropName').value = crop.name;
                    });
                    cropGrid.appendChild(div);
                });
                
                // Select first crop by default
                cropGrid.firstElementChild?.click();
                
                // Form submission
                document.getElementById('priceForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const form = e.target;
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const messageDiv = document.getElementById('message');
                    
                    // Get form data
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    // Validate
                    if (!data.cropName) {
                        showMessage('Please select a crop', 'error');
                        return;
                    }
                    
                    if (!data.marketRegion) {
                        showMessage('Please select market region', 'error');
                        return;
                    }
                    
                    // Disable button and show loading
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>⏳</span><span>Submitting...</span>';
                    
                    try {
                        const response = await fetch('/web/submit-price', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data)
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            showMessage(result.message + ' Thank you for contributing!', 'success');
                            form.reset();
                            // Reselect first crop
                            cropGrid.firstElementChild?.click();
                            // Reset region
                            document.getElementById('marketRegion').value = '';
                        } else {
                            showMessage(result.error || 'Submission failed. Please try again.', 'error');
                        }
                    } catch (error) {
                        showMessage('Network error. Please check your connection and try again.', 'error');
                        console.error('Submission error:', error);
                    } finally {
                        // Re-enable button
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>📤</span><span>Submit Price</span>';
                    }
                });
                
                function showMessage(text, type) {
                    const messageDiv = document.getElementById('message');
                    messageDiv.textContent = text;
                    messageDiv.className = \`message \${type}\`;
                    messageDiv.style.display = 'block';
                    
                    // Auto-hide after 5 seconds
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 5000);
                }
                
                // Market name suggestions
                const marketSuggestions = [
                    'Lilongwe Main Market',
                    'Kasungu Market', 
                    'Mzuzu Market',
                    'Blantyre Market',
                    'Zomba Market',
                    'Mulanje Market',
                    'Salima Market',
                    'Mchinji Market',
                    'Dedza Market',
                    'Balaka Market',
                    'Karonga Market',
                    'Rumphi Market',
                    'Nkhata Bay Market',
                    'Mzimba Market',
                    'Chitipa Market'
                ];
                
                const marketInput = document.getElementById('marketName');
                marketInput.addEventListener('focus', () => {
                    if (!marketInput.value) {
                        marketInput.placeholder = 'Start typing or select from suggestions';
                    }
                });
                
                // Add a datalist for suggestions
                const datalist = document.createElement('datalist');
                datalist.id = 'marketSuggestions';
                marketSuggestions.forEach(market => {
                    const option = document.createElement('option');
                    option.value = market;
                    datalist.appendChild(option);
                });
                document.body.appendChild(datalist);
                marketInput.setAttribute('list', 'marketSuggestions');
                
                // Auto-select region based on market name
                marketInput.addEventListener('blur', function() {
                    const marketName = this.value.toLowerCase();
                    const regionSelect = document.getElementById('marketRegion');
                    
                    if (marketName.includes('lilongwe') || marketName.includes('kasungu') || 
                        marketName.includes('mchinji') || marketName.includes('dedza') || 
                        marketName.includes('salima') || marketName.includes('ntchisi')) {
                        regionSelect.value = 'Central';
                    } else if (marketName.includes('blantyre') || marketName.includes('zomba') || 
                               marketName.includes('mulanje') || marketName.includes('balaka') || 
                               marketName.includes('machinga') || marketName.includes('mangochi')) {
                        regionSelect.value = 'Southern';
                    } else if (marketName.includes('mzuzu') || marketName.includes('karonga') || 
                               marketName.includes('rumphi') || marketName.includes('nkhatabay') || 
                               marketName.includes('mzimba') || marketName.includes('chitipa')) {
                        regionSelect.value = 'Northern';
                    }
                });
                
                // Add animation to form
                document.addEventListener('DOMContentLoaded', function() {
                    const formElements = document.querySelectorAll('.form-group');
                    formElements.forEach((el, index) => {
                        setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                });
            </script>
        </body>
        </html>
    `);
});

// ============================================
// BEAUTIFUL VIEW PRICES PAGE
// ============================================

router.get('/recent-prices', async (req, res) => {
    try {
        // Fetch recent prices
        const limit = parseInt(req.query.limit) || 50;
        const result = await webInterfaceService.getRecentSubmissions(limit);
        
        const prices = result.success ? result.data : [];
        
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Market Prices - Mlimi Advisor</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        color: #333;
                        min-height: 100vh;
                    }
                    
                    .navbar {
                        background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
                        color: white;
                        padding: 1rem 2rem;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        position: sticky;
                        top: 0;
                        z-index: 1000;
                    }
                    
                    .nav-container {
                        max-width: 1400px;
                        margin: 0 auto;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .logo {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 1.5rem;
                        font-weight: bold;
                        text-decoration: none;
                        color: white;
                    }
                    
                    .nav-links {
                        display: flex;
                        gap: 2rem;
                        align-items: center;
                    }
                    
                    .nav-links a {
                        color: white;
                        text-decoration: none;
                        font-weight: 500;
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        transition: all 0.3s;
                    }
                    
                    .nav-links a:hover {
                        background: rgba(255,255,255,0.1);
                    }
                    
                    .nav-links a.active {
                        background: rgba(255,255,255,0.2);
                    }
                    
                    .container {
                        max-width: 1400px;
                        margin: 0 auto;
                        padding: 2rem;
                    }
                    
                    .page-header {
                        text-align: center;
                        margin-bottom: 3rem;
                        padding: 2rem;
                        background: white;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    }
                    
                    .page-title {
                        color: #2E7D32;
                        font-size: 2.5rem;
                        margin-bottom: 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 15px;
                    }
                    
                    .page-subtitle {
                        color: #666;
                        font-size: 1.1rem;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 1.5rem;
                        margin-bottom: 3rem;
                    }
                    
                    .stat-card {
                        background: white;
                        padding: 1.5rem;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        transition: transform 0.3s;
                    }
                    
                    .stat-card:hover {
                        transform: translateY(-5px);
                    }
                    
                    .stat-icon {
                        font-size: 2.5rem;
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                    }
                    
                    .stat-content h3 {
                        font-size: 1.8rem;
                        color: #2E7D32;
                        margin-bottom: 0.5rem;
                    }
                    
                    .stat-content p {
                        color: #666;
                        font-size: 0.9rem;
                    }
                    
                    .controls {
                        background: white;
                        padding: 1.5rem;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                        margin-bottom: 2rem;
                        display: flex;
                        gap: 1rem;
                        flex-wrap: wrap;
                        align-items: center;
                    }
                    
                    .filter-group {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                        min-width: 200px;
                    }
                    
                    .filter-group label {
                        font-weight: 500;
                        color: #555;
                        font-size: 0.9rem;
                    }
                    
                    .filter-group select,
                    .filter-group input {
                        padding: 0.75rem;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-size: 1rem;
                        transition: all 0.3s;
                    }
                    
                    .filter-group select:focus,
                    .filter-group input:focus {
                        outline: none;
                        border-color: #4CAF50;
                        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
                    }
                    
                    .refresh-btn {
                        background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s;
                    }
                    
                    .refresh-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
                    }
                    
                    .prices-table-container {
                        background: white;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                        overflow: hidden;
                        margin-bottom: 2rem;
                    }
                    
                    .table-header {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
                        padding: 1.5rem;
                        background: #f8f9fa;
                        border-bottom: 2px solid #e9ecef;
                        font-weight: 600;
                        color: #555;
                        gap: 1rem;
                    }
                    
                    .price-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
                        padding: 1.5rem;
                        border-bottom: 1px solid #e9ecef;
                        gap: 1rem;
                        align-items: center;
                        transition: background-color 0.3s;
                    }
                    
                    .price-row:hover {
                        background: #f8f9fa;
                    }
                    
                    .price-row:last-child {
                        border-bottom: none;
                    }
                    
                    .crop-cell {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .crop-icon {
                        font-size: 1.5rem;
                    }
                    
                    .crop-info {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .crop-name {
                        font-weight: 600;
                        color: #333;
                    }
                    
                    .crop-local {
                        font-size: 0.85rem;
                        color: #666;
                    }
                    
                    .price-cell {
                        font-size: 1.2rem;
                        font-weight: 600;
                        color: #2E7D32;
                    }
                    
                    .market-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    
                    .market-name {
                        font-weight: 500;
                        color: #333;
                    }
                    
                    .market-region {
                        font-size: 0.85rem;
                        color: #666;
                        padding: 2px 8px;
                        background: #e3f2fd;
                        border-radius: 12px;
                        display: inline-block;
                        width: fit-content;
                    }
                    
                    .market-region.central {
                        background: #e8f5e9;
                        color: #2E7D32;
                    }
                    
                    .market-region.southern {
                        background: #fff3e0;
                        color: #ef6c00;
                    }
                    
                    .market-region.northern {
                        background: #e3f2fd;
                        color: #1565c0;
                    }
                    
                    .quality-cell {
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.85rem;
                        font-weight: 500;
                        text-align: center;
                        width: fit-content;
                    }
                    
                    .quality-grade-a {
                        background: #e8f5e9;
                        color: #2E7D32;
                    }
                    
                    .quality-grade-b {
                        background: #fff3e0;
                        color: #ef6c00;
                    }
                    
                    .quality-standard {
                        background: #f5f5f5;
                        color: #666;
                    }
                    
                    .quality-organic {
                        background: #e8f5e9;
                        color: #2E7D32;
                        border: 1px solid #4CAF50;
                    }
                    
                    .date-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    
                    .date {
                        color: #333;
                        font-weight: 500;
                    }
                    
                    .time {
                        font-size: 0.85rem;
                        color: #666;
                    }
                    
                    .farmer-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    
                    .farmer-name {
                        color: #333;
                    }
                    
                    .farmer-phone {
                        font-size: 0.85rem;
                        color: #666;
                    }
                    
                    .verified-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 4px 8px;
                        background: #e8f5e9;
                        color: #2E7D32;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        margin-top: 4px;
                    }
                    
                    .no-data {
                        text-align: center;
                        padding: 4rem;
                        color: #666;
                    }
                    
                    .pagination {
                        display: flex;
                        justify-content: center;
                        gap: 0.5rem;
                        margin-top: 2rem;
                    }
                    
                    .page-btn {
                        padding: 0.5rem 1rem;
                        border: 2px solid #e0e0e0;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    
                    .page-btn:hover {
                        border-color: #4CAF50;
                        color: #4CAF50;
                    }
                    
                    .page-btn.active {
                        background: #4CAF50;
                        color: white;
                        border-color: #4CAF50;
                    }
                    
                    .loading {
                        text-align: center;
                        padding: 4rem;
                        color: #666;
                        font-size: 1.2rem;
                    }
                    
                    .loading-spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #4CAF50;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .mobile-only {
                        display: none;
                    }
                    
                    @media (max-width: 1200px) {
                        .table-header,
                        .price-row {
                            grid-template-columns: 1fr 1fr 1fr;
                        }
                        
                        .mobile-only {
                            display: block;
                        }
                        
                        .desktop-only {
                            display: none;
                        }
                    }
                    
                    @media (max-width: 768px) {
                        .container {
                            padding: 1rem;
                        }
                        
                        .page-title {
                            font-size: 2rem;
                        }
                        
                        .stats-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        .controls {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        
                        .filter-group {
                            min-width: 100%;
                        }
                        
                        .table-header,
                        .price-row {
                            grid-template-columns: 1fr 1fr;
                        }
                        
                        .nav-container {
                            flex-direction: column;
                            gap: 1rem;
                        }
                        
                        .nav-links {
                            flex-wrap: wrap;
                            justify-content: center;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .table-header,
                        .price-row {
                            grid-template-columns: 1fr;
                            gap: 0.5rem;
                        }
                        
                        .price-row {
                            padding: 1rem;
                            border-bottom: 2px solid #e9ecef;
                        }
                    }
                </style>
            </head>
            <body>
                <nav class="navbar">
                    <div class="nav-container">
                        <a href="/web" class="logo">
                            <span>🌾</span>
                            <span>Mlimi Advisor</span>
                        </a>
                        <div class="nav-links">
                            <a href="/web">Home</a>
                            <a href="/web/view-prices" class="active">View Prices</a>
                            <a href="/web/submit-form">Submit Price</a>
                            <a href="/web/market-trends">Market Trends</a>
                        </div>
                    </div>
                </nav>
                
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">
                            <span>📊</span>
                            Malawi Crop Market Prices
                        </h1>
                        <p class="page-subtitle">
                            Real-time market prices submitted by farmers across Malawi. Compare prices, find the best markets, and make informed decisions.
                        </p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">🌽</div>
                            <div class="stat-content">
                                <h3 id="totalPrices">${prices.length}</h3>
                                <p>Total Price Submissions</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">👨‍🌾</div>
                            <div class="stat-content">
                                <h3 id="uniqueFarmers">${new Set(prices.map(p => p.farmer_name).filter(Boolean)).size}</h3>
                                <p>Farmers Contributed</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">🏪</div>
                            <div class="stat-content">
                                <h3 id="uniqueMarkets">${new Set(prices.map(p => p.market_name).filter(Boolean)).size}</h3>
                                <p>Markets Covered</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">✅</div>
                            <div class="stat-content">
                                <h3 id="verifiedCount">${prices.filter(p => p.verified).length}</h3>
                                <p>Verified Submissions</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="controls">
                        <div class="filter-group">
                            <label for="cropFilter">Filter by Crop</label>
                            <select id="cropFilter">
                                <option value="">All Crops</option>
                                ${Array.from(new Set(prices.map(p => p.crops?.name).filter(Boolean))).map(crop => 
                                    `<option value="${crop}">${crop}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="marketFilter">Filter by Market</label>
                            <select id="marketFilter">
                                <option value="">All Markets</option>
                                ${Array.from(new Set(prices.map(p => p.market_name).filter(Boolean))).map(market => 
                                    `<option value="${market}">${market}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="regionFilter">Filter by Region</label>
                            <select id="regionFilter">
                                <option value="">All Regions</option>
                                <option value="Central">Central Region</option>
                                <option value="Southern">Southern Region</option>
                                <option value="Northern">Northern Region</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="qualityFilter">Filter by Quality</label>
                            <select id="qualityFilter">
                                <option value="">All Qualities</option>
                                <option value="Grade A">Grade A</option>
                                <option value="Grade B">Grade B</option>
                                <option value="Standard">Standard</option>
                                <option value="Organic">Organic</option>
                            </select>
                        </div>
                        
                        <button class="refresh-btn" onclick="loadPrices()">
                            <span>🔄</span>
                            <span>Refresh Prices</span>
                        </button>
                    </div>
                    
                    <div class="prices-table-container">
                        <div class="table-header">
                            <div>Crop</div>
                            <div>Price</div>
                            <div>Market</div>
                            <div class="desktop-only">Quality</div>
                            <div class="desktop-only">Date</div>
                            <div class="desktop-only">Farmer</div>
                        </div>
                        
                        <div id="pricesContainer">
                            ${prices.length > 0 ? prices.map(price => `
                                <div class="price-row" 
                                     data-crop="${price.crops?.name || ''}"
                                     data-market="${price.market_name || ''}"
                                     data-region="${price.market_region || ''}"
                                     data-quality="${price.quality || 'Standard'}">
                                    <div class="crop-cell">
                                        <div class="crop-icon">${getCropEmoji(price.crops?.name)}</div>
                                        <div class="crop-info">
                                            <div class="crop-name">${price.crops?.name || 'Unknown Crop'}</div>
                                            <div class="crop-local">${price.crops?.local_name || ''}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="price-cell">
                                        ${formatPrice(price.price, price.currency)}
                                    </div>
                                    
                                    <div class="market-cell">
                                        <div class="market-name">${price.market_name || 'Unknown Market'}</div>
                                        ${price.market_region ? `
                                            <div class="market-region ${price.market_region.toLowerCase()}">
                                                ${price.market_region} Region
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <div class="quality-cell desktop-only ${getQualityClass(price.quality)}">
                                        ${price.quality || 'Standard'}
                                    </div>
                                    
                                    <div class="date-cell desktop-only">
                                        <div class="date">${formatDate(price.date_recorded)}</div>
                                        <div class="time">${formatTime(price.created_at)}</div>
                                    </div>
                                    
                                    <div class="farmer-cell desktop-only">
                                        <div class="farmer-name">${price.farmer_name || 'Anonymous'}</div>
                                        ${price.farmer_phone ? `
                                            <div class="farmer-phone">${price.farmer_phone}</div>
                                        ` : ''}
                                        ${price.verified ? `
                                            <div class="verified-badge">
                                                <span>✅</span>
                                                <span>Verified</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <!-- Mobile View -->
                                    <div class="mobile-only" style="grid-column: span 3; padding-top: 1rem; border-top: 1px solid #eee; margin-top: 1rem;">
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                            <div>
                                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">Quality</div>
                                                <div class="${getQualityClass(price.quality)}" style="padding: 4px 8px; border-radius: 12px; display: inline-block;">
                                                    ${price.quality || 'Standard'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">Date</div>
                                                <div>${formatDate(price.date_recorded)}</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">Farmer</div>
                                                <div>${price.farmer_name || 'Anonymous'}</div>
                                                ${price.verified ? `<div class="verified-badge" style="margin-top: 4px;">✅ Verified</div>` : ''}
                                            </div>
                                            <div>
                                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">Time</div>
                                                <div>${formatTime(price.created_at)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="no-data">
                                    <div style="font-size: 3rem; margin-bottom: 1rem;">🌾</div>
                                    <h3 style="color: #666; margin-bottom: 1rem;">No Price Data Available</h3>
                                    <p style="color: #888; margin-bottom: 2rem;">Be the first to submit a market price!</p>
                                    <a href="/web/submit-form" style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Submit Price</a>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="pagination">
                        <button class="page-btn active">1</button>
                        <button class="page-btn">2</button>
                        <button class="page-btn">3</button>
                        <button class="page-btn">Next →</button>
                    </div>
                </div>
                
                <script>
                    // Helper functions
                    function getCropEmoji(cropName) {
                        const emojis = {
                            'Maize': '🌽',
                            'Cassava': '🍠',
                            'Groundnuts': '🥜',
                            'Beans': '🫘',
                            'Rice': '🍚',
                            'Sweet Potatoes': '🍠',
                            'Soybeans': '🌱',
                            'Cotton': '👕',
                            'Tobacco': '🍂',
                            'Coffee': '☕',
                            'Tomatoes': '🍅',
                            'Onions': '🧅'
                        };
                        return emojis[cropName] || '🌾';
                    }
                    
                    function getQualityClass(quality) {
                        const classes = {
                            'Grade A': 'quality-grade-a',
                            'Grade B': 'quality-grade-b',
                            'Standard': 'quality-standard',
                            'Organic': 'quality-organic'
                        };
                        return classes[quality] || 'quality-standard';
                    }
                    
                    function formatPrice(price, currency) {
                        return \`\${parseFloat(price).toLocaleString()} \${currency || 'MWK'}\`;
                    }
                    
                    function formatDate(dateString) {
                        if (!dateString) return 'Today';
                        const date = new Date(dateString);
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        
                        if (date.toDateString() === today.toDateString()) return 'Today';
                        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
                        
                        return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                        });
                    }
                    
                    function formatTime(dateString) {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        return date.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                        });
                    }
                    
                    // Filter functionality
                    function setupFilters() {
                        const cropFilter = document.getElementById('cropFilter');
                        const marketFilter = document.getElementById('marketFilter');
                        const regionFilter = document.getElementById('regionFilter');
                        const qualityFilter = document.getElementById('qualityFilter');
                        
                        function filterPrices() {
                            const selectedCrop = cropFilter.value;
                            const selectedMarket = marketFilter.value;
                            const selectedRegion = regionFilter.value;
                            const selectedQuality = qualityFilter.value;
                            
                            const priceRows = document.querySelectorAll('.price-row');
                            let visibleCount = 0;
                            
                            priceRows.forEach(row => {
                                const crop = row.dataset.crop;
                                const market = row.dataset.market;
                                const region = row.dataset.region;
                                const quality = row.dataset.quality;
                                
                                const matchesCrop = !selectedCrop || crop === selectedCrop;
                                const matchesMarket = !selectedMarket || market === selectedMarket;
                                const matchesRegion = !selectedRegion || region === selectedRegion;
                                const matchesQuality = !selectedQuality || quality === selectedQuality;
                                
                                if (matchesCrop && matchesMarket && matchesRegion && matchesQuality) {
                                    row.style.display = 'grid';
                                    visibleCount++;
                                } else {
                                    row.style.display = 'none';
                                }
                            });
                            
                            // Update stats
                            document.getElementById('totalPrices').textContent = visibleCount;
                            
                            // Show no results message
                            const noDataElement = document.querySelector('.no-data');
                            if (noDataElement) {
                                noDataElement.style.display = visibleCount === 0 ? 'block' : 'none';
                            }
                        }
                        
                        cropFilter.addEventListener('change', filterPrices);
                        marketFilter.addEventListener('change', filterPrices);
                        regionFilter.addEventListener('change', filterPrices);
                        qualityFilter.addEventListener('change', filterPrices);
                    }
                    
                    // Load prices via AJAX
                    async function loadPrices() {
                        const container = document.getElementById('pricesContainer');
                        container.innerHTML = \`
                            <div class="loading">
                                <div class="loading-spinner"></div>
                                <p>Loading latest prices...</p>
                            </div>
                        \`;
                        
                        try {
                            const response = await fetch('/web/recent-prices?limit=50');
                            const result = await response.json();
                            
                            if (result.success) {
                                // In a real app, you would update the DOM with new data
                                setTimeout(() => {
                                    showMessage('Prices refreshed successfully!', 'success');
                                    // For now, just reload the page
                                    window.location.reload();
                                }, 1000);
                            } else {
                                showMessage('Failed to load prices: ' + result.error, 'error');
                            }
                        } catch (error) {
                            showMessage('Network error. Please try again.', 'error');
                        }
                    }
                    
                    function showMessage(text, type) {
                        // Create message element
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${type}\`;
                        messageDiv.style.cssText = \`
                            position: fixed;
                            top: 100px;
                            right: 20px;
                            padding: 1rem 1.5rem;
                            border-radius: 8px;
                            color: white;
                            font-weight: 500;
                            z-index: 10000;
                            animation: slideIn 0.3s ease;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        \`;
                        
                        if (type === 'success') {
                            messageDiv.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
                        } else {
                            messageDiv.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                        }
                        
                        messageDiv.textContent = text;
                        document.body.appendChild(messageDiv);
                        
                        // Auto remove after 5 seconds
                        setTimeout(() => {
                            messageDiv.style.animation = 'slideOut 0.3s ease';
                            setTimeout(() => messageDiv.remove(), 300);
                        }, 5000);
                    }
                    
                    // Initialize filters
                    document.addEventListener('DOMContentLoaded', function() {
                        setupFilters();
                        
                        // Add animation to price rows
                        const priceRows = document.querySelectorAll('.price-row');
                        priceRows.forEach((row, index) => {
                            setTimeout(() => {
                                row.style.opacity = '1';
                                row.style.transform = 'translateY(0)';
                            }, index * 50);
                        });
                        
                        // Add CSS for animations
                        const style = document.createElement('style');
                        style.textContent = \`
                            .price-row {
                                opacity: 0;
                                transform: translateY(10px);
                                transition: opacity 0.3s ease, transform 0.3s ease;
                            }
                            
                            @keyframes slideIn {
                                from {
                                    transform: translateX(100%);
                                    opacity: 0;
                                }
                                to {
                                    transform: translateX(0);
                                    opacity: 1;
                                }
                            }
                            
                            @keyframes slideOut {
                                from {
                                    transform: translateX(0);
                                    opacity: 1;
                                }
                                to {
                                    transform: translateX(100%);
                                    opacity: 0;
                                }
                            }
                        \`;
                        document.head.appendChild(style);
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('❌ View prices error:', error);
        res.status(500).send('Internal server error');
    }
});

// Market trends page
router.get('/market-trends', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Market Trends - Mlimi Advisor</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    color: #333;
                }
                
                .navbar {
                    background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
                    color: white;
                    padding: 1rem 2rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                
                .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-decoration: none;
                    color: white;
                }
                
                .nav-links {
                    display: flex;
                    gap: 2rem;
                    align-items: center;
                }
                
                .nav-links a {
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.3s;
                }
                
                .nav-links a:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .nav-links a.active {
                    background: rgba(255,255,255,0.2);
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }
                
                .page-title {
                    color: #2E7D32;
                    font-size: 2.5rem;
                    margin-bottom: 2rem;
                    text-align: center;
                }
                
                .coming-soon {
                    text-align: center;
                    padding: 6rem 2rem;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                }
                
                .coming-soon-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                
                .coming-soon h2 {
                    color: #2E7D32;
                    margin-bottom: 1rem;
                }
                
                .coming-soon p {
                    color: #666;
                    max-width: 600px;
                    margin: 0 auto 2rem;
                    line-height: 1.6;
                }
                
                .back-link {
                    display: inline-block;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                
                .back-link:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
                }
                
                @media (max-width: 768px) {
                    .nav-container {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .nav-links {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    
                    .container {
                        padding: 1rem;
                    }
                }
            </style>
        </head>
        <body>
            <nav class="navbar">
                <div class="nav-container">
                    <a href="/web" class="logo">
                        <span>🌾</span>
                        <span>Mlimi Advisor</span>
                    </a>
                    <div class="nav-links">
                        <a href="/web">Home</a>
                        <a href="/web/view-prices">View Prices</a>
                        <a href="/web/submit-form">Submit Price</a>
                        <a href="/web/market-trends" class="active">Market Trends</a>
                    </div>
                </div>
            </nav>
            
            <div class="container">
                <h1 class="page-title">📈 Market Trends & Analysis</h1>
                
                <div class="coming-soon">
                    <div class="coming-soon-icon">🚧</div>
                    <h2>Coming Soon!</h2>
                    <p>We're working hard to bring you detailed market analysis, price trends, seasonal patterns, and predictive insights to help you make better farming decisions.</p>
                    <p>This feature will include interactive charts, price forecasts, and market intelligence reports.</p>
                    <a href="/web/view-prices" class="back-link">← Back to Current Prices</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

module.exports = router;