import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Noetium - Ο Έξυπνος Βοηθός για τα Μαθήματά σου',
  description: 'Μάθε με τη βοήθεια τεχνητής νοημοσύνης. Ρώτησε οτιδήποτε από Φυσική, Μαθηματικά, Χημεία και άλλα μαθήματα.',
  keywords: ['εκπαίδευση', 'AI', 'τεχνητή νοημοσύνη', 'μαθηματικά', 'φυσική', 'χημεία', 'πανελλήνιες'],
  authors: [{ name: 'Noetium' }],
  openGraph: {
    title: 'Noetium - Ο Έξυπνος Βοηθός για τα Μαθήματά σου',
    description: 'Μάθε με τη βοήθεια τεχνητής νοημοσύνης',
    url: 'https://noetium.ai',
    siteName: 'Noetium',
    locale: 'el_GR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        {children}
      </body>
    </html>
  )
}
