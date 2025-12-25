import { createContext, useContext, useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);
  const [cartVersion, setCartVersion] = useState(0);
  const [migratingCart, setMigratingCart] = useState(false);

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
    if (item.id != null) return item.id.toString();
    if (item.ID != null) return item.ID.toString();
    if (item.tempId) return item.tempId;
    if (item.productId) return `guest-${item.productId}`;
    return null;
  }

  const loadProductDetails = async (items) => {
    try {
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          // Dacă item-ul are deja detaliile produsului, îl returnăm direct
          if (item.product && (item.product.ID || item.product.id)) {
            return item;
          }

          // Dacă avem doar productId, încărcăm detaliile de la server
          if (item.productId) {
            try {
              const response = await fetch(
                `${API_URL}/api/products/${item.productId}`
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
      document.cookie =
        "guestCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    return [];
  };

  const migrateGuestCartToServer = async () => {
    if (migratingCart || !user) return;

    setMigratingCart(true);
    const successfulMigrations = [];

    try {
      const guestItems = await getGuestCartFromCookie();

      if (!guestItems || guestItems.length === 0) {
        setMigratingCart(false);
        return;
      }

      console.log("🔄 Migrating guest cart:", guestItems);

      // Migrează fiecare item cu gestionare de erori individuală
      for (const item of guestItems) {
        try {
          const res = await fetch(`${API_URL}/api/cart`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: item.productId,
              quantity: item.quantity,
            }),
          });

          if (res.ok) {
            successfulMigrations.push(item);
          } else {
            console.error(
              `Failed to migrate item ${item.productId}:`,
              res.status
            );
          }
        } catch (error) {
          console.error(`Error migrating item ${item.productId}:`, error);
        }
      }

      // Șterge cookie DOAR dacă toate migrările au reușit
      if (successfulMigrations.length === guestItems.length) {
        document.cookie =
          "guestCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setCartItems([]);
      } else {
        console.warn(
          "Some items could not be migrated, keeping guest cart cookie"
        );
        // Păstrează în cookie doar item-ele care nu au fost migrate
        const failedItems = guestItems.filter(
          (item) =>
            !successfulMigrations.some(
              (migrated) => migrated.productId === item.productId
            )
        );
        if (failedItems.length > 0) {
          saveGuestCartToCookie(failedItems);
        }
      }
    } catch (err) {
      console.error("❌ Error migrating guest cart:", err);
    } finally {
      setMigratingCart(false);
    }
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
      console.error("Eroare la salvarea guestCart cookie:", err);
    }
  };

  // Încarcă coșul
  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      if (!isMounted) return;

      setLoading(true);

      if (!user) {
        // Guest - încarcă din cookie cu detaliile produselor
        const guestItems = await getGuestCartFromCookie();
        if (isMounted) {
          setCartItems(guestItems || []);
          setLoading(false);
        }
        return;
      }

      // User logat - încarcă de pe server
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
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

          if (isMounted) {
            setCartItems(normalizedItems || []);
          }
        } else {
          console.error("Error loading cart from server:", res.status);
          if (isMounted) {
            setCartItems([]);
          }
        }
      } catch (err) {
        console.error("Network error loading cart:", err);
        if (isMounted) {
          setCartItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (migratingCart) return;

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [user, cartVersion, migratingCart]);

  // Salvează automat coșul pentru guest
  useEffect(() => {
    if (!user && !migratingCart) {
      saveGuestCartToCookie(cartItems);
    }
  }, [cartItems, user, migratingCart]);

  // Reîncarcă coșul când user-ul se schimbă
  useEffect(() => {
    if (!user) return;

    (async () => {
      await migrateGuestCartToServer();
      setCartVersion((prev) => prev + 1);
    })();
  }, [user]);

  // Adaugare produs
  const addItem = async (product, quantity = 1) => {
    if (!product || !quantity || quantity < 1) return;

    const productId = product.id || product.ID;
    if (!productId) {
      console.error("Product ID is missing");
      return;
    }

    if (!user) {
      setCartItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => item.productId === productId
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
            tempId: `guest-${productId}`,
            product: product,
            id: `guest-${productId}`,
          };
          return [...prevItems, newItem];
        }
      });
      return;
    }

    // User logat - salvează pe server
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
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
      const newCartItems = cartItems.filter(
        (item) => getCartItemId(item) !== id
      );
      setCartItems(newCartItems);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/cart/item/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setCartVersion((prev) => prev + 1);
      }
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
      await fetch(`${API_URL}/api/cart/item/${id}`, {
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
      document.cookie =
        "guestCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } else {
      try {
        await fetch(`${API_URL}/api/cart`, {
          method: "DELETE",
          credentials: "include",
        });
        setCartVersion((prev) => prev + 1);
      } catch (err) {
        console.error("Error clearing server cart:", err);
      }
    }
  };

  const cartSubtotalCents = cartItems.reduce((total, item) => {
    if (!item.product) return total;

    const priceCents =
      typeof item.product.price_cents === "number"
        ? item.product.price_cents
        : typeof item.product.price === "number"
        ? Math.round(item.product.price * 100)
        : 0;

    return total + priceCents * item.quantity;
  }, 0);

  const cartSubtotal = cartSubtotalCents / 100;

  const value = {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    cartSubtotal,
    openCart,
    closeCart,
    isCartOpen,
    loading: loading || migratingCart,
    getProductId,
    getCartItemId,
    migratingCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
