import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartVersion, setCartVersion] = useState(0);

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
    if (item.id !== undefined && item.id !== null) {
      return item.id.toString();
    }

    if (item.ID !== undefined && item.ID !== null) {
      return item.ID.toString();
    }

    if (item.tempId) return item.tempId;
    if (item.productId) return `guest-${item.productId}`;

    return `item-${Date.now()}`;
  }

  const loadProductDetails = async (items) => {
    try {
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          // Dacă item-ul are deja detaliile produsului, îl returnăm direct
          if (item.product && item.product.ID) {
            return item;
          }

          // Dacă avem doar productId, încărcăm detaliile de la server
          if (item.productId) {
            try {
              const response = await fetch(
                `http://localhost:8080/api/products/${item.productId}`
              );
              if (response.ok) {
                const productDetails = await response.json();
                return {
                  ...item,
                  product: productDetails,
                };
              }
            } catch (error) {
              console.error(`Error loading product ${item.productId}:`, error);
            }
          }

          return item;
        })
      );
      return itemsWithDetails;
    } catch (error) {
      console.error("Error loading product details:", error);
      return items;
    }
  };

  // Funcție pentru a obține guest cart din cookies
  const getGuestCartFromCookie = async () => {
    try {
      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("guestCart="))
        ?.split("=")[1];

      if (cookieValue) {
        const decodedValue = decodeURIComponent(cookieValue);
        const items = JSON.parse(decodedValue);
        // Încarcă detaliile produselor pentru guest items
        const itemsWithDetails = await loadProductDetails(items);
        return itemsWithDetails;
      }
    } catch (err) {
      console.error("Error parsing guestCart cookie:", err);
      document.cookie = "guestCart=; path=/; max-age=0";
    }
    return [];
  };

  // Funcție pentru a salva guest cart în cookies
  const saveGuestCartToCookie = (items) => {
    try {
      // Salvează doar datele esențiale (fără detaliile complete ale produsului)
      const essentialItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        tempId: item.tempId || `guest-${item.productId}`,
      }));

      const cookieValue = encodeURIComponent(JSON.stringify(essentialItems));
      const cookieString = `guestCart=${cookieValue}; path=/; max-age=${
        30 * 24 * 60 * 60
      }; SameSite=Lax`;
      document.cookie = cookieString;
    } catch (err) {
      console.error("❌ Eroare la salvarea guestCart cookie:", err);
    }
  };

  // Încarcă coșul
  useEffect(() => {
    async function loadCart() {
      setLoading(true);

      if (!user) {
        // Guest - încarcă din cookie cu detaliile produselor
        const guestItems = await getGuestCartFromCookie();
        setCartItems(guestItems || []);
        setLoading(false);
        return;
      }

      // User logat - încarcă de pe server (deja are detaliile produselor)
      try {
        const res = await fetch("http://localhost:8080/api/cart", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const serverItems = await res.json();
          console.log("🛒 Server cart loaded:", serverItems);

          const normalizedItems = serverItems.map((item) => {
            const consistentId = item.id || item.ID || `cart-${item.productId}`;
            return {
              ...item,
              id: consistentId,
              productId: item.productId || item.product?.id || item.product?.ID,
            };
          });

          setCartItems(normalizedItems || []);
        } else {
          console.error("Error loading cart from server:", res.status);
          setCartItems([]);
        }
      } catch (err) {
        console.error("Network error loading cart:", err);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [user, cartVersion]);

  // Salvează automat coșul pentru guest
  useEffect(() => {
    if (!user) {
      saveGuestCartToCookie(cartItems);
    }
  }, [cartItems, user]);

  // Reîncarcă coșul când user-ul se schimbă
  useEffect(() => {
    if (user) {
      setCartVersion((prev) => prev + 1);
    }
  }, [user]);

  // Adaugare produs - cu încărcare detalii pentru guest
  const addItem = async (product, quantity = 1) => {
    if (!product || !quantity) return;

    if (!user) {
      // Guest - adaugă cu detaliile produsului
      const productId = product.id || product.ID;
      const stableTempId = product.id || product.ID;

      setCartItems((prevItems) => {
        const newItems = [...prevItems];
        const existingIndex = newItems.findIndex(
          (item) => getCartItemId(item) === stableTempId
        );

        if (existingIndex !== -1) {
          const newItems = [...prevItems];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
          return newItems;
        } else {
          const newItem = {
            productId: productId,
            quantity: quantity,
            tempId: stableTempId,
            product: product,
            id: stableTempId,
          };
          return [...prevItems, newItem];
        }
      });
      return;
    }
    // User logat - salvează pe server
    try {
      const res = await fetch("http://localhost:8080/api/cart", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product?.ID || product?.id,
          quantity,
        }),
      });

      if (!res.ok) {
        console.error("Error adding product:", res.status);
        return;
      }

      setCartVersion((prev) => prev + 1);
    } catch (err) {
      console.error("Network error addItem:", err);
    }
  };

  // Ștergere produs
  const removeItem = async (id) => {
    if (!user) {
      // Guest: id poate fi tempId SAU productId
      const newCartItems = cartItems.filter(
        (item) => getCartItemId(item) !== id
      );
      setCartItems(newCartItems);
      return;
    }

    try {
      await fetch(`http://localhost:8080/api/cart/item/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setCartVersion((prev) => prev + 1);
    } catch (err) {
      console.error("Error deleting from server:", err);
    }
  };

  // Actualizare cantitate
  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) {
      await removeItem(id);
      return;
    }

    if (!user) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          getCartItemId(item) === id ? { ...item, quantity } : item
        )
      );
      return;
    }

    try {
      await fetch(`http://localhost:8080/api/cart/item/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });
      setCartVersion((prev) => prev + 1);
    } catch (err) {
      console.error("Error updating quantity on server:", err);
    }
  };

  // Golire coș
  const clearCart = async () => {
    if (!user) {
      setCartItems([]);
      document.cookie = "guestCart=; path=/; max-age=0";
    } else {
      try {
        await fetch("http://localhost:8080/api/cart", {
          method: "DELETE",
          credentials: "include",
        });
        setCartVersion((prev) => prev + 1);
      } catch (err) {
        console.error("Error clearing server cart:", err);
      }
    }
  };

  const cartSubtotal = cartItems.reduce((total, item) => {
    if (item.product && item.product.price) {
      return total + item.product.price * item.quantity;
    }
    return total;
  }, 0);

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
