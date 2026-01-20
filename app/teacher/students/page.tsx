'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  lastActive: string;
  progress: number;
  streak: number;
  badges: number;
  subjects: {
    name: string;
    progress: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

const demoStudents: Student[] = [
  {
    id: '1',
    name: 'Μαρία Π.',
    avatar: '👩',
    grade: 'Β\' Γυμνασίου',
    lastActive: '2 ώρες πριν',
    progress: 78,
    streak: 12,
    badges: 8,
    subjects: [
      { name: 'Μαθηματικά', progress: 85, trend: 'up' },
      { name: 'Φυσική', progress: 72, trend: 'stable' },
      { name: 'Ελληνικά', progress: 90, trend: 'up' },
    ],
  },
  {
    id: '2',
    name: 'Γιάννης Κ.',
    avatar: '👨',
    grade: 'Β\' Γυμνασίου',
    lastActive: '1 ημέρα πριν',
    progress: 65,
    streak: 5,
    badges: 4,
    subjects: [
      { name: 'Μαθηματικά', progress: 60, trend: 'down' },
      { name: 'Φυσική', progress: 68, trend: 'stable' },
      { name: 'Ελληνικά', progress: 75, trend: 'up' },
    ],
  },
  {
    id: '3',
    name: 'Ελένη Μ.',
    avatar: '👩',
    grade: 'Β\' Γυμνασίου',
    lastActive: '3 ώρες πριν',
    progress: 92,
    streak: 21,
    badges: 12,
    subjects: [
      { name: 'Μαθηματικά', progress: 95, trend: 'up' },
      { name: 'Φυσική', progress: 88, trend: 'up' },
      { name: 'Ελληνικά', progress: 94, trend: 'stable' },
    ],
  },
  {
    id: '4',
    name: 'Νίκος Α.',
    avatar: '👨',
    grade: 'Β\' Γυμνασίου',
    lastActive: '5 ημέρες πριν',
    progress: 45,
    streak: 0,
    badges: 2,
    subjects: [
      { name: 'Μαθηματικά', progress: 40, trend: 'down' },
      { name: 'Φυσική', progress: 50, trend: 'down' },
      { name: 'Ελληνικά', progress: 55, trend: 'stable' },
    ],
  },
  {
    id: '5',
    name: 'Σοφία Δ.',
    avatar: '👩',
    grade: 'Β\' Γυμνασίου',
    lastActive: '30 λεπτά πριν',
    progress: 83,
    streak: 8,
    badges: 6,
    subjects: [
      { name: 'Μαθηματικά', progress: 80, trend: 'up' },
      { name: 'Φυσική', progress: 85, trend: 'up' },
      { name: 'Ελληνικά', progress: 82, trend: 'stable' },
    ],
  },
];

type SortKey = 'name' | 'progress' | 'streak' | 'lastActive';
type FilterStatus = 'all' | 'active' | 'inactive' | 'struggling';

export default function StudentProgressPage() {
  const [students] = useState<Student[]>(demoStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = 
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? student.streak > 0 :
        filterStatus === 'inactive' ? student.streak === 0 :
        student.progress < 50;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'progress': return b.progress - a.progress;
        case 'streak': return b.streak - a.streak;
        default: return 0;
      }
    });

  const classStats = {
    avgProgress: Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length),
    activeStudents: students.filter(s => s.streak > 0).length,
    totalStudents: students.length,
    strugglingStudents: students.filter(s => s.progress < 50).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/teacher" className="text-gray-400 hover:text-gray-600">
                ← Πίσω
              </Link>
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800">Πρόοδος Μαθητών</h1>
                <p className="text-sm text-gray-500">Β\' Γυμνασίου - Τμήμα Α</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              📤 Εξαγωγή Αναφοράς
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Class Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Συνολικοί Μαθητές</p>
            <p className="text-2xl font-bold text-gray-800">{classStats.totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Μέση Πρόοδος</p>
            <p className="text-2xl font-bold text-purple-600">{classStats.avgProgress}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Ενεργοί (streak)</p>
            <p className="text-2xl font-bold text-green-600">{classStats.activeStudents}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Χρειάζονται Βοήθεια</p>
            <p className="text-2xl font-bold text-red-600">{classStats.strugglingStudents}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Αναζήτηση μαθητή..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Όλοι' },
              { id: 'active', label: 'Ενεργοί' },
              { id: 'inactive', label: 'Ανενεργοί' },
              { id: 'struggling', label: 'Χρειάζονται Βοήθεια' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id as FilterStatus)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === filter.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="name">Όνομα</option>
            <option value="progress">Πρόοδος</option>
            <option value="streak">Streak</option>
          </select>
        </div>

        {/* Students List */}
        <div className="grid gap-4">
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedStudent(student)}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {student.avatar}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    {student.streak > 7 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                        🔥 {student.streak} ημέρες
                      </span>
                    )}
                    {student.progress < 50 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        ⚠️ Χρειάζεται βοήθεια
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Τελευταία δραστηριότητα: {student.lastActive}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Πρόοδος</p>
                    <p className={`font-bold ${
                      student.progress >= 70 ? 'text-green-600' :
                      student.progress >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{student.progress}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Streak</p>
                    <p className="font-bold text-orange-600">{student.streak}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Badges</p>
                    <p className="font-bold text-purple-600">{student.badges}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-24 hidden lg:block">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        student.progress >= 70 ? 'bg-green-500' :
                        student.progress >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>

                <span className="text-gray-400">→</span>
              </div>

              {/* Subject Progress (collapsed) */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                {student.subjects.map(subject => (
                  <div key={subject.name} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{subject.name}</span>
                        <span className="text-xs font-medium">{subject.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${subject.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs ${
                      subject.trend === 'up' ? 'text-green-500' :
                      subject.trend === 'down' ? 'text-red-500' :
                      'text-gray-400'
                    }`}>
                      {subject.trend === 'up' ? '↑' : subject.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <span className="text-4xl">🔍</span>
            <p className="text-gray-500 mt-4">Δεν βρέθηκαν μαθητές</p>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                    {selectedStudent.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                    <p className="text-gray-500">{selectedStudent.grade}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{selectedStudent.progress}%</p>
                  <p className="text-sm text-gray-500">Πρόοδος</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{selectedStudent.streak}</p>
                  <p className="text-sm text-gray-500">Streak</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{selectedStudent.badges}</p>
                  <p className="text-sm text-gray-500">Badges</p>
                </div>
              </div>

              {/* Subject Details */}
              <h3 className="font-semibold mb-3">Πρόοδος ανά Μάθημα</h3>
              <div className="space-y-3 mb-6">
                {selectedStudent.subjects.map(subject => (
                  <div key={subject.name} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{subject.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                          subject.trend === 'up' ? 'text-green-500' :
                          subject.trend === 'down' ? 'text-red-500' :
                          'text-gray-400'
                        }`}>
                          {subject.trend === 'up' ? '↑ Βελτιώνεται' : 
                           subject.trend === 'down' ? '↓ Χρειάζεται προσοχή' : 
                           '→ Σταθερός'}
                        </span>
                        <span className="font-bold">{subject.progress}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700">
                  💬 Αποστολή Μηνύματος
                </button>
                <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">
                  📊 Πλήρης Αναφορά
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
