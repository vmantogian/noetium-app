'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type TabType = 'student' | 'teacher' | 'parent';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('student');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string, source?: string, followUp?: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentSource, setCurrentSource] = useState('');
  const [currentFollowUp, setCurrentFollowUp] = useState('');
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const MAX_QUESTIONS = 3;

  const studentFeatures = [
    { icon: '🧠', title: 'AI Tutor 24/7', description: 'Ρώτα ό,τι θέλεις, όποτε θέλεις. Το Noetium σε καθοδηγεί να βρεις τις απαντήσεις μόνος σου.', bg: 'bg-[#E8F4FF]' },
    { icon: '📊', title: 'Προσαρμοσμένο πρόγραμμα ανά μάθημα', description: 'Εντοπίζει τα κενά στις γνώσεις σου και προσαρμόζει το υλικό στις ανάγκες σου.', bg: 'bg-[#E8F4FF]' },
    { icon: '🎯', title: 'Ασκήσεις με feedback', description: 'Λύσε ασκήσεις και πάρε άμεση ανατροφοδότηση για να βελτιώνεσαι συνεχώς.', bg: 'bg-[#E8F4FF]' },
    { icon: '🚀', title: 'Μάθε κι εκτός σχολείου', description: 'Φιλοσοφικές συζητήσεις (debate), προγραμματισμός (coding), επιχειρηματικότητα και άλλα.', bg: 'bg-[#E8F4FF]' },
  ];

  const teacherFeatures = [
    { icon: '📝', title: 'Προετοιμασία μαθήματος', description: 'Δημιούργησε πλάνα μαθήματος και υλικό διδασκαλίας με τη βοήθεια AI.', bg: 'bg-[#E6F7F8]' },
    { icon: '⚡', title: 'Γεννήτρια ασκήσεων και θεμάτων', description: 'Φτιάξε ασκήσεις, διαγωνίσματα και φύλλα εργασίας αυτόματα.', bg: 'bg-[#E6F7F8]' },
    { icon: '📈', title: 'Παρακολούθηση προόδου', description: 'Προσαρμοσμένη διδασκαλία και αναλυτικά στατιστικά ανά μαθητή.', bg: 'bg-[#E6F7F8]' },
    { icon: '📷', title: 'Αυτόματη βαθμολόγηση', description: 'Φωτογράφισε γραπτά και πάρε αυτόματη βαθμολόγηση και σχόλια.', bg: 'bg-[#E6F7F8]' },
  ];

  const parentFeatures = [
    { icon: '👀', title: 'Παρακολούθηση προόδου παιδιών', description: 'Δες πώς τα πάει το παιδί σου σε κάθε μάθημα με απλά, κατανοητά γραφήματα.', bg: 'bg-[#FFE5DC]' },
    { icon: '🎯', title: 'Δημιουργία στόχων ανά μάθημα', description: 'Θέσε στόχους μαζί με το παιδί σου και παρακολούθησε την πρόοδο.', bg: 'bg-[#FFE5DC]' },
    { icon: '🏠', title: 'Εργαλεία διδασκαλίας στο σπίτι', description: 'Βοήθησε το παιδί σου στο διάβασμα με εργαλεία σχεδιασμένα για γονείς.', bg: 'bg-[#FFE5DC]' },
    { icon: '💡', title: 'Εξατομικευμένες προτάσεις', description: 'Λάβε προτάσεις ανάπτυξης προσαρμοσμένες στις ανάγκες του παιδιού σου.', bg: 'bg-[#FFE5DC]' },
  ];

  const getFeatures = () => {
    switch (activeTab) {
      case 'student': return studentFeatures;
      case 'teacher': return teacherFeatures;
      case 'parent': return parentFeatures;
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Demo responses with follow-up questions
  const demoResponses: Record<string, { text: string; source: string; followUp: string }> = {
    'Εξήγησέ μου τη φωτοσύνθεση': {
      text: 'Η φωτοσύνθεση είναι η διαδικασία με την οποία τα φυτά μετατρέπουν το φως του ήλιου σε τροφή. Χρησιμοποιούν διοξείδιο του άνθρακα (CO₂) και νερό (H₂O), και με τη βοήθεια της χλωροφύλλης παράγουν γλυκόζη και οξυγόνο.',
      source: '📖 Βιολογία Α\' Γυμνασίου, Κεφ. 2',
      followUp: '💡 Θέλεις να σου δημιουργήσω μια εικόνα που δείχνει τη διαδικασία της φωτοσύνθεσης;',
    },
    'Τι είναι το Πυθαγόρειο θεώρημα;': {
      text: 'Το Πυθαγόρειο θεώρημα λέει ότι σε ένα ορθογώνιο τρίγωνο, το τετράγωνο της υποτείνουσας ισούται με το άθροισμα των τετραγώνων των κάθετων πλευρών: α² + β² = γ². Για παράδειγμα, αν οι κάθετες είναι 3 και 4, η υποτείνουσα είναι 5.',
      source: '📖 Μαθηματικά Β\' Γυμνασίου, Κεφ. 5',
      followUp: '💡 Θέλεις να λύσουμε μαζί μια άσκηση με το Πυθαγόρειο θεώρημα;',
    },
    'Γιατί έγινε η Επανάσταση του 1821;': {
      text: 'Η Ελληνική Επανάσταση ξέσπασε λόγω της επιθυμίας των Ελλήνων για ελευθερία μετά από 400 χρόνια Οθωμανικής κυριαρχίας. Σημαντικοί παράγοντες ήταν η διατήρηση της γλώσσας και θρησκείας, η επίδραση του Διαφωτισμού, και η Φιλική Εταιρεία.',
      source: '📖 Ιστορία Γ\' Γυμνασίου, Κεφ. 1',
      followUp: '💡 Θέλεις να μάθεις για τον ρόλο της Φιλικής Εταιρείας και πώς οργανώθηκε η Επανάσταση;',
    },
  };

  // Word-by-word typing effect - SLOWER
  useEffect(() => {
    if (isTyping && displayedText) {
      const words = displayedText.split(' ');
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex < words.length) {
          setChatMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
              lastMsg.text = words.slice(0, currentIndex + 1).join(' ');
            }
            return newMessages;
          });
          currentIndex++;
          
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setChatMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg && lastMsg.role === 'ai') {
                lastMsg.source = currentSource;
                lastMsg.followUp = currentFollowUp;
              }
              return newMessages;
            });
            setIsTyping(false);
            setDisplayedText('');
            setCurrentSource('');
            setCurrentFollowUp('');
          }, 300);
        }
      }, 80); // SLOWER - was 50ms, now 80ms

      return () => clearInterval(interval);
    }
  }, [isTyping, displayedText, currentSource, currentFollowUp]);

  const handleSendMessage = async (message: string) => {
    if (questionsUsed >= MAX_QUESTIONS || !message.trim() || isTyping) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput('');
    setQuestionsUsed(prev => prev + 1);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Better fallback response
    const response = demoResponses[message] || {
      text: 'Ευχαριστώ για την ερώτηση! Δημιούργησε έναν δωρεάν λογαριασμό για να απαντήσω σε οποιαδήποτε ερώτηση έχεις από τα σχολικά βιβλία. Μπορώ επίσης να δημιουργήσω εικόνες, να σου εξηγήσω έννοιες βήμα-βήμα, και να σε βοηθήσω με ασκήσεις!',
      source: '📖 500,000+ σελίδες από σχολικά βιβλία',
      followUp: '💡 Δοκίμασε να ρωτήσεις για τη φωτοσύνθεση, το Πυθαγόρειο θεώρημα, ή την Επανάσταση του 1821!',
    };
    
    setChatMessages(prev => [...prev, { role: 'ai', text: '' }]);
    setDisplayedText(response.text);
    setCurrentSource(response.source);
    setCurrentFollowUp(response.followUp);
    setIsTyping(true);
  };

  return (
    <main className="min-h-screen bg-[#FAFBFC]">
      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo - h-22 (88px) */}
            <Link href="/" className="flex items-center">
              <Image src="/logo.svg" alt="noetium AI" width={320} height={88} className="h-[88px] w-auto" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-700 hover:text-[#2A50DF] font-medium transition-colors">
                  Εξερεύνησε
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button onClick={() => { setActiveTab('student'); scrollToSection('audiences'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#E8F4FF] transition-colors text-left">
                    <span className="text-2xl">👨‍🎓</span>
                    <div>
                      <div className="font-semibold text-gray-900">Για Μαθητές</div>
                      <div className="text-sm text-gray-500">AI Tutor & Ασκήσεις</div>
                    </div>
                  </button>
                  <button onClick={() => { setActiveTab('teacher'); scrollToSection('audiences'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#E8F4FF] transition-colors text-left">
                    <span className="text-2xl">👩‍🏫</span>
                    <div>
                      <div className="font-semibold text-gray-900">Για Εκπαιδευτικούς</div>
                      <div className="text-sm text-gray-500">Εργαλεία & Analytics</div>
                    </div>
                  </button>
                  <button onClick={() => { setActiveTab('parent'); scrollToSection('audiences'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#E8F4FF] transition-colors text-left">
                    <span className="text-2xl">👨‍👩‍👧</span>
                    <div>
                      <div className="font-semibold text-gray-900">Για Γονείς</div>
                      <div className="text-sm text-gray-500">Παρακολούθηση προόδου</div>
                    </div>
                  </button>
                </div>
              </div>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 hover:text-[#2A50DF] font-medium transition-colors">
                Πώς λειτουργεί
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block text-gray-700 hover:text-[#2A50DF] font-medium transition-colors">
                Σύνδεση
              </Link>
              <Link href="/signup" className="px-5 py-2.5 bg-[#2A50DF] hover:bg-[#1E3DB8] text-white font-semibold rounded-full transition-all hover:shadow-lg hover:shadow-[#2A50DF]/25">
                Δοκίμασέ το
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO + DEMO ========== */}
      <section className="relative min-h-screen pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#E8F4FF] rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-[#FFE5DC] rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#E6F7F8] rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-semibold text-4xl sm:text-5xl lg:text-6xl text-[#191308] leading-tight mb-6">
                Μάθε οτιδήποτε με τον{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A50DF] via-[#25A1B0] to-[#D9325C]">
                  προσωπικό σου AI δάσκαλο
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Για μαθητές, εκπαιδευτικούς και γονείς. Το πρώτο εργαλείο AI εκπαιδευμένο στα ελληνικά σχολικά βιβλία.
              </p>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <span className="text-[#25A1B0]">✓</span>
                  Από Α&apos; Δημοτικού έως Γ&apos; Λυκείου
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <span className="text-[#2A50DF]">✓</span>
                  Καθοδήγηση στην απάντηση
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <span className="text-[#D9325C]">✓</span>
                  100% στα ελληνικά
                </div>
              </div>
            </div>

            {/* Demo Chat */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#2A50DF] to-[#25A1B0] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5">
                      <Image src="/favicon.png" alt="" width={32} height={32} className="w-full h-full object-contain animate-[spin_4s_ease-in-out_infinite]" />
                    </div>
                    <div>
                      {/* lowercase noetium */}
                      <h3 className="text-white font-semibold">noetium AI Tutor</h3>
                      <p className="text-white/90 text-sm">Δοκίμασέ το τώρα • {MAX_QUESTIONS - questionsUsed} ερωτήσεις δωρεάν</p>
                    </div>
                  </div>
                </div>

                <div ref={chatRef} className="h-96 p-6 bg-gradient-to-b from-gray-50/50 to-white overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-4 animate-bounce">👋</div>
                      <p className="text-gray-700 mb-6 font-medium">Γεια σου! Ρώτησέ με κάτι ή δοκίμασε:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {Object.keys(demoResponses).map((q) => (
                          <button 
                            key={q}
                            onClick={() => handleSendMessage(q)}
                            disabled={questionsUsed >= MAX_QUESTIONS || isTyping}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:border-[#2A50DF] hover:text-[#2A50DF] transition-all hover:shadow-md disabled:opacity-50"
                          >
                            {q.includes('φωτοσύνθεση') ? '🌱' : q.includes('Πυθαγόρειο') ? '📐' : '📚'} {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#2A50DF] text-white rounded-2xl rounded-br-md px-4 py-3' : ''}`}>
                            {msg.role === 'ai' ? (
                              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                                <p className="text-gray-800 whitespace-pre-line">{msg.text}{isTyping && i === chatMessages.length - 1 && <span className="animate-pulse">▋</span>}</p>
                                {msg.source && (
                                  <p className="text-xs text-[#25A1B0] mt-2 font-medium">{msg.source}</p>
                                )}
                                {msg.followUp && (
                                  <p className="text-sm text-[#2A50DF] mt-3 font-medium">{msg.followUp}</p>
                                )}
                              </div>
                            ) : (
                              <p className="whitespace-pre-line">{msg.text}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100">
                  {questionsUsed < MAX_QUESTIONS ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Γράψε την ερώτησή σου..."
                        disabled={isTyping}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2A50DF] focus:ring-2 focus:ring-[#2A50DF]/20 text-gray-800 disabled:opacity-50"
                      />
                      <button type="submit" disabled={!chatInput.trim() || isTyping} className="px-6 py-3 bg-[#2A50DF] hover:bg-[#1E3DB8] text-white font-semibold rounded-xl transition-all hover:shadow-lg disabled:opacity-50">
                        Στείλε
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-gray-700 mb-3">Σου άρεσε; Συνέχισε δωρεάν!</p>
                      <Link href="/signup" className="inline-block px-6 py-3 bg-gradient-to-r from-[#D9325C] to-[#2A50DF] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                        Δημιούργησε δωρεάν λογαριασμό
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#FFE5DC] rounded-2xl -z-10 rotate-12"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#E8F4FF] rounded-2xl -z-10 -rotate-12"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AUDIENCE TABS ========== */}
      <section id="audiences" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-semibold text-3xl sm:text-4xl text-[#191308]">Δυνατότητες σχεδιασμένες για όλους</h2>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 rounded-2xl p-1.5">
              {(['student', 'teacher', 'parent'] as TabType[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === tab ? 'bg-white text-[#191308] shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                  <span className="text-xl">{tab === 'student' ? '👨‍🎓' : tab === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}</span>
                  <span className="hidden sm:inline">{tab === 'student' ? 'Για Μαθητές' : tab === 'teacher' ? 'Για Εκπαιδευτικούς' : 'Για Γονείς'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid - SAME SIZE BOXES */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getFeatures().map((feature, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-transparent transition-all h-[280px] flex flex-col">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 flex-shrink-0 ${feature.bg}`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg text-[#191308] mb-2 min-h-[56px] flex items-start">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-[#2A50DF] text-white font-semibold rounded-full transition-all hover:shadow-xl hover:bg-[#1E3DB8]">
              Ξεκίνα τώρα
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#F0F4F8] to-white overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-semibold text-3xl sm:text-4xl text-[#191308] mb-4">Πώς λειτουργεί</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Η τεχνολογία πίσω από τον AI δάσκαλό σου</p>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#2A50DF] via-[#25A1B0] to-[#D9325C] hidden md:block"></div>
            <div className="space-y-12">
              {[
                { num: '01', icon: '📚', title: 'Ελληνικό γνωσιακό υπόβαθρο', desc: 'Το noetium AI αντλεί γνώση απ\' όλα τα επίσημα σχολικά βιβλία, μαζί με χιλιάδες επιπλέον ελληνικά κείμενα και περιεχόμενο.' },
                { num: '02', icon: '🔍', title: 'Στοχευμένη αναζήτηση', desc: 'Όταν ρωτάς κάτι, το σύστημα βρίσκει αμέσως το πιο σχετικό υλικό από τα σχολικά βιβλία για να σου δώσει ακριβείς πληροφορίες.' },
                { num: '03', icon: '💬', title: 'Βήμα-βήμα στην απάντηση', desc: 'Αντί να σου δίνει την απάντηση, σε καθοδηγεί με στοχευμένες ερωτήσεις. Χτίζεις πραγματική κατανόηση, όχι απλή απομνημόνευση.' },
                { num: '04', icon: '🎯', title: 'Μνήμη και προσαρμοσμένη μάθηση', desc: 'Το σύστημα μαθαίνει τα δυνατά και αδύνατα σημεία σου, προσαρμόζοντας τις ασκήσεις και τις εξηγήσεις στο επίπεδό σου.' },
              ].map((step) => (
                <div key={step.num} className="relative flex gap-8 items-start">
                  <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#2A50DF] to-[#25A1B0] items-center justify-center text-white font-semibold text-lg z-10">{step.num}</div>
                  <div className="flex-1 bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <h3 className="font-semibold text-xl text-[#191308] mb-3 flex items-center gap-3"><span className="text-3xl">{step.icon}</span>{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHY NOETIUM - SAME SIZE BOXES ========== */}
      <section id="why-noetium" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-semibold text-3xl sm:text-4xl text-[#191308] mb-4">
              Γιατί <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A50DF] via-[#25A1B0] to-[#D9325C]">noetium AI</span>;
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Τεχνολογία που αλλάζει τον τρόπο που μαθαίνουμε στην Ελλάδα</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { color: '#2A50DF', title: 'Εκπαιδευμένο στα ελληνικά', desc: 'Το μοναδικό AI εκπαιδευμένο σε όλα τα ελληνικά σχολικά βιβλία από Α\' Δημοτικού έως Γ\' Λυκείου.', stat: '500,000+', label: 'σελίδες υλικού', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { color: '#25A1B0', title: 'Καθοδήγηση στην απάντηση', desc: 'Δεν δίνει έτοιμες απαντήσεις. Καθοδηγεί τον μαθητή να ανακαλύψει τη γνώση μόνος του.', stat: '↑ 40%', label: 'καλύτερη κατανόηση', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { color: '#D9325C', title: 'Εξατομικευμένη διδασκαλία', desc: 'Εντοπίζει κενά, προσαρμόζει το επίπεδο δυσκολίας και επιταχύνει τη μάθηση.', stat: '24/7', label: 'διαθεσιμότητα', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            ].map((card, i) => (
              <div key={i} className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all group overflow-hidden h-[380px] flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: card.color }}></div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={card.icon} /></svg>
                </div>
                <h3 className="font-semibold text-xl text-[#191308] mb-3">{card.title}</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">{card.desc}</p>
                <div className="pt-6 border-t border-gray-100 mt-auto">
                  <div className="font-semibold text-3xl" style={{ color: card.color }}>{card.stat}</div>
                  <div className="text-sm text-gray-500">{card.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 bg-gradient-to-r from-[#2A50DF] to-[#25A1B0]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-semibold text-3xl sm:text-4xl text-white mb-6">Έτοιμος να ξεκινήσεις;</h2>
          <p className="text-xl text-white/90 mb-8">Δημιούργησε δωρεάν λογαριασμό και ανακάλυψε έναν νέο τρόπο μάθησης και διδασκαλίας.</p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-white text-[#2A50DF] font-semibold rounded-full hover:shadow-2xl hover:shadow-white/25 transition-all text-lg">Ξεκίνα δωρεάν τώρα</Link>
        </div>
      </section>

      {/* ========== FOOTER - h-20 (80px) LOGO ========== */}
      <footer className="bg-[#191308] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <Image src="/logo.svg" alt="noetium AI" width={300} height={80} className="h-[80px] w-auto brightness-0 invert" />
              </div>
              <p className="text-gray-400 max-w-md">Το πρώτο εργαλείο AI εκπαιδευμένο στα ελληνικά σχολικά βιβλία. Για μαθητές, εκπαιδευτικούς και γονείς.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Πλατφόρμα</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Για Μαθητές</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Για Εκπαιδευτικούς</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Για Γονείς</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Εταιρεία</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Σχετικά</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Επικοινωνία</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Απόρρητο</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Όροι χρήσης</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10">
            <p className="text-gray-500 text-sm text-center">© 2026 noetium AI. Με επιφύλαξη παντός δικαιώματος.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
