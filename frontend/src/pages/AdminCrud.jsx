import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { AdminShell } from './Admin';
import { VIETNAMESE_MOBILE_PHONE_PATTERN, VIETNAMESE_MOBILE_PHONE_TITLE } from '../utils/phone';

const config = {
  categories: { title: 'Quản lý danh mục', description: 'Tạo, cập nhật và ẩn danh mục sản phẩm', endpoint: 'categories', create: true },
  products: { title: 'Quản lý sản phẩm', description: 'Quản lý thông tin, hình ảnh, giá bán và trạng thái sản phẩm', endpoint: 'products', create: true },
  coupons: { title: 'Quản lý mã giảm giá', description: 'Tạo và quản lý các chương trình khuyến mãi', endpoint: 'coupons', create: true },
  orders: { title: 'Quản lý đơn hàng', description: 'Theo dõi đơn hàng và cập nhật trạng thái xử lý', endpoint: 'orders' },
  customers: { title: 'Quản lý khách hàng', description: 'Danh sách và trạng thái tài khoản khách hàng', endpoint: 'customers' },
  inventory: { title: 'Quản lý kho', description: 'Theo dõi tồn kho theo màu sắc và kích cỡ', endpoint: 'inventory' },
  receipts: { title: 'Phiếu nhập kho', description: 'Ghi nhận hàng nhập và cập nhật tồn kho tự động', endpoint: 'receipts', create: true },
  'flash-sales': { title: 'Quản lý Flash Sale', description: 'Lên lịch và quản lý chương trình khuyến mãi nhanh', endpoint: 'flash-sales', create: true },
  warranty: { title: 'Quản lý bảo hành', description: 'Xử lý các yêu cầu đổi trả và bảo hành', endpoint: 'warranty' },
  reviews: { title: 'Quản lý đánh giá', description: 'Kiểm duyệt đánh giá của khách hàng', endpoint: 'reviews' },
  banners: { title: 'Quản lý Banner', description: 'Cập nhật banner hiển thị trên trang chủ', endpoint: 'banners', create: true },
  blog: { title: 'Quản lý bài viết', description: 'Soạn thảo, xuất bản và quản lý nội dung blog', endpoint: 'blog', create: true },
  staff: { title: 'Quản lý nhân viên', description: 'Tạo tài khoản quản trị và quản lý quyền truy cập', endpoint: 'staff', create: true },
  support: { title: 'Hỗ trợ Chat', description: 'Tiếp nhận và xử lý yêu cầu hỗ trợ của khách hàng', endpoint: 'support' },
  settings: { title: 'Cài đặt cửa hàng', description: 'Cập nhật thông tin liên hệ và chính sách vận chuyển', endpoint: 'settings' }
};

const field = (name, label, type = 'text', options = {}) => ({ name, label, type, ...options });

function getFields(section, { categories, inventory }, editing = false) {
  switch (section) {
    case 'categories':
      return [field('name', 'Tên danh mục', 'text', { required: true }), field('isActive', 'Đang hiển thị', 'checkbox', { defaultValue: true, source: 'is_active' })];
    case 'products':
      return editing
        ? [
          field('name', 'Tên sản phẩm', 'text', { required: true }),
          field('categoryId', 'Danh mục', 'select', { required: true, source: 'category_id', options: categories.map((item) => [item.id, item.name]) }),
          field('basePrice', 'Giá gốc (đ)', 'number', { required: true, source: 'base_price', min: 0 }),
          field('salePrice', 'Giá khuyến mãi (đ)', 'number', { source: 'sale_price', min: 0 }),
          field('material', 'Chất liệu', 'text'),
          field('imageUrl', 'Ảnh sản phẩm', 'image', { source: 'image_url' }),
          field('newColors', 'Thêm màu mới', 'colors', { defaultValue: [] }),
          field('description', 'Mô tả', 'textarea'),
          field('isActive', 'Đang kinh doanh', 'checkbox', { defaultValue: true, source: 'is_active' })
        ]
        : [
          field('name', 'Tên sản phẩm', 'text', { required: true }),
          field('code', 'Mã sản phẩm', 'text', { required: true }),
          field('categoryId', 'Danh mục', 'select', { required: true, source: 'category_id', options: categories.map((item) => [item.id, item.name]) }),
          field('basePrice', 'Giá gốc (đ)', 'number', { required: true, min: 0 }),
          field('salePrice', 'Giá khuyến mãi (đ)', 'number', { min: 0 }),
          field('material', 'Chất liệu', 'text'),
          field('imageUrl', 'Ảnh sản phẩm', 'image', { required: true }),
          field('colors', 'Màu sắc', 'colors', { required: true, defaultValue: [{ name: 'Đen', hex: '#171717' }] }),
          field('stock', 'Tồn kho cho mỗi size', 'number', { required: true, min: 0, defaultValue: 0 }),
          field('sizes', 'Size (phân cách bằng dấu phẩy)', 'text', { required: true, defaultValue: 'S,M,L,XL' }),
          field('description', 'Mô tả', 'textarea'),
          field('isActive', 'Đang kinh doanh', 'checkbox', { defaultValue: true })
        ];
    case 'coupons':
      return [
        field('code', 'Mã giảm giá', 'text', { required: true }),
        field('discountType', 'Loại giảm giá', 'select', { required: true, source: 'discount_type', options: [['PERCENT', 'Phần trăm'], ['FIXED', 'Số tiền cố định']] }),
        field('discountValue', 'Giá trị giảm', 'number', { required: true, source: 'discount_value', min: 1 }),
        field('minOrderValue', 'Đơn tối thiểu (đ)', 'number', { source: 'min_order_value', min: 0, defaultValue: 0 }),
        field('maxUsage', 'Số lượt sử dụng tối đa', 'number', { source: 'max_usage', min: 1, defaultValue: 100 }),
        field('startAt', 'Bắt đầu', 'datetime-local', { required: true, source: 'start_at' }),
        field('endAt', 'Kết thúc', 'datetime-local', { required: true, source: 'end_at' }),
        field('isActive', 'Đang áp dụng', 'checkbox', { defaultValue: true, source: 'is_active' })
      ];
    case 'inventory':
      return [field('stock', 'Số lượng tồn kho', 'number', { required: true, min: 0, defaultValue: 0 })];
    case 'receipts':
      return [
        field('variantId', 'Sản phẩm / màu / size', 'select', { required: true, options: inventory.map((item) => [item.variant_id, `${item.product_name} · ${item.color_name} · ${item.size} · còn ${item.stock}`]) }),
        field('quantity', 'Số lượng nhập', 'number', { required: true, min: 1 }),
        field('supplier', 'Nhà cung cấp', 'text'),
        field('notes', 'Ghi chú', 'textarea')
      ];
    case 'flash-sales':
      return [
        field('title', 'Tên chương trình', 'text', { required: true }),
        field('discountType', 'Loại ưu đãi', 'select', { required: true, source: 'discount_type', options: [['PERCENT', 'Phần trăm'], ['FIXED', 'Số tiền cố định']] }),
        field('discountValue', 'Giá trị ưu đãi', 'number', { required: true, source: 'discount_value', min: 1 }),
        field('startsAt', 'Bắt đầu', 'datetime-local', { required: true, source: 'starts_at' }),
        field('endsAt', 'Kết thúc', 'datetime-local', { required: true, source: 'ends_at' }),
        field('isActive', 'Đang bật', 'checkbox', { defaultValue: true, source: 'is_active' })
      ];
    case 'banners':
      return [
        field('title', 'Tiêu đề', 'text', { required: true }),
        field('subtitle', 'Mô tả ngắn', 'text'),
        field('imageUrl', 'Đường dẫn hình ảnh', 'url', { required: true, source: 'image_url' }),
        field('linkUrl', 'Liên kết khi nhấn', 'text', { source: 'link_url' }),
        field('sortOrder', 'Thứ tự hiển thị', 'number', { source: 'sort_order', defaultValue: 0 }),
        field('isActive', 'Đang hiển thị', 'checkbox', { defaultValue: true, source: 'is_active' })
      ];
    case 'blog':
      return [
        field('title', 'Tiêu đề bài viết', 'text', { required: true }),
        field('summary', 'Tóm tắt', 'textarea'),
        field('coverImage', 'Đường dẫn ảnh bìa', 'url', { source: 'cover_image' }),
        field('content', 'Nội dung', 'textarea', { required: true, rows: 7 }),
        field('status', 'Trạng thái', 'select', { source: 'status', defaultValue: 'DRAFT', options: [['DRAFT', 'Bản nháp'], ['PUBLISHED', 'Đã xuất bản']] })
      ];
    case 'staff':
      return [
        field('fullName', 'Họ và tên', 'text', { required: true, source: 'full_name' }),
        field('email', 'Email', 'email', { required: true }),
        field('phone', 'Số điện thoại', 'tel', { pattern: VIETNAMESE_MOBILE_PHONE_PATTERN, title: VIETNAMESE_MOBILE_PHONE_TITLE }),
        field('password', 'Mật khẩu tạm thời (tối thiểu 8 ký tự)', 'password', { required: true, minLength: 8 })
      ];
    default:
      return [];
  }
}

const localDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace(' ', 'T').slice(0, 16);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

function toPayload(section, values) {
  const payload = { ...values };
  ['categoryId', 'basePrice', 'salePrice', 'stock', 'discountValue', 'minOrderValue', 'maxUsage', 'variantId', 'quantity', 'sortOrder']
    .forEach((key) => {
      if (payload[key] !== '' && payload[key] != null) payload[key] = Number(payload[key]);
      else if (['salePrice', 'minOrderValue'].includes(key)) payload[key] = null;
    });
  ['startAt', 'endAt', 'startsAt', 'endsAt'].forEach((key) => {
    if (payload[key]) payload[key] = `${payload[key].replace('T', ' ')}:00`;
  });
  if (section === 'products' && typeof payload.sizes === 'string') {
    payload.sizes = payload.sizes.split(',').map((size) => size.trim().toUpperCase()).filter(Boolean);
  }
  if (section === 'products' && payload.isActive === undefined) payload.isActive = true;
  return payload;
}

function initialValues(fields, item) {
  return Object.fromEntries(fields.map((entry) => {
    const source = entry.source || entry.name;
    let value = item ? item[source] : entry.defaultValue;
    if (entry.type === 'checkbox') value = item ? Boolean(value) : Boolean(entry.defaultValue);
    if (entry.type === 'datetime-local') value = localDateTime(value);
    return [entry.name, value ?? ''];
  }));
}

const formatMoney = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
const dateText = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';
const orderStatuses = [
  ['CHO_XAC_NHAN', 'Chờ xác nhận'], ['DA_XAC_NHAN', 'Đã xác nhận'],
  ['DANG_GIAO', 'Đang giao'], ['DA_GIAO', 'Đã giao'], ['DA_HUY', 'Đã hủy']
];

export default function AdminCrud() {
  const { section } = useParams();
  const page = config[section];
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [modal, setModal] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!page) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/admin/${page.endpoint}`);
      if (section === 'settings') setSettings(data);
      else setItems(Array.isArray(data) ? data : []);
      if (section === 'products') {
        const { data: categoryData } = await api.get('/admin/categories');
        setCategories(categoryData);
      }
      if (section === 'receipts') {
        const { data: inventoryData } = await api.get('/admin/inventory');
        setInventory(inventoryData);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [page, section]);

  useEffect(() => { loadData(); }, [loadData]);

  const fields = useMemo(() => getFields(section, { categories, inventory }, Boolean(modal?.item)), [section, categories, inventory, modal]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    if (!query) return items;
    return items.filter((item) => Object.values(item).some((value) => {
      const searchableValue = Array.isArray(value) ? value.map((entry) => entry?.name || '').join(' ') : String(value ?? '');
      return searchableValue.toLocaleLowerCase('vi').includes(query);
    }));
  }, [items, search]);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  useEffect(() => { setPageIndex(1); }, [section, search]);
  useEffect(() => { if (pageIndex > pageCount) setPageIndex(pageCount); }, [pageIndex, pageCount]);

  const startModal = (item = null) => {
    const formFields = getFields(section, { categories, inventory }, Boolean(item));
    setValues(initialValues(formFields, item));
    setModal({ item });
    setError('');
    setNotice('');
  };

  const saveForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (section === 'settings') {
        await api.put('/admin/settings', Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])));
      } else if (section === 'receipts') {
        await api.post('/admin/receipts', toPayload(section, values));
      } else {
        const { imageFile, ...formValues } = values;
        const payload = toPayload(section, formValues);
        if (section === 'products') {
          if (!modal.item && !imageFile && !values.imageUrl) {
            setError('Tải ảnh sản phẩm lên hoặc kéo ảnh vào khung trước khi lưu.');
            setSaving(false);
            return;
          }
          if (!modal.item && (!Array.isArray(values.colors) || !values.colors.length)) {
            setError('Thêm ít nhất một màu sắc cho sản phẩm.');
            setSaving(false);
            return;
          }
          if (imageFile) {
            const imageData = await readFileAsBase64(imageFile);
            const { data: uploaded } = await api.post('/admin/uploads/product-image', {
              mimeType: imageFile.type,
              data: imageData
            });
            payload.imageUrl = new URL(uploaded.url, api.defaults.baseURL || window.location.origin).toString();
          }
        }
        const path = `/admin/${page.endpoint}${modal.item ? `/${modal.item.id}` : ''}`;
        if (modal.item) await api.patch(path, payload);
        else await api.post(path, payload);
      }
      setModal(null);
      setNotice(section === 'settings' ? 'Đã lưu cài đặt cửa hàng.' : 'Đã lưu thay đổi.');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu thay đổi.');
    } finally {
      setSaving(false);
    }
  };

  const updateRow = async (path, payload, successMessage = 'Đã cập nhật trạng thái.') => {
    setError('');
    setNotice('');
    try {
      await api.patch(path, payload);
      setNotice(successMessage);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật dữ liệu.');
    }
  };

  const deleteRow = async (item) => {
    if (!window.confirm('Bạn có chắc muốn xóa nội dung này?')) return;
    try {
      await api.delete(`/admin/${page.endpoint}/${item.id}`);
      setNotice('Đã xóa nội dung.');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa nội dung.');
    }
  };

  if (!page) return <div className="container page empty">Không tìm thấy mục quản trị.</div>;

  const openForm = (item = null) => startModal(item);
  const action = page.create && section !== 'settings'
    ? <button className="admin-primary-button" type="button" onClick={() => openForm()}><Plus size={17}/> {section === 'receipts' ? 'Tạo phiếu nhập' : 'Tạo mới'}</button>
    : null;

  return (
    <AdminShell title={page.title} description={page.description} search={search} onSearch={setSearch} action={action}>
      {notice && <div className="admin-alert success">{notice}</div>}
      {error && <div className="admin-alert error">{error}</div>}
      {section === 'settings' ? (
        <form className="admin-card admin-settings-form" onSubmit={saveForm}>
          {[
            field('store_name', 'Tên cửa hàng', 'text', { defaultValue: 'Váy Xinh' }),
            field('support_email', 'Email hỗ trợ', 'email', { defaultValue: 'hello@aoxinh.vn' }),
            field('support_phone', 'Số điện thoại hỗ trợ', 'tel'),
            field('shipping_fee', 'Phí giao hàng (đ)', 'number', { min: 0, defaultValue: 30000 }),
            field('free_shipping_threshold', 'Miễn phí giao hàng từ (đ)', 'number', { min: 0, defaultValue: 500000 })
          ].map((entry) => <label className="admin-field" key={entry.name}><span>{entry.label}</span><input name={entry.name} type={entry.type} min={entry.min} value={values[entry.name] ?? settings[entry.name] ?? entry.defaultValue ?? ''} onChange={(event) => setValues((current) => ({ ...current, [entry.name]: event.target.value }))}/></label>)}
          <div className="admin-settings-note">Phí giao hàng và ngưỡng miễn phí vận chuyển được áp dụng cho các đơn hàng mới.</div>
          <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</button>
        </form>
      ) : (
        <section className="admin-card admin-list-card">
          <div className="admin-list-toolbar"><span>{loading ? 'Đang tải dữ liệu...' : `${filteredItems.length} mục`}</span><button type="button" onClick={loadData} title="Tải lại"><RefreshCw size={16}/> Làm mới</button></div>
          {loading ? <div className="admin-loading">Đang tải dữ liệu...</div> : filteredItems.length ? (
            <div className="admin-table-scroll"><table className="admin-table"><thead><tr>{tableColumns(section).map((column) => <th key={column.key}>{column.label}</th>)}<th>Thao tác</th></tr></thead><tbody>
              {pageItems.map((item) => <tr key={item.id ?? item.variant_id ?? item.code ?? item.order_code}>
                {tableColumns(section).map((column) => <td key={column.key}>{renderCell(section, column.key, item)}</td>)}
                <td key="actions"><RowActions section={section} item={item} onEdit={() => openForm(item)} onDelete={() => deleteRow(item)} onUpdate={updateRow}/></td>
              </tr>)}
            </tbody></table>
            {pageCount > 1 && <div className="admin-pagination"><span>Hiển thị {((pageIndex - 1) * pageSize) + 1}–{Math.min(pageIndex * pageSize, filteredItems.length)} / {filteredItems.length}</span><div><button type="button" disabled={pageIndex === 1} onClick={() => setPageIndex((current) => current - 1)}>Trước</button><b>{pageIndex} / {pageCount}</b><button type="button" disabled={pageIndex === pageCount} onClick={() => setPageIndex((current) => current + 1)}>Tiếp</button></div></div>}
            </div>
          ) : <div className="admin-empty"><Search size={20}/><p>{search ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu.'}</p></div>}
        </section>
      )}
      {modal && <FormModal section={section} item={modal.item} title={`${modal.item ? 'Chỉnh sửa' : 'Tạo'} ${page.title.toLocaleLowerCase('vi')}`} fields={fields} values={values} saving={saving} error={error} onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))} onClose={() => setModal(null)} onSubmit={saveForm}/>}
    </AdminShell>
  );
}

function tableColumns(section) {
  const columns = {
    categories: [['name', 'Tên danh mục'], ['slug', 'Đường dẫn'], ['is_active', 'Trạng thái']],
    products: [['image_url', 'Ảnh'], ['name', 'Tên sản phẩm'], ['code', 'Mã'], ['category_name', 'Danh mục'], ['colors', 'Màu sắc'], ['base_price', 'Giá'], ['total_stock', 'Tồn kho'], ['is_active', 'Trạng thái']],
    coupons: [['code', 'Mã'], ['discount_type', 'Loại'], ['discount_value', 'Giá trị'], ['min_order_value', 'Đơn tối thiểu'], ['used_count', 'Đã dùng'], ['end_at', 'Hạn dùng'], ['is_active', 'Trạng thái']],
    orders: [['order_code', 'Mã đơn'], ['customer_name', 'Khách hàng'], ['phone', 'Điện thoại'], ['total_amount', 'Tổng tiền'], ['payment_provider', 'Phương thức'], ['payment_status', 'Thanh toán'], ['status', 'Trạng thái'], ['created_at', 'Ngày tạo']],
    customers: [['full_name', 'Khách hàng'], ['email', 'Email'], ['phone', 'Điện thoại'], ['created_at', 'Ngày tham gia'], ['is_active', 'Tài khoản']],
    inventory: [['product_name', 'Sản phẩm'], ['code', 'Mã'], ['color_name', 'Màu'], ['size', 'Size'], ['stock', 'Tồn kho']],
    receipts: [['product_name', 'Sản phẩm'], ['color_name', 'Màu'], ['size', 'Size'], ['quantity', 'Số lượng'], ['supplier', 'Nhà cung cấp'], ['created_by_name', 'Người nhập'], ['created_at', 'Ngày nhập']],
    'flash-sales': [['title', 'Chương trình'], ['discount_type', 'Loại'], ['discount_value', 'Giá trị'], ['starts_at', 'Bắt đầu'], ['ends_at', 'Kết thúc'], ['is_active', 'Trạng thái']],
    warranty: [['order_code', 'Mã đơn'], ['customer_name', 'Khách hàng'], ['phone', 'Điện thoại'], ['reason', 'Lý do'], ['created_at', 'Ngày gửi'], ['status', 'Trạng thái']],
    reviews: [['product_name', 'Sản phẩm'], ['customer_name', 'Khách hàng'], ['rating', 'Điểm'], ['comment', 'Nội dung'], ['created_at', 'Ngày đánh giá'], ['is_hidden', 'Hiển thị']],
    banners: [['title', 'Tiêu đề'], ['image_url', 'Ảnh'], ['sort_order', 'Thứ tự'], ['is_active', 'Trạng thái']],
    blog: [['title', 'Tiêu đề'], ['slug', 'Slug'], ['status', 'Trạng thái'], ['updated_at', 'Cập nhật']],
    staff: [['full_name', 'Nhân viên'], ['email', 'Email'], ['phone', 'Điện thoại'], ['created_at', 'Ngày tạo'], ['is_active', 'Tài khoản']],
    support: [['name', 'Khách hàng'], ['email', 'Email'], ['phone', 'Điện thoại'], ['subject', 'Chủ đề'], ['message', 'Nội dung'], ['created_at', 'Ngày gửi'], ['status', 'Trạng thái']]
  };
  return (columns[section] || []).map(([key, label]) => ({ key, label }));
}

function renderCell(section, key, item) {
  if (['image_url'].includes(key) && item[key]) return <img className="admin-table-image" src={item[key]} alt="" loading="lazy"/>;
  if (key === 'colors') return <div className="admin-table-colors">{(item.colors || []).map((color) => <span className="admin-color-dot" key={`${color.name}-${color.hex}`} title={color.name}><i style={{ backgroundColor: color.hex }}/>{color.name}</span>)}</div>;
  if (key === 'payment_provider') {
    const providers = { COD: 'Thanh toán khi nhận hàng', BANK_TRANSFER: 'Chuyển khoản', VNPAY: 'VNPay', MOMO: 'MoMo' };
    return providers[item[key]] || item[key] || '—';
  }
  if (key === 'payment_status') {
    const labels = { PENDING: 'Chưa thanh toán', SUCCESS: 'Đã thanh toán', FAILED: 'Thất bại', REFUNDED: 'Đã hoàn tiền' };
    return <span className={`admin-status payment-${String(item[key] || 'PENDING').toLowerCase()}`}>{labels[item[key]] || item[key] || 'Chưa thanh toán'}</span>;
  }
  if (key === 'stock' || key === 'total_stock') {
    const stock = Math.max(0, Number(item[key]) || 0);
    if (stock === 0) return <span className="admin-stock-pill out">0 · Hết hàng</span>;
    if (stock <= 3) return <span className="admin-stock-pill low">{stock} · Sắp hết</span>;
    return stock;
  }
  if (key === 'base_price' || key === 'total_amount' || key === 'min_order_value') return formatMoney(item[key]);
  if (key === 'discount_value') return item.discount_type === 'PERCENT' ? `${item[key]}%` : formatMoney(item[key]);
  if (key === 'used_count') return `${item.used_count || 0} / ${item.max_usage || 0}`;
  if (key === 'is_active') return <span className={`admin-status ${item[key] ? 'status-enabled' : 'status-disabled'}`}>{item[key] ? 'Đang bật' : 'Đã tắt'}</span>;
  if (key === 'is_hidden') return <span className={`admin-status ${item[key] ? 'status-disabled' : 'status-enabled'}`}>{item[key] ? 'Đã ẩn' : 'Hiển thị'}</span>;
  if (key === 'status') {
    const labels = { ...Object.fromEntries(orderStatuses), CHO_XU_LY: 'Chờ xử lý', DA_DUYET: 'Đã duyệt', TU_CHOI: 'Từ chối', MO: 'Mới', DA_XU_LY: 'Đã xử lý', DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản' };
    return <span className="admin-status">{labels[item[key]] || item[key]}</span>;
  }
  if (['created_at', 'updated_at', 'start_at', 'end_at', 'starts_at', 'ends_at'].includes(key)) return dateText(item[key]);
  if (key === 'rating') return `${item[key]} / 5`;
  const value = item[key];
  if (section === 'support' && key === 'message') return <span className="admin-truncate" title={value}>{value || '—'}</span>;
  return value == null || value === '' ? '—' : value;
}

function RowActions({ section, item, onEdit, onDelete, onUpdate }) {
  const button = (label, action, className = '') => <button type="button" className={`admin-row-button ${className}`} onClick={action} title={label} aria-label={label}>{label === 'Xóa' ? <Trash2 size={15}/> : <Pencil size={15}/>}</button>;
  if (section === 'orders') {
    const paymentStatus = item.payment_status || 'PENDING';
    const paymentStatuses = [['PENDING', 'Chưa thanh toán'], ['SUCCESS', 'Đã thanh toán'], ['FAILED', 'Thất bại'], ['REFUNDED', 'Đã hoàn tiền']];
    return <div className="admin-order-actions">
      <select className="admin-status-select" aria-label="Cập nhật trạng thái đơn hàng" value={item.status} onChange={(event) => onUpdate(`/admin/orders/${item.id}/status`, { status: event.target.value }, 'Đã cập nhật trạng thái đơn hàng.')}><option value={item.status}>{Object.fromEntries(orderStatuses)[item.status] || item.status}</option>{orderStatuses.filter(([value]) => value !== item.status).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
      <select className="admin-status-select" aria-label="Cập nhật trạng thái thanh toán" value={paymentStatus} onChange={(event) => onUpdate(`/admin/orders/${item.id}/payment-status`, { status: event.target.value }, 'Đã cập nhật trạng thái thanh toán.')}>
        <option value={paymentStatus}>{paymentStatuses.find(([value]) => value === paymentStatus)?.[1] || paymentStatus}</option>
        {paymentStatuses.filter(([value]) => value !== paymentStatus && (value !== 'REFUNDED' || paymentStatus === 'SUCCESS')).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>
    </div>;
  }
  if (section === 'warranty') return <select className="admin-status-select" aria-label="Cập nhật yêu cầu bảo hành" value={item.status} onChange={(event) => onUpdate(`/admin/warranty/${item.id}/status`, { status: event.target.value }, 'Đã cập nhật yêu cầu bảo hành.')}><option value="CHO_XU_LY">Chờ xử lý</option><option value="DA_DUYET">Đã duyệt</option><option value="TU_CHOI">Từ chối</option></select>;
  if (section === 'support') return <select className="admin-status-select" aria-label="Cập nhật yêu cầu hỗ trợ" value={item.status} onChange={(event) => onUpdate(`/admin/support/${item.id}/status`, { status: event.target.value }, 'Đã cập nhật yêu cầu hỗ trợ.')}><option value="MO">Mới</option><option value="DA_XU_LY">Đã xử lý</option></select>;
  if (section === 'reviews') return <button type="button" className="admin-secondary-button" onClick={() => onUpdate(`/admin/reviews/${item.id}/visibility`, { isHidden: !item.is_hidden }, item.is_hidden ? 'Đã hiện đánh giá.' : 'Đã ẩn đánh giá.')}>{item.is_hidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}</button>;
  if (section === 'products') return <div className="admin-row-actions">{button('Chỉnh sửa', onEdit)}<button type="button" className="admin-secondary-button" onClick={() => onUpdate(`/admin/products/${item.id}/status`, { isActive: !item.is_active }, 'Đã cập nhật sản phẩm.')}>{item.is_active ? 'Ẩn' : 'Hiện'}</button></div>;
  if (section === 'customers' || section === 'staff') {
    const endpoint = section === 'staff' ? 'staff' : 'customers';
    return <button type="button" className="admin-secondary-button" onClick={() => onUpdate(`/admin/${endpoint}/${item.id}/status`, { isActive: !item.is_active }, 'Đã cập nhật tài khoản.')}>{item.is_active ? 'Khóa' : 'Mở khóa'}</button>;
  }
  if (section === 'blog' || section === 'banners') return <div className="admin-row-actions">{button('Chỉnh sửa', onEdit)}{button('Xóa', onDelete, 'danger')}</div>;
  if (['categories', 'coupons', 'inventory', 'flash-sales'].includes(section)) return button('Chỉnh sửa', onEdit);
  return <span>—</span>;
}

function FormModal({ section, item, title, fields, values, saving, error, onChange, onClose, onSubmit }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-modal" onSubmit={onSubmit}>
        <div className="admin-modal-heading"><div><h2>{title}</h2><p>Điền thông tin bên dưới để lưu thay đổi.</p></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Đóng"><X size={19}/></button></div>
        {error && <div className="admin-alert error admin-modal-error">{error}</div>}
        <div className="admin-modal-fields">{fields.map((entry) => (
          <label className={`admin-field${entry.type === 'checkbox' ? ' checkbox-field' : ''}`} key={entry.name}>
            {entry.type === 'checkbox' ? <>
              <input name={entry.name} type="checkbox" checked={Boolean(values[entry.name])} onChange={(event) => onChange(entry.name, event.target.checked)}/><span>{entry.label}</span>
            </> : <>
              <span>{entry.label}</span>
              {section === 'products' && entry.type === 'image' ? <ProductImageUpload value={values.imageUrl} file={values.imageFile} onFile={(file) => onChange('imageFile', file)} onClear={() => { onChange('imageUrl', ''); onChange('imageFile', null); }}/>
                : section === 'products' && entry.type === 'colors' ? <ProductColorEditor value={values[entry.name] || []} existingColors={entry.name === 'newColors' ? item?.colors || [] : []} onChange={(colors) => onChange(entry.name, colors)}/>
                : entry.type === 'textarea' ? <textarea name={entry.name} rows={entry.rows || 3} required={entry.required} value={values[entry.name] ?? ''} onChange={(event) => onChange(entry.name, event.target.value)}/>
                : entry.type === 'select' ? <select name={entry.name} required={entry.required} value={values[entry.name] ?? ''} onChange={(event) => onChange(entry.name, event.target.value)}><option value="">Chọn...</option>{entry.options?.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  : <input name={entry.name} type={entry.type} required={entry.required} pattern={entry.pattern} title={entry.title} min={entry.min} minLength={entry.minLength} value={values[entry.name] ?? ''} onChange={(event) => onChange(entry.name, event.target.value)}/>}
            </>}
          </label>
        ))}</div>
        <div className="admin-modal-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="admin-primary-button" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thông tin'}</button></div>
      </form>
    </div>
  );
}

function ProductColorEditor({ value, existingColors, onChange }) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#171717');
  const [error, setError] = useState('');
  const colors = [...existingColors, ...value];

  const addColor = () => {
    const colorName = name.trim();
    if (!colorName) {
      setError('Nhập tên màu trước khi thêm.');
      return;
    }
    if (colors.some((color) => color.name.toLocaleLowerCase('vi') === colorName.toLocaleLowerCase('vi'))) {
      setError('Màu này đã có trong danh sách.');
      return;
    }
    onChange([...value, { name: colorName, hex: hex.toUpperCase() }]);
    setName('');
    setError('');
  };

  return (
    <div className="admin-color-editor">
      {colors.length > 0 && <div className="admin-color-list">{colors.map((color, index) => <span className="admin-color-chip" key={`${color.name}-${color.hex}-${index}`}><i style={{ backgroundColor: color.hex }}/>{color.name}{index >= existingColors.length && <button type="button" aria-label={`Xóa màu ${color.name}`} onClick={() => onChange(value.filter((_, colorIndex) => colorIndex !== index - existingColors.length))}>×</button>}</span>)}</div>}
      <div className="admin-color-add"><input aria-label="Tên màu mới" placeholder="Tên màu" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addColor(); } }}/><input aria-label="Mã màu" type="color" value={hex} onChange={(event) => setHex(event.target.value)}/><button type="button" className="admin-secondary-button" onClick={addColor}>Thêm màu</button></div>
      {existingColors.length > 0 && <small className="admin-color-note">Màu hiện có được giữ lại; màu mới bắt đầu với tồn kho 0. Có thể cập nhật tồn kho trong mục Quản lý kho.</small>}
      {error && <span className="admin-image-error">{error}</span>}
    </div>
  );
}

function ProductImageUpload({ value, file, onFile, onClear }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || '');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview(value || '');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, value]);

  const acceptFile = (candidate) => {
    if (!candidate) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(candidate.type)) {
      setError('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 5 MB.');
      return;
    }
    setError('');
    onFile(candidate);
  };

  return (
    <div className="admin-image-upload">
      <div className={`admin-image-dropzone${dragging ? ' dragging' : ''}`} role="button" tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files?.[0]); }}>
        <input ref={inputRef} name="productImage" type="file" accept="image/jpeg,image/png,image/webp" hidden
          onChange={(event) => { acceptFile(event.target.files?.[0]); event.target.value = ''; }}/>
        {preview ? <img src={preview} alt="Xem trước ảnh sản phẩm"/> : <div className="admin-image-placeholder"><Plus size={20}/><b>Kéo thả ảnh vào đây</b><span>hoặc nhấn để chọn ảnh · JPG, PNG, WebP · tối đa 5 MB</span></div>}
      </div>
      {preview && <div className="admin-image-actions"><button className="admin-image-change" type="button" onClick={() => inputRef.current?.click()}>{file ? file.name : 'Chọn ảnh khác'}</button><button className="admin-image-remove" type="button" onClick={() => { onClear(); setError(''); if (inputRef.current) inputRef.current.value = ''; }}>Xóa ảnh</button></div>}
      {error && <span className="admin-image-error">{error}</span>}
    </div>
  );
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Không thể đọc nội dung ảnh.'));
        return;
      }
      resolve(reader.result.slice(reader.result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Không thể đọc nội dung ảnh.'));
    reader.readAsDataURL(file);
  });
}
