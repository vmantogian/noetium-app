'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  category: string[];
  isNew?: boolean;
  /** Required, not optional: a tool added without a built page must not become a dead link. */
  status: 'ready' | 'coming-soon';
}

const tools: Tool[] = [
  // Plan
  {
    id: 'lesson-plan',
    name: 'Σχέδιο Μαθήματος',
    nameEn: 'Lesson Plan',
    description: 'Δημιουργήστε δομημένα σχέδια μαθήματος προσαρμοσμένα στο πρόγραμμα σπουδών',
    icon: '📝',
    color: 'bg-purple-100',
    href: '/teacher/tools/lesson-plan',
    category: ['plan'],
    status: 'ready',
  },
  {
    id: 'lesson-hook',
    name: 'Εισαγωγή Μαθήματος',
    nameEn: 'Lesson Hook',
    description: 'Σχεδιάστε συναρπαστικές εισαγωγές για να κεντρίσετε το ενδιαφέρον',
    icon: '⚓',
    color: 'bg-indigo-100',
    href: '/teacher/tools/lesson-hook',
    category: ['plan'],
    status: 'coming-soon',
  },
  {
    id: 'learning-objectives',
    name: 'Μαθησιακοί Στόχοι',
    nameEn: 'Learning Objectives',
    description: 'Αναπτύξτε σαφείς, μετρήσιμους στόχους μάθησης',
    icon: '🎯',
    color: 'bg-blue-100',
    href: '/teacher/tools/learning-objectives',
    category: ['plan'],
    status: 'coming-soon',
  },
  // Create
  {
    id: 'exercise-generator',
    name: 'Γεννήτρια Ασκήσεων',
    nameEn: 'Exercise Generator',
    description: 'Δημιουργήστε παραμετρικές ασκήσεις με πολλαπλές παραλλαγές',
    icon: '🔢',
    color: 'bg-green-100',
    href: '/teacher/tools/exercise-generator',
    category: ['create'],
    isNew: true,
    status: 'ready',
  },
  {
    id: 'quiz-creator',
    name: 'Δημιουργία Quiz',
    nameEn: 'Quiz Creator',
    description: 'Φτιάξτε τεστ πολλαπλής επιλογής για κάθε θέμα',
    icon: '✅',
    color: 'bg-emerald-100',
    href: '/teacher/tools/quiz-creator',
    category: ['create'],
    status: 'coming-soon',
  },
  {
    id: 'questions-generator',
    name: 'Γεννήτρια Ερωτήσεων',
    nameEn: 'Questions Generator',
    description: 'Δημιουργήστε ερωτήσεις κατανόησης για κείμενα',
    icon: '❓',
    color: 'bg-teal-100',
    href: '/teacher/tools/questions-generator',
    category: ['create'],
    status: 'coming-soon',
  },
  {
    id: 'informational-text',
    name: 'Πληροφοριακό Κείμενο',
    nameEn: 'Informational Text',
    description: 'Δημιουργήστε εκπαιδευτικά κείμενα για διάφορα θέματα',
    icon: '📄',
    color: 'bg-lime-100',
    href: '/teacher/tools/informational-text',
    category: ['create'],
    status: 'coming-soon',
  },
  // Differentiate
  {
    id: 'leveler',
    name: 'Προσαρμογή Επιπέδου',
    nameEn: 'Leveler',
    description: 'Προσαρμόστε την πολυπλοκότητα κειμένων στο επίπεδο των μαθητών',
    icon: '📊',
    color: 'bg-rose-100',
    href: '/teacher/tools/leveler',
    category: ['differentiate'],
    status: 'ready',
  },
  {
    id: 'alternative-explanations',
    name: 'Εναλλακτικές Εξηγήσεις',
    nameEn: 'Alternative Explanations',
    description: 'Λάβετε διαφορετικούς τρόπους εξήγησης δύσκολων εννοιών',
    icon: '💡',
    color: 'bg-amber-100',
    href: '/teacher/tools/alternative-explanations',
    category: ['differentiate'],
    isNew: true,
    status: 'coming-soon',
  },
  {
    id: 'chunk-text',
    name: 'Διαίρεση Κειμένου',
    nameEn: 'Chunk Text',
    description: 'Χωρίστε σύνθετα κείμενα σε διαχειρίσιμα τμήματα',
    icon: '✂️',
    color: 'bg-orange-100',
    href: '/teacher/tools/chunk-text',
    category: ['differentiate'],
    status: 'coming-soon',
  },
  // Grade & Assess
  {
    id: 'photo-grader',
    name: 'Βαθμολόγηση από Φωτό',
    nameEn: 'Photo Grader',
    description: 'Βαθμολογήστε εργασίες από φωτογραφία με AI ανάλυση',
    icon: '📸',
    color: 'bg-pink-100',
    href: '/teacher/tools/photo-grader',
    category: ['assess'],
    isNew: true,
    status: 'ready',
  },
  {
    id: 'rubric-generator',
    name: 'Δημιουργία Ρουμπρίκας',
    nameEn: 'Rubric Generator',
    description: 'Σχεδιάστε αναλυτικές ρουμπρίκες αξιολόγησης',
    icon: '📋',
    color: 'bg-fuchsia-100',
    href: '/teacher/tools/rubric-generator',
    category: ['assess'],
    status: 'coming-soon',
  },
  {
    id: 'report-comments',
    name: 'Σχόλια Ελέγχου',
    nameEn: 'Report Comments',
    description: 'Δημιουργήστε εξατομικευμένα σχόλια προόδου',
    icon: '💬',
    color: 'bg-violet-100',
    href: '/teacher/tools/report-comments',
    category: ['assess'],
    status: 'coming-soon',
  },
  // Support
  {
    id: 'clear-directions',
    name: 'Σαφείς Οδηγίες',
    nameEn: 'Clear Directions',
    description: 'Γράψτε κατανοητές οδηγίες για εργασίες',
    icon: '📢',
    color: 'bg-cyan-100',
    href: '/teacher/tools/clear-directions',
    category: ['support'],
    status: 'coming-soon',
  },
  {
    id: 'parent-newsletter',
    name: 'Ενημερωτικό Γονέων',
    nameEn: 'Parent Newsletter',
    description: 'Δημιουργήστε ενημερωτικά δελτία για γονείς',
    icon: '📰',
    color: 'bg-sky-100',
    href: '/teacher/tools/parent-newsletter',
    category: ['support'],
    status: 'coming-soon',
  },
  {
    id: 'recommendation-letter',
    name: 'Συστατική Επιστολή',
    nameEn: 'Recommendation Letter',
    description: 'Συντάξτε εξατομικευμένες συστατικές επιστολές',
    icon: '✉️',
    color: 'bg-slate-100',
    href: '/teacher/tools/recommendation-letter',
    category: ['support'],
    status: 'coming-soon',
  },
  // Students
  {
    id: 'student-progress',
    name: 'Πρόοδος Μαθητών',
    nameEn: 'Student Progress',
    description: 'Παρακολουθήστε την πρόοδο και τις τάσεις των μαθητών σας',
    icon: '📈',
    color: 'bg-yellow-100',
    href: '/teacher/students',
    category: ['students'],
    status: 'ready',
  },
  {
    id: 'class-snapshot',
    name: 'Εικόνα Τάξης',
    nameEn: 'Class Snapshot',
    description: 'Δείτε μια συνολική εικόνα της απόδοσης της τάξης',
    icon: '👥',
    color: 'bg-red-100',
    href: '/teacher/class-snapshot',
    category: ['students'],
    status: 'coming-soon',
  },
];

const categories = [
  { id: 'all', name: 'Όλα', icon: '🏠' },
  { id: 'plan', name: 'Σχεδιασμός', icon: '📅' },
  { id: 'create', name: 'Δημιουργία', icon: '✨' },
  { id: 'differentiate', name: 'Διαφοροποίηση', icon: '🎚️' },
  { id: 'assess', name: 'Αξιολόγηση', icon: '📊' },
  { id: 'support', name: 'Υποστήριξη', icon: '🤝' },
  { id: 'students', name: 'Μαθητές', icon: '👨‍🎓' },
];

export default function TeacherDashboard() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category.includes(activeCategory);
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Noetium για Εκπαιδευτικούς</h1>
                <p className="text-sm text-gray-500">AI εργαλεία για την τάξη σας</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/teacher/students"
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <span>👥</span>
                <span className="hidden sm:inline">Οι Μαθητές μου</span>
              </Link>
              {/* Not a link: /teacher/profile has no page, and /profile is student-specific. */}
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium"
              >
                Ε
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Εργαλεία AI για Εκπαιδευτικούς</h2>
              <p className="text-purple-100 text-lg">
                Εξοικονομήστε χρόνο και βελτιώστε τη διδασκαλία σας με AI
              </p>
            </div>
            <div className="flex gap-4 text-4xl">
              <span>📚</span>
              <span>✨</span>
              <span>🎯</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Αναζήτηση εργαλείων..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool, index) => {
            const ready = tool.status === 'ready';
            // group-hover utilities need an ancestor carrying `group`, so omitting it
            // leaves the unbuilt cards inert without duplicating the markup.
            const card = (
              <div
                className={`bg-white rounded-xl p-5 border border-gray-100 h-full transition-all ${
                  ready ? 'hover:shadow-lg hover:border-purple-200 cursor-pointer group' : 'opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center text-2xl transition-transform ${
                      ready ? 'group-hover:scale-110' : 'opacity-50'
                    }`}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold transition-colors ${
                          ready ? 'text-gray-800 group-hover:text-purple-600' : 'text-gray-500'
                        }`}
                      >
                        {tool.name}
                      </h3>
                      {ready && tool.isNew && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Νέο
                        </span>
                      )}
                      {!ready && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-medium rounded-full">
                          Σύντομα
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${ready ? 'text-gray-500' : 'text-gray-400'}`}>
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            );

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {ready ? <Link href={tool.href}>{card}</Link> : card}
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">🔍</span>
            <p className="text-gray-500 mt-4">Δεν βρέθηκαν εργαλεία</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-2 text-purple-600 hover:underline"
            >
              Καθαρισμός φίλτρων
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl mb-2">👨‍🎓</div>
            <p className="text-2xl font-bold text-gray-800">24</p>
            <p className="text-sm text-gray-500">Μαθητές</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-2xl font-bold text-gray-800">12</p>
            <p className="text-sm text-gray-500">Μαθήματα</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-2xl font-bold text-gray-800">156</p>
            <p className="text-sm text-gray-500">Ασκήσεις</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl mb-2">⏱️</div>
            <p className="text-2xl font-bold text-gray-800">8.5</p>
            <p className="text-sm text-gray-500">Ώρες που γλιτώσατε</p>
          </div>
        </div>
      </main>
    </div>
  );
}
