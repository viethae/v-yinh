import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { INVALID_VIETNAMESE_PHONE_MESSAGE, normalizeVietnameseMobilePhone } from '../utils/phone.js';

const router = Router();

router.post('/checkout', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { items: requestedItems, customer, couponCode, paymentMethod = 'COD', idempotencyKey } = req.body;
    if (!Array.isArray(requestedItems) || !requestedItems.length) return res.status(400).json({ message: 'Giỏ hàng trống' });
    const quantitiesByVariant = new Map();
    for (const item of requestedItems) {
      const variantId = Number(item.variantId);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(variantId) || variantId < 1 || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Sản phẩm hoặc số lượng trong giỏ hàng không hợp lệ' });
      }
      quantitiesByVariant.set(variantId, (quantitiesByVariant.get(variantId) || 0) + quantity);
    }
    const items = [...quantitiesByVariant].map(([variantId, quantity]) => ({ variantId, quantity }));
    if (!customer?.name || !customer?.province || !customer?.address) {
      return res.status(400).json({ message: 'Thiếu thông tin nhận hàng' });
    }
    const normalizedPhone = normalizeVietnameseMobilePhone(customer.phone);
    if (!normalizedPhone) return res.status(400).json({ message: INVALID_VIETNAMESE_PHONE_MESSAGE });
    await connection.beginTransaction();
    if (idempotencyKey) {
      const [existing] = await connection.query('SELECT id,order_code FROM orders WHERE idempotency_key=?', [idempotencyKey]);
      if (existing.length) { await connection.commit(); return res.json({ id: existing[0].id, orderCode: existing[0].order_code }); }
    }
    let subtotal = 0;
    const prepared = [];
    for (const item of items) {
      const [rows] = await connection.query(
        `SELECT pv.id,pv.stock,pv.color_name,pv.size,p.name,
         COALESCE(p.sale_price,p.base_price) price
         FROM product_variants pv JOIN products p ON p.id=pv.product_id
         WHERE pv.id=? AND p.is_active=TRUE FOR UPDATE`, [item.variantId]
      );
      if (!rows.length || rows[0].stock < item.quantity) throw Object.assign(new Error('Hết hàng'), { status: 400, publicMessage: 'Sản phẩm đã hết hàng hoặc không đủ số lượng' });
      subtotal += Number(rows[0].price) * item.quantity;
      prepared.push({ ...rows[0], quantity: item.quantity });
    }
    let discount = 0;
    if (couponCode) {
      const [coupons] = await connection.query(
        'SELECT * FROM coupons WHERE code=? AND is_active=TRUE AND start_at<=NOW() AND end_at>=NOW() AND used_count<max_usage',
        [couponCode]
      );
      if (coupons.length && subtotal >= Number(coupons[0].min_order_value)) {
        discount = coupons[0].discount_type === 'PERCENT'
          ? subtotal * Number(coupons[0].discount_value) / 100
          : Number(coupons[0].discount_value);
      } else throw Object.assign(new Error('Coupon'), { status: 400, publicMessage: 'Mã giảm giá không hợp lệ' });
    }
    discount = Math.min(discount, subtotal);
    const [shippingSettings] = await connection.query(
      `SELECT setting_key,setting_value FROM app_settings
       WHERE setting_key IN ('shipping_fee','free_shipping_threshold')`
    );
    const shippingConfig = Object.fromEntries(shippingSettings.map((setting) => [setting.setting_key, Number(setting.setting_value)]));
    const configuredFee = shippingConfig.shipping_fee;
    const configuredThreshold = shippingConfig.free_shipping_threshold;
    const shippingFee = Number.isFinite(configuredFee) && configuredFee >= 0 ? configuredFee : 30000;
    const freeShippingThreshold = Number.isFinite(configuredThreshold) && configuredThreshold >= 0 ? configuredThreshold : 500000;
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
    const total = subtotal - discount + shipping;
    const orderCode = 'AX' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const [order] = await connection.execute(
      `INSERT INTO orders(order_code,user_id,customer_name,phone,province,district,ward,address_detail,subtotal,discount_amount,shipping_fee,total_amount,coupon_code,payment_method,idempotency_key)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orderCode, customer.userId || null, customer.name, normalizedPhone, customer.province, customer.district || '', customer.ward || '', customer.address,
       subtotal, discount, shipping, total, couponCode || null, paymentMethod, idempotencyKey || uuid()]
    );
    for (const item of prepared) {
      await connection.execute(
        'INSERT INTO order_items(order_id,variant_id,product_name,color_name,size,unit_price,quantity) VALUES(?,?,?,?,?,?,?)',
        [order.insertId,item.id,item.name,item.color_name,item.size,item.price,item.quantity]
      );
      await connection.execute('UPDATE product_variants SET stock=stock-? WHERE id=?', [item.quantity,item.id]);
    }
    await connection.execute('INSERT INTO payments(order_id,provider,amount,status) VALUES(?,?,?,?)',
      [order.insertId,paymentMethod,total,paymentMethod === 'COD' ? 'PENDING' : 'PENDING']);
    if (couponCode) await connection.execute('UPDATE coupons SET used_count=used_count+1 WHERE code=?', [couponCode]);
    await connection.commit();
    res.status(201).json({ id: order.insertId, orderCode, total, subtotal, discount, shipping });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!orders.length) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (error) { next(error); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(
      `SELECT id FROM orders WHERE id=? AND user_id=? AND status IN ('CHO_XAC_NHAN','DA_XAC_NHAN') FOR UPDATE`,
      [req.params.id, req.user.id]
    );
    if (!orders.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'Đơn hàng không thể hủy ở trạng thái hiện tại' });
    }
    await connection.execute(`UPDATE orders SET status='DA_HUY' WHERE id=?`, [req.params.id]);
    const [items] = await connection.query('SELECT variant_id,quantity FROM order_items WHERE order_id=?', [req.params.id]);
    if (!pool.isD1()) {
      for (const item of items) {
        if (item.variant_id) await connection.execute('UPDATE product_variants SET stock=stock+? WHERE id=?', [item.quantity,item.variant_id]);
      }
    }
    await connection.commit();
    res.json({ message: 'Đã hủy đơn hàng' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.post('/:id/return', authenticate, async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT id FROM orders WHERE id=? AND user_id=? AND status='DA_GIAO'`,
      [req.params.id, req.user.id]
    );
    if (!orders.length) return res.status(400).json({ message: 'Đơn không đủ điều kiện gửi yêu cầu trả hàng' });
    if (!req.body.reason?.trim()) return res.status(400).json({ message: 'Vui lòng nhập lý do trả hàng' });
    await pool.execute('INSERT INTO returns(order_id,reason) VALUES(?,?)', [req.params.id, req.body.reason.trim()]);
    res.status(201).json({ message: 'Đã gửi yêu cầu trả hàng' });
  } catch (error) { next(error); }
});

export default router;
