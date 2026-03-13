const express = require('express');
const router = express.Router();
const SubscriptionService = require('../services/subscriptionService');

// Subscribe farmer
router.post('/subscribe', async (req, res) => {
    try {
        const { phone, language = 'en', subscriptionType = 'all' } = req.body;
        
        if (!phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number is required' 
            });
        }
        
        const result = await SubscriptionService.subscribeFarmer(phone, language, subscriptionType);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error during subscription' 
        });
    }
});

// Unsubscribe farmer
router.post('/unsubscribe', async (req, res) => {
    try {
        const { phone, language = 'en' } = req.body;
        
        if (!phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number is required' 
            });
        }
        
        const result = await SubscriptionService.unsubscribeFarmer(phone, language);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error during unsubscription' 
        });
    }
});

// Get subscription status
router.get('/status/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const result = await SubscriptionService.getSubscriptionStatus(phone);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching status' 
        });
    }
});

// Update preferences
router.post('/preferences', async (req, res) => {
    try {
        const { phone, preferences } = req.body;
        
        if (!phone || !preferences) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone and preferences required' 
            });
        }
        
        const result = await SubscriptionService.updatePreferences(phone, preferences);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating preferences' 
        });
    }
});

// Send test alert
router.post('/test-alert', async (req, res) => {
    try {
        const { phone, alertType = 'test' } = req.body;
        
        if (!phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number required' 
            });
        }
        
        const testMsg = `✅ Test alert from Mlimi Advisor Subscription System!\n\nYou are successfully subscribed to receive:\n• Weather warnings\n• Price updates\n• Disease alerts\n• Planting reminders\n\nStay informed!`;
        
        await SMSService.sendSMS(phone, testMsg);
        
        res.json({
            success: true,
            message: 'Test alert sent successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error sending test alert' 
        });
    }
});

// Admin: Send broadcast message
router.post('/broadcast', async (req, res) => {
    try {
        const { title, message, targetDistrict, targetCropId, broadcastType = 'general' } = req.body;
        
        // Get all active subscribers
        const { data: subscriptions, error } = await supabase
            .from('global_subscriptions')
            .select('farmer_phone')
            .eq('is_active', true);
        
        if (error || !subscriptions || subscriptions.length === 0) {
            return res.json({ 
                success: false, 
                message: 'No active subscribers found' 
            });
        }
        
        const broadcastMessage = `📢 ${title}\n\n${message}\n\n- Mlimi Advisor Team`;
        
        let sentCount = 0;
        for (const sub of subscriptions) {
            await SMSService.sendSMS(sub.farmer_phone, broadcastMessage);
            sentCount++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Log broadcast
        await supabase
            .from('broadcast_messages')
            .insert([{
                title,
                message,
                target_district: targetDistrict,
                target_crop_id: targetCropId,
                broadcast_type: broadcastType,
                status: 'sent',
                sent_at: new Date().toISOString(),
                created_by: 'admin'
            }]);
        
        res.json({
            success: true,
            message: `Broadcast sent to ${sentCount} subscribers`,
            sentCount
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error sending broadcast' 
        });
    }
});

// Get notification history
router.get('/history/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const { limit = 10 } = req.query;
        
        const { data, error } = await supabase
            .from('notifications_log')
            .select('*')
            .eq('farmer_phone', phone)
            .order('sent_at', { ascending: false })
            .limit(parseInt(limit));
        
        if (error) throw error;
        
        res.json({
            success: true,
            notifications: data || []
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching history' 
        });
    }
});

module.exports = router;