// services/plantingCalendarService.js - Malawi Planting Calendar
class PlantingCalendarService {
    constructor() {
        this.crops = {
            'Maize': {
                local_name: 'Chimanga',
                seasons: [
                    { 
                        name: 'Early Planting', 
                        months: ['Nov', 'Dec'],
                        regions: ['All'],
                        description: 'Plant with first effective rains. Use early maturing varieties.',
                        spacing: '75cm between rows, 25cm within rows',
                        seed_rate: '20-25kg/ha'
                    },
                    { 
                        name: 'Late Planting', 
                        months: ['Jan', 'Feb'],
                        regions: ['Southern', 'Central'],
                        description: 'Plant before mid-February. Use medium duration varieties.',
                        spacing: '75cm between rows, 30cm within rows',
                        seed_rate: '25-30kg/ha'
                    }
                ],
                duration: '90-120 days',
                altitude: '0-1800m',
                rainfall: '500-800mm'
            },
            'Cassava': {
                local_name: 'Chinangwa',
                seasons: [
                    { 
                        name: 'Main Season', 
                        months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                        regions: ['All'],
                        description: 'Plant stem cuttings 20-25cm long at 45° angle.',
                        spacing: '1m x 1m',
                        seed_rate: '10,000-12,000 cuttings/ha'
                    }
                ],
                duration: '9-18 months',
                altitude: '0-1500m',
                rainfall: '1000-1500mm'
            },
            'Groundnuts': {
                local_name: 'Mtedza',
                seasons: [
                    { 
                        name: 'Rainy Season', 
                        months: ['Nov', 'Dec', 'Jan'],
                        regions: ['All'],
                        description: 'Plant in well-drained soils. Inoculate seeds with rhizobium.',
                        spacing: '60cm between rows, 10cm within rows',
                        seed_rate: '80-100kg/ha shelled'
                    }
                ],
                duration: '90-120 days',
                altitude: '0-1400m',
                rainfall: '500-700mm'
            },
            'Beans': {
                local_name: 'Nyemba',
                seasons: [
                    { 
                        name: 'Main Season', 
                        months: ['Nov', 'Dec', 'Jan'],
                        regions: ['All'],
                        description: 'Plant 2-5cm deep. Use inoculants for better nitrogen fixation.',
                        spacing: '50cm between rows, 10cm within rows',
                        seed_rate: '50-60kg/ha'
                    },
                    { 
                        name: 'Second Season', 
                        months: ['Apr', 'May'],
                        regions: ['Southern Highlands'],
                        description: 'Plant with residual moisture or under irrigation.',
                        spacing: '50cm between rows, 10cm within rows',
                        seed_rate: '60-70kg/ha'
                    }
                ],
                duration: '70-90 days',
                altitude: '0-2200m',
                rainfall: '600-900mm'
            },
            'Rice': {
                local_name: 'Mpunga',
                seasons: [
                    { 
                        name: 'Rainfed', 
                        months: ['Dec', 'Jan'],
                        regions: ['Karonga', 'Salima', 'Nkhotakota'],
                        description: 'Transplant 21-30 day old seedlings. Keep field flooded.',
                        spacing: '20cm x 20cm',
                        seed_rate: '40-50kg/ha for nursery'
                    }
                ],
                duration: '120-150 days',
                altitude: '0-1000m',
                rainfall: '1000-1500mm'
            },
            'Sweet Potatoes': {
                local_name: 'Mbatata',
                seasons: [
                    { 
                        name: 'Main Season', 
                        months: ['Nov', 'Dec', 'Jan', 'Feb'],
                        regions: ['All'],
                        description: 'Plant vine cuttings 30-40cm long. Bury 2-3 nodes.',
                        spacing: '1m between rows, 30cm within rows',
                        seed_rate: '20,000-25,000 cuttings/ha'
                    }
                ],
                duration: '120-150 days',
                altitude: '0-2000m',
                rainfall: '750-1000mm'
            },
            'Soybeans': {
                local_name: 'Soya',
                seasons: [
                    { 
                        name: 'Main Season', 
                        months: ['Dec', 'Jan'],
                        regions: ['Central', 'Southern'],
                        description: 'Inoculate seeds. Plant in well-drained fertile soils.',
                        spacing: '60cm between rows, 5cm within rows',
                        seed_rate: '60-80kg/ha'
                    }
                ],
                duration: '90-110 days',
                altitude: '0-1500m',
                rainfall: '500-700mm'
            },
            'Cotton': {
                local_name: 'Thonje',
                seasons: [
                    { 
                        name: 'Planting Season', 
                        months: ['Dec', 'Jan'],
                        regions: ['Balaka', 'Machinga', 'Chikwawa'],
                        description: 'Plant when soil is warm. Requires careful pest management.',
                        spacing: '90cm between rows, 30cm within rows',
                        seed_rate: '15-20kg/ha'
                    }
                ],
                duration: '150-180 days',
                altitude: '0-800m',
                rainfall: '500-700mm'
            }
        };
        
        console.log('✅ Planting Calendar Service initialized');
    }

    getPlantingCalendar(cropName, region = null) {
        console.log(`🌱 Getting planting calendar for: ${cropName}`);
        
        const crop = this.crops[cropName];
        if (!crop) {
            return `No planting information available for ${cropName}.`;
        }

        let response = `📅 ${cropName} (${crop.local_name})\n\n`;
        
        // Basic information
        response += `Duration: ${crop.duration}\n`;
        response += `Altitude: ${crop.altitude}\n`;
        response += `Rainfall: ${crop.rainfall}\n\n`;
        
        // Planting seasons
        response += `Planting Seasons:\n`;
        
        crop.seasons.forEach((season, index) => {
            response += `\n${index + 1}. ${season.name}\n`;
            response += `   Months: ${season.months.join(', ')}\n`;
            response += `   Regions: ${season.regions.join(', ')}\n`;
            
            if (region && !season.regions.includes('All') && !season.regions.includes(region)) {
                response += `   ⚠️ Not ideal for your region\n`;
            }
            
            // Short description for USSD
            const shortDesc = season.description.length > 80 
                ? season.description.substring(0, 80) + '...' 
                : season.description;
            response += `   ${shortDesc}\n`;
        });
        
        // Current month advice
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        const currentSeason = this.getCurrentSeasonAdvice(cropName, currentMonth, region);
        
        if (currentSeason) {
            response += `\n🌤️ Current Advice (${currentMonth}):\n`;
            response += `${currentSeason}\n`;
        }
        
        return response;
    }

    getCurrentSeasonAdvice(cropName, month, region = null) {
        const crop = this.crops[cropName];
        if (!crop) return null;
        
        // Find seasons for current month
        const currentSeasons = crop.seasons.filter(season => 
            season.months.includes(month)
        );
        
        if (currentSeasons.length === 0) {
            return `Not planting season for ${cropName} in ${month}.`;
        }
        
        const season = currentSeasons[0];
        let advice = `${season.name} for ${cropName}\n`;
        
        if (region && !season.regions.includes('All') && !season.regions.includes(region)) {
            advice += `⚠️ Not ideal for ${region} region\n`;
        } else {
            advice += `✓ Good time to plant\n`;
        }
        
        advice += `Spacing: ${season.spacing}\n`;
        advice += `Seed rate: ${season.seed_rate}`;
        
        return advice;
    }

    getCropsForMonth(month, region = null) {
        console.log(`📅 Getting crops to plant in: ${month}`);
        
        let response = `🌱 Crops to plant in ${month}:\n\n`;
        let cropCount = 0;
        
        Object.entries(this.crops).forEach(([cropName, crop]) => {
            const suitableSeasons = crop.seasons.filter(season => 
                season.months.includes(month)
            );
            
            if (suitableSeasons.length > 0) {
                cropCount++;
                const season = suitableSeasons[0];
                
                response += `${cropCount}. ${cropName}\n`;
                response += `   Local: ${crop.local_name}\n`;
                response += `   Duration: ${crop.duration}\n`;
                
                if (region && !season.regions.includes('All') && !season.regions.includes(region)) {
                    response += `   ⚠️ Not ideal for ${region}\n`;
                } else {
                    response += `   ✓ Suitable for planting\n`;
                }
                
                response += '\n';
            }
        });
        
        if (cropCount === 0) {
            return `No major crops to plant in ${month}. Prepare land for next season.`;
        }
        
        return response;
    }

    getRegionFromDistrict(districtName) {
        // Map districts to regions
        const districtRegionMap = {
            // Northern Region
            'Chitipa': 'Northern', 'Karonga': 'Northern', 'Likoma': 'Northern',
            'Mzimba': 'Northern', 'Nkhata Bay': 'Northern', 'Rumphi': 'Northern',
            
            // Central Region
            'Dedza': 'Central', 'Dowa': 'Central', 'Kasungu': 'Central',
            'Lilongwe': 'Central', 'Mchinji': 'Central', 'Nkhotakota': 'Central',
            'Ntcheu': 'Central', 'Ntchisi': 'Central', 'Salima': 'Central',
            
            // Southern Region
            'Balaka': 'Southern', 'Blantyre': 'Southern', 'Chikwawa': 'Southern',
            'Chiradzulu': 'Southern', 'Machinga': 'Southern', 'Mangochi': 'Southern',
            'Mulanje': 'Southern', 'Mwanza': 'Southern', 'Nsanje': 'Southern',
            'Thyolo': 'Southern', 'Phalombe': 'Southern', 'Zomba': 'Southern',
            'Neno': 'Southern'
        };
        
        return districtRegionMap[districtName] || 'Central'; // Default to Central
    }
}

module.exports = new PlantingCalendarService();