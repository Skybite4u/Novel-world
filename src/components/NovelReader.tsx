/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Novel, Chapter, Comment, User as UserType, Badge } from '../types';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Settings, FileText, 
  MessageSquare, Heart, Bookmark, Globe, Pocket, Share2, 
  CornerDownRight, Check, BookOpen, User as UserIcon, Calendar, Flame,
  Award, Eye, Sparkles, BookOpenCheck, LayoutList
} from 'lucide-react';

interface NovelReaderProps {
  novel: Novel;
  author: UserType | null;
  chapters: Chapter[];
  currentUser: UserType | null;
  onBack: () => void;
  onRefreshLikesBookmarks: () => void;
  liked: boolean;
  bookmarked: boolean;
  onToggleLike: () => void;
  onToggleBookmark: () => void;
  allUsers: UserType[];
}

export default function NovelReader({
  novel,
  author,
  chapters,
  currentUser,
  onBack,
  onRefreshLikesBookmarks,
  liked,
  bookmarked,
  onToggleLike,
  onToggleBookmark,
  allUsers
}: NovelReaderProps) {
  // Dual-mode state: 'details' (book overview page) vs 'reading' (comfort mode reader)
  const [viewMode, setViewMode] = useState<'details' | 'reading'>('details');

  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl' | '2xl'>('lg');
  const [readingTheme, setReadingTheme] = useState<'ivory' | 'mint' | 'light' | 'charcoal' | 'dark'>('ivory');
  
  const [showSettings, setShowSettings] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [authorBadge, setAuthorBadge] = useState<Badge | null>(null);

  const activeChapter = chapters[activeChapterIndex];

  // Fetch comments and author badge details once loaded
  const fetchInitialData = async () => {
    // 1. Comments
    const { data: cData, error: cErr } = await supabase
      .from('comments')
      .select('*')
      .eq('novel_id', novel.id)
      .order('created_at', { ascending: false });

    if (!cErr && cData) {
      setComments(cData);
    }

    // 2. Author Badge
    if (author?.badge_id) {
      const { data: bData, error: bErr } = await supabase
        .from('badges')
        .select('*')
        .eq('id', author.badge_id);
      
      if (!bErr && bData && bData.length > 0) {
        setAuthorBadge(bData[0]);
      }
    } else {
      setAuthorBadge(null);
    }
  };

  useEffect(() => {
    fetchInitialData();
    onRefreshLikesBookmarks();
  }, [novel.id, author?.badge_id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    const { error } = await supabase.from('comments').insert({
      user_id: currentUser.id,
      novel_id: novel.id,
      comment_text: commentText.trim()
    });

    if (!error) {
      setCommentText('');
      // Reload comments
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('novel_id', novel.id)
        .order('created_at', { ascending: false });
      if (data) setComments(data);
    }
    setSubmittingComment(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    }).catch(() => {
      // Fallback
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    });
  };

  // Styled helper for text size
  const getTextSizeClass = () => {
    switch (textSize) {
      case 'sm': return 'text-sm leading-relaxed';
      case 'base': return 'text-base leading-relaxed';
      case 'lg': return 'text-lg leading-loose font-serif';
      case 'xl': return 'text-xl leading-loose font-serif';
      case '2xl': return 'text-2xl leading-loose font-serif font-medium';
    }
  };

  // Styled helper for reading view container width
  const getThemeClass = () => {
    switch (readingTheme) {
      case 'ivory': return 'bg-[#fcfaf2] text-[#2c2415] border-amber-100';
      case 'mint': return 'bg-[#eff7f1] text-[#123019] border-emerald-100';
      case 'light': return 'bg-white text-stone-900 border-stone-200';
      case 'charcoal': return 'bg-[#1e1e1e] text-[#eadeca] border-stone-850';
      case 'dark': return 'bg-[#0b0a09] text-[#b8b39d] border-stone-950';
    }
  };

  const getSubtextClass = () => {
    return ['charcoal', 'dark'].includes(readingTheme)
      ? 'text-stone-400'
      : 'text-stone-500';
  };

  // Helper to map commenter status
  const getUserProfile = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    return found || {
      username: 'অজানা_গল্পপ্রেমী',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
      role: 'user'
    };
  };

  const startReading = (chapterIdx: number = 0) => {
    if (chapters.length === 0) return;
    setActiveChapterIndex(chapterIdx);
    setViewMode('reading');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen pb-20 bg-[#fafaf9] text-stone-900">
      
      {/* ------------------------------------------------------------------- */}
      {/* SUB-VIEW: NOVEL DETAILS PAGE */}
      {/* ------------------------------------------------------------------- */}
      {viewMode === 'details' && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          
          {/* Back to library flow */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-emerald-700 transition-colors uppercase tracking-wider mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>লাইব্রেরিতে ফিরে চলুন</span>
          </button>

          {/* Book Hero Info Block */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 mb-8 items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Book Cover Frame */}
            <div className="w-56 md:w-64 aspect-[3/4.2] rounded-2xl overflow-hidden shadow-2xl border border-stone-100 shrink-0 self-center md:self-start group relative">
              <img
                src={novel.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'}
                alt={novel.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply"></div>
            </div>

            {/* Book Meta Details Pane */}
            <div className="flex-1 flex flex-col justify-between self-stretch">
              <div>
                {/* Category & Status */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-500/10 tracking-wide uppercase">
                    {novel.category}
                  </span>
                  
                  {novel.status === 'pending' && (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      রিভিউ অপেক্ষমাণ (Pending)
                    </span>
                  )}
                  {novel.status === 'approved' && (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-250 flex items-center gap-1">
                      <BookOpenCheck className="w-3 h-3" /> অফিসিয়াল অনুমোদন
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-extrabold text-stone-850 font-serif leading-tight tracking-tight mb-4">
                  {novel.title}
                </h1>

                {/* Author Card Info */}
                <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-150 mb-6 max-w-md">
                  <img
                    src={author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                    alt={author?.username || 'লেখক'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-stone-250 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-stone-400">রচয়িতা:</span>
                      <span className="text-sm font-bold text-stone-800">@{author?.username || 'অজানা লেখক'}</span>
                    </div>
                    {authorBadge && (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-805 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-200 mt-1">
                        <span>{authorBadge.icon}</span>
                        <span>{authorBadge.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Synopsis section */}
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 font-sans">
                  কাহিনী সংক্ষেপ (Synopsis)
                </h3>
                <p className="text-stone-650 leading-relaxed text-sm md:text-md font-sans mb-8">
                  {novel.description}
                </p>
              </div>

              {/* Action buttons & Stats bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100 border-dashed mt-auto">
                
                {/* Book metrics: Chapters, Likes, Comments */}
                <div className="flex gap-4 text-xs text-stone-500 font-sans font-medium">
                  <div className="bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-150">
                    <span className="font-bold text-stone-800">{chapters.length}</span> পরিচ্ছেদ
                  </div>
                  <div className="bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-150 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span className="font-bold text-stone-800">{comments.length}</span> প্রতিক্রিয়া
                  </div>
                </div>

                {/* Interaction Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggleLike}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      liked 
                        ? 'bg-rose-50 border-rose-200 text-rose-700' 
                        : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-605'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{liked ? 'পছন্দ করা হয়েছে' : 'পছন্দ করুন'}</span>
                  </button>

                  <button
                    onClick={onToggleBookmark}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      bookmarked 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                        : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-605'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                    <span>{bookmarked ? 'তালিকাভুক্ত আছে' : 'পড়ার তালিকায় রাখুন'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors text-xs cursor-pointer flex items-center gap-1.5"
                    title="উপন্যাসের লিঙ্ক কপি করুন"
                  >
                    {shareSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                    <span>{shareSuccess ? 'কপি হয়েছে' : 'শেয়ার'}</span>
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Quick primary CTA to jump right in */}
          {chapters.length > 0 && (
            <div className="mb-8 flex justify-end">
              <button
                onClick={() => startReading(0)}
                className="w-full md:w-auto px-8 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px]"
              >
                <BookOpen className="w-4.5 h-4.5" />
                <span>প্রথম পরিচ্ছেদ থেকে পড়া শুরু করুন ➔</span>
              </button>
            </div>
          )}

          {/* Chapters and Comment section tab splitter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: list of books chapters */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
                <LayoutList className="w-5 h-5 text-emerald-700" />
                <h3 className="text-md font-extrabold text-stone-850">
                  উপন্যাসের সূচিপত্র ({chapters.length}টি সংকলন)
                </h3>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center py-12 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-stone-500">এখনও কোনো পরিচ্ছেদ বা সূচি যুক্ত করা হয়নি।</p>
                  <p className="text-[11px] text-stone-400">এই মহিমান্বিত উপন্যাসের পরবর্তী অধ্যায় অতি শীঘ্রই আসতে চলেছে!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {chapters.map((ch, idx) => (
                    <div
                      key={ch.id}
                      onClick={() => startReading(idx)}
                      className="group flex items-center justify-between p-3.5 rounded-xl border border-stone-100 hover:border-emerald-500/20 hover:bg-emerald-50/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-stone-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 text-[11px] font-bold rounded-lg flex items-center justify-center text-stone-500 shrink-0 transition-colors">
                          {ch.chapter_number}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-800 group-hover:text-emerald-800 transition-colors">
                            {ch.title}
                          </h4>
                          <span className="text-[9px] text-stone-400 block mt-0.5 font-mono">
                            ফেব্রুয়ারি {new Date(ch.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <span>পড়ুন</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Quick stats & discussion previews */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    পাঠক মন্তব্য কিউ পাঠক ({comments.length})
                  </h4>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-8">কোনো মন্তব্য নেই। প্রথম পাঠক হিসেবে প্রতিক্রিয়া জানান!</p>
                  ) : (
                    comments.slice(0, 4).map((c) => {
                      const profile = getUserProfile(c.user_id);
                      return (
                        <div key={c.id} className="p-3 bg-stone-50 border border-stone-100 rounded-xl text-xs">
                          <div className="flex items-center gap-1.5 mb-1 bg-white p-1 rounded-lg">
                            <img src={profile.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                            <span className="font-bold text-[10px] text-stone-700">@{profile.username}</span>
                          </div>
                          <p className="text-stone-605 line-clamp-3 leading-relaxed font-sans">{c.comment_text}</p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Box leading to writing block */}
              <div className="mt-6 pt-4 border-t border-stone-100 border-dashed">
                <button
                  onClick={() => {
                    if (chapters.length > 0) startReading(0);
                  }}
                  className="w-full text-center py-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  মন্তব্য পড়তে এবং পাঠে অংশ নিতে প্রবেশ করুন
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* SUB-VIEW: COZY DISTRACTION-FREE READING PAGE */}
      {/* ------------------------------------------------------------------- */}
      {viewMode === 'reading' && (
        <div className={`transition-colors min-h-screen ${getThemeClass()}`}>
          
          {/* Top sticky controls layout */}
          <div className={`sticky top-0 z-30 border-b backdrop-blur-md flex items-center justify-between px-4 md:px-6 py-3.5 transition-colors ${['charcoal', 'dark'].includes(readingTheme) ? 'bg-stone-900/95 border-stone-800 text-stone-105' : 'bg-white/95 border-stone-200 text-stone-850'}`}>
            
            <button
              onClick={() => setViewMode('details')}
              className="flex items-center gap-2 text-xs font-bold hover:opacity-80 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>উপন্যাস বিবরণে ফিরুন</span>
            </button>

            {/* Right Header Buttons */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-semibold ${showSettings ? 'bg-emerald-700 text-white' : 'hover:bg-stone-500/10'}`}
                title="হরফ ও থিম পরিবর্তন"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">হরফ ও থিম</span>
              </button>

              {/* Likes */}
              <button
                onClick={onToggleLike}
                className={`p-2 rounded-xl flex items-center transition-all hover:scale-105 cursor-pointer ${
                  liked ? 'text-rose-500 font-bold' : 'text-stone-400 hover:bg-stone-500/10'
                }`}
                title="পছন্দ"
              >
                <Heart className={`w-4.5 h-4.5 ${liked ? 'fill-rose-500' : ''}`} />
              </button>

              {/* Bookmarks */}
              <button
                onClick={onToggleBookmark}
                className={`p-2 rounded-xl flex items-center transition-all hover:scale-105 cursor-pointer ${
                  bookmarked ? 'text-teal-500 font-bold' : 'text-stone-400 hover:bg-stone-500/10'
                }`}
                title="রিডিং বুকমার্ক"
              >
                <Bookmark className={`w-4.5 h-4.5 ${bookmarked ? 'fill-teal-500' : ''}`} />
              </button>

              {/* Copy link share fallback */}
              <button
                onClick={handleShare}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-500/10 hover:text-emerald-500 transition-colors cursor-pointer"
                title="শেয়ার করুন"
              >
                {shareSuccess ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Share2 className="w-4.5 h-4.5" />}
              </button>
            </div>

          </div>

          {/* Small responsive settings drawer block inside reading page */}
          {showSettings && (
            <div className={`max-w-xl mx-auto px-4 md:px-0 mt-3`}>
              <div className={`p-4 rounded-2xl border transition-all ${['charcoal', 'dark'].includes(readingTheme) ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Font Sizes */}
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-2">
                      হরফের আকার পরিবর্তন:
                    </h5>
                    <div className="flex bg-stone-500/10 p-1 rounded-xl gap-1">
                      {(['sm', 'base', 'lg', 'xl', '2xl'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setTextSize(sz)}
                          className={`flex-1 text-center py-1.5 rounded-lg text-xs capitalize transition-all cursor-pointer ${
                            textSize === sz 
                              ? 'bg-emerald-700 text-white font-bold' 
                              : 'hover:bg-stone-500/15 text-stone-400'
                          }`}
                        >
                          {sz === 'sm' ? 'ছোট' : sz === 'base' ? 'মঝারি' : sz === 'lg' ? 'বড়' : sz === 'xl' ? 'অধিক' : 'বিশাল'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reading Themes */}
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-2">
                      রিডিং মোড / থিম কালার:
                    </h5>
                    <div className="flex gap-1.5">
                      {[
                        { id: 'ivory', name: 'আভরি', style: 'bg-[#fcfaf2] text-[#2c2415] border-amber-200' },
                        { id: 'mint', name: 'মিন্ট', style: 'bg-[#eff7f1] text-[#123019] border-emerald-250' },
                        { id: 'light', name: 'ধবল', style: 'bg-white text-stone-905 border-stone-200' },
                        { id: 'charcoal', name: 'ধূসর', style: 'bg-[#1e1e1e] text-[#eadeca] border-stone-800' },
                        { id: 'dark', name: 'তামসী', style: 'bg-[#0b0a09] text-[#b8b39d] border-stone-950' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setReadingTheme(t.id as any)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${t.style} ${
                            readingTheme === t.id ? 'ring-2 ring-emerald-500 ring-offset-2 scale-102' : 'opacity-80'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Comfortable reading core container */}
          <main className="max-w-2xl mx-auto px-4 md:px-6 pt-10">
            
            {/* Novel details tiny row */}
            <div className="text-center pb-6 border-b border-stone-500/10 mb-8 font-sans">
              <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold block mb-1">
                {novel.category}
              </span>
              <h2 className="text-xl font-bold tracking-tight mb-2">
                {novel.title}
              </h2>
              <p className={`text-xs ${getSubtextClass()}`}>
                লেখক: <span className="font-semibold text-emerald-600">@{author?.username || 'লেখক'}</span>
              </p>

              {/* Prev / Next switch on top */}
              {chapters.length > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    disabled={activeChapterIndex === 0}
                    onClick={() => {
                      setActiveChapterIndex(prev => prev - 1);
                      window.scrollTo({ top: 0 });
                    }}
                    className="p-1 px-2.5 rounded-full bg-stone-500/10 hover:bg-stone-500/20 text-[11px] font-bold disabled:opacity-30 cursor-pointer text-inherit"
                    title="পূর্ববর্তী পরিচ্ছেদ"
                  >
                    ❮ পূর্ববর্তী
                  </button>
                  <span className="text-xs font-bold px-3 py-1 bg-stone-500/15 rounded-full text-inherit">
                    পর্ব {activeChapter?.chapter_number} / {chapters.length}
                  </span>
                  <button
                    disabled={activeChapterIndex === chapters.length - 1}
                    onClick={() => {
                      setActiveChapterIndex(prev => prev + 1);
                      window.scrollTo({ top: 0 });
                    }}
                    className="p-1 px-2.5 rounded-full bg-stone-500/10 hover:bg-stone-500/20 text-[11px] font-bold disabled:opacity-30 cursor-pointer text-inherit"
                    title="পরবর্তী পরিচ্ছেদ"
                  >
                    পরবর্তী ❯
                  </button>
                </div>
              )}
            </div>

            {/* Chapter header and visual divider */}
            {chapters.length === 0 ? (
              <div className="text-center py-20 font-sans">
                <p className="text-amber-500 font-bold mb-1">এই উপন্যাসে কোনো পর্ব এখনো প্রকাশ পায়নি।</p>
                <p className="text-xs text-stone-400">নতুন আপডেট পেতে লেখককে অনুসরণ করুন।</p>
              </div>
            ) : (
              <article className="prose prose-stone dark:prose-invert max-w-none">
                <h3 className="text-2xl font-bold font-serif mb-6 pb-2 border-b border-emerald-500/20">
                  {activeChapter?.title}
                </h3>

                {/* Cozy content width text block */}
                <div className={`${getTextSizeClass()} whitespace-pre-wrap font-sans transition-all leading-loose text-justify px-0.5 mb-16`}>
                  {activeChapter?.content}
                </div>
              </article>
            )}

            {/* Footer switcher panels */}
            {chapters.length > 1 && (
              <div className="flex items-center justify-between border-t border-stone-500/10 pt-8 mt-12 gap-4 flex-wrap font-sans">
                <button
                  disabled={activeChapterIndex === 0}
                  onClick={() => {
                    setActiveChapterIndex(prev => prev - 1);
                    window.scrollTo({ top: 0 });
                  }}
                  className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 px-4 py-3 bg-stone-500/10 hover:bg-stone-500/20 disabled:opacity-35 text-xs font-bold rounded-xl transition-all cursor-pointer text-inherit"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী পরিচ্ছেদ</span>
                </button>

                <button
                  disabled={activeChapterIndex === chapters.length - 1}
                  onClick={() => {
                    setActiveChapterIndex(prev => prev + 1);
                    window.scrollTo({ top: 0 });
                  }}
                  className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-35 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <span>পরবর্তী পরিচ্ছেদ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Comment details directly within comfortable view */}
            <section className="mt-20 pt-10 border-t border-stone-500/10 font-sans">
              <div className="flex items-center gap-2 text-md font-extrabold mb-6">
                <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
                <span>পাঠক মতামত ও আলোচনা ({comments.length}টি বার্তা হয়েছে)</span>
              </div>

              {currentUser ? (
                <form onSubmit={handlePostComment} className="mb-8 p-4 rounded-2xl bg-stone-500/5 border border-stone-500/10">
                  <div className="flex items-start gap-3">
                    <img
                      src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <textarea
                        rows={3}
                        required
                        placeholder="আপনার মূল্যবান গঠনমূলক সমালোচনা লিখুন..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/45 transition-colors ${['charcoal', 'dark'].includes(readingTheme) ? 'bg-stone-850 border-stone-705 text-stone-100' : 'bg-white border-stone-250 text-stone-900'}`}
                      />
                      <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[10px] text-stone-400 font-mono">শালীন মন্তব্য ও সুস্থ পরিবেশ বজায় রাখুন।</span>
                        <button
                          type="submit"
                          disabled={submittingComment || !commentText.trim()}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          {submittingComment ? 'পাঠানো হচ্ছে...' : 'প্রকাশ করুন'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-3 rounded-xl bg-amber-500/5 text-center text-xs text-stone-405 border border-amber-500/10">
                  মতামত দিতে দয়া করে উপরের মেনু থেকে <b>নিবন্ধন বা লগইন</b> করুন।
                </div>
              )}

              {/* Display messages */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-center py-4 text-xs text-stone-405">এখনও কোনো মতামত আসেনি। আপনার মনের ভাবনা প্রথম ব্যক্ত করুন!</p>
                ) : (
                  comments.map((m) => {
                    const profile = getUserProfile(m.user_id);
                    return (
                      <div key={m.id} className="p-3 bg-stone-500/5 rounded-xl border border-stone-550/5 flex gap-3 text-xs">
                        <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border" />
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-emerald-800 dark:text-emerald-400">@{profile.username}</span>
                            {profile.role === 'admin' && (
                              <span className="bg-rose-500/10 text-rose-500 text-[8px] font-extrabold px-1 rounded">ADMIN</span>
                            )}
                            <span className="text-[9px] text-stone-450">{new Date(m.created_at).toLocaleDateString('bn-BD')}</span>
                          </div>
                          <p className="leading-relaxed font-sans font-normal text-inherit">{m.comment_text}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

            </section>

          </main>

        </div>
      )}

    </div>
  );
}
