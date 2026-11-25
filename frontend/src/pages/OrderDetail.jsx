import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../components/ProductCard';

const statusLabels = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao',
  DA_GIAO: 'Đã giao',
  DA_HUY: 'Đã hủy'
};

const paymentLabels = {
  COD: 'Thanh toán khi nhận hàng',
  VNPAY: 'VNPay',
  MOMO: 'MoMo'
};

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    api.get(`/orders/${id}`)
      .then(({ data }) => { if (active) setOrder(data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Không thể tải thông tin đơn hàng'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, user]);

  if (!user) {
    return <div className="container page empty">Vui lòng <Link to="/login">đăng nhập</Link> để xem đơn hàng.</div>;
  }
  if (loading) {
    return <div className="container page loading">Đang tải chi tiết đơn hàng...</div>;
  }
  if (error || !order) {
    return <div className="container page order-detail-error"><p>{error || 'Không tìm thấy đơn hàng.'}</p><Link to="/account/orders">Quay lại đơn hàng</Link></div>;
  }

  const shippingAddress = [order.address_detail, order.ward, order.district, order.province].filter(Boolean).join(', ');

  return (
    <div className="container page order-detail-page">
      <Link className="order-detail-back" to="/account/orders">← Quay lại đơn hàng</Link>
      <header className="order-detail-heading">
        <div>
          <p>ĐƠN HÀNG CỦA BẠN</p>
          <h1>Chi tiết đơn hàng</h1>
          <span>Mã đơn: <strong>{order.order_code}</strong> · {new Date(order.created_at).toLocaleString('vi-VN')}</span>
        </div>
        <span className="order-detail-status">{statusLabels[order.status] || order.status}</span>
      </header>
      <div className="order-detail-layout">
        <section className="order-detail-card">
          <h2>Sản phẩm đã đặt</h2>
          <div className="order-detail-items">
            {order.items.map((item) => (
              <article className="order-detail-item" key={item.id}>
                <div>
                  <strong>{item.product_name}</strong>
                  <span>{[item.color_name, item.size].filter(Boolean).join(' · ') || 'Sản phẩm thời trang'}</span>
                </div>
                <span>x{item.quantity}</span>
                <strong>{formatPrice(Number(item.unit_price) * item.quantity)}</strong>
              </article>
            ))}
          </div>
          <div className="order-detail-totals">
            <p><span>Tạm tính</span><strong>{formatPrice(Number(order.subtotal))}</strong></p>
            <p><span>Giảm giá</span><strong>-{formatPrice(Number(order.discount_amount))}</strong></p>
            <p><span>Phí vận chuyển</span><strong>{formatPrice(Number(order.shipping_fee))}</strong></p>
            <p className="order-detail-grand-total"><span>Tổng thanh toán</span><strong>{formatPrice(Number(order.total_amount))}</strong></p>
          </div>
        </section>
        <aside className="order-detail-card order-detail-info">
          <h2>Thông tin giao hàng</h2>
          <strong>{order.customer_name}</strong>
          <p>{order.phone}</p>
          <p>{shippingAddress}</p>
          <div className="order-detail-payment">
            <span>Phương thức thanh toán</span>
            <strong>{paymentLabels[order.payment_method] || order.payment_method}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
