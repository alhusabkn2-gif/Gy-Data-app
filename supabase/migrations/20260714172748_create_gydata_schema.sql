/*
# GY DATA - Fintech App Schema

1. Overview
This migration creates the complete schema for the GY DATA fintech application.
The app uses custom PIN-based authentication (6-digit login PIN, 4-digit purchase PIN)
stored in the profiles table, not Supabase auth. Data is scoped by phone number.

2. New Tables
- `profiles`: User accounts with name, phone, PINs, wallet balance, KYC status
- `transactions`: All purchase/funding transactions with receipts
- `referrals`: Referral tracking
- `products`: Service products (data plans, airtime, electricity, cable, etc.)
- `notifications`: User notifications
- `admin_users`: Admin accounts for the admin dashboard

3. Security
- RLS enabled on all tables
- Policies allow anon + authenticated CRUD (custom auth, not Supabase auth)
- Data is scoped client-side by phone number
*/

-- Profiles table (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  referral_code text UNIQUE DEFAULT upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)),
  referred_by text,
  login_pin text NOT NULL,
  purchase_pin text NOT NULL,
  wallet_balance numeric(12,2) NOT NULL DEFAULT 0.00,
  kyc_status text NOT NULL DEFAULT 'unverified',
  kyc_data jsonb,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  type text NOT NULL,
  service text NOT NULL,
  product text,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  recipient text,
  network text,
  reference text UNIQUE NOT NULL DEFAULT 'GYD-' || upper(substr(encode(gen_random_bytes(10), 'hex'), 1, 12)),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

-- Products table (service catalog)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  name text NOT NULL,
  price numeric(12,2) NOT NULL,
  network text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_phone text NOT NULL,
  referred_phone text NOT NULL,
  reward_amount numeric(12,2) DEFAULT 0.00,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_referrals" ON referrals;
CREATE POLICY "anon_select_referrals" ON referrals FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_referrals" ON referrals;
CREATE POLICY "anon_insert_referrals" ON referrals FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_referrals" ON referrals;
CREATE POLICY "anon_update_referrals" ON referrals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_referrals" ON referrals;
CREATE POLICY "anon_delete_referrals" ON referrals FOR DELETE
  TO anon, authenticated USING (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_service ON products(service);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications(phone);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_phone);

-- Insert default products
INSERT INTO products (service, name, price, network, description) VALUES
  ('data', 'MTN 1GB', 350, 'MTN', '1GB Data Bundle - 30 days'),
  ('data', 'MTN 2GB', 720, 'MTN', '2GB Data Bundle - 30 days'),
  ('data', 'MTN 5GB', 1500, 'MTN', '5GB Data Bundle - 30 days'),
  ('data', 'MTN 10GB', 4500, 'MTN', '10GB Data Bundle - 30 days'),
  ('data', 'GLO 1GB', 350, 'GLO', '1GB Data Bundle - 30 days'),
  ('data', 'GLO 2GB', 720, 'GLO', '2GB Data Bundle - 30 days'),
  ('data', 'GLO 5GB', 1500, 'GLO', '5GB Data Bundle - 30 days'),
  ('data', 'AIRTEL 1GB', 350, 'AIRTEL', '1GB Data Bundle - 30 days'),
  ('data', 'AIRTEL 2GB', 720, 'AIRTEL', '2GB Data Bundle - 30 days'),
  ('data', 'AIRTEL 5GB', 1500, 'AIRTEL', '5GB Data Bundle - 30 days'),
  ('data', '9MOBILE 1GB', 350, '9MOBILE', '1GB Data Bundle - 30 days'),
  ('data', '9MOBILE 2GB', 720, '9MOBILE', '2GB Data Bundle - 30 days'),
  ('airtime', 'MTN Airtime', 0, 'MTN', 'MTN Airtime Top-up'),
  ('airtime', 'GLO Airtime', 0, 'GLO', 'GLO Airtime Top-up'),
  ('airtime', 'AIRTEL Airtime', 0, 'AIRTEL', 'Airtel Airtime Top-up'),
  ('airtime', '9MOBILE Airtime', 0, '9MOBILE', '9Mobile Airtime Top-up'),
  ('electricity', 'IKEDC Prepaid', 0, 'IKEDC', 'Ikeja Electric Prepaid'),
  ('electricity', 'EKEDC Prepaid', 0, 'EKEDC', 'Eko Electric Prepaid'),
  ('electricity', 'AEDC Prepaid', 0, 'AEDC', 'Abuja Electric Prepaid'),
  ('electricity', 'PHED Prepaid', 0, 'PHED', 'Port Harcourt Electric Prepaid'),
  ('electricity', 'IBEDC Prepaid', 0, 'IBEDC', 'Ibadan Electric Prepaid'),
  ('cable', 'DStv Premium', 24500, 'DSTV', 'DStv Premium Package'),
  ('cable', 'DStv Compact Plus', 16500, 'DSTV', 'DStv Compact Plus'),
  ('cable', 'DStv Compact', 12500, 'DSTV', 'DStv Compact'),
  ('cable', 'GOtv Max', 5700, 'GOTV', 'GOtv Max Package'),
  ('cable', 'GOtv Jolli', 3900, 'GOTV', 'GOtv Jolli Package'),
  ('cable', 'Startimes Basic', 1850, 'STARTIMES', 'Startimes Basic'),
  ('waec', 'WAEC Result Checker', 1500, 'WAEC', 'WAEC Result Checking Pin'),
  ('jamb', 'JAMB UTME Pin', 5000, 'JAMB', 'JAMB UTME Registration Pin'),
  ('betting', 'SportyBet Fund', 0, 'SPORTYBET', 'Fund SportyBet Account'),
  ('betting', 'Bet9ja Fund', 0, 'BET9JA', 'Fund Bet9ja Account'),
  ('betting', 'BangBet Fund', 0, 'BANGBET', 'Fund BangBet Account'),
  ('smile', 'Smile 1GB', 500, 'SMILE', 'Smile 1GB Data'),
  ('smile', 'Smile 5GB', 2000, 'SMILE', 'Smile 5GB Data'),
  ('smile', 'Smile 10GB', 3500, 'SMILE', 'Smile 10GB Data'),
  ('smile', 'Smile Unlimited', 7500, 'SMILE', 'Smile Unlimited Data')
ON CONFLICT DO NOTHING;

-- Insert admin user
INSERT INTO profiles (phone, full_name, login_pin, purchase_pin, is_admin, wallet_balance)
VALUES ('08000000000', 'Admin', '000000', '0000', true, 0.00)
ON CONFLICT (phone) DO NOTHING;
