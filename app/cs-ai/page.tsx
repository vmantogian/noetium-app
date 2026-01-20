'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ModuleProgress {
  completed: number;
  total: number;
}

export default function CSAIPage() {
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({
    coding: { completed: 0, total: 10 },
    ai_concepts: { completed: 0, total: 8 },
    algorithms: { completed: 0, total: 6 },
  });

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress?feature=cs-ai');
      if (response.ok) {
        const data = await response.json();
        const coding = data.progress?.filter((p: any) => p.activity_type === 'coding_puzzle').length || 0;
        const ai = data.progress?.filter((p: any) => p.activity_type === 'ai_concept').length || 0;
        const algo = data.progress?.filter((p: any) => p.activity_type === 'algorithm').length || 0;
        
        setProgress({
          coding: { completed: coding, total: 10 },
          ai_concepts: { completed: ai, total: 8 },
          algorithms: { completed: algo, total: 6 },
        });
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const modules = [
    {
      id: 'coding',
      href: '/cs-ai/coding',
      title: 'Block Coding',
      titleEl: 'Προγραμματισμός με Blocks',
      description: 'Μάθε τις βασικές έννοιες προγραμματισμού με οπτικά blocks',
      icon: '🧩',
      color: 'from-blue-500 to-cyan-500',
      progress: progress.coding,
      topics: ['Ακολουθίες', 'Επαναλήψεις', 'Συνθήκες', 'Μεταβλητές']
    },
    {
      id: 'ai_concepts',
      href: '/cs-ai/ai-concepts',
      title: 'AI Concepts',
      titleEl: 'Έννοιες AI',
      description: 'Κατανόησε πώς λειτουργεί η Τεχνητή Νοημοσύνη',
      icon: '🤖',
      color: 'from-purple-500 to-pink-500',
      progress: progress.ai_concepts,
      topics: ['Τι είναι AI', 'Machine Learning', 'Neural Networks', 'ChatGPT']
    },
    {
      id: 'algorithms',
      href: '/cs-ai/algorithms',
      title: 'Algorithms',
      titleEl: 'Αλγόριθμοι',
      description: 'Μάθε να σκέφτεσαι αλγοριθμικά',
      icon: '⚡',
      color: 'from-orange-500 to-red-500',
      progress: progress.algorithms,
      topics: ['Βήμα-βήμα', 'Ταξινόμηση', 'Αναζήτηση', 'Διάγραμμα ροής']
    },
  ];

  const totalCompleted = Object.values(progress).reduce((sum, p) => sum + p.completed, 0);
  const totalActivities = Object.values(progress).reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💻 Πληροφορική & AI</h1>
          <p className="text-gray-600">Μάθε προγραμματισμό και τεχνητή νοημοσύνη με διαδραστικό τρόπο</p>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📊 Η Πρόοδός σου</h2>
            <span className="text-purple-600 font-medium">{totalCompleted}/{totalActivities}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalCompleted / totalActivities) * 100}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={module.href}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-3xl flex-shrink-0`}>
                      {module.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{module.titleEl}</h3>
                        <span className="text-sm text-gray-500">
                          {module.progress.completed}/{module.progress.total}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                      
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full bg-gradient-to-r ${module.color}`}
                          style={{ width: `${(module.progress.completed / module.progress.total) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {module.topics.map((topic) => (
                          <span key={topic} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Fun Fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="font-semibold text-lg">Ήξερες ότι;</h3>
              <p className="text-white/90 text-sm mt-1">
                Το ChatGPT εκπαιδεύτηκε με περισσότερα από 500 δισεκατομμύρια λέξεις - 
                περίπου 1000 φορές περισσότερο από όσα θα διαβάσεις σε όλη σου τη ζωή!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
