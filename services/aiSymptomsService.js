// services/aiSymptomsService.js - AI-Powered Crop Diagnosis
const axios = require('axios');

class AISymptomsService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.baseUrl = 'https://api.groq.com/openai/v1';
        
        if (!this.apiKey) {
            console.log('⚠️ Groq API key not found. Using rule-based wizard.');
            this.useAI = false;
        } else {
            console.log('✅ AI Symptoms Service initialized with Groq');
            this.useAI = true;
        }
        
        // Fallback rules for when AI is unavailable
        this.rulesDatabase = this.createRulesDatabase();
    }

    createRulesDatabase() {
        return {
            'Maize': {
                symptoms: {
                    'yellow streaks parallel veins': {
                        diagnosis: 'Maize Streak Virus',
                        confidence: 0.85,
                        treatment: 'Remove infected plants. Control leafhoppers with insecticides.',
                        prevention: 'Plant resistant varieties. Early planting.'
                    },
                    'holes leaves sawdust frass': {
                        diagnosis: 'Fall Armyworm',
                        confidence: 0.90,
                        treatment: 'Apply neem extract or Emamectin benzoate.',
                        prevention: 'Early planting. Crop rotation.'
                    },
                    'gray rectangular spots': {
                        diagnosis: 'Gray Leaf Spot',
                        confidence: 0.75,
                        treatment: 'Apply fungicides containing azoxystrobin.',
                        prevention: 'Crop rotation. Resistant varieties.'
                    }
                }
            },
            'Cassava': {
                symptoms: {
                    'yellow mosaic patterns': {
                        diagnosis: 'Cassava Mosaic Disease',
                        confidence: 0.88,
                        treatment: 'Use disease-free planting material.',
                        prevention: 'Plant resistant varieties.'
                    },
                    'brown streaks stems': {
                        diagnosis: 'Cassava Brown Streak',
                        confidence: 0.82,
                        treatment: 'No cure. Remove infected plants.',
                        prevention: 'Clean planting material.'
                    }
                }
            }
            // Add more crops...
        };
    }

    async diagnoseWithAI(cropName, symptoms, farmerLocation = 'Malawi') {
        if (!this.useAI) {
            return this.diagnoseWithRules(cropName, symptoms);
        }

        console.log(`🤖 AI diagnosing ${cropName}: "${symptoms.substring(0, 50)}..."`);
        
        const prompt = this.createDiagnosisPrompt(cropName, symptoms, farmerLocation);
        
        try {
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: 'llama3-8b-8192', // Free, fast model
                messages: [
                    {
                        role: 'system',
                        content: 'You are an agricultural expert specializing in crop diseases in Malawi. Provide accurate, practical advice for smallholder farmers.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const aiResponse = response.data.choices[0].message.content;
            return this.formatAIResponse(aiResponse);

        } catch (error) {
            console.error('❌ AI Diagnosis Error:', error.message);
            // Fall back to rules
            return this.diagnoseWithRules(cropName, symptoms);
        }
    }

    createDiagnosisPrompt(cropName, symptoms, location) {
        return `As an agricultural expert in ${location}, diagnose this ${cropName} problem:

Crop: ${cropName}
Symptoms: ${symptoms}
Location: ${location}

Please provide:
1. Most likely disease/pest (with confidence percentage)
2. Key symptoms that match
3. Immediate treatment steps (organic options first)
4. Chemical treatments if needed
5. Prevention for future
6. When to consult extension officer

Format for USSD (max 400 characters, use emojis if helpful):
`;
    }

    formatAIResponse(aiText) {
        // Clean up AI response for USSD
        let response = aiText
            .replace(/```json|```/g, '') // Remove code blocks
            .replace(/\n\s*\n/g, '\n')   // Remove excessive newlines
            .trim();
        
        // Ensure it's not too long for USSD
        if (response.length > 400) {
            response = response.substring(0, 397) + '...';
        }
        
        return response;
    }

    diagnoseWithRules(cropName, symptoms) {
        console.log(`🔍 Rule-based diagnosis for ${cropName}`);
        
        const cropRules = this.rulesDatabase[cropName];
        if (!cropRules) {
            return `No diagnosis rules for ${cropName}. Try maize or cassava.`;
        }

        const symptomText = symptoms.toLowerCase();
        let bestMatch = null;
        let highestConfidence = 0;

        // Find best matching rule
        for (const [pattern, diagnosis] of Object.entries(cropRules.symptoms)) {
            const keywords = pattern.split(' ');
            const matches = keywords.filter(keyword => 
                symptomText.includes(keyword)
            ).length;
            
            const confidence = (matches / keywords.length) * diagnosis.confidence;
            
            if (confidence > highestConfidence && confidence > 0.5) {
                highestConfidence = confidence;
                bestMatch = diagnosis;
            }
        }

        if (!bestMatch) {
            return `No clear diagnosis for "${symptoms}". Try describing specific symptoms like "yellow leaves" or "holes in leaves".`;
        }

        return this.formatRuleResponse(bestMatch, Math.round(highestConfidence * 100));
    }

    formatRuleResponse(diagnosis, confidence) {
        return `Diagnosis: ${diagnosis.diagnosis} (${confidence}% confidence)

💊 Treatment:
${diagnosis.treatment}

🛡️ Prevention:
${diagnosis.prevention}

⚠️ If symptoms persist, consult agriculture extension officer.`;
    }

    async getInteractiveDiagnosis(cropName, session) {
        // For interactive wizard, we can use AI for follow-up questions
        if (!this.useAI) {
            return this.getNextQuestionRules(cropName, session);
        }

        const questions = this.getDiagnosisQuestions(cropName);
        
        if (!session.currentQuestion) {
            return questions[0];
        }

        // Use AI to determine next question based on answer
        return this.getAIQuestion(cropName, session);
    }

    getDiagnosisQuestions(cropName) {
        // Base questions for common crops
        const baseQuestions = [
            {
                id: 1,
                question: 'What part of the plant is affected?',
                options: [
                    'Leaves',
                    'Stems/Stalks', 
                    'Roots/Tubers',
                    'Flowers/Fruits',
                    'Whole plant'
                ]
            },
            {
                id: 2,
                question: 'Describe the color changes:',
                options: [
                    'Yellowing',
                    'Browning',
                    'Spots (what color?)',
                    'Wilting/drooping',
                    'No color change'
                ]
            },
            {
                id: 3, 
                question: 'Are there visible pests?',
                options: [
                    'Small insects visible',
                    'Caterpillars/worms',
                    'No pests visible',
                    'Powdery substance',
                    'Holes/bites'
                ]
            }
        ];

        return baseQuestions;
    }

    async getAIQuestion(cropName, session) {
        const prompt = `Based on this diagnosis session, ask the next most relevant question:

Crop: ${cropName}
Previous Q: ${session.lastQuestion}
Answer: ${session.lastAnswer}

Ask one specific question that will help diagnose the problem. Provide 3-4 answer options.

Format:
Question: [question text]
Options: 1. [option1] 2. [option2] 3. [option3]`;

        try {
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: 'llama3-8b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an agricultural diagnostician. Ask precise questions to identify crop diseases.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 200
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return this.parseAIQuestion(response.data.choices[0].message.content);
            
        } catch (error) {
            console.error('AI Question Error:', error);
            return this.getNextQuestionRules(cropName, session);
        }
    }

    parseAIQuestion(aiText) {
        // Simple parsing of AI response
        const lines = aiText.split('\n').filter(line => line.trim());
        
        let question = '';
        const options = [];
        
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('question:')) {
                question = line.substring(9).trim();
            } else if (line.toLowerCase().includes('option') || /^\d\./.test(line)) {
                options.push(line.replace(/^\d\.\s*/, '').trim());
            }
        });

        return {
            question: question || 'What other symptoms do you see?',
            options: options.length > 0 ? options : ['Yellow leaves', 'Spots', 'Wilting', 'Holes']
        };
    }
}

module.exports = new AISymptomsService();