// services/webInterfaceService.js - Web Interface for Data Collection
const { createClient } = require('@supabase/supabase-js');

class WebInterfaceService {
    constructor() {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            console.log('⚠️ Supabase credentials not found. Web interface disabled.');
            this.supabase = null;
        } else {
            this.supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_KEY
            );
            console.log('✅ Web Interface Service initialized');
        }
    }

    async submitMarketPrice(data) {
        console.log('💰 Processing price submission:', data);
        
        if (!this.supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            // Validate data
            const validation = this.validatePriceData(data);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Get crop ID
            const { data: crop, error: cropError } = await this.supabase
                .from('crops')
                .select('id')
                .eq('name', data.cropName)
                .single();

            if (cropError || !crop) {
                // Create crop if doesn't exist
                const { data: newCrop, error: createError } = await this.supabase
                    .from('crops')
                    .insert([{ 
                        name: data.cropName,
                        local_name: data.localName || data.cropName,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (createError) {
                    return { success: false, error: 'Failed to create crop record' };
                }
                
                data.crop_id = newCrop.id;
            } else {
                data.crop_id = crop.id;
            }

            // Insert price data
            const { data: price, error: priceError } = await this.supabase
                .from('market_prices')
                .insert([{
                    crop_id: data.crop_id,
                    market_name: data.marketName,
                    price: data.price,
                    currency: data.currency || 'MWK',
                    unit: data.unit || 'kg',
                    date_recorded: new Date().toISOString().split('T')[0],
                    source: 'Farmer Submission',
                    farmer_name: data.farmerName || 'Anonymous',
                    farmer_phone: data.farmerPhone || null,
                    quality: data.quality || 'Standard',
                    notes: data.notes || '',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (priceError) {
                console.error('❌ Price submission error:', priceError);
                return { success: false, error: 'Failed to save price data' };
            }

            console.log('✅ Price submitted successfully:', price.id);
            return { 
                success: true, 
                message: 'Thank you! Price submitted successfully.',
                data: price 
            };

        } catch (error) {
            console.error('❌ Submission error:', error);
            return { success: false, error: 'Server error' };
        }
    }

    validatePriceData(data) {
        const required = ['cropName', 'marketName', 'price'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            return { valid: false, error: `Missing fields: ${missing.join(', ')}` };
        }

        if (isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
            return { valid: false, error: 'Price must be a positive number' };
        }

        if (data.farmerPhone && !/^\+?[0-9\s\-\(\)]{10,}$/.test(data.farmerPhone)) {
            return { valid: false, error: 'Invalid phone number format' };
        }

        return { valid: true };
    }

    async getRecentSubmissions(limit = 20) {
        if (!this.supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data: submissions, error } = await this.supabase
                .from('market_prices')
                .select(`
                    *,
                    crops (name, local_name)
                `)
                .eq('source', 'Farmer Submission')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Error fetching submissions:', error);
                return { success: false, error: 'Failed to fetch data' };
            }

            return { success: true, data: submissions };

        } catch (error) {
            console.error('❌ Fetch error:', error);
            return { success: false, error: 'Server error' };
        }
    }
}

module.exports = new WebInterfaceService();