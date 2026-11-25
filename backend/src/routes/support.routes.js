import { Router } from 'express';
import { pool } from '../config/db.js';
import { hasPhoneValue, INVALID_VIETNAMESE_PHONE_MESSAGE, normalizeVietnameseMobilePhone } from '../utils/phone.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên, email và nội dung hỗ trợ' });
    }
    const normalizedPhone = hasPhoneValue(phone) ? normalizeVietnameseMobilePhone(phone) : null;
    if (hasPhoneValue(phone) && !normalizedPhone) {
      return res.status(400).json({ message: INVALID_VIETNAMESE_PHONE_MESSAGE });
    }
    await pool.execute(
      'INSERT INTO support_requests(name,email,phone,subject,message) VALUES(?,?,?,?,?)',
      [name.trim(), email.trim(), normalizedPhone, subject?.trim() || null, message.trim()]
    );
    res.status(201).json({ message: 'Yêu cầu hỗ trợ đã được gửi' });
  } catch (error) { next(error); }
});

export default router;
