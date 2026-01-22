'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-700">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎓</span>
            <span className="text-2xl font-bold text-white">Noetium</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-white/90 hover:text-white font-medium transition-colors"
            >
              Σύνδεση
            </Link>
            <Link 
              href="/signup" 
              className="bg-white text-purple-600 px-5 py-2 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
            >
              Εγγραφή
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ο AI Δάσκαλος που
              <span className="text-yellow-300"> Σε Καταλαβαίνει</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
              Μάθε με τη Σωκρατική μέθοδο. Από το Δημοτικό μέχρι το Λύκειο, 
              με πρόσβαση σε όλα τα ελληνικά σχολικά βιβλία.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link 
              href="/signup" 
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
            >
              Ξεκίνα Δωρεάν →
            </Link>
            <Link 
              href="#features" 
              className="bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors border border-white/30"
            >
              Μάθε Περισσότερα
            </Link>
          </motion.div>

          {/* Demo Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/20 max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-xl">🤖</div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-gray-500 mb-1">Noetia • AI Δάσκαλος</p>
                  <p className="text-gray-900">
                    Γεια σου! 👋 Βλέπω ότι θέλεις να μάθεις για τη φωτοσύνθεση. 
                    Ας ξεκινήσουμε με μια ερώτηση: <strong>Τι νομίζεις ότι χρειάζεται ένα φυτό για να ζήσει;</strong>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">💡 Hint διαθέσιμο</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">📚 Από σχολικά βιβλία</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Γιατί Noetium;
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Σωκρατική Μέθοδος</h3>
              <p className="text-gray-600">
                Δεν δίνουμε απαντήσεις - σε καθοδηγούμε να τις ανακαλύψεις μόνος σου
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ελληνικά Βιβλία</h3>
              <p className="text-gray-600">
                Πρόσβαση σε όλα τα σχολικά βιβλία από Α' Δημοτικού έως Γ' Λυκείου
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Εικόνες & Διαγράμματα</h3>
              <p className="text-gray-600">
                Δημιουργία εκπαιδευτικών εικόνων με ελληνικές ετικέτες
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Για Ποιον Είναι;
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Students */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-5xl mb-4">👨‍🎓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Μαθητές</h3>
              <ul className="text-gray-600 space-y-2">
                <li>✓ AI δάσκαλος 24/7</li>
                <li>✓ Βοήθεια στις εργασίες</li>
                <li>✓ Διασκεδαστική μάθηση</li>
                <li>✓ Badges & επιτεύγματα</li>
              </ul>
            </div>

            {/* Teachers */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Εκπαιδευτικοί</h3>
              <ul className="text-gray-600 space-y-2">
                <li>✓ Γεννήτρια ασκήσεων</li>
                <li>✓ Σχέδια μαθήματος</li>
                <li>✓ Βαθμολόγηση με φωτογραφία</li>
                <li>✓ Παρακολούθηση μαθητών</li>
              </ul>
            </div>

            {/* Parents */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-5xl mb-4">👨‍👩‍👧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Γονείς</h3>
              <ul className="text-gray-600 space-y-2">
                <li>✓ Πρόοδος παιδιών</li>
                <li>✓ Ειδοποιήσεις</li>
                <li>✓ Εβδομαδιαίες αναφορές</li>
                <li>✓ Σύντομα διαθέσιμο</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Έτοιμος να Ξεκινήσεις;
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Δωρεάν εγγραφή. Χωρίς πιστωτική κάρτα.
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-yellow-400 text-gray-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
          >
            Δημιούργησε Λογαριασμό →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold">Noetium</span>
            </div>
            <div className="flex gap-6 text-gray-400">
              <Link href="/terms" className="hover:text-white">Όροι Χρήσης</Link>
              <Link href="/privacy" className="hover:text-white">Απόρρητο</Link>
              <Link href="/contact" className="hover:text-white">Επικοινωνία</Link>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Noetium. Made in Greece 🇬🇷
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
