import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const key = req.query.key;
    if (!key) return res.json([]);
    const [rows] = await pool.query(
      `SELECT ci.id,ci.quantity,pv.id variant_id,pv.color_name,pv.size,pv.stock,p.id product_id,p.name,p.slug,
       COALESCE(p.sale_price,p.base_price) price,
       (SELECT image_url FROM product_images pi WHERE pi.product_id=p.id ORDER BY is_primary DESC LIMIT 1) image_url
       FROM carts c JOIN cart_items ci ON ci.cart_id=c.id
       JOIN product_variants pv ON pv.id=ci.variant_id JOIN products p ON p.id=pv.product_id
       WHERE c.session_key=?`, [key]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/items', async (req, res, next) => {
  try {
    const { sessionKey, variantId, quantity = 1 } = req.body;
    if (!sessionKey || !variantId) return res.status(400).json({ message: 'Thiếu thông tin giỏ hàng' });
    const [variants] = await pool.query('SELECT stock FROM product_variants WHERE id=?', [variantId]);
    if (!variants.length || variants[0].stock < 1) return res.status(400).json({ message: 'Sản phẩm đã hết hàng' });
    let [carts] = await pool.query('SELECT id FROM carts WHERE session_key=? LIMIT 1', [sessionKey]);
    let cartId;
    if (carts.length) cartId = carts[0].id;
    else { const [result] = await pool.execute('INSERT INTO carts(session_key) VALUES(?)', [sessionKey]); cartId = result.insertId; }
    const [existing] = await pool.query(
      'SELECT ci.id,ci.quantity FROM cart_items ci WHERE ci.cart_id=? AND ci.variant_id=?',
      [cartId, variantId]
    );
    if (existing.length) {
      const nextQuantity = existing[0].quantity + quantity;
      if (nextQuantity > variants[0].stock) {
        return res.status(400).json({ message: 'Số lượng vượt tồn kho' });
      }
      await pool.execute('UPDATE cart_items SET quantity=? WHERE id=?', [nextQuantity, existing[0].id]);
    } else {
      await pool.execute('INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES(?,?,?)',
        [cartId, variantId, Math.min(quantity, variants[0].stock)]);
    }
    res.status(201).json({ message: 'Đã thêm vào giỏ hàng' });
  } catch (error) { next(error); }
});

router.patch('/items/:id', async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Số lượng không hợp lệ' });
    const [rows] = await pool.query(
      `SELECT pv.stock FROM cart_items ci JOIN product_variants pv ON pv.id=ci.variant_id WHERE ci.id=?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ' });
    if (quantity > rows[0].stock) return res.status(400).json({ message: 'Số lượng vượt tồn kho' });
    await pool.execute('UPDATE cart_items SET quantity=? WHERE id=?', [quantity, req.params.id]);
    res.json({ message: 'Đã cập nhật số lượng' });
  } catch (error) { next(error); }
});

router.delete('/items/:id', async (req, res, next) => {
  try { await pool.execute('DELETE FROM cart_items WHERE id=?', [req.params.id]); res.status(204).end(); }
  catch (error) { next(error); }
});

export default router;
