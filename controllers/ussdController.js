const plantingCalendarService = require('../services/plantingCalendarService');
const paginationService = require('../services/paginationService');
const databaseService = require('../services/databaseService');
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
                    return await this.handlePestsMenu(session, currentInput);
                case 'prices':
                    return await this.handlePricesMenu(session, currentInput);
                case 'planting_menu':
                    return await this.handlePlantingMenu(session, currentInput);
                case 'planting_crop_select':
                    return await this.handlePlantingCropSelect(session, currentInput);
                case 'planting_month_select':
                    return await this.handlePlantingMonthSelect(session, currentInput);
                case 'symptoms_menu':
                    return await this.handleSymptomsMenu(session, currentInput);
                case 'symptoms_ai_quick':
                    return await this.handleSymptomsAIQuick(session, currentInput);
                case 'symptoms_ai_crop':
                    return await this.handleSymptomsAICrop(session, currentInput);
                case 'symptoms_interactive_crop':
                    return await this.handleSymptomsInteractiveCrop(session, currentInput);
                case 'symptoms_interactive_q1':
                    return await this.handleSymptomsInteractiveQ1(session, currentInput);
                default:
                    return this.handleMainMenu(session, currentInput);
        }
    }

    handleMainMenu(session, input) {
        session.lastActivity = new Date();

        if (input === '') {
             return `CON Welcome to Mlimi Advisor\nGet farming information:\n1. Weather Forecast\n2. Pest & Disease Help\n3. Market Prices\n4. Planting Calendar\n5. AI Symptoms Checker\n0. Exit`;
        }

        switch (input) {
            case '1':
                session.currentMenu = 'weather_region';
                return `CON Select your region:\n1. Northern Region\n2. Central Region\n3. Southern Region\n0. Back`;
            case '2':
                session.currentMenu = 'pests';
                return `CON Select your crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back`;
            case '3':
                session.currentMenu = 'prices';
                return `CON Select crop for prices:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back`;
            case '4':
                session.currentMenu = 'planting_menu';
                return `CON Planting Calendar:\n1. What to plant now\n2. Crop planting guide\n3. Monthly planting\n0. Back`;
            case '5':
                session.currentMenu = 'symptoms_menu';
                return `CON AI Symptoms Checker:\n1. Quick AI Diagnosis\n2. Interactive Wizard\n3. Manual Guide\n0. Back`;
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
      session.lastInput = input; // Store for pagination
  
      // Handle pagination navigation
      if (session.pagination && session.pagination.weather) {
        if (['99', '98', '0'].includes(input)) {
            const paginated = paginationService.paginateWeatherData(
                session.weatherData,
                session.userData.district,
                session
            );
            
            if (paginated === null) {
                // User chose '0' to exit pagination
                delete session.pagination;
                delete session.weatherData;
                session.currentMenu = 'weather_' + session.userData.region;
                return this.showDistrictsByRegion(session.userData.region);
            }
            
            delete sessions[session.sessionId];
            return paginated.content;
        }
      }
  
      if (input === '0') {
          session.currentMenu = 'weather_region';
          return this.handleWeatherRegionMenu(session, '');
      }
  
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
          
          const rawForecast = await weatherService.getForecastByDistrict(district);
          session.weatherData = rawForecast; // Store for pagination
          
          // Paginate the weather data
          const paginated = paginationService.paginateWeatherData(
              rawForecast,
              district,
              session
          );
          
          if (paginated.isPaginated) {
              // Multi-page response
              return paginated.content;
          } else {
              // Single page response
              delete sessions[session.sessionId];
              return `END ${paginated.content}`;
          }
      } else {
          return `CON Invalid district in ${region} region.\n${this.showDistrictsByRegion(region).replace('CON ', '')}`;
      }
 }  

    async handlePestsMenu(session, input) {
      session.lastActivity = new Date();
      session.lastInput = input;
  
      // Handle pagination navigation
      if (session.pagination && session.pagination.pests) {
          if (['99', '98', '0'].includes(input)) {
              const paginated = paginationService.paginatePestAdvice(
                  session.pestData,
                  session.userData.crop,
                  session
              );
              
              if (paginated === null) {
                  // User chose '0' to exit pagination
                  delete session.pagination;
                  delete session.pestData;
                  session.currentMenu = 'pests';
                  return `CON Select your crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back`;
              }
              
              delete sessions[session.sessionId];
              return paginated.content;
          }
      }
  
      if (input === '0') {
          session.currentMenu = 'main';
          return this.handleMainMenu(session, '');
      }
  
      const crops = {
          '1': 'Maize', '2': 'Cassava', '3': 'Groundnuts', '4': 'Beans',
          '5': 'Rice', '6': 'Sweet Potatoes'
      };
  
      const crop = crops[input];
      if (crop) {
          // Use database service
          const rawAdvice = await databaseService.getPestAdvice(crop);
          session.pestData = rawAdvice; // Store for pagination
          session.userData.crop = crop;
          
          // Paginate the pest advice
          const paginated = paginationService.paginatePestAdvice(
              rawAdvice,
              crop,
              session
          );
          
          if (paginated.isPaginated) {
              // Multi-page response
              return paginated.content;
          } else {
              // Single page response
              delete sessions[session.sessionId];
              return `END ${paginated.content}`;
          }
      } else {
          return 'CON Invalid crop. Select:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back';
      }
  }


   async handlePricesMenu(session, input) {
    session.lastActivity = new Date();
    session.lastInput = input;

    // Handle pagination navigation
    if (session.pagination && session.pagination.prices) {
        if (['99', '98', '0'].includes(input)) {
            const paginated = paginationService.paginateMarketPrices(
                session.priceData,
                session.userData.crop,
                session
            );
            
            if (paginated === null) {
                // User chose '0' to exit pagination
                delete session.pagination;
                delete session.priceData;
                session.currentMenu = 'prices';
                return `CON Select crop for prices:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back`;
            }
            
            delete sessions[session.sessionId];
            return paginated.content;
        }
    }

    if (input === '0') {
        session.currentMenu = 'main';
        return this.handleMainMenu(session, '');
    }

    const crops = {
        '1': 'Maize', '2': 'Cassava', '3': 'Groundnuts', '4': 'Beans',
        '5': 'Rice', '6': 'Sweet Potatoes'
    };

    const crop = crops[input];
    if (crop) {
        // Use database service
        const rawPrices = await databaseService.getMarketPrices(crop);
        session.priceData = rawPrices; // Store for pagination
        session.userData.crop = crop;
        
        // Paginate the market prices
        const paginated = paginationService.paginateMarketPrices(
            rawPrices,
            crop,
            session
        );
        
        if (paginated.isPaginated) {
            // Multi-page response
            return paginated.content;
        } else {
            // Single page response
            delete sessions[session.sessionId];
            return `END ${paginated.content}`;
        }
    } else {
        return 'CON Invalid crop. Select:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back';
    }
  }
  async handleSymptomsMenu(session, input) {
    session.lastActivity = new Date();
    session.lastInput = input;

    if (input === '0') {
        session.currentMenu = 'main';
        return this.handleMainMenu(session, '');
    }

    switch (input) {
        case '1':
            session.currentMenu = 'symptoms_ai_quick';
            return `CON Enter symptoms briefly:\n(e.g., "yellow leaves with spots")`;
        case '2':
            session.currentMenu = 'symptoms_interactive_crop';
            return `CON Interactive Diagnosis\nSelect your crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
        case '3':
            session.currentMenu = 'symptoms_manual_crop';
            return `CON Manual Diagnosis\nSelect crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back`;
        default:
            return 'CON Invalid choice:\n1. Quick AI Diagnosis\n2. Interactive Wizard\n3. Manual Guide\n0. Back';
    }
}

async handleSymptomsAIQuick(session, input) {
    session.lastActivity = new Date();
    session.lastInput = input;

    if (input === '0') {
        session.currentMenu = 'symptoms_menu';
        return this.handleSymptomsMenu(session, '');
    }

    if (!session.userData.aiCrop) {
        // First, get the crop
        session.currentMenu = 'symptoms_ai_crop';
        session.userData.symptomsText = input;
        return `CON Select crop for diagnosis:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back`;
    }

    // We have both crop and symptoms
    const crop = session.userData.aiCrop;
    const symptoms = session.userData.symptomsText || input;
    
    console.log(`🤖 AI Diagnosis requested for ${crop}: ${symptoms}`);
    
    try {
        const diagnosis = await symptomsWizardService.quickDiagnosis(crop, symptoms);
        
        // Check if we need pagination
        if (diagnosis.length > 400) {
            session.diagnosisData = diagnosis;
            
            const paginated = paginationService.paginateForUSSD(
                diagnosis,
                session,
                'ai_diagnosis'
            );
            
            if (paginated && paginated.isPaginated) {
                return paginated.content;
            }
        }
        
        delete sessions[session.sessionId];
        return `END ${diagnosis}`;
        
    } catch (error) {
        console.error('Diagnosis error:', error);
        delete sessions[session.sessionId];
        return 'END Sorry, diagnosis service\nis currently unavailable.\nPlease try again later\nor contact your local\nagriculture office.';
    }
}

async handleSymptomsAICrop(session, input) {
    session.lastActivity = new Date();
    session.lastInput = input;

    if (input === '0') {
        session.currentMenu = 'symptoms_menu';
        return this.handleSymptomsMenu(session, '');
    }

    const crops = {
        '1': 'Maize', '2': 'Cassava', '3': 'Groundnuts', '4': 'Beans',
        '5': 'Rice', '6': 'Sweet Potatoes'
    };

    const crop = crops[input];
    if (crop) {
        session.userData.aiCrop = crop;
        
        // If we already have symptoms, proceed to diagnosis
        if (session.userData.symptomsText) {
            return await this.handleSymptomsAIQuick(session, '');
        }
        
        // Otherwise ask for symptoms
        session.currentMenu = 'symptoms_ai_quick';
        return `CON Describe symptoms for ${crop}:\n(e.g., "yellow leaves")\n`;
    } else {
        return 'CON Invalid crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back';
    }
}

async handleSymptomsInteractiveCrop(session, input) {
    session.lastActivity = new Date();
    session.lastInput = input;

    if (input === '0') {
        session.currentMenu = 'symptoms_menu';
        return this.handleSymptomsMenu(session, '');
    }

    const crops = {
        '1': 'Maize', '2': 'Cassava', '3': 'Groundnuts', '4': 'Beans'
    };

    const crop = crops[input];
    if (crop) {
        // Start interactive diagnosis
        const diagnosisSession = await symptomsWizardService.startInteractiveDiagnosis(
            crop,
            session.phoneNumber,
            session.sessionId
        );
        
        session.interactiveDiagnosis = diagnosisSession;
        session.currentMenu = 'symptoms_interactive_q1';
        
        return `CON ${diagnosisSession.question}\n\n${diagnosisSession.options.join('\n')}`;
    } else {
        return 'CON Invalid crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n0. Back';
    }
}

async handleSymptomsInteractiveQ1(session, input) {
    session.lastActivity = new Date();
    session.lastInput = input;

    if (input === '0') {
        // Cancel interactive diagnosis
        delete session.interactiveDiagnosis;
        session.currentMenu = 'symptoms_menu';
        return this.handleSymptomsMenu(session, '');
    }

    if (!session.interactiveDiagnosis) {
        return 'CON Session expired.\n0. Back';
    }

    const result = await symptomsWizardService.processInteractiveStep(
        session.sessionId,
        parseInt(input)
    );
    
    if (result.expired) {
        delete session.interactiveDiagnosis;
        return `CON ${result.error}\n0. Back`;
    }
    
    if (result.canceled) {
        delete session.interactiveDiagnosis;
        delete sessions[session.sessionId];
        return `END ${result.message}`;
    }
    
    if (result.complete) {
        delete session.interactiveDiagnosis;
        
        // Check if we need pagination
        if (result.diagnosis.length > 400) {
            session.diagnosisData = result.diagnosis;
            
            const paginated = paginationService.paginateForUSSD(
                result.diagnosis,
                session,
                'interactive_diagnosis'
            );
            
            if (paginated && paginated.isPaginated) {
                return paginated.content;
            }
        }
        
        delete sessions[session.sessionId];
        return `END ${result.diagnosis}`;
    }
    
    if (result.continue) {
        session.interactiveDiagnosis = result;
        session.currentMenu = 'symptoms_interactive_q1'; // Same handler for next question
        
        return `CON ${result.question}\n\n${result.options.join('\n')}`;
    }
    
    return 'CON Error processing answer.\n0. Back';
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