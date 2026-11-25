import jwt from 'jsonwebtoken';
import { getRuntimeVariable } from '../config/runtime.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

  try {
    req.user = jwt.verify(token, getRuntimeVariable('JWT_SECRET'));
    next();
  } catch {
    res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Chỉ tài khoản quản trị mới truy cập được' });
  }
  next();
}
