'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AIDebateConfig {
  difficulty: AIDifficulty;
  topic: string;
  topicEl: string;
  userSide: 'affirmative' | 'negative';
  backgroundInfo?: string;
  backgroundInfoEl?: string;
  rounds: number;
  timePerRound?: number; // seconds, optional timer
}

export interface DebateMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  round: number;
  type: 'opening' | 'argument' | 'rebuttal' | 'closing';
  feedback?: AIFeedback;
  timestamp: Date;
}

export interface AIFeedback {
  overallScore: number; // 1-10
  strengths: string[];
  improvements: string[];
  tip?: string;
}

export interface AIDebateResult {
  winner: 'user' | 'ai' | 'tie';
  userScore: number;
  aiScore: number;
  summary: string;
  summaryEl: string;
  skillsImproved: string[];
  badges?: string[];
}

// ============================================
// DIFFICULTY CONFIGURATIONS
// ============================================

const DIFFICULTY_CONFIG: Record<AIDifficulty, {
  name: string;
  nameEl: string;
  description: string;
  descriptionEl: string;
  icon: string;
  color: string;
  systemPrompt: string;
  winRate: string; // Expected user win rate
}> = {
  easy: {
    name: 'Beginner',
    nameEl: 'Αρχάριο',
    description: 'AI makes simple arguments with some logical gaps',
    descriptionEl: 'Η AI κάνει απλά επιχειρήματα με κάποια λογικά κενά',
    icon: '🌱',
    color: 'from-green-400 to-green-600',
    systemPrompt: `You are a beginner-level debate opponent for a Greek student. 
    - Make simple, straightforward arguments
    - Occasionally include minor logical fallacies that a student could identify
    - Use basic vocabulary
    - Be encouraging even in opposition
    - Sometimes miss obvious counterpoints
    - Your arguments should be about 60-80 words`,
    winRate: '70-80%'
  },
  medium: {
    name: 'Intermediate',
    nameEl: 'Μεσαίο',
    description: 'AI provides solid arguments with room for counterpoints',
    descriptionEl: 'Η AI δίνει σοβαρά επιχειρήματα με χώρο για αντεπιχειρήματα',
    icon: '🌿',
    color: 'from-yellow-400 to-orange-500',
    systemPrompt: `You are an intermediate-level debate opponent for a Greek student.
    - Make well-structured arguments with clear reasoning
    - Provide evidence and examples
    - Leave some openings for counterarguments
    - Challenge the student's points respectfully
    - Your arguments should be about 80-120 words
    - Occasionally acknowledge valid points from the opponent`,
    winRate: '50-60%'
  },
  hard: {
    name: 'Advanced',
    nameEl: 'Προχωρημένο',
    description: 'AI uses strong logic and anticipates counterarguments',
    descriptionEl: 'Η AI χρησιμοποιεί ισχυρή λογική και προβλέπει αντεπιχειρήματα',
    icon: '🌳',
    color: 'from-orange-500 to-red-500',
    systemPrompt: `You are an advanced debate opponent for a Greek student.
    - Present sophisticated, well-researched arguments
    - Anticipate and preemptively address counterarguments
    - Use rhetorical techniques effectively
    - Challenge logical weaknesses in opponent's arguments
    - Your arguments should be about 120-150 words
    - Maintain respectful but firm opposition`,
    winRate: '30-40%'
  },
  expert: {
    name: 'Expert',
    nameEl: 'Ειδικός',
    description: 'Championship-level AI that pushes your limits',
    descriptionEl: 'AI επιπέδου πρωταθλήματος που σε ωθεί στα όριά σου',
    icon: '🏆',
    color: 'from-red-500 to-purple-600',
    systemPrompt: `You are an expert-level debate opponent, simulating a championship debater.
    - Present compelling, nuanced arguments with multiple layers
    - Use advanced rhetorical techniques and logical frameworks
    - Identify and exploit any weaknesses in opponent's reasoning
    - Reference real-world examples and data
    - Your arguments should be about 150-200 words
    - Push the student to their best performance
    - Never be condescending, but be genuinely challenging`,
    winRate: '15-25%'
  }
};

// ============================================
// DIFFICULTY SELECTOR COMPONENT
// ============================================

interface DifficultySelectorProps {
  selected: AIDifficulty;
  onSelect: (difficulty: AIDifficulty) => void;
  locale?: 'en' | 'el';
}

export function DifficultySelector({ selected, onSelect, locale = 'el' }: DifficultySelectorProps) {
  const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard', 'expert'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {difficulties.map((diff) => {
        const config = DIFFICULTY_CONFIG[diff];
        const isSelected = selected === diff;

        return (
          <button
            key={diff}
            onClick={() => onSelect(diff)}
            className={`
              relative p-4 rounded-2xl border-2 transition-all duration-300
              ${isSelected 
                ? `border-transparent bg-gradient-to-br ${config.color} text-white shadow-lg scale-[1.02]`
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            <div className="text-3xl mb-2">{config.icon}</div>
            <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
              {locale === 'el' ? config.nameEl : config.name}
            </h3>
            <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
              {locale === 'el' ? config.descriptionEl : config.description}
            </p>
            <div className={`text-xs mt-2 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
              {locale === 'el' ? 'Νίκη:' : 'Win:'} {config.winRate}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// AI DEBATE SETUP COMPONENT
// ============================================

interface AIDebateSetupProps {
  topics: Array<{ id: string; topic: string; topicEl: string; category: string; backgroundInfo?: string; backgroundInfoEl?: string }>;
  onStart: (config: AIDebateConfig) => void;
  locale?: 'en' | 'el';
}

export function AIDebateSetup({ topics, onStart, locale = 'el' }: AIDebateSetupProps) {
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [selectedTopic, setSelectedTopic] = useState<typeof topics[0] | null>(null);
  const [userSide, setUserSide] = useState<'affirmative' | 'negative'>('affirmative');
  const [rounds, setRounds] = useState(3);

  const handleStart = () => {
    if (!selectedTopic) return;

    onStart({
      difficulty,
      topic: selectedTopic.topic,
      topicEl: selectedTopic.topicEl,
      userSide,
      backgroundInfo: selectedTopic.backgroundInfo,
      backgroundInfoEl: selectedTopic.backgroundInfoEl,
      rounds
    });
  };

  const labels = {
    title: locale === 'el' ? 'Debate με AI' : 'AI Debate',
    subtitle: locale === 'el' ? 'Εξάσκησε τα επιχειρήματά σου με τεχνητή νοημοσύνη' : 'Practice your arguments with AI',
    selectDifficulty: locale === 'el' ? 'Επίλεξε Δυσκολία' : 'Select Difficulty',
    selectTopic: locale === 'el' ? 'Επίλεξε Θέμα' : 'Select Topic',
    chooseSide: locale === 'el' ? 'Επίλεξε Πλευρά' : 'Choose Side',
    affirmative: locale === 'el' ? 'Υπέρ' : 'Affirmative',
    negative: locale === 'el' ? 'Κατά' : 'Negative',
    rounds: locale === 'el' ? 'Γύροι' : 'Rounds',
    startDebate: locale === 'el' ? 'Ξεκίνα το Debate!' : 'Start Debate!',
    searchTopics: locale === 'el' ? 'Αναζήτηση θέματος...' : 'Search topics...'
  };

  const [searchQuery, setSearchQuery] = useState('');
  const filteredTopics = topics.filter(t => 
    t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.topicEl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 {labels.title}</h1>
        <p className="text-gray-600">{labels.subtitle}</p>
      </div>

      {/* Difficulty Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{labels.selectDifficulty}</h2>
        <DifficultySelector selected={difficulty} onSelect={setDifficulty} locale={locale} />
      </div>

      {/* Topic Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{labels.selectTopic}</h2>
        <input
          type="text"
          placeholder={labels.searchTopics}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div className="grid gap-3 max-h-64 overflow-y-auto">
          {filteredTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className={`
                p-4 rounded-xl text-left transition-all
                ${selectedTopic?.id === topic.id
                  ? 'bg-purple-100 border-2 border-purple-500'
                  : 'bg-white border border-gray-200 hover:border-purple-300'
                }
              `}
            >
              <p className="font-medium text-gray-800">
                {locale === 'el' ? topic.topicEl : topic.topic}
              </p>
              <span className="text-xs text-gray-500 mt-1 inline-block px-2 py-1 bg-gray-100 rounded-full">
                {topic.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Side Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{labels.chooseSide}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setUserSide('affirmative')}
            className={`
              flex-1 p-4 rounded-xl font-medium transition-all
              ${userSide === 'affirmative'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300'
              }
            `}
          >
            👍 {labels.affirmative}
          </button>
          <button
            onClick={() => setUserSide('negative')}
            className={`
              flex-1 p-4 rounded-xl font-medium transition-all
              ${userSide === 'negative'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-red-300'
              }
            `}
          >
            👎 {labels.negative}
          </button>
        </div>
      </div>

      {/* Rounds Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{labels.rounds}</h2>
        <div className="flex gap-3">
          {[2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRounds(r)}
              className={`
                w-14 h-14 rounded-xl font-bold transition-all
                ${rounds === r
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300'
                }
              `}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!selectedTopic}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all
          ${selectedTopic
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        🎤 {labels.startDebate}
      </button>
    </div>
  );
}

// ============================================
// AI DEBATE ARENA COMPONENT
// ============================================

interface AIDebateArenaProps {
  config: AIDebateConfig;
  onComplete: (result: AIDebateResult) => void;
  onExit: () => void;
  locale?: 'en' | 'el';
}

export function AIDebateArena({ config, onComplete, onExit, locale = 'el' }: AIDebateArenaProps) {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(config.userSide === 'affirmative');
  const [debateEnded, setDebateEnded] = useState(false);
  const [result, setResult] = useState<AIDebateResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const difficultyConfig = DIFFICULTY_CONFIG[config.difficulty];

  const labels = {
    round: locale === 'el' ? 'Γύρος' : 'Round',
    yourTurn: locale === 'el' ? 'Η σειρά σου!' : 'Your turn!',
    aiThinking: locale === 'el' ? 'Η AI σκέφτεται...' : 'AI is thinking...',
    submit: locale === 'el' ? 'Υποβολή' : 'Submit',
    placeholder: locale === 'el' ? 'Γράψε το επιχείρημά σου...' : 'Write your argument...',
    you: locale === 'el' ? 'Εσύ' : 'You',
    ai: locale === 'el' ? 'AI Αντίπαλος' : 'AI Opponent',
    exit: locale === 'el' ? 'Έξοδος' : 'Exit',
    affirmative: locale === 'el' ? 'Υπέρ' : 'Affirmative',
    negative: locale === 'el' ? 'Κατά' : 'Negative'
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If AI goes first (user is negative), trigger AI response
  useEffect(() => {
    if (config.userSide === 'negative' && messages.length === 0) {
      generateAIResponse('opening');
    }
  }, []);

  const getArgumentType = (round: number, isOpening: boolean): DebateMessage['type'] => {
    if (isOpening && round === 1) return 'opening';
    if (round === config.rounds) return 'closing';
    return round === 1 ? 'argument' : 'rebuttal';
  };

  const generateAIResponse = async (type: DebateMessage['type']) => {
    setIsAIThinking(true);

    try {
      const response = await fetch('/api/ai-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages,
          currentRound,
          argumentType: type,
          difficulty: config.difficulty
        })
      });

      const data = await response.json();

      const aiMessage: DebateMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: data.argument,
        round: currentRound,
        type,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsUserTurn(true);

      // Check if debate should end
      if (type === 'closing' && config.userSide === 'affirmative') {
        // AI just did closing, debate ends
        await endDebate([...messages, aiMessage]);
      }
    } catch (error) {
      console.error('AI response error:', error);
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleUserSubmit = async () => {
    if (!userInput.trim() || isAIThinking) return;

    const type = getArgumentType(currentRound, messages.filter(m => m.role === 'user').length === 0);

    // Get AI feedback on user's argument
    let feedback: AIFeedback | undefined;
    try {
      const feedbackRes = await fetch('/api/ai-debate/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          argument: userInput,
          difficulty: config.difficulty,
          topic: config.topicEl || config.topic
        })
      });
      const feedbackData = await feedbackRes.json();
      feedback = feedbackData.feedback;
    } catch (e) {
      console.error('Feedback error:', e);
    }

    const userMessage: DebateMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      round: currentRound,
      type,
      feedback,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsUserTurn(false);

    // Check if this was user's closing statement
    if (type === 'closing' && config.userSide === 'negative') {
      await endDebate([...messages, userMessage]);
      return;
    }

    // Advance round if both have spoken
    const newMessages = [...messages, userMessage];
    const userMessagesInRound = newMessages.filter(m => m.role === 'user' && m.round === currentRound).length;
    const aiMessagesInRound = newMessages.filter(m => m.role === 'ai' && m.round === currentRound).length;

    if (userMessagesInRound > 0 && aiMessagesInRound > 0) {
      if (currentRound < config.rounds) {
        setCurrentRound(prev => prev + 1);
      }
    }

    // Generate AI response
    const aiType = getArgumentType(
      currentRound + (userMessagesInRound > aiMessagesInRound ? 0 : 1),
      newMessages.filter(m => m.role === 'ai').length === 0
    );
    await generateAIResponse(aiType);
  };

  const endDebate = async (finalMessages: DebateMessage[]) => {
    setDebateEnded(true);

    try {
      const response = await fetch('/api/ai-debate/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages: finalMessages,
          difficulty: config.difficulty
        })
      });

      const data = await response.json();
      setResult(data.result);
      onComplete(data.result);
    } catch (error) {
      console.error('Evaluation error:', error);
    }
  };

  // Render result screen
  if (debateEnded && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="text-6xl mb-4">
            {result.winner === 'user' ? '🏆' : result.winner === 'tie' ? '🤝' : '💪'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {result.winner === 'user' 
              ? (locale === 'el' ? 'Νίκησες!' : 'You Won!')
              : result.winner === 'tie'
              ? (locale === 'el' ? 'Ισοπαλία!' : 'It\'s a Tie!')
              : (locale === 'el' ? 'Η AI Κέρδισε' : 'AI Won')
            }
          </h2>
          
          <div className="flex justify-center gap-8 my-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{result.userScore}/10</p>
              <p className="text-sm text-gray-500">{labels.you}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">{result.aiScore}/10</p>
              <p className="text-sm text-gray-500">{labels.ai}</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            {locale === 'el' ? result.summaryEl : result.summary}
          </p>

          {result.skillsImproved.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {locale === 'el' ? 'Δεξιότητες που βελτιώθηκαν:' : 'Skills improved:'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {result.skillsImproved.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onExit}
            className="bg-purple-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors"
          >
            {locale === 'el' ? 'Συνέχεια' : 'Continue'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-t-2xl p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">
            {locale === 'el' ? config.topicEl : config.topic}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${difficultyConfig.color} text-white`}>
              {difficultyConfig.icon} {locale === 'el' ? difficultyConfig.nameEl : difficultyConfig.name}
            </span>
            <span className="text-xs text-gray-500">
              {labels.round} {currentRound}/{config.rounds}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              config.userSide === 'affirmative' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {config.userSide === 'affirmative' ? labels.affirmative : labels.negative}
            </span>
          </div>
        </div>
        <button
          onClick={onExit}
          className="text-gray-400 hover:text-gray-600 px-3 py-1"
        >
          {labels.exit}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`
                  p-4 rounded-2xl
                  ${message.role === 'user' 
                    ? 'bg-purple-500 text-white rounded-br-md' 
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                  }
                `}>
                  <div className="text-xs opacity-70 mb-1">
                    {message.role === 'user' ? labels.you : labels.ai} • {message.type}
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Feedback for user messages */}
                {message.feedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600 font-medium">💡 Feedback</span>
                      <span className="text-yellow-700 font-bold">{message.feedback.overallScore}/10</span>
                    </div>
                    {message.feedback.strengths.length > 0 && (
                      <p className="text-green-700 text-xs">✓ {message.feedback.strengths[0]}</p>
                    )}
                    {message.feedback.improvements.length > 0 && (
                      <p className="text-orange-700 text-xs mt-1">→ {message.feedback.improvements[0]}</p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI thinking indicator */}
        {isAIThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm text-gray-500">{labels.aiThinking}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white rounded-b-2xl p-4 border-t">
        {isUserTurn && !debateEnded ? (
          <div className="flex gap-3">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={labels.placeholder}
              rows={3}
              className="flex-1 p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleUserSubmit}
              disabled={!userInput.trim()}
              className={`
                px-6 rounded-xl font-medium transition-all
                ${userInput.trim()
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {labels.submit}
            </button>
          </div>
        ) : !debateEnded ? (
          <div className="text-center text-gray-500 py-2">
            {labels.aiThinking}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AIDebateArena;
