import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import trashIcon from "../../assets/cartModal/trashIcon.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./cartModal.scss";

export default function CartModal() {
  const {
    cartItems,
    removeItem,
    updateQuantity,
    cartSubtotal,
    clearCart,
    isCartOpen,
    closeCart,
    getCartItemId,
    getProductId,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleCheckout() {
    if (!user) {
      navigate("/account");
      closeCart();
      return;
    }

    console.log("Checkout data:", {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
    });

    fetch("http://localhost:8080/api/orders", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: user.name || "Client logat",
        email: user.email,
        phone: user.phone || "",
        notes: "",
        items: cartItems.map((item) => ({
          productId: item.product?.ID || item.product?.id || item.productId,
          quantity: item.quantity,
        })),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(() => {
        clearCart();
        toast.success("Comanda a fost trimisă!");
      })
      .catch((err) => {
        toast.error("Eroare la trimiterea comenzii: " + err.message);
      });
  }

  if (!isCartOpen) return null;

  return (
    <div className="cartModalOverlay">
      <div className="cartModalContent">
        <button className="closeButton" onClick={closeCart}>
          ✖
        </button>
        <h2>Coșul tău</h2>

        {cartItems.length === 0 ? (
          <p>Coșul este gol.</p>
        ) : (
          <>
            <ul className="cartList">
              {cartItems.map((item, index) => {
                const cartItemId =
                  getCartItemId(item) ||
                  getProductId(item) ||
                  item.tempId ||
                  index;
                const uniqueKey = `cart-item-${cartItemId}`;

                // Fallback pentru imagine și nume
                const productImage =
                  item.product?.image_url || "/default-image.jpg";
                const productName =
                  item.product?.name || `Produs #${item.productId}`;
                const productPrice = item.product?.price || 0;

                return (
                  <li key={uniqueKey} className="cartItem">
                    <img
                      src={productImage}
                      alt={productName}
                      onError={(e) => {
                        e.target.src = "/default-image.jpg";
                      }}
                    />
                    <div className="cartItemDetails">
                      <h5>{productName}</h5>
                      <p>{productPrice} MDL</p>
                      <div className="quantityContainer">
                        <button
                          className="quantityBtn"
                          onClick={() =>
                            updateQuantity(cartItemId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              cartItemId,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="quantityInput"
                        />

                        <button
                          className="quantityBtn"
                          onClick={() =>
                            updateQuantity(cartItemId, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <img
                      onClick={() => removeItem(cartItemId)}
                      className="removeButton"
                      src={trashIcon}
                      alt="Delete"
                    />
                  </li>
                );
              })}
            </ul>

            <div className="cartSummary">
              <p>Total: {cartSubtotal} MDL</p>
              <button className="checkoutButton" onClick={handleCheckout}>
                {user ? "Finalizează comanda" : "Loghează-te pentru a finaliza"}
              </button>
              <button className="clearCartButton" onClick={clearCart}>
                Golește coșul
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
