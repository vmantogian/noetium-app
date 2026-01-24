'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface Label {
  text: string;
  x: number;
  y: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: { title: string; source: string; similarity: number }[];
  imageUrl?: string;
  imageLabels?: Label[];
  imageSource?: string;
  isTextbook?: boolean;
  userImage?: string;
  isStreaming?: boolean;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// ============================================================================
// Helper: Strip image tags from content for display
// ============================================================================

function stripImageTags(content: string): string {
  return content
    .replace(/\[ΕΙΚΟΝΑ\][\s\S]*?\[\/ΕΙΚΟΝΑ\]/g, '')
    .replace(/\[ΘΕΛΩ_ΕΙΚΟΝΑ:[^\]]+\]/g, '')
    .trim();
}

// ============================================================================
// LabeledImage Component - Overlays Greek text on images
// ============================================================================

function LabeledImage({ imageUrl, labels }: { imageUrl: string; labels: Label[] }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative inline-block max-w-full">
      <img 
        src={imageUrl} 
        alt="Educational illustration" 
        className="max-w-full rounded-lg shadow-md"
        onLoad={() => setImageLoaded(true)}
      />
      
      {imageLoaded && labels && labels.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {labels.map((label, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${label.x}%`,
                top: `${label.y}%`,
              }}
            >
              <span 
                className="inline-block px-2 py-1 text-sm md:text-base font-bold rounded-lg shadow-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#1a1a1a',
                  border: '2px solid #7c3aed',
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
// Constants
// ============================================================================

const subjects: Subject[] = [
  { id: 'math', name: 'Μαθηματικά', icon: '🔢', color: 'bg-blue-500' },
  { id: 'physics', name: 'Φυσική', icon: '⚡', color: 'bg-purple-500' },
  { id: 'chemistry', name: 'Χημεία', icon: '🧪', color: 'bg-green-500' },
  { id: 'biology', name: 'Βιολογία', icon: '🧬', color: 'bg-pink-500' },
  { id: 'history', name: 'Ιστορία', icon: '📜', color: 'bg-amber-500' },
  { id: 'greek', name: 'Ελληνικά', icon: '📝', color: 'bg-cyan-500' },
  { id: 'geography', name: 'Γεωγραφία', icon: '🌍', color: 'bg-emerald-500' },
  { id: 'general', name: 'Γενικά', icon: '💡', color: 'bg-gray-500' },
];

const quickPrompts = [
  'Εξήγησέ μου σαν να είμαι 10 χρονών',
  'Δείξε μου μια εικόνα',
  'Γιατί είναι σημαντικό αυτό;',
  'Μπορείς να το απλοποιήσεις;',
  'Δώσε μου ένα παράδειγμα',
];

// ============================================================================
// Main Component
// ============================================================================

export default function ChatTutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subjects[0]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showSources, setShowSources] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Γεια σου! 👋 Είμαι ο Noetia, ο AI δάσκαλός σου.\n\nΧρησιμοποιώ τη Σωκρατική μέθοδο - αυτό σημαίνει ότι θα σε καθοδηγήσω να βρεις τις απαντήσεις μόνος σου με ερωτήσεις και hints!\n\nΈχω πρόσβαση στα ελληνικά σχολικά βιβλία και μπορώ να δημιουργήσω εικόνες με ελληνικές ετικέτες. Τι θα ήθελες να μάθεις σήμερα; 📚`,
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePendingImage = () => {
    setPendingImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !pendingImage) || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || 'Τι βλέπεις σε αυτή την εικόνα;',
      timestamp: new Date(),
      userImage: pendingImage || undefined
    };

    const assistantMessageId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, userMessage, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);
    
    const imageToSend = pendingImage;
    setInput('');
    setPendingImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          subject: selectedSubject.id,
          imageBase64: imageToSend,
          conversationHistory: messages.slice(-10).filter(m => !m.isStreaming).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let sources: any[] = [];
        let generatedImageUrl: string | null = null;
        let imageLabels: Label[] = [];
        let isTextbook = false;
        let imageSource = '';
        let rawContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'sources') {
                    sources = data.sources;
                  } else if (data.type === 'text') {
                    rawContent += data.text;
                    // IMPORTANT: Strip image tags during streaming for clean display
                    const cleanContent = stripImageTags(rawContent);
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, content: cleanContent }
                        : m
                    ));
                  } else if (data.type === 'generating_image') {
                    setGeneratingImage(true);
                  } else if (data.type === 'image_with_labels') {
                    generatedImageUrl = data.imageUrl;
                    imageLabels = data.labels || [];
                    isTextbook = data.isTextbook || false;
                    imageSource = data.source || (data.curriculumBased ? 'σχολικό βιβλίο' : '');
                    setGeneratingImage(false);
                  } else if (data.type === 'image') {
                    generatedImageUrl = data.imageUrl;
                    setGeneratingImage(false);
                  } else if (data.type === 'textbook_image') {
                    // Found existing textbook image description
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { 
                            ...m, 
                            content: stripImageTags(rawContent) + '\n\n📖 ' + data.description,
                          }
                        : m
                    ));
                  } else if (data.type === 'image_error') {
                    setGeneratingImage(false);
                  } else if (data.type === 'done') {
                    const finalContent = stripImageTags(rawContent);
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { 
                            ...m, 
                            isStreaming: false, 
                            sources: sources.length > 0 ? sources : undefined,
                            imageUrl: generatedImageUrl || undefined,
                            imageLabels: imageLabels.length > 0 ? imageLabels : undefined,
                            isTextbook: isTextbook,
                            imageSource: imageSource || undefined,
                            content: finalContent
                          }
                        : m
                    ));
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }
      } else {
        const data = await response.json();
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, content: stripImageTags(data.response || ''), isStreaming: false, sources: data.sources }
            : m
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: 'Συγγνώμη, υπήρξε κάποιο πρόβλημα. Δοκίμασε ξανά!', isStreaming: false }
          : m
      ));
    } finally {
      setLoading(false);
      setGeneratingImage(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Ας ξεκινήσουμε από την αρχή! Τι θα ήθελες να μάθεις; 📚`,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/student" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-xl">←</span>
              </Link>
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Noetia</h1>
                <p className="text-xs text-gray-600">AI Δάσκαλος • Σωκρατική Μέθοδος</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${selectedSubject.color} text-white`}
              >
                <span>{selectedSubject.icon}</span>
                <span className="text-sm font-medium hidden sm:inline">{selectedSubject.name}</span>
                <span>▼</span>
              </button>

              {showSubjectPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border p-2 z-10 w-48"
                >
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject);
                        setShowSubjectPicker(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                        selectedSubject.id === subject.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <span>{subject.icon}</span>
                      <span className="text-sm text-gray-900">{subject.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white border shadow-sm'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs text-gray-700 font-semibold">Noetia</span>
                    {message.sources && message.sources.length > 0 && (
                      <button
                        onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                        className="text-xs text-purple-600 hover:text-purple-800 ml-2 font-semibold"
                      >
                        📚 {message.sources.length} πηγές
                      </button>
                    )}
                    {message.isStreaming && (
                      <span className="text-xs text-purple-500 animate-pulse">●</span>
                    )}
                  </div>
                )}

                {/* User uploaded image */}
                {message.userImage && (
                  <div className="mb-3">
                    <img 
                      src={message.userImage} 
                      alt="Uploaded" 
                      className="max-w-full rounded-lg max-h-64 object-contain"
                    />
                  </div>
                )}

                {/* Message content */}
                <p className={`whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-white' : 'text-gray-900'
                }`}>
                  {message.content || (message.isStreaming ? '...' : '')}
                </p>

                {/* Image - AI generated (curriculum-accurate) */}
                {message.imageUrl && (
                  <div className="mt-4">
                    {message.imageLabels && message.imageLabels.length > 0 ? (
                      <LabeledImage 
                        imageUrl={message.imageUrl} 
                        labels={message.imageLabels} 
                      />
                    ) : (
                      <img 
                        src={message.imageUrl} 
                        alt="Educational illustration" 
                        className="max-w-full rounded-lg shadow-md"
                      />
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      🎨 Εικόνα με GPT-4o
                      {message.imageSource && ` • Βασισμένη σε: ${message.imageSource}`}
                    </p>
                  </div>
                )}

                {/* Generating image indicator */}
                {message.isStreaming && generatingImage && (
                  <div className="mt-3 flex items-center gap-2 text-purple-600">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-semibold">Δημιουργώ εικόνα...</span>
                  </div>
                )}
                
                {showSources === message.id && message.sources && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t"
                  >
                    <p className="font-semibold mb-1 text-gray-900 text-xs">Πηγές από σχολικά βιβλία:</p>
                    {message.sources.map((source, i) => (
                      <p key={i} className="truncate text-gray-700 text-xs">
                        {i + 1}. {source.title || source.source}
                      </p>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Pending Image Preview */}
      {pendingImage && (
        <div className="bg-white border-t px-4 py-2">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3">
              <img 
                src={pendingImage} 
                alt="To upload" 
                className="h-16 w-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">Εικόνα έτοιμη για αποστολή</p>
                <p className="text-xs text-gray-600">Γράψε μια ερώτηση ή πάτα αποστολή</p>
              </div>
              <button
                onClick={removePendingImage}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="bg-white border-t">
        <div className="container mx-auto max-w-4xl px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="flex-shrink-0 px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm hover:bg-gray-200 font-medium"
              >
                {prompt}
              </button>
            ))}
            <button
              onClick={clearChat}
              className="flex-shrink-0 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 font-medium"
            >
              🗑️ Νέα συζήτηση
            </button>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4 pb-20 md:pb-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              title="Ανέβασε εικόνα"
            >
              📷
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={pendingImage ? "Ρώτα για την εικόνα..." : "Ρώτα με οτιδήποτε..."}
              className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !pendingImage)}
              className={`px-6 rounded-xl font-medium ${
                loading || (!input.trim() && !pendingImage)
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {loading ? '...' : '📤'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          <Link href="/student" className="flex flex-col items-center px-3 py-1 text-gray-700">
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1 font-medium">Αρχική</span>
          </Link>
          <Link href="/enrichment" className="flex flex-col items-center px-3 py-1 text-gray-700">
            <span className="text-xl">🌟</span>
            <span className="text-xs mt-1 font-medium">Μάθηση</span>
          </Link>
          <Link href="/chat" className="flex flex-col items-center px-3 py-1 text-purple-600">
            <span className="text-xl">🤖</span>
            <span className="text-xs mt-1 font-medium">AI</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center px-3 py-1 text-gray-700">
            <span className="text-xl">👤</span>
            <span className="text-xs mt-1 font-medium">Προφίλ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
