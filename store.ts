
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
  // Define reorderSubTopics to handle section positioning
  reorderSubTopics: (topicId: string, oldIndex: number, newIndex: number) => void;
  // Define reorderQuestions to handle problem positioning
  reorderQuestions: (topicId: string, subTopicId: string, oldIndex: number, newIndex: number) => void;
}

const generateInitialData = (): Topic[] => {
  const topicsData = [
    { name: 'Basics', slug: 'basics' },
    { name: 'Arrays', slug: 'arrays' },
    { name: 'Strings', slug: 'strings' },
    { name: 'Linked List', slug: 'linkedlist' },
    { name: 'Binary Search', slug: 'binarysearch' },
    { name: 'Trees', slug: 'trees' },
    { name: 'Sliding Window', slug: 'slidingwindow' }
  ];

  const questions: Record<string, Record<Difficulty, { title: string, url: string }[]>> = {
    basics: {
      Easy: [
        { title: 'Fizz Buzz', url: 'https://leetcode.com/problems/fizz-buzz/' },
        { title: 'Palindrome Number', url: 'https://leetcode.com/problems/palindrome-number/' },
        { title: 'Power of Two', url: 'https://leetcode.com/problems/power-of-two/' },
        { title: 'Valid Anagram', url: 'https://leetcode.com/problems/valid-anagram/' },
        { title: 'Missing Number', url: 'https://leetcode.com/problems/missing-number/' }
      ],
      Medium: [
        { title: 'Reverse Integer', url: 'https://leetcode.com/problems/reverse-integer/' },
        { title: 'String to Integer (atoi)', url: 'https://leetcode.com/problems/string-to-integer-atoi/' },
        { title: 'Divide Two Integers', url: 'https://leetcode.com/problems/divide-two-integers/' },
        { title: 'Pow(x, n)', url: 'https://leetcode.com/problems/powx-n/' },
        { title: 'Multiply Strings', url: 'https://leetcode.com/problems/multiply-strings/' }
      ],
      Hard: [
        { title: 'Integer to English Words', url: 'https://leetcode.com/problems/integer-to-english-words/' },
        { title: 'Max Points on a Line', url: 'https://leetcode.com/problems/max-points-on-a-line/' },
        { title: 'Basic Calculator', url: 'https://leetcode.com/problems/basic-calculator/' },
        { title: 'Valid Number', url: 'https://leetcode.com/problems/valid-number/' },
        { title: 'Text Justification', url: 'https://leetcode.com/problems/text-justification/' }
      ]
    },
    arrays: {
      Easy: [
        { title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/' },
        { title: 'Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
        { title: 'Majority Element', url: 'https://leetcode.com/problems/majority-element/' },
        { title: 'Move Zeroes', url: 'https://leetcode.com/problems/move-zeroes/' },
        { title: 'Contains Duplicate', url: 'https://leetcode.com/problems/contains-duplicate/' }
      ],
      Medium: [
        { title: '3Sum', url: 'https://leetcode.com/problems/3sum/' },
        { title: 'Product of Array Except Self', url: 'https://leetcode.com/problems/product-of-array-except-self/' },
        { title: 'Subarray Sum Equals K', url: 'https://leetcode.com/problems/subarray-sum-equals-k/' },
        { title: 'Rotate Array', url: 'https://leetcode.com/problems/rotate-array/' },
        { title: 'Merge Intervals', url: 'https://leetcode.com/problems/merge-intervals/' }
      ],
      Hard: [
        { title: 'First Missing Positive', url: 'https://leetcode.com/problems/first-missing-positive/' },
        { title: 'Trapping Rain Water', url: 'https://leetcode.com/problems/trapping-rain-water/' },
        { title: 'Largest Rectangle in Histogram', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/' },
        { title: 'Maximal Rectangle', url: 'https://leetcode.com/problems/maximal-rectangle/' },
        { title: 'Count of Smaller Numbers After Self', url: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/' }
      ]
    },
    strings: {
      Easy: [
        { title: 'Valid Palindrome', url: 'https://leetcode.com/problems/valid-palindrome/' },
        { title: 'Reverse String', url: 'https://leetcode.com/problems/reverse-string/' },
        { title: 'Longest Common Prefix', url: 'https://leetcode.com/problems/longest-common-prefix/' },
        { title: 'Length of Last Word', url: 'https://leetcode.com/problems/length-of-last-word/' },
        { title: 'First Unique Character in a String', url: 'https://leetcode.com/problems/first-unique-character-in-a-string/' }
      ],
      Medium: [
        { title: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
        { title: 'Group Anagrams', url: 'https://leetcode.com/problems/group-anagrams/' },
        { title: 'Decode String', url: 'https://leetcode.com/problems/decode-string/' },
        { title: 'Generate Parentheses', url: 'https://leetcode.com/problems/generate-parentheses/' },
        { title: 'Longest Palindromic Substring', url: 'https://leetcode.com/problems/longest-palindromic-substring/' }
      ],
      Hard: [
        { title: 'Minimum Window Substring', url: 'https://leetcode.com/problems/minimum-window-substring/' },
        { title: 'Word Ladder', url: 'https://leetcode.com/problems/word-ladder/' },
        { title: 'Longest Valid Parentheses', url: 'https://leetcode.com/problems/longest-valid-parentheses/' },
        { title: 'Distinct Subsequences', url: 'https://leetcode.com/problems/distinct-subsequences/' },
        { title: 'Regular Expression Matching', url: 'https://leetcode.com/problems/regular-expression-matching/' }
      ]
    },
    linkedlist: {
      Easy: [
        { title: 'Reverse Linked List', url: 'https://leetcode.com/problems/reverse-linked-list/' },
        { title: 'Merge Two Sorted Lists', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
        { title: 'Linked List Cycle', url: 'https://leetcode.com/problems/linked-list-cycle/' },
        { title: 'Palindrome Linked List', url: 'https://leetcode.com/problems/palindrome-linked-list/' },
        { title: 'Intersection of Two Linked Lists', url: 'https://leetcode.com/problems/intersection-of-two-linked-lists/' }
      ],
      Medium: [
        { title: 'Add Two Numbers', url: 'https://leetcode.com/problems/add-two-numbers/' },
        { title: 'Copy List with Random Pointer', url: 'https://leetcode.com/problems/copy-list-with-random-pointer/' },
        { title: 'LRU Cache', url: 'https://leetcode.com/problems/lru-cache/' },
        { title: 'Remove Nth Node From End of List', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },
        { title: 'Sort List', url: 'https://leetcode.com/problems/sort-list/' }
      ],
      Hard: [
        { title: 'Merge k Sorted Lists', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
        { title: 'Reverse Nodes in k-Group', url: 'https://leetcode.com/problems/reverse-nodes-in-k-group/' },
        { title: 'LFU Cache', url: 'https://leetcode.com/problems/lfu-cache/' },
        { title: 'All O`one Data Structure', url: 'https://leetcode.com/problems/all-oone-data-structure/' },
        { title: 'LinkedList Cycle II (Hard Variant)', url: 'https://leetcode.com/problems/linked-list-cycle-ii/' }
      ]
    },
    binarysearch: {
      Easy: [
        { title: 'Binary Search', url: 'https://leetcode.com/problems/binary-search/' },
        { title: 'Search Insert Position', url: 'https://leetcode.com/problems/search-insert-position/' },
        { title: 'Sqrt(x)', url: 'https://leetcode.com/problems/sqrtx/' },
        { title: 'First Bad Version', url: 'https://leetcode.com/problems/first-bad-version/' },
        { title: 'Valid Perfect Square', url: 'https://leetcode.com/problems/valid-perfect-square/' }
      ],
      Medium: [
        { title: 'Search in Rotated Sorted Array', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
        { title: 'Find Minimum in Rotated Sorted Array', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' },
        { title: 'Find Peak Element', url: 'https://leetcode.com/problems/find-peak-element/' },
        { title: 'Search a 2D Matrix', url: 'https://leetcode.com/problems/search-a-2d-matrix/' },
        { title: 'Koko Eating Bananas', url: 'https://leetcode.com/problems/koko-eating-bananas/' }
      ],
      Hard: [
        { title: 'Median of Two Sorted Arrays', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' },
        { title: 'Split Array Largest Sum', url: 'https://leetcode.com/problems/split-array-largest-sum/' },
        { title: 'Find Minimum in Rotated Sorted Array II', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array-ii/' },
        { title: 'Smallest Good Base', url: 'https://leetcode.com/problems/smallest-good-base/' },
        { title: 'Count of Range Sum', url: 'https://leetcode.com/problems/count-of-range-sum/' }
      ]
    },
    trees: {
      Easy: [
        { title: 'Inorder Traversal', url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/' },
        { title: 'Maximum Depth of Binary Tree', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
        { title: 'Same Tree', url: 'https://leetcode.com/problems/same-tree/' },
        { title: 'Symmetric Tree', url: 'https://leetcode.com/problems/symmetric-tree/' },
        { title: 'Balanced Binary Tree', url: 'https://leetcode.com/problems/balanced-binary-tree/' }
      ],
      Medium: [
        { title: 'Validate BST', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
        { title: 'Level Order Traversal', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
        { title: 'Lowest Common Ancestor of a BST', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/' },
        { title: 'Binary Tree Zigzag Level Order Traversal', url: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/' },
        { title: 'Kth Smallest Element in a BST', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/' }
      ],
      Hard: [
        { title: 'Binary Tree Maximum Path Sum', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/' },
        { title: 'Serialize and Deserialize Binary Tree', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/' },
        { title: 'Recover Binary Search Tree', url: 'https://leetcode.com/problems/recover-binary-search-tree/' },
        { title: 'Populating Next Right Pointers in Each Node II', url: 'https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii/' },
        { title: 'Vertical Order Traversal', url: 'https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/' }
      ]
    },
    slidingwindow: {
      Easy: [
        { title: 'Maximum Average Subarray I', url: 'https://leetcode.com/problems/maximum-average-subarray-i/' },
        { title: 'Minimum Recolors', url: 'https://leetcode.com/problems/minimum-recolors-to-get-k-consecutive-black-blocks/' },
        { title: 'Defuse the Bomb', url: 'https://leetcode.com/problems/defuse-the-bomb/' },
        { title: 'Longest Nice Substring', url: 'https://leetcode.com/problems/longest-nice-substring/' },
        { title: 'Substrings of Size Three', url: 'https://leetcode.com/problems/substrings-of-size-three-with-distinct-characters/' }
      ],
      Medium: [
        { title: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
        { title: 'Max Consecutive Ones III', url: 'https://leetcode.com/problems/max-consecutive-ones-iii/' },
        { title: 'Longest Repeating Character Replacement', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/' },
        { title: 'Permutation in String', url: 'https://leetcode.com/problems/permutation-in-string/' },
        { title: 'Frequency of Most Frequent Element', url: 'https://leetcode.com/problems/frequency-of-the-most-frequent-element/' }
      ],
      Hard: [
        { title: 'Minimum Window Substring', url: 'https://leetcode.com/problems/minimum-window-substring/' },
        { title: 'Sliding Window Maximum', url: 'https://leetcode.com/problems/sliding-window-maximum/' },
        { title: 'Subarrays with K Different Integers', url: 'https://leetcode.com/problems/subarrays-with-k-different-integers/' },
        { title: 'Longest Chunked Palindrome', url: 'https://leetcode.com/problems/longest-chunked-palindrome-decomposition/' },
        { title: 'Minimum Window Subsequence', url: 'https://leetcode.com/problems/minimum-window-subsequence/' }
      ]
    }
  };

  return topicsData.map(topic => ({
    id: `t-${topic.slug}`,
    title: topic.name,
    subTopics: (['Easy', 'Medium', 'Hard'] as Difficulty[]).map(diff => ({
      id: `st-${topic.slug}-${diff.toLowerCase()}`,
      title: `${diff} Challenges`,
      questions: (questions[topic.slug]?.[diff] || []).map((q, idx) => ({
        id: `q-${topic.slug}-${diff.toLowerCase()}-${idx}`,
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
      title: 'Master SDE Track',
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

      // Add reorderSubTopics implementation
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

      // Add reorderQuestions implementation
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
    { name: 'sde-tracker-storage-v2' }
  )
);
