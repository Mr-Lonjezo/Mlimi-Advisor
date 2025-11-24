// debug-test.js - SIMPLE TEST
const http = require('http');

console.log('🧪 Starting Simple USSD Test...\n');

function testStep(stepName, sessionId, text) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            phoneNumber: '+265991234567',
            sessionId: sessionId,
            text: text
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/ussd',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`✅ ${stepName}`);
                console.log(`   Input: "${text || '(start)'}"`);
                console.log(`   Response: ${data.substring(0, 100)}...`);
                console.log('');
                resolve(data);
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${stepName} FAILED`);
            console.log(`   Error: ${error.message}`);
            console.log('💡 Make sure server is running: npm run dev');
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function runTest() {
    try {
        const sessionId = 'test_' + Date.now();
        
        // Step 1: Start session
        await testStep('1. Start USSD Session', sessionId, '');
        
        // Step 2: Select Weather
        await testStep('2. Select Weather (Option 1)', sessionId, '1');
        
        // Step 3: Select District
        await testStep('3. Select Kasungu (Option 1)', sessionId, '1*1');
        
        console.log('🎉 ALL TESTS PASSED! USSD system is working!');
        
    } catch (error) {
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Run "npm run dev" in another terminal');
        console.log('   2. Make sure you see "Server started on port 3000"');
        console.log('   3. Then run this test again');
    }
}

runTest();