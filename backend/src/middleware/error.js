export function notFound(req, res) {
  res.status(404).json({ message: 'API không tồn tại' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ message: error.publicMessage || 'Đã có lỗi xảy ra trên máy chủ' });
}
