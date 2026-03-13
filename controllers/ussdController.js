const plantingCalendarService = require('../services/plantingCalendarService');
const paginationService = require('../services/paginationService');
const databaseService = require('../services/databaseService');
const MarketEnhancedService = require('../services/marketEnhancedService');
const SubscriptionService = require('../services/subscriptionService');
const SMS = require('../services/smsService');
const weatherService = require('../services/weatherService');
const symptomsWizardService = require('../services/symptomsWizardService');

console.log('✅ USSD Controller loaded successfully!');

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
                    sessionId: sessionId,
                    createdAt: new Date(),
                    lastActivity: new Date()
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
            case 'subscription':
                return await this.handleSubscriptionMenu(session, currentInput);
            default:
                return this.handleMainMenu(session, currentInput);
        }
    }

    handleMainMenu(session, input) {
        session.lastActivity = new Date();

        if (input === '') {
            return `CON Welcome to Mlimi Advisor\nGet farming information:\n1. Weather Forecast\n2. Pest & Disease Help\n3. Market Prices\n4. Planting Calendar\n5. Get Alerts/Subscribe\n0. Exit`;
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
            case '6':
                session.currentMenu = 'subscription';
                return this.handleSubscriptionMenu(session, '');
            case '0':
                delete sessions[session.sessionId];
                return 'END Thank you for using Mlimi Advisor!';
            default:
                return 'CON Invalid choice. Please select:\n1. Weather\n2. Pest Help\n3. Market Prices\n0. Exit';
        }
    }

    // ==================== SUBSCRIPTION HANDLERS ====================

    async handleSubscriptionMenu(session, input) {
        session.lastActivity = new Date();
        
        if (!session.subscriptionState) {
            session.subscriptionState = 'main';
            
            // Check subscription status
            const status = await SubscriptionService.getSubscriptionStatus(session.phoneNumber);
            const isSubscribed = status.success && status.isSubscribed;
            
            if (isSubscribed) {
                return `CON Mlimi Advisor Alerts\n\nYou are subscribed! You receive:\n- Weather warnings\n- Price updates\n- Disease alerts\n- Planting reminders\n\n1. Change preferences\n2. Unsubscribe\n3. Send test alert\n4. My alerts history\n0. Back to main menu`;
            } else {
                return `CON Get FREE Farming Alerts!\n\nSubscribe once, get ALL:\n- Weather warnings\n- Price updates\n- Disease alerts\n- Planting reminders\n\n1. Subscribe now\n2. Learn more\n3. See example alerts\n0. Back`;
            }
        }

        switch (session.subscriptionState) {
            case 'main':
                return await this.handleSubscriptionMain(session, input);
            case 'choose_language':
                return await this.handleChooseLanguage(session, input);
            case 'subscribe_confirm':
                return await this.handleSubscribeConfirm(session, input);
            case 'preferences':
                return await this.handlePreferences(session, input);
            case 'custom_preferences':
                return await this.handleCustomPreferences(session, input);
            case 'unsubscribe_confirm':
                return await this.handleUnsubscribeConfirm(session, input);
            case 'history':
                return await this.handleHistory(session, input);
            default:
                session.currentMenu = 'main';
                delete session.subscriptionState;
                return this.handleMainMenu(session, '');
        }
    }

    async handleSubscriptionMain(session, input) {
        if (input === '0') {
            session.currentMenu = 'main';
            delete session.subscriptionState;
            return this.handleMainMenu(session, '');
        }
        
        const status = await SubscriptionService.getSubscriptionStatus(session.phoneNumber);
        const isSubscribed = status.success && status.isSubscribed;
        
        if (!isSubscribed) {
            switch (input) {
                case '1':
                    session.subscriptionState = 'choose_language';
                    return `CON Choose language for alerts:\n\n1. English\n2. Chichewa (Chinyanja)\n\n0. Back`;
                case '2':
                    return `CON Why Subscribe?\n\n- Get SMS alerts directly\n- Never miss price changes\n- Weather warnings early\n- Disease alerts in time\n- FREE service\n\n1. Subscribe now\n0. Back`;
                case '3':
                    return `CON Example Alerts:\n\n"Weavy rain in Lilongwe tomorrow"\n"Maize price up 15% at market"\n"Cassava mosaic in your area"\n"Time to plant groundnuts!"\n\n1. Subscribe now\n0. Back`;
                default:
                    return `CON Invalid choice.\n\n1. Subscribe now\n2. Learn more\n3. See examples\n0. Back`;
            }
        } else {
            // Already subscribed
            switch (input) {
                case '1':
                    session.subscriptionState = 'preferences';
                    return `CON Alert Preferences:\n\nWhich alerts to receive?\n1. All alerts (recommended)\n2. Weather only\n3. Prices only\n4. Diseases only\n5. Custom selection\n\n0. Back`;
                case '2':
                    session.subscriptionState = 'unsubscribe_confirm';
                    return `CON Unsubscribe?\n\nYou will stop receiving:\n- Weather warnings\n- Price updates\n- Disease alerts\n- Planting reminders\n\n1. Yes, unsubscribe\n2. No, keep alerts\n0. Back`;
                case '3':
                    // Send test alert
                    await SubscriptionService.sendTestAlert(session.phoneNumber);
                    return `CON Test alert sent!\n\nCheck your SMS now.\n\nYou'll receive alerts for:\n- Weather warnings\n- Price changes\n- Disease outbreaks\n- Planting seasons\n\n0. Back to main menu`;
                case '4':
                    session.subscriptionState = 'history';
                    const history = await SubscriptionService.getNotificationHistory(session.phoneNumber, 5);
                    if (history.success && history.notifications.length > 0) {
                        let response = `CON Recent Alerts:\n\n`;
                        history.notifications.slice(0, 3).forEach((notif, index) => {
                            const date = new Date(notif.sent_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                            });
                            response += `${index + 1}. ${notif.title} - ${date}\n`;
                        });
                        response += `\n1. View more\n0. Back`;
                        return response;
                    } else {
                        return `CON No recent alerts.\n\nYou'll receive alerts soon!\n\n0. Back`;
                    }
                default:
                    return `CON Invalid choice.\n\n1. Change preferences\n2. Unsubscribe\n3. Send test\n4. History\n0. Back`;
            }
        }
    }

    async handleChooseLanguage(session, input) {
        if (input === '0') {
            session.subscriptionState = 'main';
            return this.handleSubscriptionMenu(session, '');
        }
        
        const language = input === '2' ? 'ny' : 'en';
        session.subscriptionLanguage = language;
        session.subscriptionState = 'subscribe_confirm';
        
        const confirmMessage = language === 'ny' 
            ? `Kukanika ku Mlimi Advisor:\n\nMuzalandira mauthenga:\n- Mphepo yowopsa\n- Mitengo yatsopano\n- Chenjezo la matenda\n- Nthawi yakuti\n\nZonse ZAULERE!\n\n1. Inde, ndikukana\n2. Ayi, sindikufuna\n0. Bwereza`
            : `Subscribe to Mlimi Advisor:\n\nYou'll receive alerts for:\n- Dangerous weather\n- New market prices\n- Disease warnings\n- Planting times\n\nALL FOR FREE!\n\n1. Yes, subscribe me\n2. No, cancel\n0. Back`;
        
        return `CON ${confirmMessage}`;
    }

    async handleSubscribeConfirm(session, input) {
        if (input === '0') {
            session.subscriptionState = 'choose_language';
            return this.handleSubscriptionMenu(session, '');
        }
        
        if (input === '1') {
            const result = await SubscriptionService.subscribeFarmer(
                session.phoneNumber, 
                session.subscriptionLanguage || 'en'
            );
            
            if (result.success) {
                const successMessage = session.subscriptionLanguage === 'ny'
                    ? `END Mwayesedwa bwino!\n\nMuzalandira mauthenga pa SMS.\n\nKuti mupange zosintha, bwerani ku: *384*456#\n\nZikomo!`
                    : `END Subscribed successfully!\n\nYou'll receive alerts via SMS.\n\nTo manage preferences, return to: *384*456#\n\nThank you!`;
                return successMessage;
            } else {
                return `END Sorry, subscription failed.\n\nPlease try again later.\n\nDial *384*456# to try again.`;
            }
        }
        
        session.subscriptionState = 'main';
        return this.handleSubscriptionMenu(session, '');
    }

    async handlePreferences(session, input) {
        if (input === '0') {
            session.subscriptionState = 'main';
            return this.handleSubscriptionMenu(session, '');
        }
        
        let preferences = {};
        let message = '';
        
        switch (input) {
            case '1':
                preferences = {
                    notify_on_weather_alerts: true,
                    notify_on_price_alerts: true,
                    notify_on_disease_alerts: true,
                    notify_on_planting_seasons: true
                };
                message = `Set to receive ALL alerts!\n\nYou'll get weather, prices, diseases, and planting alerts.\n\nThank you!`;
                break;
            case '2':
                preferences = {
                    notify_on_weather_alerts: true,
                    notify_on_price_alerts: false,
                    notify_on_disease_alerts: false,
                    notify_on_planting_seasons: false
                };
                message = `Set for WEATHER alerts only.\n\nYou'll get weather warnings only.\n\nThank you!`;
                break;
            case '3':
                preferences = {
                    notify_on_weather_alerts: false,
                    notify_on_price_alerts: true,
                    notify_on_disease_alerts: false,
                    notify_on_planting_seasons: false
                };
                message = `Set for PRICE alerts only.\n\nYou'll get market price updates only.\n\nThank you!`;
                break;
            case '4':
                preferences = {
                    notify_on_weather_alerts: false,
                    notify_on_price_alerts: false,
                    notify_on_disease_alerts: true,
                    notify_on_planting_seasons: false
                };
                message = `Set for DISEASE alerts only.\n\nYou'll get disease warnings only.\n\nThank you!`;
                break;
            case '5':
                session.subscriptionState = 'custom_preferences';
                return `CON Custom Alert Settings:\n\nToggle each (1=ON, 2=OFF):\n\n1. Weather alerts\n2. Price alerts\n3. Disease alerts\n4. Planting alerts\n\nEnter numbers (e.g., "13" for weather=ON, price=OFF)\n0. Back`;
            default:
                return `CON Invalid choice.\n\n1. All alerts\n2. Weather only\n3. Prices only\n4. Diseases only\n5. Custom\n0. Back`;
        }
        
        const result = await SubscriptionService.updatePreferences(session.phoneNumber, preferences);
        if (result.success) {
            return `END ${message}`;
        } else {
            return `END Failed to update preferences.\n\nPlease try again later.`;
        }
    }

    async handleCustomPreferences(session, input) {
        if (input === '0') {
            session.subscriptionState = 'preferences';
            return this.handleSubscriptionMenu(session, '');
        }
        
        // Parse custom preferences (input like "13" means weather=ON, price=OFF)
        const prefs = {
            notify_on_weather_alerts: input.includes('1'),
            notify_on_price_alerts: input.includes('2'),
            notify_on_disease_alerts: input.includes('3'),
            notify_on_planting_seasons: input.includes('4')
        };
        
        const result = await SubscriptionService.updatePreferences(session.phoneNumber, prefs);
        
        if (result.success) {
            const enabled = [];
            if (prefs.notify_on_weather_alerts) enabled.push('Weather');
            if (prefs.notify_on_price_alerts) enabled.push('Prices');
            if (prefs.notify_on_disease_alerts) enabled.push('Diseases');
            if (prefs.notify_on_planting_seasons) enabled.push('Planting');
            
            return `END Preferences updated!\n\nEnabled: ${enabled.join(', ') || 'None'}\n\nYou'll receive selected alerts via SMS.\n\nThank you!`;
        } else {
            return `END Failed to update preferences.\n\nPlease try again later.`;
        }
    }

    async handleUnsubscribeConfirm(session, input) {
        if (input === '0') {
            session.subscriptionState = 'main';
            return this.handleSubscriptionMenu(session, '');
        }
        
        if (input === '1') {
            const result = await SubscriptionService.unsubscribeFarmer(session.phoneNumber);
            
            if (result.success) {
                return `END Unsubscribed successfully.\n\nYou will no longer receive alerts.\n\nYou can resubscribe anytime by dialing *384*456#\n\nThank you for using Mlimi Advisor!`;
            } else {
                return `END Unsubscribe failed.\n\nPlease try again later.\n\nDial *384*456# to try again.`;
            }
        }
        
        session.subscriptionState = 'main';
        return this.handleSubscriptionMenu(session, '');
    }

    async handleHistory(session, input) {
        if (input === '0') {
            session.subscriptionState = 'main';
            return this.handleSubscriptionMenu(session, '');
        }
        
        if (input === '1') {
            const history = await SubscriptionService.getNotificationHistory(session.phoneNumber, 10);
            if (history.success && history.notifications.length > 0) {
                let response = `END Recent Alerts:\n\n`;
                history.notifications.slice(0, 5).forEach((notif, index) => {
                    const date = new Date(notif.sent_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    response += `${index + 1}. ${notif.title} - ${date}\n`;
                });
                response += `\nDial *384*456# for more details.`;
                return response;
            }
        }
        
        return `END No more alerts to show.\n\nDial *384*456# to return to main menu.`;
    }

    // Helper method to format dates
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // ==================== EXISTING WEATHER HANDLERS ====================

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

    // ==================== EXISTING PEST HANDLERS ====================

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

    // ==================== EXISTING PRICES HANDLER ====================

    async handlePricesMenu(session, input) {
        session.lastActivity = new Date();
        
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
            // Simple price display - you can enhance this with MarketEnhancedService
            const prices = this.getMarketPrices(crop);
            return `END ${crop} Prices:\n\n${prices}`;
        } else {
            return 'CON Invalid crop. Select:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back';
        }
    }

    // ==================== EXISTING PLANTING HANDLERS ====================

    async handlePlantingMenu(session, input) {
        session.lastActivity = new Date();
        
        if (input === '0') {
            session.currentMenu = 'main';
            return this.handleMainMenu(session, '');
        }
        
        switch (input) {
            case '1':
                // What to plant now
                const now = new Date();
                const month = now.getMonth() + 1; // 1-12
                const plantingNow = await plantingCalendarService.getPlantingForMonth(month);
                return `END What to plant now (Month ${month}):\n\n${plantingNow}`;
            case '2':
                session.currentMenu = 'planting_crop_select';
                return `CON Select crop for planting guide:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back`;
            case '3':
                session.currentMenu = 'planting_month_select';
                return `CON Select month (1-12):\n1. Jan 2. Feb 3. Mar\n4. Apr 5. May 6. Jun\n7. Jul 8. Aug 9. Sep\n10. Oct 11. Nov 12. Dec\n0. Back`;
            default:
                return 'CON Invalid choice:\n1. What to plant now\n2. Crop planting guide\n3. Monthly planting\n0. Back';
        }
    }

    async handlePlantingCropSelect(session, input) {
        session.lastActivity = new Date();
        
        if (input === '0') {
            session.currentMenu = 'planting_menu';
            return this.handlePlantingMenu(session, '');
        }
        
        const crops = {
            '1': 'Maize', '2': 'Cassava', '3': 'Groundnuts', '4': 'Beans',
            '5': 'Rice', '6': 'Sweet Potatoes'
        };
        
        const crop = crops[input];
        if (crop) {
            const guide = await plantingCalendarService.getPlantingGuide(crop);
            return `END ${crop} Planting Guide:\n\n${guide}`;
        } else {
            return 'CON Invalid crop:\n1. Maize\n2. Cassava\n3. Groundnuts\n4. Beans\n5. Rice\n6. Sweet Potatoes\n0. Back';
        }
    }

    async handlePlantingMonthSelect(session, input) {
        session.lastActivity = new Date();
        
        if (input === '0') {
            session.currentMenu = 'planting_menu';
            return this.handlePlantingMenu(session, '');
        }
        
        const month = parseInt(input);
        if (month >= 1 && month <= 12) {
            const planting = await plantingCalendarService.getPlantingForMonth(month);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `END Planting for ${monthNames[month-1]}:\n\n${planting}`;
        } else {
            return 'CON Invalid month. Enter 1-12:\n1. Jan 2. Feb 3. Mar\n4. Apr 5. May 6. Jun\n7. Jul 8. Aug 9. Sep\n10. Oct 11. Nov 12. Dec\n0. Back';
        }
    }

    // ==================== EXISTING SYMPTOMS HANDLERS ====================

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

    // ==================== HELPER METHODS ====================

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