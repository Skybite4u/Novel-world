/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Sparkles, User, Mail, Lock, Image, AlignLeft, Check, AlertCircle } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

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
              bio: bio || 'নভেল ওয়ার্ল্ডের একজন সম্মানিত সদস্য।'
            }
          }
        });

        if (signUpError) throw signUpError;
        setSuccessMsg('সফলভাবে রেজিস্ট্রেশন সম্পন্ন হয়েছে! স্বাগতম।');
        setTimeout(() => {
          if (data?.user) {
            onSuccess(data.user);
          }
        }, 1200);

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
      setError(err.message || 'একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  // Pre-login helper to quickly test as admin!
  const loginAsDemoAdmin = () => {
    setEmail('siyamrahman1268@gmail.com');
    setPassword('admin123'); // Demo password doesn't matter since mock bypasses auth hashing anyway
    setIsSignUp(false);
  };

  const loginAsDemoAuthor = () => {
    setEmail('tasnim@example.com');
    setPassword('tasnim123');
    setIsSignUp(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div 
        className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-full text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex bg-emerald-100 dark:bg-emerald-950/50 p-3 rounded-full mb-3 text-emerald-700 dark:text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {isSignUp ? 'নতুন অ্যাকাউন্ট খুলুন' : 'অ্যাকাউন্টে লগইন করুন'}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              {isSignUp ? 'নভেল ওয়ার্ল্ডের সদস্য হয়ে এখনই লেখা শুরু করুন!' : 'আপনার প্রিয় বইয়ের পাতায় ফিরে যান'}
            </p>
          </div>

          {/* Quick Demo Credentials Widget */}
          <div className="mb-6 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>সহজ টেস্টিং শর্টকাট (ডাব্লু-মোড)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loginAsDemoAdmin}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/30 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-semibold border border-rose-200/50 dark:border-rose-900/40 cursor-pointer"
              >
                🔑 অ্যাডমিন হিসেবে টেস্ট (Siyam)
              </button>
              <button
                type="button"
                onClick={loginAsDemoAuthor}
                className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 dark:bg-teal-950/40 dark:hover:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-lg text-xs font-semibold border border-teal-200/50 dark:border-teal-900/40 cursor-pointer"
              >
                ✍️ লেখক হিসেবে টেস্ট (Tasnim)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    ইউজারনেম (ইংরেজিতে ইউনিক)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. niloy_chowdhury"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Avatar Presets */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    প্রোফাইল ছবি নির্বাচন করুন
                  </label>
                  <div className="flex gap-2 justify-between flex-wrap pb-1">
                    {AVATAR_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer relative transition-transform hover:scale-105 ${
                          avatarUrl === url ? 'border-emerald-500 scale-110 shadow-md' : 'border-stone-200 dark:border-stone-700'
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
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    সংক্ষিপ্ত পরিচিতি বা বায়ো
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
                      className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
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
                  className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
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
                  className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-xs font-medium animate-bounce">
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

          <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 font-sans font-semibold cursor-pointer"
            >
              {isSignUp ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করতে চান? সাইন আপ করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
