import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  // Salvare automată în localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Adăugare produs
  function addItem(product, quantity = 1) {
    if (!product || !product.id) {
      console.error("Produs invalid trimis în addItem:", product);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    setIsCartOpen(true);
  }

  // Ștergere produs
  function removeItem(id) {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }

  // Actualizare cantitate
  function updateQuantity(id, quantity) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }

  // Golire coș
  function clearCart() {
    setCartItems([]);
  }

  // Subtotal
  const cartSubtotal = cartItems.reduce(
    (total, item) => total + (item.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartSubtotal,
        openCart,
        closeCart,
        isCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
