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
    return item.id || item.ID || item.cartItemId;
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
              console.error(
                `❌ Eroare la încărcarea detaliilor produsului ${item.productId}:`,
                error
              );
            }
          }

          return item;
        })
      );
      return itemsWithDetails;
    } catch (error) {
      console.error("❌ Eroare la încărcarea detaliilor produselor:", error);
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
        console.log("📦 Guest cart cookie raw:", cookieValue);

        const decodedValue = decodeURIComponent(cookieValue);
        console.log("📦 Guest cart cookie decoded:", decodedValue);

        const items = JSON.parse(decodedValue);
        console.log("📦 Parsed guest cart items:", items);

        // Încarcă detaliile produselor pentru guest items
        const itemsWithDetails = await loadProductDetails(items);
        return itemsWithDetails;
      }
    } catch (err) {
      console.error("❌ Eroare la parsarea guestCart cookie:", err);
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
        tempId: item.tempId,
      }));

      const cookieValue = encodeURIComponent(JSON.stringify(essentialItems));
      const cookieString = `guestCart=${cookieValue}; path=/; max-age=${
        30 * 24 * 60 * 60
      }; SameSite=Lax`;
      document.cookie = cookieString;
      console.log(
        "💾 Guest cart saved to cookie (essential data only):",
        essentialItems
      );
    } catch (err) {
      console.error("❌ Eroare la salvarea guestCart cookie:", err);
    }
  };

  // Încarcă coșul
  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      console.log("🔄 Loading cart, user:", user, "cartVersion:", cartVersion);

      if (!user) {
        // Guest - încarcă din cookie cu detaliile produselor
        const guestItems = await getGuestCartFromCookie();
        console.log("👤 Guest cart loaded with details:", guestItems);
        setCartItems(guestItems || []);
        setLoading(false);
        return;
      }

      // User logat - încarcă de pe server (deja are detaliile produselor)
      try {
        console.log("👤✅ User logged in, loading cart from server");
        const res = await fetch("http://localhost:8080/api/cart", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const serverItems = await res.json();
          console.log("🛒 Server cart loaded:", serverItems);
          setCartItems(serverItems || []);
        } else {
          console.error(
            "❌ Eroare la încărcarea coșului de pe server:",
            res.status
          );
          setCartItems([]);
        }
      } catch (err) {
        console.error("❌ Eroare rețea la încărcarea coșului:", err);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [user, cartVersion]);

  // Salvează automat coșul pentru guest (doar datele esențiale)
  useEffect(() => {
    if (!user) {
      console.log(
        "💾 Auto-saving guest cart to cookie (essential data):",
        cartItems
      );
      saveGuestCartToCookie(cartItems);
    }
  }, [cartItems, user]);

  // FORȚEAZĂ reîncărcarea coșului când user-ul se schimbă
  useEffect(() => {
    if (user) {
      console.log("👤✅ User changed, forcing cart reload");
      setCartVersion((prev) => prev + 1);
    }
  }, [user]);

  // Adaugare produs - cu încărcare detalii pentru guest
  const addItem = async (product, quantity = 1) => {
    if (!product || !quantity) return;

    console.log(
      "➕ Adding item:",
      product,
      "quantity:",
      quantity,
      "user:",
      user
    );

    if (!user) {
      // Guest - adaugă cu detaliile produsului
      const productId = product.id || product.ID;
      const newItems = [...cartItems];
      const existingIndex = newItems.findIndex(
        (item) => item.productId === productId
      );

      if (existingIndex !== -1) {
        newItems[existingIndex].quantity += quantity;
        console.log("👤 Updated existing item:", newItems[existingIndex]);
      } else {
        const newItem = {
          productId: productId,
          quantity: quantity,
          tempId: Date.now() + Math.random(),
          product: product, // Salvează detaliile produsului
        };
        newItems.push(newItem);
        console.log("👤 Added new item with product details:", newItem);
      }

      setCartItems(newItems);
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
        console.error("❌ Eroare la adăugarea produsului:", res.status);
        return;
      }

      const newItem = await res.json();
      console.log("👤✅ Item added to server:", newItem);

      setCartVersion((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Eroare rețea addItem:", err);
    }
  };

  // Ștergere produs
  const removeItem = async (id) => {
    console.log("🗑️ Removing item:", id, "user:", user);

    if (!user) {
      const newCartItems = cartItems.filter(
        (item) => item.tempId !== id && item.productId !== id
      );
      setCartItems(newCartItems);
      return;
    }

    try {
      await fetch(`http://localhost:8080/api/cart/item/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      console.log("👤✅ Item removed from server");
      setCartVersion((prev) => prev + 1);

      const newCartItems = cartItems.filter(
        (item) => getCartItemId(item) !== id
      );
      setCartItems(newCartItems);
    } catch (err) {
      console.error("❌ Eroare la ștergere server:", err);
    }
  };

  // Actualizare cantitate
  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) {
      await removeItem(id);
      return;
    }

    console.log("✏️ Updating quantity:", id, "to", quantity, "user:", user);

    if (!user) {
      const newCartItems = cartItems.map((item) =>
        item.tempId === id || item.productId === id
          ? { ...item, quantity }
          : item
      );
      setCartItems(newCartItems);
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
      console.log("👤✅ Quantity updated on server");
      setCartVersion((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Eroare la update server:", err);
    }
  };

  // Golire coș
  const clearCart = async () => {
    console.log("🧹 Clearing cart, user:", user);

    if (!user) {
      setCartItems([]);
      document.cookie = "guestCart=; path=/; max-age=0";
      console.log("👤 Guest cart cleared");
    } else {
      try {
        await fetch("http://localhost:8080/api/cart", {
          method: "DELETE",
          credentials: "include",
        });
        console.log("👤✅ Server cart cleared");
        setCartVersion((prev) => prev + 1);
      } catch (err) {
        console.error("❌ Eroare la golire server:", err);
      }
    }
  };

  // Subtotal calculat corect pentru ambele cazuri
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
