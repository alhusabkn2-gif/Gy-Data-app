-- Seed internet service products
INSERT INTO products (service, name, price, network, description) VALUES
  ('internet', 'Spectranet 10GB', 5000, 'SPECTRANET', 'Spectranet 10GB - 30 days'),
  ('internet', 'Spectranet 20GB', 10000, 'SPECTRANET', 'Spectranet 20GB - 30 days'),
  ('internet', 'Spectranet Unlimited', 18000, 'SPECTRANET', 'Spectranet Unlimited - 30 days'),
  ('internet', 'Smile 5GB', 2000, 'SMILE', 'Smile 5GB - 30 days'),
  ('internet', 'Smile 10GB', 3500, 'SMILE', 'Smile 10GB - 30 days'),
  ('internet', 'Smile Unlimited', 7500, 'SMILE', 'Smile Unlimited - 30 days'),
  ('internet', 'Swift 10GB', 6000, 'SWIFT', 'Swift 10GB - 30 days'),
  ('internet', 'Swift 20GB', 11000, 'SWIFT', 'Swift 20GB - 30 days')
ON CONFLICT DO NOTHING;
