import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { StudyMaterial } from '../types';
import { PlusIcon, DeleteIcon, ExternalLinkIcon } from './Icons';

interface StudyMaterialsViewProps {
  isAdmin: boolean;
  currentUser: { displayName: string | null; email: string | null } | null;
}

const CATEGORIES = ["All", "DSA Notes", "Placement Prep", "Syllabus", "Cheatsheets", "Other"];

const DEFAULT_MATERIALS: StudyMaterial[] = [
  {
    id: "def-1",
    title: "🎨 Dynamic Programming Master Cheatsheet",
    description: "Detailed cheatsheet covering 0/1 Knapsack, Unbounded Knapsack, LCS, LIS, MCM, and Grid DP patterns. Includes state transition equations, recursion trees, and optimized C++ / Java / Python implementations.",
    category: "Cheatsheets",
    createdAt: "2026-05-15T10:00:00.000Z",
    createdBy: "JECRC SDE Mentor",
    externalUrl: "https://codeforces.com/blog/entry/67679"
  },
  {
    id: "def-2",
    title: "🎓 JECRC Campus Placement Preparation Kit (Mass & Product Recruits)",
    description: "Comprehensive handbook containing interview questions from previous JECRC campus recruitment drives, ATS-friendly resume templates, HR feedback rules, and behavior assessment mock checklists.",
    category: "Placement Prep",
    createdAt: "2026-05-18T12:00:00.000Z",
    createdBy: "Placement Cell Coordinator",
    externalUrl: "https://github.com/loveBabbar/PlacementPrep"
  },
  {
    id: "def-3",
    title: "🌟 Graph Algorithms Cheat Sheet & Complexities Guide",
    description: "Complete visual guide and revision cheat sheet for BFS, DFS, Dijkstra's algorithm, Bellman-Ford, Kruskal's, Prim's, and Floyd-Warshall. High-fidelity time and space complexity evaluations.",
    category: "Cheatsheets",
    createdAt: "2026-05-20T09:00:00.000Z",
    createdBy: "CSE Faculty Unit",
    externalUrl: "https://github.com/mushfiq/Graph-Algorithms"
  },
  {
    id: "def-4",
    title: "📝 Sliding Window & Two Pointer Master Checklist",
    description: "Lecture notes and optimal code blueprints covering fixed-size and variable-size sliding windows. Step-by-step walkthroughs of classic subarray problems.",
    category: "DSA Notes",
    createdAt: "2026-05-22T14:30:00.000Z",
    createdBy: "Academic Head SDE",
    externalUrl: "https://leetcode.com/discuss/study-guide/1125139/sliding-window-algorithm-template-to-solve-all-sliding-window-problems"
  },
  {
    id: "def-5",
    title: "📘 JECRC Special SDE Sheet Syllabus & Placement benchmarks",
    description: "Syllabus timeline for the JECRC SDE Special Phase. Outlines mandatory daily assignments counts, code practice benchmarks, weekly coding assessment models, and internal academic credits rules.",
    category: "Syllabus",
    createdAt: "2026-05-24T08:00:00.000Z",
    createdBy: "JECRC Academy Coordinator",
    externalUrl: "https://jecrcuniversity.edu.in/"
  },
  {
    id: "def-6",
    title: "📦 DBMS, OS, & Computer Networks RAPID Interview Guide",
    description: "Quick-revision placement booklet covering database ACID properties, SQL inner/outer joins, normalizing forms, operating system CPU scheduling, paging, deadlocks, and TCP/IP protocol stack layers.",
    category: "Placement Prep",
    createdAt: "2026-05-24T17:15:00.000Z",
    createdBy: "Placement Prep Core",
    externalUrl: "https://github.com/loveBabbar/PlacementPrep"
  }
];

export const StudyMaterialsView: React.FC<StudyMaterialsViewProps> = ({ isAdmin, currentUser }) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Admin add form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DSA Notes');
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, 'study_materials');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.LIST, 'study_materials');
        return;
      }

      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudyMaterial[];
      setMaterials(list);
    } catch (err: any) {
      console.error("Error fetching study materials:", err);
      let displayMsg = err?.message || String(err);
      try {
        const parsed = JSON.parse(displayMsg);
        if (parsed && parsed.error) displayMsg = parsed.error;
      } catch (e) {}
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Limit to 700 KB to keep Firestore doc size inside 1MB comfortably
      if (selectedFile.size > 700 * 1024) {
        setFileError("File is too large! Please choose a file less than 700 KB.");
        setFile(null);
        setFileBase64('');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) {
      alert("Title and Category are required.");
      return;
    }
    setUploading(true);
    try {
      const payload: Omit<StudyMaterial, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        category,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.displayName || currentUser?.email || 'SDE Admin',
      };

      if (file && fileBase64) {
        payload.fileName = file.name;
        payload.fileType = file.type;
        payload.fileData = fileBase64;
      }

      if (externalUrl.trim()) {
        payload.externalUrl = externalUrl.trim();
      }

      await addDoc(collection(db, 'study_materials'), payload);

      // Reset
      setTitle('');
      setDescription('');
      setCategory('DSA Notes');
      setExternalUrl('');
      setFile(null);
      setFileBase64('');
      setIsFormOpen(false);

      await fetchMaterials();
    } catch (err: any) {
      console.error("Error creating study material:", err);
      let displayMsg = err?.message || String(err);
      try {
        const parsed = JSON.parse(displayMsg);
        if (parsed && parsed.error) displayMsg = parsed.error;
      } catch (e) {}
      alert(`Error publishing material: ${displayMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the study material "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'study_materials', id));
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error("Error deleting study material:", err);
      let displayMsg = err?.message || String(err);
      try {
        const parsed = JSON.parse(displayMsg);
        if (parsed && parsed.error) displayMsg = parsed.error;
      } catch (e) {}
      alert(`Error deleting material: ${displayMsg}`);
    }
  };

  const triggerDownload = (base64Data: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Unable to decode and download file.");
    }
  };

  // Filter study materials based on query and category chip selection
  const filteredMaterials = [...materials, ...DEFAULT_MATERIALS].filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'DSA Notes':
        return 'bg-amber-50 text-amber-700 border border-amber-200/50';
      case 'Placement Prep':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
      case 'Syllabus':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200/50';
      case 'Cheatsheets':
        return 'bg-rose-50 text-rose-700 border border-rose-200/50';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200/50';
    }
  };

  return (
    <div id="materials_panel_root" className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">📚 Study Material & Resources</h2>
          <p className="text-sm text-slate-500 mt-1">Access curated lecture notes, practice worksheets, and Placement preparation kits</p>
        </div>
        {isAdmin && !isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="self-start md:self-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            <PlusIcon /> Add Study Material
          </button>
        )}
      </div>

      {/* Admin Creator Panel */}
      {isAdmin && isFormOpen && (
        <form 
          id="material_form"
          onSubmit={handleCreateMaterial} 
          className="bg-white border text-slate-700 border-indigo-100 rounded-2xl p-6 shadow-xl shadow-indigo-50/50 mb-8 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <h3 className="font-bold text-slate-800 text-lg">Add New Study Material</h3>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setFileError(null);
                setFile(null);
                setFileBase64('');
              }}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Material Title</label>
                <input
                  type="text"
                  placeholder="e.g., Dynamic Programming Cheatsheet"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">External Resource URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g., https://drive.google.com/drive/folders/..."
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description / Brief Notes</label>
                <textarea
                  placeholder="Describe what is in this worksheet, important formulas, class guides, etc."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-xl p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  📂 Local Document File (Optional)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="file"
                    id="material-file-upload"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="material-file-upload"
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-block whitespace-nowrap"
                  >
                    Choose File
                  </label>
                  <div className="text-xs text-slate-500 truncate flex-1">
                    {file ? (
                      <span className="text-indigo-600 font-bold">Selected: {file.name}</span>
                    ) : (
                      <span>File up to 700 KB</span>
                    )}
                  </div>
                </div>
                {fileError && <p className="text-rose-500 text-xs font-semibold mt-2">{fileError}</p>}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setFileError(null);
                setFile(null);
                setFileBase64('');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? 'Uploading Materials...' : 'Save Study Material'}
            </button>
          </div>
        </form>
      )}

      {/* Categories chips filter row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            {cat === 'All' ? '🌐 All Material' : cat}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm"
          placeholder="Search materials by name or description..."
        />
      </div>

      {/* Grid list of resources */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Synchronizing resources with JECRC repositories...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-6 text-sm font-medium">
          ⚠️ {error}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-slate-100 border border-slate-200/55 rounded-3xl p-12 text-center text-slate-500">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base">No resources found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No study materials found matching the filters. Administrators can upload DSA cheatsheets or syllabus materials above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMaterials.map((mat) => (
            <div 
              key={mat.id} 
              id={`material_${mat.id}`}
              className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${getCategoryBadgeClass(mat.category)}`}>
                    {mat.category}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                      className="text-slate-400 hover:text-red-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors focus:outline-none"
                      title="Remove Resource"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-800 text-base leading-snug mb-1.5">{mat.title}</h3>
                <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed font-medium">{mat.description || '_ No description provided. _'}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-auto">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    By {mat.createdBy} • {new Date(mat.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {mat.externalUrl && (
                      <a
                        href={mat.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        title="Open Resource Link"
                      >
                        <ExternalLinkIcon className="w-3 h-3" /> View Link
                      </a>
                    )}
                    {mat.fileName && mat.fileData && (
                      <button
                        onClick={() => triggerDownload(mat.fileData!, mat.fileName!)}
                        className="bg-slate-100 hover:bg-slate-250 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        title={`Download ${mat.fileName}`}
                      >
                        ⬇️ PDF/File
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
