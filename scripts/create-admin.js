const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

async function createAdmin() {
  try {
    // Open database
    const dbPath = path.join(__dirname, '..', 'data', 'funnel.db');
    const db = new Database(dbPath);
    
    // Hash password
    const email = 'admin@example.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate unique ID (16 random bytes in hex)
    const id = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, email_verified)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, email, hashedPassword, 'Admin User', 1);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('🔗 Login at: http://localhost:3002/auth/login');
    
    db.close();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

createAdmin();