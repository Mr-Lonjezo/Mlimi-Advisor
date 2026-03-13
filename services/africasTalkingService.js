// services/africasTalkingService.js
const axios = require('axios');

class AfricaTalkingService {
    constructor() {
        // Sandbox credentials (update in .env for production)
        this.apiKey = process.env.AFRICASTALKING_API_KEY || '';
        this.username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
        this.senderId = process.env.AFRICASTALKING_SENDER_ID || 'MLIMI';
        
        // API endpoints
        this.baseUrl = 'https://api.sandbox.africastalking.com/version1';
        this.smsUrl = `${this.baseUrl}/messaging`;
        this.balanceUrl = `${this.baseUrl}/user`;
        
        // Track if we're in sandbox mode
        this.isSandbox = this.username === 'sandbox';
    }

    /**
     * Send SMS via Africa's Talking
     */
    async sendSMS(to, message) {
        console.log(`[AT SMS] Sending to: ${to}`);
        console.log(`[AT SMS] Message (${message.length} chars): ${message.substring(0, 50)}...`);
        
        // Validate phone number
        const formattedPhone = this.formatPhoneNumber(to);
        if (!formattedPhone) {
            console.error(`[AT SMS] Invalid phone number: ${to}`);
            return {
                success: false,
                status: 'invalid_number',
                error: 'Invalid phone number format'
            };
        }
        
        // In sandbox, only send to whitelisted numbers
        if (this.isSandbox) {
            console.log(`[AT SMS] Sandbox mode - simulating send to ${formattedPhone}`);
            // Simulate API call for sandbox testing
            return this.simulateSendSMS(formattedPhone, message);
        }
        
        // Production: Make actual API call
        try {
            const response = await this.makeSMSRequest(formattedPhone, message);
            return this.handleSMSResponse(response);
        } catch (error) {
            console.error('[AT SMS] Error:', error.message);
            return {
                success: false,
                status: 'api_error',
                error: error.message
            };
        }
    }
    
    /**
     * Format phone number for Malawi
     */
    formatPhoneNumber(phone) {
        // Remove any non-digit characters except +
        let clean = phone.replace(/[^\d+]/g, '');
        
        // Convert to international format
        if (clean.startsWith('0')) {
            // Local format: 0991234567 -> +265991234567
            clean = '+265' + clean.substring(1);
        } else if (clean.startsWith('265') && !clean.startsWith('+265')) {
            // Missing plus: 265991234567 -> +265991234567
            clean = '+' + clean;
        } else if (clean.startsWith('+265')) {
            // Already correct
            clean = clean;
        } else {
            console.warn(`[AT SMS] Unrecognized phone format: ${phone}`);
            return null;
        }
        
        // Validate final format
        if (!/^\+265\d{9}$/.test(clean)) {
            console.warn(`[AT SMS] Invalid Malawi number: ${clean}`);
            return null;
        }
        
        return clean;
    }
    
    /**
     * Simulate SMS send for sandbox/testing
     */
    async simulateSendSMS(to, message) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`[AT SMS SIMULATION] To: ${to}`);
        console.log(`[AT SMS SIMULATION] Message: ${message}`);
        
        return {
            success: true,
            status: 'simulated_sandbox',
            messageId: `SIM-${Date.now()}`,
            cost: '0.00',
            recipients: [{
                statusCode: 101,
                number: to,
                status: 'Success',
                cost: '0.00',
                messageId: `SIM-${Date.now()}`
            }]
        };
    }
    
    /**
     * Make actual API request to Africa's Talking
     */
    async makeSMSRequest(to, message) {
        const postData = new URLSearchParams({
            username: this.username,
            to: to,
            message: message,
            from: this.senderId
        }).toString();
        
        const response = await axios.post(this.smsUrl, postData, {
            headers: {
                'apiKey': this.apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout: 10000 // 10 seconds
        });
        
        return response.data;
    }
    
    /**
     * Handle API response
     */
    handleSMSResponse(response) {
        console.log('[AT SMS] Response:', JSON.stringify(response, null, 2));
        
        if (response.SMSMessageData && response.SMSMessageData.Recipients) {
            const recipient = response.SMSMessageData.Recipients[0];
            return {
                success: recipient.status === 'Success',
                status: recipient.status,
                messageId: recipient.messageId,
                cost: recipient.cost,
                rawResponse: response
            };
        }
        
        return {
            success: false,
            status: 'unknown_response',
            rawResponse: response
        };
    }
    
    /**
     * Send bulk SMS with rate limiting
     */
    async sendBulkSMS(recipients, message, delay = 1000) {
        console.log(`[AT SMS] Bulk sending to ${recipients.length} recipients`);
        
        const results = [];
        
        for (const recipient of recipients) {
            try {
                const result = await this.sendSMS(recipient, message);
                results.push({
                    recipient,
                    success: result.success,
                    status: result.status,
                    messageId: result.messageId
                });
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, delay));
                
            } catch (error) {
                results.push({
                    recipient,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return {
            total: recipients.length,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }
    
    /**
     * Check account balance
     */
    async checkBalance() {
        if (this.isSandbox) {
            return {
                success: true,
                balance: 'Sandbox - Unlimited',
                currency: 'MWK'
            };
        }
        
        try {
            const response = await axios.get(this.balanceUrl, {
                params: { username: this.username },
                headers: {
                    'apiKey': this.apiKey,
                    'Accept': 'application/json'
                }
            });
            
            return {
                success: true,
                balance: response.data.UserData.balance,
                currency: response.data.UserData.currency
            };
        } catch (error) {
            console.error('[AT SMS] Balance check error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new AfricaTalkingService();