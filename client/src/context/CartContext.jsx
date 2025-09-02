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

  // Efect pentru încărcarea coșului
  useEffect(() => {
    async function loadCart() {
      setLoading(true);

      if (token && user) {
        // Utilizator autentificat - încărcăm coșul de pe server
        try {
          const res = await fetch("http://localhost:8080/api/cart", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setCartItems(data);
          } else {
            console.error("Eroare la încărcarea coșului de pe server");
            // Încercăm să încărcăm din localStorage ca fallback
            loadFromLocalStorage();
          }
        } catch (err) {
          console.error("Eroare de rețea:", err);
          loadFromLocalStorage();
        }
      } else {
        // Utilizator neautentificat - încărcăm doar din localStorage
        loadFromLocalStorage();
      }

      setLoading(false);
    }

    function loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem("cart");
        if (saved) {
          setCartItems(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Eroare la parsarea coșului din localStorage:", error);
        setCartItems([]);
      }
    }

    loadCart();
  }, [token, user]);

  // Funcție pentru sincronizarea coșului cu backend-ul
  const syncCartWithBackend = async (items) => {
    if (!token) return;

    try {
      await fetch("http://localhost:8080/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error("Eroare la sincronizarea coșului:", err);
    }
  };

  // Adăugare produs
  const addItem = async (product, quantity = 1) => {
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
        console.error("Eroare la adăugarea produsului în coș:", res.status);
        return;
      }

      const newItem = await res.json();
      // console.log("New cart item from backend:", newItem);

      setCartItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            (item.product?.id || item.productId) ===
            (newItem.product?.id || newItem.productId)
        );

        if (existingIndex !== -1) {
          // produs deja în coș → actualizează cantitatea
          const updated = [...prev];
          updated[existingIndex].quantity += quantity;
          return updated;
        } else {
          // produs nou
          return [...prev, { ...newItem, quantity }];
        }
      });
    } catch (err) {
      console.error("Eroare de rețea în addItem:", err);
    }
  };

  // Ștergere produs
  const removeItem = async (id) => {
    const newCartItems = cartItems.filter((item) => item.id !== id); // Schimbă item.ID în item.id
    setCartItems(newCartItems);
    localStorage.setItem("cart", JSON.stringify(newCartItems));

    if (token) {
      try {
        await fetch(`http://localhost:8080/api/cart/item/${id}`, {
          // Folosește id
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Eroare la ștergerea din coșul de pe server:", err);
      }
    }
  };

  // Actualizare cantitate
  const updateQuantity = async (id, quantity) => {
    // Schimbă numele parametrului din ID în id
    if (quantity < 1) return;

    const newCartItems = cartItems.map(
      (item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item // Schimbă item.ID în item.id
    );

    setCartItems(newCartItems);
    localStorage.setItem("cart", JSON.stringify(newCartItems));

    if (token) {
      try {
        await fetch(`http://localhost:8080/api/cart/item/${id}`, {
          // Folosește id
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        });
      } catch (err) {
        console.error("Eroare la actualizarea cantității pe server:", err);
      }
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Eroare la golirea coșului de pe server:", err);
      }
    }
  };

  // Efect pentru migrarea coșului când utilizatorul se autentifică
  useEffect(() => {
    if (token && user && cartItems.length > 0) {
      // Migrăm coșul din localStorage către contul utilizatorului
      const migrateCartToAccount = async () => {
        try {
          await syncCartWithBackend(cartItems);
          console.log("Coș migrat cu succes către cont");
        } catch (err) {
          console.error("Eroare la migrarea coșului:", err);
        }
      };

      migrateCartToAccount();
    }
  }, [token, user]);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
