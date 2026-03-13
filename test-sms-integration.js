#!/usr/bin/env node

/**
 * Mlimi Advisor SMS Integration Test Script
 * 
 * This script tests the Africa's Talking SMS integration
 * Run with: node test-sms-integration.js
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://mlimi-advisor.onrender.com' 
    : 'http://localhost:3000';

const TEST_PHONES = [
    '+265984830007',  // Replace with your whitelisted numbers
    '+265881339352'
];

// Create readline interface for interactive prompts
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper: Prompt user for input
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Helper: Colorful console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.blue}→ ${msg}${colors.reset}`)
};

// Helper: Make API request
async function makeRequest(endpoint, params = {}) {
    try {
        const url = `${BASE_URL}${endpoint}`;
        log.info(`Calling: ${url}`);
        
        const response = await axios.get(url, { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message,
            details: error.response?.data 
        };
    }
}

// Helper: Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class SMSTester {
    constructor() {
        this.testResults = [];
        this.testPhone = TEST_PHONES[0];
    }

    // Record test result
    recordTest(name, result) {
        const testResult = {
            name,
            timestamp: new Date().toISOString(),
            success: result.success,
            details: result
        };
        this.testResults.push(testResult);
        return testResult;
    }

    // Display test results
    displayResults() {
        log.header('\n📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(t => t.success).length;
        const failed = this.testResults.filter(t => !t.success).length;
        
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
        console.log('='.repeat(50));
        
        // Detailed results
        this.testResults.forEach((test, index) => {
            const status = test.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${status} - ${test.name}`);
            
            if (!test.success && test.details.error) {
                console.log(`   Error: ${test.details.error}`);
            }
            
            // Show response time if available
            if (test.details.responseTime) {
                console.log(`   Response Time: ${test.details.responseTime}ms`);
            }
        });
        
        console.log('='.repeat(50));
    }

    // Test 1: Check server health
    async testServerHealth() {
        log.header('\n1️⃣ TEST: SERVER HEALTH CHECK');
        
        const startTime = Date.now();
        const result = await makeRequest('/');
        const responseTime = Date.now() - startTime;
        
        const testResult = {
            success: result.success,
            data: result.data,
            responseTime
        };
        
        if (result.success) {
            log.success(`Server is running!`);
            log.info(`Response Time: ${responseTime}ms`);
            log.info(`Version: ${result.data?.version || 'Unknown'}`);
            log.info(`Status: ${result.data?.status || 'Unknown'}`);
        } else {
            log.error(`Server is not responding`);
            log.error(`Error: ${result.error}`);
        }
        
        return this.recordTest('Server Health', testResult);
    }

    // Test 2: Check SMS configuration
    async testSMSConfig() {
        log.header('\n2️⃣ TEST: SMS CONFIGURATION');
        
        const result = await makeRequest('/sms-config');
        
        const testResult = {
            success: result.success,
            config: result.data
        };
        
        if (result.success) {
            log.success(`SMS Configuration loaded`);
            
            const config = result.data.africastalking;
            log.info(`Username: ${config.username}`);
            log.info(`Sender ID: ${config.sender_id}`);
            log.info(`Has API Key: ${config.has_api_key ? 'Yes' : 'No'}`);
            
            const service = result.data.sms_service;
            log.info(`Test Mode: ${service.test_mode ? 'Yes' : 'No'}`);
            log.info(`Production: ${service.production ? 'Yes' : 'No'}`);
            
            if (!config.has_api_key) {
                log.warning('API Key is not configured!');
                testResult.success = false;
            }
            
        } else {
            log.error(`Failed to load SMS configuration`);
            log.error(`Error: ${result.error}`);
        }
        
        return this.recordTest('SMS Configuration', testResult);
    }

    // Test 3: Check Africa's Talking balance
    async testBalanceCheck() {
        log.header('\n3️⃣ TEST: AFRICA\'S TALKING BALANCE');
        
        const result = await makeRequest('/sms-balance');
        
        const testResult = {
            success: result.success,
            balance: result.data
        };
        
        if (result.success && result.data.success) {
            log.success(`Balance check successful`);
            log.info(`Balance: ${result.data.balance} ${result.data.currency}`);
            
            const balance = parseFloat(result.data.balance);
            if (balance <= 0) {
                log.warning('Account balance is low or zero!');
            }
        } else {
            log.error(`Failed to check balance`);
            if (result.data?.error) {
                log.error(`API Error: ${result.data.error}`);
            } else if (result.error) {
                log.error(`Network Error: ${result.error}`);
            }
        }
        
        return this.recordTest('Balance Check', testResult);
    }

    // Test 4: Send single SMS
    async testSingleSMS() {
        log.header('\n4️⃣ TEST: SEND SINGLE SMS');
        
        // Ask for phone number
        const phone = await question(`Enter phone number to test (default: ${this.testPhone}): `) || this.testPhone;
        const message = 'Test SMS from Mlimi Advisor integration test script. If you receive this, SMS is working!';
        
        log.step(`Testing with phone: ${phone}`);
        log.step(`Message: ${message.substring(0, 60)}...`);
        
        const startTime = Date.now();
        const result = await makeRequest('/test-sms', {
            phone: phone,
            message: message
        });
        const responseTime = Date.now() - startTime;
        
        const testResult = {
            success: result.success,
            data: result.data,
            responseTime,
            phoneTested: phone
        };
        
        if (result.success && result.data?.result?.success) {
            log.success(`SMS sent successfully!`);
            log.info(`Status: ${result.data.result.status}`);
            log.info(`Response Time: ${responseTime}ms`);
            log.info(`Test Mode: ${result.data.result.testMode ? 'Yes' : 'No'}`);
            
            if (result.data.result.testMode) {
                log.warning('Running in test mode - SMS was not actually sent');
            }
        } else {
            log.error(`Failed to send SMS`);
            if (result.data?.result?.error) {
                log.error(`SMS Error: ${result.data.result.error}`);
            } else if (result.error) {
                log.error(`Network Error: ${result.error}`);
            }
        }
        
        return this.recordTest('Single SMS', testResult);
    }

    // Test 5: Test subscription flow
    async testSubscriptionFlow() {
        log.header('\n5️⃣ TEST: SUBSCRIPTION FLOW');
        
        const phone = await question(`Enter phone for subscription test (default: ${this.testPhone}): `) || this.testPhone;
        const language = await question('Enter language (en/ny, default: en): ') || 'en';
        
        log.step(`Testing subscription for: ${phone}`);
        log.step(`Language: ${language}`);
        
        // Step 1: Subscribe
        log.info('Step 1: Subscribing...');
        const subscribeResult = await makeRequest('/test-subscription', {
            phone: phone,
            lang: language
        });
        
        const testResult = {
            success: subscribeResult.success,
            data: subscribeResult.data,
            phoneTested: phone,
            language: language
        };
        
        if (subscribeResult.success) {
            log.success('Subscription test completed');
            
            // Check subscription status
            if (subscribeResult.data?.subscription?.success) {
                log.info(`Subscription: ${subscribeResult.data.subscription.message}`);
            }
            
            // Check test alert
            if (subscribeResult.data?.test_alert?.success) {
                log.info(`Test Alert: ${subscribeResult.data.test_alert.message}`);
            }
            
            // Check status
            if (subscribeResult.data?.status?.isSubscribed) {
                log.success('User is successfully subscribed!');
            } else {
                log.warning('User subscription status not confirmed');
            }
            
        } else {
            log.error('Subscription test failed');
            if (subscribeResult.error) {
                log.error(`Error: ${subscribeResult.error}`);
            }
        }
        
        // Wait a bit before next test
        await delay(2000);
        
        return this.recordTest('Subscription Flow', testResult);
    }

    // Test 6: Test bulk SMS (simulated)
    async testBulkSMS() {
        log.header('\n6️⃣ TEST: BULK SMS (SIMULATED)');
        
        log.step('Testing bulk SMS with 3 numbers...');
        log.info('Numbers:', TEST_PHONES.join(', '));
        
        const result = await makeRequest('/test-bulk-sms');
        
        const testResult = {
            success: result.success,
            data: result.data
        };
        
        if (result.success && result.data?.result) {
            const bulkResult = result.data.result;
            log.success('Bulk SMS test completed');
            log.info(`Total recipients: ${bulkResult.total}`);
            log.info(`Successful: ${bulkResult.sent}`);
            log.info(`Failed: ${bulkResult.failed}`);
            
            if (bulkResult.sent > 0) {
                log.success(`Successfully sent ${bulkResult.sent} SMS`);
            }
            
            if (bulkResult.failed > 0) {
                log.warning(`${bulkResult.failed} SMS failed to send`);
            }
        } else {
            log.error('Bulk SMS test failed');
            if (result.error) {
                log.error(`Error: ${result.error}`);
            }
        }
        
        return this.recordTest('Bulk SMS', testResult);
    }

    // Test 7: Validate phone number formatting
    async testPhoneValidation() {
        log.header('\n7️⃣ TEST: PHONE NUMBER VALIDATION');
        
        const testCases = [
            '+265991234567',  // Valid international
            '265991234567',   // Valid without +
            '0991234567',     // Valid local
            '991234567',      // Invalid (too short)
            '+255991234567',  // Invalid (Tanzania)
            'invalid-phone',  // Invalid format
            '+26599123456789' // Invalid (too long)
        ];
        
        log.step('Testing phone number validation...');
        
        const validationResults = [];
        
        for (const phone of testCases) {
            const result = await makeRequest('/test-sms', {
                phone: phone,
                message: 'Validation test'
            });
            
            const isValid = result.success && result.data?.result?.success;
            validationResults.push({
                phone,
                valid: isValid,
                error: result.data?.result?.error
            });
            
            const status = isValid ? '✅' : '❌';
            console.log(`${status} ${phone}`);
        }
        
        const validCount = validationResults.filter(r => r.valid).length;
        const invalidCount = validationResults.filter(r => !r.valid).length;
        
        log.info(`Valid: ${validCount}, Invalid: ${invalidCount}`);
        
        const testResult = {
            success: validCount > 0,
            validationResults,
            summary: {
                total: validationResults.length,
                valid: validCount,
                invalid: invalidCount
            }
        };
        
        if (validCount > 0) {
            log.success('Phone validation working');
        } else {
            log.error('Phone validation failed');
        }
        
        return this.recordTest('Phone Validation', testResult);
    }

    // Test 8: Performance test
    async testPerformance() {
        log.header('\n8️⃣ TEST: PERFORMANCE');
        
        const iterations = 3;
        const responseTimes = [];
        
        log.step(`Running ${iterations} SMS requests...`);
        
        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            await makeRequest('/test-sms', {
                phone: this.testPhone,
                message: `Performance test ${i + 1}`
            });
            const responseTime = Date.now() - startTime;
            responseTimes.push(responseTime);
            
            log.info(`Request ${i + 1}: ${responseTime}ms`);
            
            // Small delay between requests
            if (i < iterations - 1) {
                await delay(1000);
            }
        }
        
        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minTime = Math.min(...responseTimes);
        const maxTime = Math.max(...responseTimes);
        
        log.info(`Average Response Time: ${avgTime.toFixed(0)}ms`);
        log.info(`Min Time: ${minTime}ms, Max Time: ${maxTime}ms`);
        
        const testResult = {
            success: avgTime < 5000, // Pass if average < 5 seconds
            metrics: {
                iterations,
                responseTimes,
                average: avgTime,
                min: minTime,
                max: maxTime
            },
            threshold: 5000
        };
        
        if (testResult.success) {
            log.success(`Performance acceptable (avg ${avgTime.toFixed(0)}ms)`);
        } else {
            log.warning(`Performance slow (avg ${avgTime.toFixed(0)}ms, threshold: 5000ms)`);
        }
        
        return this.recordTest('Performance', testResult);
    }

    // Run all tests
    async runAllTests() {
        log.header('🚀 MLIMI ADVISOR SMS INTEGRATION TEST SUITE');
        log.info(`Base URL: ${BASE_URL}`);
        log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        log.info(`Test Phone: ${this.testPhone}`);
        console.log('='.repeat(60));
        
        try {
            // Run tests in sequence
            await this.testServerHealth();
            await delay(1000);
            
            await this.testSMSConfig();
            await delay(1000);
            
            await this.testBalanceCheck();
            await delay(1000);
            
            await this.testSingleSMS();
            await delay(2000);
            
            await this.testSubscriptionFlow();
            await delay(2000);
            
            await this.testBulkSMS();
            await delay(1000);
            
            await this.testPhoneValidation();
            await delay(1000);
            
            await this.testPerformance();
            
        } catch (error) {
            log.error(`Test suite error: ${error.message}`);
        }
        
        // Display final results
        this.displayResults();
        
        // Recommendations
        this.displayRecommendations();
        
        // Close readline
        rl.close();
    }

    // Display recommendations based on test results
    displayRecommendations() {
        const failedTests = this.testResults.filter(t => !t.success);
        
        if (failedTests.length === 0) {
            log.success('\n🎉 ALL TESTS PASSED! Your SMS integration is ready.');
            return;
        }
        
        log.header('\n🔧 RECOMMENDATIONS');
        
        failedTests.forEach(test => {
            console.log(`\nFor "${test.name}":`);
            
            if (test.name === 'SMS Configuration') {
                console.log('   • Check your .env file for Africa\'s Talking credentials');
                console.log('   • Verify AFRICASTALKING_API_KEY is set');
                console.log('   • Ensure AFRICASTALKING_USERNAME is "sandbox" for testing');
            }
            
            if (test.name === 'Balance Check') {
                console.log('   • Check your Africa\'s Talking API key');
                console.log('   • Visit: https://account.africastalking.com');
                console.log('   • Generate new API key if needed');
            }
            
            if (test.name === 'Single SMS') {
                console.log('   • Verify phone number is whitelisted in Africa\'s Talking sandbox');
                console.log('   • Check SMS_TEST_MODE in .env file');
                console.log('   • Test with a different phone number');
            }
            
            if (test.name === 'Subscription Flow') {
                console.log('   • Check database connection');
                console.log('   • Verify Supabase tables are created');
                console.log('   • Check subscription service logs');
            }
            
            if (test.name === 'Performance') {
                console.log('   • Consider optimizing API calls');
                console.log('   • Check network latency');
                console.log('   • Monitor Render.com performance');
            }
        });
        
        console.log('\n📝 Next Steps:');
        console.log('1. Review failed tests above');
        console.log('2. Check server logs for detailed errors');
        console.log('3. Test with actual whitelisted phone numbers');
        console.log('4. Set SMS_TEST_MODE=false when ready for production');
    }
}

// Run the test suite
async function main() {
    console.clear();
    log.header('🌾 MLIMI ADVISOR - SMS INTEGRATION TESTER');
    
    const tester = new SMSTester();
    
    // Check if we should run all tests or specific ones
    const mode = await question('\nRun (1) All tests or (2) Custom test? [1/2]: ');
    
    if (mode === '2') {
        console.log('\nAvailable tests:');
        console.log('1. Server Health');
        console.log('2. SMS Configuration');
        console.log('3. Balance Check');
        console.log('4. Single SMS');
        console.log('5. Subscription Flow');
        console.log('6. Bulk SMS');
        console.log('7. Phone Validation');
        console.log('8. Performance');
        
        const testChoice = await question('\nEnter test numbers (comma-separated, e.g., "1,3,4"): ');
        const tests = testChoice.split(',').map(t => parseInt(t.trim()));
        
        for (const testNum of tests) {
            switch(testNum) {
                case 1: await tester.testServerHealth(); break;
                case 2: await tester.testSMSConfig(); break;
                case 3: await tester.testBalanceCheck(); break;
                case 4: await tester.testSingleSMS(); break;
                case 5: await tester.testSubscriptionFlow(); break;
                case 6: await tester.testBulkSMS(); break;
                case 7: await tester.testPhoneValidation(); break;
                case 8: await tester.testPerformance(); break;
                default: log.error(`Invalid test number: ${testNum}`);
            }
            await delay(1000);
        }
        
        tester.displayResults();
        tester.displayRecommendations();
        rl.close();
        
    } else {
        // Run all tests
        await tester.runAllTests();
    }
}

// Handle script execution
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SMSTester;