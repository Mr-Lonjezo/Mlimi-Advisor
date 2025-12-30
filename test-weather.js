// test-open-meteo.js - Test Open-Meteo API
const weatherService = require('./services/weatherService');

async function testOpenMeteo() {
    console.log('🚀 Testing Open-Meteo Weather Service\n');
    
    const testDistricts = [
        'Lilongwe',
        'Blantyre', 
        'Kasungu',
        'Mzimba',
        'Zomba'
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const district of testDistricts) {
        console.log(`📍 Testing: ${district}`);
        
        try {
            const startTime = Date.now();
            const forecast = await weatherService.getForecastByDistrict(district);
            const responseTime = Date.now() - startTime;
            
            console.log(`   ✅ Success (${responseTime}ms)`);
            console.log(`   📏 Length: ${forecast.length} chars`);
            console.log(`   📋 Preview: ${forecast.substring(0, 100)}...\n`);
            
            successCount++;
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}\n`);
            failCount++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('📊 Test Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📈 Success Rate: ${(successCount/testDistricts.length*100).toFixed(1)}%`);
    
    if (failCount === 0) {
        console.log('\n🎉 All tests passed! Open-Meteo is working perfectly!');
    } else {
        console.log('\n⚠️  Some tests failed. Check your internet connection.');
    }
}

testOpenMeteo().catch(console.error);