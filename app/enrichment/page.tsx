'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const enrichmentModules = [
  {
    href: '/debate',
    title: 'Debate Platform',
    titleEl: 'Πλατφόρμα Debate',
    description: 'Μάθε να υποστηρίζεις τις απόψεις σου με επιχειρήματα',
    icon: '🎭',
    color: 'from-orange-500 to-red-500',
    features: ['vs AI', 'vs Μαθητές', '4 επίπεδα δυσκολίας']
  },
  {
    href: '/mindfulness',
    title: 'Mindfulness',
    titleEl: 'Ενσυνειδητότητα',
    description: 'Ασκήσεις αναπνοής και συναισθηματική υγεία',
    icon: '🧘',
    color: 'from-green-500 to-teal-500',
    features: ['Αναπνοές', 'Συναισθήματα', 'Streaks']
  },
  {
    href: '/portfolio',
    title: 'Portfolio',
    titleEl: 'Χαρτοφυλάκιο',
    description: 'Συλλογή των έργων και της προόδου σου',
    icon: '📁',
    color: 'from-blue-500 to-indigo-500',
    features: ['Έργα', 'Στόχοι', 'Αναστοχασμοί']
  },
  {
    href: '/cs-ai',
    title: 'CS & AI',
    titleEl: 'Πληροφορική & AI',
    description: 'Μάθε προγραμματισμό και τεχνητή νοημοσύνη',
    icon: '💻',
    color: 'from-purple-500 to-pink-500',
    features: ['Block Coding', 'AI Concepts', 'Εκπαίδευσε AI']
  },
  {
    href: '/financial',
    title: 'Financial Literacy',
    titleEl: 'Οικονομικός Γραμματισμός',
    description: 'Μάθε να διαχειρίζεσαι τα χρήματά σου',
    icon: '💰',
    color: 'from-yellow-500 to-orange-500',
    features: ['Προϋπολογισμός', 'Αποταμίευση', 'Ανατοκισμός']
  },
  {
    href: '/art',
    title: 'Art & Creativity',
    titleEl: 'Τέχνη & Δημιουργικότητα',
    description: 'Εκφράσου μέσα από τη δημιουργία',
    icon: '🎨',
    color: 'from-pink-500 to-rose-500',
    features: ['Ζωγραφική', 'Μοτίβα', 'Μουσική']
  }
];

export default function EnrichmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            🌟 Εμπλουτισμός
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Εξερεύνησε νέες δεξιότητες πέρα από τα παραδοσιακά μαθήματα
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichmentModules.map((module, index) => (
            <motion.div
              key={module.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={module.href}>
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] h-full border border-gray-100">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-3xl mb-4`}>
                    {module.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {module.titleEl}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 mb-4">
                    {module.description}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {module.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Progress Overview */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Η Πρόοδός σου</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-xs text-gray-500">Debates</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-xs text-gray-500">Ασκήσεις</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-xs text-gray-500">Έργα</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-600">0</p>
              <p className="text-xs text-gray-500">Badges</p>
            </div>
          </div>
        </div>

        {/* Quick Start Suggestion */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <span className="text-4xl">💡</span>
            <div>
              <h3 className="font-semibold text-lg">Πρόταση για σήμερα</h3>
              <p className="text-white/90">Δοκίμασε μια άσκηση αναπνοής για να ξεκινήσεις χαλαρά!</p>
            </div>
            <Link
              href="/mindfulness"
              className="ml-auto bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              Ξεκίνα →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
