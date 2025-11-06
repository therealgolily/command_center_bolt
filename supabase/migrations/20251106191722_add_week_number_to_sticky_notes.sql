/*
  # Add Week Number to Sticky Notes

  ## Overview
  Adds a week_number field to the sticky_notes table to support multi-week view.
  Week 0 represents the current week, week 1 represents next week, etc.

  ## Changes
  - Add `week_number` column to sticky_notes table
    - Default value: 0 (current week)
    - Allows organizing notes across multiple weeks
  
  ## Notes
  - Existing notes will automatically be assigned to week 0 (current week)
  - The week number is relative to the current week for flexibility
*/

-- Add week_number column to sticky_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sticky_notes' AND column_name = 'week_number'
  ) THEN
    ALTER TABLE sticky_notes ADD COLUMN week_number integer DEFAULT 0 NOT NULL;
  END IF;
END $$;