import Link from 'next/link'
import Logo from '@/components/Logo'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#191308]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#191308]/90 backdrop-blur-md z-50 border-b border-[#454551]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <span className="text-xl font-heading font-semibold text-white">Noetium</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-[#D8D9DC] hover:text-[#87F1FF] transition-colors font-body"
              >
                Σύνδεση
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] text-white px-5 py-2 rounded-lg transition-all font-body font-medium"
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
          <div className="flex justify-center mb-8">
            <Logo size={100} />
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-semibold text-white mb-6">
            Ο Έξυπνος Βοηθός για τα{' '}
            <span className="gradient-text">Μαθήματά σου</span>
          </h1>
          <p className="text-xl text-[#D8D9DC] mb-8 max-w-2xl mx-auto font-body">
            Μάθε Φυσική, Μαθηματικά, Χημεία και πολλά άλλα με τη βοήθεια τεχνητής νοημοσύνης. 
            Βασισμένο στα ελληνικά σχολικά βιβλία.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="bg-gradient-to-r from-[#E32D91] to-[#C830CC] hover:from-[#C830CC] hover:to-[#E32D91] text-white px-8 py-4 rounded-xl text-lg font-body font-medium transition-all hover:shadow-lg hover:shadow-[#C830CC]/25 hover:-translate-y-1"
            >
              Ξεκίνα Δωρεάν →
            </Link>
            <Link 
              href="#features" 
              className="bg-[#454551] hover:bg-[#454551]/80 text-[#D8D9DC] hover:text-white px-8 py-4 rounded-xl text-lg font-body font-medium transition-all border border-[#454551] hover:border-[#4EA6DC]"
            >
              Μάθε Περισσότερα
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-[#1E1E24]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-heading font-semibold text-center text-white mb-12">
            Γιατί να επιλέξεις το Noetium;
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
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

      {/* Subjects Section */}
      <section className="py-20 px-4 bg-[#191308]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-heading font-semibold text-center text-white mb-12">
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
      <section className="py-20 px-4 bg-gradient-to-r from-[#113285] via-[#4EA6DC] to-[#C830CC]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-heading font-semibold text-white mb-4">
            Έτοιμος να ξεκινήσεις;
          </h2>
          <p className="text-white/90 mb-8 text-lg font-body">
            Κάνε εγγραφή δωρεάν και ξεκίνα να μαθαίνεις με τον έξυπνο βοηθό σου.
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-white hover:bg-[#E5D0E3] text-[#113285] px-8 py-4 rounded-xl text-lg font-body font-medium transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            Δημιούργησε Λογαριασμό →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#454551] bg-[#191308]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <span className="font-heading font-semibold text-[#D8D9DC]">Noetium</span>
          </div>
          <p className="text-[#454551] text-sm font-body">
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
      className="bg-[#191308] p-6 rounded-2xl border border-[#454551] hover:border-[#4EA6DC] transition-all hover:-translate-y-1 hover:shadow-lg group"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      <div 
        className="text-4xl mb-4 w-14 h-14 flex items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accentColor}20` }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-heading font-semibold text-white mb-2">{title}</h3>
      <p className="text-[#D8D9DC] font-body">{description}</p>
    </div>
  )
}

function SubjectBadge({ emoji, name }: { emoji: string; name: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#1E1E24] border border-[#454551] hover:border-[#87F1FF] px-5 py-3 rounded-full transition-all cursor-default hover:-translate-y-1">
      <span className="text-xl">{emoji}</span>
      <span className="text-[#D8D9DC] font-body">{name}</span>
    </div>
  )
}
