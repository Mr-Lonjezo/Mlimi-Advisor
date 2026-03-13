const express = require('express');
const router = express.Router();
const MarketEnhancedService = require('../services/marketEnhancedService');
const SMS = require('../services/smsService');

// Buyer registration portal
router.get('/register', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mlimi Advisor - Buyer Registration</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; }
                input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; }
                .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>Buyer/Vendor Registration</h1>
            <p>Register to post buying prices and connect with farmers</p>
            
            <form id="registrationForm">
                <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" name="phone" placeholder="+265XXXXXXXXX" required>
                </div>
                
                <div class="form-group">
                    <label>Business Name *</label>
                    <input type="text" name="businessName" placeholder="e.g., Mzuzu Fresh Produce Ltd" required>
                </div>
                
                <div class="form-group">
                    <label>Contact Person</label>
                    <input type="text" name="contactPerson" placeholder="Name of contact person">
                </div>
                
                <div class="form-group">
                    <label>District *</label>
                    <select name="district" required>
                        <option value="">Select District</option>
                        <option value="Lilongwe">Lilongwe</option>
                        <option value="Blantyre">Blantyre</option>
                        <option value="Mzuzu">Mzuzu</option>
                        <option value="Zomba">Zomba</option>
                        <!-- Add all 28 districts -->
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Market Name/Location *</label>
                    <input type="text" name="marketName" placeholder="e.g., Lilongwe Main Market" required>
                </div>
                
                <div class="form-group">
                    <label>GPS Coordinates (optional)</label>
                    <input type="text" name="gps" placeholder="e.g., -13.9626, 33.7741">
                </div>
                
                <button type="submit">Register</button>
            </form>
            
            <div id="message"></div>
            
            <script>
                document.getElementById('registrationForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    const response = await fetch('/api/buyer/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    const messageDiv = document.getElementById('message');
                    if (result.success) {
                        messageDiv.className = 'success';
                        messageDiv.innerHTML = `
                            <strong>✅ Registration Successful!</strong><br>
                            ${result.message}<br>
                            <small>Your Buyer ID: ${result.buyerId}</small>
                        `;
                        e.target.reset();
                    } else {
                        messageDiv.className = 'error';
                        messageDiv.innerHTML = `<strong>❌ Registration Failed</strong><br>${result.message}`;
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Buyer login/portal
router.get('/portal', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mlimi Advisor - Buyer Portal</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .tabs { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 20px; }
                .tab { padding: 10px 20px; cursor: pointer; border: 1px solid transparent; }
                .tab.active { border: 1px solid #ddd; border-bottom-color: white; margin-bottom: -1px; }
                .tab-content { display: none; padding: 20px; border: 1px solid #ddd; }
                .tab-content.active { display: block; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; }
                input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; }
                .alert { padding: 10px; border-radius: 4px; margin: 10px 0; }
                .alert-success { background: #d4edda; color: #155724; }
                .alert-error { background: #f8d7da; color: #721c24; }
            </style>
        </head>
        <body>
            <h1>Buyer Portal</h1>
            
            <div class="tabs">
                <div class="tab active" onclick="showTab('postPrice')">Post Buying Price</div>
                <div class="tab" onclick="showTab('myListings')">My Listings</div>
                <div class="tab" onclick="showTab('smsBroadcast')">SMS Farmers</div>
                <div class="tab" onclick="showTab('dashboard')">Dashboard</div>
            </div>
            
            <!-- Post Price Tab -->
            <div id="postPrice" class="tab-content active">
                <h2>Post Buying Price</h2>
                <form id="priceForm">
                    <div class="form-group">
                        <label>Buyer ID *</label>
                        <input type="text" name="buyerId" placeholder="Your buyer ID" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Crop *</label>
                        <select name="cropId" required>
                            <option value="">Select Crop</option>
                            <!-- Populated by JavaScript -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Price per Kg (MK) *</label>
                        <input type="number" name="price" step="0.01" min="0" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Minimum Quantity (Kg)</label>
                        <input type="number" name="minQuantity" value="1" step="0.5" min="0.5">
                    </div>
                    
                    <div class="form-group">
                        <label>Market Location *</label>
                        <input type="text" name="marketLocation" placeholder="e.g., Lilongwe Main Market" required>
                    </div>
                    
                    <div class="form-group">
                        <label>District *</label>
                        <select name="district" required>
                            <option value="">Select District</option>
                            <option value="Lilongwe">Lilongwe</option>
                            <option value="Blantyre">Blantyre</option>
                            <option value="Mzuzu">Mzuzu</option>
                            <!-- Add all districts -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Special Notes</label>
                        <textarea name="notes" rows="3" placeholder="Any special requirements..."></textarea>
                    </div>
                    
                    <button type="submit">Post Price</button>
                </form>
                <div id="priceMessage"></div>
            </div>
            
            <!-- My Listings Tab -->
            <div id="myListings" class="tab-content">
                <h2>My Active Listings</h2>
                <div id="listingsContainer">Loading...</div>
            </div>
            
            <!-- SMS Broadcast Tab -->
            <div id="smsBroadcast" class="tab-content">
                <h2>Send SMS to Farmers</h2>
                <form id="smsForm">
                    <div class="form-group">
                        <label>Buyer ID *</label>
                        <input type="text" name="buyerId" placeholder="Your buyer ID" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Message * (160 chars max)</label>
                        <textarea name="message" rows="4" maxlength="160" placeholder="e.g., Buying maize at MK500/kg this week at Mzuzu Market..." required></textarea>
                        <small><span id="charCount">0</span>/160 characters</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Target District (optional)</label>
                        <select name="targetDistrict">
                            <option value="">All Districts</option>
                            <option value="Lilongwe">Lilongwe</option>
                            <option value="Blantyre">Blantyre</option>
                            <!-- Add districts -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Target Crop (optional)</label>
                        <select name="targetCropId">
                            <option value="">All Crops</option>
                            <!-- Populated by JavaScript -->
                        </select>
                    </div>
                    
                    <button type="submit">Schedule SMS</button>
                    <small>Note: SMS will be sent to farmers subscribed to price alerts</small>
                </form>
                <div id="smsMessage"></div>
            </div>
            
            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-content">
                <h2>Dashboard</h2>
                <div id="dashboardContent">Enter your Buyer ID to view dashboard</div>
                <div class="form-group" style="max-width: 300px;">
                    <input type="text" id="dashboardBuyerId" placeholder="Enter Buyer ID">
                    <button onclick="loadDashboard()">Load Dashboard</button>
                </div>
            </div>
            
            <script>
                // Character counter for SMS
                document.querySelector('textarea[name="message"]').addEventListener('input', function(e) {
                    document.getElementById('charCount').textContent = e.target.value.length;
                });
                
                // Load crops dropdown
                async function loadCrops() {
                    const response = await fetch('/api/crops');
                    const crops = await response.json();
                    
                    const cropSelects = document.querySelectorAll('select[name="cropId"], select[name="targetCropId"]');
                    cropSelects.forEach(select => {
                        select.innerHTML = '<option value="">Select Crop</option>' + 
                            crops.map(crop => `<option value="${crop.id}">${crop.name}</option>`).join('');
                    });
                }
                
                // Tab switching
                function showTab(tabName) {
                    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                    
                    document.getElementById(tabName).classList.add('active');
                    document.querySelector(`.tab[onclick="showTab('${tabName}')"]`).classList.add('active');
                }
                
                // Post price form
                document.getElementById('priceForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    const response = await fetch('/api/buyer/post-price', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    const messageDiv = document.getElementById('priceMessage');
                    messageDiv.className = result.success ? 'alert alert-success' : 'alert alert-error';
                    messageDiv.innerHTML = result.success 
                        ? `✅ ${result.message}<br><small>Listing ID: ${result.listingId}</small>`
                        : `❌ ${result.message}`;
                    
                    if (result.success) {
                        e.target.reset();
                        loadListings(data.buyerId);
                    }
                });
                
                // Load active listings
                async function loadListings(buyerId) {
                    const response = await fetch(`/api/buyer/listings/${buyerId}`);
                    const result = await response.json();
                    
                    if (result.success && result.listings.length > 0) {
                        const html = `
                            <table>
                                <tr>
                                    <th>Crop</th>
                                    <th>Price (MK/kg)</th>
                                    <th>Market</th>
                                    <th>Min Qty</th>
                                    <th>Expires</th>
                                </tr>
                                ${result.listings.map(listing => `
                                    <tr>
                                        <td>${listing.crop_name}</td>
                                        <td>${listing.price_per_kg}</td>
                                        <td>${listing.market_location}</td>
                                        <td>${listing.min_quantity_kg}kg</td>
                                        <td>${new Date(listing.expiry_date).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </table>
                        `;
                        document.getElementById('listingsContainer').innerHTML = html;
                    } else {
                        document.getElementById('listingsContainer').innerHTML = 
                            '<p>No active listings found.</p>';
                    }
                }
                
                // SMS form
                document.getElementById('smsForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    const response = await fetch('/api/buyer/schedule-sms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    const messageDiv = document.getElementById('smsMessage');
                    messageDiv.className = result.success ? 'alert alert-success' : 'alert alert-error';
                    messageDiv.innerHTML = result.success 
                        ? `✅ ${result.message}<br><small>Broadcast ID: ${result.broadcastId}</small>`
                        : `❌ ${result.message}`;
                    
                    if (result.success) {
                        e.target.reset();
                        document.getElementById('charCount').textContent = '0';
                    }
                });
                
                // Load dashboard
                async function loadDashboard() {
                    const buyerId = document.getElementById('dashboardBuyerId').value;
                    if (!buyerId) return;
                    
                    const response = await fetch(`/api/buyer/dashboard/${buyerId}`);
                    const result = await response.json();
                    
                    if (result.success) {
                        const html = `
                            <div class="alert alert-success">
                                <strong>${result.buyer.business_name}</strong><br>
                                ${result.buyer.market_name}, ${result.buyer.location_district}<br>
                                Status: ${result.buyer.verified ? '✅ Verified' : '⏳ Pending'}
                            </div>
                            
                            <h3>Statistics</h3>
                            <ul>
                                <li>Total Listings: ${result.stats.totalListings}</li>
                                <li>Active Listings: ${result.stats.activeListings}</li>
                                <li>Farmers Notified: ${result.stats.farmersNotified}</li>
                            </ul>
                            
                            ${result.activeListings.length > 0 ? `
                                <h3>Active Listings</h3>
                                <table>
                                    <tr>
                                        <th>Crop</th>
                                        <th>Price</th>
                                        <th>Market</th>
                                    </tr>
                                    ${result.activeListings.slice(0, 5).map(listing => `
                                        <tr>
                                            <td>${listing.crops.name}</td>
                                            <td>MK${listing.price_per_kg}/kg</td>
                                            <td>${listing.market_location}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            ` : ''}
                        `;
                        document.getElementById('dashboardContent').innerHTML = html;
                    } else {
                        document.getElementById('dashboardContent').innerHTML = 
                            `<div class="alert alert-error">${result.message}</div>`;
                    }
                }
                
                // Initialize
                loadCrops();
            </script>
        </body>
        </html>
    `);
});

// API endpoints
router.post('/api/buyer/register', async (req, res) => {
    const { phone, businessName, contactPerson, district, marketName, gps } = req.body;
    const result = await MarketEnhancedService.registerBuyer(
        phone, businessName, contactPerson, district, marketName, gps
    );
    res.json(result);
});

router.post('/api/buyer/post-price', async (req, res) => {
    const { buyerId, cropId, price, minQuantity, marketLocation, district, notes } = req.body;
    const result = await MarketEnhancedService.postBuyingPrice(
        buyerId, cropId, parseFloat(price), parseFloat(minQuantity || 1), 
        marketLocation, district, notes
    );
    res.json(result);
});

router.post('/api/buyer/schedule-sms', async (req, res) => {
    const { buyerId, message, targetDistrict, targetCropId } = req.body;
    const result = await MarketEnhancedService.scheduleSMSBroadcast(
        buyerId, message, targetDistrict || null, targetCropId || null, new Date()
    );
    res.json(result);
});

router.get('/api/buyer/listings/:buyerId', async (req, res) => {
    const { buyerId } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('buyer_prices')
            .select(`
                *,
                crops(name as crop_name)
            `)
            .eq('buyer_id', buyerId)
            .eq('availability_status', 'available')
            .gt('expiry_date', new Date().toISOString())
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, listings: data || [] });
    } catch (error) {
        res.json({ success: false, message: 'Failed to load listings' });
    }
});

router.get('/api/buyer/dashboard/:buyerId', async (req, res) => {
    const result = await MarketEnhancedService.getBuyerDashboard(req.params.buyerId);
    res.json(result);
});

router.get('/api/crops', async (req, res) => {
    const { data, error } = await supabase
        .from('crops')
        .select('id, name')
        .order('name');
    
    res.json(error ? [] : data);
});

module.exports = router;