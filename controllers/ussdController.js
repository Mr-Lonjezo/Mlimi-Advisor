// controllers/ussdController.js - WITH ALL DISTRICTS AND REGIONAL MENUS
console.log('✅ USSD Controller loaded successfully!');

// Import the new weather service
const weatherService = require('../services/weatherService');

// Session storage
const sessions = {};

class USSDController {
    
    handleUSSD = async (req, res) => {
        console.log('\n=== 📞 AFRICA\'S TALKING USSD REQUEST ===');
        
        const { phoneNumber, sessionId, text } = req.body;
        
        console.log('📱 Phone:', phoneNumber);
        console.log('🆔 Session:', sessionId);
        console.log('📝 Text:', text || '(empty)');

        try {
            let response = '';
            
            if (!sessionId) {
                console.log('❌ No sessionId provided');
                return res.send('END Invalid session');
            }

            // Initialize session if it doesn't exist
            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    currentMenu: 'main',
                    userData: {},
                    phoneNumber: phoneNumber,
                    createdAt: new Date()
                };
                console.log('🆕 New session created for:', phoneNumber);
            }

            const session = sessions[sessionId];
            const userInput = text ? text.split('*') : [];
            const currentInput = userInput[userInput.length - 1] || '';

            console.log('📍 Current menu:', session.currentMenu);
            console.log('🎯 User input array:', userInput);
            console.log('🎯 Current input:', currentInput);

            // Process menu navigation
            response = await this.processMenu(session, currentInput, userInput);
            
            console.log('✅ Sending response to Africa\'s Talking');
            console.log('Response preview:', response.substring(0, 100) + '...');

            res.set('Content-Type', 'text/plain');
            res.send(response);

        } catch (error) {
            console.error('❌ USSD Error:', error);
            res.set('Content-Type', 'text/plain');
            res.send('END Technical error. Please try again later.');
        }
    }

    async processMenu(session, currentInput, userInput) {
        this.cleanupSessions();

        switch (session.currentMenu) {
            case 'main':
                return this.handleMainMenu(session, currentInput);
            case 'weather_region':
                return this.handleWeatherRegionMenu(session, currentInput);
            case 'weather_northern':
            case 'weather_central':
            case 'weather_southern':
                return await this.handleDistrictSelection(session, currentInput);
            case 'pests':
                return this.handlePestsMenu(session, currentInput);
            case 'prices':
                return this.handlePricesMenu(session, currentInput);
            default:
                return this.handleMainMenu(session, currentInput);
        }
    }

    handleMainMenu(session, input) {
        session.lastActivity = new Date();

        if (input === '') {
            return `CON Welcome to Mlimi Advisor\nGet farming information:\n1. Weather Forecast\n2. Pest & Disease Help\n3. Market Prices\n0. Exit`;
        }

        switch (input) {
            case '1':
                session.currentMenu = 'weather_region';
                return `CON Select your region:\n1. Northern Region\n2. Central Region\n3. Southern Region\n0. Back`;
            case '2':
                session.currentMenu = 'pests';
                return `CON Select your crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
            case '3':
                session.currentMenu = 'prices';
                return `CON Select crop for prices:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
            case '0':
                delete sessions[session.sessionId];
                return 'END Thank you for using Mlimi Advisor!';
            default:
                return 'CON Invalid choice. Please select:\n1. Weather\n2. Pest Help\n3. Market Prices\n0. Exit';
        }
    }

    handleWeatherRegionMenu(session, input) {
        session.lastActivity = new Date();

        if (input === '0') {
            session.currentMenu = 'main';
            return this.handleMainMenu(session, '');
        }

        const regions = {
            '1': 'northern',
            '2': 'central', 
            '3': 'southern'
        };

        const region = regions[input];
        if (region) {
            session.currentMenu = `weather_${region}`;
            session.userData.region = region;
            return this.showDistrictsByRegion(region);
        } else {
            return 'CON Invalid region. Select:\n1. Northern\n2. Central\n3. Southern\n0. Back';
        }
    }

    showDistrictsByRegion(region) {
        const districtMenus = {
            northern: `CON Northern Region:\n1. Chitipa\n2. Karonga\n3. Likoma\n4. Mzimba\n5. Nkhata Bay\n6. Rumphi\n0. Back`,
            
            central: `CON Central Region:\n1. Dedza\n2. Dowa\n3. Kasungu\n4. Lilongwe\n5. Mchinji\n6. Nkhotakota\n7. Ntcheu\n8. Ntchisi\n9. Salima\n0. Back`,
            
            southern: `CON Southern Region:\n1. Balaka\n2. Blantyre\n3. Chikwawa\n4. Chiradzulu\n5. Machinga\n6. Mangochi\n7. Mulanje\n8. Mwanza\n9. Nsanje\n10. Thyolo\n11. Phalombe\n12. Zomba\n13. Neno\n0. Back`
        };

        return districtMenus[region] || 'CON Region not found.';
    }

    async handleDistrictSelection(session, input) {
        session.lastActivity = new Date();

        if (input === '0') {
            session.currentMenu = 'weather_region';
            return this.handleWeatherRegionMenu(session, '');
        }

        // District mapping by region
        const regionDistricts = {
            northern: {
                '1': 'Chitipa', '2': 'Karonga', '3': 'Likoma',
                '4': 'Mzimba', '5': 'Nkhata Bay', '6': 'Rumphi'
            },
            central: {
                '1': 'Dedza', '2': 'Dowa', '3': 'Kasungu',
                '4': 'Lilongwe', '5': 'Mchinji', '6': 'Nkhotakota',
                '7': 'Ntcheu', '8': 'Ntchisi', '9': 'Salima'
            },
            southern: {
                '1': 'Balaka', '2': 'Blantyre', '3': 'Chikwawa',
                '4': 'Chiradzulu', '5': 'Machinga', '6': 'Mangochi',
                '7': 'Mulanje', '8': 'Mwanza', '9': 'Nsanje',
                '10': 'Thyolo', '11': 'Phalombe', '12': 'Zomba',
                '13': 'Neno'
            }
        };

        const region = session.userData.region;
        const districts = regionDistricts[region];
        const district = districts[input];

        if (district) {
            console.log(`📍 User selected district: ${district} in ${region} region`);
            
            const forecast = await weatherService.getForecastByDistrict(district);
            delete sessions[session.sessionId];
            return `END ${forecast}`;
        } else {
            return `CON Invalid district in ${region} region.\n${this.showDistrictsByRegion(region).replace('CON ', '')}`;
        }
    }

    handlePestsMenu(session, input) {
        session.lastActivity = new Date();

        if (input === '0') {
            session.currentMenu = 'main';
            return this.handleMainMenu(session, '');
        }

        const crops = {
            '1': 'Maize', '2': 'Cassava', '3': 'Groundnuts', '4': 'Beans'
        };

        const crop = crops[input];
        if (crop) {
            const advice = this.getPestAdvice(crop);
            delete sessions[session.sessionId];
            return `END Pest advice for ${crop}:\n${advice}`;
        } else {
            return 'CON Invalid crop. Select:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
        }
    }

    handlePricesMenu(session, input) {
        session.lastActivity = new Date();

        if (input === '0') {
            session.currentMenu = 'main';
            return this.handleMainMenu(session, '');
        }

        const crops = {
            '1': 'Maize', '2': 'Cassava', '3': 'Groundnuts', '4': 'Beans'
        };

        const crop = crops[input];
        if (crop) {
            const prices = this.getMarketPrices(crop);
            delete sessions[session.sessionId];
            return `END Market prices for ${crop}:\n${prices}`;
        } else {
            return 'CON Invalid crop. Select:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
        }
    }

    getPestAdvice(crop) {
        const advice = {
            'Maize': 'Common: Armyworm, Stalk borer\nUse neem extract or pesticides\nRemove affected plants',
            'Cassava': 'Common: Mosaic virus\nUse disease-free cuttings\nPlant resistant varieties',
            'Groundnuts': 'Common: Leaf spots, Rosette\nUse fungicide spray\nControl aphids',
            'Beans': 'Common: Aphids, Bean fly\nUse insecticide soap\nPractice early planting'
        };
        return advice[crop] || 'Consult local agriculture extension officer';
    }

    getMarketPrices(crop) {
        const prices = {
            'Maize': 'Kasungu: MWK250/kg\nLilongwe: MWK270/kg\nMzuzu: MWK260/kg',
            'Cassava': 'Kasungu: MWK150/kg\nLilongwe: MWK160/kg\nBlantyre: MWK170/kg',
            'Groundnuts': 'Lilongwe: MWK800/kg\nMzuzu: MWK750/kg\nZomba: MWK780/kg',
            'Beans': 'Kasungu: MWK600/kg\nLilongwe: MWK620/kg\nBlantyre: MWK610/kg'
        };
        return prices[crop] || 'Price information not available';
    }

    cleanupSessions() {
        const now = new Date();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        Object.keys(sessions).forEach(sessionId => {
            const session = sessions[sessionId];
            if (now - session.createdAt > twentyFourHours) {
                delete sessions[sessionId];
                console.log('🧹 Cleaned up old session:', sessionId);
            }
        });
    }
}

module.exports = new USSDController();