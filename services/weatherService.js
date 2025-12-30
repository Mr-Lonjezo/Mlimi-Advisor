// services/weatherService.js - USING OPEN-METEO (FREE, NO API KEY)
const axios = require('axios');

class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1';
        console.log('✅ Weather Service initialized with Open-Meteo');
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

            // Get 7-day forecast from Open-Meteo (free, no API key)
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    latitude: coords.lat,
                    longitude: coords.lon,
                    current: 'temperature_2m,relative_humidity_2m,weather_code',
                    hourly: 'temperature_2m,relative_humidity_2m,precipitation,weather_code',
                    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
                    timezone: 'Africa/Blantyre',
                    forecast_days: 3 // Get 3 days forecast
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('✅ Open-Meteo API response received');
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
        console.log('📊 Formatting weather data...');
        
        let forecast = `🌤️ ${districtName} Weather\n\n`;
        
        // Get current weather
        const current = weatherData.current;
        if (current) {
            forecast += `Now: ${this.getWeatherDescription(current.weather_code)}\n`;
            forecast += `Temp: ${Math.round(current.temperature_2m)}°C\n`;
            forecast += `Humidity: ${current.relative_humidity_2m}%\n\n`;
        }
        
        // Get daily forecast for next 3 days
        const daily = weatherData.daily;
        if (daily && daily.time && daily.time.length >= 3) {
            const dayLabels = ['Today', 'Tomorrow', 'Day After'];
            
            for (let i = 0; i < 3; i++) {
                if (i < daily.time.length) {
                    const date = new Date(daily.time[i]);
                    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : this.getDayName(date);
                    
                    forecast += `${dayName}:\n`;
                    
                    if (daily.weather_code && daily.weather_code[i] !== undefined) {
                        forecast += `${this.getWeatherDescription(daily.weather_code[i])}\n`;
                    }
                    
                    if (daily.temperature_2m_max && daily.temperature_2m_min) {
                        const maxTemp = Math.round(daily.temperature_2m_max[i]);
                        const minTemp = Math.round(daily.temperature_2m_min[i]);
                        forecast += `High: ${maxTemp}°C, Low: ${minTemp}°C\n`;
                    }
                    
                    if (daily.precipitation_sum && daily.precipitation_sum[i] > 0) {
                        forecast += `Rain: ${daily.precipitation_sum[i].toFixed(1)}mm\n`;
                    }
                    
                    // Add farming advice based on weather
                    const weatherCode = daily.weather_code ? daily.weather_code[i] : 0;
                    const maxTemp = daily.temperature_2m_max ? daily.temperature_2m_max[i] : 25;
                    const advice = this.getFarmingAdviceFromCode(weatherCode, maxTemp);
                    if (advice) {
                        forecast += `💡 ${advice}\n`;
                    }
                    
                    forecast += '\n';
                }
            }
        }
        
        // Add seasonal farming tips for Malawi
        forecast += this.getSeasonalFarmingTips(districtName);
        
        console.log(`✅ Weather data ready (${forecast.length} chars)`);
        return forecast; // Return raw data, let pagination service handle it
    }
    getWeatherDescription(weatherCode) {
        // WMO Weather interpretation codes
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with hail',
            99: 'Heavy thunderstorm with hail'
        };
        
        return weatherCodes[weatherCode] || 'Fair weather';
    }

    getFarmingAdviceFromCode(weatherCode, temperature) {
        // Group weather codes for advice
        const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
        const clearCodes = [0, 1];
        const cloudyCodes = [2, 3];
        const thunderCodes = [95, 96, 99];
        
        let advice = '';
        
        if (rainCodes.includes(weatherCode)) {
            advice = 'Good for planting. Avoid fertilizer.';
        } else if (clearCodes.includes(weatherCode)) {
            advice = 'Ideal for harvesting. Water if dry.';
        } else if (cloudyCodes.includes(weatherCode)) {
            advice = 'Good for transplanting. Watch for pests.';
        } else if (thunderCodes.includes(weatherCode)) {
            advice = 'Stay indoors. Secure farm structures.';
        } else {
            advice = 'Normal farming activities.';
        }
        
        // Add temperature advice
        if (temperature > 32) {
            advice += ' High temp: Water early morning.';
        } else if (temperature < 18) {
            advice += ' Cool: Protect sensitive crops.';
        }
        
        return advice;
    }

    getSeasonalFarmingTips(districtName) {
        const currentMonth = new Date().getMonth() + 1; // 1-12
        
        let tips = '🌱 Farming Tips:\n';
        
        // Malawi has rainy season (Nov-Apr) and dry season (May-Oct)
        if (currentMonth >= 11 || currentMonth <= 4) {
            // Rainy season (Nov-Apr)
            tips += '• Rainy season: Good for planting\n';
            tips += '• Plant maize, beans, groundnuts\n';
            tips += '• Apply basal fertilizer\n';
        } else {
            // Dry season (May-Oct)
            tips += '• Dry season: Irrigate crops\n';
            tips += '• Good for harvesting\n';
            tips += '• Prepare land for next season\n';
        }
        
        // Regional specific tips
        if (['Chitipa', 'Karonga', 'Mzimba'].includes(districtName)) {
            tips += '• Northern: Plant cassava, rice\n';
        } else if (['Lilongwe', 'Kasungu', 'Dowa'].includes(districtName)) {
            tips += '• Central: Good for maize, tobacco\n';
        } else if (['Blantyre', 'Zomba', 'Mulanje'].includes(districtName)) {
            tips += '• Southern: Plant tea, macadamia\n';
        }
        
        return tips;
    }

    getDayName(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    }

    getMockForecast(districtName) {
        console.log('🔄 Using enhanced mock weather data');
        
        const currentMonth = new Date().getMonth() + 1;
        const isRainySeason = currentMonth >= 11 || currentMonth <= 4;
        
        const forecast = isRainySeason 
            ? `🌤️ ${districtName} Weather:\n\nNow: Partly cloudy\nTemp: 26°C\nHumidity: 68%\n\nToday:\nPartly cloudy\nHigh: 28°C, Low: 22°C\n💡 Good for transplanting\n\nTomorrow:\nLight rain\nHigh: 25°C, Low: 20°C\nRain: 2.5mm\n💡 Good for planting\n\nDay After:\nCloudy\nHigh: 27°C, Low: 21°C\n💡 Watch for pests\n\n🌱 Farming Tips:\n• Rainy season: Plant crops\n• Use basal fertilizer\n• Control weeds early`
            : `🌤️ ${districtName} Weather:\n\nNow: Clear sky\nTemp: 24°C\nHumidity: 55%\n\nToday:\nClear sky\nHigh: 28°C, Low: 18°C\n💡 Ideal for harvesting\n\nTomorrow:\nMainly clear\nHigh: 27°C, Low: 17°C\n💡 Water if dry\n\nDay After:\nPartly cloudy\nHigh: 26°C, Low: 19°C\n💡 Normal activities\n\n🌱 Farming Tips:\n• Dry season: Irrigate\n• Harvest mature crops\n• Prepare for next season`;
        
        return forecast;
    }
}

module.exports = new WeatherService();