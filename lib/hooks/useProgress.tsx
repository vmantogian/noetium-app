'use client';

import { useState, useCallback } from 'react';

interface ProgressData {
  feature: string;
  activity_type: string;
  activity_id?: string;
  score?: number;
  completed: boolean;
  metadata?: Record<string, any>;
}

interface NewBadge {
  id: string;
  name: string;
  name_el: string;
  icon: string;
  description_el?: string;
}

export function useProgress() {
  const [loading, setLoading] = useState(false);
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);

  const saveProgress = useCallback(async (data: ProgressData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.newBadges && result.newBadges.length > 0) {
          setNewBadges(result.newBadges);
        }
        return result;
      } else {
        console.error('Failed to save progress');
        return null;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  return {
    saveProgress,
    loading,
    newBadges,
    clearNewBadges,
  };
}

// Badge celebration component
export function BadgeCelebration({ 
  badges, 
  onClose 
}: { 
  badges: NewBadge[]; 
  onClose: () => void;
}) {
  if (badges.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center animate-bounce-in">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Νέο Badge!
        </h2>
        <div className="space-y-3 mb-6">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-purple-50 rounded-xl p-4">
              <span className="text-4xl">{badge.icon}</span>
              <p className="font-semibold text-purple-700 mt-2">
                {badge.name_el || badge.name}
              </p>
              {badge.description_el && (
                <p className="text-sm text-gray-600 mt-1">{badge.description_el}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600"
        >
          Τέλεια! 🚀
        </button>
      </div>
    </div>
  );
}
