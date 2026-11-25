import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Footer() {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let active = true;
    api.get('/storefront/settings').then(({ data }) => { if (active) setSettings(data); }).catch((error) => {
      console.error('Không thể tải cài đặt cửa hàng cho footer:', error);
    });
    return () => { active = false; };
  }, []);
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div><h3>{settings?.store_name || 'VÁY XINH'}</h3><p>Thời trang thanh lịch và nhẹ nhàng cho mọi khoảnh khắc.</p></div>
        <div><h4>Mua sắm</h4><Link to="/category/nu">Nữ</Link><Link to="/category/be-gai">Bé gái</Link></div>
        <div><h4>Chính sách</h4><span>Vận chuyển</span><span>Đổi trả</span><span>Bảo mật</span></div>
        <div><h4>Liên hệ</h4><span>Hotline: {settings?.support_phone || '1900 6868'}</span><span>{settings?.support_email || 'hello@aoxinh.vn'}</span><Link to="/contact">Gửi yêu cầu hỗ trợ</Link></div>
      </div>
      <div className="copyright">© 2026 VÁY XINH. Bản quyền thuộc VÁY XINH.</div>
    </footer>
  );
}
