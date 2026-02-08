
import React, { useState, useEffect } from 'react';
import { ModalState, Difficulty } from '../types';
import { useSheetStore } from '../store';

interface Props {
  state: ModalState;
  onClose: () => void;
}

const AddEditModal: React.FC<Props> = ({ state, onClose }) => {
  const store = useSheetStore();
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    difficulty: 'Easy' as Difficulty,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.mode === 'EDIT' && state.initialData) {
      setFormData({
        title: state.initialData.title || '',
        url: state.initialData.url || '',
        difficulty: state.initialData.difficulty || 'Easy',
      });
    } else {
      setFormData({ title: '', url: '', difficulty: 'Easy' });
    }
    setError(null);
  }, [state]);

  if (!state.isOpen) return null;

  const validateUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { title, url, difficulty } = formData;

    if (state.type === 'QUESTION') {
      if (!validateUrl(url)) {
        setError('Please enter a valid URL (including http:// or https://)');
        return;
      }
    }

    if (state.type === 'TOPIC') {
      if (state.mode === 'ADD') store.addTopic(title);
      else if (state.editId) store.editTopic(state.editId, title);
    } else if (state.type === 'SUBTOPIC') {
      if (state.parentId) {
        if (state.mode === 'ADD') store.addSubTopic(state.parentId, title);
        else if (state.editId) store.editSubTopic(state.parentId, state.editId, title);
      }
    } else if (state.type === 'QUESTION') {
      if (state.grandParentId && state.parentId) {
        if (state.mode === 'ADD') store.addQuestion(state.grandParentId, state.parentId, { title, url, difficulty });
        else if (state.editId) store.editQuestion(state.grandParentId, state.parentId, state.editId, { title, url, difficulty });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">
            {state.mode === 'ADD' ? 'Add' : 'Edit'} {state.type?.toLowerCase()}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              autoFocus
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder={`Enter ${state.type?.toLowerCase()} title`}
            />
          </div>

          {state.type === 'QUESTION' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Problem URL</label>
                <input
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${error ? 'border-rose-500 bg-rose-50' : ''}`}
                  value={formData.url}
                  onChange={e => {
                    setFormData({ ...formData, url: e.target.value });
                    if (error) setError(null);
                  }}
                  placeholder="https://leetcode.com/problems/..."
                />
                {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                <div className="flex gap-2">
                  {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: level })}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                        formData.difficulty === level
                          ? level === 'Easy' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' :
                            level === 'Medium' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500' :
                            'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditModal;
