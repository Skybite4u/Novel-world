/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User as UserType, Novel, Badge, Bookmark } from '../types';
import { Award, BookOpen, Edit, FileText, Heart, Shield, Sparkles, User, UserCheck } from 'lucide-react';

interface UserProfileProps {
  profileUser: UserType;
  currentUser: UserType | null;
  userNovels: Novel[];
  bookmarkedNovels: Novel[];
  badges: Badge[];
  onProfileUpdated: () => void;
  onSelectNovelToRead: (novel: Novel) => void;
}

export default function UserProfile({
  profileUser,
  currentUser,
  userNovels,
  bookmarkedNovels,
  badges,
  onProfileUpdated,
  onSelectNovelToRead
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(profileUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profileUser.avatar_url || '');
  const [username, setUsername] = useState(profileUser.username || '');
  const [updating, setUpdating] = useState(false);
  const [profileTab, setProfileTab] = useState<'my_writings' | 'my_reading_list'>('my_writings');

  const usersBadge = badges.find(b => b.id === profileUser.badge_id);
  const isOwnProfile = currentUser && currentUser.id === profileUser.id;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    // Reject updates on the client side if not the owner or an admin
    if (!currentUser || (currentUser.id !== profileUser.id && currentUser.role !== 'admin')) {
      alert('আপনার এই প্রোফাইল তথ্য পরিবর্তন করার অধিকার নেই।');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .eq('id', profileUser.id)
        .update({
          username: username.toLowerCase().trim().replace(/\s+/g, '_'),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim()
        });

      if (error) throw error;
      setIsEditing(false);
      onProfileUpdated();
    } catch (err: any) {
      alert(err.message || 'প্রোফাইল তথ্য আপডেট করা সম্ভব হয়নি।');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      
      {/* Profile banner block */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-2xl pointer-events-none"></div>
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <h3 className="text-lg font-bold border-b border-stone-100 dark:border-stone-850 pb-2">প্রোফাইল তথ্য সংশোধন করুন</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  ইউনিক ইউজার নেম (@username)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. niloy_chow"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  প্রোফাইল ছবি বা অবতার লিঙ্ক
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                নিজের সংক্ষিপ্ত বায়ো বা বিবরণী
              </label>
              <textarea
                rows={3}
                placeholder="আপনার পাঠক ও লেখ বন্ধুদের জন্য কিছু বলুন..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-250 dark:bg-stone-800 text-stone-750 dark:text-stone-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {updating ? 'আপডেট হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-center text-center md:text-left justify-between">
            
            <div className="flex flex-col md:flex-row gap-5 items-center">
              <img
                src={profileUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                alt={profileUser.username}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/20 shadow"
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h3 className="text-2xl font-extrabold text-stone-850 dark:text-stone-100">
                    @{profileUser.username}
                  </h3>
                  {profileUser.role === 'admin' && (
                    <span className="bg-rose-100 dark:bg-rose-955 text-rose-800 dark:text-rose-300 px-2 py-0.5 text-[9px] font-black rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" /> ADMIN
                    </span>
                  )}
                  {profileUser.role !== 'admin' && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-black rounded-full flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> MEMBER
                    </span>
                  )}
                </div>

                <p className="text-stone-605 dark:text-stone-400 text-sm max-w-md font-sans">
                  {profileUser.bio || 'সাহিত্য এবং উপন্যাসের প্রেমেই আমার বসবাস। নভেল ওয়ার্ল্ডের একজন সুহৃদ সদস্য।'}
                </p>

                {usersBadge && (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 px-3 rounded-full border border-emerald-250/30 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    <span className="text-base">{usersBadge.icon}</span>
                    <span>{usersBadge.name}</span>
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-stone-105 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-750 dark:text-stone-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-stone-200 dark:border-stone-700"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>প্রোফাইল এডিট করুন</span>
              </button>
            )}

          </div>
        )}
      </div>

      {/* Tabs selectors inside user profile */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 mb-6 font-semibold overflow-x-auto gap-2">
        <button
          onClick={() => setProfileTab('my_writings')}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer ${
            profileTab === 'my_writings'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          {isOwnProfile ? 'আমার প্রকাশিত উপন্যাসসমূহ' : `@${profileUser.username}-এর সাহিত্যসম্ভার`}
        </button>
        <button
          onClick={() => setProfileTab('my_reading_list')}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer ${
            profileTab === 'my_reading_list'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          {isOwnProfile ? 'আমার বুকমার্ক বা পড়ার তালিকা' : `@${profileUser.username}-এর প্রিয় তালিকা`}
        </button>
      </div>

      {/* Content Rendering list */}
      {profileTab === 'my_writings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userNovels.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-stone-500/5 rounded-2xl">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500">এখনও কোনো উপন্যাস তালিকাভুক্ত করেননি।</p>
            </div>
          ) : (
            userNovels.map((nov) => (
              <div 
                key={nov.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl flex gap-3 shadow-inner hover:shadow transition-all cursor-pointer"
                onClick={() => onSelectNovelToRead(nov)}
              >
                <img
                  src={nov.cover_image}
                  alt={nov.title}
                  className="w-16 md:w-20 aspect-[2/3] object-cover rounded-lg shadow shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-0.5 rounded-full">
                      {nov.category}
                    </span>
                    <h4 className="text-sm font-bold mt-2 text-stone-850 dark:text-stone-100 line-clamp-1">
                      {nov.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                      {nov.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-2 font-mono">
                    যুক্ত হয়েছে: {new Date(nov.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {profileTab === 'my_reading_list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarkedNovels.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-stone-500/5 rounded-2xl">
              <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500">বুকমার্ক তালিকায় কোনো উপন্যাস রাখা হয়নি!</p>
            </div>
          ) : (
            bookmarkedNovels.map((nov) => (
              <div 
                key={nov.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl flex gap-3 shadow-inner hover:shadow transition-all cursor-pointer"
                onClick={() => onSelectNovelToRead(nov)}
              >
                <img
                  src={nov.cover_image}
                  alt={nov.title}
                  className="w-16 md:w-20 aspect-[2/3] object-cover rounded-lg shadow shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-0.5 rounded-full">
                      {nov.category}
                    </span>
                    <h4 className="text-sm font-bold mt-2 text-stone-850 dark:text-stone-100 line-clamp-1">
                      {nov.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                      {nov.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-2 font-mono">
                    পড়া শুরু করুন ➔
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
