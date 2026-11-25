import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

try {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || 'Quản trị Áo Xinh';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
    throw new Error('Set ADMIN_EMAIL to a valid email and ADMIN_PASSWORD to at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await pool.query('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
  if (existing.length) {
    await pool.execute(
      'UPDATE users SET full_name=?,password_hash=?,role="ADMIN",is_active=TRUE WHERE id=?',
      [fullName, passwordHash, existing[0].id]
    );
  } else {
    await pool.execute(
      'INSERT INTO users(full_name,email,password_hash,role,is_active) VALUES(?,?,?,"ADMIN",TRUE)',
      [fullName, email, passwordHash]
    );
  }
  console.log(`Admin account ready: ${email}`);
} catch (error) {
  console.error('Admin account setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
