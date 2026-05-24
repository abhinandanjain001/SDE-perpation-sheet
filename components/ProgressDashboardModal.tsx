import React, { useMemo, useState } from 'react';
import { Difficulty, Topic } from '../types';

interface ProgressDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  studentRole: string;
  completedQuestionsIds: string[];
  topics: Topic[];
  contestHistory?: any[];
}

export const ProgressDashboardModal: React.FC<ProgressDashboardModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  studentRole,
  completedQuestionsIds,
  topics,
  contestHistory = [],
}) => {
  const [activeSegment, setActiveSegment] = useState<'progress' | 'contests'>('progress');
  const [selectedContestReview, setSelectedContestReview] = useState<any | null>(null);

  if (!isOpen) return null;

  // Compute stats based on the completedQuestionsIds passed
  const difficultyStats = useMemo(() => {
    let easyTotal = 0, easyCompleted = 0;
    let medTotal = 0, medCompleted = 0;
    let hardTotal = 0, hardCompleted = 0;

    const completedSet = new Set(completedQuestionsIds || []);

    topics.forEach(t => t.subTopics.forEach(st => st.questions.forEach(q => {
      if (q.difficulty === 'Easy') {
        easyTotal++;
        if (completedSet.has(q.id)) easyCompleted++;
      } else if (q.difficulty === 'Medium') {
        medTotal++;
        if (completedSet.has(q.id)) medCompleted++;
      } else if (q.difficulty === 'Hard') {
        hardTotal++;
        if (completedSet.has(q.id)) hardCompleted++;
      }
    })));

    const total = easyTotal + medTotal + hardTotal;
    const completed = easyCompleted + medCompleted + hardCompleted;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      easy: { completed: easyCompleted, total: easyTotal, pct: easyTotal > 0 ? Math.round((easyCompleted / easyTotal) * 100) : 0 },
      medium: { completed: medCompleted, total: medTotal, pct: medTotal > 0 ? Math.round((medCompleted / medTotal) * 100) : 0 },
      hard: { completed: hardCompleted, total: hardTotal, pct: hardTotal > 0 ? Math.round((hardCompleted / hardTotal) * 100) : 0 },
      total,
      completed,
      percentage
    };
  }, [completedQuestionsIds, topics]);

  const { easy, medium, hard, total, completed, percentage } = difficultyStats;

  // Segment Donut Math
  const radius = 40;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~251.327

  const easySegment = total > 0 && completed > 0 ? (easy.completed / completed) * circumference : 0;
  const mediumSegment = total > 0 && completed > 0 ? (medium.completed / completed) * circumference : 0;
  const hardSegment = total > 0 && completed > 0 ? (hard.completed / completed) * circumference : 0;

  // Average Score Computation
  const statsAverage = useMemo(() => {
    if (!contestHistory || contestHistory.length === 0) return 0;
    const scores = contestHistory.reduce((acc, curr) => acc + curr.score, 0);
    const totals = contestHistory.reduce((acc, curr) => acc + curr.total, 0);
    return totals > 0 ? Math.round((scores / totals) * 100) : 0;
  }, [contestHistory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 z-10 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] uppercase font-bold tracking-wider">
              {studentRole} Profile
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-1">SDE Progress & Contest Portfolio</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-all focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Student Info Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
                {studentName ? studentName.charAt(0).toUpperCase() : studentEmail.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">{studentName || 'Student Participant'}</h4>
                <p className="text-xs text-slate-500 font-medium">{studentEmail}</p>
              </div>
            </div>

            {/* Quick Segment Switcher */}
            <div className="flex bg-slate-200/60 p-1.5 rounded-xl border border-slate-200 shrink-0 gap-1 text-xs font-bold">
              <button
                onClick={() => {
                  setActiveSegment('progress');
                  setSelectedContestReview(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeSegment === 'progress' && !selectedContestReview
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 Roadmap Tracker
              </button>
              <button
                onClick={() => {
                  setActiveSegment('contests');
                  setSelectedContestReview(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeSegment === 'contests' || selectedContestReview
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🏆 Contest Board ({contestHistory.length})
              </button>
            </div>
          </div>

          {/* SECTION 1: ROADMAP SHEET PROGRESS */}
          {activeSegment === 'progress' && !selectedContestReview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
              {/* Beautiful SVG Segmented Donut Chart */}
              <div className="flex flex-col items-center justify-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth={strokeWidth}
                    />
                    {total > 0 && completed > 0 ? (
                      <>
                        {easy.completed > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${easySegment} ${circumference}`}
                            strokeDashoffset={0}
                            className="transition-all duration-1000 ease-out"
                          />
                        )}
                        {medium.completed > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${mediumSegment} ${circumference}`}
                            strokeDashoffset={-easySegment}
                            className="transition-all duration-1000 ease-out"
                          />
                        )}
                        {hard.completed > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#f43f5e"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${hardSegment} ${circumference}`}
                            strokeDashoffset={-(easySegment + mediumSegment)}
                            className="transition-all duration-1000 ease-out"
                          />
                        )}
                      </>
                    ) : null}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-3xl font-extrabold text-slate-800">{percentage}%</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Solved</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-3 text-center">
                  📊 {completed} of {total} Problems Completed
                </p>
              </div>

              {/* Metrics Checklist Details */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                      Easy Challenges
                    </span>
                    <span className="text-slate-500 font-bold">{easy.completed} / {easy.total}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${easy.pct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                      Medium Challenges
                    </span>
                    <span className="text-slate-500 font-bold">{medium.completed} / {medium.total}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: `${medium.pct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-rose-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                      Hard Challenges
                    </span>
                    <span className="text-slate-500 font-bold">{hard.completed} / {hard.total}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                      style={{ width: `${hard.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CONTEST PERFORMANCES BOARD */}
          {activeSegment === 'contests' && !selectedContestReview && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center bg-indigo-900 text-white p-4 rounded-2xl border border-indigo-805">
                <div className="text-xs">
                  <p className="font-black uppercase tracking-wider text-indigo-200">Total Attempts Administered</p>
                  <p className="text-lg font-black">{contestHistory.length} Sessions</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-black uppercase tracking-wider text-indigo-200">Combined Average Score</p>
                  <p className="text-lg font-black text-amber-300">{statsAverage}% Accuracy</p>
                </div>
              </div>

              {contestHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                  🕸️ No contest completions have been dispatched by this student yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {contestHistory.map((ctr: any, iIdx: number) => {
                    const min = Math.floor(ctr.timeTaken / 60);
                    const sec = ctr.timeTaken % 60;
                    const cpct = Math.round((ctr.score / ctr.total) * 100);
                    return (
                      <div
                        key={ctr.attemptId || iIdx}
                        className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between hover:bg-slate-100/60 transition-colors text-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-800 text-sm">{ctr.topic} Challenge</span>
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 font-black rounded text-[9px]">
                              ATTEMPT #{contestHistory.length - iIdx}
                            </span>
                          </div>
                          <div className="flex flex-wrap text-slate-450 gap-x-3 gap-y-0.5 font-bold text-[10px]">
                            <span>⏱️ Speed: {min}m {sec}s</span>
                            <span>•</span>
                            <span>📅 Completed: {new Date(ctr.completedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-black text-slate-800 text-sm">{ctr.score} / {ctr.total}</p>
                            <p className={`font-black uppercase text-[9px] ${cpct >= 75 ? 'text-emerald-600' : cpct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {cpct}% ACCURACY
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedContestReview(ctr)}
                            className="p-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl shadow-sm transition-colors text-xs font-bold"
                          >
                            👁️ Inspect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DETAILED ATTEMPT DRILLDOWN REVIEW */}
          {selectedContestReview && (
            <div className="space-y-5 animate-fade-in text-xs">
              <button
                onClick={() => setSelectedContestReview(null)}
                className="text-indigo-600 hover:text-indigo-500 font-extrabold flex items-center gap-1.5 mb-2 hover:underline"
              >
                ⬅️ Back to Contests Directory
              </button>

              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-black text-sm">{selectedContestReview.topic} Session</h4>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1">
                    Completed at: {new Date(selectedContestReview.completedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 uppercase font-black">Score Obtained</p>
                    <p className="text-lg font-black text-amber-400">
                      {selectedContestReview.score} / {selectedContestReview.total}
                    </p>
                  </div>
                  <div className="w-[1px] h-8 bg-zinc-700"></div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-black">Time Taken</p>
                    <p className="text-sm font-black text-white">
                      {Math.floor(selectedContestReview.timeTaken / 60)}m {selectedContestReview.timeTaken % 60}s
                    </p>
                  </div>
                </div>
              </div>

              {/* NOTES / SCRATCHPAD RETAINED */}
              {selectedContestReview.workAreaNotes && (
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl space-y-2">
                  <p className="text-[10px] text-slate-450 uppercase font-black pb-1.5 border-b border-slate-800">
                    💻 Retained Scratchpad Work Area:
                  </p>
                  <pre className="text-xs font-mono text-emerald-400 leading-normal whitespace-pre-wrap">
                    {selectedContestReview.workAreaNotes}
                  </pre>
                </div>
              )}

              {/* QUESTIONS RESPONSES LIST */}
              <div className="space-y-3.5 border-t border-slate-100 pt-4">
                <p className="font-extrabold text-slate-800">📋 Exam Node Answers Review</p>
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {selectedContestReview.answers?.map((ans: any, qIdx: number) => (
                    <div key={qIdx} className="p-3 bg-slate-50/50 border border-slate-150 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          ans.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-105 text-rose-800 border bg-rose-50 border-rose-100'
                        }`}>
                          Node {qIdx + 1}: {ans.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800">{ans.questionText}</p>
                      <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
                        <p>• Student Choice: <span className={ans.isCorrect ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                          {ans.selectedOptionIndex === -1 ? 'None (No response)' : String.fromCharCode(65 + ans.selectedOptionIndex)}
                        </span></p>
                        <p>• Correct Answer: <span className="text-emerald-600 font-black">
                          {String.fromCharCode(65 + ans.correctOptionIndex)}
                        </span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Finished, Close Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};

