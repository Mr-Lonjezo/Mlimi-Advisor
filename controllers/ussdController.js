// controllers/ussdController.js - FIXED VERSION
console.log('✅ USSD Controller loaded successfully!');

// Simple session storage (for testing)
const sessions = {};

class USSDController {
    
    // IMPORTANT: Use arrow function to bind 'this' correctly
    handleUSSD = async (req, res) => {
        console.log('\n=== 📞 NEW USSD REQUEST ===');
        
        const { phoneNumber, sessionId, text } = req.body;
        
        console.log('Phone:', phoneNumber);
        console.log('Session:', sessionId);
        console.log('Text:', text);

        try {
            let response = '';
            
            // Initialize session if it doesn't exist
            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    currentMenu: 'main',
                    userData: {}
                };
                console.log('🆕 New session created');
            }

            const session = sessions[sessionId];
            const userInput = text ? text.split('*') : [];
            const currentInput = userInput[userInput.length - 1] || '';

            console.log('Current menu:', session.currentMenu);
            console.log('Current input:', currentInput);

            // Process based on current menu
            if (session.currentMenu === 'main') {
                console.log('📍 Processing MAIN menu');
                response = this.handleMainMenu(session, currentInput);
            } else if (session.currentMenu === 'weather') {
                console.log('📍 Processing WEATHER menu');
                response = this.handleWeatherMenu(session, currentInput);
            } else if (session.currentMenu === 'pests') {
                console.log('📍 Processing PESTS menu');
                response = this.handlePestsMenu(session, currentInput);
            } else if (session.currentMenu === 'prices') {
                console.log('📍 Processing PRICES menu');
                response = this.handlePricesMenu(session, currentInput);
            } else {
                console.log('📍 Unknown menu, defaulting to MAIN');
                response = this.handleMainMenu(session, currentInput);
            }

            console.log('✅ Sending response:', response.substring(0, 50) + '...');
            
            res.set('Content-Type', 'text/plain');
            res.send(response);

        } catch (error) {
            console.error('❌ USSD Error:', error);
            console.error('Error stack:', error.stack);
            res.set('Content-Type', 'text/plain');
            res.send('END Sorry, an error occurred. Please try again.');
        }
    }

    handleMainMenu(session, input) {
        console.log('🔄 handleMainMenu called with input:', input);
        
        if (input === '') {
            // First time - show main menu
            return `CON Welcome to Mlimi Advisor 🌱\nChoose service:\n1. Weather Forecast\n2. Pest & Disease Help\n3. Market Prices\n0. Exit`;
        }

        switch (input) {
            case '1':
                session.currentMenu = 'weather';
                return this.showWeatherMenu();
            case '2':
                session.currentMenu = 'pests';
                return this.showPestsMenu();
            case '3':
                session.currentMenu = 'prices';
                return this.showPricesMenu();
            case '0':
                delete sessions[session.sessionId];
                return 'END Thank you for using Mlimi Advisor!';
            default:
                return 'CON Invalid choice. Please try again:\n1. Weather\n2. Pest Help\n3. Market Prices\n0. Exit';
        }
    }

    handleWeatherMenu(session, input) {
        console.log('🔄 handleWeatherMenu called with input:', input);
        
        if (input === '') {
            return `CON Select your district:\n1. Kasungu\n2. Lilongwe\n3. Mzuzu\n4. Blantyre\n5. Zomba\n0. Back`;
        }

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
            // Get weather and end session
            const forecast = this.getWeatherForecast(district);
            delete sessions[session.sessionId];
            return `END 🌤️ Weather for ${district}:\n${forecast}`;
        } else {
            return 'CON Invalid district. Choose:\n1. Kasungu\n2. Lilongwe\n3. Mzuzu\n4. Blantyre\n5. Zomba\n0. Back';
        }
    }

    handlePestsMenu(session, input) {
        console.log('🔄 handlePestsMenu called with input:', input);
        
        if (input === '') {
            return `CON Select your crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
        }

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
            return `END 🐛 Pest advice for ${crop}:\n${advice}`;
        } else {
            return 'CON Invalid crop. Choose:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
        }
    }

    handlePricesMenu(session, input) {
        console.log('🔄 handlePricesMenu called with input:', input);
        
        if (input === '') {
            return `CON Select crop for prices:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
        }

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
            return `END 💰 Prices for ${crop}:\n${prices}`;
        } else {
            return 'CON Invalid crop. Choose:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
        }
    }

    showWeatherMenu() {
        return `CON Select your district:\n1. Kasungu\n2. Lilongwe\n3. Mzuzu\n4. Blantyre\n5. Zomba\n0. Back`;
    }

    showPestsMenu() {
        return `CON Select your crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
    }

    showPricesMenu() {
        return `CON Select crop for prices:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
    }

    getWeatherForecast(district) {
        const forecasts = {
            'Kasungu': 'Today: Sunny 28°C\nTomorrow: Sunny 29°C\nDay 3: Partly cloudy 27°C',
            'Lilongwe': 'Today: Partly cloudy 26°C\nTomorrow: Rain 24°C\nDay 3: Cloudy 25°C',
            'Mzuzu': 'Today: Cloudy 23°C\nTomorrow: Rain 22°C\nDay 3: Rain 21°C',
            'Blantyre': 'Today: Sunny 30°C\nTomorrow: Sunny 31°C\nDay 3: Partly cloudy 29°C',
            'Zomba': 'Today: Partly cloudy 25°C\nTomorrow: Rain 23°C\nDay 3: Cloudy 24°C'
        };
        return forecasts[district] || 'Weather data not available';
    }

    getPestAdvice(crop) {
        const advice = {
            'Maize': 'Common: Armyworm, Stalk borer\nTreatment: Use neem extract\nPrevention: Early planting',
            'Cassava': 'Common: Mosaic virus\nTreatment: Remove infected plants\nPrevention: Use clean cuttings',
            'Groundnuts': 'Common: Leaf spots\nTreatment: Fungicide spray\nPrevention: Crop rotation',
            'Beans': 'Common: Aphids\nTreatment: Insecticide soap\nPrevention: Companion planting'
        };
        return advice[crop] || 'Consult local extension officer';
    }

    getMarketPrices(crop) {
        const prices = {
            'Maize': 'Kasungu: MWK 250/kg\nLilongwe: MWK 270/kg\nMzuzu: MWK 260/kg',
            'Cassava': 'Kasungu: MWK 150/kg\nLilongwe: MWK 160/kg\nBlantyre: MWK 170/kg',
            'Groundnuts': 'Lilongwe: MWK 800/kg\nMzuzu: MWK 750/kg\nZomba: MWK 780/kg',
            'Beans': 'Kasungu: MWK 600/kg\nLilongwe: MWK 620/kg\nBlantyre: MWK 610/kg'
        };
        return prices[crop] || 'Price data not available';
    }
}

// Create instance and export
const ussdController = new USSDController();
module.exports = ussdController;