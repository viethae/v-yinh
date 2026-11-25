import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const StoreContext = createContext();

const getSavedUser = () => JSON.parse(localStorage.getItem('ao_xinh_user') || 'null');
const scopedKey = (key, user) => `${key}_${user ? `user_${user.id}` : 'guest'}`;
const readScopedItems = (key, user) => JSON.parse(localStorage.getItem(scopedKey(key, user)) || '[]');

export function StoreProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);
  const [cart, setCart] = useState(() => readScopedItems('ao_xinh_cart', getSavedUser()));
  const [favorites, setFavorites] = useState(() => readScopedItems('ao_xinh_favorites', getSavedUser()));

  useEffect(() => {
    localStorage.removeItem('ao_xinh_cart');
    localStorage.removeItem('ao_xinh_favorites');
  }, []);
  useEffect(() => localStorage.setItem(scopedKey('ao_xinh_cart', user), JSON.stringify(cart)), [cart, user]);
  useEffect(() => localStorage.setItem(scopedKey('ao_xinh_favorites', user), JSON.stringify(favorites)), [favorites, user]);
  useEffect(() => user ? localStorage.setItem('ao_xinh_user', JSON.stringify(user)) : localStorage.removeItem('ao_xinh_user'), [user]);

  const addToCart = (item) => {
    setCart((current) => {
      const found = current.find((value) => value.variantId === item.variantId);
      return found
        ? current.map((value) => value.variantId === item.variantId ? { ...value, quantity: Math.min(value.quantity + item.quantity, value.stock) } : value)
        : [...current, item];
    });
  };
  const updateCart = (variantId, quantity) => setCart((current) => current.map((item) => item.variantId === variantId ? { ...item, quantity } : item));
  const updateCartStock = useCallback((variantId, stock) => setCart((current) => current.map((item) => {
    if (item.variantId !== variantId) return item;
    const availableStock = Math.max(0, Number(stock) || 0);
    return {
      ...item,
      stock: availableStock,
      quantity: availableStock > 0 ? Math.min(item.quantity, availableStock) : item.quantity
    };
  })), []);
  const removeCart = (variantId) => setCart((current) => current.filter((item) => item.variantId !== variantId));
  const toggleFavorite = (product) => setFavorites((current) =>
    current.some((item) => item.id === product.id) ? current.filter((item) => item.id !== product.id) : [...current, product]
  );
  const login = (data) => {
    localStorage.setItem('ao_xinh_token', data.token);
    setCart(readScopedItems('ao_xinh_cart', data.user));
    setFavorites(readScopedItems('ao_xinh_favorites', data.user));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.setItem(scopedKey('ao_xinh_cart', user), JSON.stringify(cart));
    localStorage.setItem(scopedKey('ao_xinh_favorites', user), JSON.stringify(favorites));
    localStorage.removeItem('ao_xinh_token');
    setCart(readScopedItems('ao_xinh_cart', null));
    setFavorites(readScopedItems('ao_xinh_favorites', null));
    setUser(null);
  };

  return (
    <StoreContext.Provider value={{ cart, favorites, user, addToCart, updateCart, updateCartStock, removeCart, clearCart: () => setCart([]), toggleFavorite, login, logout }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
