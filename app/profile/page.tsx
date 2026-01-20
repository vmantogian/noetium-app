'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Badge {
  id: string;
  name: string;
  name_el: string;
  icon: string;
  rarity: string;
  earned: boolean;
  earnedAt?: string;
}

interface Stats {
  totalActivities: number;
  todayActivities: number;
  badgesCount: number;
  currentStreak: number;
  longestStreak: number;
  featureCounts: Record<string, number>;
}

export default function ProfilePage() {
  const [stats, setStats] = useState<Stats>({
    totalActivities: 0,
    todayActivities: 0,
    badgesCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    featureCounts: {}
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch badges
      const badgesRes = await fetch('/api/badges');
      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        setBadges(badgesData.badges);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-600';
      case 'uncommon': return 'bg-green-100 text-green-600';
      case 'rare': return 'bg-blue-100 text-blue-600';
      case 'epic': return 'bg-purple-100 text-purple-600';
      case 'legendary': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-4xl mb-4"
          >
            ⏳
          </motion.div>
          <p className="text-gray-500">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Μαθητής Noetium</h1>
              <p className="text-gray-500">Επίπεδο: Αρχάριος</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-orange-500">🔥</span>
                <span className="text-sm text-gray-600">{stats.currentStreak} ημέρες streak</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Στατιστικά</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{stats.totalActivities}</p>
              <p className="text-xs text-gray-500">Δραστηριότητες</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-500">{stats.longestStreak}</p>
              <p className="text-xs text-gray-500">Μέγιστο Streak</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{stats.badgesCount}</p>
              <p className="text-xs text-gray-500">Badges</p>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Ανά κατηγορία:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.featureCounts).map(([feature, count]) => (
                <div key={feature} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 capitalize">{feature}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Badges Earned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🏆 Badges που Κέρδισες</h2>
            <span className="text-sm text-gray-500">{earnedBadges.length}/{badges.length}</span>
          </div>

          {earnedBadges.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🎯</p>
              <p>Δεν έχεις κερδίσει badges ακόμα.</p>
              <p className="text-sm">Ολοκλήρωσε δραστηριότητες για να κερδίσεις!</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {earnedBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.1 }}
                  className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl"
                  title={badge.name_el || badge.name}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="text-xs text-gray-600 mt-1 truncate">{badge.name_el || badge.name}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Badges to Earn */}
        {unearnedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔒 Badges για να Κερδίσεις</h2>
            <div className="grid grid-cols-4 gap-3">
              {unearnedBadges.slice(0, 8).map((badge) => (
                <div
                  key={badge.id}
                  className="text-center p-3 bg-gray-50 rounded-xl opacity-50"
                  title={badge.name_el || badge.name}
                >
                  <span className="text-3xl grayscale">❓</span>
                  <p className="text-xs text-gray-400 mt-1 truncate">{badge.name_el || badge.name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Link
            href="/student"
            className="block w-full p-4 bg-purple-500 text-white text-center rounded-xl font-medium hover:bg-purple-600"
          >
            🏠 Πίσω στην Αρχική
          </Link>
          <button
            onClick={handleLogout}
            className="w-full p-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"
          >
            🚪 Αποσύνδεση
          </button>
        </motion.div>
      </div>
    </div>
  );
}
