import Link from 'next/link'
import Logo from '@/components/Logo'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#191308]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#191308]/90 backdrop-blur-md z-50 border-b border-[#454551]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Logo size={28} className="sm:w-9 sm:h-9" />
              <span className="text-lg sm:text-xl font-heading font-semibold text-white">Noetium</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/login" 
                className="text-sm sm:text-base text-[#D8D9DC] hover:text-[#87F1FF] transition-colors font-body"
              >
                Σύνδεση
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg transition-all font-body font-medium text-sm sm:text-base"
              >
                Εγγραφή
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Logo size={70} className="sm:w-[100px] sm:h-[100px]" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-semibold text-white mb-4 sm:mb-6 leading-tight">
            Ο Έξυπνος Βοηθός για τα{' '}
            <span className="gradient-text">Μαθήματά σου</span>
          </h1>
          <p className="text-base sm:text-xl text-[#D8D9DC] mb-6 sm:mb-8 max-w-2xl mx-auto font-body px-2">
            Μάθε Φυσική, Μαθηματικά, Χημεία και πολλά άλλα με τη βοήθεια τεχνητής νοημοσύνης. 
            Βασισμένο στα ελληνικά σχολικά βιβλία.
          </p>
          
          {/* Role Selection - Like Khan Academy */}
          <div className="max-w-md mx-auto space-y-3 mb-8">
            <p className="text-[#D8D9DC] font-body mb-4">Ξεκίνα σήμερα!</p>
            <Link 
              href="/signup?role=student"
              className="flex items-center justify-between w-full bg-[#1E1E24] hover:bg-[#2a2a32] border border-[#454551] hover:border-[#4EA6DC] text-white px-6 py-4 rounded-xl transition-all font-body group"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">🎓</span>
                <span>Είμαι Μαθητής</span>
              </span>
              <svg className="w-5 h-5 text-[#454551] group-hover:text-[#4EA6DC] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link 
              href="/signup?role=teacher"
              className="flex items-center justify-between w-full bg-[#1E1E24] hover:bg-[#2a2a32] border border-[#454551] hover:border-[#E32D91] text-white px-6 py-4 rounded-xl transition-all font-body group"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">👨‍🏫</span>
                <span>Είμαι Καθηγητής</span>
              </span>
              <svg className="w-5 h-5 text-[#454551] group-hover:text-[#E32D91] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link 
              href="/signup?role=parent"
              className="flex items-center justify-between w-full bg-[#1E1E24] hover:bg-[#2a2a32] border border-[#454551] hover:border-[#C830CC] text-white px-6 py-4 rounded-xl transition-all font-body group"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">👨‍👩‍👧</span>
                <span>Είμαι Γονέας</span>
              </span>
              <svg className="w-5 h-5 text-[#454551] group-hover:text-[#C830CC] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <p className="text-[#454551] text-sm font-body">
            Έχεις ήδη λογαριασμό;{' '}
            <Link href="/login" className="text-[#87F1FF] hover:underline">Σύνδεση</Link>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 bg-[#1E1E24]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-center text-white mb-8 sm:mb-12">
            Γιατί να επιλέξεις το Noetium;
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            <FeatureCard 
              icon="📚"
              title="Βασισμένο στα Σχολικά Βιβλία"
              description="Οι απαντήσεις προέρχονται από τα επίσημα ελληνικά σχολικά βιβλία Γυμνασίου και Λυκείου."
              accentColor="#4EA6DC"
            />
            <FeatureCard 
              icon="🤖"
              title="Τεχνητή Νοημοσύνη"
              description="Χρησιμοποιούμε τα πιο προηγμένα μοντέλα AI για να σου εξηγήσουμε τα πάντα με απλό τρόπο."
              accentColor="#E32D91"
            />
            <FeatureCard 
              icon="🎯"
              title="Προσαρμοσμένη Βοήθεια"
              description="Κατανοεί τις ερωτήσεις σου και σου δίνει απαντήσεις στο επίπεδό σου."
              accentColor="#C830CC"
            />
            <FeatureCard 
              icon="📝"
              title="Ασκήσεις & Λύσεις"
              description="Πρόσβαση σε ασκήσεις από σχολικά βιβλία και πανελλήνιες εξετάσεις."
              accentColor="#87F1FF"
            />
            <FeatureCard 
              icon="🇬🇷"
              title="100% Ελληνικά"
              description="Πλήρως στα ελληνικά, σχεδιασμένο για το ελληνικό εκπαιδευτικό σύστημα."
              accentColor="#113285"
            />
            <FeatureCard 
              icon="⚡"
              title="Άμεσες Απαντήσεις"
              description="Λαμβάνεις απαντήσεις σε δευτερόλεπτα, 24 ώρες το 24ωρο."
              accentColor="#4EA6DC"
            />
          </div>
        </div>
      </section>

      {/* For Teachers Section */}
      <section className="py-12 sm:py-20 px-4 bg-[#191308]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-[#E32D91] font-body text-sm uppercase tracking-wider">Για Καθηγητές</span>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white mt-2">
              Εργαλεία AI για την Τάξη σου
            </h2>
            <p className="text-[#D8D9DC] font-body mt-3 max-w-2xl mx-auto">
              Δωρεάν εργαλεία τεχνητής νοημοσύνης σχεδιασμένα να σου εξοικονομήσουν χρόνο 
              και να βελτιώσουν τη διδασκαλία.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ToolCard 
              icon="📋"
              title="Σχέδιο Μαθήματος"
              description="Δημιούργησε δομημένα σχέδια μαθήματος προσαρμοσμένα στο πρόγραμμα σου."
              color="#4EA6DC"
            />
            <ToolCard 
              icon="❓"
              title="Γεννήτρια Ερωτήσεων"
              description="Δημιούργησε ερωτήσεις πολλαπλής επιλογής και ανοιχτού τύπου."
              color="#E32D91"
            />
            <ToolCard 
              icon="📊"
              title="Δημιουργία Τεστ"
              description="Φτιάξε τεστ αξιολόγησης με αυτόματη βαθμολόγηση."
              color="#C830CC"
            />
            <ToolCard 
              icon="📝"
              title="Απλοποίηση Κειμένου"
              description="Προσάρμοσε τη δυσκολία ενός κειμένου στο επίπεδο των μαθητών."
              color="#87F1FF"
            />
            <ToolCard 
              icon="💬"
              title="Θέματα Συζήτησης"
              description="Δημιούργησε ερεθίσματα για ουσιαστικές συζητήσεις στην τάξη."
              color="#113285"
            />
            <ToolCard 
              icon="🎯"
              title="Μαθησιακοί Στόχοι"
              description="Ανάπτυξε σαφείς, μετρήσιμους στόχους για κάθε μάθημα."
              color="#4EA6DC"
            />
          </div>
          <div className="text-center mt-8">
            <Link 
              href="/signup?role=teacher"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E32D91] to-[#C830CC] hover:from-[#C830CC] hover:to-[#E32D91] text-white px-6 py-3 rounded-xl font-body font-medium transition-all"
            >
              Ξεκίνα ως Καθηγητής
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-12 sm:py-20 px-4 bg-[#1E1E24]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-center text-white mb-8 sm:mb-12">
            Μαθήματα που Υποστηρίζουμε
          </h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <SubjectBadge emoji="🔬" name="Φυσική" />
            <SubjectBadge emoji="📐" name="Μαθηματικά" />
            <SubjectBadge emoji="⚗️" name="Χημεία" />
            <SubjectBadge emoji="🧬" name="Βιολογία" />
            <SubjectBadge emoji="📜" name="Ιστορία" />
            <SubjectBadge emoji="📖" name="Νεοελληνική" />
            <SubjectBadge emoji="🏛️" name="Αρχαία" />
            <SubjectBadge emoji="🌍" name="Γεωγραφία" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-r from-[#113285] via-[#4EA6DC] to-[#C830CC]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white mb-4">
            Έτοιμος να ξεκινήσεις;
          </h2>
          <p className="text-white/90 mb-6 sm:mb-8 text-base sm:text-lg font-body">
            Κάνε εγγραφή δωρεάν και ξεκίνα να μαθαίνεις με τον έξυπνο βοηθό σου.
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-white hover:bg-[#E5D0E3] text-[#113285] px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-body font-medium transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            Δημιούργησε Λογαριασμό →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 border-t border-[#454551] bg-[#191308]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo size={24} className="sm:w-7 sm:h-7" />
            <span className="font-heading font-semibold text-[#D8D9DC]">Noetium</span>
          </div>
          <p className="text-[#454551] text-xs sm:text-sm font-body text-center sm:text-right">
            © 2026 Noetium. Με ❤️ για την ελληνική εκπαίδευση.
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description,
  accentColor 
}: { 
  icon: string
  title: string
  description: string
  accentColor: string
}) {
  return (
    <div 
      className="bg-[#191308] p-4 sm:p-6 rounded-2xl border border-[#454551] hover:border-[#4EA6DC] transition-all hover:-translate-y-1 hover:shadow-lg group"
    >
      <div 
        className="text-2xl sm:text-4xl mb-3 sm:mb-4 w-10 sm:w-14 h-10 sm:h-14 flex items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accentColor}20` }}
      >
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-heading font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-[#D8D9DC] font-body">{description}</p>
    </div>
  )
}

function ToolCard({ 
  icon, 
  title, 
  description,
  color 
}: { 
  icon: string
  title: string
  description: string
  color: string
}) {
  return (
    <div className="bg-[#1E1E24] p-4 rounded-xl border border-[#454551] hover:border-[#4EA6DC] transition-all flex items-start gap-3 group cursor-pointer">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-heading font-semibold text-white text-sm">{title}</h3>
        <p className="text-xs text-[#D8D9DC] font-body mt-1">{description}</p>
      </div>
    </div>
  )
}

function SubjectBadge({ emoji, name }: { emoji: string; name: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#191308] border border-[#454551] hover:border-[#87F1FF] px-3 sm:px-5 py-2 sm:py-3 rounded-full transition-all cursor-default hover:-translate-y-1">
      <span className="text-base sm:text-xl">{emoji}</span>
      <span className="text-sm sm:text-base text-[#D8D9DC] font-body">{name}</span>
    </div>
  )
}
