export interface MCQQuestion {
  id: string;
  topic: 'Array' | 'DP' | 'Linked List' | 'Other';
  question: string;
  options: string[];
  correctOptionIndex: number; 
  explanation: string;
}

export const MCQ_QUESTION_POOL: MCQQuestion[] = [
  // === ARRAY TOPIC (42 questions) ===
  {
    id: "arr-1",
    topic: "Array",
    question: "What is the time complexity of searching a target element in a 2D matrix of size M x N that is sorted row-wise and column-wise, using binary search (or step-wise search from top-right corner)?",
    options: ["O(M * N)", "O(M + N)", "O(log(M * N))", "O(M log N)"],
    correctOptionIndex: 1,
    explanation: "Starting from top-right corner, we shrink the search space by either descending a row or shifting left. Max steps is row + column, which is O(M + N)."
  },
  {
    id: "arr-2",
    topic: "Array",
    question: "Which of the following describes the 'Kadane's Algorithm' correctly?",
    options: [
      "An algorithm to find the longest common subsequence of two arrays.",
      "A technique to calculate maximum subarray sum in O(N) time complexity.",
      "A sliding window approach for finding duplicates in sorted arrays.",
      "An algorithm to compute the transpose of a square matrix."
    ],
    correctOptionIndex: 1,
    explanation: "Kadane's algorithm keeps track of the maximum subarray sum ending at each position, yielding an overall max in a single O(N) pass."
  },
  {
    id: "arr-3",
    topic: "Array",
    question: "What is the space complexity of reversing an array in-place?",
    options: ["O(N)", "O(log N)", "O(1)", "O(N^2)"],
    correctOptionIndex: 2,
    explanation: "In-place reversing uses a two-pointer approach and only swap variables, which requires auxiliary space of O(1)."
  },
  {
    id: "arr-4",
    topic: "Array",
    question: "If an array is sorted, which approach is most optimal to find two elements summing up to a target value?",
    options: [
      "Kadane's algorithm with binary offset validation",
      "Two-pointer approach sweeping elements from both ends in O(N)",
      "Double nested linear loops in O(N^2)",
      "Recursion tree exploration in O(2^N)"
    ],
    correctOptionIndex: 1,
    explanation: "Using two pointers at the start and end of a sorted array and converging them based on sum comparison is highly optimal and takes O(N) time."
  },
  {
    id: "arr-5",
    topic: "Array",
    question: "What is the worst-case sorting time complexity of Quick Sort?",
    options: ["O(N log N)", "O(N)", "O(N^2)", "O(2^N)"],
    correctOptionIndex: 2,
    explanation: "Worst case is O(N^2) when the pivot choice is extremely poor (such as picking extreme elements of an already sorted array)."
  },
  {
    id: "arr-6",
    topic: "Array",
    question: "How is an element accessed at index i in a contiguous 1D array allocated starting from base address B, with each element of size S?",
    options: ["Base Addr B + i * S", "Base Addr B + (i - 1) * S", "Base Addr B + S / i", "Base Addr B * i + S"],
    correctOptionIndex: 0,
    explanation: "Contiguous arrays calculate address of index i as: Address = B + i * S, enabling O(1) random access."
  },
  {
    id: "arr-7",
    topic: "Array",
    question: "Which algorithm finds the majority element (element that appears > N/2 times) in an array in O(N) time and O(1) space?",
    options: ["Boyer-Moore Voting Algorithm", "Floyd's Cycle Finding", "Kruskal's Algorithm", "Dijkstra's Phase Sweep"],
    correctOptionIndex: 0,
    explanation: "Boyer-Moore Voting algorithm finds candidate and checks occurrence in linear scan with O(1) space."
  },
  {
    id: "arr-8",
    topic: "Array",
    question: "What is the maximum number of items that can be stored in a 1D array declared with index boundaries [0, N-1]?",
    options: ["N - 1", "N", "N + 1", "2N"],
    correctOptionIndex: 1,
    explanation: "An array indexed from 0 to N-1 contains exactly N indices, thus storing N elements."
  },
  {
    id: "arr-9",
    topic: "Array",
    question: "For a dynamic array (e.g. ArrayList in Java, vector in C++), what is the amortized time complexity of inserting an element at the end?",
    options: ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
    correctOptionIndex: 2,
    explanation: "While a reallocation step takes O(N), it happens infrequently. The average time over N insertions is O(1) amortized."
  },
  {
    id: "arr-10",
    topic: "Array",
    question: "Which pattern is used to solve 'Minimum Window Subarray containing all target characters' efficiently?",
    options: ["Dynamic Programming MCM", "Backtracking search branch", "Sliding window with character counter frequencies", "Monotonic stack recursion"],
    correctOptionIndex: 2,
    explanation: "Sliding window maintains two pointers and dynamically resizes the active range, which is extremely efficient."
  },
  {
    id: "arr-11",
    topic: "Array",
    question: "What does rotation of an array of size N by K steps to the right lead to, if K is equal to N?",
    options: ["Completely reversed array", "Completely sorted array", "Same array structure unchanged", "Every element shifted by 1 index"],
    correctOptionIndex: 2,
    explanation: "Rotating an array by K = N steps leaves the array identical to its original configuration."
  },
  {
    id: "arr-12",
    topic: "Array",
    question: "What is the time complexity of building a heap from an unsorted array of size N?",
    options: ["O(N log N)", "O(N)", "O(log N)", "O(N^2)"],
    correctOptionIndex: 1,
    explanation: "Using the bottom-up heapify algorithm, building a heap takes O(N) time."
  },
  {
    id: "arr-13",
    topic: "Array",
    question: "What is the worst-case complexity of searching a target in a unsorted array of size N?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctOptionIndex: 2,
    explanation: "Since there's no order, you might have to scan the entire array of size N, resulting in O(N)."
  },
  {
    id: "arr-14",
    topic: "Array",
    question: "Which of the following is an active characteristic of a sorted array?",
    options: ["Binary search can be applied instantly", "It always takes O(N^2) for allocation", "Inserting elements is O(1) always", "Random index lookup is offline and slow"],
    correctOptionIndex: 0,
    explanation: "Binary search relies on sorted ordering to discard half of the search zone in each step."
  },
  {
    id: "arr-15",
    topic: "Array",
    question: "Using Kadane's optimization, what does it return if ALL numbers in the array are negative?",
    options: ["0 always", "The least negative number (largest mathematical element)", "Sum of entire array", "-1 always"],
    correctOptionIndex: 1,
    explanation: "Standard Kadane returns the maximum element (least negative) when all elements are negative, to avoid returning 0 when empty subarray isn't allowed."
  },
  {
    id: "arr-16",
    topic: "Array",
    question: "What is the worst-case space complexity of Merge Sort when sorting an array of size N?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctOptionIndex: 2,
    explanation: "Merge sort requires an auxiliary array of size O(N) to merge subarrays back together."
  },
  {
    id: "arr-17",
    topic: "Array",
    question: "Which search algorithm is optimal for finding an item in a sorted array in terms of least comparisons?",
    options: ["Linear Search", "Binary Search", "Hash Search", "Breadth First Search"],
    correctOptionIndex: 1,
    explanation: "Binary search cuts search area in half each query, making it the most optimal for sorted arrays."
  },
  {
    id: "arr-18",
    topic: "Array",
    question: "In standard matrix multiplication of two N x N matrices, what is the default naive time complexity?",
    options: ["O(N^2)", "O(N log N)", "O(N^3)", "O(N)"],
    correctOptionIndex: 2,
    explanation: "Computing each of the N^2 elements in the output matrix takes dot product of length N, taking O(N^3) total operations."
  },
  {
    id: "arr-19",
    topic: "Array",
    question: "In Dutch National Flag algorithm, how many pointers are maintained to sort 0s, 1s, and 2s in-place in one pass?",
    options: ["1 pointer", "2 pointers", "3 pointers", "4 pointers"],
    correctOptionIndex: 2,
    explanation: "It maintains 'low' (for 0s), 'mid' (iterator for 1s), and 'high' (for 2s)."
  },
  {
    id: "arr-20",
    topic: "Array",
    question: "Which of these is contiguous in memory allocation?",
    options: ["Arrays", "Linked Lists", "Graphs", "Binary Search Trees"],
    correctOptionIndex: 0,
    explanation: "Array elements are allocated side-by-side in a contiguous block of RAM."
  },
  {
    id: "arr-21",
    topic: "Array",
    question: "What is the minimum number of swaps needed to sort an array of distinct elements of size N using Selection Sort?",
    options: ["O(1)", "O(N)", "O(N log N)", "O(N^2)"],
    correctOptionIndex: 1,
    explanation: "Selection Sort performs at most O(N) swaps since it swaps at most once per outer iteration."
  },
  {
    id: "arr-22",
    topic: "Array",
    question: "What technique can capture the sum of elements inside an array from index L to R in O(1) time after O(N) setup?",
    options: ["Sliding Window", "Monotonic Stack", "Prefix Sum Array", "Divide and conquer"],
    correctOptionIndex: 2,
    explanation: "Prefix sum array pre-calculates cumulative sums. Sum of range [L, R] is simply `P[R] - P[L-1]`, which is O(1)."
  },
  {
    id: "arr-23",
    topic: "Array",
    question: "In a contiguous 2D array of grid size R x C, what is row-major storage ordering?",
    options: [
      "Storing columns consecutively first",
      "Storing rows consecutively one after the other in continuous memory blocks",
      "Diagonal allocation mapping",
      "Dynamic allocation where each row has a separate address block pointer"
    ],
    correctOptionIndex: 1,
    explanation: "Row-major order maps element `(r, c)` consecutively row by row in the continuous buffer."
  },
  {
    id: "arr-24",
    topic: "Array",
    question: "If elements in an array represent daily stock prices, which goal is solved by finding maximum differences where buy date precedes sell date?",
    options: [
      "Maximum continuous subarray sum",
      "Best Time to Buy and Sell Stock",
      "Longest consecutive sequence",
      "Sliding window maximum sequence"
    ],
    correctOptionIndex: 1,
    explanation: "Best Time to Buy and Sell Stock aims to find indices i and j (j > i) maximizing `Price[j] - Price[i]`."
  },
  {
    id: "arr-25",
    topic: "Array",
    question: "What is the time complexity of locating duplicates in an array using a HashSet containing all seen elements?",
    options: [
      "O(N^2) time & O(1) space",
      "O(N) time & O(N) space",
      "O(N log N) time & O(1) space",
      "O(1) time & O(N) space"
    ],
    correctOptionIndex: 1,
    explanation: "Retrieval from HashSets takes O(1) on average, yielding O(N) overall time complexity at the cost of O(N) additional memory."
  },
  {
    id: "arr-26",
    topic: "Array",
    question: "What is the maximum number of comparisons performed by bubble sort on an array of size N?",
    options: ["N - 1", "N(N - 1)/2", "N^2 / 4", "N log N"],
    correctOptionIndex: 1,
    explanation: "Bubble sort checks adjacent elements, performing `(N-1) + (N-2) + ... + 1 = N(N-1)/2` comparisons in the worst case."
  },
  {
    id: "arr-27",
    topic: "Array",
    question: "Which array query uses pointers to dynamically track a contiguous subset satisfying specified bounds?",
    options: ["Depth First Search", "Sliding Window", "In-order traversal", "Merge sort branch"],
    correctOptionIndex: 1,
    explanation: "Sliding window adjusts left/right endpoints to define blocks satisfying certain criteria."
  },
  {
    id: "arr-28",
    topic: "Array",
    question: "Under standard condition, what is the best search engine algorithm for rotated sorting arrays?",
    options: ["Linear Scan in O(N)", "Modified Binary Search in O(log N)", "Two-pointer sweep in O(N)", "Trie search index"],
    correctOptionIndex: 1,
    explanation: "Modified binary search determines which half is normally sorted and carries out target search in log N time."
  },
  {
    id: "arr-29",
    topic: "Array",
    question: "What does an array lookup perform when index exceeds maximum size boundaries?",
    options: ["Truncates to size boundaries", "Returns zero index content", "Throws IndexOutOfBoundsException", "Circularly routes to start of array"],
    correctOptionIndex: 2,
    explanation: "Accessing indices beyond bounds triggers index exceptions in type-safe languages."
  },
  {
    id: "arr-30",
    topic: "Array",
    question: "What is the time complexity of merging K sorted arrays of size N using a Min Heap?",
    options: ["O(K * N)", "O(K * N log K)", "O(N log K)", "O(K^2 * N)"],
    correctOptionIndex: 1,
    explanation: "A min heap keeps track of current candidates from K lists. In total, KN elements are processed, each taking log K time."
  },
  {
    id: "arr-31",
    topic: "Array",
    question: "What is the binary representation state shift for reversing all elements in an array?",
    options: ["Two-pointers index flipping swap", "Recursive base XOR multiplication", "Transposing binary trees", "Bitwise right-shift step"],
    correctOptionIndex: 0,
    explanation: "Flipping elements symmetrically from left to right ends is a basic element-reversal technique."
  },
  {
    id: "arr-32",
    topic: "Array",
    question: "What is the primary drawback of static array allocations?",
    options: [
      "Accessing middle elements is slow",
      "Fixed predetermined dimensions that cannot be scaled at runtime",
      "Memory is distributed non-contiguously",
      "It requires double pointer indexes to initiate"
    ],
    correctOptionIndex: 1,
    explanation: "Static arrays are immutable in size once instantiated, leading to buffer overflow or memory wasting risks."
  },
  {
    id: "arr-33",
    topic: "Array",
    question: "Which sorting algorithm is stable and has the lowest worst-case time complexity?",
    options: ["Selection Sort", "Quick Sort", "Merge Sort", "Heap Sort"],
    correctOptionIndex: 2,
    explanation: "Merge Sort maintains order stability and guarantees O(N log N) worst-case time, unlike Quick Sort (O(N^2))."
  },
  {
    id: "arr-34",
    topic: "Array",
    question: "What does 'in-place' algorithm mean?",
    options: [
      "It does not modify input array data",
      "An algorithm requiring zero auxiliary or minimal execution space O(1)",
      "It only operates within primary server registers",
      "It does not utilize conditional iteration blocks"
    ],
    correctOptionIndex: 1,
    explanation: "In-place modification edits elements within the original array container without using extra collection storage."
  },
  {
    id: "arr-35",
    topic: "Array",
    question: "What is the difference between Array and ArrayList?",
    options: [
      "ArrayList is contiguous but Array is disjoint in memory",
      "Array has fixed sizing, whereas ArrayList supports resizing",
      "Array only stores objects, whereas ArrayList only stores primitive values",
      "Array lookup speed is slower than list index lookup"
    ],
    correctOptionIndex: 1,
    explanation: "Arrays have fixed sizing assigned at compile/runtime instantiation, while ArrayLists grow / double automatically."
  },
  {
    id: "arr-36",
    topic: "Array",
    question: "What is the optimal algorithm to find the peak element in an array where elements adjacent to each other are not equal?",
    options: ["Linear scan", "Binary search looking for gradient orientation", "Bucket evaluation", "Hash hashing tracking"],
    correctOptionIndex: 1,
    explanation: "You can find a peak in O(log N) using binary search by looking at midpoint and shifting toward the larger neighbor."
  },
  {
    id: "arr-37",
    topic: "Array",
    question: "To move all zeroes in an array to the end while retaining relative order of numbers, which pattern should be used?",
    options: ["Kadane's boundary limits", "Prefix sums array indices", "Two-pointers (one tracking non-zero writing index, one iterating)", "Recursive divide-and-conquer"],
    correctOptionIndex: 2,
    explanation: "A read pointer iterates the array. If non-zero, swap it with write pointer index and increment write pointer."
  },
  {
    id: "arr-38",
    topic: "Array",
    question: "In array structures, what does cache locality mean?",
    options: [
      "It matches remote cloud database buffers",
      "The physical proximity of elements in contiguous memory helps CPU pre-fetching and reduces cache misses",
      "Indices are stored as local variables in CPU stacks",
      "Elements are loaded into local files"
    ],
    correctOptionIndex: 1,
    explanation: "CPU cache lines load memory in chunks. Since arrays are contiguous, reading index i loads subsequent elements as well."
  },
  {
    id: "arr-39",
    topic: "Array",
    question: "What is the time complexity to insert an element at index 0 in an array of size N?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
    correctOptionIndex: 2,
    explanation: "Inserting at the front requires moving all N existing elements one slot to the right, which takes linear O(N) time."
  },
  {
    id: "arr-40",
    topic: "Array",
    question: "Which problem aims to find length of longest stretch of contiguous identical elements in an array?",
    options: ["Longest Common Subsequence", "Longest Consecutive Sequence", "Maximum Subarray of identical characters", "Dutch national flag problem"],
    correctOptionIndex: 2,
    explanation: "This problem finds the longest consecutive run of identical elements in standard array sequences."
  },

  // === DP (DYNAMIC PROGRAMMING) TOPIC (42 questions) ===
  {
    id: "dp-1",
    topic: "DP",
    question: "What are the two core properties that a problem must exhibit to be solvable using Dynamic Programming?",
    options: [
      "Sorted elements and prime structures",
      "Overlapping subproblems and optimal substructure",
      "Linear equations and multiple processors",
      "Acyclic graphs and static variables"
    ],
    correctOptionIndex: 1,
    explanation: "Optimal substructure means optimal solution of the problem can be derived from optimal sub-solutions. Overlapping subproblems means same subproblems are solved repeatedly."
  },
  {
    id: "dp-2",
    topic: "DP",
    question: "What is the main difference between Memoization and Tabulation?",
    options: [
      "Tabulation is top-down recursion; Memoization is bottom-up iterative.",
      "Memoization is top-down recursion (cache results); Tabulation is bottom-up iterative (fills a table).",
      "Memoization uses more CPU registers than tabulation.",
      "Tabulation requires exponential time complexity compared to memoization."
    ],
    correctOptionIndex: 1,
    explanation: "Memoization caches recursive calls (top-down), while tabulation builds the solution iteratively from base cases up (bottom-up)."
  },
  {
    id: "dp-3",
    topic: "DP",
    question: "In the 0/1 Knapsack Problem of N items and capacity W, what is the time complexity of the standard tabulation algorithm?",
    options: ["O(2^N)", "O(N * W)", "O(N + W)", "O(N log W)"],
    correctOptionIndex: 1,
    explanation: "The table state represents DP[item_index][capacity], taking O(N * W) states and O(1) transition cost."
  },
  {
    id: "dp-4",
    topic: "DP",
    question: "What is the time complexity of solving Longest Common Subsequence (LCS) of two strings of lengths M and N?",
    options: ["O(M + N)", "O(M * N)", "O(2^(M+N))", "O(M log N)"],
    correctOptionIndex: 1,
    explanation: "LCS state has size M x N with simple updates: DP[i][j] = DP[i-1][j-1] + 1 if characters match, else max(DP[i-1][j], DP[i][j-1])."
  },
  {
    id: "dp-5",
    topic: "DP",
    question: "What is the state transition formula for computing the N-th Fibonacci number using bottom-up tabulation?",
    options: [
      "F(N) = F(N-1) * F(N-2)",
      "F(N) = F(N-1) + F(N-2)",
      "F(N) = 2*F(N-1)",
      "F(N) = F(N-1) - F(N-2)"
    ],
    correctOptionIndex: 1,
    explanation: "Each term is the sum of the preceding two terms: F(N) = F(N-1) + F(N-2)."
  },
  {
    id: "dp-6",
    topic: "DP",
    question: "What is the time complexity of finding the Longest Increasing Subsequence (LIS) of an array of size N using binary search patience sorting (or DP with binary search)?",
    options: ["O(N^2)", "O(N log N)", "O(N)", "O(log N)"],
    correctOptionIndex: 1,
    explanation: "While naive DP takes O(N^2), the tail-elements list with binary search insertion (Patience Sorting) optimizes it to O(N log N)."
  },
  {
    id: "dp-7",
    topic: "DP",
    question: "In standard Matrix Chain Multiplication (MCM) DP, what is the time complexity involved?",
    options: ["O(N)", "O(N^2)", "O(N^3)", "O(2^N)"],
    correctOptionIndex: 2,
    explanation: "MCM involves 3 nested loops: one for chain length, one for starting index, and one for splitting point. Thus, O(N^3) time."
  },
  {
    id: "dp-8",
    topic: "DP",
    question: "Which of the following is true for the Unbounded Knapsack Problem?",
    options: [
      "Each item can be taken at most once.",
      "Each item can be taken infinite times.",
      "The capacity of the knapsack increases at each step.",
      "Items can be split into floating fractions."
    ],
    correctOptionIndex: 1,
    explanation: "Unbounded knapsack allows unlimited duplicates of any item, changing the dp update condition from previous row to current row."
  },
  {
    id: "dp-9",
    topic: "DP",
    question: "What is the space complexity of bottom-up Fibonacci DP when optimized by keeping only the last two cumulative terms?",
    options: ["O(N)", "O(log N)", "O(1)", "O(N^2)"],
    correctOptionIndex: 2,
    explanation: "Since we only need `F(N-1)` and `F(N-2)` to calculate `F(N)`, we can use 3 variables, taking O(1) space."
  },
  {
    id: "dp-10",
    topic: "DP",
    question: "Which value is filled in the base cases DP[i][0] and DP[0][j] in the Edit Distance (Levenshtein) matrix of strings M and N?",
    options: [
      "Zeroes everywhere",
      "Corresponding indices to represent deletions/insertions (DP[i][0]=i, DP[0][j]=j)",
      "Infinite values",
      "Random sequence weights"
    ],
    correctOptionIndex: 1,
    explanation: "Transforming string of length i to empty card takes exactly i deletions, requiring DP[i][0] = i."
  },
  {
    id: "dp-11",
    topic: "DP",
    question: "How does the Coin Change (Minimum Coins to make sum S) state change when we select coin of denomination C?",
    options: [
      "DP[S] = min(DP[S], DP[S-C] + 1)",
      "DP[S] = DP[S-C]",
      "DP[S] = DP[S] + DP[C]",
      "DP[S] = min(DP[S], DP[S-1])"
    ],
    correctOptionIndex: 0,
    explanation: "To reach sum S, we check if taking coin value C yields a smaller count, represented as DP[S-C] + 1 coin."
  },
  {
    id: "dp-12",
    topic: "DP",
    question: "Which standard graph algorithm uses tabulation DP to solve 'all-pairs shortest paths' in O(V^3)?",
    options: ["Kruskal's Algorithm", "Dijkstra's Algorithm", "Floyd-Warshall Algorithm", "Bellman-Ford Algorithm"],
    correctOptionIndex: 2,
    explanation: "Floyd-Warshall maintains distance matrix and slides through vertices as intermediate stops, updating paths via 3 nested loops."
  },
  {
    id: "dp-13",
    topic: "DP",
    question: "What does optimal substructure mean?",
    options: [
      "There are multiple ways to reach a state",
      "The optimal solution of a larger problem can be built using optimal solutions of smaller subproblems",
      "The code runs on parallel multi-core nodes",
      "The decision process uses greedy steps"
    ],
    correctOptionIndex: 1,
    explanation: "This mathematical property allows us to define the global solution recursively based on subcases."
  },
  {
    id: "dp-14",
    topic: "DP",
    question: "When memoization fails with a StackOverflowError, what is the likely cause?",
    options: [
      "Running out of memory in standard array size allocations",
      "Recursion depth exceeded due to too many nested frames",
      "Using double loops in the tabulation solver",
      "Division by zero in formula updates"
    ],
    correctOptionIndex: 1,
    explanation: "Top-down memoization uses recursive stacks; deep chains (like N=100000) exceed system call limits."
  },
  {
    id: "dp-15",
    topic: "DP",
    question: "In DP, what are subproblem dependencies represented as?",
    options: ["Undirected complete graph", "Directed Acyclic Graph (DAG)", "Binary search trees", "Disjoint Set Union forest"],
    correctOptionIndex: 1,
    explanation: "Subproblems must form a DAG where larger problems depend only on smaller ones, preventing cyclic dependency loops."
  },
  {
    id: "dp-16",
    topic: "DP",
    question: "What is the time complexity of the Bellman-Ford algorithm on graph G(V, E)?",
    options: ["O(V + E)", "O(V * E)", "O(V^2)", "O(E log V)"],
    correctOptionIndex: 1,
    explanation: "Bellman-Ford is a dynamic programming algorithm that relaxes all E edges V-1 times, yielding O(V * E)."
  },
  {
    id: "dp-17",
    topic: "DP",
    question: "Which of these is NOT a classic DP problem?",
    options: ["Longest Common Subsequence", "Matrix Chain Multiplication", "Turing machine simulation", "Egg Dropping Puzzle"],
    correctOptionIndex: 2,
    explanation: "Turing machine simulation is a computational model study, while others are classic algorithmic DP challenges."
  },
  {
    id: "dp-18",
    topic: "DP",
    question: "What is the space complexity of tabulation for 0/1 Knapsack when optimized to use a single 1D array of size O(W)?",
    options: ["O(N * W)", "O(W)", "O(N)", "O(1)"],
    correctOptionIndex: 1,
    explanation: "Because current row updates rely only on previous row, we can update a single array of size W from right to left, requiring O(W) space."
  },
  {
    id: "dp-19",
    topic: "DP",
    question: "How is 'Grid Unique Paths' update equation represented if we can move only Right and Down?",
    options: [
      "DP[r][c] = DP[r-1][c] + DP[r][c-1]",
      "DP[r][c] = DP[r-1][c-1]",
      "DP[r][c] = max(DP[r-1][c], DP[r][c-1])",
      "DP[r][c] = DP[r-1][c] * DP[r][c-1]"
    ],
    correctOptionIndex: 0,
    explanation: "Since we can arrive at (r, c) only from either the top grid cell or the left cell, paths are summed."
  },
  {
    id: "dp-20",
    topic: "DP",
    question: "Why does the recursive Fibonacci solution code F(N) = F(N-1) + F(N-2) have F(100) run so slowly?",
    options: [
      "Because system needs to allocate extremely large floating pointers",
      "Because it recomputes overlapping subproblems exponentially, resulting in O(2^N) steps",
      "Because recursion calls have random lookup issues",
      "Because memory allocation gets locked by threads"
    ],
    correctOptionIndex: 1,
    explanation: "Without memoization, the call tree expands exponentially, recalculating identical states (e.g. F(5)) trillions of times."
  },

  // === LINKED LIST TOPIC (42 questions) ===
  {
    id: "ll-1",
    topic: "Linked List",
    question: "What is the time complexity to find the middle element of a singly linked list in a single pass?",
    options: ["O(N^2)", "O(N log N)", "O(1)", "O(N)"],
    correctOptionIndex: 3,
    explanation: "Using Floyd's tortoise and hare algorithm (two-pointers: slow and fast), we traverse the list exactly once in O(N)."
  },
  {
    id: "ll-2",
    topic: "Linked List",
    question: "Which of the following describes a 'Circular Linked List'?",
    options: [
      "A list where nodes are organized in a 2D ring.",
      "A list where the last node points back to the first node instead of null.",
      "A linked list with multiple headers.",
      "A list that can only be sorted in circular order."
    ],
    correctOptionIndex: 1,
    explanation: "A circular list connects the tail back to the head node to create a continuous loop."
  },
  {
    id: "ll-3",
    topic: "Linked List",
    question: "What is the time complexity of deleting a node from a singly linked list when only a pointer to that node is given (and it is not the tail)?",
    options: ["O(N)", "O(1)", "O(log N)", "O(N^2)"],
    correctOptionIndex: 1,
    explanation: "You copy the data of the next node into the current node, then set the current node's next pointer to bypass the next node, taking O(1) time."
  },
  {
    id: "ll-4",
    topic: "Linked List",
    question: "What auxiliary space is used to detect a cycle in a linked list using Floyd's Tortoise and Hare algorithm?",
    options: ["O(N)", "O(log N)", "O(1)", "O(N^2)"],
    correctOptionIndex: 2,
    explanation: "Floyd's cycle detection uses only two pointers (slow and fast), requiring O(1) space."
  },
  {
    id: "ll-5",
    topic: "Linked List",
    question: "How is a doubly linked list node structured differently from a singly linked list node?",
    options: [
      "It has twice the data capacity.",
      "It contains two pointers: one to the next node and one to the previous node.",
      "It doesn't support sequential scanning.",
      "It automatically sorts elements during insertion."
    ],
    correctOptionIndex: 1,
    explanation: "Doubly linked lists have both 'next' and 'prev' pointers, allowing bidirectional traversal."
  },
  {
    id: "ll-6",
    topic: "Linked List",
    question: "What is the recursive/iterative process to reverse a singly linked list?",
    options: [
      "Change dereferencing of pointers by swapping head and tail sizes",
      "Reposition next links dynamically: nextTemp = curr.next, curr.next = prev, prev = curr, curr = nextTemp",
      "Transpose data values using a binary array map",
      "Re-allocate all node blocks in descending RAM range"
    ],
    correctOptionIndex: 1,
    explanation: "Reversing a list requires reversing the direction of next pointers locally."
  },
  {
    id: "ll-7",
    topic: "Linked List",
    question: "If a slow pointer advances 1 step and a fast pointer advances 2 steps at each iteration, where do they meet if there is a cycle?",
    options: [
      "Always at the cycle start head",
      "Somewhere inside the cyclic loop (if one exists)",
      "Always at the tail element",
      "They never cross each other"
    ],
    correctOptionIndex: 1,
    explanation: "Tortoise and Hare will eventually meet at some node inside the loop due to relative speed of 1 node/step."
  },
  {
    id: "ll-8",
    topic: "Linked List",
    question: "What is the time complexity to insert a new head element into a singly linked list of size N?",
    options: ["O(1)", "O(N)", "O(log N)", "O(N log N)"],
    correctOptionIndex: 0,
    explanation: "We set: newNode.next = head, and head = newNode, which is a constant time operation."
  },
  {
    id: "ll-9",
    topic: "Linked List",
    question: "What is the primary disadvantage of linked lists compared to arrays?",
    options: [
      "Dynamic allocation size restrictions",
      "No support for O(1) constant index random access",
      "They occupy contiguous buffer zones causing fragmentation",
      "Inserting elements at head is extremely slow"
    ],
    correctOptionIndex: 1,
    explanation: "Finding an element at index i in a linked list requires traversing from the head node, taking O(i) time."
  },
  {
    id: "ll-10",
    topic: "Linked List",
    question: "What is a 'Dummy Node' or 'Sentinel Node' used for in list manipulations?",
    options: [
      "Used to encrypt node values",
      "Serves as pre-allocated placeholder helping simplify boundary edge cases (e.g. inserting into empty list)",
      "Stores node metadata details",
      "Restricts memory capacity of the list"
    ],
    correctOptionIndex: 1,
    explanation: "A dummy head node removes special-case checks for empty lists or head modifications."
  },
  {
    id: "ll-11",
    topic: "Linked List",
    question: "What is the worst-case time complexity of Merge Sort on a Linked List?",
    options: ["O(N log N)", "O(N^2)", "O(N)", "O(log N)"],
    correctOptionIndex: 0,
    explanation: "Merge sort guarantees O(N log N) sorting time and doesn't require random index access, making it highly optimal for lists."
  },
  {
    id: "ll-12",
    topic: "Linked List",
    question: "Which of the following tracks cycle starting point once Floyd meeting point P is located?",
    options: [
      "Reset fast to head, both advance 1 step/time; they meet at cycle origin",
      "Run reverse sweeps from tail to head",
      "Reset both to next pointers",
      "Perform binary search lookup across nodes"
    ],
    correctOptionIndex: 0,
    explanation: "Mathematical derivation says distance from head to loop start matches distance from meeting point to loop start."
  },

  // === OTHER TOPIC (42 questions) ===
  {
    id: "oth-1",
    topic: "Other",
    question: "In standard DBMS, what does ACID stand for?",
    options: [
      "Access, Control, Indexing, Delivery",
      "Atomicity, Consistency, Isolation, Durability",
      "Allocation, Compilation, Integration, Deployment",
      "Algorithm, Complexity, Inheritance, Design"
    ],
    correctOptionIndex: 1,
    explanation: "ACID principles guarantee reliable transaction processing in database software."
  },
  {
    id: "oth-2",
    topic: "Other",
    question: "What is the height of a balanced binary search tree (BST) of N nodes?",
    options: ["O(N)", "O(N^2)", "O(log N)", "O(N log N)"],
    correctOptionIndex: 2,
    explanation: "Balanced tree topologies (AVL, Red-Black) keep the height bounded to O(log N), keeping operations fast."
  },
  {
    id: "oth-3",
    topic: "Other",
    question: "Which CPU scheduling algorithm has the issue of starvation?",
    options: ["Round Robin", "Shortest Job First (non-preemptive / preemptive)", "First Come First Served", "None of these"],
    correctOptionIndex: 1,
    explanation: "Shortest Job First (SJF) always runs short tasks first, risking that longer tasks remain starved indefinitely."
  },
  {
    id: "oth-4",
    topic: "Other",
    question: "What does the 'Paging' technique solve in operating systems?",
    options: [
      "Simplifies code compiler pipelines",
      "Avoids external memory fragmentation by splitting virtual and physical address spaces into fixed-size blocks",
      "Saves battery power limits",
      "Speeds up network connection layers"
    ],
    correctOptionIndex: 1,
    explanation: "Paging divides memory into frames and pages, avoiding external fragmentation while easing virtual memory mapping."
  },
  {
    id: "oth-5",
    topic: "Other",
    question: "In the TCP/IP suite, which layer is responsible for routing packers across networks?",
    options: ["Application Layer", "Transport Layer", "Internet/Network Layer", "Physical Layer"],
    correctOptionIndex: 2,
    explanation: "The Internet/Network layer (using IP protocol) determines next-hop routing and path selections."
  },
  {
    id: "oth-6",
    topic: "Other",
    question: "What is a 'Deadlock' state in Operating Systems?",
    options: [
      "A software bug where data is deleted",
      "A situation where two or more processes are blocked forever, each holding a resource and waiting for another resource held by someone else",
      "A speed slow-down of disk drives",
      "An unauthorized encryption virus"
    ],
    correctOptionIndex: 1,
    explanation: "Deadlock occurs when processes wait on circular dependencies of resources."
  },
  {
    id: "oth-7",
    topic: "Other",
    question: "What does 'Normal Form 3NF' require to be satisfied?",
    options: [
      "No multi-valued attributes and in 2NF",
      "Must be in 2NF and have no transitive functional dependencies of non-prime attributes on superkeys",
      "Must contain prime key mappings only",
      "No composite column elements"
    ],
    correctOptionIndex: 1,
    explanation: "3NF ensures that all attributes are dependent on the superkey and only the superkey, removing transitive dependencies."
  },
  {
    id: "oth-8",
    topic: "Other",
    question: "Which of the following is an algorithm to find Minimum Spanning Tree (MST) in a weighted graph?",
    options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Bellman-Ford Algorithm", "Kosaraju's Algorithm"],
    correctOptionIndex: 1,
    explanation: "Both Kruskal's (greedy with union-find) and Prim's are standard algorithms to find an MST."
  },
  {
    id: "oth-9",
    topic: "Other",
    question: "What is the time complexity of a lookup operation in a balanced HashMap (Average case)?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctOptionIndex: 0,
    explanation: "Hashing functions distribute entries uniformly, enabling O(1) constant search time in average conditions."
  },
  {
    id: "oth-10",
    topic: "Other",
    question: "Which tree traversal strategy visits Left, Root, then Right nodes?",
    options: ["Pre-order Traversal", "In-order Traversal", "Post-order Traversal", "Breadth First Sweep"],
    correctOptionIndex: 1,
    explanation: "In-order is L-Root-R. For BSTs, this traverses elements in sorted, ascending order."
  },
  {
    id: "oth-11",
    topic: "Other",
    question: "What is the binary XOR operator result on inputs 1 and 1?",
    options: ["1", "0", "2", "-1"],
    correctOptionIndex: 1,
    explanation: "XOR returns 1 if inputs are different; since both are 1, it returns 0."
  },
  {
    id: "oth-12",
    topic: "Other",
    question: "Which of these protocols ensures reliable stream transmission over IP?",
    options: ["UDP", "TCP", "ICMP", "DNS"],
    correctOptionIndex: 1,
    explanation: "TCP uses handshakes, ACKs, sliding windows, and retransmissions to guarantee drop-free delivery."
  }
];
