'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types (matching DebateService)
// ============================================================================

export type DebateFormat = 
  | 'mini_debate'
  | 'lincoln_douglas'
  | 'parliamentary'
  | 'written_exchange'
  | 'socratic_circle';

export type DebateStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface DebateTopic {
  id: string;
  topic: string;
  topicEl: string;
  category: string;
  complexity: 'simple' | 'moderate' | 'complex';
  gradeMin: string;
  gradeMax: string;
  backgroundInfo?: string;
  backgroundInfoEl?: string;
  affirmativePoints: string[];
  negativePoints: string[];
}

export interface Debate {
  id: string;
  topicId: string;
  topic?: DebateTopic;
  format: DebateFormat;
  status: DebateStatus;
  isAsync: boolean;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  participants: DebateParticipant[];
  currentTurn?: string;
  turnDeadline?: Date;
  winnerParticipantId?: string;
}

export interface DebateParticipant {
  id: string;
  debateId: string;
  userId: string;
  userName?: string;
  side: 'affirmative' | 'negative';
  role: 'debater' | 'judge' | 'audience';
  isReady: boolean;
}

export interface DebateArgument {
  id: string;
  debateId: string;
  participantId: string;
  roundNumber: number;
  argumentType: 'opening' | 'rebuttal' | 'closing' | 'cross_examination';
  content: string;
  wordCount: number;
  submittedAt: Date;
  aiFeedback?: {
    structureScore: number;
    evidenceScore: number;
    clarityScore: number;
    logicScore: number;
    suggestions: string[];
  };
}

// ============================================================================
// Configuration
// ============================================================================

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; labelEl: string }> = {
  school_life: { emoji: '🏫', color: '#3B82F6', labelEl: 'Σχολική Ζωή' },
  technology: { emoji: '💻', color: '#8B5CF6', labelEl: 'Τεχνολογία' },
  environment: { emoji: '🌍', color: '#22C55E', labelEl: 'Περιβάλλον' },
  society: { emoji: '🏛️', color: '#F59E0B', labelEl: 'Κοινωνία' },
  ethics: { emoji: '⚖️', color: '#6366F1', labelEl: 'Ηθική' },
  science: { emoji: '🔬', color: '#EC4899', labelEl: 'Επιστήμη' },
  local: { emoji: '🇬🇷', color: '#06B6D4', labelEl: 'Τοπικά' }
};

const FORMAT_CONFIG: Record<DebateFormat, { name: string; nameEl: string; emoji: string; duration: string }> = {
  mini_debate: { name: 'Mini Debate', nameEl: 'Μίνι Debate', emoji: '⚡', duration: '10 λεπτά' },
  lincoln_douglas: { name: 'Lincoln-Douglas', nameEl: 'Lincoln-Douglas', emoji: '🎩', duration: '35 λεπτά' },
  parliamentary: { name: 'Parliamentary', nameEl: 'Κοινοβουλευτικό', emoji: '🏛️', duration: '45 λεπτά' },
  written_exchange: { name: 'Written', nameEl: 'Γραπτό', emoji: '✍️', duration: '5 μέρες' },
  socratic_circle: { name: 'Socratic', nameEl: 'Σωκρατικός Κύκλος', emoji: '🤔', duration: '40 λεπτά' }
};

const COMPLEXITY_CONFIG = {
  simple: { label: 'Simple', labelEl: 'Απλό', color: '#22C55E' },
  moderate: { label: 'Moderate', labelEl: 'Μέτριο', color: '#F59E0B' },
  complex: { label: 'Complex', labelEl: 'Σύνθετο', color: '#EF4444' }
};

// ============================================================================
// Topic Selector Component
// ============================================================================

interface TopicSelectorProps {
  topics: DebateTopic[];
  selectedTopicId?: string;
  onSelect: (topic: DebateTopic) => void;
  locale?: 'en' | 'el';
  showFilters?: boolean;
  className?: string;
}

export function TopicSelector({
  topics,
  selectedTopicId,
  onSelect,
  locale = 'el',
  showFilters = true,
  className = ''
}: TopicSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [complexityFilter, setComplexityFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter topics
  const filteredTopics = topics.filter(topic => {
    if (categoryFilter !== 'all' && topic.category !== categoryFilter) return false;
    if (complexityFilter !== 'all' && topic.complexity !== complexityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTopic = topic.topic.toLowerCase().includes(query) || 
                          topic.topicEl.toLowerCase().includes(query);
      if (!matchesTopic) return false;
    }
    return true;
  });
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'el' ? 'Αναζήτηση θέματος...' : 'Search topics...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                categoryFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => setCategoryFilter('all')}
            >
              {locale === 'el' ? 'Όλα' : 'All'}
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1 ${
                  categoryFilter === key ? 'text-white' : 'bg-gray-100 text-gray-600'
                }`}
                style={{ backgroundColor: categoryFilter === key ? config.color : undefined }}
                onClick={() => setCategoryFilter(key)}
              >
                <span>{config.emoji}</span>
                <span>{config.labelEl}</span>
              </button>
            ))}
          </div>
          
          {/* Complexity filter */}
          <div className="flex gap-2">
            <span className="text-sm text-gray-500 py-1">
              {locale === 'el' ? 'Δυσκολία:' : 'Difficulty:'}
            </span>
            {Object.entries(COMPLEXITY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`px-3 py-1 rounded-full text-sm ${
                  complexityFilter === key 
                    ? 'text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{ backgroundColor: complexityFilter === key ? config.color : undefined }}
                onClick={() => setComplexityFilter(complexityFilter === key ? 'all' : key)}
              >
                {locale === 'el' ? config.labelEl : config.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Topics list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTopics.map((topic) => {
          const categoryConfig = CATEGORY_CONFIG[topic.category] || CATEGORY_CONFIG.society;
          const complexityConfig = COMPLEXITY_CONFIG[topic.complexity];
          const isSelected = selectedTopicId === topic.id;
          
          return (
            <motion.button
              key={topic.id}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                isSelected 
                  ? 'bg-teal-50 border-2 border-teal-500' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect(topic)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{categoryConfig.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">
                    {locale === 'el' ? topic.topicEl : topic.topic}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ backgroundColor: categoryConfig.color }}
                    >
                      {categoryConfig.labelEl}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ backgroundColor: complexityConfig.color }}
                    >
                      {locale === 'el' ? complexityConfig.labelEl : complexityConfig.label}
                    </span>
                  </div>
                </div>
                
                {isSelected && (
                  <span className="text-teal-500 text-xl">✓</span>
                )}
              </div>
            </motion.button>
          );
        })}
        
        {filteredTopics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-3xl mb-2">🔍</p>
            <p>{locale === 'el' ? 'Δεν βρέθηκαν θέματα' : 'No topics found'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Format Selector Component
// ============================================================================

interface FormatSelectorProps {
  selectedFormat?: DebateFormat;
  onSelect: (format: DebateFormat) => void;
  gradeLevel: string;
  locale?: 'en' | 'el';
  className?: string;
}

export function FormatSelector({
  selectedFormat,
  onSelect,
  gradeLevel,
  locale = 'el',
  className = ''
}: FormatSelectorProps) {
  // Filter formats by grade level
  const availableFormats: DebateFormat[] = ['mini_debate', 'written_exchange'];
  
  // Add more formats for older students
  if (['a_gymnasiou', 'b_gymnasiou', 'g_gymnasiou', 'a_lykeiou', 'b_lykeiou', 'g_lykeiou'].includes(gradeLevel)) {
    availableFormats.push('lincoln_douglas', 'socratic_circle');
  }
  if (['g_gymnasiou', 'a_lykeiou', 'b_lykeiou', 'g_lykeiou'].includes(gradeLevel)) {
    availableFormats.push('parliamentary');
  }
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      {availableFormats.map((format) => {
        const config = FORMAT_CONFIG[format];
        const isSelected = selectedFormat === format;
        
        return (
          <motion.button
            key={format}
            className={`p-4 rounded-xl text-left transition-all ${
              isSelected 
                ? 'bg-teal-500 text-white shadow-lg' 
                : 'bg-white border border-gray-200 hover:border-teal-300'
            }`}
            onClick={() => onSelect(format)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.emoji}</span>
              <div>
                <h3 className="font-medium">
                  {locale === 'el' ? config.nameEl : config.name}
                </h3>
                <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  {config.duration}
                </p>
              </div>
            </div>
            
            {format === 'written_exchange' && (
              <div className={`mt-2 text-xs px-2 py-1 rounded ${
                isSelected ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {locale === 'el' ? '📝 Ασύγχρονο - παίξε όποτε θέλεις' : '📝 Async - play anytime'}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Topic Preview Component
// ============================================================================

interface TopicPreviewProps {
  topic: DebateTopic;
  locale?: 'en' | 'el';
  showPoints?: boolean;
  className?: string;
}

export function TopicPreview({
  topic,
  locale = 'el',
  showPoints = true,
  className = ''
}: TopicPreviewProps) {
  const categoryConfig = CATEGORY_CONFIG[topic.category] || CATEGORY_CONFIG.society;
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="p-4 text-white"
        style={{ backgroundColor: categoryConfig.color }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{categoryConfig.emoji}</span>
          <span className="text-sm opacity-80">{categoryConfig.labelEl}</span>
        </div>
        <h2 className="text-xl font-bold">
          {locale === 'el' ? topic.topicEl : topic.topic}
        </h2>
      </div>
      
      {/* Background info */}
      {(topic.backgroundInfo || topic.backgroundInfoEl) && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            {locale === 'el' ? 'Πληροφορίες' : 'Background'}
          </h3>
          <p className="text-gray-700 text-sm">
            {locale === 'el' ? topic.backgroundInfoEl : topic.backgroundInfo}
          </p>
        </div>
      )}
      
      {/* Pro/Con points */}
      {showPoints && (
        <div className="p-4 grid grid-cols-2 gap-4">
          {/* Affirmative points */}
          <div>
            <h3 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
              <span>👍</span>
              {locale === 'el' ? 'Υπέρ' : 'For'}
            </h3>
            <ul className="space-y-1">
              {topic.affirmativePoints.map((point, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Negative points */}
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
              <span>👎</span>
              {locale === 'el' ? 'Κατά' : 'Against'}
            </h3>
            <ul className="space-y-1">
              {topic.negativePoints.map((point, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Written Debate Component
// ============================================================================

interface WrittenDebateProps {
  debate: Debate;
  arguments_: DebateArgument[];
  currentUserId: string;
  onSubmitArgument: (content: string, roundNumber: number, type: DebateArgument['argumentType']) => Promise<void>;
  locale?: 'en' | 'el';
  className?: string;
}

export function WrittenDebate({
  debate,
  arguments_,
  currentUserId,
  onSubmitArgument,
  locale = 'el',
  className = ''
}: WrittenDebateProps) {
  const [draftContent, setDraftContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentParticipant = debate.participants.find(p => p.userId === currentUserId);
  const isMyTurn = debate.currentTurn === currentUserId;
  const currentRound = arguments_.length;
  
  // Word count
  const wordCount = draftContent.split(/\s+/).filter(w => w.length > 0).length;
  const wordLimit = 500; // Could be dynamic based on round
  
  const handleSubmit = async () => {
    if (wordCount === 0 || wordCount > wordLimit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitArgument(
        draftContent,
        currentRound,
        currentRound === 0 ? 'opening' : 
        currentRound < 4 ? 'rebuttal' : 'closing'
      );
      setDraftContent('');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Topic header */}
      {debate.topic && (
        <TopicPreview topic={debate.topic} locale={locale} showPoints={false} />
      )}
      
      {/* Arguments timeline */}
      <div className="space-y-4">
        {arguments_.map((arg, index) => {
          const participant = debate.participants.find(p => p.id === arg.participantId);
          const isAffirmative = participant?.side === 'affirmative';
          const isOwnArgument = participant?.userId === currentUserId;
          
          return (
            <motion.div
              key={arg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl ${
                isAffirmative ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    isAffirmative ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {isAffirmative ? '👍' : '👎'}
                  </span>
                  <div>
                    <span className="font-medium">
                      {isOwnArgument 
                        ? (locale === 'el' ? 'Εσύ' : 'You')
                        : (participant?.userName || (locale === 'el' ? 'Αντίπαλος' : 'Opponent'))
                      }
                    </span>
                    <span className={`ml-2 text-sm ${isAffirmative ? 'text-green-600' : 'text-red-600'}`}>
                      ({locale === 'el' 
                        ? (isAffirmative ? 'Υπέρ' : 'Κατά')
                        : (isAffirmative ? 'For' : 'Against')
                      })
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {locale === 'el' ? 'Γύρος' : 'Round'} {index + 1}
                </span>
              </div>
              
              {/* Content */}
              <p className="text-gray-700 whitespace-pre-wrap">{arg.content}</p>
              
              {/* AI Feedback (if own argument) */}
              {isOwnArgument && arg.aiFeedback && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    🤖 {locale === 'el' ? 'Feedback AI' : 'AI Feedback'}
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-teal-600">{arg.aiFeedback.structureScore}</div>
                      <div className="text-xs text-gray-500">{locale === 'el' ? 'Δομή' : 'Structure'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-teal-600">{arg.aiFeedback.evidenceScore}</div>
                      <div className="text-xs text-gray-500">{locale === 'el' ? 'Στοιχεία' : 'Evidence'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-teal-600">{arg.aiFeedback.clarityScore}</div>
                      <div className="text-xs text-gray-500">{locale === 'el' ? 'Σαφήνεια' : 'Clarity'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-teal-600">{arg.aiFeedback.logicScore}</div>
                      <div className="text-xs text-gray-500">{locale === 'el' ? 'Λογική' : 'Logic'}</div>
                    </div>
                  </div>
                  {arg.aiFeedback.suggestions.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{locale === 'el' ? 'Προτάσεις:' : 'Suggestions:'}</span>
                      <ul className="mt-1 space-y-1">
                        {arg.aiFeedback.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>💡</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Word count */}
              <div className="mt-2 text-xs text-gray-400">
                {arg.wordCount} {locale === 'el' ? 'λέξεις' : 'words'}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Input area (if it's user's turn) */}
      {isMyTurn && debate.status === 'in_progress' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-gray-800 mb-2">
            {locale === 'el' ? 'Η σειρά σου!' : 'Your turn!'}
          </h3>
          
          {currentParticipant && (
            <p className="text-sm text-gray-500 mb-3">
              {locale === 'el' ? 'Υπερασπίζεσαι τη θέση' : 'You are defending the position'}: {' '}
              <span className={currentParticipant.side === 'affirmative' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {locale === 'el' 
                  ? (currentParticipant.side === 'affirmative' ? 'ΥΠΕΡ' : 'ΚΑΤΑ')
                  : (currentParticipant.side === 'affirmative' ? 'FOR' : 'AGAINST')
                }
              </span>
            </p>
          )}
          
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder={locale === 'el' ? 'Γράψε το επιχείρημά σου...' : 'Write your argument...'}
            className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            rows={6}
          />
          
          <div className="flex items-center justify-between mt-3">
            <span className={`text-sm ${wordCount > wordLimit ? 'text-red-500' : 'text-gray-500'}`}>
              {wordCount} / {wordLimit} {locale === 'el' ? 'λέξεις' : 'words'}
            </span>
            
            <motion.button
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                wordCount > 0 && wordCount <= wordLimit && !isSubmitting
                  ? 'bg-teal-500 hover:bg-teal-600'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={wordCount === 0 || wordCount > wordLimit || isSubmitting}
              whileHover={wordCount > 0 && wordCount <= wordLimit ? { scale: 1.02 } : {}}
              whileTap={wordCount > 0 && wordCount <= wordLimit ? { scale: 0.98 } : {}}
            >
              {isSubmitting 
                ? (locale === 'el' ? 'Υποβολή...' : 'Submitting...')
                : (locale === 'el' ? 'Υποβολή' : 'Submit')
              }
            </motion.button>
          </div>
          
          {/* Deadline warning */}
          {debate.turnDeadline && (
            <p className="text-sm text-orange-500 mt-2">
              ⏰ {locale === 'el' ? 'Προθεσμία:' : 'Deadline:'} {new Date(debate.turnDeadline).toLocaleDateString(
                locale === 'el' ? 'el-GR' : 'en-US',
                { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              )}
            </p>
          )}
        </div>
      )}
      
      {/* Waiting for opponent */}
      {!isMyTurn && debate.status === 'in_progress' && (
        <div className="bg-yellow-50 rounded-xl p-6 text-center">
          <span className="text-4xl mb-2 block">⏳</span>
          <p className="text-yellow-800 font-medium">
            {locale === 'el' ? 'Περιμένουμε τον αντίπαλο...' : 'Waiting for opponent...'}
          </p>
        </div>
      )}
      
      {/* Debate completed */}
      {debate.status === 'completed' && (
        <div className="bg-green-50 rounded-xl p-6 text-center">
          <span className="text-4xl mb-2 block">🎉</span>
          <p className="text-green-800 font-medium">
            {locale === 'el' ? 'Το debate ολοκληρώθηκε!' : 'Debate completed!'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Match Finding Component
// ============================================================================

interface MatchFinderProps {
  userId: string;
  gradeLevel: string;
  topics: DebateTopic[];
  onMatchFound: (debateId: string) => void;
  onRequestMatch: (params: {
    topicId?: string;
    format?: DebateFormat;
    side?: 'affirmative' | 'negative' | 'any';
  }) => Promise<{ matched: boolean; debateId?: string; message: string }>;
  locale?: 'en' | 'el';
  className?: string;
}

export function MatchFinder({
  userId,
  gradeLevel,
  topics,
  onMatchFound,
  onRequestMatch,
  locale = 'el',
  className = ''
}: MatchFinderProps) {
  const [step, setStep] = useState<'topic' | 'format' | 'side' | 'searching'>('topic');
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<DebateFormat>('mini_debate');
  const [selectedSide, setSelectedSide] = useState<'affirmative' | 'negative' | 'any'>('any');
  const [searchMessage, setSearchMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async () => {
    setStep('searching');
    setIsSearching(true);
    setSearchMessage(locale === 'el' ? 'Αναζήτηση αντιπάλου...' : 'Finding opponent...');
    
    try {
      const result = await onRequestMatch({
        topicId: selectedTopic?.id,
        format: selectedFormat,
        side: selectedSide
      });
      
      setSearchMessage(result.message);
      
      if (result.matched && result.debateId) {
        setTimeout(() => {
          onMatchFound(result.debateId!);
        }, 1500);
      }
    } catch (err) {
      setSearchMessage(locale === 'el' ? 'Σφάλμα. Δοκίμασε ξανά.' : 'Error. Try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto ${className}`}>
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {['topic', 'format', 'side', 'searching'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              step === s 
                ? 'bg-teal-500 text-white' 
                : ['topic', 'format', 'side'].indexOf(step) > i 
                  ? 'bg-teal-100 text-teal-600'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {i + 1}
            </div>
            {i < 3 && <div className="w-8 h-0.5 bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        {/* Step 1: Topic */}
        {step === 'topic' && (
          <motion.div
            key="topic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {locale === 'el' ? 'Επίλεξε θέμα' : 'Choose a topic'}
            </h2>
            <TopicSelector
              topics={topics}
              selectedTopicId={selectedTopic?.id}
              onSelect={setSelectedTopic}
              locale={locale}
            />
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600"
                onClick={() => setSelectedTopic(null)}
              >
                {locale === 'el' ? 'Τυχαίο θέμα' : 'Random topic'}
              </button>
              <motion.button
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium"
                onClick={() => setStep('format')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {locale === 'el' ? 'Επόμενο' : 'Next'}
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {/* Step 2: Format */}
        {step === 'format' && (
          <motion.div
            key="format"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {locale === 'el' ? 'Επίλεξε μορφή' : 'Choose format'}
            </h2>
            <FormatSelector
              selectedFormat={selectedFormat}
              onSelect={setSelectedFormat}
              gradeLevel={gradeLevel}
              locale={locale}
            />
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600"
                onClick={() => setStep('topic')}
              >
                {locale === 'el' ? 'Πίσω' : 'Back'}
              </button>
              <motion.button
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium"
                onClick={() => setStep('side')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {locale === 'el' ? 'Επόμενο' : 'Next'}
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {/* Step 3: Side */}
        {step === 'side' && (
          <motion.div
            key="side"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {locale === 'el' ? 'Επίλεξε πλευρά' : 'Choose your side'}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'affirmative' as const, emoji: '👍', label: locale === 'el' ? 'Υπέρ' : 'For', color: 'green' },
                { value: 'any' as const, emoji: '🎲', label: locale === 'el' ? 'Οποιαδήποτε' : 'Any', color: 'gray' },
                { value: 'negative' as const, emoji: '👎', label: locale === 'el' ? 'Κατά' : 'Against', color: 'red' }
              ].map((option) => (
                <motion.button
                  key={option.value}
                  className={`p-6 rounded-xl text-center transition-all ${
                    selectedSide === option.value
                      ? option.color === 'green' ? 'bg-green-500 text-white' 
                        : option.color === 'red' ? 'bg-red-500 text-white'
                        : 'bg-gray-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedSide(option.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-4xl block mb-2">{option.emoji}</span>
                  <span className="font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600"
                onClick={() => setStep('format')}
              >
                {locale === 'el' ? 'Πίσω' : 'Back'}
              </button>
              <motion.button
                className="flex-1 py-3 rounded-xl bg-teal-500 text-white font-medium"
                onClick={handleSearch}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {locale === 'el' ? 'Βρες Αντίπαλο!' : 'Find Opponent!'}
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {/* Step 4: Searching */}
        {step === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            {isSearching ? (
              <>
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-teal-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-xl font-medium text-gray-800">{searchMessage}</p>
              </>
            ) : (
              <>
                <span className="text-5xl block mb-4">
                  {searchMessage.includes('Match found') || searchMessage.includes('βρέθηκε') ? '🎉' : '📋'}
                </span>
                <p className="text-xl font-medium text-gray-800 mb-4">{searchMessage}</p>
                {!searchMessage.includes('Match found') && !searchMessage.includes('βρέθηκε') && (
                  <button
                    className="px-6 py-2 rounded-lg bg-gray-100 text-gray-600"
                    onClick={() => setStep('topic')}
                  >
                    {locale === 'el' ? 'Δοκίμασε ξανά' : 'Try again'}
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Debate Card Component (for listing)
// ============================================================================

interface DebateCardProps {
  debate: Debate;
  currentUserId: string;
  locale?: 'en' | 'el';
  onClick?: () => void;
}

export function DebateCard({
  debate,
  currentUserId,
  locale = 'el',
  onClick
}: DebateCardProps) {
  const formatConfig = FORMAT_CONFIG[debate.format];
  const myParticipant = debate.participants.find(p => p.userId === currentUserId);
  const opponent = debate.participants.find(p => p.userId !== currentUserId && p.role === 'debater');
  const isMyTurn = debate.currentTurn === currentUserId;
  
  const statusConfig = {
    scheduled: { label: locale === 'el' ? 'Προγραμματισμένο' : 'Scheduled', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: locale === 'el' ? 'Σε εξέλιξη' : 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
    completed: { label: locale === 'el' ? 'Ολοκληρωμένο' : 'Completed', color: 'bg-green-100 text-green-700' },
    cancelled: { label: locale === 'el' ? 'Ακυρώθηκε' : 'Cancelled', color: 'bg-gray-100 text-gray-700' }
  };
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{formatConfig.emoji}</span>
          <div>
            <h3 className="font-medium text-gray-800">
              {locale === 'el' ? formatConfig.nameEl : formatConfig.name}
            </h3>
            <p className="text-sm text-gray-500">
              vs {opponent?.userName || (locale === 'el' ? 'Αντίπαλος' : 'Opponent')}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${statusConfig[debate.status].color}`}>
          {statusConfig[debate.status].label}
        </span>
      </div>
      
      {/* Topic */}
      {debate.topic && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {locale === 'el' ? debate.topic.topicEl : debate.topic.topic}
        </p>
      )}
      
      {/* My side */}
      {myParticipant && (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs text-white ${
            myParticipant.side === 'affirmative' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {myParticipant.side === 'affirmative' 
              ? (locale === 'el' ? 'Υπέρ' : 'For')
              : (locale === 'el' ? 'Κατά' : 'Against')
            }
          </span>
          
          {isMyTurn && debate.status === 'in_progress' && (
            <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs animate-pulse">
              {locale === 'el' ? 'Η σειρά σου!' : 'Your turn!'}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default {
  TopicSelector,
  FormatSelector,
  TopicPreview,
  WrittenDebate,
  MatchFinder,
  DebateCard
};
