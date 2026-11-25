import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import accountRoutes from './routes/account.routes.js';
import favoriteRoutes from './routes/favorites.routes.js';
import supportRoutes from './routes/support.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import chatRoutes from './routes/chat.routes.js';
import storefrontSettingsRoutes from './routes/storefront-settings.routes.js';
import adminUploadsRoutes from './routes/admin-uploads.routes.js';
import { readProductImage } from './utils/product-image-storage.js';
import { notFound, errorHandler } from './middleware/error.js';

class WorkerRateLimitStore {
  constructor() {
    this.windowMs = 0;
    this.hits = new Map();
    this.requests = 0;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const now = Date.now();
    let record = this.hits.get(key);
    if (!record || record.resetAt <= now) {
      record = { totalHits: 0, resetAt: now + this.windowMs };
    }
    record.totalHits += 1;
    this.hits.set(key, record);
    this.cleanup(now);
    return { totalHits: record.totalHits, resetTime: new Date(record.resetAt) };
  }

  async decrement(key) {
    const record = this.hits.get(key);
    if (!record) return;
    record.totalHits -= 1;
    if (record.totalHits <= 0) this.hits.delete(key);
  }

  async resetKey(key) {
    this.hits.delete(key);
  }

  async get(key) {
    const record = this.hits.get(key);
    if (!record || record.resetAt <= Date.now()) return undefined;
    return { totalHits: record.totalHits, resetTime: new Date(record.resetAt) };
  }

  shutdown() {}

  cleanup(now) {
    this.requests += 1;
    if (this.requests % 100 !== 0 && this.hits.size <= 10000) return;
    for (const [key, record] of this.hits) {
      if (record.resetAt <= now || this.hits.size > 10000) this.hits.delete(key);
    }
  }
}

function createRateLimiter(options) {
  return rateLimit({ ...options, store: new WorkerRateLimitStore() });
}

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = new Set([
  ...(process.env.FRONTEND_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  'https://vayxinh.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);
app.use(cors({
  origin(origin, callback) {
    const localDevelopmentOrigin = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin || '');
    callback(null, !origin || allowedOrigins.has(origin) || localDevelopmentOrigin);
  }
}));
app.get('/uploads/products/:filename', async (req, res, next) => {
  try {
    const image = await readProductImage(req.params.filename);
    if (!image) return res.status(404).end();
    res.set('Content-Type', image.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(image.body));
  } catch (error) {
    next(error);
  }
});
app.use('/api/admin/uploads', express.json({ limit: '3mb' }), adminUploadsRoutes);
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 100 }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/chat', createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 30 }), chatRoutes);
app.use('/api/storefront/settings', storefrontSettingsRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VÁY XINH API' }));
app.use(notFound);
app.use(errorHandler);

export default app;
