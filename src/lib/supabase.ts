import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  priority: string;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
  completed_at: string | null;
  time_block_start: string | null;
  time_block_end: string | null;
  google_calendar_event_id: string | null;
  calendar_sync_status: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  parent_task_id: string | null;
  is_paused: boolean;
  bucket_assignment: string | null;
  due_date: string | null;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  payment_method: string | null;
  monthly_rate: number | null;
  last_payment_date: string | null;
  next_expected_payment_date: string | null;
  notes: string | null;
  created_at: string;
};

export type Income = {
  id: string;
  user_id: string;
  client_id: string;
  amount: number;
  date: string;
  notes: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  client_id: string | null;
  amount: number;
  date: string;
  category: string | null;
  description: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
};

export type UserIntegration = {
  id: string;
  user_id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  google_email: string | null;
  created_at: string;
  updated_at: string;
};
