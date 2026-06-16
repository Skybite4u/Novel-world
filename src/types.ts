/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Badge {
  id: string;
  name: string;
  icon: string; // holds emoji or class name
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin';
  badge_id?: string | null;
  created_at: string;
}

export interface Novel {
  id: string;
  author_id: string;
  title: string;
  description: string;
  cover_image: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  novel_id: string;
  comment_text: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  novel_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  novel_id: string;
  created_at: string;
}
