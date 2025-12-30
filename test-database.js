// test-database.js
const databaseService = require('./services/databaseService');

async function testDatabase() {
    console.log('🧪 Testing Database Service...\n');
    
    // Test 1: Get pest advice
    console.log('1. Testing pest advice for Maize:');
    const pestAdvice = await databaseService.getPestAdvice('Maize');
    console.log(pestAdvice.substring(0, 200) + '...\n');
    
    // Test 2: Get market prices
    console.log('2. Testing market prices for Maize:');
    const prices = await databaseService.getMarketPrices('Cassava');
    console.log(prices + '\n');
    
    // Test 3: Get farming tips
    console.log('3. Testing farming tips for Maize:');
    const tips = await databaseService.getFarmingTips('Cassava');
    console.log(tips.substring(0, 200) + '...\n');
    
    console.log('✅ Database tests completed!');
}

testDatabase().catch(console.error);