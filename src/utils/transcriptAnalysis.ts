interface TranscriptData {
  id: string;
  transcript: string;
  preview?: string;
}

interface SalesInsight {
  transcriptId: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  topics: string[];
  objections: string[];
  duration: number;
  nextSteps: string[];
}

// Basic sentiment analysis based on keyword matching
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'great', 'excellent', 'good', 'amazing', 'wonderful', 'interested',
    'perfect', 'love', 'best', 'helpful', 'yes', 'definitely', 'absolutely'
  ];
  
  const negativeWords = [
    'bad', 'poor', 'terrible', 'awful', 'expensive', 'difficult',
    'complicated', 'no', 'not', "don't", 'cant', 'wont', 'problem'
  ];

  const text_lower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text_lower.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text_lower.match(regex);
    if (matches) negativeCount += matches.length;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Extract key topics based on common business and product terms
function extractKeyTopics(text: string): string[] {
  const commonTopics = [
    { term: 'pricing', variations: ['price', 'cost', 'budget', 'expensive', 'affordable'] },
    { term: 'features', variations: ['feature', 'functionality', 'capabilities'] },
    { term: 'integration', variations: ['integrate', 'connection', 'api', 'webhook'] },
    { term: 'support', variations: ['help', 'assistance', 'documentation'] },
    { term: 'security', variations: ['secure', 'privacy', 'data protection'] },
    { term: 'implementation', variations: ['implement', 'setup', 'installation'] },
    { term: 'performance', variations: ['speed', 'fast', 'slow', 'reliable'] },
    { term: 'training', variations: ['learn', 'tutorial', 'onboarding'] }
  ];

  const text_lower = text.toLowerCase();
  const foundTopics = new Set<string>();

  commonTopics.forEach(({ term, variations }) => {
    if (variations.some(v => text_lower.includes(v))) {
      foundTopics.add(term);
    }
  });

  return Array.from(foundTopics);
}

// Identify common sales objections
function identifyObjections(text: string): string[] {
  const commonObjections = [
    { objection: 'Too expensive', patterns: ['expensive', 'costly', 'price too high', 'cost too much'] },
    { objection: 'Need more time', patterns: ['need time', 'think about it', 'not ready', 'too soon'] },
    { objection: 'Missing features', patterns: ['missing', 'lacks', 'doesn\'t have', 'need feature'] },
    { objection: 'Complex setup', patterns: ['complicated', 'complex', 'difficult to set up', 'hard to use'] },
    { objection: 'Already have solution', patterns: ['already using', 'current solution', 'existing tool'] }
  ];

  const text_lower = text.toLowerCase();
  const foundObjections = new Set<string>();

  commonObjections.forEach(({ objection, patterns }) => {
    if (patterns.some(p => text_lower.includes(p))) {
      foundObjections.add(objection);
    }
  });

  return Array.from(foundObjections);
}

// Estimate meeting duration based on transcript length and average speaking rate
function estimateDuration(text: string): number {
  const wordsPerMinute = 150; // Average speaking rate
  const wordCount = text.split(/\s+/).length;
  return Math.round(wordCount / wordsPerMinute);
}

// Extract next steps or action items
function extractNextSteps(text: string): string[] {
  const nextStepPatterns = [
    'follow up',
    'next step',
    'action item',
    'will send',
    'schedule',
    'meeting',
    'demo',
    'call'
  ];

  const sentences = text.split(/[.!?]+/);
  const actionItems = sentences.filter(sentence =>
    nextStepPatterns.some(pattern => 
      sentence.toLowerCase().includes(pattern)
    )
  );

  return actionItems.map(item => item.trim());
}

export function analyzeTranscript(data: TranscriptData): SalesInsight {
  if (!data?.transcript) {
    return {
      transcriptId: data.id,
      sentiment: 'neutral',
      sentimentScore: 0.5,
      topics: [],
      objections: [],
      duration: 0,
      nextSteps: [],
    };
  }

  const text = data.transcript.toLowerCase();
  
  // Basic sentiment analysis
  const positiveWords = ['great', 'good', 'excellent', 'yes', 'interested', 'perfect', 'awesome'];
  const negativeWords = ['no', 'not', "don't", 'expensive', 'difficult', 'bad', 'problem'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const matches = text.match(new RegExp(word, 'g'));
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const matches = text.match(new RegExp(word, 'g'));
    if (matches) negativeCount += matches.length;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  const sentimentScore = totalSentimentWords > 0 
    ? positiveCount / totalSentimentWords 
    : 0.5;
  
  const sentiment = sentimentScore > 0.6 
    ? 'positive' 
    : sentimentScore < 0.4 
    ? 'negative' 
    : 'neutral';

  // Extract topics (simplified)
  const topicKeywords = {
    'pricing': ['price', 'cost', 'budget', 'expensive', 'cheap'],
    'features': ['feature', 'functionality', 'capability', 'able to'],
    'integration': ['integrate', 'connection', 'api', 'sync'],
    'support': ['support', 'help', 'assistance', 'team'],
    'security': ['security', 'privacy', 'protection', 'secure'],
  };

  const topics = Object.entries(topicKeywords)
    .filter(([topic, keywords]) => 
      keywords.some(keyword => text.includes(keyword))
    )
    .map(([topic]) => topic);

  // Extract objections (simplified)
  const objectionPatterns = [
    'too expensive',
    'not sure',
    "don't need",
    'already have',
    'need to think',
    'budget',
    'competitor',
  ];

  const objections = objectionPatterns
    .filter(pattern => text.includes(pattern))
    .map(objection => objection.charAt(0).toUpperCase() + objection.slice(1));

  // Estimate duration (very simplified)
  const wordCount = text.split(/\s+/).length;
  const estimatedDuration = Math.round(wordCount / 150); // Assuming ~150 words per minute

  // Extract next steps
  const nextStepPatterns = [
    'follow up',
    'schedule',
    'send',
    'review',
    'discuss',
    'meet',
    'call',
  ];

  const nextSteps = nextStepPatterns
    .filter(pattern => text.includes(pattern))
    .map(step => {
      const sentence = text.split(/[.!?]+/).find(s => s.includes(step)) || '';
      return sentence.trim().charAt(0).toUpperCase() + sentence.trim().slice(1);
    })
    .filter(step => step.length > 0);

  return {
    transcriptId: data.id,
    sentiment,
    sentimentScore,
    topics,
    objections,
    duration: Math.max(1, estimatedDuration), // Minimum 1 minute
    nextSteps,
  };
}
