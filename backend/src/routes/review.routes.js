import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
    }
    const [orders] = await pool.query(
      `SELECT oi.product_name,oi.variant_id,pv.product_id
       FROM orders o JOIN order_items oi ON oi.order_id=o.id
       JOIN product_variants pv ON pv.id=oi.variant_id
       WHERE o.id=? AND o.user_id=? AND o.status='DA_GIAO' LIMIT 1`,
      [orderId, req.user.id]
    );
    if (!orders.length || Number(orders[0].product_id) !== Number(productId)) {
      return res.status(403).json({ message: 'Chỉ khách hàng đã nhận sản phẩm mới được đánh giá' });
    }
    await pool.execute(
      'INSERT INTO reviews(product_id,user_id,order_id,rating,comment) VALUES(?,?,?,?,?)',
      [productId, req.user.id, orderId, rating, comment?.trim() || null]
    );
    res.status(201).json({ message: 'Cảm ơn bạn đã đánh giá sản phẩm' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm trong đơn này' });
    next(error);
  }
});

router.patch('/:id/visibility', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await pool.execute('UPDATE reviews SET is_hidden=? WHERE id=?', [req.body.isHidden ? 1 : 0, req.params.id]);
    res.json({ message: 'Đã cập nhật đánh giá' });
  } catch (error) { next(error); }
});

export default router;
