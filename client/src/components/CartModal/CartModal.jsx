import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import trashIcon from "../../assets/cartModal/trashIcon.png";
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
                // Generează o cheie unică bazată pe cartItemId și userID (dacă există)
                const cartItemId =
                  getCartItemId(item) || getProductId(item) || index;
                const uniqueKey = `cart-item-${cartItemId}`;

                return (
                  <li key={uniqueKey} className="cartItem">
                    <img
                      src={item.product?.image_url || "/default-image.jpg"}
                      alt={item.product?.name}
                    />
                    <div className="cartItemDetails">
                      <h5>{item.product?.name || "Produs fără nume"}</h5>
                      <p>{item.product?.price || 0} MDL</p>
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
              <button className="checkoutButton" disabled={!user}>
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
