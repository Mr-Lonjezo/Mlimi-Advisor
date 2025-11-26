// services/weatherService.js - WITH ALL 28 MALAWI DISTRICTS
const axios = require('axios');

class WeatherService {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        console.log('✅ Weather Service initialized');
    }

    async getForecastByDistrict(districtName) {
        console.log(`🌤️ Fetching weather for: ${districtName}`);
        
        try {
            // Complete list of all 28 Malawi districts with coordinates
            const districtCoords = {
                // Northern Region
                'Chitipa': { lat: -9.7167, lon: 33.2667 },
                'Karonga': { lat: -9.9333, lon: 33.9333 },
                'Likoma': { lat: -12.0667, lon: 34.7333 },
                'Mzimba': { lat: -11.9000, lon: 33.6000 },
                'Nkhata Bay': { lat: -11.6000, lon: 34.3000 },
                'Rumphi': { lat: -11.0167, lon: 33.8667 },
                
                // Central Region
                'Dedza': { lat: -14.3667, lon: 34.3333 },
                'Dowa': { lat: -13.6500, lon: 33.9333 },
                'Kasungu': { lat: -13.0333, lon: 33.4833 },
                'Lilongwe': { lat: -13.9626, lon: 33.7741 },
                'Mchinji': { lat: -13.8000, lon: 32.9000 },
                'Nkhotakota': { lat: -12.9167, lon: 34.3000 },
                'Ntcheu': { lat: -14.8167, lon: 34.6333 },
                'Ntchisi': { lat: -13.3667, lon: 33.9167 },
                'Salima': { lat: -13.7833, lon: 34.4500 },
                
                // Southern Region
                'Balaka': { lat: -14.9833, lon: 34.9500 },
                'Blantyre': { lat: -15.7861, lon: 35.0059 },
                'Chikwawa': { lat: -16.0333, lon: 34.8000 },
                'Chiradzulu': { lat: -15.7000, lon: 35.1833 },
                'Machinga': { lat: -15.1667, lon: 35.3000 },
                'Mangochi': { lat: -14.4667, lon: 35.2667 },
                'Mulanje': { lat: -16.0333, lon: 35.5000 },
                'Mwanza': { lat: -15.6167, lon: 34.5167 },
                'Nsanje': { lat: -16.9167, lon: 35.2667 },
                'Thyolo': { lat: -16.0667, lon: 35.1333 },
                'Phalombe': { lat: -15.8000, lon: 35.6500 },
                'Zomba': { lat: -15.3767, lon: 35.3357 },
                'Neno': { lat: -15.4000, lon: 34.6500 }
            };

            const coords = districtCoords[districtName];
            if (!coords) {
                console.log(`❌ Coordinates not found for: ${districtName}`);
                return this.getMockForecast(districtName);
            }

            console.log(`📍 Using coordinates: ${coords.lat}, ${coords.lon}`);

            // Get 5-day forecast (we'll use first 3 days)
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    lat: coords.lat,
                    lon: coords.lon,
                    appid: this.apiKey,
                    units: 'metric', // Celsius
                    cnt: 24 // 24 intervals ≈ 3 days
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('✅ Weather API response received');
            return this.formatForecastForUSSD(response.data, districtName);
            
        } catch (error) {
            console.error('❌ Weather API Error:', error.message);
            if (error.response) {
                console.error('API Response:', error.response.data);
            }
            // Fallback to mock data if API fails
            return this.getMockForecast(districtName);
        }
    }

    formatForecastForUSSD(weatherData, districtName) {
        console.log('📊 Formatting weather data for USSD...');
        
        const dailyForecasts = {};
        
        // Group forecasts by date
        weatherData.list.forEach((item, index) => {
            const date = new Date(item.dt * 1000).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    temps: [],
                    conditions: [],
                    humidity: [],
                    rains: []
                };
            }
            
            dailyForecasts[date].temps.push(item.main.temp);
            dailyForecasts[date].conditions.push(item.weather[0].main);
            dailyForecasts[date].humidity.push(item.main.humidity);
            
            // Check for rain
            if (item.rain && item.rain['3h']) {
                dailyForecasts[date].rains.push(item.rain['3h']);
            }
        });

        // Get next 3 days
        const dates = Object.keys(dailyForecasts);
        const nextThreeDays = dates.slice(0, 3);
        
        let ussdResponse = `🌤️ ${districtName} Weather:\n\n`;

        nextThreeDays.forEach((date, index) => {
            const dayData = dailyForecasts[date];
            const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b) / dayData.temps.length);
            const mainCondition = this.getMostFrequent(dayData.conditions);
            const avgHumidity = Math.round(dayData.humidity.reduce((a, b) => a + b) / dayData.humidity.length);
            
            const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date;

            ussdResponse += `${dayLabel}: ${mainCondition}\n`;
            ussdResponse += `Temp: ${avgTemp}°C\n`;
            ussdResponse += `Humidity: ${avgHumidity}%\n`;
            
            // Rain information
            if (dayData.rains.length > 0) {
                const totalRain = dayData.rains.reduce((a, b) => a + b, 0);
                ussdResponse += `Rain: ${totalRain.toFixed(1)}mm\n`;
            }
            
            // Farming advice based on weather
            const advice = this.getFarmingAdvice(mainCondition, avgTemp, avgHumidity);
            if (advice) {
                ussdResponse += `💡 ${advice}\n`;
            }
            
            ussdResponse += '\n';
        });

        // Add general farming tips
        ussdResponse += this.getGeneralFarmingTips(nextThreeDays, dailyForecasts);

        console.log('✅ Weather formatted for USSD');
        return ussdResponse.trim();
    }

    getMostFrequent(arr) {
        const frequency = {};
        let maxCount = 0;
        let mostFrequent = arr[0];
        
        arr.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
            if (frequency[item] > maxCount) {
                maxCount = frequency[item];
                mostFrequent = item;
            }
        });
        
        return mostFrequent;
    }

    getFarmingAdvice(condition, temperature, humidity) {
        const adviceMap = {
            'Rain': 'Good for planting. Avoid fertilizer application.',
            'Clear': 'Ideal for harvesting. Water crops if dry.',
            'Clouds': 'Good for transplanting. Monitor for pests.',
            'Drizzle': 'Suitable for light field work.',
            'Thunderstorm': 'Stay indoors. Secure farm structures.',
            'Mist': 'Good for planting seedlings.',
            'Fog': 'Delay spraying until clear.',
            'Snow': 'Not applicable in Malawi',
            'Smoke': 'Avoid field work if air quality poor'
        };
        
        let advice = adviceMap[condition] || 'Normal farming activities.';
        
        // Temperature-based advice
        if (temperature > 32) {
            advice += ' High temp: Water early morning.';
        } else if (temperature > 28) {
            advice += ' Warm: Good for most crops.';
        } else if (temperature < 18) {
            advice += ' Cool: Protect sensitive crops.';
        }
        
        // Humidity-based advice
        if (humidity > 80) {
            advice += ' Humid: Watch for fungal diseases.';
        } else if (humidity < 40) {
            advice += ' Dry: Increase irrigation.';
        }
        
        return advice;
    }

    getGeneralFarmingTips(dates, forecasts) {
        let tips = '';
        const todayData = forecasts[dates[0]];
        
        if (todayData) {
            const avgTemp = Math.round(todayData.temps.reduce((a, b) => a + b) / todayData.temps.length);
            const mainCondition = this.getMostFrequent(todayData.conditions);
            
            // Planting advice
            if (mainCondition === 'Rain' || mainCondition === 'Drizzle') {
                tips += '🌱 Good day for planting maize and beans.\n';
            }
            
            // Harvesting advice
            if (mainCondition === 'Clear' && avgTemp < 30) {
                tips += '📦 Ideal for harvesting and drying crops.\n';
            }
            
            // Pest management
            if (todayData.humidity && todayData.humidity.length > 0) {
                const avgHumidity = todayData.humidity.reduce((a, b) => a + b) / todayData.humidity.length;
                if (avgHumidity > 75) {
                    tips += '🐛 High humidity: Monitor for pests and diseases.\n';
                }
            }
        }
        
        return tips ? `Farming Tips:\n${tips}` : '';
    }

    getMockForecast(districtName) {
        console.log('🔄 Using mock weather data as fallback');
        
        // Simple fallback for any district
        return `🌤️ ${districtName} Weather:\n\nToday: Gathering data...\nTemp: Checking...\nHumidity: Updating...\n\n💡 Weather service updating. Check back soon.\n\nFarming Tips:\n🌱 Always check local conditions before farming activities.`;
    }
}

module.exports = new WeatherService();