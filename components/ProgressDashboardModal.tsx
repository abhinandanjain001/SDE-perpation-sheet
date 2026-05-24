import React, { useMemo } from 'react';
import { Difficulty, Topic } from '../types';

interface ProgressDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  studentRole: string;
  completedQuestionsIds: string[];
  topics: Topic[];
}

export const ProgressDashboardModal: React.FC<ProgressDashboardModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  studentRole,
  completedQuestionsIds,
  topics,
}) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 z-10 border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] uppercase font-bold tracking-wider">
              {studentRole} Profile
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-1">SDE Progress Analytics</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-all focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Info Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
              {studentName ? studentName.charAt(0).toUpperCase() : studentEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">{studentName || 'Student Participant'}</h4>
              <p className="text-xs text-slate-500 font-medium">{studentEmail}</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Beautiful SVG Segmented Donut Chart */}
            <div className="flex flex-col items-center justify-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
                  {/* Background base Ring */}
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
                      {/* Easy segment (Green) */}
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
                      {/* Medium segment (Amber) */}
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
                      {/* Hard segment (Rose) */}
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
                {/* Center text representing the overall completion percentage */}
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
              {/* Easy Progress */}
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

              {/* Medium Progress */}
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

              {/* Hard Progress */}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Great, Thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
