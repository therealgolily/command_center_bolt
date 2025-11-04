/*
  # Create Personal Finances Tables

  ## Overview
  Creates tables for tracking personal credit cards and asset accounts to monitor overall financial health.

  ## New Tables
  
  ### `credit_cards`
  - `id` (uuid, primary key) - Unique identifier for the credit card
  - `user_id` (uuid, foreign key) - References auth.users
  - `name` (text) - Name/description of the credit card (e.g., "Chase Sapphire")
  - `last_four` (text) - Last 4 digits of card number for identification
  - `balance` (numeric) - Current balance owed on the card
  - `credit_limit` (numeric, nullable) - Credit limit of the card
  - `created_at` (timestamptz) - When the record was created
  - `updated_at` (timestamptz) - When the record was last updated

  ### `asset_accounts`
  - `id` (uuid, primary key) - Unique identifier for the account
  - `user_id` (uuid, foreign key) - References auth.users
  - `name` (text) - Name of the account (e.g., "Chase Checking")
  - `account_type` (text) - Type: 'checking', 'savings', or 'investment'
  - `balance` (numeric) - Current balance in the account
  - `created_at` (timestamptz) - When the record was created
  - `updated_at` (timestamptz) - When the record was last updated

  ## Security
  - Enable RLS on both tables
  - Users can only view and manage their own financial records
  - Policies for SELECT, INSERT, UPDATE, and DELETE operations
*/

-- Create credit_cards table
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  last_four text,
  balance numeric DEFAULT 0 NOT NULL,
  credit_limit numeric,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create asset_accounts table
CREATE TABLE IF NOT EXISTS asset_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment')),
  balance numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_accounts ENABLE ROW LEVEL SECURITY;

-- Credit Cards Policies
CREATE POLICY "Users can view own credit cards"
  ON credit_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit cards"
  ON credit_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit cards"
  ON credit_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit cards"
  ON credit_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Asset Accounts Policies
CREATE POLICY "Users can view own asset accounts"
  ON asset_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset accounts"
  ON asset_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own asset accounts"
  ON asset_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own asset accounts"
  ON asset_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);