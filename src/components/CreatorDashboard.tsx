/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Novel, Chapter, User as UserType } from '../types';
import { 
  Sparkles, FileText, Plus, BookOpen, Eye, AlertCircle, Edit, ListOrdered, Check,
  ChevronDown, BookMarked, Layers, Trash2, ArrowUpRight, Upload, Save, FileCheck
} from 'lucide-react';

interface CreatorDashboardProps {
  currentUser: UserType;
  myNovels: Novel[];
  onRefreshNovels: () => void;
  onSelectNovelToRead: (novel: Novel) => void;
  allChapters: Chapter[];
  isMockActive: boolean;
}

const COVER_PRESETS = [
  { name: 'কাব্যিক নীল', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80' },
  { name: 'সবুজ অরণ্য', url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80' },
  { name: 'মহাজাগতিক নক্ষত্র', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80' },
  { name: 'পুরনো পাণ্ডুলিপি', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80' },
  { name: 'নদী ও জলপ্রপাত', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' }
];

const CATEGORIES = [
  'রোমান্টিক ও নাটক',
  'কল্পবিজ্ঞান ও রহস্য',
  'সামাজিক ও জীবনমুখী',
  'ভৌতিক ও হরর',
  'ঐতিহাসিক ও ক্লাসিক'
];

export default function CreatorDashboard({
  currentUser,
  myNovels,
  onRefreshNovels,
  onSelectNovelToRead,
  allChapters,
  isMockActive
}: CreatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'my_books' | 'create_book' | 'add_chapter'>('my_books');
  
  // Create novel form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [coverImage, setCoverImage] = useState(COVER_PRESETS[0].url);
  const [customCover, setCustomCover] = useState('');
  const [submittingNovel, setSubmittingNovel] = useState(false);
  const [novelMsg, setNovelMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Cover uploading states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Local drafts list
  const [localDrafts, setLocalDrafts] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('novel_world_local_drafts') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Local chapter draft state
  const [chapterDraft, setChapterDraft] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('novel_world_local_chapter_draft') || 'null');
    } catch (e) {
      return null;
    }
  });

  // Edit novel states
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);

  // Create chapter form state
  const [selectedNovelId, setSelectedNovelId] = useState('');
  const [chapterNo, setChapterNo] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [submittingChapter, setSubmittingChapter] = useState(false);
  const [chapterMsg, setChapterMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Deleting novel state
  const [novelToDelete, setNovelToDelete] = useState<string | null>(null);

  // Form Validators
  const validateNovelForm = (t: string, desc: string, img: string): string | null => {
    const trimmedTitle = t.trim();
    if (!trimmedTitle) {
      return 'উপন্যাসের শিরোনাম দেওয়া আবশ্যক।';
    }
    if (trimmedTitle.length < 3) {
      return 'উপন্যাসের শিরোনাম অত্যন্ত সংক্ষিপ্ত। কমপক্ষে ৩টি অক্ষর দিন।';
    }
    if (trimmedTitle.length > 100) {
      return 'উপন্যাসের শিরোনামটি সর্বোচ্চ ১০০ অক্ষরের মধ্যে লিমিট রাখুন।';
    }

    const trimmedDesc = desc.trim();
    if (!trimmedDesc) {
      return 'উপন্যাসের সংক্ষিপ্ত পটভূমি বা বিবরণী দেওয়া আবশ্যক।';
    }
    if (trimmedDesc.length < 20) {
      return 'বিবরণটি অত্যন্ত সংক্ষিপ্ত। পাঠকদের আগ্রহী করতে কমপক্ষে ২০টি অক্ষর দিয়ে বর্ণনা পূর্ণাঙ্গ করুন।';
    }
    if (trimmedDesc.length > 2000) {
      return 'বিবরণটি খুব বড় হয়েছে। অনুগ্রহ করে ২০০০ অক্ষরের মধ্যে সংক্ষেপ করুন।';
    }

    if (!img) {
      return 'উপন্যাসটির জন্য একটি চমৎকার কভার ইমেজ সিলেক্ট বা আপলোড করুন।';
    }

    return null;
  };

  const validateChapterForm = (): string | null => {
    if (!selectedNovelId) {
      return 'দয়া করে পরিচ্ছেদ যুক্ত করার জন্য একটি উপন্যাস নির্বাচন করুন।';
    }
    if (!chapterNo || Number(chapterNo) <= 0) {
      return 'পরিচ্ছেদ সংখ্যা অবশ্যই ধনাত্মক (যেমন ১, ২, ৩) হতে হবে।';
    }
    
    // Validate uniqueness of this chapter number for the novel
    const isChapterExists = allChapters.some(
      ch => ch.novel_id === selectedNovelId && ch.chapter_number === Number(chapterNo)
    );
    if (isChapterExists) {
      return `এই উপন্যাসে ইতিমধ্যেই ${chapterNo} নং পরিচ্ছেদ প্রকাশিত রয়েছে। অনুগ্রহ করে পর্ব নম্বর পরিবর্তন করুন।`;
    }

    const trimmedTitle = chapterTitle.trim();
    if (!trimmedTitle) {
      return 'পরিচ্ছেদের শিরোনাম দেওয়া আবশ্যক।';
    }
    if (trimmedTitle.length < 3) {
      return 'পরিচ্ছেদের শিরোনাম অত্যন্ত সংক্ষিপ্ত। কমপক্ষে ৩টি অক্ষর দিন।';
    }
    if (trimmedTitle.length > 150) {
      return 'পরিচ্ছেদের শিরোনাম সর্বোচ্চ ১৫০ অক্ষরের লিমিট রাখুন।';
    }

    const trimmedContent = chapterContent.trim();
    if (!trimmedContent) {
      return 'পরিচ্ছেদের গল্প বা প্রধান ম্যাটেরিয়াল লেখা আবশ্যক।';
    }
    if (trimmedContent.length < 50) {
      return 'পরিচ্ছেদের গল্পটি অত্যন্ত খাটো। পাঠকদের মুগ্ধ করতে অন্তত ৫০টি অক্ষরের পাণ্ডুলিপি লিখুন।';
    }

    return null;
  };

  // Upload handler for cover image using Supabase Storage (real/mock)
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ফাইলের সাইজ ৫ মেগাবাইটের (5MB) নিচে হতে হবে।');
      return;
    }

    const permittedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!permittedTypes.includes(file.type)) {
      setUploadError('শুধুমাত্র JPEG, JPG, PNG, WEBP বা GIF ফরম্যাটের উজ্জ্বল ছবি আপলোড করা সম্ভব।');
      return;
    }

    setUploadingImage(true);
    try {
      const extension = file.name.split('.').pop() || 'png';
      const storagePath = `covers/${currentUser.id}_${Date.now()}.${extension}`;

      const { data, error } = await supabase.storage
        .from('covers')
        .upload(storagePath, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(storagePath);

      if (editingNovel) {
        setEditingNovel({ ...editingNovel, cover_image: publicUrl });
      } else {
        setCustomCover(publicUrl);
        setCoverImage(''); // Reset active preset selection
      }
      setNovelMsg({ type: 'success', text: 'কভার ছবিটি সফলভাবে আপলোড সম্পন্ন হয়েছে!' });
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'কভার ছবি আপলোড করার সময় কোনো টেকনিক্যাল সমস্যা হয়েছে।');
    } finally {
      setUploadingImage(false);
    }
  };

  // Local Draft handles
  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    const activeCover = customCover.trim() || coverImage;
    if (!title.trim()) {
      setNovelMsg({ type: 'error', text: 'অফলাইন ও লোকাল খসড়া সংরক্ষণের জন্য উপন্যাসের একটি শিরোনাম দেওয়া আবশ্যক।' });
      return;
    }

    const draftId = 'draft_' + Math.random().toString(36).substring(2, 11);
    const newDraft = {
      id: draftId,
      title: title.trim(),
      description: description.trim(),
      category,
      cover_image: activeCover,
      created_at: new Date().toISOString()
    };

    // Filter old drafts with same title to avoid duplicate names locally
    const updated = [newDraft, ...localDrafts.filter(d => d.title.toLowerCase() !== title.trim().toLowerCase())];
    setLocalDrafts(updated);
    localStorage.setItem('novel_world_local_drafts', JSON.stringify(updated));
    setNovelMsg({ type: 'success', text: `অপূর্ব! "${title}" উপন্যাসটি সফলভাবে লোকাল খসড়াতে (Draft) সংরক্ষিত হয়েছে।` });
  };

  const handleLoadDraft = (draft: any) => {
    setTitle(draft.title || '');
    setDescription(draft.description || '');
    setCategory(draft.category || CATEGORIES[0]);
    if (COVER_PRESETS.some(cov => cov.url === draft.cover_image)) {
      setCoverImage(draft.cover_image);
      setCustomCover('');
    } else {
      setCustomCover(draft.cover_image || '');
      setCoverImage('');
    }
    setActiveTab('create_book');
    setNovelMsg({ type: 'success', text: `খসড়া উপন্যাস "${draft.title}" পুনরুদ্ধার সম্পন্ন হয়েছে!` });
  };

  const handleDeleteDraft = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localDrafts.filter(d => d.id !== draftId);
    setLocalDrafts(updated);
    localStorage.setItem('novel_world_local_drafts', JSON.stringify(updated));
  };

  // Local Chapter Draft handles
  const handleSaveChapterDraft = () => {
    if (!selectedNovelId) {
      setChapterMsg({ type: 'error', text: 'দয়া করে খসড়া সংরক্ষণের জন্য প্রথমে উপন্যাস সিলেক্ট করুন।' });
      return;
    }
    const newDraft = {
      novel_id: selectedNovelId,
      chapter_number: Number(chapterNo),
      title: chapterTitle.trim(),
      content: chapterContent.trim()
    };
    localStorage.setItem('novel_world_local_chapter_draft', JSON.stringify(newDraft));
    setChapterDraft(newDraft);
    setChapterMsg({ type: 'success', text: 'অপূর্ব! আপনার পরিচ্ছেদের বর্তমান খসড়াটি ব্রাউজারের মেমরিতে সংরক্ষিত হয়েছে।' });
  };

  const handleLoadChapterDraft = () => {
    if (!chapterDraft) return;
    setSelectedNovelId(chapterDraft.novel_id || '');
    setChapterNo(chapterDraft.chapter_number || 1);
    setChapterTitle(chapterDraft.title || '');
    setChapterContent(chapterDraft.content || '');
    setChapterMsg({ type: 'success', text: 'সংরক্ষিত পরিচ্ছেদ খসড়া সফলভাবে রিস্টোর করা হয়েছে!' });
  };

  const handleDeleteChapterDraft = () => {
    localStorage.removeItem('novel_world_local_chapter_draft');
    setChapterDraft(null);
    setChapterMsg({ type: 'success', text: 'সংরক্ষিত চ্যাপ্টার খসড়া মেমরি থেকে মুছে ফেলা হয়েছে।' });
  };

  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeCover = customCover.trim() || coverImage;
    const errorMsg = validateNovelForm(title, description, activeCover);
    if (errorMsg) {
      setNovelMsg({ type: 'error', text: errorMsg });
      return;
    }

    setSubmittingNovel(true);
    setNovelMsg(null);

    const novelPayload = {
      author_id: currentUser.id,
      title: title.trim(),
      description: description.trim(),
      cover_image: activeCover,
      category,
      status: currentUser.role === 'admin' ? 'approved' : 'pending' // Admins are auto-approved!
    };

    try {
      const { data, error } = await supabase
        .from('novels')
        .insert(novelPayload);

      if (error) throw error;

      // Delete the local draft with same title since it's published now!
      const updated = localDrafts.filter(d => d.title.toLowerCase() !== title.trim().toLowerCase());
      setLocalDrafts(updated);
      localStorage.setItem('novel_world_local_drafts', JSON.stringify(updated));

      setNovelMsg({ 
        type: 'success', 
        text: currentUser.role === 'admin' 
          ? 'অভিনন্দন! আপনার উপন্যাসটি সরাসরি প্রকাশিত হয়েছে।' 
          : 'আপনার উপন্যাসটি সফলভাবে রিভিউ ও অনুমোদনের জন্য জমা দেওয়া হয়েছে।' 
      });
      setTitle('');
      setDescription('');
      setCustomCover('');
      onRefreshNovels();
      setTimeout(() => {
        setActiveTab('my_books');
        setNovelMsg(null);
      }, 3000);
    } catch (err: any) {
      setNovelMsg({ type: 'error', text: err.message || 'নতুন উপন্যাস সংরক্ষণ করা যায়নি।' });
    } finally {
      setSubmittingNovel(false);
    }
  };

  const handleUpdateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNovel) return;

    // Defense-in-depth ownership verification check
    if (!currentUser || (editingNovel.author_id !== currentUser.id && currentUser.role !== 'admin')) {
      setNovelMsg({ type: 'error', text: 'আপনার এই উপন্যাস তথ্য সংশোধন বা পরিবর্তন করার অধিকার নেই।' });
      return;
    }

    const errorMsg = validateNovelForm(editingNovel.title, editingNovel.description, editingNovel.cover_image);
    if (errorMsg) {
      setNovelMsg({ type: 'error', text: errorMsg });
      return;
    }

    setSubmittingNovel(true);
    setNovelMsg(null);

    const updatePayload = {
      title: editingNovel.title,
      description: editingNovel.description,
      category: editingNovel.category,
      cover_image: editingNovel.cover_image,
      status: currentUser.role === 'admin' ? 'approved' : 'pending' // non-admins must be re-approved on updates!
    };

    try {
      const { error } = await supabase
        .from('novels')
        .eq('id', editingNovel.id)
        .update(updatePayload);

      if (error) throw error;

      setNovelMsg({ 
        type: 'success', 
        text: currentUser.role === 'admin' 
          ? ' can বি প্রকাশিত সরাসরি।' 
          : 'আপনার পরিবর্তনগুলো সংরক্ষিত হয়েছে এবং উপন্যাসটি অ্যাডমিন প্যানেলে জমা দেওয়া হয়েছে।' 
      });
      onRefreshNovels();
      setTimeout(() => {
        setEditingNovel(null);
        setNovelMsg(null);
        setActiveTab('my_books');
      }, 3000);
    } catch (err: any) {
      setNovelMsg({ type: 'error', text: err.message || 'পরিবর্তন সংরক্ষণ করা যায়নি।' });
    } finally {
      setSubmittingNovel(false);
    }
  };

  const handleDeleteNovel = async (novelId: string) => {
    // Defense-in-depth ownership verification check
    const novelObj = myNovels.find(n => n.id === novelId);
    if (!currentUser || (!novelObj && currentUser.role !== 'admin')) {
      alert('আপনার এই উপন্যাসটি ডিলিট করার অধিকার নেই।');
      return;
    }

    try {
      const { error } = await supabase
        .from('novels')
        .eq('id', novelId)
        .delete();

      if (error) throw error;
      setNovelToDelete(null);
      onRefreshNovels();
    } catch (err: any) {
      alert(err.message || 'বইটি ডিলেট করা সম্ভব হয়নি।');
    }
  };

  const handlePublishChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateChapterForm();
    if (errorMsg) {
      setChapterMsg({ type: 'error', text: errorMsg });
      return;
    }

    setSubmittingChapter(true);
    setChapterMsg(null);

    const chapterPayload = {
      novel_id: selectedNovelId,
      chapter_number: Number(chapterNo),
      title: chapterTitle.trim(),
      content: chapterContent.trim()
    };

    try {
      const { error } = await supabase
        .from('chapters')
        .insert(chapterPayload);

      if (error) throw error;

      // Wipe chapter draft if details match
      if (chapterDraft && chapterDraft.novel_id === selectedNovelId && chapterDraft.chapter_number === Number(chapterNo)) {
        localStorage.removeItem('novel_world_local_chapter_draft');
        setChapterDraft(null);
      }

      setChapterMsg({ type: 'success', text: `অসাধারণ! পরিচ্ছেদ ${chapterNo} অর্থাৎ "${chapterTitle}" সফলভাবে প্রকাশিত হয়েছে!` });
      setChapterTitle('');
      setChapterContent('');
      setChapterNo(prev => prev + 1);
      setTimeout(() => {
        setChapterMsg(null);
      }, 3000);
    } catch (err: any) {
      setChapterMsg({ type: 'error', text: err.message || 'পর্ব সেভ করতে ব্যর্থ হয়েছে। চেক করুন এই পর্ব নম্বর ইতিমধ্যে অন্য চ্যাপ্টারে ব্যবহৃত কিনা।' });
    } finally {
      setSubmittingChapter(false);
    }
  };

  const getNovelChaptersCount = (novelId: string) => {
    return allChapters.filter(ch => ch.novel_id === novelId).length;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      
      {/* Upper header statistics widget */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>সৃজনশীল সাহিত্য একাডেমি (Creator Center)</span>
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight">
            স্বাগতম, @{currentUser.username}!
          </h2>
          <p className="text-emerald-100 text-sm mt-1.5 font-sans font-light max-w-xl">
            আপনার মনের গহীনের সুন্দর সুন্দর কল্পনাগুলোকে চমৎকার চমৎকার উপন্যাসে রূপান্তর করুন। নভেল ওয়ার্ল্ড পাঠকের কাছে আপনার দৃষ্টিভঙ্গি পৌঁছে দেবে।
          </p>
        </div>

        <div className="flex gap-4 self-stretch md:self-auto">
          <div className="flex-1 bg-white/10 backdrop-blur-md py-4 px-5 rounded-2xl border border-white/10 text-center">
            <span className="block text-2xl font-black">{myNovels.length}</span>
            <span className="text-[10px] uppercase font-bold text-emerald-200">উপন্যাস সমূহ</span>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-md py-4 px-5 rounded-2xl border border-white/10 text-center">
            <span className="block text-2xl font-black">
              {myNovels.filter(n => n.status === 'approved').length}
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-200">অনুমোদিত বই</span>
          </div>
        </div>
      </div>

      {/* Tabs list switches */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 mb-6 font-semibold overflow-x-auto gap-2">
        <button
          onClick={() => { setActiveTab('my_books'); setEditingNovel(null); }}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer ${
            activeTab === 'my_books' && !editingNovel
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          আমার উপন্যাস তালিকা
        </button>
        <button
          onClick={() => { setActiveTab('create_book'); setEditingNovel(null); }}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer ${
            activeTab === 'create_book' && !editingNovel
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          {editingNovel ? 'উপন্যাস সম্পাদনা' : 'নতুন উপন্যাস যোগ করুন'}
        </button>
        <button
          onClick={() => { setActiveTab('add_chapter'); setEditingNovel(null); }}
          className={`pb-3 px-4 text-sm relative shrink-0 cursor-pointer ${
            activeTab === 'add_chapter' && !editingNovel
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          নতুন পরিচ্ছেদ বা পর্ব যোগ করুন
        </button>
      </div>

      {/* Body contents based on active tab */}
      {activeTab === 'my_books' && !editingNovel && (
        <div className="space-y-4">
          {myNovels.length === 0 && localDrafts.length === 0 ? (
            <div className="text-center py-16 bg-stone-500/5 border border-dashed border-stone-350 dark:border-stone-800 rounded-3xl">
              <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-stone-700 dark:text-stone-350 mb-1">আপনার কোনো উপন্যাস বা খসড়া নেই</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">আপনার সৃজনশীল প্রতিভাকে আটকে রাখবেন না। এখনই প্রথম উপন্যাসটি শুরু করুন!</p>
              <button
                onClick={() => setActiveTab('create_book')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                উপন্যাস সৃষ্টি করুন
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {myNovels.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-4 text-stone-700 dark:text-stone-300">প্রকাশিত ও পেন্ডিং উপন্যাস সমূহ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myNovels.map((nov) => (
                      <div 
                        key={nov.id} 
                        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl flex gap-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <img
                          src={nov.cover_image}
                          alt={nov.title}
                          className="w-20 md:w-24 aspect-[2/3] object-cover rounded-xl shadow-inner shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-0.5 rounded-full">
                                {nov.category}
                              </span>
                              
                              {/* Status badges */}
                              {nov.status === 'approved' ? (
                                <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Approved
                                </span>
                              ) : nov.status === 'pending' ? (
                                <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-955/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 animate-spin" /> Pending Approval
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-955/40 px-2 py-0.5 rounded-full">
                                  Rejected
                                </span>
                              )}
                            </div>

                            <h4 className="text-md font-bold mt-2 text-stone-850 dark:text-stone-100">
                              {nov.title}
                            </h4>
                            <p className="text-xs text-stone-550 dark:text-stone-400 line-clamp-2 mt-1">
                              {nov.description}
                            </p>

                            <div className="mt-2.5 text-xs text-stone-605 dark:text-stone-400 flex items-center gap-2">
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {getNovelChaptersCount(nov.id)}টি পরিচ্ছেদ
                              </span>
                              <span className="text-stone-300 dark:text-stone-700">|</span>
                              <span>প্রকাশ: {new Date(nov.created_at).toLocaleDateString('bn-BD')}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4 pt-1.5 border-t border-stone-100 dark:border-stone-850 justify-between items-center">
                            <button
                              onClick={() => onSelectNovelToRead(nov)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> রিডার মোডে দেখুন
                            </button>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => { setEditingNovel(nov); setActiveTab('create_book'); }}
                                className="p-1 px-1.5 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-350 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer flex items-center gap-1.5"
                                title="সম্পাদনা করুন"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              
                              {novelToDelete === nov.id ? (
                                <div className="flex gap-1 text-[10px]">
                                  <button 
                                    onClick={() => handleDeleteNovel(nov.id)}
                                    className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer"
                                  >
                                    হ্যাঁ
                                  </button>
                                  <button 
                                    onClick={() => setNovelToDelete(null)}
                                    className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded cursor-pointer"
                                  >
                                    না
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setNovelToDelete(nov.id)}
                                  className="p-1 px-1.5 text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-450 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                                  title="ডিলেট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Drafts Section */}
              {localDrafts.length > 0 && (
                <div className="pt-6 border-t border-stone-200 dark:border-stone-850">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Save className="w-4 h-4 text-amber-500" />
                    <span>স্থানীয় খসড়া উপন্যাস সমূহ (Local Drafts)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localDrafts.map((draft) => (
                      <div 
                        key={draft.id} 
                        className="bg-stone-50/50 dark:bg-stone-900/50 border border-dashed border-stone-250 dark:border-stone-800 p-4 rounded-2xl flex gap-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <img
                          src={draft.cover_image}
                          alt={draft.title}
                          className="w-16 md:w-20 aspect-[2/3] object-cover rounded-xl shadow shrink-0 opacity-75"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 dark:bg-amber-955/30 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                                লোকাল ড্রাফট
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(draft.created_at).toLocaleDateString('bn-BD')}
                              </span>
                            </div>
                            <h4 className="text-md font-semibold mt-2 text-stone-800 dark:text-stone-105">
                              {draft.title}
                            </h4>
                            <p className="text-xs text-stone-550 dark:text-stone-400 line-clamp-2 mt-1">
                              {draft.description || 'বইটির সংক্ষিপ্ত বিবরণ দেওয়া হয়নি।'}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-4 pt-1.5 border-t border-stone-100 dark:border-stone-800 justify-between items-center">
                            <button
                              onClick={() => handleLoadDraft(draft)}
                              className="text-xs font-semibold text-amber-600 hover:text-amber-505 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" /> খসড়া লোড করুন
                            </button>
                            <button
                              onClick={(e) => handleDeleteDraft(draft.id, e)}
                              className="p-1 px-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT BOOK TAB */}
      {(activeTab === 'create_book' || editingNovel) && (
        <form onSubmit={editingNovel ? handleUpdateNovel : handleCreateNovel} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-2xl mx-auto shadow-sm space-y-5">
          <h3 className="text-xl font-bold border-b border-stone-150 dark:border-stone-850 pb-3 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{editingNovel ? `উপন্যাস সম্পাদনা: ${editingNovel.title}` : 'নতুন উপন্যাস যোগ করুন'}</span>
          </h3>

          {!editingNovel && !isMockActive && (
            <div className="p-3 bg-amber-50 dark:bg-amber-955/20 text-[11px] rounded-xl text-amber-800 dark:text-amber-300 border border-amber-200/40">
              <b>গুরুত্বপূর্ণ নোটিশ:</b> অন-মিডিও আপডেট অনুযায়ী আপনি উপন্যাস সম্পাদনা করলে এটি পুনরায় অ্যাডমিনের কাছে অনুমোদনের জন্য যাবে।
            </div>
          )}

          {/* Book Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
              উপন্যাসের শিরোনাম (বইয়ের নাম) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: বিষের বাঁশি, আমার শেষ বিকেল"
              value={editingNovel ? editingNovel.title : title}
              onChange={(e) => {
                if (editingNovel) setEditingNovel({ ...editingNovel, title: e.target.value });
                else setTitle(e.target.value);
              }}
              className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Book Description / Synopsis */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
              উপন্যাসের মূল পটভূমি বা সংক্ষিপ্ত বিবরণ <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="উপন্যাসের রোমাঞ্চকর সারাংশ লিখুন যা পাঠকদের বইটি পড়তে আকৃষ্ট করবে (কমপক্ষে ২০ অক্ষর)..."
              value={editingNovel ? editingNovel.description : description}
              onChange={(e) => {
                if (editingNovel) setEditingNovel({ ...editingNovel, description: e.target.value });
                else setDescription(e.target.value);
              }}
              className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Dropdown & Unsplash covers Grid selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
                সাহিত্যিক বিভাগ (Category) <span className="text-red-500">*</span>
              </label>
              <select
                value={editingNovel ? editingNovel.category : category}
                onChange={(e) => {
                  if (editingNovel) setEditingNovel({ ...editingNovel, category: e.target.value });
                  else setCategory(e.target.value);
                }}
                className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Cover photo selectors */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 font-sans">
                বিকল্প কভার ছবি প্রিসেট
              </label>
              <div className="flex gap-2 justify-between flex-wrap pb-1">
                {COVER_PRESETS.map((cov, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (editingNovel) setEditingNovel({ ...editingNovel, cover_image: cov.url });
                      else {
                        setCoverImage(cov.url);
                        setCustomCover('');
                      }
                    }}
                    title={cov.name}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 cursor-pointer relative hover:scale-105 transition-all ${
                      (editingNovel ? editingNovel.cover_image === cov.url : (!customCover && coverImage === cov.url))
                        ? 'border-emerald-500 scale-105 shadow-md'
                        : 'border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <img src={cov.url} alt={`cover-${i}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4 border-t border-stone-100 dark:border-stone-850 pt-4">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              উপন্যাসের কভার ছবি আপলোড ও কাস্টম URL <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-dashed border-stone-250 dark:border-stone-750 bg-stone-50/50 dark:bg-stone-955/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Upload className={`w-8 h-8 mb-2 ${uploadingImage ? 'text-emerald-500 animate-bounce' : 'text-stone-400'}`} />
                <span className="text-xs font-bold text-stone-700 dark:text-stone-200">ছবি আপলোড করুন</span>
                <span className="text-[10px] text-stone-400 mt-1">JPG, JPEG, PNG, WEBP, GIF (সর্বোচ্চ ৫ মেগাবাইট)</span>
                
                <input
                  type="file"
                  id="cover-img-uploader"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={handleUploadCover}
                  className="hidden"
                />
                
                <label 
                  htmlFor="cover-img-uploader"
                  className={`mt-4 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploadingImage ? 'আপলোড হচ্ছে...' : 'কভার ফাইল সিলেক্ট করুন'}
                </label>

                {uploadError && (
                  <span className="text-[10px] text-rose-500 font-semibold mt-2 text-left bg-rose-50 p-1.5 rounded w-full">
                    ⚠️ {uploadError}
                  </span>
                )}
              </div>

              <div className="bg-stone-50 dark:bg-stone-955/20 border border-stone-150 dark:border-stone-850 rounded-2xl p-4 flex flex-col justify-center space-y-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-200">অথবা ছবির সরাসরি লিংক পেস্ট করুন:</span>
                <input
                  type="url"
                  placeholder="যেমন: https://example.com/cover.jpg"
                  value={editingNovel ? editingNovel.cover_image : customCover}
                  onChange={(e) => {
                    if (editingNovel) setEditingNovel({ ...editingNovel, cover_image: e.target.value });
                    else {
                      setCustomCover(e.target.value);
                      setCoverImage('');
                    }
                  }}
                  className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
                <span className="text-[10px] text-stone-400">অনলাইন থেকে যেকোনো ছবির সরাসরি লিংক পেস্ট করতে পারেন।</span>
              </div>
            </div>
            
            {novelMsg && (
              <div className={`p-4 rounded-xl text-xs flex items-center gap-1.5 ${novelMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-350' : 'bg-rose-50 dark:bg-rose-955/35 text-rose-700 dark:text-rose-350'}`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{novelMsg.text}</span>
              </div>
            )}
          </div>

          {/* Form Actions (Submit / Cancel / Save Draft) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 dark:border-stone-850 pt-4 mt-2">
            {!editingNovel ? (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-955/20 text-amber-700 dark:text-amber-305 border border-amber-200/35 hover:border-amber-500/20 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                title="ব্রাউজারে লোকাল ড্রাফট হিসেবে জমা রাখুন"
              >
                <Save className="w-3.5 h-3.5" /> লোকাল খসড়া সংরক্ষণ করুন
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setEditingNovel(null); setActiveTab('my_books'); }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                বাতিল করুন
              </button>
            )}

            <button
              type="submit"
              disabled={submittingNovel}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800/50 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submittingNovel ? 'প্রসেসিং হচ্ছে...' : editingNovel ? 'উপন্যাস সংশোধন করুন' : 'উপন্যাসটি প্রকাশ করুন'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ADD / REGISTER CHAPTER TAB */}
      {activeTab === 'add_chapter' && !editingNovel && (
        <form onSubmit={handlePublishChapter} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-2xl mx-auto shadow-sm space-y-5">
          <h3 className="text-xl font-bold border-b border-stone-150 dark:border-stone-850 pb-3 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>নতুন পরিচ্ছেদ বা পর্ব যোগ করুন</span>
          </h3>

          {/* Select Novel */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              উপন্যাস বেছে নিন
            </label>
            {myNovels.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 text-xs text-amber-800 rounded-xl">
                কোনো উপন্যাস পাওয়া যায়নি। পরিচ্ছেদ যোগ করার আগে আপনাকে অন্তত একটি উপন্যাস ড্যাশবোর্ডে তালিকাভুক্ত করতে হবে।
              </div>
            ) : (
              <select
                value={selectedNovelId}
                onChange={(e) => setSelectedNovelId(e.target.value)}
                required
                className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 focus:outline-none"
              >
                <option value="">-- উপন্যাস নির্বাচন করুন --</option>
                {myNovels.map((nov) => (
                  <option key={nov.id} value={nov.id}>
                    {nov.title} ({nov.status === 'approved' ? 'Approved' : 'Pending'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Chapter list ordering */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                পরিচ্ছেদ নং
              </label>
              <input
                type="number"
                min={1}
                required
                value={chapterNo}
                onChange={(e) => setChapterNo(Number(e.target.value))}
                className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Chapter title */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                পরিচ্ছেদের শিরোনাম
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: ১ম পরিচ্ছেদ: প্রেম ও বিরহ"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Content writing area */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex justify-between">
              <span>পরিচ্ছেদের মূল গল্প বা পাণ্ডুলিপি</span>
              <span className="text-[10px] text-stone-400 font-mono">বাংলা ভাষায় সুন্দরভাবে উপস্থাপন করুন</span>
            </label>
            <textarea
              required
              rows={12}
              placeholder="আপনার উপন্যাসের পরিচ্ছেদের গল্পটি বিস্তারিতভাবে এখানে টাইপ করুন বা পেস্ট করুন। পাঠক যাতে পড়ার সময় একটি আরামদায়ক অনুভূতি পায় তাই প্যারাগ্রাফ ব্যবহার করুন..."
              value={chapterContent}
              onChange={(e) => setChapterContent(e.target.value)}
              className="w-full text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-sans"
            />
          </div>

          {chapterMsg && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-1.5 ${chapterMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-350' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-350'}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{chapterMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-stone-100 dark:border-stone-850">
            <button
              type="submit"
              disabled={submittingChapter || myNovels.length === 0}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-sans font-semibold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
            >
              {submittingChapter ? 'প্রকাশ করা হচ্ছে...' : 'পরিচ্ছেদটি প্রকাশ করুন'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
