import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT setting_key,setting_value FROM app_settings
       WHERE setting_key IN ('store_name','support_email','support_phone','shipping_fee','free_shipping_threshold')`
    );
    const settings = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
    res.json({
      store_name: settings.store_name || 'VÁY XINH',
      support_email: settings.support_email || 'hello@aoxinh.vn',
      support_phone: settings.support_phone || '1900 6868',
      shipping_fee: settings.shipping_fee || '30000',
      free_shipping_threshold: settings.free_shipping_threshold || '500000'
    });
  } catch (error) { next(error); }
});

export default router;
