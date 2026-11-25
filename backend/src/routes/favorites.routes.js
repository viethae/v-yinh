import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, (SELECT image_url FROM product_images pi WHERE pi.product_id=p.id ORDER BY is_primary DESC LIMIT 1) image_url
       FROM favorites f JOIN products p ON p.id=f.product_id WHERE f.user_id=?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/:productId', async (req, res, next) => {
  try {
    await pool.execute(
      'INSERT IGNORE INTO favorites(user_id,product_id) VALUES(?,?)',
      [req.user.id, req.params.productId]
    );
    res.status(201).json({ message: 'Đã lưu yêu thích' });
  } catch (error) { next(error); }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM favorites WHERE user_id=? AND product_id=?', [req.user.id, req.params.productId]);
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
