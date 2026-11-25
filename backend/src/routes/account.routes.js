import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { INVALID_VIETNAMESE_PHONE_MESSAGE, normalizeVietnameseMobilePhone } from '../utils/phone.js';

const router = Router();
router.use(authenticate);

router.get('/addresses', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,id DESC', [req.user.id]);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/addresses', async (req, res, next) => {
  try {
    const { recipientName, phone, province, district, ward, detailAddress, isDefault } = req.body;
    if (!recipientName?.trim() || !province?.trim() || !district?.trim() || !ward?.trim() || !detailAddress?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ địa chỉ giao hàng' });
    }
    const normalizedPhone = normalizeVietnameseMobilePhone(phone);
    if (!normalizedPhone) return res.status(400).json({ message: INVALID_VIETNAMESE_PHONE_MESSAGE });
    if (isDefault) await pool.execute('UPDATE addresses SET is_default=FALSE WHERE user_id=?', [req.user.id]);
    const [result] = await pool.execute(
      'INSERT INTO addresses(user_id,recipient_name,phone,province,district,ward,detail_address,is_default) VALUES(?,?,?,?,?,?,?,?)',
      [req.user.id, recipientName.trim(), normalizedPhone, province.trim(), district.trim(), ward.trim(), detailAddress.trim(), isDefault ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) { next(error); }
});

router.put('/addresses/:id', async (req, res, next) => {
  try {
    const { recipientName, phone, province, district, ward, detailAddress, isDefault } = req.body;
    if (!recipientName?.trim() || !province?.trim() || !district?.trim() || !ward?.trim() || !detailAddress?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ địa chỉ giao hàng' });
    }
    const normalizedPhone = normalizeVietnameseMobilePhone(phone);
    if (!normalizedPhone) return res.status(400).json({ message: INVALID_VIETNAMESE_PHONE_MESSAGE });
    if (isDefault) await pool.execute('UPDATE addresses SET is_default=FALSE WHERE user_id=?', [req.user.id]);
    await pool.execute(
      `UPDATE addresses SET recipient_name=?,phone=?,province=?,district=?,ward=?,detail_address=?,is_default=? WHERE id=? AND user_id=?`,
      [recipientName.trim(), normalizedPhone, province.trim(), district.trim(), ward.trim(), detailAddress.trim(), isDefault ? 1 : 0, req.params.id, req.user.id]
    );
    res.json({ message: 'Đã cập nhật địa chỉ' });
  } catch (error) { next(error); }
});

router.delete('/addresses/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM addresses WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
