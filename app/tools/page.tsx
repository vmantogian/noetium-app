import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'

const TOOL_CATEGORIES = [
  { id: 'all', name: 'Όλα', icon: '📚' },
  { id: 'plan', name: 'Σχεδιασμός', icon: '📋' },
  { id: 'create', name: 'Δημιουργία', icon: '✏️' },
  { id: 'differentiate', name: 'Διαφοροποίηση', icon: '🎯' },
  { id: 'support', name: 'Υποστήριξη', icon: '💬' },
  { id: 'assess', name: 'Αξιολόγηση', icon: '📊' },
]

const TOOLS = [
  // Planning tools
  {
    id: 'lesson-plan',
    name: 'Σχέδιο Μαθήματος',
    description: 'Δημιούργησε δομημένα σχέδια μαθήματος προσαρμοσμένα στις ανάγκες των μαθητών σου.',
    icon: '📋',
    color: '#4EA6DC',
    category: 'plan',
    status: 'active',
  },
  {
    id: 'learning-objectives',
    name: 'Μαθησιακοί Στόχοι',
    description: 'Ανάπτυξε σαφείς, μετρήσιμους μαθησιακούς στόχους για κάθε μάθημα.',
    icon: '🎯',
    color: '#E32D91',
    category: 'plan',
    status: 'active',
  },
  {
    id: 'lesson-hook',
    name: 'Αφόρμηση Μαθήματος',
    description: 'Σχεδίασε ελκυστικές αφορμήσεις για να κεντρίσεις το ενδιαφέρον των μαθητών.',
    icon: '🪝',
    color: '#C830CC',
    category: 'plan',
    status: 'active',
  },
  // Create tools
  {
    id: 'questions-generator',
    name: 'Γεννήτρια Ερωτήσεων',
    description: 'Δημιούργησε ερωτήσεις για οποιοδήποτε περιεχόμενο ή θέμα.',
    icon: '❓',
    color: '#87F1FF',
    category: 'create',
    status: 'active',
  },
  {
    id: 'multiple-choice',
    name: 'Τεστ Πολλαπλής Επιλογής',
    description: 'Φτιάξε τεστ πολλαπλής επιλογής με αυτόματη βαθμολόγηση.',
    icon: '☑️',
    color: '#113285',
    category: 'create',
    status: 'active',
  },
  {
    id: 'informational-text',
    name: 'Ενημερωτικό Κείμενο',
    description: 'Δημιούργησε ενημερωτικά κείμενα για διάφορα θέματα.',
    icon: '📄',
    color: '#4EA6DC',
    category: 'create',
    status: 'active',
  },
  {
    id: 'discussion-prompts',
    name: 'Θέματα Συζήτησης',
    description: 'Φτιάξε ερεθίσματα για ουσιαστικές συζητήσεις στην τάξη.',
    icon: '💬',
    color: '#E32D91',
    category: 'create',
    status: 'active',
  },
  {
    id: 'clear-directions',
    name: 'Σαφείς Οδηγίες',
    description: 'Δημιούργησε κατανοητές οδηγίες για δραστηριότητες και εργασίες.',
    icon: '📝',
    color: '#C830CC',
    category: 'create',
    status: 'active',
  },
  // Differentiate tools
  {
    id: 'leveler',
    name: 'Προσαρμογή Επιπέδου',
    description: 'Προσάρμοσε τη δυσκολία ενός κειμένου στο επίπεδο των μαθητών.',
    icon: '📊',
    color: '#87F1FF',
    category: 'differentiate',
    status: 'active',
  },
  {
    id: 'text-rewriter',
    name: 'Αναδιατύπωση Κειμένου',
    description: 'Αναδιατύπωσε κείμενα για διαφορετικά επίπεδα ή στυλ.',
    icon: '🔄',
    color: '#113285',
    category: 'differentiate',
    status: 'active',
  },
  {
    id: 'chunk-text',
    name: 'Τμηματοποίηση Κειμένου',
    description: 'Χώρισε μεγάλα κείμενα σε διαχειρίσιμα τμήματα.',
    icon: '📚',
    color: '#4EA6DC',
    category: 'differentiate',
    status: 'coming-soon',
  },
  // Support tools
  {
    id: 'refresh-knowledge',
    name: 'Ανανέωση Γνώσεων',
    description: 'Ανανέωσε τις γνώσεις σου σε διάφορα θέματα γρήγορα.',
    icon: '🧠',
    color: '#E32D91',
    category: 'support',
    status: 'active',
  },
  {
    id: 'real-world-context',
    name: 'Πραγματικές Εφαρμογές',
    description: 'Βρες εφαρμογές του πραγματικού κόσμου για τα μαθήματά σου.',
    icon: '🌍',
    color: '#C830CC',
    category: 'support',
    status: 'coming-soon',
  },
  // Assessment tools
  {
    id: 'rubric-generator',
    name: 'Δημιουργία Ρουμπρίκας',
    description: 'Σχεδίασε αναλυτικές ρουμπρίκες αξιολόγησης.',
    icon: '📋',
    color: '#87F1FF',
    category: 'assess',
    status: 'coming-soon',
  },
  {
    id: 'exit-ticket',
    name: 'Exit Ticket',
    description: 'Δημιούργησε σύντομες αξιολογήσεις τέλους μαθήματος.',
    icon: '🎫',
    color: '#113285',
    category: 'assess',
    status: 'active',
  },
  {
    id: 'report-comments',
    name: 'Σχόλια Ελέγχου',
    description: 'Δημιούργησε εξατομικευμένα σχόλια για τους ελέγχους.',
    icon: '✍️',
    color: '#4EA6DC',
    category: 'assess',
    status: 'coming-soon',
  },
]

export default async function TeacherToolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Καθηγητής'

  return (
    <div className="min-h-screen bg-[#191308]">
      {/* Navigation */}
      <nav className="bg-[#1E1E24] border-b border-[#454551]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-lg font-heading font-semibold text-white hidden sm:inline">Noetium</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1 ml-4">
                <Link 
                  href="/tools" 
                  className="px-3 py-1.5 text-sm font-body font-medium text-[#87F1FF] border-b-2 border-[#87F1FF]"
                >
                  Εργαλεία
                </Link>
                <Link 
                  href="/chat" 
                  className="px-3 py-1.5 text-sm font-body text-[#D8D9DC] hover:text-white"
                >
                  Συνομιλία
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center">
                <span className="text-white font-body font-medium text-sm">
                  {userName[0].toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1E1E24] to-[#191308] border-b border-[#454551]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-white mb-2">
                Εργαλεία Noetium
              </h1>
              <p className="text-[#D8D9DC] font-body">
                Δωρεάν εργαλεία AI σχεδιασμένα να σου εξοικονομήσουν χρόνο και να βελτιώσουν τη διδασκαλία!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {TOOL_CATEGORIES.map(category => (
            <button
              key={category.id}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all
                        bg-[#1E1E24] text-[#D8D9DC] hover:bg-[#2a2a32] border border-[#454551]
                        first:bg-[#4EA6DC] first:text-white first:border-[#4EA6DC]"
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#454551]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Αναζήτηση εργαλείων..."
              className="w-full pl-10 pr-4 py-2 bg-[#1E1E24] border border-[#454551] rounded-lg text-white placeholder-[#454551] font-body text-sm focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent"
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ToolCard({ tool }: { tool: typeof TOOLS[0] }) {
  const isComingSoon = tool.status === 'coming-soon'
  
  return (
    <Link
      href={isComingSoon ? '#' : `/tools/${tool.id}`}
      className={`
        block p-4 rounded-xl border transition-all group
        ${isComingSoon 
          ? 'bg-[#1E1E24]/50 border-[#454551]/50 cursor-not-allowed opacity-60' 
          : 'bg-[#1E1E24] border-[#454551] hover:border-[#4EA6DC] hover:-translate-y-1'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${tool.color}20` }}
        >
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-white text-sm truncate">
              {tool.name}
            </h3>
            {isComingSoon && (
              <span className="text-xs bg-[#454551] text-[#D8D9DC] px-2 py-0.5 rounded-full font-body">
                Σύντομα
              </span>
            )}
          </div>
          <p className="text-xs text-[#D8D9DC] font-body mt-1 line-clamp-2">
            {tool.description}
          </p>
        </div>
        {!isComingSoon && (
          <svg 
            className="w-5 h-5 text-[#454551] group-hover:text-[#4EA6DC] transition-colors shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </Link>
  )
}
