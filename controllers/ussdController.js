// controllers/ussdController.js - AFRICA'S TALKING COMPATIBLE
console.log('✅ USSD Controller loaded successfully!');

// Session storage
const sessions = {};

class USSDController {
    
    handleUSSD = async (req, res) => {
        console.log('\n=== 📞 AFRICA\'S TALKING USSD REQUEST ===');
        
        // Africa's Talking sends data as application/x-www-form-urlencoded
        const { phoneNumber, sessionId, text } = req.body;
        
        console.log('📱 Phone:', phoneNumber);
        console.log('🆔 Session:', sessionId);
        console.log('📝 Text:', text || '(empty)');

        try {
            let response = '';
            
            // Africa's Talking specific: session ends if we return "END"
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

            // Africa's Talking expects text/plain response
            res.set('Content-Type', 'text/plain');
            res.send(response);

        } catch (error) {
            console.error('❌ USSD Error:', error);
            // Always respond with proper USSD format
            res.set('Content-Type', 'text/plain');
            res.send('END Technical error. Please try again later.');
        }
    }

    async processMenu(session, currentInput, userInput) {
        // Clean up old sessions (24 hours old)
        this.cleanupSessions();

        switch (session.currentMenu) {
            case 'main':
                return this.handleMainMenu(session, currentInput);
            case 'weather':
                return this.handleWeatherMenu(session, currentInput);
            case 'pests':
                return this.handlePestsMenu(session, currentInput);
            case 'prices':
                return this.handlePricesMenu(session, currentInput);
            default:
                return this.handleMainMenu(session, currentInput);
        }
    }

    handleMainMenu(session, input) {
        // Update session timestamp
        session.lastActivity = new Date();

        if (input === '') {
            // First interaction - show main menu
            return `CON Welcome to Mlimi Advisor\nGet farming information:\n1. Weather Forecast\n2. Pest & Disease Help\n3. Market Prices\n0. Exit`;
        }

        switch (input) {
            case '1':
                session.currentMenu = 'weather';
                return `CON Enter your district:\n1. Kasungu\n2. Lilongwe\n3. Mzuzu\n4. Blantyre\n5. Zomba\n0. Back`;
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

    handleWeatherMenu(session, input) {
        session.lastActivity = new Date();

        if (input === '0') {
            session.currentMenu = 'main';
            return this.handleMainMenu(session, '');
        }

        const districts = {
            '1': 'Kasungu', '2': 'Lilongwe', '3': 'Mzuzu', 
            '4': 'Blantyre', '5': 'Zomba'
        };

        const district = districts[input];
        if (district) {
            const forecast = this.getWeatherForecast(district);
            delete sessions[session.sessionId]; // End session
            return `END Weather for ${district}:\n${forecast}`;
        } else {
            return 'CON Invalid district. Select:\n1. Kasungu\n2. Lilongwe\n3. Mzuzu\n4. Blantyre\n5. Zomba\n0. Back';
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
            delete sessions[session.sessionId]; // End session
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
            delete sessions[session.sessionId]; // End session
            return `END Market prices for ${crop}:\n${prices}`;
        } else {
            return 'CON Invalid crop. Select:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
        }
    }

    getWeatherForecast(district) {
        const forecasts = {
            'Kasungu': 'Today: Sunny 28C\nTomorrow: Sunny 29C\nDay3: Cloudy 27C',
            'Lilongwe': 'Today: Cloudy 26C\nTomorrow: Rain 24C\nDay3: Cloudy 25C',
            'Mzuzu': 'Today: Cloudy 23C\nTomorrow: Rain 22C\nDay3: Rain 21C',
            'Blantyre': 'Today: Sunny 30C\nTomorrow: Sunny 31C\nDay3: Cloudy 29C',
            'Zomba': 'Today: Cloudy 25C\nTomorrow: Rain 23C\nDay3: Cloudy 24C'
        };
        return forecasts[district] || 'Weather data not available';
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