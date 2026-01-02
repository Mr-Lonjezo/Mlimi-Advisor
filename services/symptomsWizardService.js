// services/symptomsWizardService.js - Updated with AI
const aiSymptomsService = require('./aiSymptomsService');

class SymptomsWizardService {
    constructor() {
        this.symptomTrees = {
            'Maize': {
                questions: [
                    {
                        id: 1,
                        question: 'What do you see on the leaves?',
                        options: [
                            { id: 'A', text: 'Holes or ragged edges', next: 2 },
                            { id: 'B', text: 'Yellow streaks or stripes', next: 3 },
                            { id: 'C', text: 'Gray or brown spots', next: 4 }
                        ]
                    },
                    {
                        id: 2,
                        question: 'Is there sawdust-like material?',
                        options: [
                            { id: 'A', text: 'Yes, near the whorl', result: 'Fall Armyworm' },
                            { id: 'B', text: 'No, just holes', result: 'Cutworms' }
                        ]
                    },
                    {
                        id: 3,
                        question: 'Are streaks parallel to veins?',
                        options: [
                            { id: 'A', text: 'Yes, parallel', result: 'Maize Streak Virus' },
                            { id: 'B', text: 'No, random', result: 'Nutrient Deficiency' }
                        ]
                    }
                ],
                diagnoses: {
                    'Fall Armyworm': {
                        severity: 'High',
                        symptoms: 'Holes in leaves, sawdust-like frass',
                        treatment: {
                            organic: 'Apply neem extract. Hand-pick larvae.',
                            chemical: 'Use Emamectin benzoate.'
                        },
                        prevention: 'Early planting, crop rotation.'
                    },
                    'Maize Streak Virus': {
                        severity: 'Medium',
                        symptoms: 'Yellow streaks parallel to veins',
                        treatment: {
                            organic: 'Remove infected plants.',
                            chemical: 'Control leafhoppers.'
                        },
                        prevention: 'Plant resistant varieties.'
                    }
                }
            },
            'Cassava': {
                questions: [
                    {
                        id: 1,
                        question: 'What do you see on leaves?',
                        options: [
                            { id: 'A', text: 'Yellow mosaic patterns', result: 'Cassava Mosaic' },
                            { id: 'B', text: 'Brown streaks on stems', result: 'Brown Streak' }
                        ]
                    }
                ],
                diagnoses: {
                    'Cassava Mosaic': {
                        severity: 'High',
                        symptoms: 'Yellow mosaic patterns, distorted leaves',
                        treatment: {
                            organic: 'Use disease-free cuttings.'
                        },
                        prevention: 'Plant resistant varieties.'
                    }
                }
            }
        };
        
        console.log('✅ Symptoms Wizard Service initialized');
    }

    startDiagnosis(cropName) {
        const cropTree = this.symptomTrees[cropName];
        if (!cropTree) {
            return {
                error: `No wizard for ${cropName}. Try maize or cassava.`
            };
        }

        const firstQuestion = cropTree.questions.find(q => q.id === 1);
        if (!firstQuestion) {
            return { error: 'Wizard not configured.' };
        }

        return {
            crop: cropName,
            currentQuestion: firstQuestion,
            sessionId: Date.now().toString(),
            progress: '1/' + cropTree.questions.length
        };
    }

    processAnswer(session, answerId) {
        const cropTree = this.symptomTrees[session.crop];
        if (!cropTree) return { error: 'Invalid session.' };

        const currentQuestion = cropTree.questions.find(q => q.id === session.currentQuestion.id);
        if (!currentQuestion) return { error: 'Question not found.' };

        const selectedOption = currentQuestion.options.find(opt => opt.id === answerId);
        if (!selectedOption) return { error: 'Invalid answer.' };

        if (selectedOption.result) {
            const diagnosis = cropTree.diagnoses[selectedOption.result];
            return {
                complete: true,
                diagnosis: selectedOption.result,
                details: diagnosis,
                recommendation: this.formatRecommendation(diagnosis, selectedOption.result)
            };
        } else if (selectedOption.next) {
            const nextQuestion = cropTree.questions.find(q => q.id === selectedOption.next);
            if (!nextQuestion) return { error: 'Next question not found.' };

            const totalQuestions = cropTree.questions.length;
            const currentIndex = cropTree.questions.findIndex(q => q.id === nextQuestion.id);
            const progress = `${currentIndex + 1}/${totalQuestions}`;

            return {
                complete: false,
                nextQuestion: nextQuestion,
                progress: progress
            };
        }

        return { error: 'Configuration error.' };
    }

    formatRecommendation(diagnosis, diseaseName) {
        return `Diagnosis: ${diseaseName}\nSeverity: ${diagnosis.severity}\n\n💊 Treatment:\n${diagnosis.treatment.organic || ''}\n${diagnosis.treatment.chemical || ''}\n\n🛡️ Prevention:\n${diagnosis.prevention}\n\n⚠️ Consult officer if unsure.`;
    }

    // AI-Powered quick diagnosis
    quickDiagnosis(cropName, symptoms) {
        console.log(`🔍 Quick diagnosis for ${cropName}`);
        return aiSymptomsService.diagnoseWithAI(cropName, symptoms, 'Malawi');
    }
}

module.exports = new SymptomsWizardService();