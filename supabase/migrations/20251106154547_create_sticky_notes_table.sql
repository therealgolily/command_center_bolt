/*
  # Create Sticky Notes Table

  ## Overview
  Creates a table for sticky notes that can be organized in a weekly Kanban board.

  ## New Tables
  
  ### `sticky_notes`
  - `id` (uuid, primary key) - Unique identifier for the sticky note
  - `user_id` (uuid, foreign key) - References auth.users
  - `content` (text) - The note content
  - `day_of_week` (text) - Which day column: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  - `position` (integer) - Order position within the day column
  - `color` (text) - Note color: 'yellow', 'pink', 'blue', 'green', 'orange', 'purple'
  - `created_at` (timestamptz) - When the note was created
  - `updated_at` (timestamptz) - When the note was last updated

  ## Security
  - Enable RLS on sticky_notes table
  - Users can only view and manage their own sticky notes
  - Policies for SELECT, INSERT, UPDATE, and DELETE operations
*/

-- Create sticky_notes table
CREATE TABLE IF NOT EXISTS sticky_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  position integer DEFAULT 0 NOT NULL,
  color text DEFAULT 'yellow' NOT NULL CHECK (color IN ('yellow', 'pink', 'blue', 'green', 'orange', 'purple')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Sticky Notes Policies
CREATE POLICY "Users can view own sticky notes"
  ON sticky_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sticky notes"
  ON sticky_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sticky notes"
  ON sticky_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sticky notes"
  ON sticky_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);