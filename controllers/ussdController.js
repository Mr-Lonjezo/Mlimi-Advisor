// controllers/ussdController.js - PRODUCTION VERSION
console.log('✅ USSD Controller loaded successfully!');

// Simple session storage (for production)
const sessions = {};

class USSDController {
    
    handleUSSD = async (req, res) => {
        console.log('\n=== 📞 USSD REQUEST ===');
        
        // Africa's Talking sends data as form-encoded
        const { phoneNumber, sessionId, text } = req.body;
        
        console.log('📱 Phone:', phoneNumber);
        console.log('🆔 Session:', sessionId);
        console.log('📝 Text:', text);

        try {
            let response = '';
            
            // Initialize session if it doesn't exist
            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    currentMenu: 'main',
                    userData: {},
                    phoneNumber: phoneNumber
                };
                console.log('🆕 New session created for:', phoneNumber);
            }

            const session = sessions[sessionId];
            const userInput = text ? text.split('*') : [];
            const currentInput = userInput[userInput.length - 1] || '';

            console.log('📍 Current menu:', session.currentMenu);
            console.log('🎯 Current input:', currentInput);

            // Process based on current menu
            if (session.currentMenu === 'main') {
                response = this.handleMainMenu(session, currentInput);
            } else if (session.currentMenu === 'weather') {
                response = this.handleWeatherMenu(session, currentInput);
            } else if (session.currentMenu === 'pests') {
                response = this.handlePestsMenu(session, currentInput);
            } else if (session.currentMenu === 'prices') {
                response = this.handlePricesMenu(session, currentInput);
            }

            console.log('✅ Response ready');
            
            // Africa's Talking expects text/plain response
            res.set('Content-Type', 'text/plain');
            res.send(response);

        } catch (error) {
            console.error('❌ USSD Error:', error);
            // Always respond with proper USSD format, even on error
            res.set('Content-Type', 'text/plain');
            res.send('END Sorry, service temporarily unavailable. Please try again.');
        }
    }

    handleMainMenu(session, input) {
        if (input === '') {
            return `CON Welcome to Mlimi Advisor\nGet farming information:\n1. Weather Forecast\n2. Pest & Disease Help\n3. Market Prices\n0. Exit`;
        }

        switch (input) {
            case '1':
                session.currentMenu = 'weather';
                return `CON Select your district:\n1. Kasungu\n2. Lilongwe\n3. Mzuzu\n4. Blantyre\n5. Zomba\n0. Back`;
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
                return 'CON Invalid choice. Try again:\n1. Weather\n2. Pest Help\n3. Market Prices\n0. Exit';
        }
    }

    handleWeatherMenu(session, input) {
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
            delete sessions[session.sessionId];
            return `END Weather for ${district}:\n${forecast}`;
        } else {
            return 'CON Invalid district:\n1. Kasungu\n2. Lilongwe\n3. Mzuzu\n4. Blantyre\n5. Zomba\n0. Back';
        }
    }

    handlePestsMenu(session, input) {
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
            return 'CON Invalid crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
        }
    }

    handlePricesMenu(session, input) {
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
            return `END Prices for ${crop}:\n${prices}`;
        } else {
            return 'CON Invalid crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
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
        return forecasts[district] || 'Data not available';
    }

    getPestAdvice(crop) {
        const advice = {
            'Maize': 'Armyworm: Use pesticides\nStalk borer: Remove affected plants',
            'Cassava': 'Mosaic virus: Use clean cuttings\nBrown streak: Plant resistant varieties',
            'Groundnuts': 'Leaf spots: Use fungicide\nRosette: Control aphids',
            'Beans': 'Aphids: Use insecticide\nBean fly: Early planting'
        };
        return advice[crop] || 'Consult extension officer';
    }

    getMarketPrices(crop) {
        const prices = {
            'Maize': 'Kasungu: MWK250/kg\nLilongwe: MWK270/kg\nMzuzu: MWK260/kg',
            'Cassava': 'Kasungu: MWK150/kg\nLilongwe: MWK160/kg\nBlantyre: MWK170/kg',
            'Groundnuts': 'Lilongwe: MWK800/kg\nMzuzu: MWK750/kg\nZomba: MWK780/kg',
            'Beans': 'Kasungu: MWK600/kg\nLilongwe: MWK620/kg\nBlantyre: MWK610/kg'
        };
        return prices[crop] || 'Price data not available';
    }
}

module.exports = new USSDController();