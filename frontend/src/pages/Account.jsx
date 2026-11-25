import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { VIETNAMESE_MOBILE_PHONE_PATTERN, VIETNAMESE_MOBILE_PHONE_TITLE } from '../utils/phone';

export default function Account(){
  const {user,logout}=useStore(); const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true); const [profile,setProfile]=useState({fullName:user?.fullName||'',phone:user?.phone||''}); const [addresses,setAddresses]=useState([]); const [message,setMessage]=useState(''); const [messageType,setMessageType]=useState('success'); const [addressFormOpen,setAddressFormOpen]=useState(false); const [addressSaving,setAddressSaving]=useState(false); const [addressError,setAddressError]=useState(''); const [editingAddressId,setEditingAddressId]=useState(null);
  useEffect(()=>{if(user){Promise.all([api.get('/orders'),api.get('/account/addresses')]).then(([o,a])=>{setOrders(o.data);setAddresses(a.data)}).finally(()=>setLoading(false));}else setLoading(false)},[user]);
  if(!user) return <div className="container page empty">Vui lòng <Link to="/login">đăng nhập</Link> để xem tài khoản.</div>;
  const editingAddress=addresses.find(item=>item.id===editingAddressId);
  const saveProfile=async(e)=>{e.preventDefault();try{await api.put('/auth/me',profile);setMessageType('success');setMessage('Đã cập nhật thông tin cá nhân')}catch(err){setMessageType('error');setMessage(err.response?.data?.message||'Không thể cập nhật')}};
  const changePassword=async(e)=>{e.preventDefault();const formElement=e.currentTarget;const form=new FormData(formElement);try{await api.put('/auth/password',{currentPassword:form.get('current'),newPassword:form.get('next')});setMessageType('success');setMessage('Đã đổi mật khẩu');formElement.reset()}catch(err){setMessageType('error');setMessage(err.response?.data?.message||'Không thể đổi mật khẩu')}};
  const saveAddress=async(e)=>{e.preventDefault();const formElement=e.currentTarget;const form=new FormData(formElement);const address={recipientName:form.get('recipientName').trim(),phone:form.get('phone').trim(),province:form.get('province').trim(),district:form.get('district').trim(),ward:form.get('ward').trim(),detailAddress:form.get('detailAddress').trim(),isDefault:form.get('isDefault')==='on'};setAddressSaving(true);setAddressError('');try{let id=editingAddressId;if(id){await api.put(`/account/addresses/${id}`,address)}else{const {data}=await api.post('/account/addresses',address);id=data.id}const saved={id,recipient_name:address.recipientName,phone:address.phone,province:address.province,district:address.district,ward:address.ward,detail_address:address.detailAddress,is_default:address.isDefault?1:0};setAddresses(current=>{const updated=current.map(item=>({...item,...(address.isDefault?{is_default:0}:{})})).filter(item=>item.id!==id);return address.isDefault?[saved,...updated]:[...updated,saved]});formElement.reset();setAddressFormOpen(false);setEditingAddressId(null);setMessageType('success');setMessage(editingAddressId?'Đã cập nhật địa chỉ giao hàng':'Đã thêm địa chỉ giao hàng')}catch(err){setAddressError(err.response?.data?.message||'Không thể lưu địa chỉ')}finally{setAddressSaving(false)}};
  const cancelOrder=async(id)=>{try{await api.patch(`/orders/${id}/cancel`);setOrders(current=>current.map(o=>o.id===id?{...o,status:'DA_HUY'}:o));setMessageType('success');setMessage('Đã hủy đơn hàng')}catch(err){setMessageType('error');setMessage(err.response?.data?.message||'Không thể hủy đơn')}};
  return <div className="container page account-page">
    <aside className="account-sidebar">
      <div className="account-identity">
        <div className="account-avatar" aria-hidden="true">{(user.fullName||user.email).charAt(0).toUpperCase()}</div>
        <div><span>Xin chào,</span><strong>{user.fullName||'Khách hàng'}</strong></div>
        <p>{user.email}</p>
      </div>
      <nav className="account-nav" aria-label="Điều hướng tài khoản">
        <a href="#profile">Thông tin cá nhân</a>
        <a href="#orders">Đơn hàng của tôi</a>
        <Link to="/wishlist">Sản phẩm yêu thích</Link>
      </nav>
      <button className="account-logout" onClick={logout}>Đăng xuất</button>
    </aside>
    <main className="account-main">
      <header className="account-heading">
        <p>TÀI KHOẢN CỦA TÔI</p>
        <h1>Xin chào, {user.fullName||'bạn'}!</h1>
        <span>Quản lý thông tin và theo dõi các đơn hàng của bạn.</span>
      </header>
      {message&&<p className={`account-feedback ${messageType}`} role="status">{message}</p>}
      <section className="account-card" id="profile">
        <div className="account-card-heading"><h2>Thông tin cá nhân</h2><p>Cập nhật thông tin liên hệ của bạn.</p></div>
        <form className="account-form" onSubmit={saveProfile}>
          <label>Họ và tên<input autoComplete="name" value={profile.fullName} onChange={e=>setProfile({...profile,fullName:e.target.value})} required/></label>
          <label>Số điện thoại<input autoComplete="tel" type="tel" pattern={VIETNAMESE_MOBILE_PHONE_PATTERN} title={VIETNAMESE_MOBILE_PHONE_TITLE} value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label>
          <button className="primary">Lưu thay đổi</button>
        </form>
      </section>
      <section className="account-card">
        <div className="account-card-heading"><h2>Bảo mật</h2><p>Đổi mật khẩu để giữ tài khoản an toàn.</p></div>
        <form className="account-form" onSubmit={changePassword}>
          <label>Mật khẩu hiện tại<input autoComplete="current-password" name="current" type="password" required/></label>
          <label>Mật khẩu mới<input autoComplete="new-password" name="next" type="password" minLength="6" required/></label>
          <button className="primary">Đổi mật khẩu</button>
        </form>
      </section>
      <section className="account-card">
        <div className="account-card-heading account-address-heading"><div><h2>Địa chỉ giao hàng</h2><p>Địa chỉ đã lưu cho các đơn hàng của bạn.</p></div><button className="account-secondary" type="button" onClick={()=>{if(addressFormOpen){setAddressFormOpen(false);setEditingAddressId(null)}else{setAddressFormOpen(true);setEditingAddressId(null)}setAddressError('')}}>{addressFormOpen?'Đóng':'＋ Thêm địa chỉ'}</button></div>
        {addressFormOpen&&<form key={editingAddressId||'new-address'} className="account-form address-form" onSubmit={saveAddress}>
          <div className="address-form-heading"><h3>{editingAddressId?'Chỉnh sửa địa chỉ':'Thêm địa chỉ mới'}</h3></div>
          <label>Người nhận<input name="recipientName" autoComplete="name" defaultValue={editingAddress?.recipient_name||''} required/></label>
          <label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" pattern={VIETNAMESE_MOBILE_PHONE_PATTERN} title={VIETNAMESE_MOBILE_PHONE_TITLE} defaultValue={editingAddress?.phone||''} required/></label>
          <label>Tỉnh/Thành phố<input name="province" autoComplete="address-level1" defaultValue={editingAddress?.province||''} required/></label>
          <label>Quận/Huyện<input name="district" autoComplete="address-level2" defaultValue={editingAddress?.district||''} required/></label>
          <label>Phường/Xã<input name="ward" defaultValue={editingAddress?.ward||''} required/></label>
          <label className="address-detail-field">Địa chỉ chi tiết<input name="detailAddress" autoComplete="street-address" defaultValue={editingAddress?.detail_address||''} required/></label>
          <label className="account-checkbox"><input type="checkbox" name="isDefault" defaultChecked={editingAddressId?Number(editingAddress?.is_default)===1:!addresses.length}/>Đặt làm địa chỉ mặc định</label>
          {addressError&&<p className="account-feedback error">{addressError}</p>}
          <div className="account-form-actions"><button className="primary" disabled={addressSaving}>{addressSaving?'Đang lưu...':editingAddressId?'Lưu thay đổi':'Lưu địa chỉ'}</button><button className="account-secondary" type="button" onClick={()=>{setAddressFormOpen(false);setEditingAddressId(null);setAddressError('')}}>Hủy</button></div>
        </form>}
        {addresses.length?<div className="account-addresses">{addresses.map(a=><article className="account-address" key={a.id}><div><strong>{a.recipient_name}</strong>{Boolean(a.is_default)&&<span className="account-default-badge">Mặc định</span>}</div><span>{a.phone}</span><p>{a.detail_address}, {a.ward}, {a.district}, {a.province}</p><button className="account-address-edit" type="button" onClick={()=>{setEditingAddressId(a.id);setAddressFormOpen(true);setAddressError('')}}>Chỉnh sửa</button></article>)}</div>:!addressFormOpen&&<p className="account-muted">Bạn chưa lưu địa chỉ giao hàng nào.</p>}
      </section>
      <section className="account-card" id="orders">
        <div className="account-card-heading"><h2>Đơn hàng của tôi</h2><p>Xem trạng thái và thông tin các đơn gần đây.</p></div>
        {loading?<p className="account-muted">Đang tải đơn hàng...</p>:orders.length?<div className="account-orders">{orders.map(o=><div className="order-row" key={o.id}><div><b>{o.order_code}</b><small>{new Date(o.created_at).toLocaleDateString('vi-VN')}</small></div><span className="order-status">{o.status.replaceAll('_',' ')}</span><b>{new Intl.NumberFormat('vi-VN').format(o.total_amount)}đ</b><div className="account-order-actions"><Link className="account-order-link" to={`/account/orders/${o.id}`}>Xem chi tiết</Link>{['CHO_XAC_NHAN','DA_XAC_NHAN'].includes(o.status)&&<button onClick={()=>cancelOrder(o.id)}>Hủy đơn</button>}</div></div>)}</div>:<p className="account-muted">Bạn chưa có đơn hàng nào.</p>}
      </section>
    </main>
  </div>;
}
