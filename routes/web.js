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

// Get recent submissions (GET)
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
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                
                .container {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    width: 100%;
                    max-width: 500px;
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
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(76, 175, 80, 0.2);
                }
                
                .btn:active {
                    transform: translateY(0);
                }
                
                .message {
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    display: none;
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
                }
                
                .crop-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .crop-option {
                    background: #f5f5f5;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 10px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .crop-option:hover {
                    background: #e8f5e9;
                    border-color: #4CAF50;
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
                
                .footer {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                    border-top: 1px solid #e0e0e0;
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
                }
            </style>
        </head>
        <body>
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
                            <label class="required">Price</label>
                            <div class="currency-group">
                                <select id="currency" name="currency">
                                    <option value="MWK">MWK</option>
                                    <option value="USD">USD</option>
                                </select>
                                <input type="number" id="price" name="price" 
                                       placeholder="e.g., 250" step="0.01" min="0" required>
                                <select id="unit" name="unit">
                                    <option value="kg">per kg</option>
                                    <option value="bag">per 50kg bag</option>
                                    <option value="bundle">per bundle</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Crop Quality</label>
                            <select id="quality" name="quality">
                                <option value="Standard">Standard</option>
                                <option value="Grade A">Grade A (Best)</option>
                                <option value="Grade B">Grade B (Good)</option>
                                <option value="Grade C">Grade C (Fair)</option>
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
                                      placeholder="Any additional information about the price..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn">📤 Submit Price</button>
                    </form>
                    
                    <div class="info">
                        <strong>ℹ️ How this helps:</strong><br>
                        • Helps farmers get fair prices<br>
                        • Creates transparent market information<br>
                        • Builds community knowledge<br>
                        • All submissions are verified
                    </div>
                </div>
                
                <div class="footer">
                    Mlimi Advisor &copy; ${new Date().getFullYear()} | 
                    <a href="/web/recent-prices" style="color: #4CAF50;">View Recent Prices</a>
                </div>
            </div>
            
            <script>
                // Crop options
                const crops = [
                    { name: 'Maize', local: 'Chimanga', emoji: '🌽' },
                    { name: 'Cassava', local: 'Chinangwa', emoji: '🍠' },
                    { name: 'Groundnuts', local: 'Mtedza', emoji: '🥜' },
                    { name: 'Beans', local: 'Nyemba', emoji: '🫘' },
                    { name: 'Rice', local: 'Mpunga', emoji: '🍚' },
                    { name: 'Sweet Potatoes', local: 'Mbatata', emoji: '🍠' },
                    { name: 'Soybeans', local: 'Soya', emoji: '🌱' },
                    { name: 'Cotton', local: 'Thonje', emoji: '👕' },
                    { name: 'Tobacco', local: 'Fodya', emoji: '🍂' },
                    { name: 'Coffee', local: 'Khofi', emoji: '☕' }
                ];
                
                // Populate crop options
                const cropGrid = document.getElementById('cropOptions');
                crops.forEach(crop => {
                    const div = document.createElement('div');
                    div.className = 'crop-option';
                    div.innerHTML = \`
                        <div style="font-size: 24px;">\${crop.emoji}</div>
                        <div>\${crop.name}</div>
                        <div style="font-size: 12px; opacity: 0.7;">\${crop.local}</div>
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
                    
                    // Disable button and show loading
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '⏳ Submitting...';
                    
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
                            showMessage(result.message, 'success');
                            form.reset();
                            // Reselect first crop
                            cropGrid.firstElementChild?.click();
                        } else {
                            showMessage(result.error || 'Submission failed', 'error');
                        }
                    } catch (error) {
                        showMessage('Network error. Please try again.', 'error');
                        console.error('Submission error:', error);
                    } finally {
                        // Re-enable button
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '📤 Submit Price';
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
                    'Balaka Market'
                ];
                
                const marketInput = document.getElementById('marketName');
                marketInput.addEventListener('focus', () => {
                    if (!marketInput.value) {
                        marketInput.placeholder = 'Start typing or select: ' + 
                            marketSuggestions.slice(0, 3).join(', ');
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
            </script>
        </body>
        </html>
    `);
});

module.exports = router;