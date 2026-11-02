import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  LogIn, 
  UserPlus, 
  KeyRound,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    currentUser, 
    signInWithEmailOrPhone, 
    signUpWithEmailOrPhone, 
    resetPassword,
    signInWithGoogle,
    signInAsGuest,
    logOut
  } = useFinance();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email address or phone number.');
      return;
    }

    if (mode === 'forgot') {
      if (!identifier.includes('@')) {
        setErrorMessage('Password reset link requires a valid email address.');
        return;
      }
      setLoading(true);
      const res = await resetPassword(identifier.trim());
      setLoading(false);
      if (res.success) {
        setSuccessMessage('Password reset link sent! Check your inbox.');
      } else {
        setErrorMessage(res.error || 'Failed to send password reset email.');
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      setLoading(true);
      const res = await signUpWithEmailOrPhone(identifier.trim(), password, fullName.trim() || undefined);
      setLoading(false);
      if (res.success) {
        closeAuthModal();
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
      return;
    }

    // Sign in
    setLoading(true);
    const res = await signInWithEmailOrPhone(identifier.trim(), password);
    setLoading(false);
    if (res.success) {
      closeAuthModal();
    } else {
      setErrorMessage(res.error || 'Invalid credentials. Please verify your phone/email and password.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await signInWithGoogle();
      closeAuthModal();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      await signInAsGuest();
      closeAuthModal();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Guest mode activation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {currentUser ? 'Account & Isolation' : mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              {currentUser 
                ? 'Your private financial ledger is isolated and encrypted' 
                : mode === 'signin' 
                ? 'Sign in to access your personal money ledger' 
                : mode === 'signup' 
                ? 'Register with phone number or email for isolated records' 
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If user is ALREADY signed in: Show account status and Log Out */}
        {currentUser ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {currentUser.isAnonymous ? 'Guest User' : 'Authenticated'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>User Identifier:</span>
                <span className="font-mono text-zinc-200">
                  {currentUser.email || currentUser.phoneNumber || `Guest (${currentUser.uid.slice(0, 8)})`}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Account Isolation:</span>
                <span className="text-zinc-300 font-medium">Active (Dedicated Firestore Scope)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              {currentUser.isAnonymous && (
                <button
                  onClick={() => {
                    logOut().then(() => setMode('signup'));
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Create Permanent Email / Phone Account
                </button>
              )}

              <button
                onClick={() => {
                  logOut();
                  closeAuthModal();
                }}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Selector Tabs (Sign In / Sign Up) */}
            {mode !== 'forgot' && (
              <div className="grid grid-cols-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    mode === 'signin' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMessage(null); setSuccessMessage(null); }}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    mode === 'signup' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error or Success notification */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Phone Number or Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or name@example.com"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="block text-[10px] text-zinc-500 mt-1">
                  Enter your 10-digit mobile number or standard email address
                </span>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-300">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to MoneyDesk</span>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Isolated Account</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset Email</span>
                  </>
                )}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
                  className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200 pt-1 cursor-pointer"
                >
                  Back to Sign In
                </button>
              )}
            </form>

            {/* Social & Alternative Auth Divider */}
            {mode !== 'forgot' && (
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-zinc-800 w-full" />
                  <span className="bg-zinc-900 px-3 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Or Continue With
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-medium transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span>Instant Guest</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
