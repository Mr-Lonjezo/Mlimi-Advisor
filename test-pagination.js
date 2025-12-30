// test-pagination.js - Test USSD Pagination
const paginationService = require('./services/paginationService');

// Mock session object
const mockSession = {
    pagination: {},
    lastInput: ''
};

// Test content (simulates long weather forecast)
const longWeatherContent = `🌤️ Lilongwe Weather

Now: Partly cloudy
Temp: 26°C
Humidity: 68%

Today:
Partly cloudy with a chance of light rain in the afternoon. Winds will be light and variable.
High: 28°C, Low: 22°C
Rain: 2.5mm
💡 Good day for transplanting seedlings. The light rain will help with establishment.

Tomorrow:
Mostly cloudy with scattered showers throughout the day. Higher chance of rain in the evening.
High: 25°C, Low: 20°C
Rain: 8.5mm
💡 Excellent planting conditions. Avoid fertilizer application as rain may wash it away.

Day After:
Sunny intervals with isolated showers. Generally good weather for outdoor activities.
High: 27°C, Low: 21°C
Rain: 1.2mm
💡 Good for field preparation and weeding. Watch for pests in humid conditions.

🌱 Farming Tips for Central Region:
• Rainy season (Nov-Apr): Ideal for planting maize, beans, and groundnuts
• Apply basal fertilizer (23:21:0+4S) at planting time
• Control weeds early to reduce competition
• Monitor for armyworm in maize fields
• Practice crop rotation to maintain soil health
• Consider planting drought-resistant varieties
• Harvest maize when husks are dry and yellow
• Store grains properly to prevent aflatoxin contamination`;

async function testPagination() {
    console.log('📱 Testing USSD Pagination\n');
    
    console.log('📊 Content Statistics:');
    console.log(`   • Total characters: ${longWeatherContent.length}`);
    console.log(`   • Total lines: ${longWeatherContent.split('\n').length}`);
    console.log(`   • Estimated pages: ${Math.ceil(longWeatherContent.length / 160)}\n`);
    
    // Test 1: Paginate weather data
    console.log('1. Testing weather data pagination:');
    const paginated = paginationService.paginateWeatherData(
        longWeatherContent,
        'Lilongwe',
        mockSession
    );
    
    console.log(`   • Total pages: ${paginated.totalPages}`);
    console.log(`   • Current page: ${paginated.currentPage}`);
    console.log(`   • Is paginated: ${paginated.isPaginated}`);
    console.log(`   • Content length: ${paginated.content.length} chars\n`);
    
    // Show first page preview
    const firstPageLines = paginated.content.split('\n').slice(0, 10);
    console.log('📋 First page preview:');
    console.log(firstPageLines.join('\n'));
    console.log('...\n');
    
    // Test 2: Test pagination controls
    console.log('2. Testing pagination navigation:');
    
    // Simulate "Next Page"
    mockSession.lastInput = '99';
    const page2 = paginationService.paginateWeatherData(
        longWeatherContent,
        'Lilongwe',
        mockSession
    );
    
    console.log(`   • After "99" (Next): Page ${page2.currentPage}/${page2.totalPages}`);
    
    // Simulate "Previous Page"
    mockSession.lastInput = '98';
    const page1again = paginationService.paginateWeatherData(
        longWeatherContent,
        'Lilongwe',
        mockSession
    );
    
    console.log(`   • After "98" (Prev): Page ${page1again.currentPage}/${page1again.totalPages}`);
    
    // Test 3: Test pest advice pagination
    console.log('\n3. Testing pest advice pagination:');
    
    const pestAdvice = `Common Maize Pests:

1. Fall Armyworm (Spodoptera frugiperda)
Symptoms: Ragged holes in leaves, sawdust-like frass near whorl, window-pane feeding on leaves.
Organic Treatment: Apply neem extract solution (50g neem seeds in 1L water). Hand-pick larvae early morning.
Chemical Treatment: Use recommended pesticides like Emamectin benzoate. Follow label instructions.
Prevention: Early planting, crop rotation with legumes, use pheromone traps.

2. Maize Streak Virus
Symptoms: Yellow streaks parallel to veins, stunted growth, poor cob formation.
Treatment: No cure for infected plants. Remove and destroy affected plants immediately.
Prevention: Plant resistant varieties (DK 777, SC 513), control leafhopper vectors with insecticides.
Source: Ministry of Agriculture`;

    const paginatedPests = paginationService.paginatePestAdvice(
        pestAdvice,
        'Maize',
        { pagination: {}, lastInput: '' }
    );
    
    console.log(`   • Total pages: ${paginatedPests.totalPages}`);
    console.log(`   • Content optimized for USSD display\n`);
    
    console.log('✅ Pagination tests completed!');
}

testPagination().catch(console.error);