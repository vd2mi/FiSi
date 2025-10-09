import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

function Auth({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
      
      onLogin({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName.trim()
      });
    } catch (error) {
      console.error('Sign up error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      onLogin({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || userCredential.user.email
      });
    } catch (error) {
      console.error('Sign in error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        default:
          setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setIsForgotPassword(false);
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-terminal-panel border border-terminal-border rounded-lg p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-terminal-accent mb-2 font-mono">Fi‑Si</h1>
              <p className="text-terminal-muted">Reset Password</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded flex items-start gap-2">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded">
                <p className="text-sm text-green-200">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-terminal-text mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-terminal-bg border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent transition-colors"
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-terminal-accent hover:bg-terminal-accentDark text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="w-full text-sm text-terminal-accent hover:text-terminal-accentDark transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-terminal-panel border border-terminal-border rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-terminal-accent mb-2 font-mono neon-text">Fi‑Si</h1>
            <p className="text-terminal-text font-mono">[ SECURE ACCESS TERMINAL ]</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              className={`flex-1 py-2 rounded transition-colors ${
                !isSignUp
                  ? 'bg-terminal-accent text-white'
                  : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              className={`flex-1 py-2 rounded transition-colors ${
                isSignUp
                  ? 'bg-terminal-accent text-white'
                  : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded flex items-start gap-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-terminal-text mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-terminal-bg border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent transition-colors"
                  disabled={loading}
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-terminal-text mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-terminal-bg border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent transition-colors"
                  disabled={loading}
                  autoFocus={!isSignUp}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-terminal-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-terminal-bg border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-terminal-muted hover:text-terminal-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-terminal-text mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-terminal-bg border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-terminal-accent hover:bg-terminal-accentDark text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Processing...'
              ) : isSignUp ? (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {!isSignUp && (
            <button
              onClick={() => {
                setIsForgotPassword(true);
                setError('');
              }}
              className="w-full mt-4 text-sm text-terminal-accent hover:text-terminal-accentDark transition-colors"
            >
              Forgot Password?
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-terminal-border">
            <p className="text-xs text-terminal-muted text-center font-mono">
              &gt; REAL-TIME MARKET DATA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
