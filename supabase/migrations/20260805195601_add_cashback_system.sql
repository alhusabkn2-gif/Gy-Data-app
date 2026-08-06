-- Add cashback_balance to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cashback_balance numeric DEFAULT 0;

-- Add cashback_percent to products (nullable, overrides service-level setting)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cashback_percent numeric DEFAULT 0;

-- Cashback settings table (admin-configurable, single row)
CREATE TABLE IF NOT EXISTS cashback_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT true,
  allow_transfer_to_wallet boolean DEFAULT true,
  data_percent numeric DEFAULT 5,
  airtime_percent numeric DEFAULT 5,
  electricity_percent numeric DEFAULT 5,
  cable_percent numeric DEFAULT 5,
  betting_percent numeric DEFAULT 0,
  waec_percent numeric DEFAULT 10,
  jamb_percent numeric DEFAULT 10,
  smile_percent numeric DEFAULT 5,
  internet_percent numeric DEFAULT 5,
  updated_at timestamptz DEFAULT now()
);

-- Seed a single settings row
INSERT INTO cashback_settings (id) VALUES (gen_random_uuid())
  ON CONFLICT (id) DO NOTHING;

-- Cashback transactions log
CREATE TABLE IF NOT EXISTS cashback_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL,
  transaction_id uuid,
  transaction_reference text,
  service text NOT NULL,
  product text NOT NULL,
  transaction_amount numeric NOT NULL,
  cashback_percent numeric NOT NULL,
  cashback_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cashback_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_transactions ENABLE ROW LEVEL SECURITY;

-- Cashback settings: everyone can read
CREATE POLICY "read_cashback_settings" ON cashback_settings FOR SELECT
  TO anon, authenticated USING (true);

-- Cashback transactions: users read their own, admin reads all
CREATE POLICY "select_own_cashback" ON cashback_transactions FOR SELECT
  TO authenticated USING (user_phone = (select auth.jwt() ->> 'phone'));

CREATE POLICY "insert_own_cashback" ON cashback_transactions FOR INSERT
  TO authenticated WITH CHECK (user_phone = (select auth.jwt() ->> 'phone'));
