'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  labelEl: string;
  icon: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    href: '/student',
    label: 'Home',
    labelEl: 'Αρχική',
    icon: '🏠'
  },
  {
    href: '/enrichment',
    label: 'Enrichment',
    labelEl: 'Εμπλουτισμός',
    icon: '🌟',
    children: [
      { href: '/debate', label: 'Debate', labelEl: 'Debate', icon: '🎭' },
      { href: '/mindfulness', label: 'Mindfulness', labelEl: 'Ενσυνειδητότητα', icon: '🧘' },
      { href: '/portfolio', label: 'Portfolio', labelEl: 'Portfolio', icon: '📁' },
      { href: '/cs-ai', label: 'CS & AI', labelEl: 'Πληροφορική & AI', icon: '💻' },
      { href: '/financial', label: 'Financial', labelEl: 'Οικονομικά', icon: '💰' },
      { href: '/art', label: 'Art', labelEl: 'Τέχνη', icon: '🎨' },
    ]
  },
  {
    href: '/tools',
    label: 'Tools',
    labelEl: 'Εργαλεία',
    icon: '🛠️'
  },
  {
    href: '/chat',
    label: 'AI Tutor',
    labelEl: 'AI Δάσκαλος',
    icon: '🤖'
  }
];

// Desktop Sidebar Navigation
export function SidebarNav() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['/enrichment']);

  const toggleExpand = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(h => h !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/student') return pathname === '/student' || pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/student" className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-xl text-gray-800">Noetium</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.href}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpand(item.href)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.labelEl}</span>
                  </span>
                  <span className={`transition-transform ${expandedItems.includes(item.href) ? 'rotate-90' : ''}`}>
                    ›
                  </span>
                </button>
                {expandedItems.includes(item.href) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive(child.href)
                            ? 'bg-purple-100 text-purple-700 font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        <span>{child.icon}</span>
                        <span>{child.labelEl}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.labelEl}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-100">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            👤
          </span>
          <span className="font-medium">Προφίλ</span>
        </Link>
      </div>
    </aside>
  );
}

// Mobile Bottom Navigation
export function BottomNav() {
  const pathname = usePathname();

  const mobileItems = [
    { href: '/student', label: 'Αρχική', icon: '🏠' },
    { href: '/enrichment', label: 'Μάθηση', icon: '🌟' },
    { href: '/chat', label: 'AI', icon: '🤖' },
    { href: '/profile', label: 'Προφίλ', icon: '👤' },
  ];

  const isActive = (href: string) => {
    if (href === '/student') return pathname === '/student' || pathname === '/';
    if (href === '/enrichment') {
      return ['/enrichment', '/debate', '/mindfulness', '/portfolio', '/cs-ai', '/financial', '/art'].some(
        p => pathname.startsWith(p)
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center px-3 py-1 ${
              isActive(item.href)
                ? 'text-purple-600'
                : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

// Combined layout wrapper
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarNav />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
