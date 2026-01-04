// test-ai-symptoms.js - Test AI Symptoms System
require('dotenv').config();
const aiSymptomsService = require('./services/aiSymptomsService');

async function testAISystem() {
    console.log('🧪 Testing AI Symptoms System\n');
    
    // Test 1: Check if API key is configured
    console.log('1. Checking configuration:');
    console.log('   GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Not configured');
    console.log('   AI Service Status:', aiSymptomsService.useAI ? '✅ Active' : '⚠️ Using rules');
    console.log('');
    
    // Test 2: Test AI diagnosis
    console.log('2. Testing AI diagnosis:');
    try {
        const diagnosis = await aiSymptomsService.diagnoseWithAI(
            'Maize',
            'yellow streaks on leaves parallel to veins',
            'Kasungu, Malawi'
        );
        
        console.log('   ✅ AI Diagnosis successful');
        console.log('   📏 Length:', diagnosis.length, 'characters');
        console.log('   📋 Preview:', diagnosis.substring(0, 150) + '...\n');
        
    } catch (error) {
        console.log('   ❌ AI Diagnosis failed:', error.message);
        
        // Test rule-based fallback
        console.log('\n3. Testing rule-based fallback:');
        const ruleDiagnosis = aiSymptomsService.diagnoseWithRules(
            'Maize',
            'yellow streaks on leaves'
        );
        
        console.log('   ✅ Rule-based diagnosis successful');
        console.log('   📏 Length:', ruleDiagnosis.length, 'characters');
        console.log('   📋 Preview:', ruleDiagnosis.substring(0, 150) + '...\n');
    }
    
    // Test 3: Test interactive diagnosis
    console.log('4. Testing interactive diagnosis start:');
    const interactiveStart = await aiSymptomsService.startInteractiveDiagnosis(
        'Cassava',
        '+265881123456'
    );
    
    console.log('   ✅ Interactive session started');
    console.log('   Session ID:', interactiveStart.sessionId);
    console.log('   First question:', interactiveStart.question.substring(0, 50) + '...\n');
    
    console.log('🎯 AI Symptoms System Test Complete!');
    
    // Show next steps
    console.log('\n📝 Next Steps:');
    console.log('1. Add GROQ_API_KEY to .env file');
    console.log('2. Restart your server');
    console.log('3. Test with USSD: *384*YOUR_CODE#');
    console.log('4. Select option 5 → 1 for AI diagnosis');
}

testAISystem().catch(console.error);