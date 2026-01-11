import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">Noetium</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Σύνδεση
              </Link>
              <Link 
                href="/signup" 
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Εγγραφή
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Ο Έξυπνος Βοηθός για τα{' '}
            <span className="text-primary-600 dark:text-primary-400">Μαθήματά σου</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Μάθε Φυσική, Μαθηματικά, Χημεία και πολλά άλλα με τη βοήθεια τεχνητής νοημοσύνης. 
            Βασισμένο στα ελληνικά σχολικά βιβλία.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25"
            >
              Ξεκίνα Δωρεάν →
            </Link>
            <Link 
              href="#features" 
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Μάθε Περισσότερα
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
            Γιατί να επιλέξεις το Noetium;
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="📚"
              title="Βασισμένο στα Σχολικά Βιβλία"
              description="Οι απαντήσεις προέρχονται από τα επίσημα ελληνικά σχολικά βιβλία Γυμνασίου και Λυκείου."
            />
            <FeatureCard 
              icon="🤖"
              title="Τεχνητή Νοημοσύνη"
              description="Χρησιμοποιούμε τα πιο προηγμένα μοντέλα AI για να σου εξηγήσουμε τα πάντα με απλό τρόπο."
            />
            <FeatureCard 
              icon="🎯"
              title="Προσαρμοσμένη Βοήθεια"
              description="Κατανοεί τις ερωτήσεις σου και σου δίνει απαντήσεις στο επίπεδό σου."
            />
            <FeatureCard 
              icon="📝"
              title="Ασκήσεις & Λύσεις"
              description="Πρόσβαση σε ασκήσεις από σχολικά βιβλία και πανελλήνιες εξετάσεις."
            />
            <FeatureCard 
              icon="🇬🇷"
              title="100% Ελληνικά"
              description="Πλήρως στα ελληνικά, σχεδιασμένο για το ελληνικό εκπαιδευτικό σύστημα."
            />
            <FeatureCard 
              icon="⚡"
              title="Άμεσες Απαντήσεις"
              description="Λαμβάνεις απαντήσεις σε δευτερόλεπτα, 24 ώρες το 24ωρο."
            />
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
            Μαθήματα που Υποστηρίζουμε
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <SubjectBadge emoji="🔬" name="Φυσική" />
            <SubjectBadge emoji="📐" name="Μαθηματικά" />
            <SubjectBadge emoji="⚗️" name="Χημεία" />
            <SubjectBadge emoji="🧬" name="Βιολογία" />
            <SubjectBadge emoji="📜" name="Ιστορία" />
            <SubjectBadge emoji="📖" name="Νεοελληνική Γλώσσα" />
            <SubjectBadge emoji="🏛️" name="Αρχαία Ελληνικά" />
            <SubjectBadge emoji="🌍" name="Γεωγραφία" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Έτοιμος να ξεκινήσεις;
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Κάνε εγγραφή δωρεάν και ξεκίνα να μαθαίνεις με τον έξυπνο βοηθό σου.
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-white hover:bg-slate-100 text-primary-600 px-8 py-4 rounded-xl text-lg font-medium transition-colors"
          >
            Δημιούργησε Λογαριασμό →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Noetium</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 Noetium. Με ❤️ για την ελληνική εκπαίδευση.
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}

function SubjectBadge({ emoji, name }: { emoji: string; name: string }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm">
      <span>{emoji}</span>
      <span className="text-slate-700 dark:text-slate-300">{name}</span>
    </div>
  )
}
