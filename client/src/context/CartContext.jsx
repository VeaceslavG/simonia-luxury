import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { token, user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  function getProductId(item) {
    return item.product?.id || item.product?.ID || item.productId;
  }

  function getCartItemId(item) {
    return item.id || item.ID;
  }

  // sincronizare cu backend
  // const syncCartWithBackend = async (items) => {
  //   if (!token || !items || items.length === 0) return;

  //   const payload = {
  //     items: items
  //       .map((i) => ({ productId: getProductId(i), quantity: i.quantity }))
  //       .filter((i) => i.productId && i.productId > 0),
  //   };

  //   try {
  //     await fetch("http://localhost:8080/api/cart/sync", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });
  //   } catch (err) {
  //     console.error("Eroare la sincronizarea coșului:", err);
  //   }
  // };

  useEffect(() => {
    async function loadCart() {
      setLoading(true);

      // Dacă nu e token → golim coșul
      if (!token) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Încarcă localStorage
      let localItems = [];
      try {
        const saved = localStorage.getItem("cart");
        if (saved) localItems = JSON.parse(saved);
      } catch (err) {
        console.error("Eroare parsare localStorage:", err);
      }

      try {
        // 1. Dacă există produse în localStorage, trimitem doar pe ele la backend
        if (localItems.length > 0) {
          for (const localItem of localItems) {
            await fetch("http://localhost:8080/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                productId: localItem.productId || localItem.product?.id,
                quantity: localItem.quantity,
              }),
            });
          }
          localStorage.removeItem("cart");
        }

        // 2. Preluăm coșul complet de pe server
        const res = await fetch("http://localhost:8080/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const serverItems = res.ok ? await res.json() : [];

        // 3. Setăm exact ce vine de la server
        setCartItems(serverItems);
      } catch (err) {
        console.error("Eroare la încărcarea coșului de pe server:", err);
        setCartItems(localItems);
      }

      setLoading(false);
    }

    loadCart();
  }, [token, user]);

  // Adaugare produs
  const addItem = async (product, quantity = 1) => {
    if (!product || !quantity) return;

    if (!token) {
      // vizitator
      const newItems = [...cartItems];
      const existingIndex = newItems.findIndex(
        (item) => getProductId(item) === (product.id || product.ID)
      );

      if (existingIndex !== -1) newItems[existingIndex].quantity += quantity;
      else
        newItems.push({
          product,
          productId: product.id || product.ID,
          quantity,
        });

      setCartItems(newItems);
      localStorage.setItem("cart", JSON.stringify(newItems));
      return;
    }

    // utilizator logat
    try {
      const res = await fetch("http://localhost:8080/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.ID || product.id,
          quantity,
        }),
      });

      if (!res.ok) {
        console.error("Eroare la adăugarea produsului:", res.status);
        return;
      }

      const newItem = await res.json();
      setCartItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            (item.product?.id || item.productId) ===
            (newItem.product?.id || newItem.productId)
        );

        if (existingIndex !== -1) {
          const updated = [...prev];
          // înlocuim cantitatea cu cea de la server, nu adăugăm din nou
          updated[existingIndex].quantity = newItem.quantity;
          return updated;
        } else {
          return [...prev, newItem]; // deja are quantity de la server
        }
      });
    } catch (err) {
      console.error("Eroare rețea addItem:", err);
    }
  };

  // Ștergere produs
  const removeItem = async (id) => {
    if (!token) {
      const newCartItems = cartItems.filter(
        (item) => getProductId(item) !== id
      );
      setCartItems(newCartItems);
      localStorage.setItem("cart", JSON.stringify(newCartItems));
      return;
    }

    const newCartItems = cartItems.filter((item) => getCartItemId(item) !== id);
    setCartItems(newCartItems);

    try {
      await fetch(`http://localhost:8080/api/cart/item/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Eroare la ștergere server:", err);
    }
  };

  // Actualizare cantitate
  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return;

    if (!token) {
      const newCartItems = cartItems.map((item) =>
        getProductId(item) === id ? { ...item, quantity } : item
      );
      setCartItems(newCartItems);
      localStorage.setItem("cart", JSON.stringify(newCartItems));
      return;
    }

    const newCartItems = cartItems.map((item) =>
      getCartItemId(item) === id ? { ...item, quantity } : item
    );
    setCartItems(newCartItems);

    try {
      await fetch(`http://localhost:8080/api/cart/item/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
    } catch (err) {
      console.error("Eroare la update server:", err);
    }
  };

  // Golire coș
  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem("cart");

    if (token) {
      try {
        await fetch("http://localhost:8080/api/cart", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Eroare la golire server:", err);
      }
    }
  };

  // Subtotal
  const cartSubtotal = cartItems.reduce(
    (total, item) =>
      total + (item.product?.price || item.price || 0) * item.quantity,
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
        loading,
        getProductId,
        getCartItemId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
