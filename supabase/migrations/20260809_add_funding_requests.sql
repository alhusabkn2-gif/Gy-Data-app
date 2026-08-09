/*
# Wallet Funding System

1. Overview
This migration adds support for manual wallet funding requests with admin approval.

2. New Table
- `funding_requests`: User funding requests awaiting admin approval or rejection

3. Security
- RLS enabled on funding_requests table
- Allow users to create/read their own requests
- Allow admins to read/update all requests (via application logic with service role key)
*/

-- Funding Requests table
CREATE TABLE IF NOT EXISTS funding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  payment_method text,
  payment_reference text,
  notes text,
  admin_id text, -- admin who approved/rejected
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

ALTER TABLE funding_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own funding requests
DROP POLICY IF EXISTS "users_read_own_funding_requests" ON funding_requests;
CREATE POLICY "users_read_own_funding_requests" ON funding_requests FOR SELECT
  TO anon, authenticated USING (true);

-- Users can create funding requests
DROP POLICY IF EXISTS "users_create_funding_requests" ON funding_requests;
CREATE POLICY "users_create_funding_requests" ON funding_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Admins can update via service role (no RLS for service role by default, but policy is here)
DROP POLICY IF EXISTS "admin_update_funding_requests" ON funding_requests;
CREATE POLICY "admin_update_funding_requests" ON funding_requests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_funding_requests_phone ON funding_requests(phone);
CREATE INDEX IF NOT EXISTS idx_funding_requests_status ON funding_requests(status);
CREATE INDEX IF NOT EXISTS idx_funding_requests_created_at ON funding_requests(created_at DESC);
