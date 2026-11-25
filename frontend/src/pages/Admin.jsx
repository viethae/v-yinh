import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom';
import {
  BadgeDollarSign, Bell, BookOpen, Boxes, ClipboardList, Grid2X2, Image,
  LayoutDashboard, LogOut, MessageCircle, Newspaper, Package, Search,
  Settings, ShieldCheck, ShoppingCart, Star, TicketPercent, UsersRound, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';

const navigation = [
  { heading: 'TỔNG QUAN', items: [{ label: 'Tổng quan', path: '/admin', Icon: LayoutDashboard }] },
  { heading: 'QUẢN LÝ CỬA HÀNG', items: [
    { label: 'Danh mục', path: '/admin/categories', Icon: Grid2X2 },
    { label: 'Sản phẩm', path: '/admin/products', Icon: Package },
    { label: 'Mã giảm giá', path: '/admin/coupons', Icon: TicketPercent },
    { label: 'Đơn hàng', path: '/admin/orders', Icon: ShoppingCart },
    { label: 'Quản lý kho', path: '/admin/inventory', Icon: Boxes },
    { label: 'Phiếu nhập kho', path: '/admin/receipts', Icon: ClipboardList },
    { label: 'Flash Sale', path: '/admin/flash-sales', Icon: Zap },
    { label: 'Bảo hành', path: '/admin/warranty', Icon: ShieldCheck },
    { label: 'Đánh giá', path: '/admin/reviews', Icon: Star },
    { label: 'Banner', path: '/admin/banners', Icon: Image },
    { label: 'Bài viết (Blog)', path: '/admin/blog', Icon: BookOpen },
    { label: 'Nhân viên', path: '/admin/staff', Icon: UsersRound }
  ] },
  { heading: 'HỖ TRỢ', items: [{ label: 'Hỗ trợ Chat', path: '/admin/support', Icon: MessageCircle }] },
  { heading: 'HỆ THỐNG', items: [{ label: 'Cài đặt', path: '/admin/settings', Icon: Settings }] }
];

export function AdminShell({ children, title, description, onSearch, search, action }) {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  if (!user || user.role !== 'ADMIN') return <Navigate to="/login" replace/>;

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-console">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin"><span className="admin-brand-mark">V</span><span>VÁY XINH<small>ADMIN PANEL</small></span></Link>
        <nav>
          {navigation.map((group) => (
            <section className="admin-nav-group" key={group.heading}>
              <p>{group.heading}</p>
              {group.items.map(({ label, path, Icon }) => (
                <NavLink key={path} to={path} end={path === '/admin'} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
                  <Icon size={17}/><span>{label}</span>
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
        <div className="admin-sidebar-footer">Quản trị hệ thống · Áo Xinh</div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <label className="admin-search"><Search size={17}/><input aria-label="Tìm kiếm trong trang quản trị" placeholder="Tìm kiếm..." value={search || ''} onChange={(event) => onSearch?.(event.target.value)}/></label>
          <div className="admin-topbar-actions">
            <Link className="admin-icon-button" to="/admin/support" title="Yêu cầu hỗ trợ"><Bell size={18}/></Link>
            <div className="admin-identity"><span className="admin-avatar">{user.fullName?.trim()?.[0]?.toUpperCase() || 'A'}</span><span><b>{user.fullName || 'Quản trị viên'}</b><small>Quản trị viên</small></span></div>
            <button type="button" className="admin-icon-button" onClick={signOut} title="Đăng xuất"><LogOut size={18}/></button>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
          {children}
        </main>
      </div>
    </div>
  );
}

const money = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
const orderStatus = {
  CHO_XAC_NHAN: 'Chờ xác nhận', DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao', DA_GIAO: 'Đã giao', DA_HUY: 'Đã hủy'
};

export default function Admin() {
  const { user } = useStore();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let active = true;
    api.get('/admin/stats')
      .then(({ data }) => { if (active) setStats(data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Không thể tải dữ liệu quản trị'); });
    return () => { active = false; };
  }, [user]);

  const cards = stats ? [
    ['Sản phẩm', stats.products, Package],
    ['Khách hàng', stats.customers, UsersRound],
    ['Đơn hàng', stats.orders, ShoppingCart],
    ['Doanh thu', money(stats.revenue), BadgeDollarSign]
  ] : [];
  const maxRevenue = Math.max(1, ...(stats?.monthly || []).map((month) => Number(month.revenue)));

  return (
    <AdminShell title="Tổng quan" description="Theo dõi hoạt động kinh doanh của cửa hàng">
      {error ? <div className="admin-alert error">{error}</div> : !stats ? <div className="admin-loading">Đang tải dữ liệu...</div> : <>
        <section className="admin-stat-grid">
          {cards.map(([label, value, Icon]) => <article className="admin-stat-card" key={label}><span className="admin-stat-icon"><Icon size={20}/></span><span>{label}<b>{value}</b></span></article>)}
        </section>
        <div className="admin-dashboard-grid">
          <section className="admin-card">
            <div className="admin-card-heading"><div><h2>Doanh thu theo tháng</h2><p>Đơn hàng đã giao thành công</p></div></div>
            {stats.monthly.length ? <div className="admin-chart">{stats.monthly.map((month) => <div className="admin-chart-row" key={month.month}><span>{month.month}</span><div className="admin-chart-track"><i style={{ width: `${Math.max(3, Number(month.revenue) / maxRevenue * 100)}%` }}/></div><b>{money(month.revenue)}</b></div>)}</div> : <p className="admin-empty">Chưa có doanh thu hoàn tất.</p>}
          </section>
          <section className="admin-card admin-shortcuts">
            <div className="admin-card-heading"><div><h2>Truy cập nhanh</h2><p>Các tác vụ thường dùng</p></div></div>
            <Link to="/admin/products"><Package size={18}/> Quản lý sản phẩm <span>›</span></Link>
            <Link to="/admin/orders"><ShoppingCart size={18}/> Xử lý đơn hàng <span>›</span></Link>
            <Link to="/admin/inventory"><Boxes size={18}/> Kiểm tra tồn kho <span>›</span></Link>
            <Link to="/admin/coupons"><TicketPercent size={18}/> Tạo mã giảm giá <span>›</span></Link>
          </section>
        </div>
        <section className="admin-card admin-recent-orders">
          <div className="admin-card-heading"><div><h2>Đơn hàng gần đây</h2><p>Cập nhật mới nhất từ cửa hàng</p></div><Link to="/admin/orders">Xem tất cả <span>→</span></Link></div>
          {stats.recent.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>
            {stats.recent.map((order) => <tr key={order.id}><td><b>{order.order_code}</b></td><td>{order.customer_name}</td><td>{money(order.total_amount)}</td><td><span className={`admin-status status-${order.status.toLowerCase()}`}>{orderStatus[order.status] || order.status}</span></td><td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td></tr>)}
          </tbody></table></div> : <p className="admin-empty">Chưa có đơn hàng.</p>}
        </section>
      </>}
    </AdminShell>
  );
}
