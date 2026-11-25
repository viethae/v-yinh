import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { getRuntimeVariable } from '../config/runtime.js';
import { authenticate } from '../middleware/auth.js';
import { hasPhoneValue, INVALID_VIETNAMESE_PHONE_MESSAGE, normalizeVietnameseMobilePhone } from '../utils/phone.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin và mật khẩu từ 6 ký tự' });
    }
    const normalizedPhone = hasPhoneValue(phone) ? normalizeVietnameseMobilePhone(phone) : null;
    if (hasPhoneValue(phone) && !normalizedPhone) {
      return res.status(400).json({ message: INVALID_VIETNAMESE_PHONE_MESSAGE });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE email=? LIMIT 1', [email.toLowerCase()]);
    if (existing.length) return res.status(409).json({ message: 'Email đã được sử dụng' });
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users(full_name,email,phone,password_hash) VALUES(?,?,?,?)',
      [fullName.trim(), email.trim().toLowerCase(), normalizedPhone, passwordHash]
    );
    const user = { id: result.insertId, fullName, email: email.toLowerCase(), role: 'CUSTOMER' };
    const token = jwt.sign({ id: user.id, role: user.role }, getRuntimeVariable('JWT_SECRET'), { expiresIn: getRuntimeVariable('JWT_EXPIRES_IN') || '7d' });
    res.status(201).json({ token, user });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    const [rows] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password_hash) || !user.is_active) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, getRuntimeVariable('JWT_SECRET'), { expiresIn: getRuntimeVariable('JWT_EXPIRES_IN') || '7d' });
    res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) { next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email=? LIMIT 1', [req.body.email?.toLowerCase()]);
    if (rows.length) {
      const token = crypto.randomBytes(24).toString('hex');
      await pool.execute('UPDATE users SET reset_token=?, reset_token_expires=? WHERE id=?',
        [token, new Date(Date.now() + 60 * 60 * 1000), rows[0].id]);
    }
    res.json({ message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được chuẩn bị.' });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id,full_name,email,phone,role,is_active FROM users WHERE id=?', [req.user.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    if (!fullName?.trim()) return res.status(400).json({ message: 'Họ tên không được để trống' });
    const normalizedPhone = hasPhoneValue(phone) ? normalizeVietnameseMobilePhone(phone) : null;
    if (hasPhoneValue(phone) && !normalizedPhone) {
      return res.status(400).json({ message: INVALID_VIETNAMESE_PHONE_MESSAGE });
    }
    await pool.execute('UPDATE users SET full_name=?,phone=? WHERE id=?',
      [fullName.trim(), normalizedPhone, req.user.id]);
    res.json({ message: 'Đã cập nhật thông tin cá nhân' });
  } catch (error) { next(error); }
});

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự' });
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
    if (!rows.length || !await bcrypt.compare(currentPassword || '', rows[0].password_hash)) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password_hash=? WHERE id=?', [passwordHash, req.user.id]);
    res.json({ message: 'Đã đổi mật khẩu' });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) return res.status(400).json({ message: 'Thông tin đặt lại mật khẩu không hợp lệ' });
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE reset_token=? AND reset_token_expires>NOW() LIMIT 1', [token]
    );
    if (!rows.length) return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute('UPDATE users SET password_hash=?,reset_token=NULL,reset_token_expires=NULL WHERE id=?',
      [passwordHash, rows[0].id]);
    res.json({ message: 'Đã đặt lại mật khẩu' });
  } catch (error) { next(error); }
});

export default router;
