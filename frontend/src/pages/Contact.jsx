import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { VIETNAMESE_MOBILE_PHONE_PATTERN, VIETNAMESE_MOBILE_PHONE_TITLE } from '../utils/phone';

export default function Contact(){
  const [sent,setSent]=useState(false);
  const [error,setError]=useState('');
  const [settings,setSettings]=useState(null);
  useEffect(()=>{
    let active=true;
    api.get('/storefront/settings').then(({data})=>{if(active)setSettings(data);}).catch((requestError)=>{
      console.error('Không thể tải thông tin liên hệ cửa hàng:',requestError);
    });
    return ()=>{active=false;};
  },[]);
  const submit=async(e)=>{e.preventDefault();setError('');
    const form=new FormData(e.currentTarget);
    try{await api.post('/support',{name:form.get('name'),email:form.get('email'),phone:form.get('phone'),subject:'Yêu cầu hỗ trợ từ website',message:form.get('message')});setSent(true);e.currentTarget.reset();}
    catch(err){setError(err.response?.data?.message||'Không thể gửi yêu cầu');}
  };
  return <div className="container page contact-page"><div><h1>Liên hệ {settings?.store_name || 'ÁO XINH'}</h1><p>Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p><p><b>Hotline:</b> {settings?.support_phone || '1900 6868'}</p><p><b>Email:</b> {settings?.support_email || 'hello@aoxinh.vn'}</p><p><b>Giờ làm việc:</b> 8:30 - 21:00</p></div><form onSubmit={submit}><h2>Gửi yêu cầu hỗ trợ</h2>{sent&&<p className="success">Cảm ơn bạn! Yêu cầu đã được gửi.</p>}{error&&<p className="error">{error}</p>}<label>Họ và tên<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" pattern={VIETNAMESE_MOBILE_PHONE_PATTERN} title={VIETNAMESE_MOBILE_PHONE_TITLE}/></label><label>Nội dung<textarea name="message" required rows="5"/></label><button className="primary">Gửi liên hệ</button></form></div>;
}
