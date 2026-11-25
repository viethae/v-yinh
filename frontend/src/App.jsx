import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { Login, Register, ForgotPassword } from './pages/Auth';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import OrderSuccess from './pages/OrderSuccess';
import OrderDetail from './pages/OrderDetail';
import Admin from './pages/Admin';
import AdminCrud from './pages/AdminCrud';

export default function App(){
  return <BrowserRouter><Routes>
    <Route element={<Layout/>}>
      <Route path="/" element={<Home/>}/>
      <Route path="/products" element={<Products/>}/>
      <Route path="/category/:slug" element={<Category/>}/>
      <Route path="/search" element={<Products/>}/>
      <Route path="/product/:slug" element={<ProductDetail/>}/>
      <Route path="/cart" element={<Cart/>}/>
      <Route path="/checkout" element={<Checkout/>}/>
      <Route path="/order-success/:id" element={<OrderSuccess/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>
      <Route path="/account" element={<Account/>}/>
      <Route path="/account/orders" element={<Account/>}/>
      <Route path="/account/orders/:id" element={<OrderDetail/>}/>
      <Route path="/wishlist" element={<Wishlist/>}/>
      <Route path="/contact" element={<Contact/>}/>
    </Route>
    <Route path="/admin" element={<Admin/>}/>
    <Route path="/admin/:section" element={<AdminCrud/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter>;
}
