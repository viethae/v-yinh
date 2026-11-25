import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../components/ProductCard';
import SmartImage from '../components/SmartImage';

export default function Cart() {
  const { cart, updateCart, updateCartStock, removeCart } = useStore();
  const navigate = useNavigate();
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState('');
  const variantIds = cart.map((item) => item.variantId).join(',');
  useEffect(() => {
    if (!variantIds) {
      setStockLoading(false);
      setStockError('');
      return undefined;
    }
    let active = true;
    setStockLoading(true);
    setStockError('');
    api.get('/products/stock', { params: { ids: variantIds } })
      .then(({ data }) => {
        if (!active) return;
        const stockByVariant = new Map(data.map((item) => [Number(item.variant_id), Number(item.stock)]));
        variantIds.split(',').forEach((id) => updateCartStock(Number(id), stockByVariant.get(Number(id)) || 0));
      })
      .catch((requestError) => {
        if (active) setStockError(requestError.response?.data?.message || 'Không thể kiểm tra tồn kho. Hãy tải lại trang trước khi thanh toán.');
      })
      .finally(() => { if (active) setStockLoading(false); });
    return () => { active = false; };
  }, [variantIds, updateCartStock]);
  const subtotal = cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const shipping = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
  const soldOutItems = cart.filter((item) => Number(item.stock) < 1);
  return (
    <div className="container page">
      <h1>Giỏ hàng</h1>
      {cart.length === 0 ? <div className="empty cart-empty"><h2>Giỏ hàng đang trống</h2><Link className="primary" to="/products">Tiếp tục mua sắm</Link></div> :
      <div className="cart-layout">
        <div className="cart-items">{cart.map((item)=><div className="cart-item" key={item.variantId}>
          <SmartImage src={item.image_url} alt={item.name}/>
          <div className="cart-item-info"><Link to={`/product/${item.slug}`}>{item.name}</Link><p>Màu: {item.colorName} · Size: {item.size}</p><b>{formatPrice(item.price)}</b><small className={Number(item.stock)<1?'cart-stock sold-out':Number(item.stock)<=3?'cart-stock low-stock':'cart-stock'}>{Number(item.stock)<1?'Hết hàng':Number(item.stock)<=3?`Sắp hết · còn ${item.stock}`:`Còn ${item.stock} sản phẩm`}</small></div>
          <div className="quantity"><button disabled={item.quantity<=1} onClick={()=>updateCart(item.variantId,Math.max(1,item.quantity-1))}>−</button><span>{item.quantity}</span><button disabled={Number(item.stock)<1||item.quantity>=Number(item.stock)} onClick={()=>updateCart(item.variantId,Math.min(item.stock,item.quantity+1))}>+</button></div>
          <b>{formatPrice(item.price*item.quantity)}</b><button className="icon-button" onClick={()=>removeCart(item.variantId)}><Trash2/></button>
        </div>)}</div>
        <aside className="cart-summary"><h3>Tóm tắt đơn hàng</h3><p><span>Tạm tính</span><b>{formatPrice(subtotal)}</b></p><p><span>Vận chuyển</span><b>{shipping ? formatPrice(shipping) : 'Miễn phí'}</b></p><hr/><p className="total"><span>Tổng</span><b>{formatPrice(subtotal+shipping)}</b></p>{stockLoading&&<p className="cart-stock-message">Đang kiểm tra số lượng tồn kho...</p>}{stockError&&<p className="error">{stockError}</p>}{!stockLoading&&!stockError&&soldOutItems.length>0&&<p className="error">Có sản phẩm đã hết hàng. Hãy xóa sản phẩm đó khỏi giỏ để tiếp tục.</p>}<button className="primary full" disabled={stockLoading||Boolean(stockError)||soldOutItems.length>0} onClick={()=>navigate('/checkout')}>Tiến hành thanh toán</button></aside>
      </div>}
    </div>
  );
}
