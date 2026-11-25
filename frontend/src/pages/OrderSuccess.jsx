import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccess(){
  const {id}=useParams();
  return <div className="container success-page"><CheckCircle/><h1>Đặt hàng thành công</h1><p>Mã đơn hàng: <b>{id}</b></p><p>Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p><Link className="primary" to="/products">Tiếp tục mua sắm</Link></div>;
}
