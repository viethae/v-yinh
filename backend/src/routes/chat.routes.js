import { Router } from 'express';
import { pool } from '../config/db.js';
import { getRuntimeVariable } from '../config/runtime.js';

const router = Router();

const STORE_INFORMATION = [
  'Danh mục hiện có: thời trang nữ và bé gái.',
  'Miễn phí vận chuyển từ 500.000đ; đơn thấp hơn có phí vận chuyển 30.000đ.',
  'Thanh toán khi nhận hàng (COD), VNPay và MoMo; VNPay/MoMo hiện đang ở chế độ thử nghiệm.',
  'Liên hệ cửa hàng: hotline 1900 6868, email hello@aoxinh.vn; giờ làm việc 8:30–21:00.',
  'Khách hàng có thể xem đơn hàng, cập nhật hồ sơ, đổi mật khẩu và quản lý địa chỉ trong mục Tài khoản.',
  'Website chưa công bố chi tiết điều kiện đổi trả hoặc thời gian giao hàng; khách cần liên hệ cửa hàng để xác nhận.'
].join('\n');

const normalizeText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase();

function getBudget(message) {
  const match = message.match(/(?:duoi|toi da|tam gia|ngan sach|under|budget)\s*(\d[\d.,]*)\s*(k|nghin|ngan|trieu|tr|m|d|dong)?\b/);
  if (!match) return null;
  const amount = Number(match[1].replace(/[.,]/g, ''));
  if (!Number.isFinite(amount)) return null;
  if (['k', 'nghin', 'ngan'].includes(match[2])) return amount * 1000;
  if (['trieu', 'tr', 'm'].includes(match[2])) return amount * 1000000;
  return amount;
}

function getLocalReply(message, catalog) {
  const query = normalizeText(message);
  if (/^(xin chao|chao|hello|hi)\b/.test(query)) {
    return {
      reply: 'Chào bạn! Mình có thể tìm sản phẩm theo giá, chất liệu, màu và size còn hàng; đồng thời trả lời về giao hàng, thanh toán và tài khoản. Bạn đang cần tìm gì?',
      products: []
    };
  }

  if (/doi tra|tra hang|hoan tien|bao mat|chinh sach/.test(query)) {
    return {
      reply: 'Website chưa công bố chi tiết chính sách đổi trả hoặc bảo mật. Bạn vui lòng liên hệ hotline 1900 6868 hoặc hello@aoxinh.vn để được xác nhận.',
      products: []
    };
  }
  if (/thanh toan|cod|vnpay|momo/.test(query)) {
    return {
      reply: 'Website hỗ trợ thanh toán khi nhận hàng (COD), VNPay và MoMo. VNPay/MoMo hiện đang ở chế độ thử nghiệm.',
      products: []
    };
  }
  if (/lien he|hotline|email|gio lam viec/.test(query)) {
    return {
      reply: 'Bạn có thể liên hệ hotline 1900 6868 hoặc email hello@aoxinh.vn. Giờ làm việc được ghi trên website là 8:30–21:00.',
      products: []
    };
  }
  if (/van chuyen|phi ship|giao hang/.test(query)) {
    return {
      reply: 'Đơn hàng từ 500.000đ được miễn phí vận chuyển; đơn thấp hơn có phí 30.000đ. Website chưa nêu thời gian giao hàng cụ thể.',
      products: []
    };
  }
  if (/don hang|theo doi don/.test(query)) {
    return {
      reply: 'Bạn có thể xem trạng thái và chi tiết đơn hàng trong mục Tài khoản → Đơn hàng của tôi sau khi đăng nhập.',
      products: []
    };
  }
  if (/dia chi|doi mat khau|tai khoan/.test(query)) {
    return {
      reply: 'Trong mục Tài khoản, bạn có thể cập nhật hồ sơ, đổi mật khẩu, thêm hoặc chỉnh sửa địa chỉ giao hàng và xem đơn hàng.',
      products: []
    };
  }
  if (/danh muc|cac loai hang|co nhung danh muc/.test(query)) {
    const categories = [...new Set(catalog.map((product) => product.category_name))];
    return {
      reply: `Website hiện có các danh mục: ${categories.join(' và ')}.`,
      products: []
    };
  }
  if (/bao nhieu san pham|co bao nhieu mau/.test(query)) {
    return {
      reply: `Hiện danh mục đang có ${catalog.length} sản phẩm đang hoạt động.`,
      products: []
    };
  }
  if (/\bkg\b|can nang/.test(query) && /size|mac/.test(query)) {
    return {
      reply: 'Mình chưa có bảng quy đổi size theo cân nặng trên website. Size còn hàng khác nhau theo từng mẫu; bạn hãy xem thông tin kích cỡ trên trang sản phẩm hoặc liên hệ cửa hàng để được tư vấn chính xác.',
      products: []
    };
  }

  const productIntent = /\b(size|kich co|mau sac|con hang|ton kho|gia|chat lieu|san pham|ao|vay|dam|quan|chan vay|be gai|tre em|nu|duoi|ngan sach|tam gia|toi da)\b/.test(query);
  if (!productIntent) {
    return {
      reply: 'Mình có thể tư vấn sản phẩm, giá, chất liệu, màu/size còn hàng, giao hàng, thanh toán, đơn hàng và thông tin liên hệ. Bạn có thể hỏi như “váy xanh size M dưới 700k” hoặc “phí giao hàng bao nhiêu?”.',
      products: []
    };
  }

  const sizeMatch = query.match(/\b(?:size|co)\s*(xxl|xl|xs|s|m|l)\b/);
  const requestedSize = sizeMatch?.[1]?.toUpperCase();
  const budget = getBudget(query);
  const queryWords = new Set(query.match(/[a-z0-9]+/g));
  const availableColors = [...new Set(catalog.flatMap((product) => product.variants.map((variant) => normalizeText(variant.color))))]
    .flatMap((color) => color.split(/\s+/))
    .filter((color) => color.length >= 2 && queryWords.has(color));
  const wantsGirls = /\b(be gai|tre em)\b/.test(query);
  const wantsWomen = /\bnu\b/.test(query);
  const ignoredWords = new Set(['toi', 'muon', 'tim', 'tu', 'van', 'mua', 'co', 'nao', 'gi', 'giup', 'cho', 'minh', 'ban', 'mot', 'mau', 'cai', 'loai', 'san', 'pham', 'size', 'kich', 'duoi', 'da', 'tam', 'gia', 'ngan', 'sach', 'sac', 'under', 'budget']);
  const tokens = query.match(/[a-z0-9]+/g).filter((token) => token.length > 2 && !/^\d/.test(token) && !ignoredWords.has(token));
  const matches = catalog.map((product) => {
    const name = normalizeText(product.name);
    const description = normalizeText(`${product.description || ''} ${product.material || ''}`);
    const category = normalizeText(product.category_name);
    const colors = normalizeText(product.variants.map((variant) => variant.color).join(' '));
    let score = tokens.reduce((total, token) => total + (name.includes(token) ? 3 : category.includes(token) ? 2 : description.includes(token) ? 1 : colors.includes(token) ? 2 : 0), 0);
    if (query.includes(normalizeText(product.code))) score += 5;
    return { product, score };
  }).filter(({ product, score }) => {
    if (score === 0 && tokens.length) return false;
    if (budget && product.price > budget) return false;
    if (requestedSize && !product.variants.some((variant) => variant.size === requestedSize)) return false;
    if (availableColors.length && !product.variants.some((variant) => availableColors.some((color) => normalizeText(variant.color).split(/\s+/).includes(color)))) return false;
    if (wantsGirls && product.category_slug !== 'be-gai') return false;
    if (wantsWomen && product.category_slug !== 'nu') return false;
    return product.variants.length > 0;
  }).sort((a, b) => b.score - a.score || a.product.price - b.product.price).slice(0, 3).map(({ product }) => product);

  if (!matches.length) {
    return {
      reply: 'Mình chưa tìm thấy sản phẩm còn hàng khớp với yêu cầu này. Bạn thử cho mình biết danh mục, ngân sách, màu hoặc size khác nhé.',
      products: []
    };
  }
  const details = matches.map((product) => {
    const colors = [...new Set(product.variants.map((variant) => variant.color))].join(', ');
    const sizes = [...new Set(product.variants.map((variant) => variant.size))].join(', ');
    return `${product.name} — ${new Intl.NumberFormat('vi-VN').format(product.price)}đ; màu: ${colors}; size còn hàng: ${sizes}.`;
  });
  return {
    reply: `Mình tìm được sản phẩm đang còn hàng phù hợp:\n${details.join('\n')}`,
    products: matches
  };
}

router.get('/status', (req, res) => {
  res.json({ available: true, mode: getRuntimeVariable('OPENAI_API_KEY') ? 'ai' : 'catalog' });
});

router.post('/', async (req, res, next) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 1000) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung tối đa 1.000 ký tự.' });
    }

    const [products] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.code, p.description, p.material, p.base_price, p.sale_price,
        c.name category_name, c.slug category_slug,
        (SELECT image_url FROM product_images pi
          WHERE pi.product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) image_url
       FROM products p
       JOIN categories c ON c.id=p.category_id
       WHERE p.is_active=TRUE AND c.is_active=TRUE
       ORDER BY CASE WHEN p.code LIKE 'VX%' THEN 0 ELSE 1 END, p.created_at DESC
       `
    );
    if (!products.length && !getRuntimeVariable('OPENAI_API_KEY')) {
      return res.json(getLocalReply(message, []));
    }
    if (!products.length) {
      return res.json({ reply: 'Hiện cửa hàng chưa có sản phẩm để tư vấn.', products: [] });
    }

    const productIds = products.map((product) => product.id);
    const [variants] = await pool.query(
      `SELECT product_id, color_name, size, stock FROM product_variants
       WHERE product_id IN (${productIds.map(() => '?').join(',')}) AND stock > 0`,
      productIds
    );
    const variantsByProduct = new Map();
    for (const variant of variants) {
      const current = variantsByProduct.get(variant.product_id) || [];
      current.push({ color: variant.color_name, size: variant.size, stock: variant.stock });
      variantsByProduct.set(variant.product_id, current);
    }

    const catalog = products.map((product) => ({
      ...product,
      price: Number(product.sale_price || product.base_price),
      variants: variantsByProduct.get(product.id) || []
    }));
    if (!getRuntimeVariable('OPENAI_API_KEY')) {
      return res.json(getLocalReply(message, catalog));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${getRuntimeVariable('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: getRuntimeVariable('OPENAI_MODEL') || 'gpt-4o-mini',
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Bạn là stylist và trợ lý cửa hàng Váy Xinh, trả lời bằng tiếng Việt thân thiện, ngắn gọn. Chỉ dùng thông tin trang web và danh mục JSON bên dưới; không tự đoán giá, hàng tồn, chính sách hay thông tin cá nhân. Nếu website không có câu trả lời, hãy nói rõ và hướng khách đến hotline 1900 6868 hoặc hello@aoxinh.vn. Chỉ giới thiệu sản phẩm đang còn hàng và phù hợp. Trả lời duy nhất JSON theo dạng {"reply":"lời tư vấn","productCodes":["mã sản phẩm"]}, tối đa 4 mã.\n\nThông tin cửa hàng:\n${STORE_INFORMATION}`
            },
            {
              role: 'user',
              content: `Danh mục sản phẩm thực tế (giá tính bằng VNĐ):\n${JSON.stringify(catalog)}\n\nYêu cầu khách hàng: ${message}`
            }
          ]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(`Chat AI provider returned HTTP ${response.status}`);
      return res.status(502).json({ message: 'Dịch vụ AI chưa phản hồi thành công. Vui lòng thử lại sau.' });
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    let answer;
    try {
      answer = JSON.parse(content);
    } catch {
      console.error('Chat AI provider returned invalid JSON');
      return res.status(502).json({ message: 'Không thể đọc phản hồi từ AI. Vui lòng thử lại.' });
    }
    const validCodes = new Set(catalog.map((product) => product.code));
    const codes = Array.isArray(answer.productCodes)
      ? [...new Set(answer.productCodes.filter((code) => validCodes.has(code)))].slice(0, 4)
      : [];
    res.json({
      reply: typeof answer.reply === 'string' && answer.reply.trim()
        ? answer.reply.trim()
        : 'Mình chưa tìm được gợi ý phù hợp. Bạn cho mình biết thêm màu sắc, size hoặc ngân sách nhé.',
      products: codes.map((code) => catalog.find((product) => product.code === code)).filter(Boolean)
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ message: 'Chatbot phản hồi quá lâu. Vui lòng thử lại.' });
    }
    next(error);
  }
});

export default router;
