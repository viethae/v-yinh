import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.post('/validate', async (req, res, next) => {
  try {
    const subtotal = Number(req.body.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) return res.status(400).json({ message: 'Giá trị đơn hàng không hợp lệ' });
    const [rows] = await pool.query(
      `SELECT * FROM coupons WHERE code=? AND is_active=TRUE AND start_at<=NOW() AND end_at>=NOW() AND used_count<max_usage`,
      [String(req.body.code || '').trim().toUpperCase()]
    );
    if (!rows.length) return res.status(400).json({ message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
    const coupon = rows[0];
    if (subtotal < Number(coupon.min_order_value)) return res.status(400).json({ message: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(coupon.min_order_value)}đ` });
    const discount = coupon.discount_type === 'PERCENT'
      ? subtotal * Number(coupon.discount_value) / 100
      : Number(coupon.discount_value);
    res.json({ code: coupon.code, discount: Math.min(discount, subtotal), type: coupon.discount_type });
  } catch (error) { next(error); }
});

export default router;
