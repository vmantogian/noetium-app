/**
 * Noetium Debate Service
 * 
 * Handles debate matching, creation, and management.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export type DebateFormat = 'mini_debate' | 'lincoln_douglas' | 'parliamentary' | 'written_exchange';
export type DebateSide = 'affirmative' | 'negative';
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
  format: DebateFormat;
  status: DebateStatus;
  isAsync: boolean;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  recordingUrl?: string;
  transcript?: any;
  winnerParticipantId?: string;
  createdBy: string;
  classId?: string;
  createdAt: Date;
}

export interface DebateParticipant {
  id: string;
  debateId: string;
  userId: string;
  side: DebateSide;
  role: 'debater' | 'judge' | 'audience';
  teamId?: string;
  isReady: boolean;
  joinedAt: Date;
}

export interface DebateArgument {
  id: string;
  debateId: string;
  participantId: string;
  roundNumber: number;
  argumentType: string;
  content: string;
  wordCount: number;
  submittedAt: Date;
  aiFeedback?: any;
}

export interface DebateEvaluation {
  id: string;
  debateId: string;
  evaluatorId?: string;
  evaluatorType: 'peer' | 'teacher' | 'ai';
  participantScores: any;
  winnerParticipantId?: string;
  bestArgumentId?: string;
  overallComments?: string;
  createdAt: Date;
}

export interface MatchRequest {
  userId: string;
  topicId?: string;
  preferredFormat?: DebateFormat;
  preferredSide?: DebateSide | 'any';
  gradeLevel: string;
  availableTimes?: any;
}

export interface MatchResult {
  matched: boolean;
  debateId?: string;
  opponent?: {
    userId: string;
    userName: string;
  };
  topic?: DebateTopic;
  yourSide?: DebateSide;
  estimatedWaitTime?: number;
}

// ============================================================================
// Service Configuration
// ============================================================================

interface DebateServiceConfig {
  supabaseUrl: string;
  supabaseKey: string;
  aiApiKey?: string; // For AI feedback
}

// ============================================================================
// Main Service Class
// ============================================================================

export class DebateService {
  private supabase: SupabaseClient;
  private config: DebateServiceConfig;

  constructor(config: DebateServiceConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  // --------------------------------------------------------------------------
  // Topic Management
  // --------------------------------------------------------------------------

  /**
   * Get all debate topics, optionally filtered
   */
  async getTopics(filters?: {
    category?: string;
    complexity?: string;
    gradeLevel?: string;
    search?: string;
  }): Promise<DebateTopic[]> {
    let query = this.supabase
      .from('debate_topics')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.complexity) {
      query = query.eq('complexity', filters.complexity);
    }

    if (filters?.search) {
      query = query.or(`topic.ilike.%${filters.search}%,topic_el.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(this.mapDbToTopic);
  }

  /**
   * Get a random topic matching criteria
   */
  async getRandomTopic(gradeLevel: string, complexity?: string): Promise<DebateTopic | null> {
    let query = this.supabase
      .from('debate_topics')
      .select('*')
      .eq('is_active', true);

    if (complexity) {
      query = query.eq('complexity', complexity);
    }

    // Filter by grade level compatibility
    // This is simplified - in production you'd want proper grade comparison
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Pick random topic
    const randomIndex = Math.floor(Math.random() * data.length);
    return this.mapDbToTopic(data[randomIndex]);
  }

  // --------------------------------------------------------------------------
  // Debate Creation & Management
  // --------------------------------------------------------------------------

  /**
   * Create a new debate
   */
  async createDebate(params: {
    topicId: string;
    format: DebateFormat;
    createdBy: string;
    isAsync?: boolean;
    scheduledAt?: Date;
    classId?: string;
  }): Promise<Debate> {
    const { data, error } = await this.supabase
      .from('debates')
      .insert({
        topic_id: params.topicId,
        format: params.format,
        status: 'scheduled',
        is_async: params.isAsync || false,
        scheduled_at: params.scheduledAt?.toISOString(),
        created_by: params.createdBy,
        class_id: params.classId
      })
      .select()
      .single();

    if (error) throw error;

    // Increment topic usage
    await this.supabase.rpc('increment_topic_usage', { topic_id: params.topicId });

    return this.mapDbToDebate(data);
  }

  /**
   * Get a debate by ID with full details
   */
  async getDebate(debateId: string): Promise<{
    debate: Debate;
    topic: DebateTopic;
    participants: DebateParticipant[];
    arguments: DebateArgument[];
  } | null> {
    const { data: debateData, error: debateError } = await this.supabase
      .from('debates')
      .select(`
        *,
        debate_topics(*),
        debate_participants(*),
        debate_arguments(*)
      `)
      .eq('id', debateId)
      .single();

    if (debateError) return null;

    return {
      debate: this.mapDbToDebate(debateData),
      topic: this.mapDbToTopic(debateData.debate_topics),
      participants: debateData.debate_participants.map(this.mapDbToParticipant),
      arguments: debateData.debate_arguments.map(this.mapDbToArgument)
    };
  }

  /**
   * Join a debate
   */
  async joinDebate(params: {
    debateId: string;
    userId: string;
    side: DebateSide;
    role?: 'debater' | 'judge' | 'audience';
  }): Promise<DebateParticipant> {
    // Check if already joined
    const { data: existing } = await this.supabase
      .from('debate_participants')
      .select('id')
      .eq('debate_id', params.debateId)
      .eq('user_id', params.userId)
      .single();

    if (existing) {
      throw new Error('Already joined this debate');
    }

    // Check side availability for debaters
    if (params.role !== 'audience') {
      const { data: sideCheck } = await this.supabase
        .from('debate_participants')
        .select('id')
        .eq('debate_id', params.debateId)
        .eq('side', params.side)
        .eq('role', 'debater');

      if (sideCheck && sideCheck.length > 0) {
        throw new Error('This side is already taken');
      }
    }

    const { data, error } = await this.supabase
      .from('debate_participants')
      .insert({
        debate_id: params.debateId,
        user_id: params.userId,
        side: params.side,
        role: params.role || 'debater',
        is_ready: false
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDbToParticipant(data);
  }

  /**
   * Set participant ready status
   */
  async setReady(participantId: string, isReady: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('debate_participants')
      .update({ is_ready: isReady })
      .eq('id', participantId);

    if (error) throw error;
  }

  /**
   * Start a debate (change status to in_progress)
   */
  async startDebate(debateId: string): Promise<void> {
    // Check all debaters are ready
    const { data: participants } = await this.supabase
      .from('debate_participants')
      .select('is_ready')
      .eq('debate_id', debateId)
      .eq('role', 'debater');

    const allReady = participants?.every(p => p.is_ready);
    if (!allReady) {
      throw new Error('Not all participants are ready');
    }

    const { error } = await this.supabase
      .from('debates')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', debateId);

    if (error) throw error;
  }

  /**
   * Complete a debate
   */
  async completeDebate(debateId: string, winnerId?: string): Promise<void> {
    const { error } = await this.supabase
      .from('debates')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        winner_participant_id: winnerId
      })
      .eq('id', debateId);

    if (error) throw error;
  }

  // --------------------------------------------------------------------------
  // Arguments
  // --------------------------------------------------------------------------

  /**
   * Submit an argument (for written debates)
   */
  async submitArgument(params: {
    debateId: string;
    participantId: string;
    roundNumber: number;
    argumentType: string;
    content: string;
  }): Promise<DebateArgument> {
    const wordCount = params.content.trim().split(/\s+/).filter(Boolean).length;

    const { data, error } = await this.supabase
      .from('debate_arguments')
      .insert({
        debate_id: params.debateId,
        participant_id: params.participantId,
        round_number: params.roundNumber,
        argument_type: params.argumentType,
        content: params.content,
        word_count: wordCount
      })
      .select()
      .single();

    if (error) throw error;

    const argument = this.mapDbToArgument(data);

    // Generate AI feedback asynchronously (don't await)
    this.generateAIFeedback(argument).catch(console.error);

    return argument;
  }

  /**
   * Get arguments for a debate
   */
  async getArguments(debateId: string): Promise<DebateArgument[]> {
    const { data, error } = await this.supabase
      .from('debate_arguments')
      .select('*')
      .eq('debate_id', debateId)
      .order('round_number')
      .order('submitted_at');

    if (error) throw error;
    return data.map(this.mapDbToArgument);
  }

  // --------------------------------------------------------------------------
  // Matching System
  // --------------------------------------------------------------------------

  /**
   * Request to be matched with an opponent
   */
  async requestMatch(request: MatchRequest): Promise<MatchResult> {
    // First, try to find an existing match
    const match = await this.findMatch(request);

    if (match) {
      return match;
    }

    // No match found, add to queue
    await this.addToMatchQueue(request);

    return {
      matched: false,
      estimatedWaitTime: 5 // minutes
    };
  }

  /**
   * Find a suitable match from the queue
   */
  private async findMatch(request: MatchRequest): Promise<MatchResult | null> {
    // Look for someone in queue with compatible criteria
    const { data: queueEntries, error } = await this.supabase
      .from('debate_match_queue')
      .select(`
        *,
        users:user_id(id, raw_user_meta_data)
      `)
      .eq('status', 'waiting')
      .eq('grade_level', request.gradeLevel)
      .neq('user_id', request.userId)
      .lt('expires_at', new Date().toISOString())
      .order('created_at')
      .limit(10);

    if (error || !queueEntries || queueEntries.length === 0) {
      return null;
    }

    // Find compatible match
    for (const entry of queueEntries) {
      // Check topic compatibility
      if (request.topicId && entry.topic_id && request.topicId !== entry.topic_id) {
        continue;
      }

      // Check format compatibility
      if (request.preferredFormat && entry.preferred_format && 
          request.preferredFormat !== entry.preferred_format) {
        continue;
      }

      // Check side compatibility
      if (request.preferredSide !== 'any' && entry.preferred_side !== 'any' &&
          request.preferredSide === entry.preferred_side) {
        continue; // Both want same side
      }

      // Found a match! Create the debate
      const topic = request.topicId 
        ? await this.getTopicById(request.topicId)
        : await this.getRandomTopic(request.gradeLevel);

      if (!topic) continue;

      // Determine sides
      let userSide: DebateSide;
      let opponentSide: DebateSide;

      if (request.preferredSide !== 'any') {
        userSide = request.preferredSide as DebateSide;
        opponentSide = userSide === 'affirmative' ? 'negative' : 'affirmative';
      } else if (entry.preferred_side !== 'any') {
        opponentSide = entry.preferred_side as DebateSide;
        userSide = opponentSide === 'affirmative' ? 'negative' : 'affirmative';
      } else {
        // Random assignment
        userSide = Math.random() > 0.5 ? 'affirmative' : 'negative';
        opponentSide = userSide === 'affirmative' ? 'negative' : 'affirmative';
      }

      // Create the debate
      const debate = await this.createDebate({
        topicId: topic.id,
        format: request.preferredFormat || entry.preferred_format || 'mini_debate',
        createdBy: request.userId,
        isAsync: (request.preferredFormat || entry.preferred_format) === 'written_exchange'
      });

      // Add both participants
      await this.joinDebate({
        debateId: debate.id,
        userId: request.userId,
        side: userSide
      });

      await this.joinDebate({
        debateId: debate.id,
        userId: entry.user_id,
        side: opponentSide
      });

      // Update queue entry
      await this.supabase
        .from('debate_match_queue')
        .update({ 
          status: 'matched',
          matched_debate_id: debate.id
        })
        .eq('id', entry.id);

      return {
        matched: true,
        debateId: debate.id,
        opponent: {
          userId: entry.user_id,
          userName: entry.users?.raw_user_meta_data?.full_name || 'Opponent'
        },
        topic,
        yourSide: userSide
      };
    }

    return null;
  }

  /**
   * Add user to match queue
   */
  private async addToMatchQueue(request: MatchRequest): Promise<void> {
    // Remove any existing queue entries for this user
    await this.supabase
      .from('debate_match_queue')
      .delete()
      .eq('user_id', request.userId)
      .eq('status', 'waiting');

    // Add new entry
    const { error } = await this.supabase
      .from('debate_match_queue')
      .insert({
        user_id: request.userId,
        topic_id: request.topicId,
        preferred_format: request.preferredFormat,
        preferred_side: request.preferredSide || 'any',
        grade_level: request.gradeLevel,
        available_times: request.availableTimes,
        status: 'waiting',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (error) throw error;
  }

  /**
   * Cancel match request
   */
  async cancelMatchRequest(userId: string): Promise<void> {
    await this.supabase
      .from('debate_match_queue')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'waiting');
  }

  // --------------------------------------------------------------------------
  // Evaluation
  // --------------------------------------------------------------------------

  /**
   * Submit an evaluation
   */
  async submitEvaluation(params: {
    debateId: string;
    evaluatorId?: string;
    evaluatorType: 'peer' | 'teacher' | 'ai';
    participantScores: any;
    winnerId?: string;
    comments?: string;
  }): Promise<DebateEvaluation> {
    const { data, error } = await this.supabase
      .from('debate_evaluations')
      .insert({
        debate_id: params.debateId,
        evaluator_id: params.evaluatorId,
        evaluator_type: params.evaluatorType,
        participant_scores: params.participantScores,
        winner_participant_id: params.winnerId,
        overall_comments: params.comments
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDbToEvaluation(data);
  }

  /**
   * Get evaluations for a debate
   */
  async getEvaluations(debateId: string): Promise<DebateEvaluation[]> {
    const { data, error } = await this.supabase
      .from('debate_evaluations')
      .select('*')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapDbToEvaluation);
  }

  // --------------------------------------------------------------------------
  // AI Feedback (for written arguments)
  // --------------------------------------------------------------------------

  /**
   * Generate AI feedback for an argument
   */
  private async generateAIFeedback(argument: DebateArgument): Promise<void> {
    if (!this.config.aiApiKey) return;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.aiApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Analyze this debate argument and provide constructive feedback for a student. 
            Be encouraging but also provide specific suggestions for improvement.
            
            Argument type: ${argument.argumentType}
            Content: ${argument.content}
            
            Provide feedback in JSON format with these fields:
            - structure: { score: 1-5, suggestions: [...] }
            - evidence: { score: 1-5, suggestions: [...] }
            - clarity: { score: 1-5, suggestions: [...] }
            - logic: { score: 1-5, suggestions: [...] }
            - overallScore: 1-5
            - encouragement: string (positive comment about what they did well)
            
            Keep suggestions brief and actionable. Max 2 suggestions per category.`
          }]
        })
      });

      if (!response.ok) return;

      const data = await response.json();
      const feedbackText = data.content[0].text;
      
      // Parse JSON from response
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;

      const feedback = JSON.parse(jsonMatch[0]);

      // Update argument with feedback
      await this.supabase
        .from('debate_arguments')
        .update({ ai_feedback: feedback })
        .eq('id', argument.id);

    } catch (error) {
      console.error('Failed to generate AI feedback:', error);
    }
  }

  // --------------------------------------------------------------------------
  // User Stats
  // --------------------------------------------------------------------------

  /**
   * Get debate statistics for a user
   */
  async getUserStats(userId: string): Promise<{
    totalDebates: number;
    wins: number;
    losses: number;
    draws: number;
    favoriteTopicCategory: string | null;
    averageScore: number;
    recentDebates: Debate[];
  }> {
    // Get all debates user participated in
    const { data: participations } = await this.supabase
      .from('debate_participants')
      .select(`
        id,
        side,
        debate:debate_id(
          id,
          topic_id,
          status,
          winner_participant_id,
          completed_at,
          debate_topics(category)
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'debater');

    if (!participations) {
      return {
        totalDebates: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        favoriteTopicCategory: null,
        averageScore: 0,
        recentDebates: []
      };
    }

    let wins = 0;
    let losses = 0;
    let draws = 0;
    const categoryCount: Record<string, number> = {};
    const completedDebates: any[] = [];

    for (const p of participations) {
      const debate = p.debate as any;
      if (!debate || debate.status !== 'completed') continue;

      completedDebates.push(debate);

      // Count wins/losses
      if (debate.winner_participant_id === p.id) {
        wins++;
      } else if (debate.winner_participant_id) {
        losses++;
      } else {
        draws++;
      }

      // Track categories
      const category = debate.debate_topics?.category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    }

    // Find favorite category
    let favoriteCategory: string | null = null;
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCount)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteCategory = cat;
      }
    }

    // Get evaluations for average score
    const { data: evaluations } = await this.supabase
      .from('debate_evaluations')
      .select('participant_scores')
      .in('debate_id', completedDebates.map(d => d.id));

    let totalScore = 0;
    let scoreCount = 0;

    if (evaluations) {
      for (const eval_ of evaluations) {
        const scores = eval_.participant_scores as any[];
        for (const score of scores || []) {
          if (score.criteria) {
            const criteriaValues = Object.values(score.criteria) as number[];
            const avg = criteriaValues.reduce((a, b) => a + b, 0) / criteriaValues.length;
            totalScore += avg;
            scoreCount++;
          }
        }
      }
    }

    return {
      totalDebates: participations.length,
      wins,
      losses,
      draws,
      favoriteTopicCategory: favoriteCategory,
      averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      recentDebates: completedDebates.slice(0, 5).map(this.mapDbToDebate)
    };
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async getTopicById(topicId: string): Promise<DebateTopic | null> {
    const { data, error } = await this.supabase
      .from('debate_topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (error) return null;
    return this.mapDbToTopic(data);
  }

  private mapDbToTopic(data: any): DebateTopic {
    return {
      id: data.id,
      topic: data.topic,
      topicEl: data.topic_el,
      category: data.category,
      complexity: data.complexity,
      gradeMin: data.grade_min,
      gradeMax: data.grade_max,
      backgroundInfo: data.background_info,
      backgroundInfoEl: data.background_info_el,
      affirmativePoints: data.affirmative_points || [],
      negativePoints: data.negative_points || []
    };
  }

  private mapDbToDebate(data: any): Debate {
    return {
      id: data.id,
      topicId: data.topic_id,
      format: data.format,
      status: data.status,
      isAsync: data.is_async,
      scheduledAt: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      recordingUrl: data.recording_url,
      transcript: data.transcript,
      winnerParticipantId: data.winner_participant_id,
      createdBy: data.created_by,
      classId: data.class_id,
      createdAt: new Date(data.created_at)
    };
  }

  private mapDbToParticipant(data: any): DebateParticipant {
    return {
      id: data.id,
      debateId: data.debate_id,
      userId: data.user_id,
      side: data.side,
      role: data.role,
      teamId: data.team_id,
      isReady: data.is_ready,
      joinedAt: new Date(data.joined_at)
    };
  }

  private mapDbToArgument(data: any): DebateArgument {
    return {
      id: data.id,
      debateId: data.debate_id,
      participantId: data.participant_id,
      roundNumber: data.round_number,
      argumentType: data.argument_type,
      content: data.content,
      wordCount: data.word_count,
      submittedAt: new Date(data.submitted_at),
      aiFeedback: data.ai_feedback
    };
  }

  private mapDbToEvaluation(data: any): DebateEvaluation {
    return {
      id: data.id,
      debateId: data.debate_id,
      evaluatorId: data.evaluator_id,
      evaluatorType: data.evaluator_type,
      participantScores: data.participant_scores,
      winnerParticipantId: data.winner_participant_id,
      bestArgumentId: data.best_argument_id,
      overallComments: data.overall_comments,
      createdAt: new Date(data.created_at)
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default DebateService;
