-- Jane Tool secure database schema draft for PostgreSQL
-- Replace demo browser/local storage with these tables before live launch.

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','finance','coordinator','viewer')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  constituency TEXT NOT NULL,
  ward TEXT,
  village TEXT,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  consent_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone, constituency)
);

CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id UUID REFERENCES supporters(id),
  phone TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'KES',
  mpesa_checkout_request_id TEXT UNIQUE,
  mpesa_receipt_number TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending_mpesa','paid','failed','cancelled','reversed')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  constituency TEXT,
  ward TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supporter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supporters_area ON supporters (constituency, ward);
CREATE INDEX idx_contributions_status ON contributions (status, created_at);
CREATE INDEX idx_volunteers_area ON volunteers (constituency, ward);
CREATE INDEX idx_messages_created ON supporter_messages (created_at);
