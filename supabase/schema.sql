-- Funnel Master Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table for storing opt-in information
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  funnel_stage VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Funnel analytics table for tracking user progression
CREATE TABLE IF NOT EXISTS funnel_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255),
  page_visited VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table for scheduling
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES leads(id),
  email VARCHAR(255),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  stripe_price_id VARCHAR(255),
  product_type VARCHAR(50) CHECK (product_type IN ('main', 'upsell', 'downsell', 'bump')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES leads(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  item_type VARCHAR(50) CHECK (item_type IN ('main', 'upsell', 'bump')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_email ON funnel_analytics(email);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_page ON funnel_analytics(page_visited);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_timestamp ON funnel_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Insert demo products
INSERT INTO products (id, name, description, price, original_price, product_type) VALUES
  ('quick-start', 'Quick Start Bundle', 'Everything you need to implement the system and see results fast', 97.00, 297.00, 'main'),
  ('templates', 'Done-For-You Templates Pack', 'Save hours with our proven templates and swipe files', 27.00, 67.00, 'bump'),
  ('premium-support', 'Premium Support Package', '90 days of direct access to our expert team', 197.00, 497.00, 'upsell'),
  ('advanced-training', 'Advanced Mastery Training', 'Deep dive training for scaling to 6-figures and beyond', 297.00, 997.00, 'upsell')
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for products
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (active = true);

-- Allow anonymous inserts for leads and analytics (for funnel tracking)
DROP POLICY IF EXISTS "Anonymous can insert leads" ON leads;
CREATE POLICY "Anonymous can insert leads" ON leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anonymous can insert analytics" ON funnel_analytics;
CREATE POLICY "Anonymous can insert analytics" ON funnel_analytics
  FOR INSERT WITH CHECK (true);

-- Allow anonymous inserts for appointments (for scheduling)
DROP POLICY IF EXISTS "Anonymous can insert appointments" ON appointments;
CREATE POLICY "Anonymous can insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Allow anonymous inserts for orders (for checkout)
DROP POLICY IF EXISTS "Anonymous can insert orders" ON orders;
CREATE POLICY "Anonymous can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anonymous can insert order_items" ON order_items;
CREATE POLICY "Anonymous can insert order_items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Note: Add more specific RLS policies based on your authentication needs