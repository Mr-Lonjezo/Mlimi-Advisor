// services/smsService.js
const AfricaTalkingService = require('./africasTalkingService');

class SMSService {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        this.testMode = process.env.SMS_TEST_MODE === 'true' || !this.isProduction;
        
        console.log(`[SMS Service] Mode: ${this.testMode ? 'TEST' : 'PRODUCTION'}`);
        console.log(`[SMS Service] Using Africa's Talking Sandbox: ${AfricaTalkingService.isSandbox}`);
    }

    /**
     * Send SMS (main method)
     */
    async sendSMS(to, message) {
        console.log(`[SMS Service] Sending SMS to: ${to}`);
        
        // Validate message length
        if (message.length > 1600) {
            console.warn(`[SMS Service] Message too long (${message.length} chars). Truncating.`);
            message = message.substring(0, 1590) + '...';
        }
        
        // In test mode, just log
        if (this.testMode) {
            console.log(`[SMS Service TEST MODE] Would send to: ${to}`);
            console.log(`[SMS Service TEST MODE] Message: ${message.substring(0, 100)}...`);
            
            // Log to database for testing
            await this.logSMSToDatabase(to, message, 'test_mode');
            
            return {
                success: true,
                status: 'test_mode',
                message: 'SMS logged in test mode',
                simulated: true
            };
        }
        
        // Production: Send via Africa's Talking
        try {
            const result = await AfricaTalkingService.sendSMS(to, message);
            
            // Log result
            await this.logSMSToDatabase(to, message, result.success ? 'sent' : 'failed', result);
            
            return result;
            
        } catch (error) {
            console.error(`[SMS Service] Error sending SMS:`, error);
            
            // Log error
            await this.logSMSToDatabase(to, message, 'error', { error: error.message });
            
            return {
                success: false,
                status: 'error',
                error: error.message
            };
        }
    }
    
    /**
     * Send subscription confirmation
     */
    async sendSubscriptionConfirmation(phone, language = 'en') {
        const messages = {
            en: `Welcome to Mlimi Advisor! You are now subscribed to receive farming alerts via SMS. You will get: weather warnings, price updates, disease alerts, and planting reminders. To unsubscribe or manage preferences, dial *384*456#.`,
            ny: `Takulandilani ku Mlimi Advisor! Mwayesedwa kuti mulandire mauthenga a ulimi pa SMS. Muzalandira: chenjezo la mphepo, mitengo yatsopano, matenda, ndi nthawi yakuti. Kuti muleke kapena kusintha zosankha, dinani *384*456#.`
        };
        
        const message = messages[language] || messages.en;
        return await this.sendSMS(phone, message);
    }
    
    /**
     * Send weather alert
     */
    async sendWeatherAlert(phone, district, alertType, severity = 'medium', language = 'en') {
        const templates = {
            en: {
                heavy_rain: `Mlimi Advisor Weather Alert: Heavy rain expected in ${district}. Prepare drainage. Severity: ${severity}.`,
                drought: `Mlimi Advisor Weather Alert: Dry spell in ${district}. Consider irrigation. Severity: ${severity}.`,
                storm: `Mlimi Advisor Weather Alert: Storm warning for ${district}. Secure crops and equipment.`,
                frost: `Mlimi Advisor Weather Alert: Frost warning for ${district}. Protect sensitive crops.`,
                general: `Mlimi Advisor Weather Alert for ${district}. Check conditions.`
            },
            ny: {
                heavy_rain: `Mlimi Advisor Chenjezo la Mphepo: Madzi ambiri akuyembekezeka ku ${district}. Konzani njira zamadzi. Mkuntho: ${severity}.`,
                drought: `Mlimi Advisor Chenjezo la Mphepo: Dothi ku ${district}. Lingani madzi.`,
                storm: `Mlimi Advisor Chenjezo la Mphepo: Mphepo yamkuntho ku ${district}. Sungani mbeu ndi zipangizo.`,
                frost: `Mlimi Advisor Chenjezo la Mphepo: Chisanu ku ${district}. Chitetezani mbeu zosasunthika.`,
                general: `Mlimi Advisor Chenjezo la mphepo ku ${district}. Yang'anani mwambo.`
            }
        };
        
        const template = templates[language] || templates.en;
        const message = template[alertType] || template.general;
        
        return await this.sendSMS(phone, message);
    }
    
    /**
     * Send price alert
     */
    async sendPriceAlert(phone, crop, district, price, change, language = 'en') {
        const changeType = change > 0 ? 'increased' : 'decreased';
        const changePercent = Math.abs(change).toFixed(1);
        
        const messages = {
            en: `Mlimi Advisor Price Alert: ${crop} price ${changeType} to MK${price}/kg in ${district}. ${changeType} by ${changePercent}%. Check market for details.`,
            ny: `Mlimi Advisor Mtengo Wachinjo: Mtengo wa ${crop} wakwera ku MK${price}/kg ku ${district}. Wakwera ndi ${changePercent}%. Yang'anani misika kuti mudziwe zambiri.`
        };
        
        const message = messages[language] || messages.en;
        return await this.sendSMS(phone, message);
    }
    
    /**
     * Send disease alert
     */
    async sendDiseaseAlert(phone, crop, disease, district, language = 'en') {
        const messages = {
            en: `Mlimi Advisor Disease Alert: ${disease} detected in ${crop} in ${district}. Take preventive measures. Check Mlimi Advisor for treatment advice.`,
            ny: `Mlimi Advisor Chenjezo la Matenda: ${disease} wapezeka ku ${crop} ku ${district}. Ikani njira zotetezera. Yang'anani Mlimi Advisor kuti mudziwe mankhwala.`
        };
        
        const message = messages[language] || messages.en;
        return await this.sendSMS(phone, message);
    }
    
    /**
     * Send planting reminder
     */
    async sendPlantingReminder(phone, crop, district, season, language = 'en') {
        const messages = {
            en: `Mlimi Advisor Planting Reminder: Time to plant ${crop} in ${district} (${season} season). Prepare your seeds and land. For planting guide, dial *384*456#.`,
            ny: `Mlimi Advisor Nthawi Yakuti: Nthawi yokhala ${crop} ku ${district} (nthawi ya ${season}). Konzani mbeu zanu ndi nthaka. Kuti mudziwe malangizo, dinani *384*456#.`
        };
        
        const message = messages[language] || messages.en;
        return await this.sendSMS(phone, message);
    }
    
    /**
     * Send test alert
     */
    async sendTestAlert(phone, language = 'en') {
        const messages = {
            en: `Test alert from Mlimi Advisor! This confirms your subscription is active. You will receive weather, price, disease, and planting alerts. Dial *384*456# to manage preferences.`,
            ny: `Dziwani kuchokera ku Mlimi Advisor! Izi zitsimikizira kuti mwayesedwa. Muzalandira mauthenga a mphepo, mtengo, matenda, ndi nthawi yakuti. Dinani *384*456# kuti musinthe zosankha.`
        };
        
        const message = messages[language] || messages.en;
        return await this.sendSMS(phone, message);
    }
    
    /**
     * Log SMS to database (optional)
     */
    async logSMSToDatabase(phone, message, status, metadata = {}) {
        try {
            // You can log to Supabase if you want to track SMS
            // For now, just console log
            console.log(`[SMS LOG] ${status.toUpperCase()} to ${phone}: ${message.substring(0, 50)}...`);
            
            // Example Supabase logging (uncomment if you have sms_logs table)
            /*
            const supabase = require('./databaseService');
            await supabase
                .from('sms_logs')
                .insert([{
                    phone: phone,
                    message: message.substring(0, 500),
                    status: status,
                    metadata: metadata,
                    sent_at: new Date().toISOString()
                }]);
            */
            
        } catch (error) {
            console.error('[SMS Service] Error logging SMS:', error);
        }
    }
    
    /**
     * Send bulk SMS
     */
    async sendBulkSMS(recipients, message, delay = 2000) {
        console.log(`[SMS Service] Bulk SMS to ${recipients.length} recipients`);
        
        // In test mode, simulate
        if (this.testMode) {
            console.log(`[SMS Service TEST MODE] Would send bulk to ${recipients.length} numbers`);
            return {
                success: true,
                status: 'test_mode',
                total: recipients.length,
                sent: recipients.length,
                failed: 0
            };
        }
        
        // Production: Use Africa's Talking bulk
        return await AfricaTalkingService.sendBulkSMS(recipients, message, delay);
    }
}

module.exports = new SMSService();