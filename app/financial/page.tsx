'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  percentage: number;
  color: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string;
}

// ============================================
// BUDGET SIMULATOR COMPONENT
// ============================================

function BudgetSimulator() {
  const [income, setIncome] = useState(100);
  const [categories, setCategories] = useState<BudgetCategory[]>([
    { id: 'needs', name: 'Ανάγκες', icon: '🏠', percentage: 50, color: 'bg-blue-500' },
    { id: 'wants', name: 'Επιθυμίες', icon: '🎮', percentage: 30, color: 'bg-purple-500' },
    { id: 'savings', name: 'Αποταμίευση', icon: '🐷', percentage: 20, color: 'bg-green-500' },
  ]);

  const updatePercentage = (id: string, newValue: number) => {
    const otherCategories = categories.filter(c => c.id !== id);
    const otherTotal = otherCategories.reduce((sum, c) => sum + c.percentage, 0);
    const maxAllowed = 100 - otherTotal;
    const adjustedValue = Math.min(Math.max(0, newValue), maxAllowed);
    
    setCategories(categories.map(c => 
      c.id === id ? { ...c, percentage: adjustedValue } : c
    ));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">💰 Προϋπολογισμός 50/30/20</h2>
      
      <div className="mb-6">
        <label className="text-sm text-gray-600 mb-2 block">Μηνιαίο εισόδημα (€)</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full p-3 border border-gray-200 rounded-xl text-xl font-bold text-center"
        />
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="font-medium text-gray-700">{cat.name}</span>
              </span>
              <span className="font-bold text-gray-800">
                €{Math.round(income * cat.percentage / 100)} ({cat.percentage}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cat.percentage}
              onChange={(e) => updatePercentage(cat.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className={`h-3 ${cat.color} rounded-full mt-1`} style={{ width: `${cat.percentage}%` }} />
          </div>
        ))}
      </div>

      <div className="mt-6 bg-yellow-50 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>Κανόνας 50/30/20:</strong> 50% για ανάγκες (τροφή, στέγη), 30% για επιθυμίες (διασκέδαση), 20% για αποταμίευση!
        </p>
      </div>
    </div>
  );
}

// ============================================
// COMPOUND INTEREST CALCULATOR
// ============================================

function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState(100);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);
  const [monthlyAdd, setMonthlyAdd] = useState(10);

  const calculateFutureValue = () => {
    const r = rate / 100;
    const n = 12;
    const principalFV = principal * Math.pow(1 + r/n, n * years);
    const contributionFV = monthlyAdd * ((Math.pow(1 + r/n, n * years) - 1) / (r/n));
    return Math.round(principalFV + contributionFV);
  };

  const futureValue = calculateFutureValue();
  const totalContributed = principal + (monthlyAdd * 12 * years);
  const interestEarned = futureValue - totalContributed;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">📈 Υπολογιστής Ανατοκισμού</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Αρχικό ποσό (€)</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Μηνιαία προσθήκη (€)</label>
          <input
            type="number"
            value={monthlyAdd}
            onChange={(e) => setMonthlyAdd(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Επιτόκιο (%)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Χρόνια</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white mb-4">
        <p className="text-sm opacity-90">Μετά από {years} χρόνια θα έχεις:</p>
        <p className="text-3xl font-bold">€{futureValue.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-600">Συνολική κατάθεση</p>
          <p className="text-xl font-bold text-blue-600">€{totalContributed.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-600">Κέρδος από τόκους</p>
          <p className="text-xl font-bold text-green-600">€{interestEarned.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 bg-purple-50 rounded-xl p-4">
        <p className="text-sm text-purple-800">
          🪄 <strong>Η μαγεία του ανατοκισμού:</strong> Τα χρήματά σου κερδίζουν τόκους, και μετά οι τόκοι κερδίζουν τόκους!
        </p>
      </div>
    </div>
  );
}

// ============================================
// SAVINGS GOALS COMPONENT
// ============================================

function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([
    { id: '1', name: 'Νέο παιχνίδι', target: 60, current: 25, icon: '🎮' },
    { id: '2', name: 'Ποδήλατο', target: 200, current: 80, icon: '🚲' },
  ]);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(50);

  const addGoal = () => {
    if (!newGoalName) return;
    const icons = ['🎯', '⭐', '🎁', '📱', '👟', '🎸'];
    setGoals([...goals, {
      id: Date.now().toString(),
      name: newGoalName,
      target: newGoalTarget,
      current: 0,
      icon: icons[Math.floor(Math.random() * icons.length)]
    }]);
    setNewGoalName('');
    setNewGoalTarget(50);
  };

  const addToGoal = (id: string, amount: number) => {
    setGoals(goals.map(g => 
      g.id === id ? { ...g, current: Math.min(g.target, g.current + amount) } : g
    ));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🎯 Στόχοι Αποταμίευσης</h2>

      <div className="space-y-4 mb-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center gap-2">
                <span className="text-2xl">{goal.icon}</span>
                <span className="font-medium">{goal.name}</span>
              </span>
              <span className="text-sm text-gray-500">
                €{goal.current} / €{goal.target}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
                style={{ width: `${(goal.current / goal.target) * 100}%` }}
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 20].map((amount) => (
                <button
                  key={amount}
                  onClick={() => addToGoal(goal.id, amount)}
                  disabled={goal.current >= goal.target}
                  className="flex-1 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                >
                  +€{amount}
                </button>
              ))}
            </div>
            {goal.current >= goal.target && (
              <p className="text-center text-green-600 mt-2 font-medium">🎉 Στόχος επιτεύχθηκε!</p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Προσθήκη νέου στόχου:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
            placeholder="Όνομα στόχου"
            className="flex-1 p-2 border border-gray-200 rounded-lg"
          />
          <input
            type="number"
            value={newGoalTarget}
            onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 0)}
            className="w-20 p-2 border border-gray-200 rounded-lg"
          />
          <button
            onClick={addGoal}
            disabled={!newGoalName}
            className="px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function FinancialLiteracyPage() {
  const [activeTab, setActiveTab] = useState<'budget' | 'compound' | 'goals'>('budget');

  useEffect(() => {
    const saveProgress = async () => {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'financial',
            activity_type: 'lesson',
            activity_id: activeTab,
            completed: true,
            metadata: { tool: activeTab }
          }),
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    };

    const timer = setTimeout(saveProgress, 5000);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const tabs = [
    { id: 'budget', label: 'Προϋπολογισμός', icon: '💰' },
    { id: 'compound', label: 'Ανατοκισμός', icon: '📈' },
    { id: 'goals', label: 'Στόχοι', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 Οικονομικός Γραμματισμός</h1>
          <p className="text-gray-600">Μάθε να διαχειρίζεσαι τα χρήματά σου έξυπνα</p>
        </div>

        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {activeTab === 'budget' && <BudgetSimulator />}
          {activeTab === 'compound' && <CompoundInterestCalculator />}
          {activeTab === 'goals' && <SavingsGoals />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white"
        >
          <h3 className="font-semibold text-lg mb-3">💡 Χρυσοί Κανόνες</h3>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Πλήρωσε πρώτα τον εαυτό σου:</strong> Αποταμίευσε πριν ξοδέψεις</li>
            <li>• <strong>Περίμενε 24 ώρες:</strong> Πριν αγοράσεις κάτι ακριβό, σκέψου το μια μέρα</li>
            <li>• <strong>Ξεκίνα νωρίς:</strong> Ο χρόνος είναι ο καλύτερος φίλος του ανατοκισμού</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
