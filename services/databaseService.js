// services/databaseService.js
const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
    constructor() {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            console.log('⚠️ Supabase credentials not found. Using mock data.');
            this.supabase = null;
        } else {
            this.supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_KEY
            );
            console.log('✅ Database Service initialized');
        }
    }

    async getPestAdvice(cropName) {
        console.log(`🐛 Getting pest advice for: ${cropName}`);
        
        if (!this.supabase) {
            return this.getMockPestAdvice(cropName);
        }

        try {
            // First get crop ID
            const { data: crop, error: cropError } = await this.supabase
                .from('crops')
                .select('id, name, local_name')
                .eq('name', cropName)
                .single();

            if (cropError || !crop) {
                console.log(`❌ Crop not found: ${cropName}`);
                return this.getMockPestAdvice(cropName);
            }

            // Get pests for this crop
            const { data: pests, error: pestsError } = await this.supabase
                .from('pests')
                .select('*')
                .eq('crop_id', crop.id)
                .order('severity', { ascending: false })
                .limit(3);

            if (pestsError) {
                console.log('❌ Error fetching pests:', pestsError.message);
                return this.getMockPestAdvice(cropName);
            }

            if (!pests || pests.length === 0) {
                return `No pest information available for ${cropName}.`;
            }

            return this.formatPestAdviceForUSSD(crop, pests);
            
        } catch (error) {
            console.error('❌ Database error:', error);
            return this.getMockPestAdvice(cropName);
        }
    }

    async getMarketPrices(cropName) {
        console.log(`💰 Getting market prices for: ${cropName}`);
        
        if (!this.supabase) {
            return this.getMockPrices(cropName);
        }

        try {
            // Get crop ID
            const { data: crop, error: cropError } = await this.supabase
                .from('crops')
                .select('id, name, local_name')
                .eq('name', cropName)
                .single();

            if (cropError || !crop) {
                console.log(`❌ Crop not found: ${cropName}`);
                return this.getMockPrices(cropName);
            }

            // Get latest prices (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: prices, error: pricesError } = await this.supabase
                .from('market_prices')
                .select('*')
                .eq('crop_id', crop.id)
                .gte('date_recorded', thirtyDaysAgo.toISOString().split('T')[0])
                .order('date_recorded', { ascending: false })
                .limit(5);

            if (pricesError) {
                console.log('❌ Error fetching prices:', pricesError.message);
                return this.getMockPrices(cropName);
            }

            if (!prices || prices.length === 0) {
                return `No recent price data for ${cropName}. Check local markets.`;
            }

            return this.formatPricesForUSSD(crop, prices);
            
        } catch (error) {
            console.error('❌ Database error:', error);
            return this.getMockPrices(cropName);
        }
    }

    async getFarmingTips(cropName, month = null) {
        console.log(`🌱 Getting farming tips for: ${cropName}`);
        
        if (!this.supabase) {
            return this.getMockTips(cropName);
        }

        try {
            // Get crop ID
            const { data: crop, error: cropError } = await this.supabase
                .from('crops')
                .select('id, name, local_name')
                .eq('name', cropName)
                .single();

            if (cropError || !crop) {
                return this.getMockTips(cropName);
            }

            // Build query
            let query = this.supabase
                .from('farming_tips')
                .select('*')
                .eq('crop_id', crop.id);

            // If month is specified, filter by month
            if (month) {
                query = query.eq('month', month);
            }

            const { data: tips, error: tipsError } = await query
                .order('tip_type')
                .limit(3);

            if (tipsError || !tips || tips.length === 0) {
                return this.getMockTips(cropName);
            }

            return this.formatTipsForUSSD(crop, tips);
            
        } catch (error) {
            console.error('❌ Database error:', error);
            return this.getMockTips(cropName);
        }
    }

    formatPestAdviceForUSSD(crop, pests) {
        let response = `🐛 ${crop.name} (${crop.local_name}) - Pest Advice:\n\n`;
        
        pests.forEach((pest, index) => {
            response += `${pest.name}:\n`;
            
            if (pest.symptoms) {
                const shortSymptoms = pest.symptoms.length > 80 
                    ? pest.symptoms.substring(0, 80) + '...' 
                    : pest.symptoms;
                response += `Symptoms: ${shortSymptoms}\n`;
            }
            
            if (pest.organic_treatment) {
                const shortOrganic = pest.organic_treatment.length > 80
                    ? pest.organic_treatment.substring(0, 80) + '...'
                    : pest.organic_treatment;
                response += `Organic: ${shortOrganic}\n`;
            }
            
            if (pest.prevention) {
                const shortPrevention = pest.prevention.length > 80
                    ? pest.prevention.substring(0, 80) + '...'
                    : pest.prevention;
                response += `Prevent: ${shortPrevention}\n`;
            }
            
            response += '\n';
        });

        return response + 'For more details, consult agriculture extension officer.';
    }

    formatPricesForUSSD(crop, prices) {
        let response = `💰 ${crop.name} (${crop.local_name}) - Market Prices:\n\n`;
        
        // Group by market for latest price per market
        const marketPrices = {};
        prices.forEach(price => {
            if (!marketPrices[price.market_name] || 
                new Date(price.date_recorded) > new Date(marketPrices[price.market_name].date_recorded)) {
                marketPrices[price.market_name] = price;
            }
        });

        Object.values(marketPrices).forEach(price => {
            const date = new Date(price.date_recorded);
            const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            response += `${price.market_name}: MWK${price.price}/${price.unit} (${dateStr})\n`;
            
            if (price.source) {
                response += `Source: ${price.source}\n`;
            }
            
            response += '\n';
        });

        return response + 'Prices may vary. Check local markets.';
    }

    formatTipsForUSSD(crop, tips) {
        let response = `🌱 ${crop.name} (${crop.local_name}) - Farming Tips:\n\n`;
        
        tips.forEach((tip, index) => {
            response += `${tip.title}:\n`;
            
            if (tip.description) {
                const shortDesc = tip.description.length > 100
                    ? tip.description.substring(0, 100) + '...'
                    : tip.description;
                response += `${shortDesc}\n`;
            }
            
            if (tip.month && tip.month !== 'Any month') {
                response += `Best in: ${tip.month}\n`;
            }
            
            response += '\n';
        });

        return response;
    }

    // Fallback mock data
    getMockPestAdvice(cropName) {
        const mockAdvice = {
            'Maize': 'Common pests: Armyworm, Stalk borer\nTreatment: Use neem extract\nPrevention: Early planting',
            'Cassava': 'Common: Mosaic disease\nTreatment: Use clean cuttings\nPrevention: Resistant varieties',
            'Groundnuts': 'Common: Rosette, Leaf spots\nTreatment: Fungicide spray\nPrevention: Early planting',
            'Beans': 'Common: Aphids, Bean fly\nTreatment: Insecticide soap\nPrevention: Companion planting'
        };
        return mockAdvice[cropName] || 'Pest information not available. Consult local agriculture office.';
    }

    getMockPrices(cropName) {
        const mockPrices = {
            'Maize': 'Kasungu: MWK250/kg\nLilongwe: MWK270/kg\nMzuzu: MWK260/kg',
            'Cassava': 'Kasungu: MWK150/kg\nLilongwe: MWK160/kg\nBlantyre: MWK170/kg',
            'Groundnuts': 'Lilongwe: MWK800/kg\nMzuzu: MWK750/kg\nZomba: MWK780/kg',
            'Beans': 'Kasungu: MWK600/kg\nLilongwe: MWK620/kg\nBlantyre: MWK610/kg'
        };
        return mockPrices[cropName] || 'Price data not available. Check local markets.';
    }

    getMockTips(cropName) {
        const mockTips = {
            'Maize': 'Plant in rainy season\nUse basal fertilizer\nSpace plants 75cm apart',
            'Cassava': 'Drought resistant crop\nPlant stem cuttings\nHarvest after 8-12 months',
            'Groundnuts': 'Plant in well-drained soil\nUse calcium fertilizer\nHarvest when leaves yellow',
            'Beans': 'Plant 2-5cm deep\nUse inoculants for nitrogen\nHarvest when pods are dry'
        };
        return mockTips[cropName] || 'Farming tips not available for this crop.';
    }
}

module.exports = new DatabaseService();