import React, { useState } from 'react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const jecrcLogo = '/jecrc_logo.png';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Fetch user document from Firestore to verify profile details
        const userDocRef = doc(db, 'users', user.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userDocRef);
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.GET, `users/${user.uid}`);
          return;
        }
        
        if (!userSnap.exists()) {
          // If profile document does not exist, initialize it default to student
          try {
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName || name || 'User',
              createdAt: new Date().toISOString(),
              role: 'student',
              completedQuestions: []
            });
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.CREATE, `users/${user.uid}`);
          }
        }
      } else {
        // Sign up
        if (role === 'admin' && adminCode !== 'admin123') {
          throw new Error('Invalid Admin Access Code. Contact the system administrator or register as Student.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile
        await updateProfile(user, { displayName: name });
        
        // Store user profile detail in firestore with the selected role
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: name,
            createdAt: new Date().toISOString(),
            role: role,
            completedQuestions: []
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${user.uid}`);
        }
      }
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          setError(parsed.error);
        } else {
          setError(err.message);
        }
      } catch (e) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <div className="text-center">
          <img 
            src={jecrcLogo} 
            alt="JECRC SDE SHEET Logo" 
            className="w-40 mx-auto mb-6 object-contain py-2" 
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {isLogin ? 'Sign in to SDE Sheet' : 'Create an Account'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin ? 'Welcome back! Log in to resume your SDE roadmap' : 'Get started with JECRC Special SDE SHEET'}
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-medium space-y-2">
              <p className="font-semibold text-rose-700">{error}</p>
              {error.toLowerCase().includes('network-request-failed') && (
                <div className="pt-2 border-t border-rose-200/50 mt-2 text-[11px] text-rose-600 leading-relaxed">
                  <span className="font-bold text-rose-700 block mb-1">💡 Suggested Action:</span>
                  This error occurs when your <strong className="font-bold">AdBlocker, Brave Shield, or Privacy Extension</strong> blocks requests to Google's authentication servers.
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Try **disabling extensions/shields** for this page.</li>
                    <li>Open this site in an **Incognito (Private) window** or different browser.</li>
                    <li>Check your internet connection status.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    placeholder="Abhinand Jain"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        role === 'student'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        role === 'admin'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {role === 'admin' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <label className="block text-xs font-semibold text-amber-800 mb-1" htmlFor="adminCode">Admin Access Code</label>
                    <input
                      id="adminCode"
                      name="adminCode"
                      type="password"
                      required
                      className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
                      placeholder="Enter Admin Access Code"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                    />
                    <span className="text-[10px] text-amber-700 font-medium mt-1 block">
                      💡 Tip: Use <strong className="font-bold">admin123</strong> to register as an Administrator
                    </span>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="email-address">Email Address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                placeholder="example@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-150 active:scale-95"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>
          
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
