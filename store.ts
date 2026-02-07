
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SheetState, Topic, SubTopic, Question, Difficulty } from './types';

interface SheetStore extends SheetState {
  setTopics: (topics: Topic[]) => void;
  
  // Topic CRUD
  addTopic: (title: string) => void;
  editTopic: (id: string, title: string) => void;
  deleteTopic: (id: string) => void;
  
  // SubTopic CRUD
  addSubTopic: (topicId: string, title: string) => void;
  editSubTopic: (topicId: string, subTopicId: string, title: string) => void;
  deleteSubTopic: (topicId: string, subTopicId: string) => void;
  
  // Question CRUD
  addQuestion: (topicId: string, subTopicId: string, question: Omit<Question, 'id' | 'completed'>) => void;
  editQuestion: (topicId: string, subTopicId: string, questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (topicId: string, subTopicId: string, questionId: string) => void;
  toggleQuestionStatus: (topicId: string, subTopicId: string, questionId: string) => void;

  // Reordering
  reorderTopics: (oldIndex: number, newIndex: number) => void;
  reorderSubTopics: (topicId: string, oldIndex: number, newIndex: number) => void;
  reorderQuestions: (topicId: string, subTopicId: string, oldIndex: number, newIndex: number) => void;
}

const initialData: Topic[] = [
  {
    id: 't1',
    title: 'Arrays & Hashing',
    subTopics: [
      {
        id: 'st1',
        title: 'Easy Basics',
        questions: [
          { id: 'q1', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy', completed: true },
          { id: 'q2', title: 'Contains Duplicate', url: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'Easy', completed: false },
        ]
      }
    ]
  },
  {
    id: 't2',
    title: 'Two Pointers',
    subTopics: [
      {
        id: 'st2',
        title: 'Middle Level',
        questions: [
          { id: 'q3', title: '3Sum', url: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium', completed: false },
        ]
      }
    ]
  }
];

export const useSheetStore = create<SheetStore>()(
  persist(
    (set) => ({
      topics: initialData,
      title: 'SDE Preparation Sheet',
      lastUpdated: new Date().toISOString(),

      setTopics: (topics) => set({ topics, lastUpdated: new Date().toISOString() }),

      addTopic: (title) => set((state) => ({
        topics: [...state.topics, { id: crypto.randomUUID(), title, subTopics: [] }],
        lastUpdated: new Date().toISOString()
      })),

      editTopic: (id, title) => set((state) => ({
        topics: state.topics.map(t => t.id === id ? { ...t, title } : t),
        lastUpdated: new Date().toISOString()
      })),

      deleteTopic: (id) => set((state) => ({
        topics: state.topics.filter(t => t.id !== id),
        lastUpdated: new Date().toISOString()
      })),

      addSubTopic: (topicId, title) => set((state) => ({
        topics: state.topics.map(t => t.id === topicId ? {
          ...t,
          subTopics: [...t.subTopics, { id: crypto.randomUUID(), title, questions: [] }]
        } : t),
        lastUpdated: new Date().toISOString()
      })),

      editSubTopic: (topicId, subTopicId, title) => set((state) => ({
        topics: state.topics.map(t => t.id === topicId ? {
          ...t,
          subTopics: t.subTopics.map(st => st.id === subTopicId ? { ...st, title } : st)
        } : t),
        lastUpdated: new Date().toISOString()
      })),

      deleteSubTopic: (topicId, subTopicId) => set((state) => ({
        topics: state.topics.map(t => t.id === topicId ? {
          ...t,
          subTopics: t.subTopics.filter(st => st.id !== subTopicId)
        } : t),
        lastUpdated: new Date().toISOString()
      })),

      addQuestion: (topicId, subTopicId, qData) => set((state) => ({
        topics: state.topics.map(t => t.id === topicId ? {
          ...t,
          subTopics: t.subTopics.map(st => st.id === subTopicId ? {
            ...st,
            questions: [...st.questions, { ...qData, id: crypto.randomUUID(), completed: false }]
          } : st)
        } : t),
        lastUpdated: new Date().toISOString()
      })),

      editQuestion: (topicId, subTopicId, questionId, updates) => set((state) => ({
        topics: state.topics.map(t => t.id === topicId ? {
          ...t,
          subTopics: t.subTopics.map(st => st.id === subTopicId ? {
            ...st,
            questions: st.questions.map(q => q.id === questionId ? { ...q, ...updates } : q)
          } : st)
        } : t),
        lastUpdated: new Date().toISOString()
      })),

      deleteQuestion: (topicId, subTopicId, questionId) => set((state) => ({
        topics: state.topics.map(t => t.id === topicId ? {
          ...t,
          subTopics: t.subTopics.map(st => st.id === subTopicId ? {
            ...st,
            questions: st.questions.filter(q => q.id !== questionId)
          } : st)
        } : t),
        lastUpdated: new Date().toISOString()
      })),

      toggleQuestionStatus: (topicId, subTopicId, questionId) => set((state) => ({
        topics: state.topics.map(t => t.id === topicId ? {
          ...t,
          subTopics: t.subTopics.map(st => st.id === subTopicId ? {
            ...st,
            questions: st.questions.map(q => q.id === questionId ? { ...q, completed: !q.completed } : q)
          } : st)
        } : t),
        lastUpdated: new Date().toISOString()
      })),

      reorderTopics: (oldIdx, newIdx) => set((state) => {
        const newTopics = [...state.topics];
        const [removed] = newTopics.splice(oldIdx, 1);
        newTopics.splice(newIdx, 0, removed);
        return { topics: newTopics, lastUpdated: new Date().toISOString() };
      }),

      reorderSubTopics: (topicId, oldIdx, newIdx) => set((state) => ({
        topics: state.topics.map(t => {
          if (t.id !== topicId) return t;
          const newSubTopics = [...t.subTopics];
          const [removed] = newSubTopics.splice(oldIdx, 1);
          newSubTopics.splice(newIdx, 0, removed);
          return { ...t, subTopics: newSubTopics };
        }),
        lastUpdated: new Date().toISOString()
      })),

      reorderQuestions: (topicId, subTopicId, oldIdx, newIdx) => set((state) => ({
        topics: state.topics.map(t => {
          if (t.id !== topicId) return t;
          return {
            ...t,
            subTopics: t.subTopics.map(st => {
              if (st.id !== subTopicId) return st;
              const newQs = [...st.questions];
              const [removed] = newQs.splice(oldIdx, 1);
              newQs.splice(newIdx, 0, removed);
              return { ...st, questions: newQs };
            })
          };
        }),
        lastUpdated: new Date().toISOString()
      }))
    }),
    { name: 'question-sheet-storage' }
  )
);
