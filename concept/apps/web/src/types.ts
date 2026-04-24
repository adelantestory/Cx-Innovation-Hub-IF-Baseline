export interface User {
  id: string;
  name: string;
  role: string;
  avatar_color?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  position: number;
  assigned_user_id?: string | null;
  assigned_user_name?: string | null;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}
