import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { slug } = useParams();
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isCategoryRoute = location.pathname.startsWith('/category/');
  const categorySlug = isCategoryRoute ? slug : '';
  const category = isCategoryRoute
    ? (categories.find((item) => item.slug === categorySlug)?.name || ({ nu: 'Nữ', nam: 'Nam', 'tre-em': 'Trẻ em', 'be-gai': 'Bé gái' }[categorySlug] || categorySlug))
    : location.pathname === '/search'
      ? `tìm kiếm: ${params.get('q') || ''}`
      : params.get('category');
  useEffect(() => {
    api.get('/products/categories')
      .then(({ data: items }) => setCategories(Array.isArray(items) ? items : []))
      .catch((requestError) => setCategoryError(requestError.response?.data?.message || 'Không thể tải danh mục.'));
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const query = Object.fromEntries(params);
    if (isCategoryRoute) query.category = categorySlug;
    if (location.pathname === '/search') query.search = params.get('q') || '';
    api.get('/products', { params: query, signal: controller.signal })
      .then(({ data: payload }) => {
        const items = Array.isArray(payload?.items) ? payload.items : [];
        if (!Array.isArray(payload?.items)) {
          throw new Error('Dữ liệu sản phẩm từ máy chủ không đúng định dạng.');
        }
        if (isCategoryRoute && items.some((item) => item.category_slug !== categorySlug)) {
          throw new Error(`API trả về sản phẩm không thuộc danh mục "${categorySlug}".`);
        }
        if (active) {
          setData({
            items,
            total: Number.isFinite(Number(payload.total)) ? Number(payload.total) : items.length,
            pages: Math.max(1, Number(payload.pages) || 1),
            page: Math.max(1, Number(payload.page) || 1)
          });
        }
      })
      .catch((requestError) => {
        if (!active || requestError.name === 'CanceledError' || requestError.name === 'AbortError') return;
        setData({ items: [], total: 0, pages: 1, page: 1 });
        setError(requestError.response?.data?.message || requestError.message || 'Không thể tải sản phẩm. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [params, location.pathname, categorySlug, isCategoryRoute]);
  const set = (key, value) => setParams((current) => { if (value) current.set(key,value); else current.delete(key); current.delete('page'); return current; });
  const changeCategory = (value) => {
    if (isCategoryRoute) {
      navigate(value ? `/category/${value}` : '/products');
      return;
    }
    set('category', value);
  };
  return (
    <div className="container page">
      <div className="breadcrumb">Trang chủ / Sản phẩm</div>
      <h1>{category ? `Danh mục ${category}` : 'Tất cả sản phẩm'}</h1>
      <div className="shop-layout">
        <aside className="filters">
          <h3>Bộ lọc</h3>
          <label>Danh mục</label><select value={isCategoryRoute ? categorySlug : params.get('category') || ''} onChange={(event) => changeCategory(event.target.value)}><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>
          {categoryError && <small className="filter-error" role="alert">{categoryError}</small>}
          <label>Giá từ</label><select value={params.get('min') || ''} onChange={(e) => set('min', e.target.value)}><option value="">Không giới hạn</option><option value="200000">200.000đ</option><option value="300000">300.000đ</option><option value="500000">500.000đ</option></select>
          <label>Giá đến</label><select value={params.get('max') || ''} onChange={(e) => set('max', e.target.value)}><option value="">Không giới hạn</option><option value="300000">300.000đ</option><option value="500000">500.000đ</option><option value="700000">700.000đ</option><option value="1000000">1.000.000đ</option></select>
          <label>Khuyến mãi</label><select onChange={(e) => set('sale', e.target.value)} defaultValue=""><option value="">Tất cả</option><option value="true">Đang giảm giá</option></select>
        </aside>
        <section>
          <div className="toolbar"><span>{loading ? 'Đang tải...' : `${data.total} sản phẩm`}</span><select onChange={(e) => set('sort', e.target.value)} defaultValue={params.get('sort') || ''}><option value="">Mới nhất</option><option value="priceAsc">Giá tăng dần</option><option value="priceDesc">Giá giảm dần</option><option value="bestseller">Bán chạy</option></select></div>
          {loading ? <div className="loading">Đang tải...</div> : error ? <div className="empty error" role="alert">{error}</div> : data.items.length ? <div className="product-grid">{data.items.map((item) => <ProductCard key={item.id} product={item}/>)}</div> : <div className="empty">Không có sản phẩm phù hợp.</div>}
          {!loading && !error && data.pages > 1 && <div className="pagination">{Array.from({length:data.pages},(_,i)=>i+1).map((page)=><button key={page} className={Number(params.get('page')||1)===page?'active':''} aria-current={Number(params.get('page')||1)===page?'page':undefined} onClick={()=>set('page',String(page))}>{page}</button>)}</div>}
        </section>
      </div>
    </div>
  );
}
