/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Search, LogIn, LogOut, ShieldAlert, Award, User, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenMyProfile: () => void;
  onOpenDashboard: () => void;
  onOpenAdmin: () => void;
  onOpenHome: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isMockActive: boolean;
}

const CATEGORIES = [
  'সব উপন্যাস',
  'রোমান্টিক ও নাটক',
  'কল্পবিজ্ঞান ও রহস্য',
  'সামাজিক ও জীবনমুখী',
  'ভৌতিক ও হরর',
  'ঐতিহাসিক ও ক্লাসিক'
];

export default function Header({
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenMyProfile,
  onOpenDashboard,
  onOpenAdmin,
  onOpenHome,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isMockActive
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
      {isMockActive && (
        <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs py-1.5 px-4 text-center border-b border-amber-200/50 dark:border-amber-900/50 font-mono flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>অনলাইন স্যান্ডবক্স মোড সক্রিয়া - সমস্ত ডেটা লোকাল স্টোরেজে সুরক্ষিত থাকবে। আপনার Supabase ক্লায়েন্ট কনফিগার করতে <b>.env</b> ফাইল আপডেট করুন।</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenHome}
              className="flex items-center gap-2.5 text-2xl font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 font-sans tracking-tight focus:outline-none transition-all group"
            >
              <div className="bg-emerald-100 dark:bg-emerald-950/60 p-2 rounded-xl group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              </div>
              <span className="bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                নভেল ওয়ার্ল্ড
              </span>
            </button>
            
            {/* Quick user status icon for small devices */}
            <div className="flex items-center gap-2 md:hidden">
              {currentUser ? (
                <button
                  onClick={onOpenMyProfile}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-500"
                >
                  <img
                    src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md mx-auto md:mx-4 w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="উপন্যাস বা লেখকের নাম অনুসন্ধান করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
            />
          </div>

          {/* Nav Actions */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={onOpenAdmin}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>অ্যাডমিন প্যানেল</span>
                  </button>
                )}
                
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>লেখক ড্যাশবোর্ড</span>
                </button>

                <button
                  onClick={onOpenMyProfile}
                  className="flex items-center gap-2 px-3 py-1 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg transition-all"
                >
                  <img
                    src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200 max-w-[90px] truncate">
                      @{currentUser.username}
                    </div>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  title="লগআউট"
                  className="p-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4_5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন / রেজিস্টার করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Small Screen Bottom actions (Horizontal Scroll & Filter list) */}
        <div className="flex md:hidden items-center justify-around border-t border-stone-100 dark:border-stone-800 py-3 text-xs font-medium text-stone-600 dark:text-stone-300 gap-1">
          <button onClick={onOpenHome} className="flex flex-col items-center gap-1 py-1 px-2 hover:text-emerald-600">
            <BookOpen className="w-4.5 h-4.5" />
            <span>হোম</span>
          </button>
          {currentUser && (
            <>
              <button onClick={onOpenDashboard} className="flex flex-col items-center gap-1 py-1 px-2 hover:text-emerald-600">
                <Award className="w-4.5 h-4.5" />
                <span>ড্যাশবোর্ড</span>
              </button>
              <button onClick={onOpenMyProfile} className="flex flex-col items-center gap-1 py-1 px-2 hover:text-emerald-600">
                <User className="w-4.5 h-4.5" />
                <span>প্রোফাইল</span>
              </button>
              {currentUser.role === 'admin' && (
                <button onClick={onOpenAdmin} className="flex flex-col items-center gap-1 py-1 px-2 text-rose-600">
                  <ShieldAlert className="w-4.5 h-4.5" />
                  <span>অ্যাডমিন</span>
                </button>
              )}
              <button onClick={onLogout} className="flex flex-col items-center gap-1 py-1 px-2 text-stone-400">
                <LogOut className="w-4.5 h-4.5" />
                <span>লগআউট</span>
              </button>
            </>
          )}
          {!currentUser && (
            <button onClick={onOpenAuth} className="flex flex-col items-center gap-1 py-1 px-2 text-emerald-600">
              <LogIn className="w-4.5 h-4.5" />
              <span>লগইন</span>
            </button>
          )}
        </div>

        {/* Categories strip */}
        <div className="py-2.5 overflow-x-auto scrollbar-none flex items-center gap-1.5 border-t border-stone-100 dark:border-stone-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-1 text-xs rounded-full cursor-pointer transition-all ${
                (selectedCategory === cat || (cat === 'সব উপন্যাস' && !selectedCategory))
                  ? 'bg-emerald-700 text-white font-medium'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
