'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface DebateTopic {
  id: string;
  topic: string;
  topic_el: string;
  category: string;
  complexity: string;
  affirmative_points?: string[];
  negative_points?: string[];
}

interface Message {
  role: 'user' | 'ai' | 'system';
  content: string;
  score?: number;
  feedback?: string;
}

interface NewBadge {
  id: string;
  name: string;
  name_el: string;
  icon: string;
  description_el?: string;
}

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type Side = 'affirmative' | 'negative';

// ============================================
// CONSTANTS
// ============================================

const difficulties: { id: Difficulty; label: string; description: string }[] = [
  { id: 'beginner', label: 'Αρχάριο', description: 'Ο AI είναι πιο επιεικής' },
  { id: 'intermediate', label: 'Μέτριο', description: 'Ισορροπημένη πρόκληση' },
  { id: 'advanced', label: 'Προχωρημένο', description: 'Ο AI είναι πιο απαιτητικός' },
  { id: 'expert', label: 'Expert', description: 'Μέγιστη πρόκληση' },
];

const fallbackTopics: DebateTopic[] = [
  { id: '1', topic: 'Schools should require uniforms', topic_el: 'Τα σχολεία πρέπει να απαιτούν στολές', category: 'school_life', complexity: 'simple' },
  { id: '2', topic: 'Homework should be banned', topic_el: 'Η εργασία για το σπίτι πρέπει να καταργηθεί', category: 'school_life', complexity: 'simple' },
  { id: '3', topic: 'Social media minimum age should be 16', topic_el: 'Το ελάχιστο όριο ηλικίας για τα social media πρέπει να είναι 16', category: 'technology', complexity: 'moderate' },
  { id: '4', topic: 'Video games are bad for children', topic_el: 'Τα βιντεοπαιχνίδια είναι κακά για τα παιδιά', category: 'technology', complexity: 'simple' },
];

// ============================================
// BADGE CELEBRATION
// ============================================

function BadgeCelebration({ badges, onClose }: { badges: NewBadge[]; onClose: () => void }) {
  if (badges.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
      >
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Νέο Badge!</h2>
        <div className="space-y-3 mb-6">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-orange-50 rounded-xl p-4">
              <span className="text-4xl">{badge.icon}</span>
              <p className="font-semibold text-orange-700 mt-2">{badge.name_el || badge.name}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600">
          Τέλεια! 🚀
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function DebatePage() {
  // State
  const [view, setView] = useState<'setup' | 'debate' | 'result'>('setup');
  const [topics, setTopics] = useState<DebateTopic[]>(fallbackTopics);
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [userSide, setUserSide] = useState<Side>('affirmative');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(3);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);
  const [debateStats, setDebateStats] = useState({ total: 0, wins: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch topics from database
  useEffect(() => {
    fetchTopics();
    fetchStats();
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/debate/topics');
      if (response.ok) {
        const data = await response.json();
        if (data.topics?.length > 0) {
          setTopics(data.topics);
        }
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/progress?feature=debate');
      if (response.ok) {
        const data = await response.json();
        const completed = data.progress?.filter((p: any) => p.completed) || [];
        const wins = completed.filter((p: any) => p.metadata?.winner === 'user').length;
        setDebateStats({ total: completed.length, wins });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const startDebate = async () => {
    const topic = selectedTopic?.topic_el || customTopic;
    if (!topic) return;

    setView('debate');
    setMessages([
      {
        role: 'system',
        content: `Θέμα: "${topic}"\nΕσύ υποστηρίζεις: ${userSide === 'affirmative' ? 'ΥΠΕΡ ✅' : 'ΚΑΤΑ ❌'}\nΓύροι: ${totalRounds}\n\nΞεκίνα με το πρώτο σου επιχείρημα!`
      }
    ]);
    setCurrentRound(1);
    setUserScore(0);
    setAiScore(0);
  };

  const submitArgument = async () => {
    if (!userInput.trim() || loading) return;

    const userArgument = userInput.trim();
    setUserInput('');
    setLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userArgument }]);

    try {
      const response = await fetch('/api/debate/ai-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic?.topic_el || customTopic,
          userSide,
          difficulty,
          userArgument,
          round: currentRound,
          totalRounds,
          previousMessages: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update scores
        setUserScore(prev => prev + (data.userScore || 0));
        setAiScore(prev => prev + (data.aiScore || 0));

        // Add AI response
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: data.aiArgument,
            score: data.userScore,
            feedback: data.feedback
          }
        ]);

        // Check if debate is over
        if (currentRound >= totalRounds) {
          await completeDebate(data.userScore || 0);
        } else {
          setCurrentRound(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Σφάλμα επικοινωνίας. Δοκίμασε ξανά.' }]);
    } finally {
      setLoading(false);
    }
  };

  const completeDebate = async (lastScore: number) => {
    const finalUserScore = userScore + lastScore;
    const winner = finalUserScore > aiScore ? 'user' : finalUserScore < aiScore ? 'ai' : 'tie';
    
    setView('result');

    // Save progress
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'debate',
          activity_type: 'ai_debate',
          activity_id: selectedTopic?.id || 'custom',
          score: finalUserScore,
          completed: true,
          metadata: {
            topic: selectedTopic?.topic_el || customTopic,
            difficulty,
            userSide,
            userScore: finalUserScore,
            aiScore,
            winner,
            rounds: totalRounds
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.newBadges?.length > 0) {
          setNewBadges(data.newBadges);
        }
        // Update stats
        setDebateStats(prev => ({
          total: prev.total + 1,
          wins: winner === 'user' ? prev.wins + 1 : prev.wins
        }));
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const resetDebate = () => {
    setView('setup');
    setMessages([]);
    setCurrentRound(1);
    setUserScore(0);
    setAiScore(0);
    setUserInput('');
    setSelectedTopic(null);
    setCustomTopic('');
  };

  // ============================================
  // RENDER: SETUP VIEW
  // ============================================
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎭 Debate Platform</h1>
            <p className="text-gray-600">Εξάσκησε τα επιχειρήματά σου εναντίον AI</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-orange-600">{debateStats.total}</p>
              <p className="text-sm text-gray-500">Debates</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-green-600">{debateStats.wins}</p>
              <p className="text-sm text-gray-500">Νίκες</p>
            </div>
          </div>

          {/* Topic Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Επέλεξε Θέμα</h2>
            <div className="grid gap-3 mb-4">
              {topics.slice(0, 6).map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setCustomTopic('');
                  }}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedTopic?.id === topic.id
                      ? 'bg-orange-100 ring-2 ring-orange-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-800">{topic.topic_el}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {topic.complexity === 'simple' ? '🟢 Απλό' : topic.complexity === 'moderate' ? '🟡 Μέτριο' : '🔴 Σύνθετο'}
                  </p>
                </button>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Ή γράψε το δικό σου θέμα:</p>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setSelectedTopic(null);
                }}
                placeholder="π.χ. Τα κινητά πρέπει να απαγορεύονται στο σχολείο"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Side Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Επέλεξε Πλευρά</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setUserSide('affirmative')}
                className={`p-4 rounded-xl text-center transition-all ${
                  userSide === 'affirmative'
                    ? 'bg-green-100 ring-2 ring-green-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-3xl">✅</span>
                <p className="font-medium text-gray-800 mt-2">ΥΠΕΡ</p>
                <p className="text-xs text-gray-500">Υποστηρίζεις τη θέση</p>
              </button>
              <button
                onClick={() => setUserSide('negative')}
                className={`p-4 rounded-xl text-center transition-all ${
                  userSide === 'negative'
                    ? 'bg-red-100 ring-2 ring-red-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-3xl">❌</span>
                <p className="font-medium text-gray-800 mt-2">ΚΑΤΑ</p>
                <p className="text-xs text-gray-500">Αντιτίθεσαι στη θέση</p>
              </button>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Επέλεξε Δυσκολία</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {difficulties.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    difficulty === d.id
                      ? 'bg-orange-100 ring-2 ring-orange-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-800">{d.label}</p>
                  <p className="text-xs text-gray-500">{d.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startDebate}
            disabled={!selectedTopic && !customTopic}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all ${
              selectedTopic || customTopic
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            🎭 Ξεκίνα το Debate!
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: DEBATE VIEW
  // ============================================
  if (view === 'debate') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="container mx-auto max-w-4xl flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Γύρος {currentRound}/{totalRounds}</p>
              <p className="font-medium text-gray-800 truncate max-w-xs">
                {selectedTopic?.topic_el || customTopic}
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Εσύ</p>
                <p className="text-xl font-bold text-green-600">{userScore}</p>
              </div>
              <div className="text-gray-300">vs</div>
              <div>
                <p className="text-xs text-gray-500">AI</p>
                <p className="text-xl font-bold text-red-600">{aiScore}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' :
                  msg.role === 'system' ? 'justify-center' : 'justify-start'
                }`}
              >
                {msg.role === 'system' ? (
                  <div className="bg-gray-100 text-gray-600 p-4 rounded-xl text-center max-w-md">
                    <pre className="whitespace-pre-wrap text-sm">{msg.content}</pre>
                  </div>
                ) : (
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.feedback && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-xl text-sm">
                        <p className="font-medium text-blue-800">📝 Feedback:</p>
                        <p className="text-blue-700">{msg.feedback}</p>
                        {msg.score !== undefined && (
                          <p className="text-blue-600 mt-1">Πόντοι: +{msg.score}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white border p-4 rounded-2xl shadow-sm">
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    🤔 Ο AI σκέφτεται...
                  </motion.span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex gap-2">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitArgument();
                  }
                }}
                placeholder={currentRound <= totalRounds ? "Γράψε το επιχείρημά σου..." : "Το debate τελείωσε!"}
                disabled={loading || currentRound > totalRounds}
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={2}
              />
              <button
                onClick={submitArgument}
                disabled={loading || !userInput.trim() || currentRound > totalRounds}
                className={`px-6 rounded-xl font-medium ${
                  loading || !userInput.trim() || currentRound > totalRounds
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {loading ? '...' : 'Στείλε'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: RESULT VIEW
  // ============================================
  if (view === 'result') {
    const winner = userScore > aiScore ? 'user' : userScore < aiScore ? 'ai' : 'tie';
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <BadgeCelebration badges={newBadges} onClose={() => setNewBadges([])} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
        >
          <div className="text-6xl mb-4">
            {winner === 'user' ? '🏆' : winner === 'ai' ? '🤖' : '🤝'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {winner === 'user' ? 'Νίκησες!' : winner === 'ai' ? 'Νίκησε ο AI' : 'Ισοπαλία!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {winner === 'user' 
              ? 'Εξαιρετική επιχειρηματολογία!' 
              : winner === 'ai'
              ? 'Καλή προσπάθεια! Συνέχισε την εξάσκηση.'
              : 'Ήταν μια αμφίρροπη μάχη!'}
          </p>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${winner === 'user' ? 'bg-green-100' : 'bg-gray-100'}`}>
              <p className="text-3xl font-bold text-green-600">{userScore}</p>
              <p className="text-sm text-gray-500">Οι πόντοι σου</p>
            </div>
            <div className={`p-4 rounded-xl ${winner === 'ai' ? 'bg-red-100' : 'bg-gray-100'}`}>
              <p className="text-3xl font-bold text-red-600">{aiScore}</p>
              <p className="text-sm text-gray-500">Πόντοι AI</p>
            </div>
          </div>

          {/* Stats Update */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-purple-600">
              📊 Συνολικά debates: {debateStats.total} | Νίκες: {debateStats.wins}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={resetDebate}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600"
            >
              🎭 Νέο Debate
            </button>
            <Link
              href="/student"
              className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200"
            >
              Επιστροφή
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
