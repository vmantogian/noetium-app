'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  user_type: string;
  can_access_teacher: boolean;
}

export default function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isTeacherMode = pathname.startsWith('/teacher');

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_type, can_access_teacher')
          .eq('user_id', user.id)
          .single();
        
        setProfile(data);
      }
    };

    fetchProfile();
  }, []);

  // Only show if user can access both modes
  if (!profile || (profile.user_type !== 'teacher' && !profile.can_access_teacher)) {
    return null;
  }

  const switchRole = (to: 'student' | 'teacher') => {
    setIsOpen(false);
    if (to === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/student');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        <span className="text-lg">{isTeacherMode ? '👩‍🏫' : '👨‍🎓'}</span>
        <span className="text-sm font-medium text-white">
          {isTeacherMode ? 'Εκπαιδευτικός' : 'Μαθητής'}
        </span>
        <span className="text-white/60">▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="p-2">
                <button
                  onClick={() => switchRole('student')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    !isTeacherMode 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-xl">👨‍🎓</span>
                  <div className="text-left">
                    <p className="font-medium">Μαθητής</p>
                    <p className="text-xs text-gray-500">Εκμάθηση & Εξάσκηση</p>
                  </div>
                  {!isTeacherMode && <span className="ml-auto">✓</span>}
                </button>

                <button
                  onClick={() => switchRole('teacher')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isTeacherMode 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-xl">👩‍🏫</span>
                  <div className="text-left">
                    <p className="font-medium">Εκπαιδευτικός</p>
                    <p className="text-xs text-gray-500">Εργαλεία & Μαθητές</p>
                  </div>
                  {isTeacherMode && <span className="ml-auto">✓</span>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
