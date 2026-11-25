export function normalizeVietnameseMobilePhone(value) {
  if (typeof value !== 'string') return null;

  let phone = value.trim().replace(/[\s().-]/g, '');
  if (phone.startsWith('+84')) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith('84')) phone = `0${phone.slice(2)}`;

  return /^0[35789]\d{8}$/.test(phone) ? phone : null;
}

export function hasPhoneValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export const INVALID_VIETNAMESE_PHONE_MESSAGE =
  'Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam, ví dụ 0912345678';
