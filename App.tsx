
import React, { useState, useMemo } from 'react';
import { useSheetStore } from './store';
import { Topic, SubTopic, Question, ModalState, Difficulty } from './types';
import { PlusIcon, EditIcon, DeleteIcon, GripIcon, ExternalLinkIcon, CheckIcon } from './components/Icons';
import AddEditModal from './components/AddEditModal';

const App: React.FC = () => {
  const { 
    topics, 
    title, 
    lastUpdated, 
    toggleQuestionStatus, 
    deleteTopic, 
    deleteSubTopic, 
    deleteQuestion,
    reorderTopics,
    reorderSubTopics,
    reorderQuestions
  } = useSheetStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, mode: 'ADD' });
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['t1']));

  // Statistics
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    topics.forEach(t => t.subTopics.forEach(st => st.questions.forEach(q => {
      total++;
      if (q.completed) completed++;
    })));
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [topics]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return topics;
    const query = searchQuery.toLowerCase();
    return topics.map(t => ({
      ...t,
      subTopics: t.subTopics.map(st => ({
        ...st,
        questions: st.questions.filter(q => q.title.toLowerCase().includes(query))
      })).filter(st => st.questions.length > 0 || st.title.toLowerCase().includes(query))
    })).filter(t => t.subTopics.length > 0 || t.title.toLowerCase().includes(query));
  }, [topics, searchQuery]);

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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 7h12"/><path d="M6 11h12"/><path d="M6 15h12"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">{title}</h1>
              <p className="text-xs text-slate-500 mt-1">Updated {new Date(lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-700">{stats.completed}/{stats.total} Questions</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{stats.percentage}% Done</div>
              </div>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
            <button 
              onClick={() => openModal('TOPIC', 'ADD')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <PlusIcon /> Add Topic
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Search & Summary */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              placeholder="Search problems, topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-bold uppercase tracking-widest">
                Productive Week
             </div>
             <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-bold uppercase tracking-widest">
                Consistency+
             </div>
          </div>
        </div>

        {/* Hierarchy List */}
        <div className="space-y-6">
          {filteredTopics.map((topic, topicIdx) => (
            <div key={topic.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => reorderTopics(topicIdx, Math.max(0, topicIdx - 1))}
                    className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30"
                    disabled={topicIdx === 0}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6"/></svg>
                  </button>
                  <button 
                    onClick={() => toggleTopic(topic.id)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className={`p-1 rounded-md transition-transform ${expandedTopics.has(topic.id) ? 'rotate-90' : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">{topic.title}</h2>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                      {topic.subTopics.length} sections
                    </span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal('SUBTOPIC', 'ADD', { parentId: topic.id })}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Add Section"
                  >
                    <PlusIcon />
                  </button>
                  <button 
                    onClick={() => openModal('TOPIC', 'EDIT', { editId: topic.id }, topic)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <EditIcon />
                  </button>
                  <button 
                    onClick={() => { if(confirm('Delete Topic?')) deleteTopic(topic.id) }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>

              {expandedTopics.has(topic.id) && (
                <div className="border-t bg-slate-50/50 p-4 space-y-4">
                  {topic.subTopics.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl border-slate-200">
                      <p className="text-sm text-slate-400 mb-4">No sections in this topic yet</p>
                      <button 
                        onClick={() => openModal('SUBTOPIC', 'ADD', { parentId: topic.id })}
                        className="text-indigo-600 font-semibold text-sm hover:underline"
                      >
                        Create first section
                      </button>
                    </div>
                  )}
                  {topic.subTopics.map((sub, subIdx) => (
                    <div key={sub.id} className="bg-white border rounded-xl shadow-sm overflow-hidden group/sub">
                      <div className="px-4 py-3 bg-slate-50/80 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripIcon className="text-slate-300 cursor-grab active:cursor-grabbing" />
                          <h3 className="font-semibold text-slate-700">{sub.title}</h3>
                          <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 uppercase">
                            {sub.questions.length} problems
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openModal('QUESTION', 'ADD', { parentId: sub.id, grandParentId: topic.id })}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Add Question"
                          >
                            <PlusIcon />
                          </button>
                          <button 
                            onClick={() => openModal('SUBTOPIC', 'EDIT', { parentId: topic.id, editId: sub.id }, sub)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          >
                            <EditIcon />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Delete Section?')) deleteSubTopic(topic.id, sub.id) }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {sub.questions.map((q, qIdx) => (
                          <div 
                            key={q.id} 
                            className={`flex items-center p-4 hover:bg-slate-50 transition-colors group/row ${q.completed ? 'bg-slate-50/50' : ''}`}
                          >
                            <button 
                              onClick={() => toggleQuestionStatus(topic.id, sub.id, q.id)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                q.completed 
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 shadow-lg' 
                                  : 'border-slate-300 hover:border-indigo-500 text-transparent'
                              }`}
                            >
                              <CheckIcon />
                            </button>
                            
                            <div className="ml-4 flex-1">
                              <div className="flex items-center gap-3">
                                <a 
                                  href={q.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`text-sm font-semibold transition-all hover:text-indigo-600 flex items-center gap-1.5 ${q.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                >
                                  {q.title}
                                  <ExternalLinkIcon className="w-3.5 h-3.5 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                </a>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${difficultyStyles[q.difficulty]}`}>
                                  {q.difficulty}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openModal('QUESTION', 'EDIT', { parentId: sub.id, grandParentId: topic.id, editId: q.id }, q)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { if(confirm('Delete Question?')) deleteQuestion(topic.id, sub.id, q.id) }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <DeleteIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {sub.questions.length === 0 && (
                        <div className="p-8 text-center bg-white">
                          <p className="text-sm text-slate-400 mb-2">No problems listed yet</p>
                          <button 
                             onClick={() => openModal('QUESTION', 'ADD', { parentId: sub.id, grandParentId: topic.id })}
                             className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                             + Add Problem
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredTopics.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               </div>
               <h3 className="text-xl font-bold text-slate-700">No results found</h3>
               <p className="text-slate-500 mt-2">Try adjusting your search or add a new topic to get started.</p>
               <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 text-indigo-600 font-bold hover:underline"
               >
                 Clear Search
               </button>
            </div>
          )}
        </div>
      </main>

      <AddEditModal 
        state={modalState} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
      />

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
    </div>
  );
};

export default App;
