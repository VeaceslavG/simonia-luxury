import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import trashIcon from "../../assets/cartModal/trashIcon.png";
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
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleCheckout() {
    if (!user) {
      navigate("/account");
      closeCart();
      return;
    }

    closeCart();
    navigate("/checkout", {
      state: { fromCart: true },
    });
  }

  if (!isCartOpen) return null;

  return (
    <div className="cartModalOverlay">
      <div className="cartModalContent">
        <button className="closeButton" onClick={closeCart}>
          ✖
        </button>
        <h2>Modelele mele selectate</h2>

        {cartItems.length === 0 ? (
          <p>Nu ai selectat încă niciun model</p>
        ) : (
          <>
            <ul className="cartList">
              {cartItems.map((item, index) => {
                // ✅ FOLOSEȘTE getCartItemId PENTRU TOATE OPERAȚIILE
                const itemId = getCartItemId(item);
                const uniqueKey = `cart-item-${itemId}-${index}`;

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
                            updateQuantity(itemId, item.quantity - 1)
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
                              itemId,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="quantityInput"
                        />

                        <button
                          className="quantityBtn"
                          onClick={() =>
                            updateQuantity(itemId, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <img
                      onClick={() => removeItem(itemId)}
                      className="removeButton"
                      src={trashIcon}
                      alt="Delete"
                    />
                  </li>
                );
              })}
            </ul>

            <div className="cartSummary">
              <p>Estimare totală: {cartSubtotal} MDL</p>
              <button className="checkoutButton" onClick={handleCheckout}>
                {user ? "Trimite cererea" : "Loghează-te pentru a finaliza"}
              </button>
              <button className="clearCartButton" onClick={clearCart}>
                Anulează selecția
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
