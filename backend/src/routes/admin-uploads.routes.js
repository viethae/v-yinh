import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { maxProductImageBytes, saveProductImage } from '../utils/product-image-storage.js';

const router = Router();
const allowedTypes = {
  'image/jpeg': { extension: 'jpg', matches: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  'image/png': { extension: 'png', matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/webp': { extension: 'webp', matches: (buffer) => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' }
};
router.use(authenticate, requireAdmin);

router.post('/product-image', async (req, res, next) => {
  try {
    const { mimeType, data } = req.body;
    const imageType = allowedTypes[mimeType];
    if (!imageType || typeof data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
      return res.status(400).json({ message: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP hợp lệ' });
    }

    const image = Buffer.from(data, 'base64');
    if (!image.length || image.length > maxProductImageBytes) {
      return res.status(413).json({ message: 'Ảnh phải có dung lượng tối đa 1,5 MB' });
    }
    if (!imageType.matches(image)) {
      return res.status(400).json({ message: 'Nội dung ảnh không khớp với định dạng tệp' });
    }

    const filename = `${crypto.randomUUID()}.${imageType.extension}`;
    await saveProductImage(filename, image, mimeType);
    res.status(201).json({ url: `/uploads/products/${filename}` });
  } catch (error) { next(error); }
});

export default router;
