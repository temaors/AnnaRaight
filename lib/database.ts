import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Create data directory if it doesn't exist
    const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'funnel.db');
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Initialize schema
    initializeSchema(db);
  }
  
  return db;
}

function initializeSchema(database: Database.Database) {

  // Add users table for authentication
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      email_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
  `);

  // Auth schema is now included above to avoid circular dependency

  // Create tables
  database.exec(`
    -- Leads table for storing contact information
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      website TEXT,
      revenue TEXT,
      sales_calls TEXT,
      decision_maker TEXT,
      platform TEXT,
      text_messages TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    


    -- Appointments table with Google Calendar integration
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      timezone TEXT,
      status TEXT DEFAULT 'scheduled',
      google_event_id TEXT,
      google_meet_link TEXT,
      meeting_id TEXT,
      confirmation_sent INTEGER DEFAULT 0,
      reminder_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id)
    );
    


    -- Video views table for tracking video statistics
    CREATE TABLE IF NOT EXISTS video_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      video_page TEXT NOT NULL,
      view_duration INTEGER DEFAULT 0,
      view_percentage INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      ip_address TEXT,
      user_agent TEXT,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id)
    );

    -- Funnel analytics table for tracking user progression
    CREATE TABLE IF NOT EXISTS funnel_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      page_visited TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_id TEXT,
      metadata TEXT, -- JSON as TEXT
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      stripe_price_id TEXT,
      product_type TEXT CHECK (product_type IN ('main', 'upsell', 'downsell', 'bump')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      user_id TEXT REFERENCES leads(id),
      email TEXT NOT NULL,
      name TEXT,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      stripe_session_id TEXT,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order items table
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      item_type TEXT CHECK (item_type IN ('main', 'upsell', 'bump')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    -- Create triggers for updated_at columns
    CREATE TRIGGER IF NOT EXISTS update_leads_updated_at 
      AFTER UPDATE ON leads
      FOR EACH ROW
      BEGIN
        UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_appointments_updated_at 
      AFTER UPDATE ON appointments
      FOR EACH ROW
      BEGIN
        UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
      AFTER UPDATE ON products
      FOR EACH ROW
      BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_orders_updated_at 
      AFTER UPDATE ON orders
      FOR EACH ROW
      BEGIN
        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
  `);

  // Insert demo products
  const insertProducts = database.prepare(`
    INSERT OR IGNORE INTO products (id, name, description, price, original_price, product_type) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const products = [
    ['quick-start', 'Quick Start Bundle', 'Everything you need to implement the system and see results fast', 97.00, 297.00, 'main'],
    ['templates', 'Done-For-You Templates Pack', 'Save hours with our proven templates and swipe files', 27.00, 67.00, 'bump'],
    ['premium-support', 'Premium Support Package', '90 days of direct access to our expert team', 197.00, 497.00, 'upsell'],
    ['advanced-training', 'Advanced Mastery Training', 'Deep dive training for scaling to 6-figures and beyond', 297.00, 997.00, 'upsell']
  ];

  products.forEach(product => {
    insertProducts.run(...product);
  });
}

// Database operation helpers that match Supabase patterns
export class DatabaseOperations {
  private db = getDatabase();

  // Select operations
  select(table: string) {
    return {
      eq: (column: string, value: unknown) => {
        const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`);
        return { data: stmt.all(value), error: null };
      },
      data: () => {
        const stmt = this.db.prepare(`SELECT * FROM ${table}`);
        return { data: stmt.all(), error: null };
      }
    };
  }

  // Insert operations
  insert(table: string) {
    return {
      values: (values: Record<string, unknown>) => {
        try {
          const columns = Object.keys(values);
          const placeholders = columns.map(() => '?').join(', ');
          const stmt = this.db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
          const result = stmt.run(...Object.values(values));
          return { data: { ...values, id: result.lastInsertRowid }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    };
  }

  // Update operations
  update(table: string) {
    return {
      eq: (column: string, value: unknown) => ({
        set: (updates: Record<string, unknown>) => {
          try {
            const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const stmt = this.db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${column} = ?`);
            stmt.run(...Object.values(updates), value);
            return { data: updates, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    };
  }

  // Delete operations
  delete(table: string) {
    return {
      eq: (column: string, value: unknown) => {
        try {
          const stmt = this.db.prepare(`DELETE FROM ${table} WHERE ${column} = ?`);
          stmt.run(value);
          return { data: null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    };
  }

  // Raw query execution
  query(sql: string, params: unknown[] = []) {
    try {
      const stmt = this.db.prepare(sql);
      const data = stmt.all(...params);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const dbOps = new DatabaseOperations();