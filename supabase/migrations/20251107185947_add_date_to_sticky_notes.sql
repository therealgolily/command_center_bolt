/*
  # Add Date Field to Sticky Notes

  ## Overview
  Adds a date field to sticky_notes table to allow notes to be assigned to specific calendar dates
  instead of just day-of-week positions.

  ## Changes
  1. Add `assigned_date` column to sticky_notes table
     - Type: date (nullable to support both calendar and kanban modes)
     - Allows notes to be assigned to specific dates in the calendar view
  
  ## Notes
  - Existing notes will have NULL assigned_date (they remain in kanban mode)
  - Notes with assigned_date will appear in calendar view
  - day_of_week and week_number remain for kanban view compatibility
*/

-- Add assigned_date column to sticky_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sticky_notes' AND column_name = 'assigned_date'
  ) THEN
    ALTER TABLE sticky_notes ADD COLUMN assigned_date date;
  END IF;
END $$;