/*
  # Create Command Center Database Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, required)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `payment_method` (text, optional)
      - `monthly_rate` (numeric, optional)
      - `last_payment_date` (date, optional)
      - `next_expected_payment_date` (date, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, required)
      - `description` (text, optional)
      - `status` (text, default 'inbox')
      - `category` (text, optional)
      - `priority` (text, default 'normal')
      - `client_id` (uuid, references clients, optional)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, optional)
      - `time_block_start` (timestamp, optional)
      - `time_block_end` (timestamp, optional)
      - `google_calendar_event_id` (text, optional)
      - `calendar_sync_status` (text, default 'none')
      - `is_recurring` (boolean, default false)
      - `recurrence_rule` (text, optional)
      - `parent_task_id` (uuid, references tasks, optional)
      - `is_paused` (boolean, default false)
      - `bucket_assignment` (text, optional)
      - `due_date` (date, optional)
    
    - `expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_id` (uuid, references clients, optional)
      - `amount` (numeric, required)
      - `date` (date, required)
      - `category` (text, optional)
      - `description` (text, optional)
      - `created_at` (timestamp)
    
    - `user_integrations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `google_access_token` (text, optional)
      - `google_refresh_token` (text, optional)
      - `google_token_expiry` (timestamp, optional)
      - `google_email` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Foreign key constraints for data integrity
*/

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  payment_method text,
  monthly_rate numeric,
  last_payment_date date,
  next_expected_payment_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'inbox',
  category text,
  priority text DEFAULT 'normal',
  client_id uuid REFERENCES clients(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_block_start timestamptz,
  time_block_end timestamptz,
  google_calendar_event_id text,
  calendar_sync_status text DEFAULT 'none',
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  parent_task_id uuid REFERENCES tasks(id),
  is_paused boolean DEFAULT false,
  bucket_assignment text,
  due_date date
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  client_id uuid REFERENCES clients(id),
  amount numeric NOT NULL,
  date date NOT NULL,
  category text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  google_access_token text,
  google_refresh_token text,
  google_token_expiry timestamptz,
  google_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);
