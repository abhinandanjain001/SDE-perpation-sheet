import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { MCQ_QUESTION_POOL, MCQQuestion } from '../src/data/contestQuestions';

interface ContestAttempt {
  attemptId: string;
  topic: string;
  score: number;
  total: number;
  timeTaken: number; // in seconds
  completedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    selectedOptionIndex: number;
    correctOptionIndex: number;
    isCorrect: boolean;
  }[];
  workAreaNotes: string;
}

interface ContestViewProps {
  currentUser: any;
  userProfile: any;
  onRefreshProfile: () => void;
}

export const ContestView: React.FC<ContestViewProps> = ({
  currentUser,
  userProfile,
  onRefreshProfile,
}) => {
  // Test Setup States
  const [selectedTopic, setSelectedTopic] = useState<'Array' | 'DP' | 'Linked List' | 'Other' | 'All'>('All');
  const [testActive, setTestActive] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  // Active Test States
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({}); // questionId -> selectedOptionIndex
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({}); // questionId -> boolean
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds (1200)
  const [workNotes, setWorkNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Completed Test State
  const [latestAttempt, setLatestAttempt] = useState<ContestAttempt | null>(null);

  // Active View History Mode
  const [viewHistoryAttempt, setViewHistoryAttempt] = useState<ContestAttempt | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (testActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto submit
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testActive, timeLeft]);

  // Init randomized contest questions
  const startContest = () => {
    // 1. Filter questions based on topic
    let topicQuestions = MCQ_QUESTION_POOL.filter(
      (q) => selectedTopic === 'All' || q.topic === selectedTopic
    );

    // 2. If we don't have enough (less than 30) for this specific topic, supplement with others
    if (topicQuestions.length < 30) {
      const otherQuestions = MCQ_QUESTION_POOL.filter(
        (q) => selectedTopic !== 'All' && q.topic !== selectedTopic
      );
      // Shuffle other questions to supplement randomly
      const shuffledOthers = [...otherQuestions].sort(() => 0.5 - Math.random());
      topicQuestions = [...topicQuestions, ...shuffledOthers];
    }

    // 3. Shuffle the entire target list & pick exactly 30 questions
    const shuffledPool = [...topicQuestions].sort(() => 0.5 - Math.random()).slice(0, 30);

    setQuestions(shuffledPool);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setTimeLeft(1200); // Reset to 20 mins (1200 seconds)
    setWorkNotes('');
    setTestActive(true);
    setTestCompleted(false);
    setLatestAttempt(null);
    setViewHistoryAttempt(null);
  };

  const handleAutoSubmit = () => {
    submitContest(true);
  };

  const submitContest = async (forceAuto = false) => {
    if (submitting) return;

    if (!forceAuto && Object.keys(selectedAnswers).length < 30) {
      const unanswered = 30 - Object.keys(selectedAnswers).length;
      if (!confirm(`You have ${unanswered} unanswered MCQ questions left! Are you sure you wish to submit the contest?`)) {
        return;
      }
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Calculate results
      let score = 0;
      const attemptAnswers = questions.map((q) => {
        const selected = selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1;
        const isCorrect = selected === q.correctOptionIndex;
        if (isCorrect) score++;

        return {
          questionId: q.id,
          questionText: q.question,
          selectedOptionIndex: selected,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect,
        };
      });

      const spentSeconds = 1200 - timeLeft;
      const newAttempt: ContestAttempt = {
        attemptId: 'att-' + Date.now(),
        topic: selectedTopic === 'All' ? 'Mixed Challenge' : selectedTopic,
        score,
        total: 30,
        timeTaken: spentSeconds,
        completedAt: new Date().toISOString(),
        answers: attemptAnswers,
        workAreaNotes: workNotes,
      };

      // Save to Firebase
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        contestHistory: arrayUnion(newAttempt),
      });

      setLatestAttempt(newAttempt);
      setTestActive(false);
      setTestCompleted(true);
      onRefreshProfile(); // Refreshes student states in the main App.tsx
    } catch (e) {
      console.error(e);
      alert('SDE Contest save error occurred. Retrying.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Student progress details summary metrics
  const sortedHistory = [...(userProfile?.contestHistory || [])].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return (
    <div className="space-y-8 animate-fade-in" id="contest-view-main-card">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-500/30">
              JECRC SDE GATEWAY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">Live Performance Logs</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1.5">🎯 Interactive SDE Contest Playground</h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
            Hone your theoretical and conceptual SDE prowess. Start a strict <b>20-minute, 30-MCQ challenge</b>. 
            Every initiation pulls randomized, unique questions. Your performances and in-test scratchpad notes are retained on your SDE Performance card and synced live with Admin investigators.
          </p>
        </div>
        {!testActive && (
          <div className="flex items-center gap-3 shrink-0 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-black tracking-wider uppercase">Total Solved Contests</p>
              <p className="text-lg font-black text-white">{sortedHistory.length} attempts</p>
            </div>
            <div className="w-[1px] h-8 bg-slate-800"></div>
            <div>
              <p className="text-[10px] text-slate-500 font-black tracking-wider uppercase">Average SDE Score</p>
              <p className="text-lg font-black text-indigo-400">
                {sortedHistory.length > 0
                  ? Math.round(
                      (sortedHistory.reduce((acc, curr) => acc + curr.score, 0) /
                        sortedHistory.reduce((acc, curr) => acc + curr.total, 0)) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RENDER MODES */}
      {!testActive && !testCompleted && !viewHistoryAttempt && (
        /* MODE 1: CONTEST SELECTION & ATTEMPT HISTORY */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LOBBY / SETUP */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>🛠️ Configure Your Contest Challenge</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select a targeted DSA subtopic or mixed-bag to customize the question generator algorithm.
                </p>
              </div>

              {/* Topic Select Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'All', title: 'Mixed SDE Challenge', desc: 'A rigorous blend of Arrays, DP, Linked Lists, DBMS, OS and Computer Networking.', icon: '🎓' },
                  { id: 'Array', title: 'Array Structure Sprint', desc: 'Focuses on multi-dimensional indices, sliding window boundaries, sorting, and Kadane limits.', icon: '📦' },
                  { id: 'DP', title: 'DP Optimization Marathon', desc: 'Focuses on memoization caches, grid recurrence, Knapsack variations, and LIS/LCS trees.', icon: '🧠' },
                  { id: 'Linked List', title: 'Pointer Manipulation Race', desc: 'Focuses on tortoises, cyclic detections, reversals, dummy head node edge-cases.', icon: '🔗' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(t.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group flex gap-3 ${
                      selectedTopic === t.id
                        ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/30 hover:bg-slate-50 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-2xl mt-1 select-none">{t.icon}</span>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-800">{t.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{t.desc}</p>
                    </div>
                    {selectedTopic === t.id && (
                      <span className="absolute top-3 right-3 text-indigo-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Strict Exam Rules Alert */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[11px] leading-relaxed space-y-1.5">
                <p className="font-extrabold flex items-center gap-1.5">
                  <span>⚠️ JECRC SDE Exam Regulations:</span>
                </p>
                <ul className="list-disc pl-4 space-y-1 font-medium">
                  <li>You will be presented with exactly <b>30 random MCQ questions</b>.</li>
                  <li>A strict countdown of <b>20 minutes (20:00)</b> starts immediately upon initiation.</li>
                  <li>Leaving the tab or browser will not pause the timer.</li>
                  <li>When the clock registers 00:00, the system automatically saves your active selections instantly.</li>
                </ul>
              </div>

              <button
                onClick={startContest}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:scale-98"
              >
                🚀 Initiate Contest Challenge
              </button>
            </div>
          </div>

          {/* HISTORIC LOGS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800">📊 Your Performance History</h3>
              <p className="text-xs text-slate-400 mt-0.5">List of previous official test sessions recorded on this node.</p>
            </div>

            {sortedHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                🕸️ No attempts recorded yet. Create an attempt inside the selection panel to populate metrics.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {sortedHistory.map((h, i) => {
                  const pct = Math.round((h.score / h.total) * 100);
                  const minStr = Math.floor(h.timeTaken / 60);
                  const secStr = h.timeTaken % 60;
                  return (
                    <div
                      key={h.attemptId}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{h.topic}</span>
                          <span className="text-[10px] bg-slate-200/60 font-black text-slate-600 px-1.5 py-0.5 rounded-md">
                            #{sortedHistory.length - i}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">
                          ⏱️ {minStr}m {secStr}s | {new Date(h.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-black text-slate-800">{h.score} / {h.total}</p>
                          <p className={`text-[10px] font-bold ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{pct}% Correct</p>
                        </div>
                        <button
                          onClick={() => setViewHistoryAttempt(h)}
                          className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                          title="Review attempt details"
                        >
                          👁️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: ACTIVE CONTEST PORTAL */}
      {testActive && questions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SCRATCHPAD WORK AREA (Left / Sidebar on larger screens) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg flex flex-col h-full min-h-[440px]">
              <div className="border-b border-slate-800 pb-3 mb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>💻 JECRC Sandbox Work Area</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Dry-run DP states, trace pointers or draft logic variables safely. Saved with submission.
                </p>
              </div>
              <textarea
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                className="flex-1 w-full bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-700 resize-none h-64 sm:h-auto"
                placeholder="// Sample Scratchpad:
// Trace DP[i]: 
// Fast/Slow head cycle..."
              />
            </div>
          </div>

          {/* MAIN TEST ENGINE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
              {/* Progress track */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / 30) * 100}%` }}
                />
              </div>

              {/* Active question indicator and Timer */}
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="font-extrabold text-slate-400 uppercase tracking-widest">
                  Question <span className="text-indigo-600 font-black">{currentIdx + 1}</span> of 30
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-black tracking-widest text-sm">
                  <span className="animate-pulse">⏱️</span>
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Question text */}
              <div className="space-y-3">
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  {questions[currentIdx].topic} Concepts
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                  {questions[currentIdx].question}
                </p>
              </div>

              {/* Options lists */}
              <div className="space-y-3">
                {questions[currentIdx].options.map((opt, oIdx) => {
                  const qId = questions[currentIdx].id;
                  const isSelected = selectedAnswers[qId] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setSelectedAnswers({ ...selectedAnswers, [qId]: oIdx })}
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-600 text-indigo-900 shadow-sm'
                          : 'bg-slate-50/40 hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-black ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-400 border-slate-250'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className="leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Engine controls */}
              <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-3">
                <div className="flex gap-2">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((p) => p - 1)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 rounded-xl text-xs font-black text-slate-700 transition-colors"
                  >
                    ⬅️ Back
                  </button>
                  <button
                    onClick={() => {
                      const qId = questions[currentIdx].id;
                      setFlaggedQuestions({
                        ...flaggedQuestions,
                        [qId]: !flaggedQuestions[qId],
                      });
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-black transition-colors flex items-center gap-1.5 ${
                      flaggedQuestions[questions[currentIdx].id]
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-slate-50/50 hover:bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span>⭐</span>
                    <span>
                      {flaggedQuestions[questions[currentIdx].id] ? 'Flagged/Review' : 'Mark for Review'}
                    </span>
                  </button>
                </div>

                {currentIdx < 29 ? (
                  <button
                    onClick={() => setCurrentIdx((p) => p + 1)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all"
                  >
                    Next Question ➡️
                  </button>
                ) : (
                  <button
                    onClick={() => submitContest(false)}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/10"
                  >
                    {submitting ? 'Submitting...' : '🏁 Submit Contest'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* QUESTIONS NAV GRID (Right panel) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">🧩 Grid Navigator</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Quickly skip between exam nodes.</p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase text-slate-400 border-b border-slate-50 pb-2.5">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200"></div>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-indigo-600"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
                  <span>Review</span>
                </div>
              </div>

              {/* Questions Index loop */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 rounded-xl text-xs font-black transition-all flex items-center justify-center relative ${
                        idx === currentIdx
                          ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105'
                          : ''
                      } ${
                        isFlagged
                          ? 'bg-amber-500 text-white'
                          : isAnswered
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && <span className="absolute -top-1 -right-1 text-[7px]">⭐</span>}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <div className="text-[11px] text-slate-500 flex justify-between font-bold">
                  <span>Answered:</span>
                  <span className="text-slate-800 font-extrabold">{Object.keys(selectedAnswers).length} / 30</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you absolutely sure you wish to skip out of the test? Your current progress will be lost.')) {
                      setTestActive(false);
                      setQuestions([]);
                    }
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-[10px] uppercase rounded-xl transition-colors text-center"
                >
                  🛑 Quit Contest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: PERFORMANCE DETAILS (IMMEDIATE REVIEW OF RECENT ATTEMPT OR HISTORY) */}
      {(testCompleted && latestAttempt) || (viewHistoryAttempt) ? (
        (() => {
          const activeReview = latestAttempt || viewHistoryAttempt;
          if (!activeReview) return null;
          const pct = Math.round((activeReview.score / activeReview.total) * 100);
          const minT = Math.floor(activeReview.timeTaken / 60);
          const secT = activeReview.timeTaken % 60;

          return (
            <div className="space-y-6" id="performance-card-render-block">
              {/* PRIMARY FEEDBACK DIAL BOARD */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                      🎯 Contest Review Panel Completed
                    </span>
                    <h3 className="text-2xl font-black text-slate-800">
                      Score Card: {activeReview.topic} Challenge
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Executed session logs completed on {new Date(activeReview.completedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Circle dial */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8"/>
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e'}
                          strokeWidth="8"
                          strokeDasharray={`${(pct / 100) * 238.76} 238.76`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-2xl font-black text-slate-800">{pct}%</span>
                        <span className="text-[8px] text-slate-400 font-black uppercase mt-0.5">Accuracy</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Correct Nodes</p>
                      <p className="text-xl font-black text-slate-800">
                        {activeReview.score} <span className="text-sm text-slate-400 font-bold">/ {activeReview.total}</span>
                      </p>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-1.5">Speed Record</p>
                      <p className="text-sm font-bold text-slate-700">⏱️ {minT}m {secT}s</p>
                    </div>
                  </div>
                </div>

                {/* SCRATCHPAD NOTES INCLUDED WITH COMPLETED ATTEMPT */}
                {activeReview.workAreaNotes && (
                  <div className="mt-6 bg-slate-900 border border-slate-800 text-emerald-400 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-450 font-black uppercase tracking-wider pb-2 border-b border-slate-800 mb-2">
                      📝 Your Sandbox Workspace Notes Saved:
                    </p>
                    <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">{activeReview.workAreaNotes}</pre>
                  </div>
                )}
              </div>

              {/* DETAILED INDEX REVIEW LOOPS */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">📋 Exhaustive Question Verification Log</h4>
                  <p className="text-xs text-slate-405 mt-0.5">Inspect every problem validation node to locate mistakes.</p>
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  {activeReview.answers.map((ans, idx) => {
                    const corrQObj = MCQ_QUESTION_POOL.find((qp) => qp.id === ans.questionId);
                    return (
                      <div key={idx} className="pt-4 first:pt-0 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              ans.isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-705 border border-rose-105'
                            }`}>
                              Question {idx + 1}: {ans.isCorrect ? 'Correct ✅' : 'Incorrect ❌'}
                            </span>
                            <h5 className="font-bold text-slate-800 text-sm">{ans.questionText}</h5>
                          </div>
                        </div>

                        {/* Rendering choices with correct vs incorrect highlighting inside completed reports */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {corrQObj?.options.map((opt, oIdx) => {
                            const isSelected = ans.selectedOptionIndex === oIdx;
                            const isCorrectOpt = ans.correctOptionIndex === oIdx;
                            return (
                              <div
                                key={oIdx}
                                className={`p-3 rounded-xl border flex items-center gap-2 font-medium ${
                                  isCorrectOpt
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : isSelected
                                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                                    : 'bg-slate-50 border-slate-100 text-slate-600'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[10px] ${
                                  isCorrectOpt
                                    ? 'bg-emerald-600 text-white'
                                    : isSelected
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-400'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {corrQObj?.explanation && (
                          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-500 italic leading-relaxed">
                            <span className="font-extrabold text-slate-700 not-italic">Explanation: </span>
                            {corrQObj.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  <button
                    onClick={() => {
                      setLatestAttempt(null);
                      setViewHistoryAttempt(null);
                      setTestCompleted(false);
                      setTestActive(false);
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    🔙 Close & Back to Lobby
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}
    </div>
  );
};
