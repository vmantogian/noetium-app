'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// ============================================================================
// Types
// ============================================================================

interface Label {
  text: string;
  x: number;
  y: number;
}

interface Source {
  title: string;
  source: string;
  chapter?: string;
  similarity: number;
  displayName: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  imageUrl?: string;
  imageLabels?: Label[];
  imageSource?: string;
  isTextbook?: boolean;
  userImage?: string;
  userFileName?: string;
  isStreaming?: boolean;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
}

// ============================================================================
// Constants — Noetium Branding
// ============================================================================

const COLORS = {
  primary: '#2A50DF',
  primaryDark: '#1E3DB8',
  teal: '#25A1B0',
  pink: '#D9325C',
  dark: '#191308',
  bg: '#FAFBFC',
  cardBg: '#F0F4F8',
  blueBg: '#E8F4FF',
  tealBg: '#E6F7F8',
  pinkBg: '#FFE5DC',
};

const subjects: Subject[] = [
  { id: 'math', name: 'Μαθηματικά', icon: '🔢' },
  { id: 'physics', name: 'Φυσική', icon: '⚡' },
  { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
  { id: 'biology', name: 'Βιολογία', icon: '🧬' },
  { id: 'history', name: 'Ιστορία', icon: '📜' },
  { id: 'greek', name: 'Ελληνικά', icon: '📝' },
  { id: 'geography', name: 'Γεωγραφία', icon: '🌍' },
  { id: 'literature', name: 'Λογοτεχνία', icon: '📖' },
  { id: 'it', name: 'Πληροφορική', icon: '💻' },
  { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
  { id: 'general', name: 'Γενικά', icon: '💡' },
];

// ============================================================================
// Helpers
// ============================================================================

function stripImageTags(content: string): string {
  return content
    .replace(/\[ΕΙΚΟΝΑ\][\s\S]*?\[\/ΕΙΚΟΝΑ\]/g, '')
    .replace(/\[ΘΕΛΩ_ΕΙΚΟΝΑ:[^\]]+\]/g, '')
    .trim();
}

function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    'c_dim': 'Γ\' Δημοτικού', 'd_dim': 'Δ\' Δημοτικού',
    'e_dim': 'Ε\' Δημοτικού', 'st_dim': 'ΣΤ\' Δημοτικού',
    'a_gym': 'Α\' Γυμνασίου', 'b_gym': 'Β\' Γυμνασίου', 'c_gym': 'Γ\' Γυμνασίου',
    'a_lyk': 'Α\' Λυκείου', 'b_lyk': 'Β\' Λυκείου', 'c_lyk': 'Γ\' Λυκείου',
  };
  return labels[grade] || grade;
}

function getGradeLevel(grade: string): 'dimotiko' | 'gymnasio' | 'lykeio' {
  if (grade.includes('dim')) return 'dimotiko';
  if (grade.includes('lyk')) return 'lykeio';
  return 'gymnasio';
}

// ============================================================================
// LabeledImage — overlays Greek labels on generated images
// ============================================================================

function LabeledImage({ imageUrl, labels }: { imageUrl: string; labels: Label[] }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative inline-block max-w-full rounded-xl overflow-hidden shadow-lg">
      <img
        src={imageUrl}
        alt="Εκπαιδευτική εικόνα"
        className="max-w-full block"
        onLoad={() => setLoaded(true)}
      />
      {loaded && labels.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {labels.map((label, i) => (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${label.x}%`, top: `${label.y}%` }}
            >
              <span
                className="inline-block px-2 py-0.5 text-sm font-bold rounded-md shadow-md"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  color: COLORS.dark,
                  border: `2px solid ${COLORS.primary}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {label.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SourceBadge — shows textbook source inline
// ============================================================================

function SourceBadge({ sources, expanded, onToggle }: {
  sources: Source[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
        style={{
          backgroundColor: expanded ? COLORS.blueBg : 'rgba(42,80,223,0.08)',
          color: COLORS.primary,
        }}
      >
        📚 {sources.length} {sources.length === 1 ? 'πηγή' : 'πηγές'}
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div
              className="p-3 rounded-lg space-y-1.5"
              style={{ backgroundColor: COLORS.blueBg }}
            >
              <p className="text-xs font-semibold" style={{ color: COLORS.dark }}>
                Πηγές από σχολικά βιβλία:
              </p>
              {sources.map((s, i) => (
                <p key={i} className="text-xs truncate" style={{ color: COLORS.primary }}>
                  📖 {s.displayName || s.title || s.source}
                  {s.similarity > 0.7 && (
                    <span className="ml-1 opacity-60">• Υψηλή σχετικότητα</span>
                  )}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Quick prompts per grade level
// ============================================================================

function getQuickPrompts(gradeLevel: 'dimotiko' | 'gymnasio' | 'lykeio'): string[] {
  switch (gradeLevel) {
    case 'dimotiko':
      return [
        'Εξήγησέ μου σαν παραμύθι',
        'Δείξε μου μια εικόνα',
        'Γιατί;',
        'Δώσε μου παράδειγμα',
      ];
    case 'gymnasio':
      return [
        'Εξήγησέ μου πιο απλά',
        'Δείξε μου μια εικόνα',
        'Γιατί είναι σημαντικό;',
        'Δώσε μου παράδειγμα',
        'Βοήθησέ με βήμα-βήμα',
      ];
    case 'lykeio':
      return [
        'Εξήγησε αναλυτικά',
        'Πώς πέφτει στις εξετάσεις;',
        'Δώσε μου μια τυπική άσκηση',
        'Σύνδεσέ το με άλλα κεφάλαια',
        'Κάνε μου ανακεφαλαίωση',
      ];
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function ChatTutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subjects[0]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [expandedSources, setExpandedSources] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{
    preview: string;
    base64: string;
    name: string;
    type: string;
    isImage: boolean;
  } | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  // TODO: Fetch from user profile / Supabase
  const [userGrade] = useState('a_gym');
  const gradeLevel = getGradeLevel(userGrade);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatingImage]);

  // Welcome message
  useEffect(() => {
    const welcomeByGrade: Record<string, string> = {
      dimotiko: `Γεια σου! 👋 Είμαι το noetium, ο AI δάσκαλός σου!\n\nΘα σε βοηθήσω να μάθεις με ερωτήσεις και εικόνες. Ρώτα με ό,τι θέλεις! 📚`,
      gymnasio: `Γεια σου! 👋 Είμαι το noetium, ο AI δάσκαλός σου.\n\nΧρησιμοποιώ τη Σωκρατική μέθοδο — θα σε καθοδηγήσω να βρεις τις απαντήσεις μόνος σου. Μπορείς να μου στείλεις φωτογραφίες ασκήσεων ή αρχεία PDF!\n\nΤι θα ήθελες να μάθεις σήμερα; 📚`,
      lykeio: `Γεια σου! 👋 Είμαι το noetium AI.\n\nΕίμαι εδώ να σε βοηθήσω με τα μαθήματα και τις εξετάσεις. Μπορώ να αναλύσω ασκήσεις, να εξηγήσω θεωρία και να σε βοηθήσω με στρατηγικές εξετάσεων.\n\nΤι θέλεις να δούμε; 📚`,
    };

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeByGrade[gradeLevel],
        timestamp: new Date(),
      },
    ]);
  }, [gradeLevel]);

  // File handler (images + PDFs)
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Size check: 10MB max
    if (file.size > 10 * 1024 * 1024) {
      alert('Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 10MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      alert('Υποστηρίζονται μόνο εικόνες (JPG, PNG) και PDF αρχεία.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPendingFile({
        preview: isImage ? base64 : '',
        base64,
        name: file.name,
        type: file.type,
        isImage,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const removePendingFile = useCallback(() => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !pendingFile) || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (pendingFile?.isImage
        ? 'Τι βλέπεις σε αυτή την εικόνα;'
        : 'Βοήθησέ με με αυτό το αρχείο.'),
      timestamp: new Date(),
      userImage: pendingFile?.isImage ? pendingFile.preview : undefined,
      userFileName: pendingFile && !pendingFile.isImage ? pendingFile.name : undefined,
    };

    const assistantMessageId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
    ]);

    const fileToSend = pendingFile;
    setInput('');
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    try {
      const bodyPayload: Record<string, any> = {
        message: userMessage.content,
        subject: selectedSubject.id,
        grade: userGrade,
        conversationHistory: messages
          .slice(-10)
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content })),
      };

      if (fileToSend) {
        if (fileToSend.isImage) {
          bodyPayload.imageBase64 = fileToSend.base64;
        } else {
          bodyPayload.fileBase64 = fileToSend.base64;
          bodyPayload.fileType = fileToSend.type;
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let sources: Source[] = [];
        let imageUrl: string | null = null;
        let imageLabels: Label[] = [];
        let isTextbook = false;
        let imageSource = '';
        let rawContent = '';

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'sources':
                    sources = data.sources;
                    break;

                  case 'text':
                    rawContent += data.text;
                    const cleanContent = stripImageTags(rawContent);
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId ? { ...m, content: cleanContent } : m
                      )
                    );
                    break;

                  case 'generating_image':
                    setGeneratingImage(true);
                    break;

                  case 'image_with_labels':
                    imageUrl = data.imageUrl;
                    imageLabels = data.labels || [];
                    isTextbook = data.isTextbook || false;
                    imageSource = data.source || '';
                    setGeneratingImage(false);
                    break;

                  case 'image_error':
                    setGeneratingImage(false);
                    break;

                  case 'done':
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              isStreaming: false,
                              content: stripImageTags(rawContent),
                              sources: sources.length > 0 ? sources : undefined,
                              imageUrl: imageUrl || undefined,
                              imageLabels: imageLabels.length > 0 ? imageLabels : undefined,
                              isTextbook,
                              imageSource: imageSource || undefined,
                            }
                          : m
                      )
                    );
                    break;
                }
              } catch (_) {}
            }
          }
        }
      } else {
        const data = await response.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: stripImageTags(data.response || ''), isStreaming: false, sources: data.sources }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: 'Συγγνώμη, υπήρξε κάποιο πρόβλημα. Δοκίμασε ξανά!', isStreaming: false }
            : m
        )
      );
    } finally {
      setLoading(false);
      setGeneratingImage(false);
    }
  }, [input, pendingFile, loading, selectedSubject, messages, userGrade]);

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'restart',
        role: 'assistant',
        content: 'Ας ξεκινήσουμε από την αρχή! Τι θα ήθελες να μάθεις; 📚',
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = getQuickPrompts(gradeLevel);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg }}>
      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Left: back + avatar + name */}
            <div className="flex items-center gap-3">
              <Link
                href="/student"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Αρχική"
              >
                <svg className="w-5 h-5" style={{ color: COLORS.dark }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              <div
                className="w-9 h-9 rounded-full flex items-center justify-center p-1"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.teal})` }}
              >
                <Image src="/favicon.png" alt="" width={28} height={28} className="w-full h-full object-contain" />
              </div>

              <div className="leading-tight">
                <h1 className="font-semibold text-sm" style={{ color: COLORS.dark }}>
                  noetium AI
                </h1>
                <p className="text-xs text-gray-500">
                  {getGradeLabel(userGrade)} • Σωκρατική Μέθοδος
                </p>
              </div>
            </div>

            {/* Right: subject picker + clear */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium transition-all hover:shadow-md"
                  style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.teal})` }}
                >
                  <span>{selectedSubject.icon}</span>
                  <span className="hidden sm:inline">{selectedSubject.name}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${showSubjectPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showSubjectPicker && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowSubjectPicker(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 w-52 max-h-80 overflow-y-auto"
                      >
                        {subjects.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedSubject(s);
                              setShowSubjectPicker(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 transition-colors"
                            style={selectedSubject.id === s.id ? { backgroundColor: COLORS.blueBg } : {}}
                          >
                            <span className="text-lg">{s.icon}</span>
                            <span className="text-sm font-medium" style={{ color: COLORS.dark }}>
                              {s.name}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                title="Νέα συζήτηση"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MESSAGES ===== */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 pb-2">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] md:max-w-[75%] rounded-2xl ${
                  message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
                style={
                  message.role === 'user'
                    ? { background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, padding: '12px 16px' }
                    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
                }
              >
                {/* Assistant header */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.teal})` }}
                    >
                      <span className="text-[10px] text-white font-bold">n</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: COLORS.dark }}>
                      noetium
                    </span>
                    {message.isStreaming && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.teal }} />
                      </span>
                    )}
                  </div>
                )}

                {/* User uploaded image */}
                {message.userImage && (
                  <div className="mb-2">
                    <img
                      src={message.userImage}
                      alt="Φωτογραφία"
                      className="max-w-full rounded-lg max-h-56 object-contain"
                    />
                  </div>
                )}

                {/* User uploaded file (non-image) */}
                {message.userFileName && (
                  <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <span className="text-lg">📄</span>
                    <span className="text-sm text-white truncate">{message.userFileName}</span>
                  </div>
                )}

                {/* Message text */}
                <p
                  className="whitespace-pre-wrap text-[15px] leading-relaxed"
                  style={{ color: message.role === 'user' ? '#ffffff' : COLORS.dark }}
                >
                  {message.content || (message.isStreaming ? '' : '')}
                  {message.isStreaming && !message.content && (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: COLORS.primary, animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: COLORS.teal, animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: COLORS.pink, animationDelay: '300ms' }} />
                    </span>
                  )}
                </p>

                {/* Image result */}
                {message.imageUrl && (
                  <div className="mt-3">
                    {message.imageLabels && message.imageLabels.length > 0 ? (
                      <LabeledImage imageUrl={message.imageUrl} labels={message.imageLabels} />
                    ) : (
                      <img
                        src={message.imageUrl}
                        alt="Εκπαιδευτική εικόνα"
                        className="max-w-full rounded-xl shadow-lg"
                      />
                    )}
                    <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                      {message.isTextbook ? (
                        <>
                          📖 Από:{' '}
                          <span style={{ color: COLORS.primary, fontWeight: 600 }}>
                            {message.imageSource || 'Σχολικό βιβλίο'}
                          </span>
                        </>
                      ) : (
                        <>
                          🎨 Δημιουργήθηκε με AI
                          {message.imageLabels && message.imageLabels.length > 0 && ' • Ελληνικές ετικέτες'}
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Generating image spinner */}
                {message.isStreaming && generatingImage && (
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: `${COLORS.teal} transparent ${COLORS.teal} ${COLORS.teal}` }}
                    />
                    <span className="text-sm font-medium" style={{ color: COLORS.teal }}>
                      Αναζητώ εικόνα...
                    </span>
                  </div>
                )}

                {/* Sources */}
                {message.sources && message.sources.length > 0 && !message.isStreaming && (
                  <SourceBadge
                    sources={message.sources}
                    expanded={expandedSources === message.id}
                    onToggle={() => setExpandedSources(expandedSources === message.id ? null : message.id)}
                  />
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ===== PENDING FILE PREVIEW ===== */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border-t border-gray-100 px-4 py-2.5"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              {pendingFile.isImage ? (
                <img src={pendingFile.preview} alt="" className="h-14 w-14 object-cover rounded-lg shadow-sm" />
              ) : (
                <div
                  className="h-14 w-14 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: COLORS.pinkBg }}
                >
                  <span className="text-2xl">📄</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: COLORS.dark }}>
                  {pendingFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {pendingFile.isImage ? 'Εικόνα' : 'PDF'} — γράψε ερώτηση ή πάτα αποστολή
                </p>
              </div>
              <button onClick={removePendingFile} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== QUICK PROMPTS ===== */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                style={{
                  borderColor: '#e5e7eb',
                  color: COLORS.primary,
                  backgroundColor: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.blueBg;
                  e.currentTarget.style.borderColor = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== INPUT ===== */}
      <div className="bg-white border-t border-gray-100 p-3 pb-20 md:pb-3">
        <div className="max-w-4xl mx-auto flex gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            title="Ανέβασε εικόνα ή PDF"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={
              pendingFile
                ? pendingFile.isImage
                  ? 'Ρώτα για την εικόνα...'
                  : 'Ρώτα για το αρχείο...'
                : 'Ρώτα με ό,τι θέλεις...'
            }
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-shadow"
            style={{
              color: COLORS.dark,
              '--tw-ring-color': `${COLORS.primary}40`,
            } as any}
            disabled={loading}
          />

          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !pendingFile)}
            className="flex-shrink-0 p-2.5 rounded-xl text-white transition-all disabled:opacity-40"
            style={{
              background:
                loading || (!input.trim() && !pendingFile)
                  ? '#d1d5db'
                  : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.teal})`,
            }}
          >
            {loading ? (
              <div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {[
            { href: '/student', icon: '🏠', label: 'Αρχική', active: false },
            { href: '/enrichment', icon: '🌟', label: 'Μάθηση', active: false },
            { href: '/chat', icon: '🤖', label: 'AI', active: true },
            { href: '/profile', icon: '👤', label: 'Προφίλ', active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center px-3 py-1"
              style={{ color: item.active ? COLORS.primary : '#6b7280' }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
