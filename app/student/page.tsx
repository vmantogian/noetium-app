'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Stats {
  totalActivities: number;
  todayActivities: number;
  badgesCount: number;
  currentStreak: number;
  longestStreak: number;
  featureCounts: Record<string, number>;
}

interface Badge {
  id: string;
  name: string;
  name_el: string;
  icon: string;
  rarity: string;
  earnedAt: string;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalActivities: 0,
    todayActivities: 0,
    badgesCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    featureCounts: {}
  });
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentBadges(data.recentBadges);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage (rough estimate)
  const progressPercent = Math.min(
    Math.round((stats.totalActivities / 50) * 100),
    100
  );

  const quickActions = [
    { href: '/chat', icon: '🤖', label: 'AI Δάσκαλος', color: 'bg-purple-500' },
    { href: '/tools', icon: '📸', label: 'Photo Helper', color: 'bg-blue-500' },
    { href: '/mindfulness', icon: '🧘', label: 'Αναπνοή', color: 'bg-green-500' },
    { href: '/debate', icon: '🎭', label: 'Debate', color: 'bg-orange-500' },
  ];

  const enrichmentHighlights = [
    { href: '/cs-ai', icon: '💻', title: 'Block Coding', subtitle: 'Νέα puzzles!' },
    { href: '/financial', icon: '💰', title: 'Προϋπολογισμός', subtitle: 'Μάθε τον κανόνα 50/30/20' },
    { href: '/art', icon: '🎨', title: 'Ζωγραφική', subtitle: 'Πρόκληση ημέρας' },
  ];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Καλημέρα';
    if (hour < 18) return 'Καλησπέρα';
    return 'Καληνύχτα';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {getGreeting()}! 👋
          </h1>
          <p className="text-gray-600">
            Τι θα μάθεις σήμερα;
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-3 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-orange-500">🔥 {stats.currentStreak}</p>
            <p className="text-xs text-gray-500">Streak</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-3 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-purple-500">🏆 {stats.badgesCount}</p>
            <p className="text-xs text-gray-500">Badges</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-3 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-green-500">✓ {stats.todayActivities}</p>
            <p className="text-xs text-gray-500">Σήμερα</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-3 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-blue-500">📈 {progressPercent}%</p>
            <p className="text-xs text-gray-500">Πρόοδος</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Γρήγορες Ενέργειες</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={action.href}
                  className="block bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-2`}>
                    {action.icon}
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{action.label}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 Συνέχισε να Μαθαίνεις</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {stats.todayActivities === 0 ? (
              <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl">
                <span className="text-3xl">🧘</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Άσκηση Αναπνοής</p>
                  <p className="text-sm text-gray-500">Δεν έχεις κάνει ακόμα σήμερα</p>
                </div>
                <Link
                  href="/mindfulness"
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Ξεκίνα
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl">
                <span className="text-3xl">🎉</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Συγχαρητήρια!</p>
                  <p className="text-sm text-gray-500">
                    Έχεις ολοκληρώσει {stats.todayActivities} δραστηριότητ{stats.todayActivities === 1 ? 'α' : 'ες'} σήμερα
                  </p>
                </div>
                <Link
                  href="/enrichment"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Συνέχισε
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🏆 Πρόσφατα Badges</h2>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-4 overflow-x-auto">
                {recentBadges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-shrink-0 text-center p-3 bg-purple-50 rounded-xl"
                  >
                    <span className="text-3xl">{badge.icon}</span>
                    <p className="text-xs text-gray-600 mt-1">{badge.name_el || badge.name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enrichment Highlights */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🌟 Εμπλουτισμός</h2>
            <Link href="/enrichment" className="text-purple-600 text-sm font-medium">
              Δες όλα →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {enrichmentHighlights.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-medium text-gray-800 mt-2">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Daily Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold">Tip της Ημέρας</h3>
              <p className="text-white/90 text-sm mt-1">
                Η Σωκρατική μέθοδος βασίζεται στο να κάνεις ερωτήσεις. Μην φοβάσαι να ρωτήσεις "γιατί"!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
