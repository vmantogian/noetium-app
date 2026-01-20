'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

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
  'Δώσε μου ένα παράδειγμα',
  'Γιατί είναι σημαντικό αυτό;',
  'Μπορείς να το απλοποιήσεις;',
  'Ποιο είναι το επόμενο βήμα;',
];

export default function ChatTutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subjects[0]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Γεια σου! 👋 Είμαι ο Noetia, ο AI δάσκαλός σου.\n\nΧρησιμοποιώ τη Σωκρατική μέθοδο - αυτό σημαίνει ότι θα σε καθοδηγήσω να βρεις τις απαντήσεις μόνος σου με ερωτήσεις και hints!\n\nΤι θα ήθελες να μάθεις σήμερα; 📚`,
        timestamp: new Date()
      }]);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          subject: selectedSubject.id,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Συγγνώμη, υπήρξε κάποιο πρόβλημα. Δοκίμασε ξανά!',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
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
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h1 className="font-bold text-gray-800">Noetia</h1>
                <p className="text-xs text-gray-500">AI Δάσκαλος • Σωκρατική Μέθοδος</p>
              </div>
            </div>

            {/* Subject Picker */}
            <div className="relative">
              <button
                onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${selectedSubject.color} text-white`}
              >
                <span>{selectedSubject.icon}</span>
                <span className="text-sm font-medium">{selectedSubject.name}</span>
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
                      <span className="text-sm">{subject.name}</span>
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
                    <span className="text-xs text-gray-500">Noetia</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border shadow-sm p-4 rounded-2xl">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <span>🤔</span>
                  <span className="text-gray-500">Σκέφτομαι...</span>
                </motion.div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="bg-white border-t">
        <div className="container mx-auto max-w-4xl px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="flex-shrink-0 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
              >
                {prompt}
              </button>
            ))}
            <button
              onClick={clearChat}
              className="flex-shrink-0 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm hover:bg-red-200"
            >
              🗑️ Νέα συζήτηση
            </button>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ρώτα με οτιδήποτε..."
              className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`px-6 rounded-xl font-medium ${
                loading || !input.trim()
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {loading ? '...' : '📤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
