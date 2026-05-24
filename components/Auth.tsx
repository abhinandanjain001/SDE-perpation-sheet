import React, { useState } from 'react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
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

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userDocRef);
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.GET, `users/${user.uid}`);
        return;
      }

      if (!userSnap.exists()) {
        // Create user profile if missing
        try {
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || 'Google User',
            createdAt: new Date().toISOString(),
            role: 'student',
            completedQuestions: []
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${user.uid}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('An actual password reset link has been securely sent to your recorded email! Please check your inbox (and spam folder) to reset your password instantly.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Password reset requested failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative premium glowing soft orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full space-y-6 bg-slate-950/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800/80 relative z-10 transition-all duration-300">
        {/* Decorative Golden Top Lightbar */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-t-3xl" />
        
        <div className="text-center">
          <div className="relative inline-block mb-3 p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
            <img 
              src="/jecrc%20logo.png" 
              alt="JECRC SDE SHEET Logo" 
              className="h-16 w-auto mx-auto object-contain px-4 py-1.5" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/jecrc_logo.png')) {
                  target.src = '/jecrc_logo.png';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
            {isForgotPassword 
              ? 'Reset Password' 
              : isLogin 
                ? 'Sign in to SDE Sheet' 
                : 'Create Account'}
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-medium">
            {isForgotPassword 
              ? 'Recover your JECRC account' 
              : isLogin 
                ? 'Welcome back! Resume your SDE roadmap' 
                : 'Get started with Special SDE SHEET'}
          </p>
        </div>

        {isForgotPassword ? (
          /* Actual Firebase password reset form */
          <div className="space-y-5">
            {error && (
              <div className="bg-rose-950/40 border border-rose-900/55 text-rose-300 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                ⚠️ {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-950/40 border border-emerald-900/55 text-emerald-300 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                🎉 {successMessage}
              </div>
            )}

            <div className="bg-indigo-950/40 border border-indigo-900/55 text-indigo-300 p-4 rounded-2xl text-[11px] leading-relaxed space-y-1">
              <span className="font-extrabold text-indigo-200 block">🔒 Fully Secure Recovery:</span>
              We have migrated from simulated gateways to standard production-grade Firebase security. Entering your registered JECRC student/admin email will dispatch a physical, actual reset link to your personal inbox instantly.
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300" htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 min-h-[44px]"
                  placeholder="example@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all duration-300 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-98 min-h-[44px]"
              >
                {loading ? 'Dispatched Request...' : 'Send Password Reset Email'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors min-h-[44px] px-4"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Sign In & Sign Up Views */
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-950/40 border border-rose-900/55 text-rose-300 p-4 rounded-xl text-xs font-semibold space-y-2">
                <p className="font-bold text-rose-400 flex items-center gap-1">
                  <span>⚠️</span> {error}
                </p>
                {error.toLowerCase().includes('network-request-failed') && (
                  <div className="pt-2.5 border-t border-rose-900/35 mt-2.5 text-[11px] text-rose-400 leading-relaxed">
                    <span className="font-extrabold text-rose-300 block mb-1">💡 Suggested Action:</span>
                    This error occurs when your <strong className="font-bold">AdBlocker, Brave Shield, or Privacy Extension</strong> blocks requests to Google's authentication servers.
                    <ul className="list-disc pl-4 mt-1.5 space-y-1">
                      <li>Try **disabling extensions/shields** for this page.</li>
                      <li>Open this site in an **Incognito (Private) window** or different browser.</li>
                      <li>Check your internet connection status.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300" htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 shadow-inner min-h-[44px]"
                      placeholder="Abhinand Jain"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Select Role</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`py-3 px-4 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all duration-300 min-h-[44px] ${
                          role === 'student'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`py-3 px-4 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all duration-300 min-h-[44px] ${
                          role === 'admin'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  {role === 'admin' && (
                    <div className="p-3.5 bg-amber-950/20 rounded-2xl border border-amber-900/40 space-y-2">
                      <label className="block text-xs font-bold text-amber-400" htmlFor="adminCode">Admin Access Code</label>
                      <input
                        id="adminCode"
                        name="adminCode"
                        type="password"
                        required
                        className="w-full bg-slate-900/90 border border-amber-900/30 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-amber-500 outline-none transition-all duration-300 min-h-[44px]"
                        placeholder="Enter Admin Access Code"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300" htmlFor="email-address">Email Address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 shadow-inner min-h-[44px]"
                  placeholder="example@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-300" htmlFor="password">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors min-h-[30px]"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 shadow-inner min-h-[44px]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50 transition-all duration-300 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-98 min-h-[44px]"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>

              {/* Secure Google Authentication Option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 text-xs font-bold flex items-center justify-center gap-2.5 text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl transition-all duration-300 disabled:opacity-50 min-h-[44px]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors min-h-[44px] px-4"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
