import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

export default function Wishlist(){
  const {favorites}=useStore();
  return <div className="container page"><h1>Sản phẩm yêu thích</h1>{favorites.length?<div className="product-grid">{favorites.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="empty">Danh sách yêu thích đang trống.<br/><Link to="/products">Khám phá sản phẩm</Link></div>}</div>;
}
