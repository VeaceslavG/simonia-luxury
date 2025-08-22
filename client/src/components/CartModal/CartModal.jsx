import { useCart } from "../../context/CartContext";
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
  } = useCart();

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
              {cartItems.map((item) => (
                <li key={item.id} className="cartItem">
                  <img src={item.image_url} alt={item.name} />
                  <div className="cartItemDetails">
                    <h5>{item.name}</h5>
                    <p>{item.price} MDL</p>
                    <div className="quantityContainer">
                      <button
                        className="quantityBtn"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
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
                            item.id,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="quantityInput"
                      />

                      <button
                        className="quantityBtn"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <img
                    onClick={() => removeItem(item.id)}
                    className="removeButton"
                    src={trashIcon}
                    alt="Delete"
                  />
                </li>
              ))}
            </ul>

            <div className="cartSummary">
              <p>Total: {cartSubtotal} MDL</p>
              <button className="checkoutButton">Finalizează comanda</button>
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
