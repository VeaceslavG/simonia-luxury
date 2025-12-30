import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { API_URL } from "../config/api";

const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartInitializing, setCartInitializing] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);
  const [migratingCart, setMigratingCart] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // helpers

  const getProductId = (item) =>
    item.product?.id || item.product?.ID || item.productId;

  const getCartItemId = (item) => {
    if (user) {
      if (item.id && item.id.toString().startsWith("guest-")) {
        return item.id.toString();
      }
      return `server-${item.id || item.ID}`;
    }

    if (item.productId) return `guest-${item.productId}`;
    if (item.tempId) return item.tempId;

    return null;
  };

  // guest cart

  const loadProductDetails = useCallback(async (items) => {
    try {
      return await Promise.all(
        items.map(async (item) => {
          if (item.product?.id || item.product?.ID) return item;

          if (item.productId) {
            const res = await fetch(
              `${API_URL}/api/products/${item.productId}`
            );
            if (res.ok) {
              return { ...item, product: await res.json() };
            }
          }
          return item;
        })
      );
    } catch {
      return items;
    }
  }, []);

  const getGuestCartFromCookie = useCallback(async () => {
    try {
      const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith("guestCart="))
        ?.split("=")[1];

      if (!raw) return [];
      return await loadProductDetails(JSON.parse(decodeURIComponent(raw)));
    } catch {
      document.cookie = "guestCart=; path=/; max-age=0";
      return [];
    }
  }, [loadProductDetails]);

  const saveGuestCartToCookie = useCallback((items) => {
    const minimal = items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      tempId: i.tempId || `guest-${i.productId}`,
    }));

    document.cookie = `guestCart=${encodeURIComponent(
      JSON.stringify(minimal)
    )}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  }, []);

  // load cart

  const loadCart = useCallback(async () => {
    if (!user) {
      const guestItems = await getGuestCartFromCookie();
      setCartItems(guestItems);
      return;
    }

    setCartInitializing(true);
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error();
      const items = await res.json();

      setCartItems(
        items.map((i) => ({
          ...i,
          id: i.id || i.ID,
          productId: i.productId || i.product?.id || i.product?.ID,
        }))
      );
    } catch {
      setCartItems([]);
    } finally {
      setCartInitializing(false);
    }
  }, [user, getGuestCartFromCookie]);

  // migration

  const migrateGuestCartToServer = useCallback(async () => {
    if (!user || migratingCart) return;

    setMigratingCart(true);
    const guestItems = await getGuestCartFromCookie();

    for (const item of guestItems) {
      await fetch(`${API_URL}/api/cart`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
        }),
      });
    }

    document.cookie = "guestCart=; path=/; max-age=0";
    setMigratingCart(false);
  }, [user, migratingCart, getGuestCartFromCookie]);

  // effects

  useEffect(() => {
    if (!initialized) return;
    loadCart();
  }, [loadCart, cartVersion, initialized]);

  useEffect(() => {
    if (!user) return;
    migrateGuestCartToServer().then(() => setCartVersion((v) => v + 1));
  }, [user, migrateGuestCartToServer]);

  useEffect(() => {
    if (!user && !migratingCart) {
      saveGuestCartToCookie(cartItems);
    }
  }, [cartItems, user, migratingCart, saveGuestCartToCookie]);

  // ui actions

  const openCart = () => {
    setIsCartOpen(true);
    if (!initialized) {
      setInitialized(true);
      loadCart();
    }
  };

  const closeCart = () => setIsCartOpen(false);

  // cart actions

  const addItem = async (product, quantity = 1) => {
    const productId = product?.id || product?.ID;
    if (!productId) return;

    if (!user) {
      setCartItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === productId);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
          return copy;
        }
        return [
          ...prev,
          {
            productId,
            quantity,
            product,
            tempId: `guest-${productId}`,
            id: `guest-${productId}`,
          },
        ];
      });
      return;
    }

    await fetch(`${API_URL}/api/cart`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });

    setCartVersion((v) => v + 1);
  };

  const removeItem = async (id) => {
    setCartItems((items) => items.filter((i) => getCartItemId(i) !== id));

    if (!user) return;

    const realId = id.replace("server-", "");

    try {
      await fetch(`${API_URL}/api/cart/item/${realId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      setCartVersion((v) => v + 1);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return removeItem(id);

    setCartItems((items) =>
      items.map((i) => (getCartItemId(i) === id ? { ...i, quantity } : i))
    );

    if (!user) return;

    const realId = id.replace("server-", "");

    try {
      await fetch(`${API_URL}/api/cart/item/${realId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
    } catch {
      setCartVersion((v) => v + 1);
    }
  };

  const clearCart = async () => {
    if (!user) {
      setCartItems([]);
      document.cookie = "guestCart=; path=/; max-age=0";
      return;
    }

    await fetch(`${API_URL}/api/cart`, {
      method: "DELETE",
      credentials: "include",
    });

    setCartVersion((v) => v + 1);
  };

  // total

  const cartSubtotal =
    cartItems.reduce((sum, i) => {
      const price =
        i.product?.price_cents ?? Math.round((i.product?.price || 0) * 100);
      return sum + price * i.quantity;
    }, 0) / 100;

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
        loading: cartInitializing || migratingCart,
        getProductId,
        getCartItemId,
        migratingCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
