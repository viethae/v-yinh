import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../components/ProductCard';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const [message, setMessage] = useState('');
  const [zoomed, setZoomed] = useState(false);
  const { addToCart, favorites, toggleFavorite } = useStore();
  useEffect(() => { api.get(`/products/slug/${slug}`).then((res) => setProduct(res.data)).catch(() => setProduct(null)); }, [slug]);
  if (product === null) return <div className="container page loading">Không tìm thấy sản phẩm</div>;
  if (!product.id) return <div className="container page loading">Đang tải...</div>;
  const totalStock = product.variants.reduce((total, item) => total + Math.max(0, Number(item.stock) || 0), 0);
  const soldOut = totalStock === 0;
  const colors = [...new Map(product.variants.map((v) => [v.color_name, v])).values()];
  const sizes = [...new Set(product.variants.filter((v) => !color || v.color_name === color).map((v) => v.size))];
  const variant = product.variants.find((v) => v.color_name === color && v.size === size);
  const liked = favorites.some((item) => item.id === product.id);
  const add = (buyNow) => {
    if (!color || !size) { setMessage('Vui lòng chọn màu và kích cỡ'); return; }
    if (!variant || Number(variant.stock) < 1) { setMessage('Biến thể này đã hết hàng'); return; }
    if (quantity > Number(variant.stock)) { setMessage(`Chỉ còn ${variant.stock} sản phẩm trong kho`); return; }
    addToCart({ variantId: variant.id, productId: product.id, name: product.name, slug: product.slug, colorName: color, size, price: product.sale_price || product.base_price, quantity, stock: variant.stock, image_url: product.images[0]?.image_url });
    setMessage('Đã thêm vào giỏ hàng');
    if (buyNow) navigate('/cart');
  };
  return (
    <div className="container detail-page">
      <div className="detail-gallery"><div className="thumbs">{product.images.map((img,index)=><button key={img.id} onClick={()=>setImage(index)}><img src={img.image_url} alt={`${product.name} - góc nhìn ${index+1}`} loading="lazy"/></button>)}</div><button className="main-image-button" onClick={()=>setZoomed(true)} aria-label="Phóng to ảnh sản phẩm"><img className="main-image" src={product.images[image]?.image_url} alt={product.name} loading="eager"/></button></div>
      {zoomed&&<div className="image-modal" role="dialog" aria-modal="true" onClick={()=>setZoomed(false)}><button aria-label="Đóng ảnh phóng to" onClick={()=>setZoomed(false)}>×</button><img src={product.images[image]?.image_url} alt={`${product.name} - ảnh phóng to`}/></div>}
      <div className="detail-info"><p className="breadcrumb">{product.category_name} / {product.code}</p><h1>{product.name}</h1><div className="rating"><Star fill="currentColor"/> {Number(product.rating).toFixed(1)}</div>
        <div className="detail-price">{product.sale_price ? <><b>{formatPrice(product.sale_price)}</b><del>{formatPrice(product.base_price)}</del></> : <b>{formatPrice(product.base_price)}</b>}{soldOut && <span className="detail-stock-status">Hết hàng</span>}</div>
        <p className="description">{product.description}</p>
        <div className="option"><label>Màu sắc: <b>{color}</b></label><div>{colors.map((c)=>{const colorOut=product.variants.filter((item)=>item.color_name===c.color_name).every((item)=>Number(item.stock)<1);return <button key={c.color_name} disabled={colorOut} className={`${color===c.color_name?'selected':''}${colorOut?' option-sold-out':''}`} style={{background:c.color_hex}} title={colorOut?`${c.color_name} · Hết hàng`:c.color_name} onClick={()=>{setColor(c.color_name);setSize('');setQuantity(1)}} />})}</div></div>
        <div className="option"><label>Kích cỡ: <b>{size}</b></label><div>{sizes.map((s)=>{const sizeVariant=product.variants.find((item)=>item.color_name===color&&item.size===s);const sizeOut=!sizeVariant||Number(sizeVariant.stock)<1;return <button key={s} disabled={sizeOut} className={`${size===s?'size selected':'size'}${sizeOut?' option-sold-out':''}`} onClick={()=>{setSize(s);setQuantity(1)}}>{s}</button>})}</div><small>{variant ? Number(variant.stock)>0 ? Number(variant.stock)<=3?`Sắp hết · còn ${variant.stock} sản phẩm`:`Còn ${variant.stock} sản phẩm` : 'Hết hàng' : soldOut ? 'Sản phẩm đã hết hàng' : 'Chọn màu và kích cỡ để xem tồn kho'}</small></div>
        <div className="quantity"><button disabled={soldOut||!variant||quantity<=1} onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><span>{quantity}</span><button disabled={soldOut||!variant||quantity>=Number(variant.stock)} onClick={()=>setQuantity(Math.min(Number(variant?.stock)||1,quantity+1))}>+</button></div>
        {message && <p className="form-message">{message}</p>}
        <div className="detail-actions"><button className="primary" disabled={soldOut} onClick={()=>add(false)}>{soldOut?'Hết hàng':'Thêm vào giỏ hàng'}</button><button className="outline" disabled={soldOut} onClick={()=>add(true)}>Mua ngay</button><button className={liked?'wish liked':'wish'} onClick={()=>toggleFavorite(product)}><Heart fill={liked?'currentColor':'none'} /></button></div>
        <div className="detail-extra"><b>Mã sản phẩm:</b> {product.code}<br/><b>Chất liệu:</b> {product.material}<br/><b>Giao hàng:</b> Miễn phí từ 500.000đ</div>
      </div>
    </div>
  );
}
