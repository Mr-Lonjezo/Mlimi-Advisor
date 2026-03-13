// services/subscriptionService.js
const supabase = require('./databaseService');
const SMSService = require('./smsService');

class SubscriptionService {
    
    /**
     * Subscribe farmer to all notifications
     */
    async subscribeFarmer(phoneNumber, language = 'en', subscriptionType = 'all') {
        try {
            console.log(`[Subscription] Subscribing: ${phoneNumber}, lang: ${language}`);
            
            // Check if already subscribed
            const { data: existing, error: checkError } = await supabase
                .from('global_subscriptions')
                .select('*')
                .eq('farmer_phone', phoneNumber)
                .single();
            
            if (existing) {
                // Update existing
                const { data, error } = await supabase
                    .from('global_subscriptions')
                    .update({
                        subscription_type: subscriptionType,
                        language_preference: language,
                        is_active: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();
                
                if (error) throw error;
                
                // Send welcome back SMS
                await SMSService.sendSubscriptionConfirmation(phoneNumber, language);
                
                return {
                    success: true,
                    message: language === 'ny' ? 'Mwazunguliridwa kwambiri!' : 'Resubscribed successfully!',
                    subscriptionId: data.id,
                    isNew: false
                };
            }
            
            // Create new subscription
            const { data, error } = await supabase
                .from('global_subscriptions')
                .insert([{
                    farmer_phone: phoneNumber,
                    subscription_type: subscriptionType,
                    language_preference: language,
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            // Create default preferences
            await supabase
                .from('notification_preferences')
                .insert([{
                    subscription_id: data.id,
                    notify_on_weather_alerts: true,
                    notify_on_price_alerts: true,
                    notify_on_disease_alerts: true,
                    notify_on_market_updates: true,
                    notify_on_planting_seasons: true
                }]);
            
            // Send welcome SMS
            await SMSService.sendSubscriptionConfirmation(phoneNumber, language);
            
            // Log notification
            await this.logNotification(phoneNumber, 'subscription', 
                language === 'ny' ? 'Mwazunguliridwa' : 'Subscribed',
                language === 'ny' ? 'Mwayesedwa ku Mlimi Advisor' : 'Subscribed to Mlimi Advisor'
            );
            
            return {
                success: true,
                message: language === 'ny' ? 'Mwazunguliridwa bwino!' : 'Subscribed successfully!',
                subscriptionId: data.id,
                isNew: true
            };
            
        } catch (error) {
            console.error('[Subscription] Error subscribing:', error);
            return { 
                success: false, 
                message: 'Subscription failed. Please try again.' 
            };
        }
    }
    
    /**
     * Unsubscribe farmer
     */
    async unsubscribeFarmer(phoneNumber, language = 'en') {
        try {
            const { data, error } = await supabase
                .from('global_subscriptions')
                .update({ 
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('farmer_phone', phoneNumber)
                .select()
                .single();
            
            if (error) throw error;
            
            // Send goodbye SMS
            const goodbyeMsg = language === 'ny'
                ? `Zikomo kugwiritsa ntchito Mlimi Advisor. Simuzalandira mauthenga enanso. Mutha kubweranso nthawi iliyonse.`
                : `Thank you for using Mlimi Advisor. You will no longer receive notifications. You can resubscribe anytime.`;
            
            await SMSService.sendSMS(phoneNumber, goodbyeMsg);
            
            return {
                success: true,
                message: language === 'ny' ? 'Mwasiya bwino' : 'Unsubscribed successfully'
            };
        } catch (error) {
            console.error('[Subscription] Error unsubscribing:', error);
            return { success: false, message: 'Failed to unsubscribe.' };
        }
    }
    
    /**
     * Get subscription status
     */
    async getSubscriptionStatus(phoneNumber) {
        try {
            const { data, error } = await supabase
                .from('global_subscriptions')
                .select(`
                    *,
                    notification_preferences(*)
                `)
                .eq('farmer_phone', phoneNumber)
                .single();
            
            if (error || !data) {
                return { 
                    success: false, 
                    isSubscribed: false,
                    message: 'Not subscribed' 
                };
            }
            
            return {
                success: true,
                isSubscribed: data.is_active,
                subscription: data,
                preferences: data.notification_preferences
            };
        } catch (error) {
            console.error('[Subscription] Error getting status:', error);
            return { success: false, isSubscribed: false };
        }
    }
    
    /**
     * Send test alert
     */
    async sendTestAlert(phoneNumber) {
        try {
            const status = await this.getSubscriptionStatus(phoneNumber);
            if (!status.isSubscribed) {
                return { success: false, message: 'Not subscribed' };
            }
            
            const lang = status.subscription?.language_preference || 'en';
            await SMSService.sendTestAlert(phoneNumber, lang);
            
            return {
                success: true,
                message: 'Test alert sent'
            };
        } catch (error) {
            console.error('[Subscription] Error sending test alert:', error);
            return { success: false, message: 'Failed to send test alert' };
        }
    }
    
    /**
     * Update notification preferences
     */
    async updatePreferences(phoneNumber, preferences) {
        try {
            const { data: subscription, error: subError } = await supabase
                .from('global_subscriptions')
                .select('id')
                .eq('farmer_phone', phoneNumber)
                .eq('is_active', true)
                .single();
            
            if (subError || !subscription) {
                return { success: false, message: 'No active subscription found.' };
            }
            
            const { error } = await supabase
                .from('notification_preferences')
                .update(preferences)
                .eq('subscription_id', subscription.id);
            
            if (error) throw error;
            
            // Send confirmation
            const lang = 'en'; // Get from subscription if needed
            const confirmMsg = lang === 'ny'
                ? `Zosankha zanu zasinthidwa. Muzalandira mauthenga ofuna okha.`
                : `Your preferences have been updated. You'll receive only selected alerts.`;
            
            await SMSService.sendSMS(phoneNumber, confirmMsg);
            
            return {
                success: true,
                message: 'Preferences updated successfully'
            };
        } catch (error) {
            console.error('[Subscription] Error updating preferences:', error);
            return { success: false, message: 'Failed to update preferences.' };
        }
    }
    
    /**
     * Send daily digest
     */
    async sendDigest(phoneNumber, digestType = 'daily') {
        try {
            const { data: subscription, error } = await supabase
                .from('global_subscriptions')
                .select(`
                    *,
                    notification_preferences(*)
                `)
                .eq('farmer_phone', phoneNumber)
                .eq('is_active', true)
                .single();
            
            if (error || !subscription) {
                return { success: false, message: 'No active subscription found.' };
            }
            
            const lang = subscription.language_preference || 'en';
            
            // Build digest message
            let digestMessage = lang === 'ny'
                ? `Mlimi Advisor Digest:\n\n`
                : `Mlimi Advisor Digest:\n\n`;
            
            // Add some sample content (you can customize this)
            digestMessage += lang === 'ny'
                ? `Dikirani: Dial *384*456# kuti muwone:\n- Mphepo yatsopano\n- Mitengo ya misika\n- Malangizo a matenda\n- Nthawi yakuti\n\nZikomo!`
                : `Remember: Dial *384*456# for:\n- Latest weather\n- Market prices\n- Disease advice\n- Planting calendar\n\nThank you!`;
            
            await SMSService.sendSMS(phoneNumber, digestMessage);
            
            return {
                success: true,
                message: lang === 'ny' ? 'Digest yatumizidwa' : 'Digest sent successfully'
            };
        } catch (error) {
            console.error('[Subscription] Error sending digest:', error);
            return { success: false, message: 'Failed to send digest.' };
        }
    }
    
    /**
     * Log notification
     */
    async logNotification(phone, type, title, message, metadata = {}) {
        try {
            await supabase
                .from('notifications_log')
                .insert([{
                    farmer_phone: phone,
                    notification_type: type,
                    title: title,
                    message: message,
                    metadata: metadata
                }]);
        } catch (error) {
            console.error('[Subscription] Error logging notification:', error);
        }
    }
    
    /**
     * Get active subscribers count
     */
    async getSubscriberCount() {
        try {
            const { count, error } = await supabase
                .from('global_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            if (error) throw error;
            
            return { success: true, count: count || 0 };
        } catch (error) {
            console.error('[Subscription] Error getting count:', error);
            return { success: false, count: 0 };
        }
    }
    
    /**
     * Get notification history
     */
    async getNotificationHistory(phoneNumber, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('notifications_log')
                .select('*')
                .eq('farmer_phone', phoneNumber)
                .order('sent_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            
            return {
                success: true,
                notifications: data || []
            };
        } catch (error) {
            console.error('[Subscription] Error getting history:', error);
            return { success: false, notifications: [] };
        }
    }
}

module.exports = new SubscriptionService();