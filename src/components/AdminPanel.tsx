/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Novel, User as UserType, Badge, Chapter, Comment } from '../types';
import { 
  Shield, Check, X, Award, AlertCircle, Users, BookOpen, Clock, Heart, 
  Trash2, MessageSquare, Search, FileText, ChevronDown, ChevronUp, Eye, Sparkles 
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: UserType;
  allNovels: Novel[];
  allUsers: UserType[];
  onRefreshData: () => void;
}

export default function AdminPanel({
  currentUser,
  allNovels,
  allUsers,
  onRefreshData
}: AdminPanelProps) {
  // Rigorous defense-in-depth security guard for the admin layout
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-3xl text-center shadow-md animate-fade-in">
        <AlertCircle className="w-12 h-12 text-rose-600 dark:text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2 font-serif">প্রবেশাধিকার সংরক্ষিত / Access Denied</h3>
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
          আপনার এই পৃষ্ঠাটি দেখার বা কোনো পরিবর্তন করার অধিকার নেই। কেবল সিস্টেম প্রশাসকদের (Admin) এই পোর্টালে প্রবেশের অনুমতি রয়েছে।
        </p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'pending_novels' | 'user_badges' | 'content_moderation' | 'comments_moderation'>('pending_novels');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  
  // Admin search states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [novelSearchQuery, setNovelSearchQuery] = useState('');
  const [commentSearchQuery, setCommentSearchQuery] = useState('');

  // Expand states for nesting chapters in novels table
  const [expandedNovelId, setExpandedNovelId] = useState<string | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load badges, chapters and comments
  const fetchBadges = async () => {
    const { data, error } = await supabase.from('badges').select('*');
    if (!error && data) {
      setBadges(data);
    }
  };

  const fetchChaptersAndComments = async () => {
    try {
      const { data: chData } = await supabase.from('chapters').select('*').order('chapter_number', { ascending: true });
      if (chData) setAllChapters(chData);

      const { data: coData } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
      if (coData) setAllComments(coData);
    } catch (e) {
      console.error('Error fetching admin data: ', e);
    }
  };

  useEffect(() => {
    fetchBadges();
    fetchChaptersAndComments();
  }, [allNovels]); // Refresh nested values when main novel database refreshes

  const handleNovelStatus = async (novelId: string, status: 'approved' | 'rejected') => {
    setLoadingAction(novelId);
    setSuccessMessage(null);
    try {
      const { error } = await supabase
        .from('novels')
        .eq('id', novelId)
        .update({ status });

      if (error) throw error;
      setSuccessMessage(`উপন্যাসটি সফলভাবে ${status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} করা হয়েছে।`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAssignBadge = async (userId: string, badgeId: string | null) => {
    setLoadingAction(userId);
    setSuccessMessage(null);
    try {
      const { error } = await supabase
        .from('users')
        .eq('id', userId)
        .update({ badge_id: badgeId || null });

      if (error) throw error;
      setSuccessMessage(`ব্যবহারকারীকে সফলভাবে ব্যাজ অর্পণ করা হয়েছে।`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'ব্যাজ প্রদান করতে সমস্যা হয়েছে।');
    } finally {
      setLoadingAction(userId);
    }
  };

  // Content moderation actions
  const handleDeleteNovel = async (novelId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই উপন্যাসটি এবং এর সাথে সম্পর্কিত সমস্ত পরিচ্ছেদ ও মন্তব্য মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
    setLoadingAction(novelId);
    setSuccessMessage(null);
    try {
      // 1. Delete associated comments
      await supabase.from('comments').delete().eq('novel_id', novelId);
      // 2. Delete associated chapters
      await supabase.from('chapters').delete().eq('novel_id', novelId);
      // 3. Delete associated bookmarks
      await supabase.from('bookmarks').delete().eq('novel_id', novelId);
      // 4. Delete associated likes
      await supabase.from('likes').delete().eq('novel_id', novelId);
      // 5. Delete novel itself
      const { error } = await supabase.from('novels').delete().eq('id', novelId);

      if (error) throw error;
      setSuccessMessage('অনুপযুক্ত উপন্যাসটি ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলা হয়েছে।');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'উপন্যাসটি মুছে ফেলা সম্ভব হয়নি।');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই পরিচ্ছেদটি মুছে ফেলতে চান?')) return;
    setLoadingAction(chapterId);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
      if (error) throw error;
      setSuccessMessage('অনুপযুক্ত পরিচ্ছেদটি সফলভাবে মুছে ফেলা হয়েছে।');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'পরিচ্ছেদটি মুছে ফেলা সম্ভব হয়নি।');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই মন্তব্যটি মুছে ফেলতে চান?')) return;
    setLoadingAction(commentId);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      setSuccessMessage('অনুপযুক্ত মন্তব্যটি সফলভাবে ডিলিট করা হয়েছে।');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'মন্তব্যটি ডিলিট করতে সমস্যা হয়েছে।');
    } finally {
      setLoadingAction(null);
    }
  };

  const pendingNovels = allNovels.filter(n => n.status === 'pending');
  const approvedNovels = allNovels.filter(n => n.status === 'approved');

  const getAuthorName = (authorId: string) => {
    const usr = allUsers.find(u => u.id === authorId);
    return usr ? usr.username : 'অজানা লেখক';
  };

  const getUserDetails = (userId: string) => {
    return allUsers.find(u => u.id === userId);
  };

  const getNovelTitle = (novelId: string) => {
    const nov = allNovels.find(n => n.id === novelId);
    return nov ? nov.title : 'অজানা উপন্যাস';
  };

  // User search logic
  const filteredUsers = allUsers.filter(usr => {
    const cleanSearch = userSearchQuery.toLowerCase();
    return (
      usr.username.toLowerCase().includes(cleanSearch) ||
      (usr.email && usr.email.toLowerCase().includes(cleanSearch)) ||
      (usr.bio && usr.bio.toLowerCase().includes(cleanSearch))
    );
  });

  // Novel moderation search filter (applies to both dynamic lists)
  const filteredNovelsModeration = allNovels.filter(nov => {
    const cleanSearch = novelSearchQuery.toLowerCase();
    const author = getAuthorName(nov.author_id).toLowerCase();
    return (
      nov.title.toLowerCase().includes(cleanSearch) ||
      nov.category.toLowerCase().includes(cleanSearch) ||
      nov.description.toLowerCase().includes(cleanSearch) ||
      author.includes(cleanSearch)
    );
  });

  // Comment moderation search filter
  const filteredComments = allComments.filter(comment => {
    const cleanSearch = commentSearchQuery.toLowerCase();
    const commentUser = getUserDetails(comment.user_id);
    const authorName = commentUser ? commentUser.username.toLowerCase() : '';
    const novelTitle = getNovelTitle(comment.novel_id).toLowerCase();
    return (
      comment.comment_text.toLowerCase().includes(cleanSearch) ||
      authorName.includes(cleanSearch) ||
      novelTitle.includes(cleanSearch)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      
      {/* Admin header card */}
      <div className="bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>সিস্টেম নিয়ন্ত্রক (System Controller)</span>
          </div>
          <h2 className="text-2xl font-extrabold text-stone-850 dark:text-stone-105 font-serif">
            অ্যাডমিনিস্ট্রেটর পোর্টাল
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
            আপনি সম্পূর্ণ ক্ষমতাশালী এডমিন। উপন্যাস অনুমোদন বা প্রত্যাখ্যান, অনুপযুক্ত কন্টেন্ট মুছে ফেলা এবং সাধারণ ব্যবহারকারীদের অনন্য সাহিত্যিক ব্যাজ প্রদান করতে পারেন।
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="bg-rose-500/10 p-2.5 px-4 rounded-2xl text-center shadow-sm">
            <span className="block text-lg font-black text-rose-600 dark:text-rose-400">{pendingNovels.length}</span>
            <span className="text-[9px] uppercase font-bold text-stone-500">অনুমোদন অপেক্ষারত</span>
          </div>
          <div className="bg-emerald-500/10 p-2.5 px-4 rounded-2xl text-center shadow-sm">
            <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">{approvedNovels.length}</span>
            <span className="text-[9px] uppercase font-bold text-stone-500">অনুমোদিত উপন্যাস</span>
          </div>
          <div className="bg-stone-500/10 p-2.5 px-4 rounded-2xl text-center shadow-sm">
            <span className="block text-lg font-black text-stone-700 dark:text-stone-300">{allUsers.length}</span>
            <span className="text-[9px] uppercase font-bold text-stone-500">মোট সদস্য</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-between text-xs border border-emerald-100 dark:border-emerald-900/30 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-stone-400 hover:text-stone-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Tabs list Switches */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 mb-6 font-semibold overflow-x-auto gap-2">
        <button
          onClick={() => { setActiveTab('pending_novels'); setSuccessMessage(null); }}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer transition-all ${
            activeTab === 'pending_novels'
              ? 'text-rose-700 dark:text-rose-405 border-b-2 border-rose-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          অপেক্ষমাণ উপন্যাস কিউ ({pendingNovels.length})
        </button>
        <button
          onClick={() => { setActiveTab('content_moderation'); setSuccessMessage(null); }}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer transition-all ${
            activeTab === 'content_moderation'
              ? 'text-rose-700 dark:text-rose-405 border-b-2 border-rose-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          উপন্যাস ও পরিচ্ছেদ মডারেশন
        </button>
        <button
          onClick={() => { setActiveTab('user_badges'); setSuccessMessage(null); }}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer transition-all ${
            activeTab === 'user_badges'
              ? 'text-rose-700 dark:text-rose-405 border-b-2 border-rose-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          সদস্যদের ব্যাজ ও মেডেল বিতরণ
        </button>
        <button
          onClick={() => { setActiveTab('comments_moderation'); setSuccessMessage(null); }}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer transition-all ${
            activeTab === 'comments_moderation'
              ? 'text-rose-700 dark:text-rose-405 border-b-2 border-rose-500'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          মন্তব্য মডারেশন ({allComments.length})
        </button>
      </div>

      {/* RENDER PENDING NOVELS TAB */}
      {activeTab === 'pending_novels' && (
        <div className="space-y-4">
          {pendingNovels.length === 0 ? (
            <div className="text-center py-16 bg-stone-500/5 border border-stone-150 dark:border-stone-850 rounded-2xl">
              <Clock className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-500">অনুমোদনের অপেক্ষায় কোনো উপন্যাস বাকি নেই!</p>
              <p className="text-xs text-stone-400">এই মূহুর্তে সমস্ত উপন্যাস সুন্দরভাবে সংশোধিত ও অনুমোদিত রয়েছে।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingNovels.map((nov) => (
                <div 
                  key={nov.id} 
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl flex gap-3.5 shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={nov.cover_image}
                    alt={nov.title}
                    referrerPolicy="no-referrer"
                    className="w-20 md:w-24 aspect-[2/3] object-cover rounded-xl shadow shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                          {nov.category}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(nov.created_at).toLocaleDateString('bn-BD')}
                        </span>
                      </div>

                      <h4 className="text-md font-bold mt-2 text-stone-850 dark:text-stone-100 font-serif">
                        {nov.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1">
                        {nov.description}
                      </p>
                      
                      <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium mt-1">
                        লেখক: @{getAuthorName(nov.author_id)}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4 pt-2 border-t border-stone-100 dark:border-stone-850 border-dashed">
                      <button
                        onClick={() => handleNovelStatus(nov.id, 'approved')}
                        disabled={loadingAction === nov.id}
                        className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 group"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>যাচাই ও অনুমোদন দিন</span>
                      </button>
                      <button
                        onClick={() => handleNovelStatus(nov.id, 'rejected')}
                        disabled={loadingAction === nov.id}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-350 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                        title="প্রত্যাখ্যান করুন"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER CONTENT MODERATION TAB (NOVELS & CHAPTERS) */}
      {activeTab === 'content_moderation' && (
        <div className="space-y-6">
          {/* Search bar input */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="উপন্যাসের নাম বা লেখক সার্চ করুন..."
              value={novelSearchQuery}
              onChange={(e) => setNovelSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-150 dark:border-stone-850 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="text-md font-bold">সাহিত্য সমগ্র ও পরিচ্ছেদ সংশোধন প্যানেল</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700 dark:text-stone-350">
                <thead className="bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-500 uppercase border-b border-stone-200 dark:border-stone-705">
                  <tr>
                    <th className="p-3">উপন্যাস</th>
                    <th className="p-3">লেখক</th>
                    <th className="p-3">বিভাগ</th>
                    <th className="p-3">অবস্থা (Status)</th>
                    <th className="p-3">পরিচ্ছেদ সংখ্যা</th>
                    <th className="p-3 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredNovelsModeration.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        কোনো উপন্যাস পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredNovelsModeration.map((nov) => {
                      const chapCount = allChapters.filter(c => c.novel_id === nov.id).length;
                      const isExpanded = expandedNovelId === nov.id;
                      return (
                        <React.Fragment key={nov.id}>
                          <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-all">
                            <td className="p-3 flex items-center gap-2.5">
                              <img
                                src={nov.cover_image}
                                alt={nov.title}
                                referrerPolicy="no-referrer"
                                className="w-9 h-12 object-cover rounded shadow"
                              />
                              <div>
                                <span className="block font-bold text-stone-850 dark:text-stone-100 line-clamp-1">{nov.title}</span>
                                <span className="text-[10px] text-stone-400">{new Date(nov.created_at).toLocaleDateString('bn-BD')}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-xs">@{getAuthorName(nov.author_id)}</span>
                            </td>
                            <td className="p-3 font-medium text-xs">{nov.category}</td>
                            <td className="p-3 text-xs">
                              {nov.status === 'approved' ? (
                                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">Approved</span>
                              ) : nov.status === 'pending' ? (
                                <span className="text-[10px] font-bold text-amber-805 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">Pending</span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">Rejected</span>
                              )}
                            </td>
                            <td className="p-3 text-xs font-mono font-bold text-center">
                              {chapCount}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setExpandedNovelId(isExpanded ? null : nov.id)}
                                  className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer font-semibold"
                                  title="পরিচ্ছেদসমূহ দেখুন"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  <span>পর্বসমূহ</span>
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteNovel(nov.id)}
                                  disabled={loadingAction === nov.id}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 hover:text-rose-850 dark:text-rose-300 rounded-lg cursor-pointer"
                                  title="মহাডিলিট (সম্পূর্ণ উপন্যাস মুছে ফেলুন)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Nested Chapters List */}
                          {isExpanded && (
                            <tr className="bg-stone-50/70 dark:bg-stone-950/20">
                              <td colSpan={6} className="p-4 pl-12 border-t border-b border-stone-100 dark:border-stone-850">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                                    <h4 className="text-xs font-black text-rose-800 dark:text-rose-455 flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                                      <span>পাণ্ডুলিপি ও পর্ব সংশোধন: {nov.title}</span>
                                    </h4>
                                    <span className="text-[10px] text-stone-400">মোট পরিচ্ছেদ: {chapCount}টি</span>
                                  </div>

                                  {allChapters.filter(c => c.novel_id === nov.id).length === 0 ? (
                                    <p className="text-xs text-stone-400 italic">এই উপন্যাসে কোনো পরিচ্ছেদ যুক্ত করা হয়নি।</p>
                                  ) : (
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                                      {allChapters.filter(c => c.novel_id === nov.id).map((chap) => (
                                        <div 
                                          key={chap.id}
                                          className="p-2 px-3 bg-white dark:bg-stone-900 border border-stone-250/50 dark:border-stone-800 rounded-xl flex justify-between items-center text-xs shadow-sm"
                                        >
                                          <div>
                                            <span className="font-bold text-emerald-800 dark:text-emerald-400 mr-2">পর্ব {chap.chapter_number}:</span>
                                            <span className="font-semibold text-stone-850 dark:text-stone-105">{chap.title}</span>
                                            <p className="text-[10px] text-stone-400 mt-1 line-clamp-1 max-w-xl">{chap.content}</p>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteChapter(chap.id)}
                                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded-lg transition-all"
                                            title="পরিচ্ছেদ ডিলিট করুন"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER USER BADGES TAB */}
      {activeTab === 'user_badges' && (
        <div className="space-y-6">
          {/* Search dynamic users bar */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ইউজারনেম বা ইমেইল দিয়ে সার্চ করুন..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="text-md font-bold">প্ল্যাটফর্ম সদস্যদের তালিকা ও ভূমিকা</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700 dark:text-stone-350">
                <thead className="bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-500 uppercase border-b border-stone-200 dark:border-stone-705">
                  <tr>
                    <th className="p-3">ইউজার প্রোফাইল</th>
                    <th className="p-3">ইমেইল</th>
                    <th className="p-3">ভূমিকা / Role</th>
                    <th className="p-3">অর্পিত ব্যাজ (Medal)</th>
                    <th className="p-3 text-right">ব্যাজ অর্পণ করুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-stone-400">
                        অনুসন্ধানের সাথে কোনো ব্যবহারকারী মেলেনি।
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => {
                      const currentBadge = badges.find(b => b.id === usr.badge_id);
                      return (
                        <tr key={usr.id} className="hover:bg-stone-500/5 transition-all">
                          <td className="p-3 flex items-center gap-2.5">
                            <img
                              src={usr.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                              alt="avatar"
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-stone-200 shadow-inner shrink-0"
                            />
                            <div>
                              <span className="block font-bold text-stone-800 dark:text-stone-100">@{usr.username}</span>
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 line-clamp-1">{usr.bio || 'কোনো পরিচিতি নেই।'}</span>
                            </div>
                          </td>

                          <td className="p-3 text-xs font-mono">{usr.email}</td>

                          <td className="p-3">
                            {usr.role === 'admin' ? (
                              <span className="bg-rose-100 dark:bg-rose-955 text-rose-800 dark:text-rose-300 px-2.5 py-0.5 text-[10px] font-black rounded-full shadow-sm">ADMIN</span>
                            ) : (
                              <span className="bg-emerald-105 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-black rounded-full shadow-sm">USER</span>
                            )}
                          </td>

                          <td className="p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {currentBadge ? (
                              <div className="flex items-center gap-1.5 p-1 px-2.5 border border-emerald-500/10 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl w-max shadow-sm" title={currentBadge.description}>
                                <span className="text-base leading-none">{currentBadge.icon}</span>
                                <span>{currentBadge.name}</span>
                              </div>
                            ) : (
                              <span className="text-stone-405 font-medium italic">কোনো ব্যাজ নেই</span>
                            )}
                          </td>

                          {/* Dropdown to give badges */}
                          <td className="p-3 text-right animate-fade-in">
                            <select
                              disabled={usr.role === 'admin' && usr.id !== currentUser.id}
                              value={usr.badge_id || ''}
                              onChange={(e) => handleAssignBadge(usr.id, e.target.value || null)}
                              className="text-xs bg-stone-50 dark:bg-stone-850 p-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/25 cursor-pointer font-semibold shadow-sm hover:border-stone-300"
                            >
                              <option value="">-- ব্যাজ বাতিল করুন --</option>
                              {badges.map((bdg) => (
                                <option key={bdg.id} value={bdg.id}>
                                  {bdg.icon} {bdg.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Badges Guideline Legend Info block */}
            <div className="mt-8 p-4 bg-amber-50/40 dark:bg-stone-950/30 border border-amber-500/10 rounded-2xl">
              <span className="text-xs font-extrabold text-amber-850 dark:text-amber-400 flex items-center gap-1 mb-2">
                <Award className="w-4 h-4" /> ব্যাজ সংক্রান্ত নির্দেশিকা (Admin Information)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {badges.map((b) => (
                  <div key={b.id} className="p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
                    <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      <span>{b.icon}</span>
                      <span className="truncate">{b.name}</span>
                    </span>
                    <p className="text-[10px] text-stone-400 mt-1">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER COMMENTS MODERATION TAB */}
      {activeTab === 'comments_moderation' && (
        <div className="space-y-6">
          {/* Search bar comment text */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-450">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="মন্তব্য বা সদস্যের নাম সার্চ করুন..."
              value={commentSearchQuery}
              onChange={(e) => setCommentSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="text-md font-bold">পাঠকদের মন্তব্য মডারেশন</h3>
            </div>

            <div className="space-y-4">
              {filteredComments.length === 0 ? (
                <div className="text-center py-12 text-stone-400 italic">
                  কোনো মন্তব্য পাওয়া যায়নি।
                </div>
              ) : (
                filteredComments.map((comment) => {
                  const commUser = getUserDetails(comment.user_id);
                  const relatedNovelTitle = getNovelTitle(comment.novel_id);
                  
                  return (
                    <div 
                      key={comment.id}
                      className="p-4 bg-stone-50 dark:bg-stone-955/20 border border-stone-200 dark:border-stone-800 rounded-2xl flex md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={commUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                          alt="avatar"
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-stone-200 bg-white"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-stone-800 dark:text-stone-150">@{commUser ? commUser.username : 'অজানা সদস্য'}</span>
                            <span className="text-[10px] text-stone-400 font-medium">মন্তব্য করেছেন</span>
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                              {relatedNovelTitle}
                            </span>
                          </div>
                          
                          <p className="text-xs text-stone-702 text-stone-700 dark:text-stone-300 mt-1 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-100 dark:border-stone-850">
                            {comment.comment_text}
                          </p>

                          <span className="text-[9px] text-stone-400 font-mono mt-1.5 block">
                            তারিখ: {new Date(comment.created_at).toLocaleString('bn-BD')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={loadingAction === comment.id}
                        className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer self-start md:self-center shrink-0 transition-opacity"
                        title="মন্তব্য মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
