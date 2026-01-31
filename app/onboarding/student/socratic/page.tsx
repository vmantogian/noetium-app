'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * OPTION 3: "SOCRATIC DIALOGUE" - Conversational AI Onboarding
 * 
 * Philosophy: Let Νους interview the student naturally through conversation
 * Best for: All ages, especially those who value personalization
 * Aligns with Noetium's Socratic methodology
 * 
 * Flow:
 * 1. Chat interface with Νους
 * 2. Natural conversation collecting info
 * 3. Personalized dashboard based on conversation
 */

type Message = {
  id: string;
  role: 'nous' | 'student';
  content: string;
  timestamp: Date;
  showInput?: boolean;
  inputType?: 'text' | 'year' | 'subjects';
  options?: { value: string; label: string }[];
};

type ConversationState = {
  stage: 'greeting' | 'name' | 'grade' | 'subjects' | 'preferences' | 'complete';
  firstName: string;
  lastName: string;
  birthYear: number | null;
  grade: string | null;
  favoriteSubjects: string[];
  learningStyle: string;
};

const GRADE_MAPPING: Record<number, { grade: string; displayName: string }> = {
  2018: { grade: 'primary_1', displayName: 'Α\' Δημοτικού' },
  2017: { grade: 'primary_2', displayName: 'Β\' Δημοτικού' },
  2016: { grade: 'primary_3', displayName: 'Γ\' Δημοτικού' },
  2015: { grade: 'primary_4', displayName: 'Δ\' Δημοτικού' },
  2014: { grade: 'primary_5', displayName: 'Ε\' Δημοτικού' },
  2013: { grade: 'primary_6', displayName: 'ΣΤ\' Δημοτικού' },
  2012: { grade: 'gymnasium_1', displayName: 'Α\' Γυμνασίου' },
  2011: { grade: 'gymnasium_2', displayName: 'Β\' Γυμνασίου' },
  2010: { grade: 'gymnasium_3', displayName: 'Γ\' Γυμνασίου' },
  2009: { grade: 'lyceum_1', displayName: 'Α\' Λυκείου' },
  2008: { grade: 'lyceum_2', displayName: 'Β\' Λυκείου' },
  2007: { grade: 'lyceum_3', displayName: 'Γ\' Λυκείου' },
};

const SUBJECTS = [
  { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
  { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
  { id: 'ancient_greek', name: 'Αρχαία', icon: '🏛️' },
  { id: 'history', name: 'Ιστορία', icon: '📜' },
  { id: 'physics', name: 'Φυσική', icon: '⚡' },
  { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
  { id: 'biology', name: 'Βιολογία', icon: '🧬' },
  { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
  { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
  { id: 'art', name: 'Εικαστικά', icon: '🎨' },
  { id: 'music', name: 'Μουσική', icon: '🎵' },
  { id: 'ict', name: 'Πληροφορική', icon: '💻' },
];

export default function SocraticDialogueOnboarding() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({
    stage: 'greeting',
    firstName: '',
    lastName: '',
    birthYear: null,
    grade: null,
    favoriteSubjects: [],
    learningStyle: '',
  });
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    addNousMessage('Χαίρομαι που σε γνωρίζω! Είμαι ο Νους, ο προσωπικός σου βοηθός στη μάθηση. 🦉\n\nΠώς σε λένε;', true, 'text');
  }, []);

  const addNousMessage = (content: string, showInput: boolean = false, inputType: Message['inputType'] = 'text', options?: Message['options']) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const message: Message = {
        id: Date.now().toString(),
        role: 'nous',
        content,
        timestamp: new Date(),
        showInput,
        inputType,
        options,
      };
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
    }, 800);
  };

  const addStudentMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'student',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const handleTextInput = () => {
    if (!currentInput.trim()) return;

    addStudentMessage(currentInput);
    const input = currentInput.trim();
    setCurrentInput('');

    switch (conversationState.stage) {
      case 'greeting':
        // Expecting first name
        const names = input.split(' ');
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
        
        setConversationState(prev => ({ ...prev, firstName, lastName, stage: 'name' }));
        
        if (lastName) {
          addNousMessage(`Χαίρω πολύ, ${firstName}! Σε ποια τάξη πηγαίνεις;`, true, 'year');
        } else {
          addNousMessage(`Χαίρω πολύ, ${firstName}! Και το επώνυμό σου;`, true, 'text');
        }
        break;

      case 'name':
        // Expecting last name
        setConversationState(prev => ({ ...prev, lastName: input, stage: 'grade' }));
        addNousMessage(`Τέλεια, ${conversationState.firstName} ${input}! Σε ποια τάξη πηγαίνεις;`, true, 'year');
        break;
    }
  };

  const handleYearSelect = (year: number) => {
    const gradeInfo = GRADE_MAPPING[year];
    addStudentMessage(`${year} (${gradeInfo.displayName})`);
    
    setConversationState(prev => ({
      ...prev,
      birthYear: year,
      grade: gradeInfo.grade,
      stage: 'subjects',
    }));

    addNousMessage(
      `Τέλεια! Στην ${gradeInfo.displayName} μαθαίνετε πολύ ενδιαφέροντα πράγματα.\n\nΠοιο μάθημα σου αρέσει περισσότερο;`,
      true,
      'subjects'
    );
  };

  const toggleSubject = (subjectId: string) => {
    setConversationState(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects.includes(subjectId)
        ? prev.favoriteSubjects.filter(id => id !== subjectId)
        : [...prev.favoriteSubjects, subjectId]
    }));
  };

  const handleSubjectsConfirm = () => {
    if (conversationState.favoriteSubjects.length === 0) return;

    const selectedNames = conversationState.favoriteSubjects
      .map(id => SUBJECTS.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    addStudentMessage(selectedNames);

    setConversationState(prev => ({ ...prev, stage: 'preferences' }));

    addNousMessage(
      `Αυτό είναι υπέροχο! ${selectedNames.split(',')[0]} είναι πραγματικά συναρπαστικό!\n\nΘέλεις να σε βοηθήσω να οργανώσεις τη μελέτη σου ή προτιμάς να εξερευνήσεις νέα θέματα που σε ενδιαφέρουν;`,
      true,
      'text',
      [
        { value: 'organize', label: '📚 Οργάνωση μελέτης' },
        { value: 'explore', label: '🔍 Εξερεύνηση θεμάτων' },
        { value: 'both', label: '✨ Και τα δύο!' },
      ]
    );
  };

  const handlePreferenceSelect = async (preference: string) => {
    const labels = {
      organize: '📚 Οργάνωση μελέτης',
      explore: '🔍 Εξερεύνηση θεμάτων',
      both: '✨ Και τα δύο!',
    };

    addStudentMessage(labels[preference as keyof typeof labels]);
    
    setConversationState(prev => ({ ...prev, learningStyle: preference, stage: 'complete' }));

    addNousMessage('Τέλεια! Είμαι εδώ όποτε με χρειαστείς. Θα προετοιμάσω τώρα το περιβάλλον σου... 🚀', false);

    // Save to database
    await saveOnboarding(preference);
  };

  const saveOnboarding = async (learningStyle: string) => {
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({
          name: `${conversationState.firstName} ${conversationState.lastName}`,
          grade: conversationState.grade,
          grade_level: conversationState.grade,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Create student profile
      await supabase
        .from('student_profiles')
        .upsert({
          user_id: user.id,
          grade: conversationState.grade,
          favorite_subjects: conversationState.favoriteSubjects,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      // Create portfolio (ignore duplicate)
      const { error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          student_id: user.id,
          grade_level: conversationState.grade!,
        });

      if (portfolioError && portfolioError.code !== '23505') {
        console.warn('Portfolio creation warning:', portfolioError);
      }

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/student');
      }, 2000);

    } catch (err) {
      console.error('Onboarding error:', err);
      addNousMessage('Ωπ! Κάτι πήγε στραβά. Δοκίμασε ξανά;', true);
    } finally {
      setLoading(false);
    }
  };

  const years = Object.keys(GRADE_MAPPING).map(Number).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl h-[600px] md:h-[700px] shadow-2xl flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#2A50DF] to-[#25A1B0] text-white p-6 rounded-t-3xl flex items-center gap-4">
          <div className="text-5xl">🦉</div>
          <div>
            <h2 className="text-2xl font-bold">Νους</h2>
            <p className="text-sm opacity-90">Ο προσωπικός σου βοηθός</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'student'
                    ? 'bg-[#2A50DF] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          {messages.length > 0 && messages[messages.length - 1].showInput && (
            <div>
              {/* Text Input */}
              {messages[messages.length - 1].inputType === 'text' && !messages[messages.length - 1].options && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-gray-900"
                    placeholder="Γράψε την απάντησή σου..."
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    onClick={handleTextInput}
                    disabled={!currentInput.trim() || loading}
                    className="px-6 py-3 bg-[#2A50DF] text-white rounded-xl hover:bg-[#1E3DB8] transition-colors disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              )}

              {/* Year Selector */}
              {messages[messages.length - 1].inputType === 'year' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className="p-3 border-2 border-gray-200 rounded-xl hover:border-[#2A50DF] hover:bg-blue-50 transition-all text-center"
                      disabled={loading}
                    >
                      <div className="font-bold text-gray-900">{year}</div>
                      <div className="text-xs text-gray-500">
                        {GRADE_MAPPING[year].displayName}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Subject Selector */}
              {messages[messages.length - 1].inputType === 'subjects' && (
                <div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                    {SUBJECTS.map((subject) => {
                      const isSelected = conversationState.favoriteSubjects.includes(subject.id);
                      return (
                        <button
                          key={subject.id}
                          onClick={() => toggleSubject(subject.id)}
                          disabled={loading}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-[#2A50DF] bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{subject.icon}</div>
                          <div className={`text-xs ${isSelected ? 'text-[#2A50DF] font-medium' : 'text-gray-600'}`}>
                            {subject.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleSubjectsConfirm}
                    disabled={conversationState.favoriteSubjects.length === 0 || loading}
                    className="w-full px-6 py-3 bg-[#2A50DF] text-white rounded-xl hover:bg-[#1E3DB8] transition-colors disabled:opacity-50"
                  >
                    Συνέχεια ({conversationState.favoriteSubjects.length} επιλεγμένα)
                  </button>
                </div>
              )}

              {/* Options */}
              {messages[messages.length - 1].options && (
                <div className="space-y-2">
                  {messages[messages.length - 1].options!.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceSelect(option.value)}
                      disabled={loading}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#2A50DF] hover:bg-blue-50 transition-all text-left font-medium text-gray-900"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
