'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const tools = [
  {
    id: 'photo-helper',
    href: '/tools/photo-helper',
    title: 'Photo Helper',
    titleEl: 'Βοηθός Φωτογραφίας',
    description: 'Ανέβασε φωτογραφία άσκησης και πάρε καθοδήγηση βήμα-βήμα',
    icon: '📸',
    color: 'from-blue-500 to-cyan-500',
    status: 'ready'
  },
  {
    id: 'quiz-generator',
    href: '/tools/quiz-generator',
    title: 'Quiz Generator',
    titleEl: 'Δημιουργός Quiz',
    description: 'Ανέβασε τις σημειώσεις σου και δημιούργησε quiz για εξάσκηση',
    icon: '📝',
    color: 'from-purple-500 to-pink-500',
    status: 'coming-soon'
  },
  {
    id: 'flashcards',
    href: '/tools/flashcards',
    title: 'Flashcards',
    titleEl: 'Κάρτες Μνήμης',
    description: 'Δημιούργησε κάρτες για να μάθεις ορισμούς και έννοιες',
    icon: '🃏',
    color: 'from-orange-500 to-red-500',
    status: 'coming-soon'
  },
  {
    id: 'study-planner',
    href: '/tools/study-planner',
    title: 'Study Planner',
    titleEl: 'Πρόγραμμα Μελέτης',
    description: 'Οργάνωσε το διάβασμά σου με έξυπνο πρόγραμμα',
    icon: '📅',
    color: 'from-green-500 to-teal-500',
    status: 'coming-soon'
  }
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🛠️ Εργαλεία Μάθησης</h1>
          <p className="text-gray-600">AI-powered εργαλεία για να σε βοηθήσουν στο διάβασμα</p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {tool.status === 'ready' ? (
                <Link href={tool.href}>
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] h-full border border-gray-100">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl mb-4`}>
                      {tool.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{tool.titleEl}</h3>
                    <p className="text-gray-600">{tool.description}</p>
                  </div>
                </Link>
              ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm h-full border border-gray-100 opacity-60">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl opacity-50`}>
                      {tool.icon}
                    </div>
                    <span className="bg-gray-200 text-gray-500 text-xs px-2 py-1 rounded-full">
                      Σύντομα
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-500 mb-2">{tool.titleEl}</h3>
                  <p className="text-gray-400">{tool.description}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🎓</span>
            <div>
              <h3 className="font-semibold text-lg">Σωκρατική Μέθοδος</h3>
              <p className="text-white/90 text-sm mt-1">
                Τα εργαλεία μας χρησιμοποιούν τη Σωκρατική μέθοδο: δεν σου δίνουμε απλά τις απαντήσεις, 
                αλλά σε καθοδηγούμε να τις ανακαλύψεις μόνος σου. Έτσι μαθαίνεις καλύτερα και θυμάσαι περισσότερα!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
