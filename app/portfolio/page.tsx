'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Import components - adjust path if needed
import { 
  PortfolioOverview, 
  SelfReflectionForm,
  type StudentPortfolio,
  type Artifact
} from '@/components/assessment/Portfolio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<StudentPortfolio | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReflection, setShowReflection] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [gradeLevel, setGradeLevel] = useState('a_gymnasiou'); // Default, should come from user profile

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadPortfolio(user.id);
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  // Load portfolio
  const loadPortfolio = async (uid: string) => {
    try {
      const response = await fetch(`/api/portfolio?userId=${uid}`);
      const data = await response.json();
      
      if (data.portfolio) {
        setPortfolio(data.portfolio);
        setGradeLevel(data.portfolio.grade_level || 'a_gymnasiou');
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create portfolio
  const handleCreatePortfolio = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          gradeLevel: gradeLevel,
          visibility: 'private'
        })
      });

      if (!response.ok) throw new Error('Failed to create portfolio');
      
      // Reload portfolio
      loadPortfolio(userId);
    } catch (error) {
      console.error('Error creating portfolio:', error);
    }
  };

  // Handle artifact click
  const handleArtifactClick = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    // Could navigate to artifact detail page or show modal
    console.log('Artifact clicked:', artifact);
  };

  // Handle badge click
  const handleBadgeClick = (badge: any) => {
    // Show badge detail modal
    alert(`🏆 ${badge.name}\n\n${badge.description}\n\nΚερδήθηκε: ${new Date(badge.earnedAt).toLocaleDateString('el-GR')}`);
  };

  // Handle reflection submit
  const handleReflectionSubmit = async (reflection: any) => {
    if (!selectedArtifact) return;

    try {
      const response = await fetch('/api/portfolio/artifacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: selectedArtifact.id,
          ...reflection
        })
      });

      if (!response.ok) throw new Error('Failed to save reflection');
      
      setShowReflection(false);
      setSelectedArtifact(null);
      
      // Reload portfolio
      if (userId) loadPortfolio(userId);
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // Not logged in
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📁</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Portfolio</h1>
          <p className="text-gray-600 mb-6">Συνδέσου για να δεις το portfolio σου</p>
          <a 
            href="/login" 
            className="inline-block bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition-colors"
          >
            Σύνδεση
          </a>
        </div>
      </div>
    );
  }

  // No portfolio yet
  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <div className="container mx-auto p-4 max-w-2xl">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Δημιούργησε το Portfolio σου</h1>
            <p className="text-gray-600 mb-8">
              Συγκέντρωσε τις εργασίες σου, κέρδισε badges και παρακολούθησε την πρόοδό σου!
            </p>

            {/* Grade Level Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Επίλεξε τάξη
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full max-w-xs mx-auto p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <optgroup label="Δημοτικό">
                  <option value="d_dimotikou">Δ' Δημοτικού</option>
                  <option value="e_dimotikou">Ε' Δημοτικού</option>
                  <option value="st_dimotikou">ΣΤ' Δημοτικού</option>
                </optgroup>
                <optgroup label="Γυμνάσιο">
                  <option value="a_gymnasiou">Α' Γυμνασίου</option>
                  <option value="b_gymnasiou">Β' Γυμνασίου</option>
                  <option value="g_gymnasiou">Γ' Γυμνασίου</option>
                </optgroup>
                <optgroup label="Λύκειο">
                  <option value="a_lykeiou">Α' Λυκείου</option>
                  <option value="b_lykeiou">Β' Λυκείου</option>
                  <option value="g_lykeiou">Γ' Λυκείου</option>
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleCreatePortfolio}
              className="bg-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-indigo-600 transition-colors shadow-lg"
            >
              ✨ Δημιουργία Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Has portfolio
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📁 Το Portfolio μου</h1>
          <p className="text-gray-600">Οι εργασίες, τα επιτεύγματα και οι στόχοι σου</p>
        </div>

        {/* Portfolio Overview */}
        <PortfolioOverview
          portfolio={portfolio}
          locale="el"
          onArtifactClick={handleArtifactClick}
          onBadgeClick={handleBadgeClick}
        />

        {/* Reflection Modal */}
        {showReflection && selectedArtifact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Αναστοχασμός</h2>
                  <button
                    onClick={() => {
                      setShowReflection(false);
                      setSelectedArtifact(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <SelfReflectionForm
                  artifactTitle={selectedArtifact.title}
                  gradeLevel={gradeLevel.includes('lykeio') ? 'lykeio' : gradeLevel.includes('gymnasio') ? 'gymnasio' : 'primary'}
                  locale="el"
                  onSubmit={handleReflectionSubmit}
                  onCancel={() => {
                    setShowReflection(false);
                    setSelectedArtifact(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Add Reflection Button (floating) */}
        {selectedArtifact && !showReflection && (
          <button
            onClick={() => setShowReflection(true)}
            className="fixed bottom-6 right-6 bg-indigo-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-600 transition-colors"
          >
            ✍️ Προσθήκη Αναστοχασμού
          </button>
        )}
      </div>
    </div>
  );
}
