import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import SmartImage from './SmartImage';

export const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

export default function ProductCard({ product }) {
  const { favorites, toggleFavorite } = useStore();
  const liked = favorites.some((item) => item.id === product.id);
  const stock = Math.max(0, Number(product.stock) || 0);
  const soldOut = stock === 0;
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/product/${product.slug}`} className="product-photo-link">
          <SmartImage src={product.image_url} alt={product.name} className="primary-image" />
          {product.second_image_url && <SmartImage src={product.second_image_url} alt={`${product.name} - ảnh khác`} className="secondary-image" />}
        </Link>
        {product.is_new && <span className="new-badge">NEW</span>}
        {product.sale_price && <span className="sale-badge">Sale</span>}
        {soldOut ? <span className="stock-badge sold-out-badge">Hết hàng</span> : stock <= 3 ? <span className="stock-badge low-stock-badge">Sắp hết · còn {stock}</span> : null}
        <button className={liked ? 'heart liked' : 'heart'} onClick={() => toggleFavorite(product)} aria-label="Yêu thích"><Heart fill={liked ? 'currentColor' : 'none'} /></button>
        {soldOut ? <span className="quick-add unavailable">Hết hàng</span> : <Link to={`/product/${product.slug}`} className="quick-add">Chọn sản phẩm</Link>}
      </div>
      <Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link>
      <p className="product-code">{product.code}</p>
      <div className="price">
        {product.sale_price ? <><b>{formatPrice(product.sale_price)}</b><del>{formatPrice(product.base_price)}</del></> : <b>{formatPrice(product.base_price)}</b>}
      </div>
    </article>
  );
}
