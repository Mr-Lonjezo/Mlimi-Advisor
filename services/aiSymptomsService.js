// services/aiSymptomsService.js - COMPLETE AI-Powered Crop Diagnosis
const axios = require('axios');

class AISymptomsService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.baseUrl = 'https://api.groq.com/openai/v1/models';
        
        console.log('🤖 AI Symptoms Service initializing...');
        
        if (!this.apiKey) {
            console.log('⚠️ GROQ_API_KEY not found in environment variables');
            console.log('ℹ️ Please add GROQ_API_KEY to your .env file');
            console.log('ℹ️ Get free key from: https://console.groq.com');
            this.useAI = false;
        } else {
            console.log('✅ AI Symptoms Service initialized with Groq API');
            this.useAI = true;
        }
        
        // Enhanced fallback rules for when AI is unavailable
        this.rulesDatabase = this.createRulesDatabase();
    }

    createRulesDatabase() {
        return {
            'Maize': {
                symptoms: {
                    'yellow streaks parallel veins': {
                        diagnosis: 'Maize Streak Virus',
                        confidence: 0.85,
                        treatment: '1. Remove infected plants immediately\n2. Control leafhoppers with insecticides\n3. Spray with neem oil solution',
                        prevention: '1. Plant resistant varieties (DK 777, SC 513)\n2. Early planting\n3. Weed control around field',
                        severity: 'High',
                        image: '🦟 Spread by leafhoppers'
                    },
                    'holes leaves sawdust frass': {
                        diagnosis: 'Fall Armyworm',
                        confidence: 0.90,
                        treatment: '1. Hand-pick larvae early morning\n2. Apply neem extract (50g neem in 1L water)\n3. Use Emamectin benzoate if severe',
                        prevention: '1. Early planting (Nov-Dec)\n2. Crop rotation with legumes\n3. Use pheromone traps',
                        severity: 'High',
                        image: '🐛 Green/brown larvae with head capsule'
                    },
                    'gray rectangular spots leaves': {
                        diagnosis: 'Gray Leaf Spot',
                        confidence: 0.75,
                        treatment: '1. Apply fungicides with azoxystrobin\n2. Remove affected leaves\n3. Improve air circulation',
                        prevention: '1. Crop rotation (2-3 years)\n2. Plant resistant varieties\n3. Avoid overhead irrigation',
                        severity: 'Medium',
                        image: '🍂 Rectangular gray spots on leaves'
                    },
                    'white powder leaves': {
                        diagnosis: 'Powdery Mildew',
                        confidence: 0.80,
                        treatment: '1. Spray with baking soda solution (1 tbsp per liter)\n2. Apply sulfur-based fungicide\n3. Remove severely infected leaves',
                        prevention: '1. Plant in sunny locations\n2. Proper spacing for air flow\n3. Avoid excess nitrogen',
                        severity: 'Medium',
                        image: '❄️ White powdery coating on leaves'
                    }
                }
            },
            'Cassava': {
                symptoms: {
                    'yellow mosaic patterns leaves': {
                        diagnosis: 'Cassava Mosaic Disease',
                        confidence: 0.88,
                        treatment: '1. Remove and destroy infected plants\n2. Use disease-free planting material\n3. Control whitefly population',
                        prevention: '1. Plant resistant varieties\n2. Rogue infected plants early\n3. Clean farm tools',
                        severity: 'High',
                        image: '🍃 Yellow-green mosaic pattern'
                    },
                    'brown streaks stems': {
                        diagnosis: 'Cassava Brown Streak',
                        confidence: 0.82,
                        treatment: '1. No cure for infected plants\n2. Remove and burn affected plants\n3. Plant tolerant varieties',
                        prevention: '1. Use clean cuttings\n2. Plant resistant varieties\n3. Control whiteflies',
                        severity: 'High',
                        image: '🌱 Brown streaks on stems, root rot'
                    },
                    'whiteflies leaves': {
                        diagnosis: 'Whitefly Infestation',
                        confidence: 0.70,
                        treatment: '1. Spray with soapy water\n2. Use yellow sticky traps\n3. Apply neem oil spray',
                        prevention: '1. Companion planting with marigold\n2. Remove weed hosts\n3. Monitor regularly',
                        severity: 'Medium',
                        image: '🦋 Small white flying insects under leaves'
                    }
                }
            },
            'Groundnuts': {
                symptoms: {
                    'yellow mottle leaves stunted': {
                        diagnosis: 'Groundnut Rosette',
                        confidence: 0.85,
                        treatment: '1. Remove infected plants\n2. Control aphid vectors\n3. Plant early in season',
                        prevention: '1. Use resistant varieties\n2. Early planting (Nov)\n3. Aphid control',
                        severity: 'High',
                        image: '🌿 Yellow-green mottle, stunted plants'
                    },
                    'spots leaves defoliation': {
                        diagnosis: 'Leaf Spot Disease',
                        confidence: 0.75,
                        treatment: '1. Apply copper-based fungicide\n2. Remove infected leaves\n3. Improve drainage',
                        prevention: '1. Crop rotation (3+ years)\n2. Plant certified seeds\n3. Avoid overhead watering',
                        severity: 'Medium',
                        image: '🍁 Circular brown spots with yellow halo'
                    }
                }
            },
            'Beans': {
                symptoms: {
                    'spots leaves pods': {
                        diagnosis: 'Bean Anthracnose',
                        confidence: 0.80,
                        treatment: '1. Apply copper fungicide\n2. Remove infected plants\n3. Use disease-free seeds',
                        prevention: '1. 3-year crop rotation\n2. Avoid working in wet fields\n3. Plant resistant varieties',
                        severity: 'Medium',
                        image: '🫘 Dark sunken spots on pods'
                    },
                    'curled leaves aphids': {
                        diagnosis: 'Aphid Infestation',
                        confidence: 0.85,
                        treatment: '1. Spray with insecticidal soap\n2. Use neem oil spray\n3. Release ladybugs',
                        prevention: '1. Companion planting with garlic\n2. Remove weed hosts\n3. Use reflective mulch',
                        severity: 'Medium',
                        image: '🐜 Small green/black insects on new growth'
                    }
                }
            }
        };
    }

    async diagnoseWithAI(cropName, symptoms, farmerLocation = 'Malawi') {
        console.log(`\n🤖 AI Diagnosis Request:`);
        console.log(`   Crop: ${cropName}`);
        console.log(`   Symptoms: "${symptoms}"`);
        console.log(`   Location: ${farmerLocation}`);
        
        // Check if we should use AI
        if (!this.useAI) {
            console.log('   ⚠️ Using rule-based diagnosis (AI not configured)');
            return this.diagnoseWithRules(cropName, symptoms);
        }

        const prompt = this.createDiagnosisPrompt(cropName, symptoms, farmerLocation);
        
        try {
            console.log('   📡 Calling Groq AI API...');
            const startTime = Date.now();
            
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: 'llama3-8b-8192', // Fast, free model
                messages: [
                    {
                        role: 'system',
                        content: `You are Dr. Green, an agricultural extension officer in ${farmerLocation}. 
You specialize in diagnosing crop diseases for smallholder farmers. 
Provide accurate, practical, and actionable advice.
Format responses for USSD display (short lines, clear sections).
Always suggest organic solutions first before chemical options.
Be specific about dosages and timing where possible.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 600,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 second timeout
            });

            const responseTime = Date.now() - startTime;
            console.log(`   ✅ AI Response received in ${responseTime}ms`);
            
            const aiResponse = response.data.choices[0].message.content;
            const formattedResponse = this.formatAIResponseForUSSD(aiResponse, cropName);
            
            console.log(`   📏 Response length: ${formattedResponse.length} characters`);
            
            return formattedResponse;

        } catch (error) {
            console.error('❌ AI Diagnosis Error:', error.message);
            
            if (error.response) {
                console.error('   API Response:', error.response.status, error.response.data);
            }
            
            // Fall back to rules-based diagnosis
            console.log('   ↪️ Falling back to rule-based diagnosis');
            return this.diagnoseWithRules(cropName, symptoms);
        }
    }

    createDiagnosisPrompt(cropName, symptoms, location) {
        return `Diagnose this ${cropName} problem for a farmer in ${location}:

FARMER'S REPORT:
"${symptoms}"

Please provide a complete diagnosis in this EXACT format:

🌱 DIAGNOSIS:
[Name of disease/pest/problem]

📊 CONFIDENCE:
[High/Medium/Low] confidence

🩺 SYMPTOMS MATCH:
- [Symptom 1 that matches]
- [Symptom 2 that matches]

💊 IMMEDIATE TREATMENT:
1. [First step - organic preferred]
2. [Second step]
3. [Third step if needed]

⚠️ CHEMICAL OPTIONS (if severe):
• [Chemical 1] - [Dosage]
• [Chemical 2] - [Dosage]

🛡️ PREVENTION:
• [Prevention 1]
• [Prevention 2]
• [Prevention 3]

📞 WHEN TO CALL EXPERT:
[When farmer should consult extension officer]

Keep each line short (max 40 characters for USSD).
Use emojis for visual clarity.
Be specific to ${location} conditions.
Assume farmer has limited resources.`;
    }

    formatAIResponseForUSSD(aiText, cropName) {
        console.log('   ✂️ Formatting AI response for USSD...');
        
        // Clean and format the response
        let formatted = aiText
            .replace(/```[^`]*```/g, '') // Remove code blocks
            .replace(/["']/g, '')        // Remove quotes
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1')     // Remove italics
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Reduce multiple newlines
            .trim();
        
        // Ensure it starts with crop info
        if (!formatted.includes(cropName)) {
            formatted = `🔍 ${cropName} Diagnosis\n\n${formatted}`;
        }
        
        // Add footer
        formatted += '\n\n💡 For more help, contact\nyour local agriculture\nextension office.';
        
        // Truncate if too long (USSD safe)
        const maxLength = 1500; // Safe limit with pagination
        if (formatted.length > maxLength) {
            console.log(`   ⚠️ Response truncated from ${formatted.length} to ${maxLength} chars`);
            formatted = formatted.substring(0, maxLength - 3) + '...';
        }
        
        return formatted;
    }

    diagnoseWithRules(cropName, symptoms) {
        console.log(`🔍 Rule-based diagnosis for ${cropName}`);
        
        const cropRules = this.rulesDatabase[cropName];
        if (!cropRules) {
            return `No diagnosis rules for ${cropName}.\nSupported crops: Maize, Cassava,\nGroundnuts, Beans.\n\nTry: "yellow leaves" or\n"holes in leaves".`;
        }

        const symptomText = symptoms.toLowerCase();
        let matches = [];
        
        // Find all matching patterns
        for (const [pattern, diagnosis] of Object.entries(cropRules.symptoms)) {
            const keywords = pattern.split(' ');
            const keywordMatches = keywords.filter(keyword => 
                symptomText.includes(keyword)
            ).length;
            
            const matchScore = keywordMatches / keywords.length;
            
            if (matchScore > 0.3) { // 30% match threshold
                matches.push({
                    pattern,
                    diagnosis,
                    score: matchScore * diagnosis.confidence
                });
            }
        }
        
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        
        if (matches.length === 0) {
            return this.getNoMatchResponse(cropName, symptoms);
        }
        
        // Return top diagnosis
        const topMatch = matches[0];
        const confidencePercent = Math.round(topMatch.score * 100);
        
        return this.formatRuleResponse(topMatch.diagnosis, confidencePercent);
    }

    getNoMatchResponse(cropName, symptoms) {
        const suggestions = {
            'Maize': 'Try describing:\n• "yellow streaks"\n• "holes in leaves"\n• "gray spots"\n• "white powder"',
            'Cassava': 'Try describing:\n• "yellow mosaic"\n• "brown stems"\n• "whiteflies"\n• "stunted growth"',
            'Groundnuts': 'Try describing:\n• "yellow leaves"\n• "leaf spots"\n• "stunted plants"\n• "wilting"',
            'Beans': 'Try describing:\n• "leaf spots"\n• "aphids visible"\n• "pod damage"\n• "wilting"'
        };
        
        const cropSuggestions = suggestions[cropName] || 'Describe specific symptoms.';
        
        return `No clear diagnosis for\n"${symptoms.substring(0, 30)}..."\n\n🔍 Suggestions for ${cropName}:\n${cropSuggestions}\n\nOr try the interactive\nsymptoms wizard for\ndetailed diagnosis.`;
    }

    formatRuleResponse(diagnosis, confidence) {
        return `🌱 DIAGNOSIS:\n${diagnosis.diagnosis}\n\n📊 CONFIDENCE:\n${confidence}% match\n\n🩺 SEVERITY:\n${diagnosis.severity}\n\n💊 TREATMENT:\n${diagnosis.treatment}\n\n🛡️ PREVENTION:\n${diagnosis.prevention}\n\n${diagnosis.image}\n\n💡 Based on symptom matching.\nFor exact diagnosis, consult\nextension officer.`;
    }

    // Interactive diagnosis methods
    async startInteractiveDiagnosis(cropName, phoneNumber) {
        const sessionId = `ai_${Date.now()}_${phoneNumber}`;
        
        const firstQuestion = {
            sessionId: sessionId,
            crop: cropName,
            question: `What's the main symptom\nyou see on your ${cropName}?`,
            options: [
                '1. Color changes',
                '2. Spots/patches', 
                '3. Holes/damage',
                '4. Wilting/drooping',
                '5. Visible pests',
                '0. Cancel'
            ],
            step: 1,
            symptoms: []
        };
        
        console.log(`🤖 Started interactive diagnosis for ${cropName}, session: ${sessionId}`);
        return firstQuestion;
    }

    async processInteractiveAnswer(session, answerIndex) {
        if (answerIndex === 0) {
            return { canceled: true, message: 'Diagnosis canceled.' };
        }
        
        const answers = [
            'Color changes (yellow, brown, etc.)',
            'Spots or patches on leaves',
            'Holes or physical damage',
            'Wilting or drooping',
            'Visible insects/pests'
        ];
        
        const selectedSymptom = answers[answerIndex - 1];
        session.symptoms.push(selectedSymptom);
        
        if (session.step === 1) {
            // Ask follow-up based on first answer
            session.step = 2;
            
            let followUpQuestion = '';
            let options = [];
            
            switch(answerIndex) {
                case 1: // Color changes
                    followUpQuestion = 'What color changes do you see?';
                    options = [
                        '1. Yellow leaves',
                        '2. Brown spots',
                        '3. White powder',
                        '4. Black/moldy',
                        '5. Other colors',
                        '0. Back'
                    ];
                    break;
                case 2: // Spots
                    followUpQuestion = 'Describe the spots:';
                    options = [
                        '1. Small circles',
                        '2. Large patches',
                        '3. Powdery',
                        '4. Wet/oozy',
                        '5. Dry/crusty',
                        '0. Back'
                    ];
                    break;
                case 3: // Holes
                    followUpQuestion = 'How are the holes arranged?';
                    options = [
                        '1. Ragged edges',
                        '2. Clean circles',
                        '3. Along edges',
                        '4. All over',
                        '5. With sawdust',
                        '0. Back'
                    ];
                    break;
                case 4: // Wilting
                    followUpQuestion = 'When does wilting occur?';
                    options = [
                        '1. During day heat',
                        '2. All the time',
                        '3. After watering',
                        '4. Whole plant',
                        '5. Just leaves',
                        '0. Back'
                    ];
                    break;
                case 5: // Pests
                    followUpQuestion = 'What pests do you see?';
                    options = [
                        '1. Small flying',
                        '2. Caterpillars',
                        '3. Beetles',
                        '4. Whiteflies',
                        '5. Aphids',
                        '0. Back'
                    ];
                    break;
            }
            
            return {
                session: session,
                question: followUpQuestion,
                options: options,
                step: 2,
                continue: true
            };
            
        } else if (session.step === 2) {
            // We have enough info for AI diagnosis
            const symptomDescription = session.symptoms.join(', ');
            
            console.log(`🤖 Interactive diagnosis complete for ${session.crop}: ${symptomDescription}`);
            
            // Use AI for final diagnosis
            const diagnosis = await this.diagnoseWithAI(session.crop, symptomDescription);
            
            return {
                complete: true,
                diagnosis: diagnosis,
                symptoms: session.symptoms,
                sessionId: session.sessionId
            };
        }
        
        return { error: 'Invalid session step.' };
    }
}

module.exports = new AISymptomsService();