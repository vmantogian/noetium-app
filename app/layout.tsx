import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Noetium AI - Ο Έξυπνος Βοηθός για τα Μαθήματά σου',
  description: 'Μάθε με τη βοήθεια τεχνητής νοημοσύνης. Ρώτησε οτιδήποτε από Φυσική, Μαθηματικά, Χημεία και άλλα μαθήματα.',
  keywords: ['εκπαίδευση', 'AI', 'τεχνητή νοημοσύνη', 'μαθηματικά', 'φυσική', 'χημεία', 'πανελλήνιες', 'noetium'],
  authors: [{ name: 'Noetium AI' }],
  openGraph: {
    title: 'Noetium AI - Ο Έξυπνος Βοηθός για τα Μαθήματά σου',
    description: 'Μάθε με τη βοήθεια τεχνητής νοημοσύνης',
    url: 'https://noetium-ai.com',
    siteName: 'Noetium AI',
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
      <body className="min-h-screen bg-[#191308]">
        {children}
      </body>
    </html>
  )
}
