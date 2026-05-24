import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Announcement } from '../types';
import { PlusIcon, DeleteIcon } from './Icons';

interface AnnouncementsViewProps {
  isAdmin: boolean;
  currentUser: { displayName: string | null; email: string | null } | null;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ isAdmin, currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Administrative State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, 'announcements');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.LIST, 'announcements');
        return;
      }
      
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(list);
    } catch (err: any) {
      console.error("Error fetching announcements:", err);
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
    fetchAnnouncements();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check size limit: 700 KB max to avoid exceeding theoretical 1MB document storage
      if (selectedFile.size > 700 * 1024) {
        setFileError("File is too large! Maximum allowed size is 700 KB to guarantee secure database persistence.");
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

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Title and message are required.");
      return;
    }
    setUploading(true);
    try {
      const payload: Omit<Announcement, 'id'> = {
        title: title.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.displayName || currentUser?.email || 'SDE Admin',
      };

      if (file && fileBase64) {
        payload.attachmentName = file.name;
        payload.attachmentType = file.type;
        payload.attachmentData = fileBase64;
      }

      await addDoc(collection(db, 'announcements'), payload);
      
      // Reset state
      setTitle('');
      setMessage('');
      setFile(null);
      setFileBase64('');
      setIsFormOpen(false);
      
      // Refresh list
      await fetchAnnouncements();
    } catch (err: any) {
      console.error("Error creating announcement:", err);
      let displayMsg = err?.message || String(err);
      try {
        const parsed = JSON.parse(displayMsg);
        if (parsed && parsed.error) displayMsg = parsed.error;
      } catch (e) {}
      alert(`Error publishing announcement: ${displayMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the announcement "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      console.error("Error deleting announcement:", err);
      let displayMsg = err?.message || String(err);
      try {
        const parsed = JSON.parse(displayMsg);
        if (parsed && parsed.error) displayMsg = parsed.error;
      } catch (e) {}
      alert(`Error deleting: ${displayMsg}`);
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
      alert("Unable to download file. The attachment format might be corrupted.");
    }
  };

  return (
    <div id="announcements_panel_root" className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">📢 Official Announcements</h2>
          <p className="text-sm text-slate-500 mt-1">Stay updated with critical alerts, schedules, and student instructions</p>
        </div>
        {isAdmin && !isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            <PlusIcon /> Send Announcement
          </button>
        )}
      </div>

      {/* Admin Creator Form Panel */}
      {isAdmin && isFormOpen && (
        <form 
          id="announcement_form"
          onSubmit={handleCreateAnnouncement} 
          className="bg-white border text-slate-700 border-indigo-100 rounded-2xl p-6 shadow-xl shadow-indigo-50/50 mb-8 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <h3 className="font-bold text-slate-800 text-lg">Create New Announcement</h3>
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

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5Class">Announcement Title</label>
              <input
                type="text"
                placeholder="e.g., Important: JECRC SDE Phase-2 Assessment Scheduled"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex justify-between">
                <span>Message Body</span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">Supports text explanations</span>
              </label>
              <textarea
                placeholder="Write your detailed announcement details, link summaries, instructions, or resources here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                required
              />
            </div>

            <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-xl p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                📂 Optional File Attachment
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  type="file"
                  id="announcement-file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="announcement-file-upload"
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-block"
                >
                  Choose File
                </label>
                <div className="text-xs text-slate-500 flex-1">
                  {file ? (
                    <span className="text-indigo-600 font-bold">Selected: {file.name} ({(file.size/1024).toFixed(1)} KB)</span>
                  ) : (
                    <span>PDFs, images, worksheets or documents up to 700 KB</span>
                  )}
                </div>
              </div>
              {fileError && <p className="text-rose-500 text-xs font-semibold mt-2">{fileError}</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
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
              {uploading ? 'Broadcasting...' : 'Publish Board'}
            </button>
          </div>
        </form>
      )}

      {/* Messages Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Synchronizing messages from SDE Board...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-6 text-sm font-medium">
          ⚠️ {error}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-100 border border-slate-200/55 rounded-3xl p-12 text-center text-slate-500">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm">
            <span className="text-2xl">📢</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base">No announcements yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Whenever coordinators or administrators post a program notice, they will appear on this timeline.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              id={`announcement_${ann.id}`}
              className="bg-white border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base leading-snug">{ann.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-1.5 text-slate-400 font-medium">
                    <span className="text-indigo-600 font-bold">👤 By {ann.createdBy}</span>
                    <span className="text-slate-300">•</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors focus:outline-none"
                    title="Delete Announcement"
                  >
                    <DeleteIcon />
                  </button>
                )}
              </div>

              {/* Message */}
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.message}</p>

              {/* Attachment File Box */}
              {ann.attachmentName && ann.attachmentData && (
                <div className="mt-4 bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">
                      📁
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-md">{ann.attachmentName}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Shared Resource Attachment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerDownload(ann.attachmentData!, ann.attachmentName!)}
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-all"
                  >
                    ⬇️ Download
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
