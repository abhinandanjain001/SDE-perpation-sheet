import React, { useState, useMemo, useEffect } from 'react';
import { useSheetStore } from './store';
import { Topic, SubTopic, Question, ModalState, Difficulty } from './types';
import { PlusIcon, EditIcon, DeleteIcon, GripIcon, ExternalLinkIcon, CheckIcon } from './components/Icons';
import AddEditModal from './components/AddEditModal';
import { ProgressDashboardModal } from './components/ProgressDashboardModal';
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import Auth from './components/Auth';
import { AnnouncementsView } from './components/AnnouncementsView';
import { StudyMaterialsView } from './components/StudyMaterialsView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<{ role: 'admin' | 'student'; completedQuestions: string[] } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // New States for Companies Filter, Admin Progression Dashboard, and Progress Modal
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheet' | 'students' | 'announcements' | 'materials'>('sheet');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<any | null>(null);

  // Diagnostics and troubleshooting state for Firebase permission errors
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(true);
  const [rulesCopied, setRulesCopied] = useState(false);

  // Custom non-blocking modal overlay state to bypass sandboxed iFrame blockages of alert/confirm/prompt
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'prompt';
    placeholder?: string;
    onConfirm: (val?: string) => void;
    onCancel?: () => void;
  } | null>(null);
  const [dialogInput, setDialogInput] = useState('');

  const showCustomAlert = (title: string, message: string) => {
    setCustomDialog({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => setCustomDialog(null)
    });
  };

  const showCustomConfirm = (title: string, message: string, onYes: () => void) => {
    setCustomDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        onYes();
        setCustomDialog(null);
      }
    });
  };

  const showCustomPrompt = (title: string, message: string, placeholder: string, onYes: (val: string) => void) => {
    setDialogInput('');
    setCustomDialog({
      isOpen: true,
      title,
      message,
      type: 'prompt',
      placeholder,
      onConfirm: (val) => {
        onYes(val || '');
        setCustomDialog(null);
      }
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const { 
    topics, 
    title, 
    lastUpdated, 
    deleteTopic, 
    deleteSubTopic, 
    deleteQuestion,
    reorderTopics
  } = useSheetStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, mode: 'ADD' });
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['t-basics']));
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load user profile from firestore with robust localStorage fallback merge
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    
    const loadProfile = async () => {
      setLoadingProfile(true);
      
      // Load offline cached progress
      let localCompleted: string[] = [];
      try {
        const cached = localStorage.getItem(`completed_${user.uid}`);
        if (cached) localCompleted = JSON.parse(cached);
      } catch (e) {}

      try {
        const docRef = doc(db, 'users', user.uid);
        let snap;
        try {
          snap = await getDoc(docRef);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.GET, `users/${user.uid}`);
          return;
        }

        if (snap.exists()) {
          const data = snap.data();
          const cloudCompleted = data.completedQuestions || [];
          const mergedCompleted = Array.from(new Set([...cloudCompleted, ...localCompleted]));

          setUserProfile({
            role: data.role || 'student',
            completedQuestions: mergedCompleted
          });

          localStorage.setItem(`completed_${user.uid}`, JSON.stringify(mergedCompleted));
          if (cloudCompleted.length !== mergedCompleted.length) {
            try {
              await setDoc(docRef, { completedQuestions: mergedCompleted }, { merge: true });
            } catch (dbErr: any) {
              handleFirestoreError(dbErr, OperationType.UPDATE, `users/${user.uid}`);
            }
          }
        } else {
          const defaultProfile = { role: 'student' as const, completedQuestions: localCompleted };
          try {
            await setDoc(docRef, {
              email: user.email,
              displayName: user.displayName || 'Student',
              createdAt: new Date().toISOString(),
              role: 'student',
              completedQuestions: localCompleted
            });
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.CREATE, `users/${user.uid}`);
          }
          setUserProfile(defaultProfile);
        }
      } catch (err: any) {
        console.error("Error loading user profile, falling back to cached state:", err);
        let displayMsg = err?.message || String(err);
        try {
          const parsed = JSON.parse(displayMsg);
          if (parsed && parsed.error) displayMsg = parsed.error;
        } catch (e) {}

        if (displayMsg.toLowerCase().includes("permission") || displayMsg.toLowerCase().includes("insufficient")) {
          setFirestoreError(displayMsg);
        }
        setUserProfile({
          role: 'student',
          completedQuestions: localCompleted
        });
      } finally {
        setLoadingProfile(false);
      }
    };
    
    loadProfile();
  }, [user]);

  // Load global sheet structure from firestore
  useEffect(() => {
    if (!user) return;
    
    const loadGlobalSheet = async () => {
      try {
        const docRef = doc(db, 'sheet', 'global');
        let snap;
        try {
          snap = await getDoc(docRef);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.GET, 'sheet/global');
          return;
        }

        if (snap.exists()) {
          const data = snap.data();
          if (data.topics) {
            useSheetStore.getState().setTopics(data.topics);
          }
        } else if (userProfile?.role === 'admin') {
          const currentTopics = useSheetStore.getState().topics;
          try {
            await setDoc(docRef, {
              topics: currentTopics,
              lastUpdated: new Date().toISOString(),
              title: 'JECRC Special SDE SHEET'
            });
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.CREATE, 'sheet/global');
          }
        }
      } catch (err: any) {
        console.error("Error loading sheet:", err);
        let displayMsg = err?.message || String(err);
        try {
          const parsed = JSON.parse(displayMsg);
          if (parsed && parsed.error) displayMsg = parsed.error;
        } catch (e) {}

        if (displayMsg.toLowerCase().includes("permission") || displayMsg.toLowerCase().includes("insufficient")) {
          setFirestoreError(displayMsg);
        }
      }
    };
    
    loadGlobalSheet();
  }, [user, userProfile?.role]);

  // Synchronize master SDE roadmap changes by Admin to Firestore in real-time
  useEffect(() => {
    if (!user || !userProfile || userProfile.role !== 'admin') return;

    const unsubscribe = useSheetStore.subscribe((state) => {
      const saveSheetToFirestore = async () => {
        try {
          const docRef = doc(db, 'sheet', 'global');
          try {
            await setDoc(docRef, {
              topics: state.topics,
              lastUpdated: new Date().toISOString(),
              title: 'JECRC Special SDE SHEET'
            });
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.UPDATE, 'sheet/global');
          }
        } catch (err: any) {
          console.error("Error saving SDE sheet to Firestore:", err);
          let displayMsg = err?.message || String(err);
          try {
            const parsed = JSON.parse(displayMsg);
            if (parsed && parsed.error) displayMsg = parsed.error;
          } catch (e) {}

          if (displayMsg.toLowerCase().includes("permission") || displayMsg.toLowerCase().includes("insufficient")) {
            setFirestoreError(displayMsg);
          }
        }
      };
      saveSheetToFirestore();
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  // Map global sheet topics such that individual student's completion status is injected
  const mappedTopics = useMemo(() => {
    if (!userProfile) return topics;
    const completedSet = new Set(userProfile.completedQuestions || []);
    return topics.map(t => ({
      ...t,
      subTopics: t.subTopics.map(st => ({
        ...st,
        questions: st.questions.map(q => ({
          ...q,
          completed: completedSet.has(q.id)
        }))
      }))
    }));
  }, [topics, userProfile]);

  // Statistics
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    mappedTopics.forEach(t => t.subTopics.forEach(st => st.questions.forEach(q => {
      total++;
      if (q.completed) completed++;
    })));
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [mappedTopics]);

  const filteredTopics = useMemo(() => {
    let baseTopics = mappedTopics;
    
    // Filter questions by selected company first if any
    if (selectedCompany) {
      baseTopics = mappedTopics.map(t => ({
        ...t,
        subTopics: t.subTopics.map(st => ({
          ...st,
          questions: st.questions.filter(q => q.companies && q.companies.some(c => c.toLowerCase() === selectedCompany.toLowerCase()))
        })).filter(st => st.questions.length > 0)
      })).filter(t => t.subTopics.length > 0);
    }

    if (!searchQuery) return baseTopics;
    const query = searchQuery.toLowerCase();
    
    return baseTopics.reduce((acc: Topic[], topic) => {
      const topicMatches = topic.title.toLowerCase().includes(query) || topic.id.toLowerCase().includes(query);
      
      const filteredSubTopics = topic.subTopics.reduce((subAcc: SubTopic[], subTopic) => {
        const subTopicMatches = subTopic.title.toLowerCase().includes(query) || subTopic.id.toLowerCase().includes(query);
        
        const filteredQuestions = subTopic.questions.filter(q => 
          q.title.toLowerCase().includes(query) || 
          (q.companies && q.companies.some(c => c.toLowerCase().includes(query)))
        );
        
        if (topicMatches || subTopicMatches || filteredQuestions.length > 0) {
          subAcc.push({
            ...subTopic,
            questions: (topicMatches || subTopicMatches) ? subTopic.questions : filteredQuestions
          });
        }
        return subAcc;
      }, []);
      
      if (topicMatches || filteredSubTopics.length > 0) {
        acc.push({
          ...topic,
          subTopics: topicMatches ? topic.subTopics : filteredSubTopics
        });
      }
      
      return acc;
    }, []);
  }, [mappedTopics, searchQuery, selectedCompany]);

  // Load students for admin directory
  const loadStudentsDirectory = async () => {
    if (!user || userProfile?.role !== 'admin') return;
    setLoadingStudents(true);
    try {
      let snap;
      try {
        snap = await getDocs(collection(db, 'users'));
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.LIST, 'users');
        return;
      }
      const list = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          displayName: data.displayName || data.email?.split('@')[0] || 'Anonymous Student',
          email: data.email || '',
          role: data.role || 'student',
          completedQuestions: data.completedQuestions || [],
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'
        };
      });
      setStudents(list);
    } catch (err) {
      console.error("Error loading students directory:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (userProfile?.role === 'admin' && activeTab === 'students') {
      loadStudentsDirectory();
    }
  }, [userProfile, activeTab]);

  const handleToggleAdminStatus = async (studentId: string, currentRole: 'admin' | 'student') => {
    if (studentId === user?.uid) {
      showCustomAlert("Action Prohibited", "You cannot change your own administrative status!");
      return;
    }
    const nextRole = currentRole === 'admin' ? 'student' : 'admin';
    showCustomConfirm(
      "Confirm Role Change",
      `Are you sure you want to change this student's role to ${nextRole}?`,
      async () => {
        try {
          const docRef = doc(db, 'users', studentId);
          await updateDoc(docRef, { role: nextRole });
          
          // Update local table list state
          setStudents(prev => prev.map(s => s.id === studentId ? { ...s, role: nextRole } : s));
          showCustomAlert("Success", `User role upgraded to ${nextRole} successfully!`);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.UPDATE, `users/${studentId}`);
          showCustomAlert("Error", "Failed to modify user profile role: admin permissions required or write error.");
        }
      }
    );
  };

  const toggleTopic = (id: string) => {
    const next = new Set(expandedTopics);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTopics(next);
  };

  const openModal = (
    type: ModalState['type'], 
    mode: ModalState['mode'], 
    ids?: { parentId?: string; grandParentId?: string; editId?: string },
    initialData?: any
  ) => {
    if (userProfile?.role !== 'admin') {
      showCustomAlert('Unauthorized', 'Only administrators can access admin panel structure controls.');
      return;
    }
    setModalState({
      isOpen: true,
      type,
      mode,
      parentId: ids?.parentId,
      grandParentId: ids?.grandParentId,
      editId: ids?.editId,
      initialData
    });
  };

  const difficultyStyles: Record<Difficulty, string> = {
    Easy: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard: 'bg-rose-100 text-rose-700'
  };

  const handleDeleteTopic = (id: string) => {
    if (userProfile?.role !== 'admin') return;
    showCustomConfirm(
      "Confirm Delete Topic",
      "Are you sure you want to delete this topic and all its contents?",
      () => {
        deleteTopic(id);
      }
    );
  };

  const handleDeleteSubTopic = (topicId: string, subTopicId: string) => {
    if (userProfile?.role !== 'admin') return;
    showCustomConfirm(
      "Confirm Delete Section",
      "Are you sure you want to delete this section and all its problems?",
      () => {
        deleteSubTopic(topicId, subTopicId);
      }
    );
  };

  const handleDeleteQuestion = (topicId: string, subTopicId: string, questionId: string) => {
    if (userProfile?.role !== 'admin') return;
    showCustomConfirm(
      "Confirm Delete Problem",
      "Are you sure you want to delete this problem?",
      () => {
        deleteQuestion(topicId, subTopicId, questionId);
      }
    );
  };

  const handleToggleQuestionStatus = async (topicId: string, subTopicId: string, questionId: string) => {
    if (!user || !userProfile) return;
    
    const completed = userProfile.completedQuestions || [];
    let updated: string[];
    if (completed.includes(questionId)) {
      updated = completed.filter(id => id !== questionId);
    } else {
      updated = [...completed, questionId];
    }
    
    // Update local state for instant snappy UI response
    setUserProfile(prev => prev ? { ...prev, completedQuestions: updated } : null);
    
    try {
      localStorage.setItem(`completed_${user.uid}`, JSON.stringify(updated));
    } catch (_) {}
    
    // Record question completion to Firestore
    try {
      const docRef = doc(db, 'users', user.uid);
      try {
        await setDoc(docRef, { completedQuestions: updated }, { merge: true });
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.UPDATE, `users/${user.uid}`);
      }
    } catch (err: any) {
      console.error("Error writing progress to Firestore:", err);
      let displayMsg = err?.message || String(err);
      try {
        const parsed = JSON.parse(displayMsg);
        if (parsed && parsed.error) displayMsg = parsed.error;
      } catch (e) {}

      if (displayMsg.toLowerCase().includes("permission") || displayMsg.toLowerCase().includes("insufficient")) {
        setFirestoreError(displayMsg);
      }
    }
  };

  if (loadingAuth || (user && loadingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-md bg-slate-950/90 text-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 px-3 bg-white border border-slate-700 rounded-xl flex items-center justify-center shadow-md select-none shrink-0">
              <img 
                src="/jecrc_logo.png" 
                alt="JECRC Logo" 
                className="h-7 w-auto object-contain" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "/jecrc logo.png";
                }}
              />
              <span className="text-[11px] font-black text-slate-900 tracking-wider ml-1.5 hidden sm:inline-block">JECRC</span>
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white leading-none uppercase tracking-widest">{title}</h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Roadmap Tracker</p>
            </div>
          </div>

          {/* Core Navigation and Admin Action Board */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden md:flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('sheet')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'sheet' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                📝 SDE Sheet
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'announcements' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                📢 Announcements
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'materials' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                📚 Study Material
              </button>
              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'students' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  👥 Students ({students.length})
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-bold text-white">{stats.completed}/{stats.total} Solved</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stats.percentage}% Completed</div>
              </div>
              <div className="w-32 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500 ease-out" 
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>

            {userProfile?.role === 'admin' && activeTab === 'sheet' && (
              <button 
                onClick={() => openModal('TOPIC', 'ADD')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                <PlusIcon /> Add Topic
              </button>
            )}



            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </button>
              
              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName || 'Guest User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    {/* Progress details shown in profile option */}
                    <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-slate-600">Your Completion</span>
                        <span className="text-xs font-bold text-indigo-600">{stats.completed}/{stats.total} Qs</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-300" 
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2.5 text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-500">{stats.percentage}% Complete</span>
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-[9px]">
                          {userProfile?.role.toUpperCase()}
                        </span>
                      </div>

                      {userProfile?.role === 'student' && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              showCustomPrompt(
                                "Upgrade Profile",
                                "Enter Admin Access Code to upgrade your profile to Admin:",
                                "Enter passcode (e.g. admin123)",
                                async (code) => {
                                  if (code === "admin123") {
                                    try {
                                      const docRef = doc(db, 'users', user.uid);
                                      await setDoc(docRef, { role: 'admin' }, { merge: true });
                                      setUserProfile(prev => prev ? { ...prev, role: 'admin' } : { role: 'admin', completedQuestions: [] });
                                      showCustomAlert("Upgrade Successful", "Success! Your profile has been upgraded to Admin. Refreshing profile parameters...");
                                      setTimeout(() => {
                                        window.location.reload();
                                      }, 1505);
                                    } catch (err: any) {
                                      console.error(err);
                                      showCustomAlert("Firestore Error", "Failed to update role in Firestore: Please ensure you have correct/published security rules in your Firebase Console.");
                                    }
                                  } else {
                                    showCustomAlert("Invalid Passcode", "Invalid admin passcode.");
                                  }
                                }
                              );
                            }}
                            className="w-full text-center text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg py-1.5 transition-colors border border-amber-200 cursor-pointer"
                          >
                            🔑 Upgrade to Admin Profile
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      {/* Detailed Stats pie chart modal activation button */}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setSelectedStudentForProgress({
                            displayName: user.displayName || 'Guest Student',
                            email: user.email || '',
                            role: userProfile?.role || 'student',
                            completedQuestions: userProfile?.completedQuestions || []
                          });
                          setIsProgressModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-indigo-600 hover:bg-slate-50 transition-colors flex items-center gap-2 font-bold border-b border-slate-50"
                      >
                        <svg className="text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 20V12h8"/></svg>
                        Detailed Analytics (Pie Chart)
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          signOut(auth);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Mobile-only Progress Stats Card */}
        <div className="block md:hidden bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm mb-6 duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">DSA Sheet Progress</p>
              <h3 className="text-base font-black text-slate-800 mt-1.5">{stats.completed} of {stats.total} Solved</h3>
            </div>
            <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100/80 rounded-xl text-indigo-700 text-xs font-black">
              {stats.percentage}%
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
        {firestoreError && showConfigGuide && (
          <div className="mb-8 bg-amber-50/95 border border-amber-200/80 rounded-3xl p-6 shadow-md relative animate-fade-in text-slate-800 backdrop-blur-sm">
            <button 
              onClick={() => setShowConfigGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-white/80 p-1 rounded-full border border-slate-100"
              title="Dismiss instruction"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200 shadow-sm text-xl">
                🔑
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="font-extrabold text-amber-900 text-base flex items-center gap-2">
                    Firestore Security Rules Required (Action Needed)
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Your Firebase database (<strong>dsa-road-map</strong>) has returned a <strong className="text-amber-800">"Permission Denied"</strong> exception.
                    No worries! We've automatically activated our <strong>offline fallback engine (LocalStorage)</strong> so all of your roadmap selections and question completions are fully preserved!
                  </p>
                </div>
                
                <div className="text-xs bg-white/90 border border-amber-200 p-4 rounded-xl space-y-2 shadow-inner">
                  <p className="font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 text-[10px]">
                    <span>🛠️</span> Deploy secure rules in 3 simple steps:
                  </p>
                  <ol className="list-decimal pl-4 space-y-2 text-slate-600 font-semibold leading-relaxed">
                    <li>
                      Open your{" "}
                      <a 
                        href="https://console.firebase.google.com/project/dsa-road-map/firestore/rules" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-extrabold border-b border-indigo-200"
                      >
                        Firebase Console Rules Panel
                        <svg className="inline" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    </li>
                    <li>Copy the secure configuration block below.</li>
                    <li>Paste it into your Firebase rules console editor and click <strong className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-150 font-bold">Publish</strong>.</li>
                  </ol>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between bg-slate-900 text-slate-300 text-xs px-4 py-2.5 rounded-t-2xl border-b border-slate-800">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">firestore.rules</span>
                    <button
                      onClick={() => {
                        const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny security firewall
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function getUserData(userId) {
      return get(/databases/\$(database)/documents/users/\$(userId)).data;
    }

    function isExistingUserAdmin(userId) {
      return exists(/databases/\$(database)/documents/users/\$(userId)) && 
             getUserData(userId).role == 'admin';
    }

    match /users/{userId} {
      // Any logged-in participant can view a user's basic profile card (get)
      allow get: if isSignedIn();
      
      // Only administrators can list the entire JECRC student directory
      allow list: if isSignedIn() && isExistingUserAdmin(request.auth.uid);

      // Creation rules - users can register as student or admin
      allow create: if isSignedIn() && request.auth.uid == userId && 
                    (request.resource.data.role == 'student' || request.resource.data.role == 'admin');

      // Update rules - users can update their own progress and role, and admins can modify any roles
      allow update: if isSignedIn() && (
        request.auth.uid == userId
        || 
        isExistingUserAdmin(request.auth.uid)
      );

      // Delete rule - admins or the user themselves can delete/deregister
      allow delete: if isSignedIn() && (request.auth.uid == userId || isExistingUserAdmin(request.auth.uid));
    }

    match /sheet/{document} {
      // Any authenticated user can download and read the SDE Roadmap sheet structure
      allow read: if isSignedIn();
      
      // Synthesizing structure edits is strictly confined to SDE Administrators
      allow write: if isSignedIn() && isExistingUserAdmin(request.auth.uid);
    }
  }
}`;
                        navigator.clipboard.writeText(rulesText);
                        setRulesCopied(true);
                        setTimeout(() => setRulesCopied(false), 2000);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 hover:border-slate-500 font-bold text-[10px] transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                    >
                      {rulesCopied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          Copy Rules
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed text-emerald-400 rounded-b-2xl overflow-x-auto max-h-48 border border-slate-900 shadow-inner">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny security firewall
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function getUserData(userId) {
      return get(/databases/\$(database)/documents/users/\$(userId)).data;
    }

    function isExistingUserAdmin(userId) {
      return exists(/databases/\$(database)/documents/users/\$(userId)) && 
             getUserData(userId).role == 'admin';
    }

    match /users/{userId} {
      // Any logged-in participant can view a user's basic profile card (get)
      allow get: if isSignedIn();
      
      // Only administrators can list the entire JECRC student directory
      allow list: if isSignedIn() && isExistingUserAdmin(request.auth.uid);

      // Creation rules - users can register as student or admin
      allow create: if isSignedIn() && request.auth.uid == userId && 
                    (request.resource.data.role == 'student' || request.resource.data.role == 'admin');

      // Update rules - users can update their own progress and role, and admins can modify any roles
      allow update: if isSignedIn() && (
        request.auth.uid == userId
        || 
        isExistingUserAdmin(request.auth.uid)
      );

      // Delete rule - admins or the user themselves can delete/deregister
      allow delete: if isSignedIn() && (request.auth.uid == userId || isExistingUserAdmin(request.auth.uid));
    }

    match /sheet/{document} {
      // Any authenticated user can download and read the SDE Roadmap sheet structure
      allow read: if isSignedIn();
      
      // Synthesizing structure edits is strictly confined to SDE Administrators
      allow write: if isSignedIn() && isExistingUserAdmin(request.auth.uid);
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Tab Toggle indicator with premium dark glass styling */}
        <div className="flex md:hidden bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl mb-6 border border-slate-800/80 shadow-lg overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 text-center py-2.5 px-3.5 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 ${activeTab === 'sheet' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📝 Sheet
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 text-center py-2.5 px-3.5 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 ${activeTab === 'announcements' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📢 Notice
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 text-center py-2.5 px-3.5 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 ${activeTab === 'materials' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📚 Materials
          </button>
          {userProfile?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 text-center py-2.5 px-3.5 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              👥 Students ({students.length})
            </button>
          )}
        </div>

        {activeTab === 'sheet' && (
          <>
            {/* Search & Custom Dropdown Companies filter with premium styling */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input 
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all duration-300 shadow-sm text-sm"
                    placeholder="Search problems, topics, companies..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Visual Company Dropdown Filter - Clean glassmorphic */}
                <div className="relative">
                  <select
                    value={selectedCompany}
                    onChange={e => setSelectedCompany(e.target.value)}
                    className="w-full sm:w-56 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm text-sm font-semibold text-slate-700 cursor-pointer appearance-none pr-10"
                  >
                    <option value="">🏢 Filter by Company</option>
                    <option value="Google">Google Focus</option>
                    <option value="Microsoft">Microsoft Focus</option>
                    <option value="Amazon">Amazon Focus</option>
                    <option value="Meta">Meta Focus</option>
                    <option value="Netflix">Netflix Focus</option>
                    <option value="Apple">Apple Focus</option>
                    <option value="Uber">Uber Focus</option>
                    <option value="Adobe">Adobe Focus</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex gap-2">
                 <div className="px-4 py-2 bg-emerald-50 border border-emerald-100/80 rounded-xl text-emerald-700 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 duration-300 hover:scale-[1.02]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Productive Week
                 </div>
                 <div className="px-4 py-2 bg-indigo-50 border border-indigo-100/80 rounded-xl text-indigo-700 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 duration-300 hover:scale-[1.02]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Consistency+
                 </div>
              </div>
            </div>

            {/* Hierarchy List */}
            <div className="space-y-6">
              {filteredTopics.map((topic, topicIdx) => (
                <div key={topic.id} className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
                  <div className="p-5 flex items-center justify-between group bg-slate-50/20 border-b border-slate-100">
                    <div className="flex items-center gap-4 flex-1">
                      {userProfile?.role === 'admin' && (
                        <button 
                          onClick={() => reorderTopics(topicIdx, Math.max(0, topicIdx - 1))}
                          className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-all duration-300"
                          disabled={topicIdx === 0}
                          title="Move Up"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => toggleTopic(topic.id)}
                        className="flex items-center gap-4 text-left focus:outline-none flex-1"
                      >
                        <div className={`p-1.5 rounded-xl bg-slate-100 text-slate-500 transition-transform duration-300 ${expandedTopics.has(topic.id) ? 'rotate-90 bg-indigo-50 text-indigo-600' : ''}`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                        <div>
                          <h2 className="text-base font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">{topic.title}</h2>
                          <p className="text-[11px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">Topic Overview</p>
                        </div>
                        <span className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200/60 px-2.5 py-1 rounded-full font-bold">
                          {topic.subTopics.length} sections
                        </span>
                      </button>
                    </div>
                    
                    {userProfile?.role === 'admin' && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => openModal('SUBTOPIC', 'ADD', { parentId: topic.id })}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Add Section"
                        >
                          <PlusIcon />
                        </button>
                        <button 
                          onClick={() => openModal('TOPIC', 'EDIT', { editId: topic.id }, topic)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                          title="Edit Topic"
                        >
                          <EditIcon />
                        </button>
                        <button 
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Topic"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  {expandedTopics.has(topic.id) && (
                    <div className="bg-slate-50/40 p-5 space-y-5 border-t border-slate-100">
                      {topic.subTopics.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed rounded-2xl border-slate-200 bg-white">
                          <p className="text-sm text-slate-400 font-medium mb-3">No sections in this topic yet</p>
                          {userProfile?.role === 'admin' && (
                            <button 
                              onClick={() => openModal('SUBTOPIC', 'ADD', { parentId: topic.id })}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-2 rounded-xl transition-all"
                            >
                              Create first section
                            </button>
                          )}
                        </div>
                      )}
                      
                      {topic.subTopics.map((sub, subIdx) => (
                        <div key={sub.id} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden group/sub transition-all duration-300 hover:border-slate-350">
                          <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {userProfile?.role === 'admin' && (
                                <GripIcon className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-550 transition-colors" />
                              )}
                              <h3 className="font-extrabold text-slate-700 text-sm">{sub.title}</h3>
                              <span className="text-[9px] font-black text-slate-400 border border-slate-200/60 rounded px-1.5 py-0.5 uppercase tracking-wide bg-white">
                                {sub.questions.length} problems
                              </span>
                            </div>
                            {userProfile?.role === 'admin' && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-all duration-300">
                                <button 
                                  onClick={() => openModal('QUESTION', 'ADD', { parentId: sub.id, grandParentId: topic.id })}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Add Question"
                                >
                                  <PlusIcon />
                                </button>
                                <button 
                                  onClick={() => openModal('SUBTOPIC', 'EDIT', { parentId: topic.id, editId: sub.id }, sub)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit Section"
                                >
                                  <EditIcon />
                                </button>
                                <button 
                                  onClick={() => handleDeleteSubTopic(topic.id, sub.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Section"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="divide-y divide-slate-100">
                            {sub.questions.map((q, qIdx) => {
                              // Custom dynamic hover left border accent matching difficulty
                              const borderLeftAccent: Record<Difficulty, string> = {
                                Easy: 'hover:border-l-4 hover:border-l-emerald-500',
                                Medium: 'hover:border-l-4 hover:border-l-amber-500',
                                Hard: 'hover:border-l-4 hover:border-l-rose-500'
                              };

                              return (
                                <div 
                                  key={q.id} 
                                  className={`flex items-center p-4 pl-5 transition-all duration-200 border-l-4 border-l-transparent group/row ${
                                    borderLeftAccent[q.difficulty]
                                  } ${q.completed ? 'bg-slate-50/40' : 'bg-white'}`}
                                >
                                  <button 
                                    onClick={() => handleToggleQuestionStatus(topic.id, sub.id, q.id)}
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                                      q.completed 
                                        ? 'bg-emerald-550 border-emerald-550 text-white shadow-emerald-250/30 shadow-lg scale-102' 
                                        : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/10 text-transparent'
                                    }`}
                                  >
                                    <CheckIcon />
                                  </button>
                                  
                                  <div className="ml-4 flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <a 
                                        href={q.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`text-sm font-bold transition-all hover:text-indigo-600 flex items-center gap-1.5 truncate max-w-full ${q.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                      >
                                        {q.title}
                                        <ExternalLinkIcon className="w-3.5 h-3.5 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 shrink-0" />
                                      </a>
                                      
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${difficultyStyles[q.difficulty]}`}>
                                        {q.difficulty}
                                      </span>
                                      
                                      {q.companies && q.companies.map((comp: string) => (
                                        <span key={comp} className="px-1.5 py-0.5 bg-slate-55 shadow-sm text-slate-500 rounded text-[9px] font-black border border-slate-200 uppercase tracking-wide duration-200 hover:bg-slate-100">
                                          {comp}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {userProfile?.role === 'admin' && (
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all duration-200 pl-4">
                                      <button 
                                        onClick={() => openModal('QUESTION', 'EDIT', { parentId: sub.id, grandParentId: topic.id, editId: q.id }, q)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit Problem"
                                      >
                                        <EditIcon className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteQuestion(topic.id, sub.id, q.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete Problem"
                                      >
                                        <DeleteIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {sub.questions.length === 0 && (
                            <div className="p-8 text-center bg-white">
                              <p className="text-xs text-slate-400 font-semibold mb-2">No problems listed yet</p>
                              {userProfile?.role === 'admin' && (
                                <button 
                                   onClick={() => openModal('QUESTION', 'ADD', { parentId: sub.id, grandParentId: topic.id })}
                                   className="text-[11px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                                >
                                   + Add Problem
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {filteredTopics.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                   </div>
                   <h3 className="text-lg font-black text-slate-700">No results found</h3>
                   <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">Try adjusting your search criteria or choosing a different company focus filter.</p>
                   <button 
                      onClick={() => { setSearchQuery(''); setSelectedCompany(''); }}
                      className="mt-6 text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-xl px-4 py-2 hover:bg-indigo-100 transition-colors cursor-pointer"
                   >
                     Clear Filters
                   </button>
                </div>
              )}
            </div>
          </>
        )}

      {activeTab === 'announcements' && (
        <AnnouncementsView 
          isAdmin={userProfile?.role === 'admin'} 
          currentUser={user} 
        />
      )}

      {activeTab === 'materials' && (
        <StudyMaterialsView 
          isAdmin={userProfile?.role === 'admin'} 
          currentUser={user} 
        />
      )}

      {activeTab === 'students' && userProfile?.role === 'admin' && (
        /* Students Registry and Statistics Board */
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-8 animate-fade-in">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">👥 JECRC Student Progression Analytics</h2>
            <p className="text-sm text-slate-500 mt-1">
              Real-time master dashboard tracking JECRC students progress levels. Administrators can check student profiles, view difficulty breakdowns, and maintain roles.
            </p>
          </div>

          {loadingStudents ? (
            <div className="py-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No students registered yet in the database.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Student & Contact Details</th>
                    <th className="px-6 py-4">Security Role</th>
                    <th className="px-6 py-4">SDE Sheet Progress Rate</th>
                    <th className="px-6 py-4">Analytics Chart</th>
                    <th className="px-6 py-4 text-right">Administrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const personalTotal = stats.total;
                    const personalCompleted = student.completedQuestions?.length || 0;
                    const personalPct = personalTotal > 0 ? Math.round((personalCompleted / personalTotal) * 100) : 0;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center justify-center text-sm uppercase shadow-sm">
                            {student.displayName ? student.displayName.charAt(0) : student.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{student.displayName}</p>
                            <p className="text-xs text-slate-400 font-medium">{student.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            student.role === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}>
                            {student.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 max-w-[200px]">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                              <span>{personalCompleted} / {personalTotal}</span>
                              <span>{personalPct}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border">
                              <div 
                                className="h-full bg-indigo-600 transition-all duration-300" 
                                style={{ width: `${personalPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedStudentForProgress(student);
                              setIsProgressModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-indigo-200 transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 20V12h8"/></svg>
                            View Pie Chart
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleAdminStatus(student.id, student.role)}
                            disabled={student.id === user.uid}
                            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 rounded-lg text-xs font-bold text-slate-600 shadow-sm transition-all"
                          >
                            {student.role === 'admin' ? '🛡️ Set Student' : '🔑 Set Admin'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </main>

      <AddEditModal 
        state={modalState} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
      />

      {/* Progress Chart Modal overlay */}
      {selectedStudentForProgress && (
        <ProgressDashboardModal
          isOpen={isProgressModalOpen}
          onClose={() => {
            setIsProgressModalOpen(false);
            setSelectedStudentForProgress(null);
          }}
          studentName={selectedStudentForProgress.displayName}
          studentEmail={selectedStudentForProgress.email}
          studentRole={selectedStudentForProgress.role}
          completedQuestionsIds={selectedStudentForProgress.completedQuestions || []}
          topics={topics}
        />
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-sm font-medium">Auto-saving enabled</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-700"></div>
        <div className="text-sm font-medium">
          <span className="text-indigo-400">{stats.completed}</span> / {stats.total} Completed
        </div>
      </div>

      {/* Non-blocking dialogue modal overlay to replace blocked native popup windows */}
      {customDialog && customDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[4px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {customDialog.type === 'prompt' ? '🔑 ' : customDialog.type === 'confirm' ? '⚠️ ' : 'ℹ️ '}
                {customDialog.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                {customDialog.message}
              </p>
            </div>

            {customDialog.type === 'prompt' && (
              <input
                type="password"
                className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono tracking-wider bg-slate-50 placeholder-slate-400"
                placeholder={customDialog.placeholder || 'Enter value...'}
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    customDialog.onConfirm(dialogInput);
                  }
                }}
              />
            )}

            <div className="flex gap-2.5 justify-end pt-1">
              {(customDialog.type === 'confirm' || customDialog.type === 'prompt') && (
                <button
                  type="button"
                  onClick={() => {
                    if (customDialog.onCancel) customDialog.onCancel();
                    setCustomDialog(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-600 transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => customDialog.onConfirm(dialogInput)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-100 transition-all cursor-pointer active:scale-95"
              >
                {customDialog.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
