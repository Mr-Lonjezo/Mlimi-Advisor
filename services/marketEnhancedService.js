const supabase = require('./databaseService');
const { sendSMS } = require('./smsService'); 

class MarketEnhancedService {
    
    // Register a new buyer/vendor
    async registerBuyer(phone, businessName, contactPerson, district, marketName, gps) {
        try {
            const { data, error } = await supabase
                .from('buyers')
                .insert([{
                    phone_number: phone,
                    business_name: businessName,
                    contact_person: contactPerson,
                    location_district: district,
                    market_name: marketName,
                    gps_coordinates: gps,
                    verified: false // Admin will verify manually
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            // Send confirmation SMS
            await this.sendBuyerWelcomeSMS(phone, businessName);
            
            return {
                success: true,
                message: 'Registration successful. You will receive an SMS when verified.',
                buyerId: data.id
            };
        } catch (error) {
            console.error('Error registering buyer:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }
    
    // Post buying price from buyer portal
    async postBuyingPrice(buyerId, cropId, price, minQuantity, marketLocation, district, notes) {
        try {
            // Check if buyer exists and is verified
            const { data: buyer, error: buyerError } = await supabase
                .from('buyers')
                .select('verified, business_name')
                .eq('id', buyerId)
                .single();
            
            if (buyerError || !buyer || !buyer.verified) {
                return { success: false, message: 'Buyer not verified or not found.' };
            }
            
            // Get crop name
            const { data: crop, error: cropError } = await supabase
                .from('crops')
                .select('name, local_name')
                .eq('id', cropId)
                .single();
            
            if (cropError) {
                return { success: false, message: 'Crop not found.' };
            }
            
            // Insert price listing
            const { data, error } = await supabase
                .from('buyer_prices')
                .insert([{
                    buyer_id: buyerId,
                    crop_id: cropId,
                    price_per_kg: price,
                    min_quantity_kg: minQuantity,
                    market_location: marketLocation,
                    district: district,
                    special_notes: notes,
                    expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            // Notify subscribed farmers
            await this.notifySubscribedFarmers(cropId, district, price, marketLocation);
            
            return {
                success: true,
                message: `Price posted successfully! Farmers looking for ${crop.name} in ${district} will be notified.`,
                listingId: data.id
            };
        } catch (error) {
            console.error('Error posting buying price:', error);
            return { success: false, message: 'Failed to post price. Please try again.' };
        }
    }
    
    // Get market prices for USSD - enhanced with buyer listings
    async getMarketPrices(cropName, district, page = 1, limit = 5) {
        try {
            // Get crop ID
            const { data: crop, error: cropError } = await supabase
                .from('crops')
                .select('id')
                .ilike('name', `%${cropName}%`)
                .single();
            
            if (cropError) return { success: false, message: 'Crop not found.' };
            
            const offset = (page - 1) * limit;
            
            // Get farmer submitted prices (existing functionality)
            const { data: farmerPrices, error: farmerError } = await supabase
                .from('market_prices') // Your existing table
                .select(`
                    *,
                    crops(name, local_name)
                `)
                .eq('crop_id', crop.id)
                .eq('district', district)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            // Get buyer listings
            const { data: buyerPrices, error: buyerError } = await supabase
                .from('buyer_prices')
                .select(`
                    *,
                    crops(name, local_name),
                    buyers(business_name, market_name)
                `)
                .eq('crop_id', crop.id)
                .eq('district', district)
                .eq('availability_status', 'available')
                .gt('expiry_date', new Date().toISOString())
                .order('price_per_kg', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (farmerError && buyerError) {
                return { success: false, message: 'No prices found for this crop and district.' };
            }
            
            // Combine results
            const allPrices = [];
            
            // Add buyer prices with marker
            if (buyerPrices) {
                buyerPrices.forEach(price => {
                    allPrices.push({
                        type: 'BUYER',
                        price: price.price_per_kg,
                        business: price.buyers.business_name,
                        market: price.market_location,
                        min_quantity: price.min_quantity_kg,
                        notes: price.special_notes,
                        phone: 'Buyer at market'
                    });
                });
            }
            
            // Add farmer prices
            if (farmerPrices) {
                farmerPrices.forEach(price => {
                    allPrices.push({
                        type: 'FARMER',
                        price: price.price_per_kg,
                        market: price.market,
                        date: new Date(price.created_at).toLocaleDateString(),
                        phone: price.phone_number || 'Anonymous'
                    });
                });
            }
            
            // Sort by price (descending)
            allPrices.sort((a, b) => b.price - a.price);
            
            return {
                success: true,
                prices: allPrices,
                hasMore: (farmerPrices?.length === limit || buyerPrices?.length === limit),
                page,
                totalResults: allPrices.length
            };
        } catch (error) {
            console.error('Error getting market prices:', error);
            return { success: false, message: 'Failed to fetch prices.' };
        }
    }
    
    // Get available markets for a district
    async getMarketsByDistrict(district) {
        try {
            const { data, error } = await supabase
                .from('buyer_prices')
                .select('market_location, district')
                .eq('district', district)
                .eq('availability_status', 'available')
                .gt('expiry_date', new Date().toISOString())
                .group('market_location, district');
            
            if (error) throw error;
            
            // Also get markets from farmer submissions
            const { data: farmerMarkets, error: farmerError } = await supabase
                .from('market_prices')
                .select('market')
                .eq('district', district)
                .group('market');
            
            const markets = new Set();
            
            if (data) {
                data.forEach(item => markets.add(item.market_location));
            }
            
            if (farmerMarkets && !farmerError) {
                farmerMarkets.forEach(item => markets.add(item.market));
            }
            
            return {
                success: true,
                markets: Array.from(markets).sort()
            };
        } catch (error) {
            console.error('Error getting markets:', error);
            return { success: false, message: 'Failed to fetch markets.' };
        }
    }
    
    // Subscribe to price alerts
    async subscribeToPriceAlerts(phone, cropId, district, minPrice, maxPrice) {
        try {
            const { data, error } = await supabase
                .from('price_alert_subscriptions')
                .insert([{
                    farmer_phone: phone,
                    crop_id: cropId,
                    district: district,
                    min_price_threshold: minPrice,
                    max_price_threshold: maxPrice,
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            // Get crop name for confirmation
            const { data: crop } = await supabase
                .from('crops')
                .select('name')
                .eq('id', cropId)
                .single();
            
            // Send confirmation SMS
            const message = `You subscribed to ${crop.name} price alerts in ${district}. You'll get SMS when prices reach your thresholds.`;
            await sendSMS(phone, message);
            
            return {
                success: true,
                message: 'Subscription successful! You will receive SMS alerts.',
                subscriptionId: data.id
            };
        } catch (error) {
            console.error('Error subscribing to alerts:', error);
            return { success: false, message: 'Subscription failed.' };
        }
    }
    
    // Notify subscribed farmers when new price is posted
    async notifySubscribedFarmers(cropId, district, price, market) {
        try {
            const { data: subscriptions, error } = await supabase
                .from('price_alert_subscriptions')
                .select(`
                    farmer_phone,
                    min_price_threshold,
                    max_price_threshold,
                    crops(name)
                `)
                .eq('crop_id', cropId)
                .eq('district', district)
                .eq('is_active', true);
            
            if (error || !subscriptions || subscriptions.length === 0) {
                return; // No subscribers
            }
            
            const { data: crop } = await supabase
                .from('crops')
                .select('name')
                .eq('id', cropId)
                .single();
            
            // Filter subscribers based on price thresholds
            const notifications = [];
            
            subscriptions.forEach(sub => {
                const shouldNotify = 
                    (sub.min_price_threshold && price >= sub.min_price_threshold) ||
                    (sub.max_price_threshold && price <= sub.max_price_threshold);
                
                if (shouldNotify) {
                    const message = `PRICE ALERT: ${crop.name} buying at MK${price}/kg in ${market}, ${district}. Check Mlimi Advisor for details.`;
                    notifications.push({
                        phone: sub.farmer_phone,
                        message: message
                    });
                }
            });
            
            // Send notifications
            for (const notification of notifications) {
                await sendSMS(notification.phone, notification.message);
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return { success: true, notified: notifications.length };
        } catch (error) {
            console.error('Error notifying farmers:', error);
        }
    }
    
    // Buyer: Schedule SMS broadcast to farmers
    async scheduleSMSBroadcast(buyerId, message, targetDistrict, targetCropId, scheduleTime) {
        try {
            // Verify buyer
            const { data: buyer, error: buyerError } = await supabase
                .from('buyers')
                .select('verified, business_name')
                .eq('id', buyerId)
                .single();
            
            if (buyerError || !buyer || !buyer.verified) {
                return { success: false, message: 'Buyer not verified.' };
            }
            
            // Create broadcast record
            const { data, error } = await supabase
                .from('sms_broadcasts')
                .insert([{
                    buyer_id: buyerId,
                    message: message,
                    target_district: targetDistrict,
                    target_crop_id: targetCropId,
                    scheduled_for: scheduleTime,
                    status: 'scheduled'
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return {
                success: true,
                message: 'SMS broadcast scheduled successfully.',
                broadcastId: data.id
            };
        } catch (error) {
            console.error('Error scheduling SMS broadcast:', error);
            return { success: false, message: 'Failed to schedule broadcast.' };
        }
    }
    
    // Helper: Send welcome SMS to new buyers
    async sendBuyerWelcomeSMS(phone, businessName) {
        const message = `Welcome ${businessName} to Mlimi Advisor Buyer Network! Your registration is pending verification. You will receive SMS when verified.`;
        return await sendSMS(phone, message);
    }
    
    // Get buyer dashboard data
    async getBuyerDashboard(buyerId) {
        try {
            const { data: buyer, error: buyerError } = await supabase
                .from('buyers')
                .select('*')
                .eq('id', buyerId)
                .single();
            
            if (buyerError) throw buyerError;
            
            // Get active price listings
            const { data: activeListings, error: listingsError } = await supabase
                .from('buyer_prices')
                .select(`
                    *,
                    crops(name, local_name)
                `)
                .eq('buyer_id', buyerId)
                .eq('availability_status', 'available')
                .gt('expiry_date', new Date().toISOString())
                .order('created_at', { ascending: false });
            
            // Get stats
            const { count: totalListings, error: countError } = await supabase
                .from('buyer_prices')
                .select('*', { count: 'exact', head: true })
                .eq('buyer_id', buyerId);
            
            const { count: farmersNotified, error: notifyError } = await supabase
                .from('sms_broadcasts')
                .select('*', { count: 'exact', head: true })
                .eq('buyer_id', buyerId)
                .eq('status', 'sent');
            
            return {
                success: true,
                buyer,
                activeListings: activeListings || [],
                stats: {
                    totalListings: totalListings || 0,
                    farmersNotified: farmersNotified || 0,
                    activeListings: activeListings?.length || 0
                }
            };
        } catch (error) {
            console.error('Error getting buyer dashboard:', error);
            return { success: false, message: 'Failed to load dashboard.' };
        }
    }
}

module.exports = new MarketEnhancedService();