'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Import PvP debate components
import { 
  TopicSelector, 
  FormatSelector, 
  MatchFinder, 
  DebateCard,
  WrittenDebate,
  TopicPreview,
  type DebateTopic,
  type Debate,
  type DebateArgument
} from '@/components/debate/DebateComponents';

// Import AI debate components
import {
  AIDebateSetup,
  AIDebateArena,
  DifficultySelector,
  type AIDebateConfig,
  type AIDebateResult
} from '@/components/debate/AIDebateComponents';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ViewType = 'home' | 'pvp-list' | 'pvp-find' | 'pvp-active' | 'ai-setup' | 'ai-arena';
type ModeType = 'pvp' | 'ai';

export default function DebatePage() {
  const [view, setView] = useState<ViewType>('home');
  const [mode, setMode] = useState<ModeType | null>(null);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [activeDebate, setActiveDebate] = useState<Debate | null>(null);
  const [debateArguments, setDebateArguments] = useState<DebateArgument[]>([]);
  const [aiConfig, setAIConfig] = useState<AIDebateConfig | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState('a_gymnasiou');
  const [loading, setLoading] = useState(true);
  const [aiResults, setAIResults] = useState<AIDebateResult[]>([]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadDebates(user.id);
      }
      loadTopics();
      setLoading(false);
    };
    getUser();
  }, []);

  // Load debate topics
  const loadTopics = async () => {
    try {
      const response = await fetch('/api/debates/topics');
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  // Load user's PvP debates
  const loadDebates = async (uid: string) => {
    try {
      const response = await fetch(`/api/debates?userId=${uid}`);
      const data = await response.json();
      setDebates(data.debates || []);
    } catch (error) {
      console.error('Error loading debates:', error);
    }
  };

  // Load single debate with arguments
  const loadDebate = async (debateId: string) => {
    try {
      const debateRes = await fetch(`/api/debates?debateId=${debateId}`);
      const debateData = await debateRes.json();
      
      const argsRes = await fetch(`/api/debates/arguments?debateId=${debateId}`);
      const argsData = await argsRes.json();

      setActiveDebate(debateData.debate);
      setDebateArguments(argsData.arguments || []);
      setView('pvp-active');
    } catch (error) {
      console.error('Error loading debate:', error);
    }
  };

  // Handle AI debate start
  const handleAIDebateStart = (config: AIDebateConfig) => {
    setAIConfig(config);
    setView('ai-arena');
  };

  // Handle AI debate complete
  const handleAIDebateComplete = (result: AIDebateResult) => {
    setAIResults(prev => [...prev, result]);
    // TODO: Save result to database, check for badges
  };

  // Handle PvP match request
  const handleMatchRequest = async (params: any) => {
    if (!userId) {
      alert('Πρέπει να συνδεθείς για να βρεις αντίπαλο');
      return { matched: false, message: 'Not logged in' };
    }

    try {
      const response = await fetch('/api/debates/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          gradeLevel: gradeLevel,
          ...params
        })
      });

      const data = await response.json();
      
      if (data.matched && data.debateId) {
        loadDebates(userId);
      }
      
      return data;
    } catch (error) {
      console.error('Error requesting match:', error);
      return { matched: false, message: 'Σφάλμα. Δοκίμασε ξανά.' };
    }
  };

  // Handle PvP argument submission
  const handleSubmitArgument = async (content: string, roundNumber: number, type: DebateArgument['argumentType']) => {
    if (!userId || !activeDebate) return;

    const participant = activeDebate.participants.find(p => p.userId === userId);
    if (!participant) return;

    try {
      const response = await fetch('/api/debates/arguments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId: activeDebate.id,
          participantId: participant.id,
          roundNumber: roundNumber,
          argumentType: type,
          content: content
        })
      });

      if (!response.ok) throw new Error('Failed to submit argument');

      const argsRes = await fetch(`/api/debates/arguments?debateId=${activeDebate.id}`);
      const argsData = await argsRes.json();
      setDebateArguments(argsData.arguments || []);

      loadDebate(activeDebate.id);
    } catch (error) {
      console.error('Error submitting argument:', error);
      alert('Σφάλμα κατά την υποβολή. Δοκίμασε ξανά.');
    }
  };

  const labels = {
    title: 'Debate Platform',
    subtitle: 'Μάθε να υποστηρίζεις τις απόψεις σου με επιχειρήματα',
    chooseMode: 'Επίλεξε τρόπο παιχνιδιού',
    vsAI: 'vs AI',
    vsAIDesc: 'Εξάσκηση με τεχνητή νοημοσύνη',
    vsPlayer: 'vs Μαθητή',
    vsPlayerDesc: 'Βρες αντίπαλο για debate',
    myDebates: 'Τα Debates μου',
    findOpponent: 'Βρες Αντίπαλο',
    back: '← Πίσω'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  // AI Arena View
  if (view === 'ai-arena' && aiConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
        <AIDebateArena
          config={aiConfig}
          onComplete={handleAIDebateComplete}
          onExit={() => {
            setView('home');
            setAIConfig(null);
          }}
          locale="el"
        />
      </div>
    );
  }

  // AI Setup View
  if (view === 'ai-setup') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto p-4 max-w-4xl">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            {labels.back}
          </button>
          <AIDebateSetup
            topics={topics.map(t => ({
              id: t.id,
              topic: t.topic,
              topicEl: t.topicEl,
              category: t.category,
              backgroundInfo: t.backgroundInfo,
              backgroundInfoEl: t.backgroundInfoEl
            }))}
            onStart={handleAIDebateStart}
            locale="el"
          />
        </div>
      </div>
    );
  }

  // PvP Active Debate View
  if (view === 'pvp-active' && activeDebate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto p-4 max-w-4xl">
          <button
            onClick={() => {
              setView('pvp-list');
              setActiveDebate(null);
              setDebateArguments([]);
            }}
            className="mb-6 text-gray-600 hover:text-gray-800"
          >
            {labels.back}
          </button>
          <WrittenDebate
            debate={activeDebate}
            arguments_={debateArguments}
            currentUserId={userId || ''}
            locale="el"
            onSubmitArgument={handleSubmitArgument}
          />
        </div>
      </div>
    );
  }

  // PvP Find Opponent View
  if (view === 'pvp-find') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto p-4 max-w-4xl">
          <button
            onClick={() => setView('pvp-list')}
            className="mb-6 text-gray-600 hover:text-gray-800"
          >
            {labels.back}
          </button>
          {userId ? (
            <MatchFinder
              userId={userId}
              gradeLevel={gradeLevel}
              topics={topics}
              onMatchFound={(debateId) => loadDebate(debateId)}
              onRequestMatch={handleMatchRequest}
              locale="el"
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <p className="text-yellow-800 mb-4">
                💡 Συνδέσου για να μπορείς να συμμετέχεις σε debates!
              </p>
              <a href="/login" className="text-purple-600 font-medium hover:underline">
                Σύνδεση
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PvP List View
  if (view === 'pvp-list') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto p-4 max-w-4xl">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-gray-600 hover:text-gray-800"
          >
            {labels.back}
          </button>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-purple-500 text-white shadow-lg"
            >
              📋 {labels.myDebates}
            </button>
            <button
              onClick={() => setView('pvp-find')}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-white text-gray-600 hover:bg-gray-50"
            >
              🔍 {labels.findOpponent}
            </button>
          </div>

          {/* Debate Lists */}
          <div className="space-y-4">
            {debates.filter(d => d.status === 'in_progress').length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Σε εξέλιξη
                </h2>
                {debates.filter(d => d.status === 'in_progress').map((debate) => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    currentUserId={userId || ''}
                    locale="el"
                    onClick={() => loadDebate(debate.id)}
                  />
                ))}
              </div>
            )}

            {debates.filter(d => d.status === 'scheduled').length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">📅 Προγραμματισμένα</h2>
                {debates.filter(d => d.status === 'scheduled').map((debate) => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    currentUserId={userId || ''}
                    locale="el"
                    onClick={() => loadDebate(debate.id)}
                  />
                ))}
              </div>
            )}

            {debates.filter(d => d.status === 'completed').length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">✅ Ολοκληρωμένα</h2>
                {debates.filter(d => d.status === 'completed').map((debate) => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    currentUserId={userId || ''}
                    locale="el"
                    onClick={() => loadDebate(debate.id)}
                  />
                ))}
              </div>
            )}

            {debates.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Δεν έχεις debates ακόμα</h2>
                <p className="text-gray-600 mb-6">Ξεκίνα το πρώτο σου debate!</p>
                <button
                  onClick={() => setView('pvp-find')}
                  className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-colors"
                >
                  🔍 {labels.findOpponent}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Home View - Mode Selection
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">🎤 {labels.title}</h1>
          <p className="text-gray-600 text-lg">{labels.subtitle}</p>
        </div>

        {/* Mode Selection */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">{labels.chooseMode}</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* AI Mode */}
            <button
              onClick={() => setView('ai-setup')}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-400 hover:scale-[1.02]"
            >
              <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                ΝΕΟ!
              </div>
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{labels.vsAI}</h3>
              <p className="text-gray-600 mb-4">{labels.vsAIDesc}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">🌱 Αρχάριο</span>
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">🌿 Μεσαίο</span>
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">🌳 Προχωρημένο</span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">🏆 Expert</span>
              </div>
            </button>

            {/* PvP Mode */}
            <button
              onClick={() => setView('pvp-list')}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-400 hover:scale-[1.02]"
            >
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{labels.vsPlayer}</h3>
              <p className="text-gray-600 mb-4">{labels.vsPlayerDesc}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">⚡ Real-time</span>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">📝 Async</span>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Stats (if logged in) */}
        {userId && (aiResults.length > 0 || debates.length > 0) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Τα στατιστικά σου</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{aiResults.filter(r => r.winner === 'user').length}</p>
                <p className="text-xs text-gray-500">AI Νίκες</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{debates.filter(d => d.status === 'completed').length}</p>
                <p className="text-xs text-gray-500">PvP Debates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{debates.filter(d => d.status === 'in_progress').length}</p>
                <p className="text-xs text-gray-500">Σε εξέλιξη</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{aiResults.length}</p>
                <p className="text-xs text-gray-500">AI Debates</p>
              </div>
            </div>
          </div>
        )}

        {/* Popular Topics */}
        {topics.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔥 Δημοφιλή Θέματα</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {topics.slice(0, 4).map((topic) => (
                <TopicPreview 
                  key={topic.id} 
                  topic={topic} 
                  locale="el" 
                  showPoints={false} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Not logged in */}
        {!userId && (
          <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-center text-white">
            <p className="mb-4">Συνδέσου για να αποθηκεύεις την πρόοδό σου και να κερδίζεις badges!</p>
            <a
              href="/login"
              className="inline-block bg-white text-purple-600 px-6 py-2 rounded-xl font-medium hover:bg-gray-100"
            >
              Σύνδεση
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
