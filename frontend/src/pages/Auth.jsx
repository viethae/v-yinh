import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { VIETNAMESE_MOBILE_PHONE_PATTERN, VIETNAMESE_MOBILE_PHONE_TITLE } from '../utils/phone';

export function Login() {
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const { login }=useStore(); const navigate=useNavigate();
  const submit=async(e)=>{e.preventDefault();setLoading(true);setError('');
    const form=new FormData(e.currentTarget);
    try{const {data}=await api.post('/auth/login',{email:form.get('email'),password:form.get('password')});login(data);navigate(data.user.role==='ADMIN'?'/admin':'/account');}catch(err){setError(err.response?.data?.message||'Đăng nhập thất bại');}finally{setLoading(false);}
  };
  return <AuthBox title="Đăng nhập"><form onSubmit={submit}><label>Email<input name="email" type="email" required/></label><label>Mật khẩu<input name="password" type="password" required/></label>{error&&<p className="error">{error}</p>}<button className="primary full" disabled={loading}>{loading?'Đang xử lý':'Đăng nhập'}</button></form><div className="auth-links"><Link to="/forgot-password">Quên mật khẩu?</Link><span>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></span></div></AuthBox>;
}
export function Register(){
  const [error,setError]=useState('');const [loading,setLoading]=useState(false);const {login}=useStore();const navigate=useNavigate();
  const submit=async(e)=>{e.preventDefault();setLoading(true);setError('');const form=new FormData(e.currentTarget);try{const {data}=await api.post('/auth/register',{fullName:form.get('fullName'),email:form.get('email'),phone:form.get('phone'),password:form.get('password')});login(data);navigate('/account');}catch(err){setError(err.response?.data?.message||'Không thể đăng ký');}finally{setLoading(false)}};
  return <AuthBox title="Tạo tài khoản"><form onSubmit={submit}><label>Họ và tên<input name="fullName" required/></label><label>Email<input name="email" type="email" required/></label><label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" pattern={VIETNAMESE_MOBILE_PHONE_PATTERN} title={VIETNAMESE_MOBILE_PHONE_TITLE}/></label><label>Mật khẩu<input name="password" type="password" minLength="6" required/></label>{error&&<p className="error">{error}</p>}<button className="primary full" disabled={loading}>Tạo tài khoản</button></form><div className="auth-links"><span>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></span></div></AuthBox>;
}
export function ForgotPassword(){
  const [sent,setSent]=useState(false);const submit=async(e)=>{e.preventDefault();const form=new FormData(e.currentTarget);await api.post('/auth/forgot-password',{email:form.get('email')});setSent(true)};
  return <AuthBox title="Quên mật khẩu">{sent?<p className="success">Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được chuẩn bị.</p>:<form onSubmit={submit}><label>Email<input name="email" type="email" required/></label><button className="primary full">Gửi yêu cầu</button></form>}<div className="auth-links"><Link to="/login">Quay lại đăng nhập</Link></div></AuthBox>;
}
function AuthBox({title,children}){return <div className="auth-page"><div className="auth-box"><h1>{title}</h1>{children}</div></div>}
