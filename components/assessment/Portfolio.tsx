'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export type EnrichmentSubject = 
  | 'philosophy_logic'
  | 'cs_computational'
  | 'financial_literacy'
  | 'me_new_world'
  | 'art_creativity';

export type ArtifactType = 
  | 'project'
  | 'assignment'
  | 'reflection'
  | 'presentation'
  | 'debate'
  | 'code'
  | 'business_plan'
  | 'art_piece'
  | 'research'
  | 'mindfulness_log';

export interface Artifact {
  id: string;
  type: ArtifactType;
  subject: EnrichmentSubject;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  files: ArtifactFile[];
  rubricScores?: RubricScore[];
  selfAssessment?: SelfAssessment;
  peerFeedback?: PeerFeedback[];
  teacherFeedback?: TeacherFeedback;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isFeatured?: boolean;
}

export interface ArtifactFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface RubricScore {
  criterionId: string;
  criterionName: string;
  score: 1 | 2 | 3 | 4;
  maxScore: 4;
  comments?: string;
}

export interface SelfAssessment {
  rating: number;
  reflection: string;
  strengths: string[];
  improvements: string[];
  createdAt: Date;
}

export interface PeerFeedback {
  fromUserId: string;
  fromUserName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface TeacherFeedback {
  teacherId: string;
  teacherName: string;
  rating: number;
  comment: string;
  rubricScores?: RubricScore[];
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  nameEl: string;
  description: string;
  descriptionEl: string;
  icon: string;
  color: string;
  earnedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface LearningGoal {
  id: string;
  title: string;
  titleEl?: string;
  description?: string;
  targetDate?: Date;
  progress: number;
  status: 'in_progress' | 'achieved' | 'abandoned';
  subject?: EnrichmentSubject;
  createdAt: Date;
}

export interface StudentPortfolio {
  id: string;
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  gradeLevel: string;
  artifacts: Artifact[];
  badges: Badge[];
  goals: LearningGoal[];
  stats: PortfolioStats;
}

export interface PortfolioStats {
  totalArtifacts: number;
  bySubject: Record<EnrichmentSubject, number>;
  totalReflections: number;
  badgesEarned: number;
  goalsAchieved: number;
  streakDays: number;
  lastActivity: Date;
}

// ============================================================================
// Subject Configuration
// ============================================================================

export const SUBJECT_CONFIG: Record<EnrichmentSubject, {
  name: string;
  nameEl: string;
  emoji: string;
  color: string;
  bgColor: string;
}> = {
  philosophy_logic: {
    name: 'Philosophy & Logic',
    nameEl: 'Φιλοσοφία & Λογική',
    emoji: '🤔',
    color: '#6B4C9A',
    bgColor: '#F3E8FF'
  },
  cs_computational: {
    name: 'Computer Science',
    nameEl: 'Υπολογιστική Σκέψη',
    emoji: '💻',
    color: '#2E86AB',
    bgColor: '#E0F2FE'
  },
  financial_literacy: {
    name: 'Financial Literacy',
    nameEl: 'Χρηματοοικονομικά',
    emoji: '💰',
    color: '#28A745',
    bgColor: '#DCFCE7'
  },
  me_new_world: {
    name: 'Me in the New World',
    nameEl: 'Εγώ στον Νέο Κόσμο',
    emoji: '🌍',
    color: '#17A2B8',
    bgColor: '#CFFAFE'
  },
  art_creativity: {
    name: 'Art & Creativity',
    nameEl: 'Τέχνη & Δημιουργικότητα',
    emoji: '🎨',
    color: '#E91E63',
    bgColor: '#FCE7F3'
  }
};

const ARTIFACT_TYPE_CONFIG: Record<ArtifactType, { label: string; labelEl: string; icon: string }> = {
  project: { label: 'Project', labelEl: 'Project', icon: '📁' },
  assignment: { label: 'Assignment', labelEl: 'Εργασία', icon: '📝' },
  reflection: { label: 'Reflection', labelEl: 'Αναστοχασμός', icon: '💭' },
  presentation: { label: 'Presentation', labelEl: 'Παρουσίαση', icon: '🎤' },
  debate: { label: 'Debate', labelEl: 'Debate', icon: '⚔️' },
  code: { label: 'Code', labelEl: 'Κώδικας', icon: '👨‍💻' },
  business_plan: { label: 'Business Plan', labelEl: 'Business Plan', icon: '💼' },
  art_piece: { label: 'Art Piece', labelEl: 'Έργο Τέχνης', icon: '🖼️' },
  research: { label: 'Research', labelEl: 'Έρευνα', icon: '🔬' },
  mindfulness_log: { label: 'Mindfulness', labelEl: 'Mindfulness', icon: '🧘' }
};

const RARITY_CONFIG = {
  common: { label: 'Common', labelEl: 'Κοινό', color: '#6B7280' },
  uncommon: { label: 'Uncommon', labelEl: 'Ασυνήθιστο', color: '#22C55E' },
  rare: { label: 'Rare', labelEl: 'Σπάνιο', color: '#3B82F6' },
  legendary: { label: 'Legendary', labelEl: 'Θρυλικό', color: '#F59E0B' }
};

// ============================================================================
// Portfolio Overview Component
// ============================================================================

interface PortfolioOverviewProps {
  portfolio: StudentPortfolio;
  locale?: 'en' | 'el';
  onArtifactClick?: (artifact: Artifact) => void;
  onBadgeClick?: (badge: Badge) => void;
}

export function PortfolioOverview({
  portfolio,
  locale = 'el',
  onArtifactClick,
  onBadgeClick
}: PortfolioOverviewProps) {
  const [activeTab, setActiveTab] = useState<'artifacts' | 'badges' | 'goals'>('artifacts');
  const [selectedSubject, setSelectedSubject] = useState<EnrichmentSubject | 'all'>('all');
  
  // Filter artifacts by subject
  const filteredArtifacts = selectedSubject === 'all'
    ? portfolio.artifacts
    : portfolio.artifacts.filter(a => a.subject === selectedSubject);
  
  return (
    <div className="space-y-6">
      {/* Header with student info */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
            {portfolio.avatarUrl ? (
              <img src={portfolio.avatarUrl} alt="" className="w-full h-full rounded-full" />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{portfolio.studentName}</h1>
            <p className="text-white/80">{portfolio.gradeLevel}</p>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{portfolio.stats.totalArtifacts}</p>
            <p className="text-sm text-white/80">{locale === 'el' ? 'Έργα' : 'Works'}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{portfolio.stats.badgesEarned}</p>
            <p className="text-sm text-white/80">{locale === 'el' ? 'Badges' : 'Badges'}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{portfolio.stats.goalsAchieved}</p>
            <p className="text-sm text-white/80">{locale === 'el' ? 'Στόχοι' : 'Goals'}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{portfolio.stats.streakDays}</p>
            <p className="text-sm text-white/80">{locale === 'el' ? 'Μέρες' : 'Day Streak'}</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['artifacts', 'badges', 'goals'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === tab
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'artifacts' && (locale === 'el' ? 'Έργα' : 'Works')}
            {tab === 'badges' && 'Badges'}
            {tab === 'goals' && (locale === 'el' ? 'Στόχοι' : 'Goals')}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'artifacts' && (
          <motion.div
            key="artifacts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Subject filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  selectedSubject === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedSubject('all')}
              >
                {locale === 'el' ? 'Όλα' : 'All'}
              </button>
              {(Object.keys(SUBJECT_CONFIG) as EnrichmentSubject[]).map((subject) => (
                <button
                  key={subject}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap flex items-center gap-2 ${
                    selectedSubject === subject
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: selectedSubject === subject 
                      ? SUBJECT_CONFIG[subject].color 
                      : undefined
                  }}
                  onClick={() => setSelectedSubject(subject)}
                >
                  <span>{SUBJECT_CONFIG[subject].emoji}</span>
                  <span>{locale === 'el' ? SUBJECT_CONFIG[subject].nameEl : SUBJECT_CONFIG[subject].name}</span>
                </button>
              ))}
            </div>
            
            {/* Artifacts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArtifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  locale={locale}
                  onClick={() => onArtifactClick?.(artifact)}
                />
              ))}
            </div>
            
            {filteredArtifacts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>{locale === 'el' ? 'Δεν υπάρχουν έργα ακόμα' : 'No works yet'}</p>
              </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <BadgeDisplay
              badges={portfolio.badges}
              locale={locale}
              onBadgeClick={onBadgeClick}
            />
          </motion.div>
        )}
        
        {activeTab === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GoalTracker
              goals={portfolio.goals}
              locale={locale}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Artifact Card Component
// ============================================================================

interface ArtifactCardProps {
  artifact: Artifact;
  locale: 'en' | 'el';
  onClick?: () => void;
}

export function ArtifactCard({ artifact, locale, onClick }: ArtifactCardProps) {
  const subjectConfig = SUBJECT_CONFIG[artifact.subject];
  const typeConfig = ARTIFACT_TYPE_CONFIG[artifact.type];
  
  // Calculate average score if rubric exists
  const averageScore = artifact.rubricScores?.length
    ? artifact.rubricScores.reduce((sum, s) => sum + s.score, 0) / artifact.rubricScores.length
    : null;
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      whileHover={{ y: -2 }}
    >
      {/* Thumbnail or placeholder */}
      <div 
        className="h-32 flex items-center justify-center text-4xl"
        style={{ backgroundColor: subjectConfig.bgColor }}
      >
        {artifact.thumbnailUrl ? (
          <img src={artifact.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          typeConfig.icon
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Type and subject badges */}
        <div className="flex gap-2 mb-2">
          <span 
            className="px-2 py-1 rounded-full text-xs text-white"
            style={{ backgroundColor: subjectConfig.color }}
          >
            {subjectConfig.emoji} {locale === 'el' ? subjectConfig.nameEl.split(' ')[0] : subjectConfig.name.split(' ')[0]}
          </span>
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
            {locale === 'el' ? typeConfig.labelEl : typeConfig.label}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
          {artifact.title}
        </h3>
        
        {/* Description */}
        {artifact.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {artifact.description}
          </p>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          {/* Score if exists */}
          {averageScore !== null && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${star <= averageScore ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                  ★
                </span>
              ))}
            </div>
          )}
          
          {/* Date */}
          <span className="text-xs text-gray-400">
            {new Date(artifact.createdAt).toLocaleDateString(
              locale === 'el' ? 'el-GR' : 'en-US',
              { month: 'short', day: 'numeric' }
            )}
          </span>
          
          {/* Featured indicator */}
          {artifact.isFeatured && (
            <span className="text-yellow-500" title={locale === 'el' ? 'Επιλεγμένο' : 'Featured'}>
              ⭐
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Badge Display Component
// ============================================================================

interface BadgeDisplayProps {
  badges: Badge[];
  locale: 'en' | 'el';
  onBadgeClick?: (badge: Badge) => void;
}

export function BadgeDisplay({ badges, locale, onBadgeClick }: BadgeDisplayProps) {
  // Group badges by rarity
  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.rarity]) acc[badge.rarity] = [];
    acc[badge.rarity].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);
  
  const rarityOrder: Badge['rarity'][] = ['legendary', 'rare', 'uncommon', 'common'];
  
  return (
    <div className="space-y-6">
      {rarityOrder.map((rarity) => {
        const badgesInRarity = groupedBadges[rarity] || [];
        if (badgesInRarity.length === 0) return null;
        
        return (
          <div key={rarity}>
            <h3 
              className="font-medium mb-3 flex items-center gap-2"
              style={{ color: RARITY_CONFIG[rarity].color }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_CONFIG[rarity].color }} />
              {locale === 'el' ? RARITY_CONFIG[rarity].labelEl : RARITY_CONFIG[rarity].label}
              <span className="text-gray-400 font-normal">({badgesInRarity.length})</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {badgesInRarity.map((badge) => (
                <motion.button
                  key={badge.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
                  onClick={() => onBadgeClick?.(badge)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div 
                    className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${badge.color}20` }}
                  >
                    {badge.icon}
                  </div>
                  <p className="font-medium text-sm text-gray-800">
                    {locale === 'el' ? badge.nameEl : badge.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString(
                      locale === 'el' ? 'el-GR' : 'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}
      
      {badges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">🏆</p>
          <p>{locale === 'el' ? 'Δεν έχεις κερδίσει badges ακόμα' : 'No badges earned yet'}</p>
          <p className="text-sm mt-1">
            {locale === 'el' ? 'Συνέχισε να μαθαίνεις για να κερδίσεις!' : 'Keep learning to earn some!'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Goal Tracker Component
// ============================================================================

interface GoalTrackerProps {
  goals: LearningGoal[];
  locale: 'en' | 'el';
  onAddGoal?: () => void;
  onGoalClick?: (goal: LearningGoal) => void;
}

export function GoalTracker({ goals, locale, onAddGoal, onGoalClick }: GoalTrackerProps) {
  const activeGoals = goals.filter(g => g.status === 'in_progress');
  const achievedGoals = goals.filter(g => g.status === 'achieved');
  
  return (
    <div className="space-y-6">
      {/* Active goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">
            {locale === 'el' ? 'Ενεργοί Στόχοι' : 'Active Goals'}
          </h3>
          {onAddGoal && (
            <button
              className="text-sm text-teal-600 hover:text-teal-700"
              onClick={onAddGoal}
            >
              + {locale === 'el' ? 'Νέος Στόχος' : 'New Goal'}
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <motion.div
              key={goal.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onGoalClick?.(goal)}
              whileHover={{ x: 2 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-800">
                    {locale === 'el' && goal.titleEl ? goal.titleEl : goal.title}
                  </h4>
                  {goal.description && (
                    <p className="text-sm text-gray-500">{goal.description}</p>
                  )}
                </div>
                {goal.subject && (
                  <span className="text-lg">{SUBJECT_CONFIG[goal.subject].emoji}</span>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">{locale === 'el' ? 'Πρόοδος' : 'Progress'}</span>
                  <span className="font-medium text-teal-600">{goal.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
              
              {/* Target date */}
              {goal.targetDate && (
                <p className="text-xs text-gray-400 mt-2">
                  {locale === 'el' ? 'Στόχος:' : 'Target:'} {new Date(goal.targetDate).toLocaleDateString(
                    locale === 'el' ? 'el-GR' : 'en-US',
                    { month: 'short', day: 'numeric' }
                  )}
                </p>
              )}
            </motion.div>
          ))}
          
          {activeGoals.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
              <p className="text-3xl mb-2">🎯</p>
              <p>{locale === 'el' ? 'Δεν έχεις ενεργούς στόχους' : 'No active goals'}</p>
              {onAddGoal && (
                <button
                  className="mt-2 text-teal-600 hover:text-teal-700 text-sm"
                  onClick={onAddGoal}
                >
                  {locale === 'el' ? 'Δημιούργησε έναν!' : 'Create one!'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Achieved goals */}
      {achievedGoals.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-800 mb-3">
            {locale === 'el' ? 'Επιτεύχθηκαν' : 'Achieved'} ✓
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {achievedGoals.slice(0, 4).map((goal) => (
              <div
                key={goal.id}
                className="bg-green-50 rounded-lg p-3 border border-green-100"
              >
                <p className="text-sm font-medium text-green-800 line-clamp-1">
                  {locale === 'el' && goal.titleEl ? goal.titleEl : goal.title}
                </p>
                <p className="text-xs text-green-600">
                  {new Date(goal.createdAt).toLocaleDateString(
                    locale === 'el' ? 'el-GR' : 'en-US',
                    { month: 'short', year: 'numeric' }
                  )}
                </p>
              </div>
            ))}
          </div>
          
          {achievedGoals.length > 4 && (
            <button className="text-sm text-gray-500 hover:text-gray-700 mt-2">
              {locale === 'el' ? `Δες όλους (${achievedGoals.length})` : `See all (${achievedGoals.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Self Reflection Component
// ============================================================================

interface SelfReflectionFormProps {
  artifactTitle?: string;
  gradeLevel: 'primary' | 'gymnasio' | 'lykeio';
  locale?: 'en' | 'el';
  onSubmit: (reflection: SelfAssessment) => void;
  onCancel?: () => void;
}

export function SelfReflectionForm({
  artifactTitle,
  gradeLevel,
  locale = 'el',
  onSubmit,
  onCancel
}: SelfReflectionFormProps) {
  const [rating, setRating] = useState(0);
  const [reflection, setReflection] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [newStrength, setNewStrength] = useState('');
  const [newImprovement, setNewImprovement] = useState('');
  
  // Prompts based on grade level
  const prompts = {
    primary: {
      rating: locale === 'el' ? 'Πόσο χαρούμενος/η είσαι με αυτή τη δουλειά;' : 'How happy are you with this work?',
      reflection: locale === 'el' ? 'Τι έμαθες;' : 'What did you learn?',
      strengths: locale === 'el' ? 'Τι έκανες καλά;' : 'What did you do well?',
      improvements: locale === 'el' ? 'Τι θα ήθελες να κάνεις καλύτερα;' : 'What would you like to do better?'
    },
    gymnasio: {
      rating: locale === 'el' ? 'Πώς αξιολογείς τη δουλειά σου;' : 'How do you rate your work?',
      reflection: locale === 'el' ? 'Τι έμαθες από αυτή την εργασία; Πώς σε βοήθησε;' : 'What did you learn from this work? How did it help you?',
      strengths: locale === 'el' ? 'Ποια είναι τα δυνατά σημεία της δουλειάς σου;' : 'What are the strengths of your work?',
      improvements: locale === 'el' ? 'Τι θα μπορούσες να βελτιώσεις;' : 'What could you improve?'
    },
    lykeio: {
      rating: locale === 'el' ? 'Αξιολόγησε τη δουλειά σου' : 'Rate your work',
      reflection: locale === 'el' ? 'Αναστοχάσου: Τι έμαθες; Πώς επηρέασε τη σκέψη σου; Πώς θα το εφαρμόσεις;' : 'Reflect: What did you learn? How did it affect your thinking? How will you apply it?',
      strengths: locale === 'el' ? 'Δυνατά σημεία' : 'Strengths',
      improvements: locale === 'el' ? 'Σημεία προς βελτίωση' : 'Areas for improvement'
    }
  };
  
  const currentPrompts = prompts[gradeLevel];
  
  const handleAddStrength = () => {
    if (newStrength.trim()) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength('');
    }
  };
  
  const handleAddImprovement = () => {
    if (newImprovement.trim()) {
      setImprovements([...improvements, newImprovement.trim()]);
      setNewImprovement('');
    }
  };
  
  const handleSubmit = () => {
    onSubmit({
      rating,
      reflection,
      strengths,
      improvements,
      createdAt: new Date()
    });
  };
  
  const isValid = rating > 0 && reflection.trim().length >= (gradeLevel === 'primary' ? 10 : 30);
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        {locale === 'el' ? 'Αυτοαξιολόγηση' : 'Self-Reflection'}
      </h2>
      {artifactTitle && (
        <p className="text-gray-500 mb-6">
          {locale === 'el' ? 'Για:' : 'For:'} {artifactTitle}
        </p>
      )}
      
      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentPrompts.rating}
        </label>
        <div className="flex gap-2">
          {gradeLevel === 'primary' ? (
            // Emoji rating for primary
            ['😢', '😕', '😐', '🙂', '😊'].map((emoji, i) => (
              <motion.button
                key={i}
                className={`text-3xl p-2 rounded-lg transition-all ${
                  rating === i + 1 ? 'bg-yellow-100 scale-110' : 'hover:bg-gray-100'
                }`}
                onClick={() => setRating(i + 1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {emoji}
              </motion.button>
            ))
          ) : (
            // Star rating for older students
            [1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                className={`text-3xl ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-200'
                }`}
                onClick={() => setRating(star)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                ★
              </motion.button>
            ))
          )}
        </div>
      </div>
      
      {/* Reflection text */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentPrompts.reflection}
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder={locale === 'el' ? 'Γράψε εδώ...' : 'Write here...'}
          className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          rows={gradeLevel === 'primary' ? 3 : 5}
        />
        <p className="text-xs text-gray-400 mt-1">
          {reflection.length} {locale === 'el' ? 'χαρακτήρες' : 'characters'}
          {gradeLevel !== 'primary' && ` (min: ${gradeLevel === 'gymnasio' ? 30 : 50})`}
        </p>
      </div>
      
      {/* Strengths */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentPrompts.strengths}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newStrength}
            onChange={(e) => setNewStrength(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddStrength()}
            placeholder={locale === 'el' ? 'Πρόσθεσε...' : 'Add...'}
            className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={handleAddStrength}
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {strengths.map((s, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
            >
              {s}
              <button
                className="text-green-500 hover:text-green-700"
                onClick={() => setStrengths(strengths.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      
      {/* Improvements */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentPrompts.improvements}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newImprovement}
            onChange={(e) => setNewImprovement(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddImprovement()}
            placeholder={locale === 'el' ? 'Πρόσθεσε...' : 'Add...'}
            className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            onClick={handleAddImprovement}
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {improvements.map((s, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1"
            >
              {s}
              <button
                className="text-orange-500 hover:text-orange-700"
                onClick={() => setImprovements(improvements.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
            onClick={onCancel}
          >
            {locale === 'el' ? 'Ακύρωση' : 'Cancel'}
          </button>
        )}
        <motion.button
          className={`flex-1 py-3 rounded-xl text-white font-medium ${
            isValid ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
          disabled={!isValid}
          whileHover={isValid ? { scale: 1.02 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
        >
          {locale === 'el' ? 'Υποβολή' : 'Submit'}
        </motion.button>
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default PortfolioOverview;
