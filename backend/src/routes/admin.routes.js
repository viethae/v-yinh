import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { hasPhoneValue, INVALID_VIETNAMESE_PHONE_MESSAGE, normalizeVietnameseMobilePhone } from '../utils/phone.js';
import { deleteProductImage, getManagedImageFilename } from '../utils/product-image-storage.js';

const router = Router();
router.use(authenticate, requireAdmin);

const toSlug = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;
const productSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
async function removeUnusedManagedImage(imageUrl) {
  const filename = getManagedImageFilename(imageUrl);
  if (!filename) return;
  const [references] = await pool.query(
    'SELECT COUNT(*) AS total FROM product_images WHERE image_url=? OR image_url LIKE ?',
    [imageUrl, `%/uploads/products/${filename}%`]
  );
  if (Number(references[0].total) > 0) return;
  await deleteProductImage(filename);
}

router.get('/stats', async (req, res, next) => {
  try {
    const [[products]] = await pool.query('SELECT COUNT(*) value FROM products');
    const [[customers]] = await pool.query('SELECT COUNT(*) value FROM users WHERE role="CUSTOMER"');
    const [[orders]] = await pool.query('SELECT COUNT(*) value FROM orders');
    const [[revenue]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) value FROM orders WHERE status="DA_GIAO"');
    const [recent] = await pool.query(
      'SELECT id,order_code,customer_name,total_amount,status,created_at FROM orders ORDER BY created_at DESC LIMIT 8'
    );
    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(created_at,'%Y-%m') month,SUM(total_amount) revenue FROM orders
       WHERE status='DA_GIAO' GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month`
    );
    res.json({ products: products.value, customers: customers.value, orders: orders.value, revenue: revenue.value, recent, monthly });
  } catch (error) { next(error); }
});

router.get('/products', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,c.name category_name,
       (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) image_url,
       (SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id=p.id) total_stock
       FROM products p JOIN categories c ON c.id=p.category_id ORDER BY p.id DESC`
    );
    const [variantColors] = await pool.query(
      'SELECT DISTINCT product_id,color_name,color_hex FROM product_variants ORDER BY product_id,color_name'
    );
    const colorsByProduct = new Map();
    for (const color of variantColors) {
      if (!colorsByProduct.has(color.product_id)) colorsByProduct.set(color.product_id, []);
      colorsByProduct.get(color.product_id).push({ name: color.color_name, hex: color.color_hex });
    }
    res.json(rows.map((product) => ({ ...product, colors: colorsByProduct.get(product.id) || [] })));
  } catch (error) { next(error); }
});

router.post('/products', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, code, categoryId, basePrice, salePrice, description, material, imageUrl, stock = 0, sizes = ['S', 'M', 'L', 'XL'] } = req.body;
    const numericPrice = Number(basePrice);
    const numericSalePrice = salePrice === '' || salePrice == null ? null : Number(salePrice);
    const numericStock = Number(stock);
    const selectedSizes = Array.isArray(sizes) ? [...new Set(sizes)] : [];
    const selectedColors = Array.isArray(req.body.colors) ? req.body.colors.map((color) => ({
      name: typeof color?.name === 'string' ? color.name.trim() : '',
      hex: typeof color?.hex === 'string' ? color.hex.trim() : ''
    })) : [];
    const uniqueColors = selectedColors.filter((color, index, list) =>
      list.findIndex((entry) => entry?.name?.trim().toLowerCase() === color?.name?.trim().toLowerCase()) === index
    );
    if (!name?.trim() || !code?.trim() || !isValidId(categoryId)
      || !Number.isFinite(numericPrice) || numericPrice < 0
      || (numericSalePrice !== null && (!Number.isFinite(numericSalePrice) || numericSalePrice < 0 || numericSalePrice > numericPrice))
      || !Number.isInteger(numericStock) || numericStock < 0
      || !selectedSizes.length || selectedSizes.some((size) => !productSizes.includes(size))
      || !uniqueColors.length || uniqueColors.some((color) => !color?.name?.trim() || !/^#[0-9a-f]{6}$/i.test(color.hex || ''))) {
      return res.status(400).json({ message: 'Thông tin sản phẩm, màu sắc, size hoặc tồn kho không hợp lệ' });
    }

    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO products(category_id,name,slug,code,description,material,base_price,sale_price,is_active)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [categoryId, name.trim(), `${toSlug(name)}-${String(code).trim().toLowerCase()}`, code.trim().toUpperCase(),
        description?.trim() || null, material?.trim() || null, numericPrice, numericSalePrice, req.body.isActive === false ? 0 : 1]
    );
    if (imageUrl?.trim()) {
      await connection.execute(
        'INSERT INTO product_images(product_id,image_url,sort_order,is_primary) VALUES(?,?,1,TRUE)',
        [result.insertId, imageUrl.trim()]
      );
    }
    for (const color of uniqueColors) {
      for (const size of selectedSizes) {
        await connection.execute(
          'INSERT INTO product_variants(product_id,color_name,color_hex,size,stock) VALUES(?,?,?,?,?)',
          [result.insertId, color.name.trim(), color.hex.toUpperCase(), size, numericStock]
        );
      }
    }
    await connection.commit();
    res.status(201).json({ id: result.insertId, message: 'Đã tạo sản phẩm' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.patch('/products/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Mã sản phẩm không hợp lệ' });
    const { name, categoryId, basePrice, salePrice, description, material, imageUrl } = req.body;
    const numericPrice = Number(basePrice);
    const numericSalePrice = salePrice === '' || salePrice == null ? null : Number(salePrice);
    if (!name?.trim() || !isValidId(categoryId) || !Number.isFinite(numericPrice) || numericPrice < 0
      || (numericSalePrice !== null && (!Number.isFinite(numericSalePrice) || numericSalePrice < 0 || numericSalePrice > numericPrice))) {
      return res.status(400).json({ message: 'Tên, danh mục và giá sản phẩm không hợp lệ' });
    }
    const newColors = Array.isArray(req.body.newColors) ? req.body.newColors.map((color) => ({
      name: typeof color?.name === 'string' ? color.name.trim() : '',
      hex: typeof color?.hex === 'string' ? color.hex.trim() : ''
    })) : [];
    const uniqueNewColors = newColors.filter((color, index, list) =>
      list.findIndex((entry) => entry?.name?.trim().toLowerCase() === color?.name?.trim().toLowerCase()) === index
    );
    if (uniqueNewColors.some((color) => !color?.name?.trim() || !/^#[0-9a-f]{6}$/i.test(color.hex || ''))) {
      return res.status(400).json({ message: 'Tên hoặc mã màu không hợp lệ' });
    }
    const [existing] = await pool.query('SELECT code FROM products WHERE id=? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    await pool.execute(
      `UPDATE products SET category_id=?,name=?,slug=?,base_price=?,sale_price=?,description=?,material=?,is_active=?
       WHERE id=?`,
      [categoryId, name.trim(), `${toSlug(name)}-${existing[0].code.toLowerCase()}`, numericPrice, numericSalePrice,
        description?.trim() || null, material?.trim() || null, req.body.isActive ? 1 : 0, req.params.id]
    );
    if (Object.prototype.hasOwnProperty.call(req.body, 'imageUrl')) {
      const [images] = await pool.query('SELECT id,image_url FROM product_images WHERE product_id=? AND is_primary=TRUE LIMIT 1', [req.params.id]);
      const oldImageUrl = images[0]?.image_url;
      if (imageUrl?.trim()) {
        if (images.length) {
          await pool.execute('UPDATE product_images SET image_url=? WHERE id=?', [imageUrl.trim(), images[0].id]);
        } else {
          await pool.execute(
            'INSERT INTO product_images(product_id,image_url,sort_order,is_primary) VALUES(?,?,1,TRUE)',
            [req.params.id, imageUrl.trim()]
          );
        }
      } else {
        if (images.length) await pool.execute('DELETE FROM product_images WHERE id=?', [images[0].id]);
        const [nextImages] = await pool.query(
          'SELECT id FROM product_images WHERE product_id=? ORDER BY sort_order,id LIMIT 1',
          [req.params.id]
        );
        if (nextImages.length) await pool.execute('UPDATE product_images SET is_primary=TRUE WHERE id=?', [nextImages[0].id]);
      }
      if (oldImageUrl && oldImageUrl !== imageUrl?.trim()) await removeUnusedManagedImage(oldImageUrl);
    }
    if (uniqueNewColors.length) {
      const [variants] = await pool.query('SELECT DISTINCT size FROM product_variants WHERE product_id=?', [req.params.id]);
      const sizes = variants.length ? variants.map((variant) => variant.size) : ['S', 'M', 'L', 'XL'];
      for (const color of uniqueNewColors) {
        for (const size of sizes) {
          await pool.execute(
            'INSERT IGNORE INTO product_variants(product_id,color_name,color_hex,size,stock) VALUES(?,?,?,?,0)',
            [req.params.id, color.name.trim(), color.hex.toUpperCase(), size]
          );
        }
      }
    }
    res.json({ message: 'Đã cập nhật sản phẩm' });
  } catch (error) { next(error); }
});

router.patch('/products/:id/status', async (req, res, next) => {
  try {
    await pool.execute('UPDATE products SET is_active=? WHERE id=?', [req.body.isActive ? 1 : 0, req.params.id]);
    res.json({ message: 'Đã cập nhật trạng thái sản phẩm' });
  } catch (error) { next(error); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*,COALESCE(payment.provider,o.payment_method) payment_provider,
       COALESCE(payment.status,'PENDING') payment_status
       FROM orders o
       LEFT JOIN payments payment ON payment.id=(
         SELECT MAX(p.id) FROM payments p WHERE p.order_id=o.id
       )
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const allowed = ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'DA_GIAO', 'DA_HUY'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT id,status FROM orders WHERE id=? FOR UPDATE', [req.params.id]);
    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (orders[0].status === 'DA_HUY' && req.body.status !== 'DA_HUY') {
      await connection.rollback();
      return res.status(400).json({ message: 'Không thể mở lại đơn hàng đã hủy' });
    }
    await connection.execute('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
    if (orders[0].status !== 'DA_HUY' && req.body.status === 'DA_HUY') {
      const [items] = await connection.query('SELECT variant_id,quantity FROM order_items WHERE order_id=?', [req.params.id]);
      if (!pool.isD1()) {
        for (const item of items) {
          if (item.variant_id) await connection.execute('UPDATE product_variants SET stock=stock+? WHERE id=?', [item.quantity, item.variant_id]);
        }
      }
    }
    await connection.commit();
    res.json({ message: 'Đã cập nhật trạng thái đơn hàng' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.patch('/orders/:id/payment-status', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const allowed = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Trạng thái thanh toán không hợp lệ' });
    await connection.beginTransaction();
    const [orders] = await connection.query(
      'SELECT id,payment_method,total_amount FROM orders WHERE id=? FOR UPDATE',
      [req.params.id]
    );
    if (!orders.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    const [payments] = await connection.query(
      'SELECT id,status FROM payments WHERE order_id=? ORDER BY id DESC LIMIT 1 FOR UPDATE',
      [req.params.id]
    );
    const currentStatus = payments[0]?.status;
    if (req.body.status === 'REFUNDED' && currentStatus !== 'SUCCESS') {
      await connection.rollback();
      return res.status(400).json({ message: 'Chỉ có thể hoàn tiền cho giao dịch đã thanh toán thành công' });
    }
    if (payments.length) {
      await connection.execute('UPDATE payments SET status=? WHERE id=?', [req.body.status, payments[0].id]);
    } else {
      await connection.execute(
        'INSERT INTO payments(order_id,provider,amount,status) VALUES(?,?,?,?)',
        [orders[0].id, orders[0].payment_method, orders[0].total_amount, req.body.status]
      );
    }
    await connection.commit();
    res.json({ message: 'Đã cập nhật trạng thái thanh toán' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.get('/customers', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id,full_name,email,phone,role,is_active,created_at FROM users WHERE role="CUSTOMER" ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/customers/:id/status', async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      'UPDATE users SET is_active=? WHERE id=? AND role="CUSTOMER"',
      [req.body.isActive ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json({ message: 'Đã cập nhật tài khoản khách hàng' });
  } catch (error) { next(error); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    const slug = toSlug(name);
    const [result] = await pool.execute(
      'INSERT INTO categories(name,slug,parent_id,is_active) VALUES(?,?,?,?)',
      [name, slug, req.body.parentId || null, req.body.isActive === false ? 0 : 1]
    );
    res.status(201).json({ id: result.insertId, message: 'Đã tạo danh mục' });
  } catch (error) { next(error); }
});

router.patch('/categories/:id', async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    const [result] = await pool.execute(
      'UPDATE categories SET name=?,slug=?,is_active=? WHERE id=?',
      [name, toSlug(name), req.body.isActive ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json({ message: 'Đã cập nhật danh mục' });
  } catch (error) { next(error); }
});

router.get('/coupons', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/coupons', async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue = 0, maxUsage = 100, startAt, endAt } = req.body;
    const value = Number(discountValue);
    const minimum = Number(minOrderValue);
    const usageLimit = Number(maxUsage);
    if (!code?.trim() || !['PERCENT', 'FIXED'].includes(discountType) || !Number.isFinite(value) || value <= 0
      || (discountType === 'PERCENT' && value > 100) || !Number.isFinite(minimum) || minimum < 0
      || !Number.isInteger(usageLimit) || usageLimit < 1
      || !startAt || !endAt || new Date(endAt) <= new Date(startAt)) {
      return res.status(400).json({ message: 'Thông tin mã giảm giá không hợp lệ' });
    }
    await pool.execute(
      `INSERT INTO coupons(code,discount_type,discount_value,min_order_value,max_usage,start_at,end_at,is_active)
       VALUES(?,?,?,?,?,?,?,?)`,
      [code.trim().toUpperCase(), discountType, value, minimum, usageLimit, startAt, endAt, req.body.isActive ? 1 : 0]
    );
    res.status(201).json({ message: 'Đã tạo mã giảm giá' });
  } catch (error) { next(error); }
});

router.patch('/coupons/:id', async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue = 0, maxUsage = 100, startAt, endAt } = req.body;
    const value = Number(discountValue);
    const minimum = Number(minOrderValue);
    const usageLimit = Number(maxUsage);
    if (!code?.trim() || !['PERCENT', 'FIXED'].includes(discountType) || !Number.isFinite(value) || value <= 0
      || (discountType === 'PERCENT' && value > 100) || !Number.isFinite(minimum) || minimum < 0
      || !Number.isInteger(usageLimit) || usageLimit < 1
      || !startAt || !endAt || new Date(endAt) <= new Date(startAt)) {
      return res.status(400).json({ message: 'Thông tin mã giảm giá không hợp lệ' });
    }
    const [result] = await pool.execute(
      `UPDATE coupons SET code=?,discount_type=?,discount_value=?,min_order_value=?,max_usage=?,start_at=?,end_at=?,is_active=?
       WHERE id=?`,
      [code.trim().toUpperCase(), discountType, value, minimum, usageLimit, startAt, endAt, req.body.isActive ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
    res.json({ message: 'Đã cập nhật mã giảm giá' });
  } catch (error) { next(error); }
});

router.get('/inventory', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT pv.id variant_id,pv.product_id,p.name product_name,p.code,pv.color_name,pv.size,pv.stock
       FROM product_variants pv JOIN products p ON p.id=pv.product_id ORDER BY p.name,pv.color_name,pv.size`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/inventory/:variantId', async (req, res, next) => {
  try {
    const stock = Number(req.body.stock);
    if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ message: 'Tồn kho phải là số nguyên không âm' });
    const [result] = await pool.execute('UPDATE product_variants SET stock=? WHERE id=?', [stock, req.params.variantId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy biến thể sản phẩm' });
    res.json({ message: 'Đã cập nhật tồn kho' });
  } catch (error) { next(error); }
});

router.get('/receipts', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*,p.name product_name,p.code,pv.color_name,pv.size,u.full_name created_by_name
       FROM inventory_receipts r JOIN product_variants pv ON pv.id=r.variant_id
       JOIN products p ON p.id=pv.product_id LEFT JOIN users u ON u.id=r.created_by
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/receipts', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const variantId = Number(req.body.variantId);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Biến thể và số lượng nhập không hợp lệ' });
    }
    await connection.beginTransaction();
    const [variants] = await connection.query('SELECT id FROM product_variants WHERE id=? FOR UPDATE', [variantId]);
    if (!variants.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy biến thể sản phẩm' });
    }
    await connection.execute(
      'INSERT INTO inventory_receipts(variant_id,quantity,supplier,notes,created_by) VALUES(?,?,?,?,?)',
      [variantId, quantity, req.body.supplier?.trim() || null, req.body.notes?.trim() || null, req.user.id]
    );
    await connection.execute('UPDATE product_variants SET stock=stock+? WHERE id=?', [quantity, variantId]);
    await connection.commit();
    res.status(201).json({ message: 'Đã tạo phiếu nhập và cộng tồn kho' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
});

router.get('/flash-sales', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM flash_sales ORDER BY starts_at DESC');
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/flash-sales', async (req, res, next) => {
  try {
    const { title, discountType, discountValue, startsAt, endsAt } = req.body;
    const value = Number(discountValue);
    if (!title?.trim() || !['PERCENT', 'FIXED'].includes(discountType) || !Number.isFinite(value) || value <= 0
      || (discountType === 'PERCENT' && value > 100)
      || !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) {
      return res.status(400).json({ message: 'Thông tin flash sale không hợp lệ' });
    }
    const [result] = await pool.execute(
      'INSERT INTO flash_sales(title,discount_type,discount_value,starts_at,ends_at,is_active) VALUES(?,?,?,?,?,?)',
      [title.trim(), discountType, value, startsAt, endsAt, req.body.isActive ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Đã tạo chương trình flash sale' });
  } catch (error) { next(error); }
});

router.patch('/flash-sales/:id', async (req, res, next) => {
  try {
    const { title, discountType, discountValue, startsAt, endsAt } = req.body;
    const value = Number(discountValue);
    if (!title?.trim() || !['PERCENT', 'FIXED'].includes(discountType) || !Number.isFinite(value) || value <= 0
      || (discountType === 'PERCENT' && value > 100)
      || !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) {
      return res.status(400).json({ message: 'Thông tin flash sale không hợp lệ' });
    }
    const [result] = await pool.execute(
      'UPDATE flash_sales SET title=?,discount_type=?,discount_value=?,starts_at=?,ends_at=?,is_active=? WHERE id=?',
      [title.trim(), discountType, value, startsAt, endsAt, req.body.isActive ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy flash sale' });
    res.json({ message: 'Đã cập nhật flash sale' });
  } catch (error) { next(error); }
});

router.get('/warranty', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id,r.order_id,r.reason,r.status,r.created_at,o.order_code,o.customer_name,o.phone
       FROM returns r JOIN orders o ON o.id=r.order_id ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/warranty/:id/status', async (req, res, next) => {
  try {
    if (!['CHO_XU_LY', 'DA_DUYET', 'TU_CHOI'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Trạng thái bảo hành không hợp lệ' });
    }
    const [result] = await pool.execute('UPDATE returns SET status=? WHERE id=?', [req.body.status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy yêu cầu bảo hành' });
    res.json({ message: 'Đã cập nhật yêu cầu bảo hành' });
  } catch (error) { next(error); }
});

router.get('/reviews', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id,r.product_id,r.user_id,r.order_id,r.rating,r.comment,r.is_hidden,r.created_at,
       p.name product_name,u.full_name customer_name,u.email
       FROM reviews r JOIN products p ON p.id=r.product_id JOIN users u ON u.id=r.user_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/reviews/:id/visibility', async (req, res, next) => {
  try {
    const [result] = await pool.execute('UPDATE reviews SET is_hidden=? WHERE id=?', [req.body.isHidden ? 1 : 0, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    res.json({ message: 'Đã cập nhật hiển thị đánh giá' });
  } catch (error) { next(error); }
});

router.get('/banners', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort_order,id');
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/banners', async (req, res, next) => {
  try {
    const { title, imageUrl } = req.body;
    if (!title?.trim() || !imageUrl?.trim()) return res.status(400).json({ message: 'Tiêu đề và ảnh banner không được để trống' });
    const [result] = await pool.execute(
      'INSERT INTO banners(title,subtitle,image_url,link_url,sort_order,is_active) VALUES(?,?,?,?,?,?)',
      [title.trim(), req.body.subtitle?.trim() || null, imageUrl.trim(), req.body.linkUrl?.trim() || null, Number(req.body.sortOrder) || 0, req.body.isActive ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Đã tạo banner' });
  } catch (error) { next(error); }
});

router.patch('/banners/:id', async (req, res, next) => {
  try {
    const { title, imageUrl } = req.body;
    if (!title?.trim() || !imageUrl?.trim()) return res.status(400).json({ message: 'Tiêu đề và ảnh banner không được để trống' });
    const [result] = await pool.execute(
      'UPDATE banners SET title=?,subtitle=?,image_url=?,link_url=?,sort_order=?,is_active=? WHERE id=?',
      [title.trim(), req.body.subtitle?.trim() || null, imageUrl.trim(), req.body.linkUrl?.trim() || null, Number(req.body.sortOrder) || 0, req.body.isActive ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy banner' });
    res.json({ message: 'Đã cập nhật banner' });
  } catch (error) { next(error); }
});

router.delete('/banners/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM banners WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy banner' });
    res.json({ message: 'Đã xóa banner' });
  } catch (error) { next(error); }
});

router.get('/blog', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blog_posts ORDER BY updated_at DESC');
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/blog', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: 'Tiêu đề và nội dung bài viết không được để trống' });
    const [result] = await pool.execute(
      `INSERT INTO blog_posts(title,slug,summary,content,cover_image,status)
       VALUES(?,?,?,?,?,?)`,
      [title.trim(), `${toSlug(title)}-${Date.now()}`, req.body.summary?.trim() || null, content.trim(),
        req.body.coverImage?.trim() || null, req.body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT']
    );
    res.status(201).json({ id: result.insertId, message: 'Đã tạo bài viết' });
  } catch (error) { next(error); }
});

router.patch('/blog/:id', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: 'Tiêu đề và nội dung bài viết không được để trống' });
    const [result] = await pool.execute(
      `UPDATE blog_posts SET title=?,slug=?,summary=?,content=?,cover_image=?,status=? WHERE id=?`,
      [title.trim(), toSlug(title), req.body.summary?.trim() || null, content.trim(), req.body.coverImage?.trim() || null,
        req.body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    res.json({ message: 'Đã cập nhật bài viết' });
  } catch (error) { next(error); }
});

router.delete('/blog/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM blog_posts WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    res.json({ message: 'Đã xóa bài viết' });
  } catch (error) { next(error); }
});

router.get('/staff', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id,full_name,email,phone,role,is_active,created_at FROM users
       WHERE role='ADMIN' ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/staff', async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const phone = hasPhoneValue(req.body.phone) ? normalizeVietnameseMobilePhone(req.body.phone) : null;
    if (!fullName?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ message: 'Nhập họ tên, email và mật khẩu nhân viên tối thiểu 8 ký tự' });
    }
    if (hasPhoneValue(req.body.phone) && !phone) return res.status(400).json({ message: INVALID_VIETNAMESE_PHONE_MESSAGE });
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users(full_name,email,phone,password_hash,role) VALUES(?,?,?,?,?)',
      [fullName.trim(), email.trim().toLowerCase(), phone, passwordHash, 'ADMIN']
    );
    res.status(201).json({ id: result.insertId, message: 'Đã tạo tài khoản nhân viên' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email này đã được sử dụng' });
    next(error);
  }
});

router.patch('/staff/:id/status', async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id) && !req.body.isActive) {
      return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản đang đăng nhập' });
    }
    const [result] = await pool.execute(
      'UPDATE users SET is_active=? WHERE id=? AND role="ADMIN"',
      [req.body.isActive ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    res.json({ message: 'Đã cập nhật trạng thái nhân viên' });
  } catch (error) { next(error); }
});

router.get('/support', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM support_requests ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/support/:id/status', async (req, res, next) => {
  try {
    if (!['MO', 'DA_XU_LY'].includes(req.body.status)) return res.status(400).json({ message: 'Trạng thái hỗ trợ không hợp lệ' });
    const [result] = await pool.execute('UPDATE support_requests SET status=? WHERE id=?', [req.body.status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ' });
    res.json({ message: 'Đã cập nhật yêu cầu hỗ trợ' });
  } catch (error) { next(error); }
});

router.get('/settings', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT setting_key,setting_value FROM app_settings ORDER BY setting_key');
    res.json(Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value])));
  } catch (error) { next(error); }
});

router.put('/settings', async (req, res, next) => {
  try {
    const allowed = ['store_name', 'support_email', 'support_phone', 'shipping_fee', 'free_shipping_threshold'];
    const entries = Object.entries(req.body).filter(([key, value]) => allowed.includes(key) && typeof value === 'string');
    if (!entries.length) return res.status(400).json({ message: 'Không có cài đặt hợp lệ để lưu' });
    for (const [key, value] of entries) {
      if (['shipping_fee', 'free_shipping_threshold'].includes(key) && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        return res.status(400).json({ message: 'Phí giao hàng và ngưỡng miễn phí phải là số không âm' });
      }
      if (key === 'support_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return res.status(400).json({ message: 'Email hỗ trợ không hợp lệ' });
      }
      if (key === 'store_name' && !value.trim()) return res.status(400).json({ message: 'Tên cửa hàng không được để trống' });
    }
    for (const [key, value] of entries) {
      await pool.execute(
        `INSERT INTO app_settings(setting_key,setting_value) VALUES(?,?)
         ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
        [key, value.trim()]
      );
    }
    res.json({ message: 'Đã lưu cài đặt cửa hàng' });
  } catch (error) { next(error); }
});

export default router;
