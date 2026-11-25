import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../components/ProductCard';
import SmartImage from '../components/SmartImage';
import { VIETNAMESE_MOBILE_PHONE_PATTERN, VIETNAMESE_MOBILE_PHONE_TITLE } from '../utils/phone';

export default function Checkout() {
  const { cart, user, clearCart } = useStore();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const subtotal = cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const shipping = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
  const applyCoupon = () => {
    api.post('/coupons/validate', { code: coupon, subtotal })
      .then((response) => setDiscount(Number(response.data.discount)))
      .catch((err) => { setDiscount(0); setError(err.response?.data?.message || 'Mã giảm giá không hợp lệ'); });
  };
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    const key = localStorage.getItem('ao_xinh_checkout_key') || crypto.randomUUID();
    localStorage.setItem('ao_xinh_checkout_key', key);
    try {
      const response = await api.post('/orders/checkout', {
        idempotencyKey:key,
        couponCode:coupon || null,
        paymentMethod:form.get('payment'),
        customer:{name:form.get('name'),phone:form.get('phone'),province:form.get('province'),district:form.get('district'),ward:form.get('ward'),address:form.get('address'),userId:user?.id},
        items:cart.map((item)=>({variantId:item.variantId,quantity:item.quantity}))
      });
      clearCart(); localStorage.removeItem('ao_xinh_checkout_key');
      navigate(`/order-success/${response.data.orderCode}`);
    } catch (err) { setError(err.response?.data?.message || 'Không thể tạo đơn hàng'); }
    finally { setLoading(false); }
  };
  if (!cart.length) return <div className="container page empty">Giỏ hàng trống. <a href="/products">Mua sắm ngay</a></div>;
  return (
    <div className="container page checkout-page"><h1>Thanh toán</h1>
      <form onSubmit={submit} className="checkout-layout">
        <section className="checkout-form"><h2>Thông tin giao hàng</h2>
          <div className="form-grid"><label>Họ và tên<input name="name" required defaultValue={user?.fullName}/></label><label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" pattern={VIETNAMESE_MOBILE_PHONE_PATTERN} title={VIETNAMESE_MOBILE_PHONE_TITLE} required defaultValue={user?.phone}/></label></div>
          <div className="form-grid"><label>Tỉnh/Thành phố<input name="province" required/></label><label>Quận/Huyện<input name="district" required/></label></div>
          <div className="form-grid"><label>Phường/Xã<input name="ward" required/></label><label>Địa chỉ chi tiết<input name="address" required/></label></div>
          <h2>Phương thức thanh toán</h2><label className="radio"><input type="radio" name="payment" value="COD" defaultChecked/> Thanh toán khi nhận hàng (COD)</label><label className="radio"><input type="radio" name="payment" value="VNPAY"/> VNPay (môi trường thử nghiệm)</label><label className="radio"><input type="radio" name="payment" value="MOMO"/> MoMo (môi trường thử nghiệm)</label>
        </section>
        <aside className="checkout-summary"><h2>Đơn hàng của bạn</h2>{cart.map((item)=><div className="mini-item" key={item.variantId}><SmartImage src={item.image_url} alt={item.name}/><span>{item.name}<small>{item.colorName} / {item.size} × {item.quantity}</small></span><b>{formatPrice(item.price*item.quantity)}</b></div>)}
          <div className="coupon"><input value={coupon} onChange={(e)=>setCoupon(e.target.value)} placeholder="Mã giảm giá"/><button type="button" onClick={applyCoupon}>Áp dụng</button></div>
          <p><span>Tạm tính</span><b>{formatPrice(subtotal)}</b></p><p><span>Giảm giá</span><b>-{formatPrice(discount)}</b></p><p><span>Vận chuyển</span><b>{shipping?formatPrice(shipping):'Miễn phí'}</b></p><hr/><p className="total"><span>Tổng thanh toán</span><b>{formatPrice(subtotal-discount+shipping)}</b></p>
          {error && <p className="error">{error}</p>}<button className="primary full" disabled={loading}>{loading?'Đang xử lý...':'Xác nhận đặt hàng'}</button>
        </aside>
      </form>
    </div>
  );
}
