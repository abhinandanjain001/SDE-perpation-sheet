
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SheetState, Topic, SubTopic, Question, Difficulty } from './types';

interface SheetStore extends SheetState {
  setTopics: (topics: Topic[]) => void;
  addTopic: (title: string) => void;
  editTopic: (id: string, title: string) => void;
  deleteTopic: (id: string) => void;
  addSubTopic: (topicId: string, title: string) => void;
  editSubTopic: (topicId: string, subTopicId: string, title: string) => void;
  deleteSubTopic: (topicId: string, subTopicId: string) => void;
  addQuestion: (topicId: string, subTopicId: string, question: Omit<Question, 'id' | 'completed'>) => void;
  editQuestion: (topicId: string, subTopicId: string, questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (topicId: string, subTopicId: string, questionId: string) => void;
  toggleQuestionStatus: (topicId: string, subTopicId: string, questionId: string) => void;
  reorderTopics: (oldIndex: number, newIndex: number) => void;
  reorderSubTopics: (topicId: string, oldIndex: number, newIndex: number) => void;
  reorderQuestions: (topicId: string, subTopicId: string, oldIndex: number, newIndex: number) => void;
}

const generateInitialData = (): Topic[] => {
  const topicsList = [
    'Basics', 'Arrays', 'Strings', 'Linked List', 'Binary Search', 
    'Trees', 'Sliding Window', 'Heap', 'Dynamic Programming', 'Graphs'
  ];

  const createPlaceholderQuestions = (topic: string, diff: Difficulty, count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      title: `${topic} ${diff} Problem ${i + 1}`,
      url: `https://leetcode.com/problemset/all/?search=${topic.toLowerCase().replace(' ', '-')}`,
    }));
  };

  const getRealQuestions = (topic: string, diff: Difficulty): {title: string, url: string}[] => {
    const data: Record<string, Record<string, {title: string, url: string}[]>> = {
      'Basics': {
        'Easy': [
          { title: 'Fizz Buzz', url: 'https://leetcode.com/problems/fizz-buzz/' },
          { title: 'Palindrome Number', url: 'https://leetcode.com/problems/palindrome-number/' },
          { title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/' },
          { title: 'Reverse String', url: 'https://leetcode.com/problems/reverse-string/' },
          { title: 'Valid Parentheses', url: 'https://leetcode.com/problems/valid-parentheses/' }
        ]
      },
      'Heap': {
        'Easy': [
          { title: 'Kth Largest Element in a Stream', url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/' },
          { title: 'Last Stone Weight', url: 'https://leetcode.com/problems/last-stone-weight/' },
          { title: 'Relative Ranks', url: 'https://leetcode.com/problems/relative-ranks/' }
        ],
        'Medium': [
          { title: 'Kth Largest Element in an Array', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
          { title: 'Top K Frequent Elements', url: 'https://leetcode.com/problems/top-k-frequent-elements/' },
          { title: 'Find K Closest Elements', url: 'https://leetcode.com/problems/find-k-closest-elements/' }
        ],
        'Hard': [
          { title: 'Merge k Sorted Lists', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
          { title: 'Find Median from Data Stream', url: 'https://leetcode.com/problems/find-median-from-data-stream/' },
          { title: 'Sliding Window Maximum', url: 'https://leetcode.com/problems/sliding-window-maximum/' }
        ]
      },
      'Dynamic Programming': {
        'Easy': [
          { title: 'Climbing Stairs', url: 'https://leetcode.com/problems/climbing-stairs/' },
          { title: 'Min Cost Climbing Stairs', url: 'https://leetcode.com/problems/min-cost-climbing-stairs/' },
          { title: 'House Robber', url: 'https://leetcode.com/problems/house-robber/' }
        ],
        'Medium': [
          { title: 'Coin Change', url: 'https://leetcode.com/problems/coin-change/' },
          { title: 'Longest Increasing Subsequence', url: 'https://leetcode.com/problems/longest-increasing-subsequence/' },
          { title: 'Longest Common Subsequence', url: 'https://leetcode.com/problems/longest-common-subsequence/' }
        ],
        'Hard': [
          { title: 'Edit Distance', url: 'https://leetcode.com/problems/edit-distance/' },
          { title: 'Trapping Rain Water', url: 'https://leetcode.com/problems/trapping-rain-water/' },
          { title: 'Burst Balloons', url: 'https://leetcode.com/problems/burst-balloons/' }
        ]
      },
      'Graphs': {
        'Medium': [
          { title: 'Number of Islands', url: 'https://leetcode.com/problems/number-of-islands/' },
          { title: 'Clone Graph', url: 'https://leetcode.com/problems/clone-graph/' },
          { title: 'Course Schedule', url: 'https://leetcode.com/problems/course-schedule/' }
        ],
        'Hard': [
          { title: 'Word Ladder', url: 'https://leetcode.com/problems/word-ladder/' },
          { title: 'Longest Increasing Path in a Matrix', url: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/' },
          { title: 'Alien Dictionary', url: 'https://leetcode.com/problems/alien-dictionary/' }
        ]
      }
    };

    const base = data[topic]?.[diff] || [];
    const placeholders = createPlaceholderQuestions(topic, diff, Math.max(0, 15 - base.length));
    return [...base, ...placeholders].slice(0, 15);
  };

  return topicsList.map(topicTitle => ({
    id: `t-${topicTitle.toLowerCase().replace(' ', '-')}`,
    title: topicTitle,
    subTopics: (['Easy', 'Medium', 'Hard'] as Difficulty[]).map(diff => ({
      id: `st-${topicTitle.toLowerCase().replace(' ', '-')}-${diff.toLowerCase()}`,
      title: `${diff} Challenges`,
      questions: getRealQuestions(topicTitle, diff).map((q, idx) => ({
        id: `q-${topicTitle.toLowerCase().replace(' ', '-')}-${diff.toLowerCase()}-${idx}`,
        title: q.title,
        url: q.url,
        difficulty: diff,
        completed: false
      }))
    }))
  }));
};

export const useSheetStore = create<SheetStore>()(
  persist(
    (set) => ({
      topics: generateInitialData(),
      title: 'Abhinandan jain special SDE roadmap',
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
              const newQuestions = [...st.questions];
              const [removed] = newQuestions.splice(oldIdx, 1);
              newQuestions.splice(newIdx, 0, removed);
              return { ...st, questions: newQuestions };
            })
          };
        }),
        lastUpdated: new Date().toISOString()
      }))
    }),
    { name: 'sde-roadmap-storage-v3' }
  )
);
