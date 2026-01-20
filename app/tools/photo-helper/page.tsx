'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

const subjects = [
  { id: 'math', label: 'Μαθηματικά', icon: '🔢' },
  { id: 'physics', label: 'Φυσική', icon: '⚡' },
  { id: 'chemistry', label: 'Χημεία', icon: '🧪' },
  { id: 'biology', label: 'Βιολογία', icon: '🧬' },
  { id: 'greek', label: 'Ελληνικά', icon: '📝' },
  { id: 'history', label: 'Ιστορία', icon: '📜' },
  { id: 'geography', label: 'Γεωγραφία', icon: '🌍' },
  { id: 'other', label: 'Άλλο', icon: '📚' },
];

const gradeLevels = [
  { id: 'dimotiko', label: 'Δημοτικό' },
  { id: 'gymnasium', label: 'Γυμνάσιο' },
  { id: 'lykeio', label: 'Λύκειο' },
];

export default function PhotoHelperPage() {
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [selectedGrade, setSelectedGrade] = useState('gymnasium');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImageMimeType(file.type);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        // Store base64 for follow-up questions
        setImageBase64(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
      
      // Clear previous messages
      setMessages([]);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);
    
    // Add user message with image
    setMessages([
      { role: 'user', content: 'Ανέβασα μια άσκηση', image: imagePreview || undefined }
    ]);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('subject', selectedSubject);
      formData.append('gradeLevel', selectedGrade);
      formData.append('language', 'el');

      const response = await fetch('/api/tools/photo-helper', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.guidance }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Συγγνώμη, δεν μπόρεσα να αναλύσω την εικόνα. Δοκίμασε ξανά.' }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Υπήρξε κάποιο σφάλμα. Δοκίμασε ξανά.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim()) return;

    const question = followUpQuestion;
    setFollowUpQuestion('');
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: question }
    ]);

    setLoading(true);

    try {
      const response = await fetch('/api/tools/photo-helper', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          imageBase64,
          mimeType: imageMimeType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.answer }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setImage(null);
    setImagePreview(null);
    setMessages([]);
    setImageBase64(null);
    setImageMimeType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/student" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
            ← Πίσω
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">📸 Photo Helper</h1>
          <p className="text-gray-600">Ανέβασε φωτογραφία άσκησης και πάρε καθοδήγηση βήμα-βήμα</p>
        </div>

        {/* Subject & Grade Selection */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 mb-8"
          >
            {/* Subject */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Μάθημα</h2>
              <div className="grid grid-cols-4 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      selectedSubject === subject.id
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{subject.icon}</span>
                    <p className="text-xs text-gray-600 mt-1">{subject.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Grade */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Τάξη</h2>
              <div className="flex gap-3">
                {gradeLevels.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => setSelectedGrade(grade.id)}
                    className={`flex-1 p-3 rounded-xl text-center transition-all ${
                      selectedGrade === grade.id
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {grade.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ανέβασε Φωτογραφία</h2>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <span className="text-4xl">📷</span>
                  <p className="text-gray-600 mt-2">Κάνε κλικ για να επιλέξεις φωτογραφία</p>
                  <p className="text-gray-400 text-sm mt-1">ή σύρε και άφησε εδώ</p>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-xl max-h-64 object-contain bg-gray-100"
                    />
                    <button
                      onClick={resetSession}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-medium transition-all ${
                      loading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          ⏳
                        </motion.span>
                        Αναλύω την άσκηση...
                      </span>
                    ) : (
                      '🔍 Ανάλυσε την Άσκηση'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Reset button */}
            <button
              onClick={resetSession}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Νέα άσκηση
            </button>

            {/* Messages */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 max-h-[60vh] overflow-y-auto">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Uploaded"
                        className="w-full max-h-32 object-contain rounded-lg mb-2"
                      />
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 p-4 rounded-2xl">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Σκέφτομαι...
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Follow-up input */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFollowUp()}
                  placeholder="Ρώτησε κάτι άλλο..."
                  className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={handleFollowUp}
                  disabled={loading || !followUpQuestion.trim()}
                  className={`px-6 rounded-xl font-medium ${
                    loading || !followUpQuestion.trim()
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Ρώτα
                </button>
              </div>
              
              {/* Quick questions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  'Δεν καταλαβαίνω το πρώτο βήμα',
                  'Μπορείς να εξηγήσεις πιο απλά;',
                  'Τι τύπο χρειάζομαι;',
                  'Είμαι σε σωστό δρόμο;'
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setFollowUpQuestion(q);
                    }}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tips */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-yellow-50 rounded-2xl p-4 mt-6"
          >
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Tips</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Βεβαιώσου ότι η φωτογραφία είναι καθαρή και ευανάγνωστη</li>
              <li>• Περίλαβε όλη την εκφώνηση της άσκησης</li>
              <li>• Ο AI δεν θα σου δώσει την απάντηση - θα σε καθοδηγήσει να τη βρεις!</li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
