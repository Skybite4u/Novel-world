/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, User, Mail, Lock, AlignLeft, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthProps {
  onSuccess: (user: any) => void;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150'
];

export default function Auth({ onSuccess, onClose }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setShowResend(false);

    try {
      if (isSignUp) {
        if (!username) {
          throw new Error('দয়া করে একটি ইউজারনেম টাইপ করুন!');
        }
        if (username.length < 3) {
          throw new Error('ইউজারনেম অন্তত ৩ অক্ষরের হতে হবে।');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase().replace(/\s+/g, '_'),
              avatar_url: avatarUrl,
              bio: bio || 'নভেল ওয়ার্ল্ডের একজন সম্মানিত सदस्य।'
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) throw signUpError;

        // In standard Supabase setups, if email verification is turned on,
        // no session is returned immediately.
        if (data?.session) {
          setSuccessMsg('সফলভাবে রেজিস্ট্রেশন সম্পন্ন হয়েছে! স্বাগতম।');
          setTimeout(() => {
            onSuccess(data.user);
          }, 1200);
        } else {
          setSuccessMsg('রেজিস্ট্রেশন সম্পন্ন হয়েছে! আপনার ইমেইল ইনবক্সে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্ট ভেরিফাই করুন।');
        }

      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        onSuccess(data.user);
      }
    } catch (err: any) {
      console.error(err);
      const isUnconfirmed = err.message && (
        err.message.toLowerCase().includes('not confirmed') || 
        err.message.toLowerCase().includes('confirm') || 
        err.message.toLowerCase().includes('verified') || 
        err.message.toLowerCase().includes('verification_') ||
        err.message.toLowerCase().includes('verification')
      );

      if (isUnconfirmed) {
        setError('আপনার ইমেইল ঠিকানাটি এখনো ভেরিফাই বা নিশ্চিত করা হয়নি। দয়া করে ইনবক্স চেক করুন বা নিচের বাটন প্রেস করে ভেরিফিকেশন ইমেইল পুনরায় পাঠান।');
        setShowResend(true);
      } else {
        setError(err.message || 'একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('ভেরিফিকেশন মেইল পাঠানোর জন্য ইমেইল ঠিকানা প্রয়োজন।');
      return;
    }
    setResending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (resendError) throw resendError;
      setSuccessMsg('ভেরিফিকেশন ইমেইল সফলভাবে পুনরায় পাঠানো হয়েছে! অনুগ্রহ করে আপনার ইনবক্স চেক করুন।');
      setShowResend(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ভেরিফিকেশন ইমেইল পুনরায় পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'গুগল দিয়ে লগইন করার সময় কোনো সমস্যা হয়েছে।');
      setLoading(false);
    }
  };

  // Pre-login helpers to quickly test locally as admin / author of novels
  const loginAsDemoAdmin = () => {
    setEmail('siyamrahman1268@gmail.com');
    setPassword('admin123'); 
    setIsSignUp(false);
  };

  const loginAsDemoAuthor = () => {
    setEmail('tasnim@example.com');
    setPassword('tasnim123');
    setIsSignUp(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div 
        className="relative bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded-full text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex rounded-2xl overflow-hidden mb-3 w-16 h-16 shadow-lg border border-emerald-500/20">
              <img 
                src="/src/assets/images/logo_1781596643815.jpg" 
                alt="Novel World Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold text-stone-100 flex items-center justify-center gap-1.5">
              <span>নভেল ওয়ার্ল্ড</span>
              <span className="text-emerald-400 text-xs px-2 py-0.5 bg-emerald-950/50 border border-emerald-900/30 rounded-full font-normal">
                {isSignUp ? 'নিবন্ধন' : 'লগইন'}
              </span>
            </h2>
            <p className="text-stone-400 text-xs mt-1">
              {isSignUp ? 'নভেল ওয়ার্ল্ডের সদস্য হয়ে এখনই চমৎকার উপন্যাস প্রকাশ করুন!' : 'আপনার প্রিয় উপন্যাসের পাতায় ফিরে যান'}
            </p>
          </div>

          {/* Social Google Login Button */}
          <div className="mb-5">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 active:bg-stone-850 text-stone-200 text-sm font-semibold rounded-xl border border-stone-700/60 transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27A11.94 11.94 0 0012 0C7.35 0 3.37 2.67 1.45 6.57l3.79 2.94C6.18 6.59 8.89 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.51c-.24-.71-.38-1.47-.38-2.27s.14-1.56.38-2.27L1.45 7s-.82 1.64-.82 4.77 1.64 4.77 4.77 4.77l3.79-2.94C8.89 18.96 6.18 17.41 5.24 14.51z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.66-2.84c-1.01.67-2.31 1.08-4.27 1.08-3.11 0-5.82-1.55-6.76-4.47L1.45 17.8A11.97 11.97 0 0012 24z"
                />
              </svg>
              <span>গুগল অ্যাকাউন্ট দিয়ে এগিয়ে যান</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-stone-800 flex-1"></div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">অথবা ইমেইল দিয়ে</span>
            <div className="h-px bg-stone-800 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    ইউজারনেম (ইংরেজিতে ইউনিক)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. siyam_novelist"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-stone-850 text-stone-100 border border-stone-700/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Avatar Presets */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    প্রোফাইল ছবি নির্বাচন করুন
                  </label>
                  <div className="flex gap-2 justify-between flex-wrap pb-1">
                    {AVATAR_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer relative transition-transform hover:scale-105 ${
                          avatarUrl === url ? 'border-emerald-500 scale-110 shadow-md' : 'border-stone-700'
                        }`}
                      >
                        <img src={url} alt={`avatar-${i}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        {avatarUrl === url && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Short Bio */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    সংক্ষিপ্ত পরিচিতি বা বায়ো (ঐচ্ছিক)
                  </label>
                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-stone-400">
                      <AlignLeft className="w-4 h-4" />
                    </span>
                    <textarea
                      placeholder="আপনার বইয়ের প্রতি ভালোবাসা বা ভালো লাগা প্রকাশ করুন..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-stone-850 text-stone-100 border border-stone-700/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                ইমেইল এড্রেস
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-stone-850 text-stone-100 border border-stone-700/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-stone-850 text-stone-100 border border-stone-700/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex flex-col gap-2 p-3 bg-rose-950/40 border border-rose-900/40 rounded-xl text-xs font-medium">
                <div className="flex items-start gap-2 text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="mt-2.5 w-full py-1.5 text-xs text-center font-bold text-white bg-rose-600/90 hover:bg-rose-500 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>পুনরায় অ্যাক্টিভেশন ইমেইল পাঠান</span>
                    )}
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 text-emerald-400 p-3 bg-emerald-950/40 border border-emerald-900/40 rounded-xl text-xs font-medium animate-fadeIn">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-sans font-semibold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 py-2.5 rounded-xl transition-all flex items-center justify-center shadow-lg hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isSignUp ? (
                'রেজিস্ট্রেশন করুন'
              ) : (
                'লগইন করুন'
              )}
            </button>
          </form>

          {/* Quick Mock Testers */}
          <div className="mt-6 pt-5 border-t border-stone-850">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>সহজ টেস্টিং শর্টকাট (ডাব্লু-মোড)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loginAsDemoAdmin}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 rounded-lg text-[10px] font-semibold border border-rose-900/40 cursor-pointer"
              >
                🔑 অ্যাডমিন হিসেবে টেস্ট (Siyam)
              </button>
              <button
                type="button"
                onClick={loginAsDemoAuthor}
                className="px-3 py-1.5 bg-teal-950/40 hover:bg-teal-900/30 text-teal-300 rounded-lg text-[10px] font-semibold border border-teal-900/40 cursor-pointer"
              >
                ✍️ লেখক হিসেবে টেস্ট (Tasnim)
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
                setShowResend(false);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-sans font-semibold cursor-pointer"
            >
              {isSignUp ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করতে চান? সাইন আপ করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
