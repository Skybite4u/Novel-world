/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase, isUsingMock } from './lib/supabase';
import { Novel, Chapter, Comment, User as UserType, Badge, Bookmark, Like } from './types';
import Header from './components/Header';
import Auth from './components/Auth';
import NovelReader from './components/NovelReader';
import CreatorDashboard from './components/CreatorDashboard';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import { 
  BookOpen, Star, HelpCircle, Heart, ChevronRight, MessageSquare, 
  Layers, Filter, Sparkles, PenTool, Flame, ArrowUpRight, Award, Trash
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Navigation states: 'home' | 'reader' | 'dashboard' | 'admin' | 'profile'
  const [currentView, setCurrentView] = useState<'home' | 'reader' | 'dashboard' | 'admin' | 'profile'>('home');
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [profileTargetUser, setProfileTargetUser] = useState<UserType | null>(null);

  // Core collections data
  const [allNovels, setAllNovels] = useState<Novel[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [allLikes, setAllLikes] = useState<Like[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব উপন্যাস');

  // Novel likes/bookmarks local tracking for active reader
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Sync state helpers
  const fetchData = async () => {
    try {
      // 1. Fetch Badges
      const { data: bData } = await supabase.from('badges').select('*');
      if (bData) setAllBadges(bData);

      // 2. Fetch Users
      const { data: uData } = await supabase.from('users').select('*');
      if (uData) setAllUsers(uData);

      // 3. Fetch Novels
      const { data: nData } = await supabase.from('novels').select('*').order('created_at', { ascending: false });
      if (nData) setAllNovels(nData);

      // 4. Fetch Chapters
      const { data: cData } = await supabase.from('chapters').select('*').order('chapter_number', { ascending: true });
      if (cData) setAllChapters(cData);

      // 5. Fetch Bookmarks
      const { data: bmData } = await supabase.from('bookmarks').select('*');
      if (bmData) setAllBookmarks(bmData);

      // 6. Fetch Likes
      const { data: lData } = await supabase.from('likes').select('*');
      if (lData) setAllLikes(lData);

    } catch (err) {
      console.error('Error fetching data from Supabase client: ', err);
    }
  };

  // Auth session initialization
  useEffect(() => {
    // Sync DB initially
    fetchData();

    // Check existing auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Map Auth user format with detailed public database details
  const syncProfile = async (uid: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', uid);
    if (!error && data && data.length > 0) {
      setCurrentUser(data[0]);
    } else {
      // Create user fallback
      const { data: allUsersList } = await supabase.from('users').select('*');
      if (allUsersList) setAllUsers(allUsersList);
    }
  };

  // Sync with current user changes periodically
  useEffect(() => {
    if (currentUser) {
      syncProfile(currentUser.id);
    }
  }, [allUsers]);

  // Refresh active reader metrics
  const refreshActiveLikesBookmarks = () => {
    if (!selectedNovel || !currentUser) {
      setIsLiked(false);
      setIsBookmarked(false);
      return;
    }
    const hasLiked = allLikes.some(l => l.novel_id === selectedNovel.id && l.user_id === currentUser.id);
    const hasBmk = allBookmarks.some(b => b.novel_id === selectedNovel.id && b.user_id === currentUser.id);
    setIsLiked(hasLiked);
    setIsBookmarked(hasBmk);
  };

  useEffect(() => {
    refreshActiveLikesBookmarks();
  }, [selectedNovel, allLikes, allBookmarks, currentUser]);

  const handleToggleLike = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedNovel) return;

    if (isLiked) {
      // Unlike
      await supabase.from('likes').delete().eq('novel_id', selectedNovel.id).eq('user_id', currentUser.id);
    } else {
      // Like
      await supabase.from('likes').insert({ novel_id: selectedNovel.id, user_id: currentUser.id });
    }
    // Pull full fresh collection to sync bookmarks/likes references
    const { data: lData } = await supabase.from('likes').select('*');
    if (lData) setAllLikes(lData);
  };

  const handleToggleBookmark = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedNovel) return;

    if (isBookmarked) {
      // Remove Bookmark
      await supabase.from('bookmarks').delete().eq('novel_id', selectedNovel.id).eq('user_id', currentUser.id);
    } else {
      // Create Bookmark
      await supabase.from('bookmarks').insert({ novel_id: selectedNovel.id, user_id: currentUser.id });
    }
    // Pull full fresh collection to sync bookmarks/likes references
    const { data: bmData } = await supabase.from('bookmarks').select('*');
    if (bmData) setAllBookmarks(bmData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentView('home');
  };

  // Filter novels for the main screen grid layout
  const filteredNovels = allNovels.filter(novel => {
    // Non-admins can only see approved novels or their own drafts
    const isApproved = novel.status === 'approved';
    const isOwner = currentUser && novel.author_id === currentUser.id;
    const isVisible = isApproved || isOwner || (currentUser && currentUser.role === 'admin');

    if (!isVisible) return false;

    // Category check
    const matchesCategory = selectedCategory === 'সব উপন্যাস' || novel.category === selectedCategory;

    // Search query check
    const cleanSearchStr = searchQuery.toLowerCase();
    const novelAuthor = allUsers.find(u => u.id === novel.author_id);
    const authorUsername = novelAuthor ? novelAuthor.username.toLowerCase() : '';
    const matchesSearch = 
      novel.title.toLowerCase().includes(cleanSearchStr) ||
      novel.description.toLowerCase().includes(cleanSearchStr) ||
      authorUsername.includes(cleanSearchStr);

    return matchesCategory && matchesSearch;
  });

  const getNovelLikesCount = (novelId: string) => {
    return allLikes.filter(l => l.novel_id === novelId).length;
  };

  const getNovelChapters = (novelId: string) => {
    return allChapters.filter(c => c.novel_id === novelId);
  };

  const getNovelAuthorDetails = (authorId: string) => {
    return allUsers.find(u => u.id === authorId) || null;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col font-sans transition-colors">
      
      {/* Header element */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenMyProfile={() => {
          setProfileTargetUser(currentUser);
          setCurrentView('profile');
        }}
        onOpenDashboard={() => setCurrentView('dashboard')}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenHome={() => {
          setSelectedNovel(null);
          setCurrentView('home');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isMockActive={isUsingMock}
      />

      {/* Auth modal overlay box */}
      {showAuthModal && (
        <Auth
          onSuccess={(usr) => {
            setShowAuthModal(false);
            syncProfile(usr.id).then(() => {
              fetchData();
            });
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* MAIN LAYOUT CANVAS */}
      <div className="flex-1">
        
        {/* VIEW: HOME FEED */}
        {currentView === 'home' && (
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 font-sans">
            
            {/* Hero welcome widget */}
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <span className="text-emerald-700 font-extrabold text-[10px] uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-500/10 mb-4 inline-block shadow-sm">
                বাঙালির প্রাণের সাহিত্য উৎসব
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-850 mb-4 font-serif">
                বাঙালি হৃদয়ের প্রিয় উপন্যাসের মেলবন্ধন
              </h1>
              <p className="text-stone-500 text-sm md:text-md leading-relaxed">
                নভেল ওয়ার্ল্ড (Novel World) এ আপনাকে স্বাগতম। এখানে আপনি নতুন নতুন বাংলা রোমান্টিক, সামাজিক, কল্পবিজ্ঞান বা রহস্য থ্রিলার উপন্যাস পড়তে পারবেন ধীর শান্ত মনে, এবং চাইলে একজন সার্থক লেখক হিসেবে আপনার নিজের উপন্যাসও প্রকাশ করতে পারবেন বিনামূল্যে!
              </p>
            </div>

            {/* IF DEFAULT VIEW (NO SEARCH OR FILTER APPLIED): DISPLAY FEATURED, AUTHORS AND LATEST */}
            {searchQuery === '' && selectedCategory === 'সব উপন্যাস' && (
              <div className="space-y-16 mb-16">
                
                {/* 1. FEATURED NOVELS SECTION */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2.5 h-6 bg-amber-500 rounded-full"></div>
                    <h2 className="text-xl font-extrabold tracking-tight text-stone-850 font-serif">
                      সুপারিশকৃত সেরা উপন্যাস (Featured Series)
                    </h2>
                    <span className="text-[10px] bg-amber-50 text-amber-800 px-2.5 py-0.5 font-bold rounded-full border border-amber-200">
                      সেরা পাঠক পছন্দ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {allNovels.filter(n => n.status === 'approved').slice(0, 3).map((novel) => {
                      const author = getNovelAuthorDetails(novel.author_id);
                      const chaptersCount = getNovelChapters(novel.id).length;
                      const likesCount = getNovelLikesCount(novel.id);

                      return (
                        <div 
                          key={`featured-${novel.id}`}
                          onClick={() => {
                            setSelectedNovel(novel);
                            setCurrentView('reader');
                          }}
                          className="bg-gradient-to-br from-amber-50/20 to-white hover:from-white border border-amber-500/15 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 flex gap-4 group cursor-pointer relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
                          
                          {/* Book cover frame */}
                          <div className="w-20 aspect-[3/4.2] rounded-xl overflow-hidden shadow-md shrink-0 relative">
                            <img 
                              src={novel.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'} 
                              alt={novel.title} 
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                            />
                            <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
                              ★ বিশেষ
                            </span>
                          </div>

                          {/* Info panel */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit">
                                {novel.category}
                              </span>
                              <h3 className="text-md font-bold text-stone-850 mt-1 group-hover:text-emerald-700 transition-colors line-clamp-1 font-serif">
                                {novel.title}
                              </h3>
                              <p className="text-stone-500 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                                {novel.description}
                              </p>
                            </div>

                            {/* Author status line */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/50">
                              <span className="text-[10px] font-bold text-stone-700">
                                @{author?.username || 'লেখক'}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                <span className="font-mono font-bold text-stone-605">{likesCount} Liked</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. POPULAR PATHWAY AUTHORS GRID */}
                <div className="bg-emerald-50/20 rounded-3xl border border-emerald-500/10 p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-6 bg-emerald-600 rounded-full"></div>
                      <h2 className="text-xl font-extrabold text-stone-850 font-serif">
                        জনপ্রিয় গল্পকার ও লেখকবৃন্দ (Popular Authors)
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-emerald-805 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/10">
                      মেধাবী গুণীজন
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allUsers.filter(u => u.role !== 'admin' || u.badge_id).slice(0, 3).map((author) => {
                      const authorBadge = allBadges.find(b => b.id === author.badge_id);
                      const writtenCount = allNovels.filter(n => n.author_id === author.id && n.status === 'approved').length;

                      return (
                        <div 
                          key={`author-${author.id}`}
                          onClick={() => {
                            setProfileTargetUser(author);
                            setCurrentView('profile');
                          }}
                          className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 hover:border-emerald-500/25 group"
                        >
                          <img 
                            src={author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'} 
                            alt={author.username} 
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-full object-cover border-2 border-stone-200 group-hover:border-emerald-500/30 transition-colors shrink-0 shadow-inner"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-bold text-stone-850 group-hover:text-emerald-700 transition-colors truncate">
                                @{author.username}
                              </h4>
                              {authorBadge && <span className="text-xs" title={authorBadge.name}>{authorBadge.icon}</span>}
                            </div>
                            <p className="text-[10px] text-stone-400 truncate mt-0.5">
                              {author.bio || 'অনুপম সাহিত্য প্রেমেই আমার বসবাস।'}
                            </p>
                            <span className="inline-block mt-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-500/10">
                              {writtenCount}টি উপন্যাস সংকলিত
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. LATEST RELEASES */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2.5 h-6 bg-teal-500 rounded-full"></div>
                    <h2 className="text-xl font-extrabold tracking-tight text-stone-850 font-serif">
                      সদ্য যুক্ত হওয়া নতুন উপন্যাস (Latest Novels)
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {allNovels.filter(n => n.status === 'approved').slice(0, 4).map((novel) => {
                      const author = getNovelAuthorDetails(novel.author_id);
                      
                      return (
                        <div 
                          key={`released-${novel.id}`}
                          onClick={() => {
                            setSelectedNovel(novel);
                            setCurrentView('reader');
                          }}
                          className="bg-white rounded-2xl border border-stone-200 p-3 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all cursor-pointer flex gap-3 group"
                        >
                          <img 
                            src={novel.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'} 
                            alt={novel.title} 
                            className="w-14 aspect-[3/4.2] object-cover rounded-xl shadow-inner shrink-0 group-hover:scale-101"
                          />
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="text-xs font-bold text-stone-850 truncate group-hover:text-emerald-700 font-serif">
                                {novel.title}
                              </h4>
                              <p className="text-[9px] text-stone-405 font-medium mt-0.5">{novel.category}</p>
                              <p className="text-stone-500 text-[10px] line-clamp-2 mt-1 leading-relaxed">
                                {novel.description}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold text-stone-400">
                              @{author?.username || 'লেখক'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* FULL LITERARY ARCHIVE / CATALOG GRID */}
            <div className="border-t border-stone-200/60 pt-10">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-850 font-serif">
                    {searchQuery ? `"${searchQuery}" অনুসন্ধানের ফলাফল` : `${selectedCategory} সাহিত্যের মহাফেজখানা`}
                  </h2>
                  <p className="text-stone-400 text-xs mt-1 font-sans">
                    {filteredNovels.length}টি চমৎকার উপন্যাস আপনার পঠন অপেক্ষায় রয়েছে
                  </p>
                </div>
                
                <div className="text-[10px] font-mono text-stone-400 border border-stone-200 bg-stone-50 p-1.5 rounded-xl px-3 uppercase tracking-wider">
                  মহামিলন • {filteredNovels.length} approved series
                </div>
              </div>

              {/* Render Books grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredNovels.length === 0 ? (
                  <div className="col-span-full text-center py-24 bg-white border border-stone-200 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
                    <BookOpen className="w-12 h-12 text-emerald-600 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-stone-850 mb-1 font-serif">
                      কোনো রাজকীয় উপন্যাস মেলেনি
                    </h3>
                    <p className="text-stone-500 text-xs mb-6">
                      আপনার নির্বাচিত বিভাগ অথবা অনুসন্ধান তালিকার সাথে মেলে এমন কোনো উপন্যাস বর্তমানে অনুমোদিত নেই।
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('সব উপন্যাস');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
                    >
                      সব উপন্যাস দেখতে ফিরে যান
                    </button>
                  </div>
                ) : (
                  filteredNovels.map((novel) => {
                    const author = getNovelAuthorDetails(novel.author_id);
                    const chaptersCount = getNovelChapters(novel.id).length;
                    const likesCount = getNovelLikesCount(novel.id);
                    
                    return (
                      <div 
                        key={novel.id}
                        onClick={() => {
                          setSelectedNovel(novel);
                          setCurrentView('reader');
                        }}
                        className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-emerald-500/20 transition-all duration-300 flex flex-col group overflow-hidden cursor-pointer h-full"
                      >
                        
                        {/* Cover Photo block */}
                        <div className="relative aspect-[3/4.2] overflow-hidden bg-stone-105 shrink-0">
                          <img
                            src={novel.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'}
                            alt={novel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent"></div>
                          
                          {/* Ribbon Category banner */}
                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-[#0e3b1c] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            {novel.category}
                          </span>

                          {/* Chapters count pill on bottom */}
                          <div className="absolute bottom-3 right-3 bg-emerald-750/90 bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            <span>{chaptersCount} পরিচ্ছেদ</span>
                          </div>
                        </div>

                        {/* Content panel */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-stone-850 group-hover:text-emerald-700 transition-colors line-clamp-1 font-serif">
                              {novel.title}
                            </h3>
                            <p className="text-stone-500 text-xs line-clamp-3 mt-1.5 leading-relaxed font-sans">
                              {novel.description}
                            </p>
                          </div>

                          {/* Author info footer on the novel card */}
                          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-stone-100">
                            
                            {/* Profile thumbnail */}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (author) {
                                  setProfileTargetUser(author);
                                  setCurrentView('profile');
                                }
                              }}
                              className="flex items-center gap-2 hover:bg-stone-50/80 p-0.5 rounded-lg transition-all"
                              title="লেখকের প্রোফাইল দেখুন"
                            >
                              <img
                                src={author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                                alt={author?.username || 'user'}
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-full object-cover border border-stone-200"
                              />
                              <span className="text-[11px] font-semibold text-stone-700 max-w-[90px] truncate">
                                @{author?.username || 'লেখক'}
                              </span>
                            </div>

                            {/* Likes count stats widget */}
                            <div className="flex items-center gap-1 text-xs text-stone-400">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                              <span className="font-mono text-[11px] font-bold text-stone-500">{likesCount}</span>
                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </main>
        )}

        {/* VIEW: NOVEL READER / DETAIL */}
        {currentView === 'reader' && selectedNovel && (
          <NovelReader
            novel={selectedNovel}
            author={getNovelAuthorDetails(selectedNovel.author_id)}
            chapters={getNovelChapters(selectedNovel.id)}
            currentUser={currentUser}
            onBack={() => {
              setSelectedNovel(null);
              fetchData();
              setCurrentView('home');
            }}
            onRefreshLikesBookmarks={() => {
              fetchData();
              refreshActiveLikesBookmarks();
            }}
            liked={isLiked}
            bookmarked={isBookmarked}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            allUsers={allUsers}
          />
        )}

        {/* VIEW: CREATOR DASHBOARD */}
        {currentView === 'dashboard' && currentUser && (
          <CreatorDashboard
            currentUser={currentUser}
            myNovels={allNovels.filter(n => n.author_id === currentUser.id)}
            onRefreshNovels={fetchData}
            onSelectNovelToRead={(nov) => {
              setSelectedNovel(nov);
              setCurrentView('reader');
            }}
            allChapters={allChapters}
            isMockActive={isUsingMock}
          />
        )}

        {/* VIEW: ADMIN PANEL */}
        {currentView === 'admin' && currentUser && currentUser.role === 'admin' && (
          <AdminPanel
            currentUser={currentUser}
            allNovels={allNovels}
            allUsers={allUsers}
            onRefreshData={fetchData}
          />
        )}

        {/* VIEW: USER PROFILE */}
        {currentView === 'profile' && profileTargetUser && (
          <UserProfile
            profileUser={profileTargetUser}
            currentUser={currentUser}
            userNovels={allNovels.filter(n => n.author_id === profileTargetUser.id && (n.status === 'approved' || (currentUser && currentUser.id === profileTargetUser.id)))}
            bookmarkedNovels={allNovels.filter(n => 
              allBookmarks.some(b => b.novel_id === n.id && b.user_id === profileTargetUser.id)
            )}
            badges={allBadges}
            onProfileUpdated={() => {
              fetchData();
              // Sync current users targets too
              const updatedTarget = allUsers.find(u => u.id === profileTargetUser.id);
              if (updatedTarget) setProfileTargetUser(updatedTarget);
            }}
            onSelectNovelToRead={(nov) => {
              setSelectedNovel(nov);
              setCurrentView('reader');
            }}
          />
        )}

      </div>

      {/* Unified footer strip */}
      <footer className="bg-stone-100 border-t border-stone-200/50 py-12 mt-20 font-sans">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-lg font-bold text-emerald-700 font-sans tracking-tight block mb-2">নভেল ওয়ার্ল্ড</span>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm">
              বাঙালির নিজস্ব স্বকীয় সাহিত্য ও সংস্কৃতি বিশ্ব দরবারে তুলে ধরতে আমাদের পথচলা। নতুন লেখকদের সৃজনশীল প্রতিভা বিকাশের নির্ভরযোগ্য ঠিকানা।
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">সাহিত্যিক বিভাগসমূহ</h5>
            <ul className="text-xs text-stone-600 space-y-2">
              <li>• রোমান্টিক উপন্যাস ও সামাজিক কাহিনী</li>
              <li>• মহাজাগতিক এলিয়েন ও বৈজ্ঞানিক কল্পকাহিনী</li>
              <li>• রোমাঞ্চকর রহস্যজট ও প্যারানরমাল থ্রিলার</li>
              <li>• চিরন্তন পল্লী সাহিত্য ও ঐতিহাসিক ক্লাসিক</li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">যোগাযোগ ও নিয়মাবলী</h5>
            <p className="text-xs text-stone-605 leading-relaxed">
              স্বত্বাধিকার © {new Date().getFullYear()} Novel World। সর্বস্বত্ব সংরক্ষিত। প্ল্যাটফর্মের সমস্ত লেখার দায়িত্ত্ব লেখক কর্তৃক সংরক্ষিত। কোনো অংশ বিনা অনুমতিতে ব্যবহার দণ্ডনীয় অপরাধ।
            </p>
            <div className="mt-4 flex gap-4 text-xs font-semibold text-emerald-700">
              <a href="#" className="hover:underline">শর্তাবলী</a>
              <span>•</span>
              <a href="#" className="hover:underline">গোপনীয়তা নীতি</a>
              <span>•</span>
              <a href="#" className="hover:underline">সহযোগিতা</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
