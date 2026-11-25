import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import SmartImage from '../components/SmartImage';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.get('/products?limit=8'), api.get('/products?limit=8&sort=bestseller')])
      .then(([fresh, hot]) => setProducts([...fresh.data.items, ...hot.data.items.filter((item) => !fresh.data.items.some((x) => x.id === item.id)).slice(0, 4)]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    api.get('/products/categories').catch(() => {});
    setBanners([
      { title: 'Bộ sưu tập mùa mới', subtitle: 'Tinh tế mỗi ngày', image_url: '/images/products/vay-dam-01.jpg', link_url: '/products' },
      { title: 'Phong cách thanh lịch', subtitle: 'Tự tin trong mọi khoảnh khắc', image_url: '/images/products/ao-kieu-02.jpg', link_url: '/category/nu' },
      { title: 'Ưu đãi cuối tuần', subtitle: 'Giảm đến 30%', image_url: '/images/products/chan-vay-01.jpg', link_url: '/products?sale=true' }
    ]);
  }, []);
  useEffect(() => { if (!banners.length) return; const timer = setInterval(() => setSlide((value) => (value + 1) % banners.length), 5000); return () => clearInterval(timer); }, [banners]);
  return (
    <div>
      <section className="hero" style={{ backgroundImage: `url(${banners[slide]?.image_url})` }}>
        <div className="hero-content"><p>BỘ SƯU TẬP 2026</p><h1>{banners[slide]?.title}</h1><span>{banners[slide]?.subtitle}</span><Link to={banners[slide]?.link_url || '/products'}>Khám phá ngay</Link></div>
        <div className="dots">{banners.map((_, index) => <button key={index} className={slide === index ? 'active' : ''} onClick={() => setSlide(index)} />)}</div>
      </section>
      <section className="container section">
        <h2>Danh mục nổi bật</h2>
        <div className="category-grid">
          {[['Nữ','nu','/images/products/ao-kieu-01.jpg'],['Bé gái','be-gai','/images/products/girl-fashion-01.jpg'],['Bộ sưu tập','products','/images/products/vay-dam-01.jpg']].map(([name,slug,image]) =>
            <Link key={slug} to={slug === 'products' ? '/products' : `/category/${slug}`}><SmartImage src={image} alt={name} eager={true}/><span>{name}</span></Link>
          )}
        </div>
      </section>
      <section className="container section">
        <div className="section-head"><h2>Thời trang nữ</h2><Link to="/products">Xem tất cả</Link></div>
        <div className="category-grid">
          {[
            ['Áo kiểu','ao-kieu','ao-kieu-02.jpg'],
            ['Váy đầm','vay-dam','vay-dam-01.jpg'],
            ['Quần nữ','quan-nu','quan-nu-05.jpg'],
            ['Áo khoác','ao-khoac-nu','ao-khoac-04.jpg'],
            ['Chân váy','chan-vay','chan-vay-04.jpg'],
            ['Áo thun','ao-thun-nu','ao-thun-02.jpg']
          ].map(([name, slug, image]) =>
            <Link key={slug} to={`/category/${slug}`}>
              <SmartImage src={`/images/products/${image}`} alt={name} />
              <span>{name}</span>
            </Link>
          )}
        </div>
      </section>
      <section className="container section"><div className="section-head"><h2>Sản phẩm dành cho bạn</h2><Link to="/products">Xem tất cả</Link></div>
        {loading ? <div className="loading">Đang tải sản phẩm...</div> : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div>}
      </section>
      <section className="offer"><div><p>Ưu đãi đặc biệt</p><h2>Giảm ngay 100.000đ</h2><span>Cho đơn hàng đầu tiên từ 1.000.000đ</span><b>Mã: GIAM100K</b></div></section>
    </div>
  );
}
