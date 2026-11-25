import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id,name,slug FROM categories WHERE is_active=TRUE');
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/stock', async (req, res, next) => {
  try {
    const rawIds = String(req.query.ids || '').split(',').filter(Boolean);
    const ids = [...new Set(rawIds.map(Number))];
    if (!ids.length || ids.length > 500 || ids.some((id) => !Number.isInteger(id) || id < 1)) {
      return res.status(400).json({ message: 'Danh sách biến thể cần kiểm tra không hợp lệ' });
    }
    const [rows] = await pool.query(
      `SELECT pv.id variant_id,CASE WHEN p.is_active THEN pv.stock ELSE 0 END stock
       FROM product_variants pv JOIN products p ON p.id=pv.product_id
       WHERE pv.id IN (?)`,
      [ids]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(40, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const conditions = ['p.is_active=TRUE'];
    const params = [];
    if (req.query.category) { conditions.push('c.slug=?'); params.push(req.query.category); }
    if (req.query.search) { conditions.push('(p.name LIKE ? OR p.code LIKE ?)'); params.push(`%${req.query.search}%`, `%${req.query.search}%`); }
    if (req.query.sale === 'true') conditions.push('p.sale_price IS NOT NULL');
    if (req.query.min) { conditions.push('COALESCE(p.sale_price,p.base_price)>=?'); params.push(Number(req.query.min)); }
    if (req.query.max) { conditions.push('COALESCE(p.sale_price,p.base_price)<=?'); params.push(Number(req.query.max)); }
    let order = 'p.created_at DESC';
    if (req.query.sort === 'priceAsc') order = 'COALESCE(p.sale_price,p.base_price) ASC';
    if (req.query.sort === 'priceDesc') order = 'COALESCE(p.sale_price,p.base_price) DESC';
    if (req.query.sort === 'bestseller') order = 'p.sold_count DESC';
    const sql = `SELECT p.*, c.name category_name, c.slug category_slug,
      (SELECT image_url FROM product_images pi WHERE pi.product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) image_url,
      (SELECT image_url FROM product_images pi WHERE pi.product_id=p.id AND pi.is_primary=FALSE ORDER BY sort_order LIMIT 1) second_image_url,
      (SELECT COALESCE(AVG(r.rating),0) FROM reviews r WHERE r.product_id=p.id AND r.is_hidden=FALSE) rating,
      (SELECT SUM(stock) FROM product_variants pv WHERE pv.product_id=p.id) stock
      FROM products p JOIN categories c ON c.id=p.category_id
      WHERE ${conditions.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limit, offset]);
    const [countRows] = await pool.query(
      `SELECT COUNT(*) total FROM products p JOIN categories c ON c.id=p.category_id WHERE ${conditions.join(' AND ')}`, params
    );
    res.json({ items: rows, total: countRows[0].total, page, pages: Math.ceil(countRows[0].total / limit) });
  } catch (error) { next(error); }
});

router.get('/slug/:slug', async (req, res, next) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name category_name,c.slug category_slug,
       (SELECT COALESCE(AVG(r.rating),0) FROM reviews r WHERE r.product_id=p.id AND r.is_hidden=FALSE) rating
       FROM products p JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.is_active=TRUE`,
      [req.params.slug]
    );
    if (!products.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    const product = products[0];
    const [images] = await pool.query('SELECT id,image_url FROM product_images WHERE product_id=? ORDER BY is_primary DESC,sort_order', [product.id]);
    const [variants] = await pool.query('SELECT id,color_name,color_hex,size,stock FROM product_variants WHERE product_id=? ORDER BY color_name,size', [product.id]);
    const [reviews] = await pool.query(
      `SELECT r.rating,r.comment,r.created_at,u.full_name FROM reviews r JOIN users u ON u.id=r.user_id
       WHERE r.product_id=? AND r.is_hidden=FALSE ORDER BY r.created_at DESC LIMIT 20`, [product.id]
    );
    res.json({ ...product, images, variants, reviews });
  } catch (error) { next(error); }
});

export default router;
