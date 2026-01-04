// services/symptomsWizardService.js - Updated with AI Integration
const aiSymptomsService = require('./aiSymptomsService');

class SymptomsWizardService {
    constructor() {
        this.aiService = aiSymptomsService;
        console.log('✅ Symptoms Wizard Service initialized with AI integration');
        
        // Interactive sessions storage
        this.interactiveSessions = new Map();
        
        // Clean up old sessions every hour
        setInterval(() => this.cleanupSessions(), 3600000);
    }

    async quickDiagnosis(cropName, symptoms) {
        console.log(`🔍 Quick diagnosis for ${cropName}: "${symptoms}"`);
        
        // Use AI service for diagnosis
        return await this.aiService.diagnoseWithAI(cropName, symptoms, 'Malawi');
    }

    async startInteractiveDiagnosis(cropName, phoneNumber, sessionId) {
        console.log(`🎯 Starting interactive diagnosis for ${cropName}, phone: ${phoneNumber}`);
        
        const session = {
            crop: cropName,
            phoneNumber: phoneNumber,
            sessionId: sessionId,
            step: 1,
            symptoms: [],
            createdAt: Date.now(),
            history: []
        };
        
        this.interactiveSessions.set(sessionId, session);
        
        const firstQuestion = await this.aiService.startInteractiveDiagnosis(cropName, phoneNumber);
        firstQuestion.sessionId = sessionId; // Ensure session ID matches
        
        return firstQuestion;
    }

    async processInteractiveStep(sessionId, answer) {
        const session = this.interactiveSessions.get(sessionId);
        
        if (!session) {
            return {
                error: 'Session expired or not found. Please start over.',
                expired: true
            };
        }
        
        // Update session timestamp
        session.lastActivity = Date.now();
        
        // Process the answer
        const result = await this.aiService.processInteractiveAnswer(session, answer);
        
        if (result.canceled) {
            this.interactiveSessions.delete(sessionId);
            return result;
        }
        
        if (result.complete) {
            // Diagnosis complete
            this.interactiveSessions.delete(sessionId);
            return {
                complete: true,
                diagnosis: result.diagnosis,
                sessionId: sessionId
            };
        }
        
        if (result.continue) {
            // Update session and continue
            session.step = result.step;
            session.history.push({
                step: session.step,
                question: result.question,
                answer: answer
            });
            
            this.interactiveSessions.set(sessionId, session);
            
            return {
                continue: true,
                question: result.question,
                options: result.options,
                step: result.step,
                sessionId: sessionId
            };
        }
        
        return result;
    }

    getSession(sessionId) {
        return this.interactiveSessions.get(sessionId);
    }

    cleanupSessions() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        let cleaned = 0;
        
        for (const [sessionId, session] of this.interactiveSessions.entries()) {
            if (now - session.createdAt > maxAge) {
                this.interactiveSessions.delete(sessionId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired diagnosis sessions`);
        }
    }

    formatForUSSD(content) {
        // Ensure content is USSD-friendly
        let formatted = content
            .replace(/\. /g, '.\n')
            .replace(/\n\s*\n/g, '\n')
            .trim();
        
        // Limit line length
        const lines = formatted.split('\n');
        const processedLines = lines.map(line => {
            if (line.length > 40) {
                // Break long lines
                const words = line.split(' ');
                let currentLine = '';
                let result = [];
                
                for (const word of words) {
                    if ((currentLine + ' ' + word).length > 40) {
                        result.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = currentLine ? currentLine + ' ' + word : word;
                    }
                }
                
                if (currentLine) {
                    result.push(currentLine);
                }
                
                return result.join('\n');
            }
            return line;
        });
        
        return processedLines.join('\n');
    }
}

module.exports = new SymptomsWizardService();