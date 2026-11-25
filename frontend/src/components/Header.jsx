import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();
  const { cart, favorites, user } = useStore();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    let active = true;
    api.get('/storefront/settings').then(({ data }) => { if (active) setSettings(data); }).catch((error) => {
      console.error('Không thể tải cài đặt cửa hàng cho header:', error);
    });
    return () => { active = false; };
  }, []);
  const submit = (event) => {
    event.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };
  const storeName = settings?.store_name || 'VÁY XINH';
  const storeNameParts = storeName.trim().split(/\s+/);
  const freeShippingThreshold = Number(settings?.free_shipping_threshold ?? 500000);
  return (
    <>
      <div className="promo">Miễn phí vận chuyển cho đơn từ {new Intl.NumberFormat('vi-VN').format(Number.isFinite(freeShippingThreshold) ? freeShippingThreshold : 500000)}đ · Ưu đãi mới mỗi tuần</div>
      <header className="header">
        <button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        <Link to="/" className="logo">{storeNameParts.length > 1 ? <>{storeNameParts.slice(0, -1).join(' ')} <span>{storeNameParts.slice(-1)[0]}</span></> : storeName}</Link>
        <form className="search" onSubmit={submit}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm..." />
          <button aria-label="Tìm kiếm"><Search size={19} /></button>
        </form>
        <nav className={open ? 'nav open' : 'nav'}>
          <Link to="/" onClick={() => setOpen(false)}>Trang chủ</Link>
          <Link to="/category/nu" onClick={() => setOpen(false)}>Nữ</Link>
          <Link to="/category/be-gai" onClick={() => setOpen(false)}>Bé gái</Link>
          <Link to="/products" onClick={() => setOpen(false)}>Bộ sưu tập</Link>
          <Link to="/products?sale=true" onClick={() => setOpen(false)}>Khuyến mãi</Link>
        </nav>
        <div className="header-actions">
          <Link to={user ? '/account' : '/login'} className="icon-button" title="Tài khoản"><User /></Link>
          <Link to="/wishlist" className="icon-button badge-wrap" title="Yêu thích"><Heart />{favorites.length > 0 && <b>{favorites.length}</b>}</Link>
          <Link to="/cart" className="icon-button badge-wrap" title="Giỏ hàng"><ShoppingBag />{count > 0 && <b>{count}</b>}</Link>
        </div>
      </header>
    </>
  );
}
