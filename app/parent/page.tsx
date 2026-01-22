'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <span className="font-bold text-xl text-gray-800">Noetium</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Γονέας</span>
            </div>
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg">
              <span className="text-xl">👤</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Καλημέρα! 👋
          </h1>
          <p className="text-gray-600">
            Παρακολουθήστε την πρόοδο των παιδιών σας
          </p>
        </div>

        {/* Coming Soon Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white mb-8"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🚀</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Σύντομα Διαθέσιμο!</h3>
              <p className="text-white/90 text-sm">
                Η πλατφόρμα γονέων είναι υπό ανάπτυξη. Σύντομα θα μπορείτε να:
              </p>
              <ul className="text-white/80 text-sm mt-2 space-y-1">
                <li>• Συνδέσετε τους λογαριασμούς των παιδιών σας</li>
                <li>• Παρακολουθείτε την καθημερινή πρόοδο</li>
                <li>• Βλέπετε τα επιτεύγματα και badges</li>
                <li>• Λαμβάνετε εβδομαδιαίες αναφορές</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Placeholder Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border-2 border-dashed border-gray-200"
          >
            <div className="text-center text-gray-400">
              <span className="text-4xl">👨‍👩‍👧</span>
              <p className="font-medium mt-2">Προσθήκη Παιδιού</p>
              <p className="text-sm">Σύντομα διαθέσιμο</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border-2 border-dashed border-gray-200"
          >
            <div className="text-center text-gray-400">
              <span className="text-4xl">📊</span>
              <p className="font-medium mt-2">Αναφορές Προόδου</p>
              <p className="text-sm">Σύντομα διαθέσιμο</p>
            </div>
          </motion.div>
        </div>

        {/* What Parents Will Be Able to Do */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📱 Λειτουργίες για Γονείς</h2>
        
        <div className="grid gap-3">
          {[
            { icon: '📈', title: 'Πρόοδος Μαθημάτων', desc: 'Δείτε σε ποια μαθήματα προοδεύει το παιδί σας' },
            { icon: '🏆', title: 'Επιτεύγματα', desc: 'Badges και ορόσημα που έχει κερδίσει' },
            { icon: '⏱️', title: 'Χρόνος Μελέτης', desc: 'Πόσο χρόνο αφιερώνει στη μελέτη' },
            { icon: '🔥', title: 'Streak', desc: 'Συνέπεια καθημερινής μελέτης' },
            { icon: '💬', title: 'AI Συζητήσεις', desc: 'Τι θέματα συζητά με τον AI δάσκαλο' },
            { icon: '📧', title: 'Εβδομαδιαίες Αναφορές', desc: 'Email με σύνοψη της εβδομάδας' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-medium text-gray-800">{item.title}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gray-50 rounded-xl p-6 text-center"
        >
          <p className="text-gray-600 mb-3">
            Έχετε ιδέες για τη πλατφόρμα γονέων;
          </p>
          <a 
            href="mailto:feedback@noetium-ai.com?subject=Parent Dashboard Feedback"
            className="inline-block bg-purple-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-600"
          >
            📧 Στείλτε μας τις προτάσεις σας
          </a>
        </motion.div>
      </div>
    </div>
  );
}
