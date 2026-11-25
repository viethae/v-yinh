import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatPrice } from './ProductCard';
import SmartImage from './SmartImage';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('checking');
  const [mode, setMode] = useState('catalog');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Xin chào! Mình có thể tìm sản phẩm theo giá, chất liệu, màu và size còn hàng; đồng thời trả lời về giao hàng, thanh toán và thông tin cửa hàng.' }
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    api.get('/chat/status')
      .then(({ data }) => {
        setMode(data.mode || 'catalog');
        setStatus(data.available ? 'ready' : 'unavailable');
      })
      .catch(() => setStatus('unavailable'));
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || status !== 'ready') return;

    setDraft('');
    setSending(true);
    setMessages((current) => [...current, { role: 'user', text }]);
    try {
      const { data } = await api.post('/chat', { message: text });
      setMessages((current) => [...current, {
        role: 'assistant',
        text: data.reply,
        products: data.products || []
      }]);
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể kết nối chatbot. Vui lòng thử lại sau.';
      setMessages((current) => [...current, { role: 'assistant', text: message }]);
    } finally {
      setSending(false);
    }
  };

  const statusText = {
    checking: 'Đang kiểm tra kết nối AI…',
    ready: mode === 'ai' ? 'Stylist AI đã sẵn sàng' : 'Tư vấn cửa hàng đã sẵn sàng',
    unavailable: 'Không thể kết nối máy chủ chatbot'
  }[status];

  return (
    <div className="chat-widget">
      {open && <section className="chat-panel" role="dialog" aria-label="Tư vấn thời trang Váy Xinh">
        <header className="chat-header">
          <div className="chat-avatar">VX</div>
          <div><b>Stylist Váy Xinh</b><span>{statusText}</span></div>
          <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Đóng chatbot"><X size={20} /></button>
        </header>
        {status === 'ready' && mode === 'catalog' && <p className="chat-local-info" role="status">
          Mình trả lời theo danh mục sản phẩm và thông tin hiện có trên website.
        </p>}
        {status === 'unavailable' && <p className="chat-notice" role="alert">
          Máy chủ chatbot chưa kết nối được. Vui lòng kiểm tra backend.
        </p>}
        <div className="chat-messages" aria-live="polite">
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
            <p>{message.text}</p>
            {message.products?.length > 0 && <div className="chat-products">
              {message.products.map((product) => <Link className="chat-product" key={product.id} to={`/product/${product.slug}`} onClick={() => setOpen(false)}>
                <SmartImage src={product.image_url} alt={product.name} />
                <span><b>{product.name}</b><small>{formatPrice(product.price)}</small></span>
              </Link>)}
            </div>}
          </div>)}
          {sending && <p className="chat-typing">Stylist đang tìm sản phẩm phù hợp…</p>}
          <div ref={messagesEnd} />
        </div>
        <form className="chat-compose" onSubmit={send}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={status === 'ready' ? 'Hỏi về sản phẩm, giá, giao hàng...' : 'Chatbot chưa sẵn sàng'}
            maxLength={1000}
            disabled={status !== 'ready' || sending}
            aria-label="Nội dung cần tư vấn"
          />
          <button type="submit" disabled={status !== 'ready' || sending || !draft.trim()} aria-label="Gửi tin nhắn"><Send size={18} /></button>
        </form>
      </section>}
      <button type="button" className="chat-launcher" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Đóng tư vấn' : 'Mở tư vấn thời trang'}>
        {open ? <X size={23} /> : <MessageCircle size={23} />}
        {!open && <span>Tư vấn</span>}
      </button>
    </div>
  );
}
