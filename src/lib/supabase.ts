/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if keys are valid (not default placeholders or empty)
const hasRealSupabase =
  SUPABASE_URL &&
  SUPABASE_URL !== 'https://your-supabase-project.supabase.co' &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== 'your-anon-public-key';

export const isUsingMock = !hasRealSupabase;

// Pre-seeded badges for our platform
const DEFAULT_BADGES = [
  { id: 'b1', name: 'Bronze Writer (ব্রোঞ্জ লেখক)', icon: '🥉', description: 'চমৎকার লেখার সূচনা ও প্রথম মাইলফলক অর্জনকারী।' },
  { id: 'b2', name: 'Silver Writer (রুপালী লেখক)', icon: '🥈', description: 'ধারাবাহিক সুন্দর লেখনী ও পাঠকদের প্রিয় নিয়মিত গল্পকার।' },
  { id: 'b3', name: 'Gold Writer (স্বর্ণালী লেখক)', icon: '🥇', description: 'অসামান্য সাহিত্য সম্ভার ও দীর্ঘকালীন অসাধারণ অবদানের অধিকারী।' },
  { id: 'b4', name: 'Verified Author (যাচাইকৃত সাহিত্যিক)', icon: '✅', description: 'আমাদের প্ল্যাটফর্মের বিশ্বস্ত ও নির্ভরযোগ্য যাচাইকৃত সাহিত্যিক।' },
  { id: 'b5', name: 'Elite Author (সেরা লেখক)', icon: '✍️', description: 'ধারাবাহিক চমৎকার লেখার জন্য সম্মানিত লেখক।' },
  { id: 'b6', name: 'Master Reader (মহাপাটক)', icon: '📖', description: 'নিয়মিত পড়ার জন্য নিবেদিত পাঠক।' },
  { id: 'b7', name: 'Critic Special (রসিক সমালোচক)', icon: '💬', description: 'অসামান্য মন্তব্য ও গঠনমূলক আলোচনার পুরস্কার।' },
  { id: 'b8', name: 'Pioneer (অগ্রদূত)', icon: '🚀', description: 'আজকের উপন্যাসের আদিম পথপ্রদর্শক।' }
];

// Pre-seeded novels and chapters for visual beauty on first load
const DEFAULT_NOVELS = [
  {
    id: 'n1',
    author_id: 'a1',
    title: 'মেঘবালিকার দিনলিপি',
    description: 'একটি মেয়ে তার একাকী শহরের জীবন আর মেঘের অন্তরালে লুকিয়ে থাকা স্বপ্নের কথা লিখেছে। এটি বাঙালির চিরাচরিত হদয়ের গহীনের কথা ব্যক্ত করে।',
    cover_image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    category: 'রোমান্টিক ও নাটক',
    status: 'approved',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'n2',
    author_id: 'a2',
    title: 'ছায়াপথের রহস্য',
    description: 'কল্পবিজ্ঞান ঘরানার ডাইনামিক কাহিনী যেখানে একটি মহাকাশ গবেষক দল খুঁজে পায় প্রাচীন মহাজাগতিক বাংলা লিপি।',
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
    category: 'কল্পবিজ্ঞান ও রহস্য',
    status: 'approved',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'n3',
    author_id: 'a1',
    title: 'শেষ বিকেলের নীল আকাশ',
    description: 'পল্লী বাংলার চিরন্তন জীবনধারা, ছোট ছোট দুঃখ-সুখ আর নদীর জলতরঙ্গের মতো বয়ে চলা জীবনকথা।',
    cover_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    category: 'সামাজিক ও জীবনমুখী',
    status: 'pending', // Pending approval for admin review page
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_CHAPTERS = [
  {
    id: 'c1',
    novel_id: 'n1',
    chapter_number: 1,
    title: 'প্রথম খণ্ড: ধুলোবালি ও মন খারাপের বৃষ্টি',
    content: 'আজ সকাল থেকেই আকাশটা একটু বেশিই বিষন্ন। শহরটার চারিপাশের ইটের দালানগুলোর ওপর ধূসর রঙের মেঘেরা অলসভাবে ঘুরে বেড়াচ্ছে। আমার বারান্দার কোণের ছোট্ট টবের অপরাজিতা গাছটা সিক্ত হচ্ছে এক অদ্ভূত ভালোবাসায়। \n\nএই শহরটা বড়ই অদ্ভুত। এখানে লক্ষ কোটি মানুষ বাস করে, তবুও যেন প্রত্যেকে একেকটা আস্ত মহাসমুদ্রে একাকী ভাসমান দ্বীপের মতো বসবাস করছে। আমি চায়ের কাপে শেষ চুমুক দিয়ে একটি দীর্ঘশ্বাস ফেললাম। বৃষ্টিটা হয়তো আজ সারাদিনই চলতেই থাকবে। মেঘবালিকার দিনলিপির প্রথম পাতার শুরুটা বিষদ দিয়েই করতে হলো।',
    created_at: new Date(Date.now() - 4.9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c2',
    novel_id: 'n1',
    chapter_number: 2,
    title: 'দ্বিতীয় খণ্ড: অপ্রত্যাশিত চিঠি',
    content: 'মেঘবালিকার দিনলিপির পরবর্তী পাতায় যে একটি অপ্রত্যাশিত ঘটনা ঘটবে তা আমি দুঃস্বপ্নেও ভাবিনি। পোস্টম্যান দরজায় এসে একটি খাম রেখে গেল। খামের ওপর কোনো প্রেরকের ঠিকানা ছিল না, কেবল লাল কালিতে চমৎকার হস্তাক্ষরে লেখা ছিল "মেঘবালিকা"। \n\nআমি অধীর আগ্রহে খামটা খুললাম। ভেতরে মাত্র দুটি লাইন লেখা:\n"মেঘেরা কিন্তু চিরকাল কাঁদে না। কখনো কখনো তারা আলো ছড়াতেও আসে।"\nআমার বুকের ভেতর হঠাৎ হিল্লোল বয়ে গেল। কে এই রহস্যময় প্রেরক? সে কি বৃষ্টি দেখার অছিলায় দূর থেকে আমার বিষন্নতা পর্যবেক্ষণ করেছে?',
    created_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c3',
    novel_id: 'n2',
    chapter_number: 1,
    title: 'অধ্যায় ১: সংকেত',
    content: 'বিজ্ঞানাগারের মূল মনিটরে একটা সাইরেন বেজে উঠল। প্রফেসর রহমান চশমাটা নাক অব্দি নামিয়ে স্ক্রিনের দিকে ঝুঁকে পড়লেন। গভীর মহাকাশ থেকে আগত তরঙ্গের প্যাটার্নগুলো সাধারণ কসমিক গোলমালের মতো নয়। \n\n"এটা অসম্ভব!" তিনি বিড়বিড় করলেন। \nকম্পিউটারের ডিকোডার সংকেতগুলোকে বাইনারি থেকে অক্ষরে রূপান্তর করতে শুরু করেছে। এবং স্ক্রিনে স্পষ্ট ফুটে উঠেছে প্রথম বাংলা স্বরবর্ণ: "অ"। শত শত আলোকবর্ষ দূরবর্তী কোনো নীহারিকা থেকে কীভাবে বাংলা হরফের জ্যামিতিক বিন্যাসে আলোকরশ্মি আসতে পারে? পুরো বৈজ্ঞানিক দল বিস্ময়ে ও অজানা আশঙ্কায় জমে গেল।',
    created_at: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_USERS = [
  {
    id: 'a1',
    username: 'tasnim_ahmed',
    email: 'tasnim@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
    bio: 'আমি সাহিত্যের অনুরাগী। হৃদয়ের গভীর অনুভূতিগুলোকে বাংলা উপন্যাসের পাতায় তুলে ধরি।',
    role: 'user',
    badge_id: 'b1',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a2',
    username: 'rooni_hossain',
    email: 'rooni@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
    bio: 'কল্পবিজ্ঞান ও থ্রিলার নিয়ে কাজ করতে ভালোবাসি। নতুন ধারণার রোমাঞ্চই আমার সাহিত্যের মূল চালিকাশক্তি।',
    role: 'user',
    badge_id: 'b4',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'admin_user',
    username: 'siyam_admin',
    email: 'siyamrahman1268@gmail.com', // Pre-defined admin email!
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150',
    bio: 'নভেল ওয়ার্ল্ড (Novel World) প্ল্যাটফর্মের প্রধান সমন্বয়ক ও অ্যাডমিন।',
    role: 'admin',
    badge_id: null,
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_COMMENTS = [
  {
    id: 'com1',
    user_id: 'a2',
    novel_id: 'n1',
    comment_text: 'চমৎকার লেখা! প্রতিটি লাইন যেন অনুভূতির গভীর স্পর্শ দিয়ে স্পর্শ করে যায়। দ্বিতীয় অধ্যায়ের জন্য অপেক্ষায় থাকলাম।',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'com2',
    user_id: 'a1',
    novel_id: 'n2',
    comment_text: 'মহাজাগতিক সংকেতে বাংলা লিপি আবিষ্কারের প্লটটা বেশ রোমাঞ্চকর! বাংলায় ভালো কল্পবিজ্ঞানের বড় অভাব, চমৎকার উদ্যোগ।',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_LIKES = [
  { id: 'l1', user_id: 'a2', novel_id: 'n1', created_at: new Date().toISOString() },
  { id: 'l2', user_id: 'admin_user', novel_id: 'n1', created_at: new Date().toISOString() },
  { id: 'l3', user_id: 'a1', novel_id: 'n2', created_at: new Date().toISOString() }
];

const DEFAULT_BOOKMARKS = [
  { id: 'bm1', user_id: 'a2', novel_id: 'n1', created_at: new Date().toISOString() }
];

// -------------------------------------------------------------------------
// LOCALSTORAGE HIGH-FIDELITY MOCK CLIENT
// -------------------------------------------------------------------------

class MockSupabaseClient {
  storage = {
    from: (bucketName: string) => ({
      upload: async (path: string, file: File, options?: any) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            let mockUploads = {} as Record<string, string>;
            try {
              mockUploads = JSON.parse(localStorage.getItem('novel_world_mock_uploads') || '{}');
            } catch (e) {}
            mockUploads[path] = dataUrl;
            localStorage.setItem('novel_world_mock_uploads', JSON.stringify(mockUploads));
            resolve({ data: { path }, error: null });
          };
          reader.onerror = () => {
            resolve({ data: null, error: { message: 'ফাইল আপলোড করতে ব্যর্থ হয়েছে।' } });
          };
          reader.readAsDataURL(file);
        });
      },
      getPublicUrl: (path: string) => {
        let mockUploads = {} as Record<string, string>;
        try {
          mockUploads = JSON.parse(localStorage.getItem('novel_world_mock_uploads') || '{}');
        } catch (e) {}
        const publicUrl = mockUploads[path] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';
        return { data: { publicUrl } };
      }
    })
  };

  private getStorage<T>(key: string, defaultData: T): T {
    const val = localStorage.getItem(`novel_world_${key}`);
    if (!val) {
      localStorage.setItem(`novel_world_${key}`, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(val);
  }

  private setStorage<T>(key: string, data: T) {
    localStorage.setItem(`novel_world_${key}`, JSON.stringify(data));
  }

  auth = {
    signUp: async ({ email, password, options }: any) => {
      const users = this.getStorage('users', DEFAULT_USERS);
      const emailLower = email.toLowerCase();
      
      if (users.some(u => u.email === emailLower)) {
        return { data: { user: null }, error: { message: 'ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।' } };
      }

      const uid = 'u_' + Math.random().toString(36).substring(2, 11);
      const username = options?.data?.username || email.split('@')[0] + Math.floor(Math.random() * 100);

      // Auto assign admin role if email matches the user email
      const role = emailLower === 'siyamrahman1268@gmail.com' ? 'admin' : 'user';

      const newUser = {
        id: uid,
        username,
        email: emailLower,
        avatar_url: options?.data?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
        bio: options?.data?.bio || 'আমার একটি নতুন জীবন শুরু হলো নভেল ওয়ার্ল্ডে।',
        role,
        badge_id: null,
        created_at: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      this.setStorage('users', updatedUsers);

      // Log in immediately
      this.setStorage('current_user', newUser);
      this.notifyAuthChange(newUser);

      return { data: { user: newUser, session: { user: newUser } }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      const users = this.getStorage('users', DEFAULT_USERS);
      const emailLower = email.toLowerCase();
      const user = users.find(u => u.email === emailLower);

      if (!user) {
        return { data: { user: null }, error: { message: 'ভুল ইমেইল অথবা পাসওয়ার্ড দেওয়া হয়েছে।' } };
      }

      this.setStorage('current_user', user);
      this.notifyAuthChange(user);

      return { data: { user, session: { user } }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('novel_world_current_user');
      this.notifyAuthChange(null);
      return { error: null };
    },

    getSession: async () => {
      const user = localStorage.getItem('novel_world_current_user');
      if (user) {
        const u = JSON.parse(user);
        return { data: { session: { user: u } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange: (callback: any) => {
      this.authCallbacks.push(callback);
      // Immediately invoke with current state
      const userJSON = localStorage.getItem('novel_world_current_user');
      const user = userJSON ? JSON.parse(userJSON) : null;
      callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authCallbacks = this.authCallbacks.filter(c => c !== callback);
            }
          }
        }
      };
    }
  };

  private authCallbacks: Array<any> = [];

  private notifyAuthChange(user: any) {
    this.authCallbacks.forEach(cb => {
      cb(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
    });
  }

  // Builder configuration pattern for from() querying
  from(tableName: string) {
    const isMock = true;
    const client = this;

    // Load table data
    let dataList: any[] = [];
    if (tableName === 'users') dataList = this.getStorage('users', DEFAULT_USERS);
    else if (tableName === 'novels') dataList = this.getStorage('novels', DEFAULT_NOVELS);
    else if (tableName === 'chapters') dataList = this.getStorage('chapters', DEFAULT_CHAPTERS);
    else if (tableName === 'comments') dataList = this.getStorage('comments', DEFAULT_COMMENTS);
    else if (tableName === 'bookmarks') dataList = this.getStorage('bookmarks', DEFAULT_BOOKMARKS);
    else if (tableName === 'likes') dataList = this.getStorage('likes', DEFAULT_LIKES);
    else if (tableName === 'badges') dataList = this.getStorage('badges', DEFAULT_BADGES);

    // Dynamic builder queries
    let result = [...dataList];
    let queryError: any = null;

    const builderObj = {
      select: (fields: string = '*') => {
        // Simple select parser for relationships
        return builderObj;
      },
      eq: (field: string, value: any) => {
        result = result.filter(item => item[field] === value);
        return builderObj;
      },
      order: (field: string, config?: { ascending?: boolean }) => {
        const asc = config?.ascending !== false;
        result.sort((a, b) => {
          if (a[field] < b[field]) return asc ? -1 : 1;
          if (a[field] > b[field]) return asc ? 1 : -1;
          return 0;
        });
        return builderObj;
      },
      insert: (newData: any) => {
        try {
          const formatted = Array.isArray(newData) ? newData : [newData];
          const output: any[] = [];

          for (const raw of formatted) {
            const row = {
              id: raw.id || 'id_' + Math.random().toString(36).substring(2, 11),
              created_at: new Date().toISOString(),
              ...raw
            };
            
            // If it is a novel, and user is not admin, force pending state!
            if (tableName === 'novels') {
              const currentUser = client.getStorage<any>('current_user', null);
              if (currentUser && currentUser.role !== 'admin') {
                row.status = 'pending';
              } else if (!row.status) {
                row.status = 'approved';
              }
            }

            dataList.push(row);
            output.push(row);
          }

          client.setStorage(tableName, dataList);
          result = output;
        } catch (e: any) {
          queryError = e;
        }
        return builderObj;
      },
      update: (updateFields: any) => {
        try {
          // Applies update fields to working result set rows
          const idsToUpdate = result.map(r => r.id);
          const fullList = client.getStorage<any[]>(tableName, []);
          
          const updatedList = fullList.map(item => {
            if (idsToUpdate.includes(item.id)) {
              const updatedItem = { ...item, ...updateFields };
              // Revert to pending is safety check from SQL Trigger
              if (tableName === 'novels') {
                const currentUser = client.getStorage<any>('current_user', null);
                if (currentUser && currentUser.role !== 'admin') {
                  updatedItem.status = 'pending';
                }
              }
              return updatedItem;
            }
            return item;
          });

          client.setStorage(tableName, updatedList);
          result = result.map(item => ({ ...item, ...updateFields }));
        } catch (e: any) {
          queryError = e;
        }
        return builderObj;
      },
      delete: () => {
        try {
          const idsToDelete = result.map(r => r.id);
          const fullList = client.getStorage<any[]>(tableName, []);
          const updatedList = fullList.filter(item => !idsToDelete.includes(item.id));
          client.setStorage(tableName, updatedList);
          result = [];
        } catch (e: any) {
          queryError = e;
        }
        return builderObj;
      },
      // Promise-like then block resolution for direct await support
      then: (resolve: any) => {
        resolve({ data: result, error: queryError });
      }
    };

    return builderObj as any;
  }
}

// Instantiate external Supabase client OR elegant Local Mock
export const supabase = hasRealSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (new MockSupabaseClient() as any);
